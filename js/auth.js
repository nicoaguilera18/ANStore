document.addEventListener('DOMContentLoaded', () => {

  const formAuth = document.getElementById('form-auth');
  const emailInput = document.getElementById('email');
  const claveInput = document.getElementById('clave');
  const repetirClaveInput = document.getElementById('repetir-clave');
  const feedback = document.getElementById('mensaje-feedback');


  const vistaVisitante = document.getElementById('vista-visitante');
  const vistaAutenticado = document.getElementById('vista-autenticado');
  const userNombre = document.getElementById('user-nombre');
  const btnLogout = document.getElementById('btn-logout');

  
  formAuth.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const clave = claveInput.value;
    const repetirClave = repetirClaveInput.value;

//validación de la contraseña teniendo en cuenta que debe tener al menos 6 caracteres y que ambas contraseñas deben ser iguales 
    if (clave.length < 6) {
      mostrarFeedback('La contraseña debe tener al menos 6 caracteres.', 'error');
      claveInput.focus();
      return;
    }

  
    if (clave !== repetirClave) {
      mostrarFeedback('Las contraseñas no coinciden. Verifícalas.', 'error');
      repetirClaveInput.focus();
      return;
    }

  
    mostrarFeedback('Verificando credenciales en el servidor...', 'cargando');

    try {
      const respuesta = await fetch('./data/usuarios.json');

      if (!respuesta.ok) {
        throw new Error(`Error en el servidor: código ${respuesta.status}`);
      }

      const usuarios = await respuesta.json();

      // Busca de coincidencia de credenciales
      const usuarioEncontrado = usuarios.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === clave
      );

      if (usuarioEncontrado) {
        mostrarFeedback('Credenciales válidas. Ingresando...', 'exito');
        transicionarAVistaAutenticado(usuarioEncontrado.nombre);
      } else {
        mostrarFeedback('Correo o contraseña incorrectos. Revisa los datos.', 'error');
      }
    } catch (err) {
      mostrarFeedback(`No se pudo conectar con el servicio: ${err.message}`, 'error');
    }
  });

  // 3. Manejo de estado visual 
  function transicionarAVistaAutenticado(nombre) {
    setTimeout(() => {
      vistaVisitante.style.display = 'none';
      vistaAutenticado.style.display = 'block';
      userNombre.textContent = nombre;
      feedback.textContent = '';
      feedback.className = 'alerta';
    }, 800);
  }

  // Cierre de sesión y retorno a vista visitante
  btnLogout.addEventListener('click', () => {
    vistaAutenticado.style.display = 'none';
    vistaVisitante.style.display = 'block';
    formAuth.reset();
    mostrarFeedback('Sesión finalizada correctamente.', 'info');
  });

  // Función reutilizable para respuesta visual en pantalla
  function mostrarFeedback(mensaje, tipo) {
    feedback.textContent = mensaje;
    feedback.className = `alerta alerta-${tipo}`;
  }
});