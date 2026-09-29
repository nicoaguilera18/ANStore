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


  // Buscamos si existe "usuarioActivo" en la memoria del navegador
  const sesionGuardada = localStorage.getItem('usuarioActivo');
  
  // Si hay datos guardados, se mantiene iniciada la sesión, y se saltea el formulario de login
  if (sesionGuardada) {
    // Convertimos el texto guardado de vuelta a un objeto JavaScript
    const usuario = JSON.parse(sesionGuardada);
    // Cambiamos a la vista de usuario autenticado directamente
    mostrarVistaAutenticado(usuario.nombre);
  }

 
  // CAPTURA DEL FORMULARIO Y VALIDACIÓN

  formAuth.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const clave = claveInput.value;
    const repetirClave = repetirClaveInput.value;

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

      const usuarioEncontrado = usuarios.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === clave
      );

      if (usuarioEncontrado) {

        // GUARDAR SESIÓN TRAS INGRESO EXITOSO
        // localStorage solo guarda texto, así que convertimos el objeto a texto con JSON.stringify
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioEncontrado));
        
        mostrarFeedback('Credenciales válidas. Ingresando...', 'exito');
        
        // Pequeña demora estética antes de cambiar de pantalla
        setTimeout(() => {
          mostrarVistaAutenticado(usuarioEncontrado.nombre);
        }, 800);
      } else {
        mostrarFeedback('Correo o contraseña incorrectos. Revisa los datos.', 'error');
      }
    } catch (err) {
      mostrarFeedback(`No se pudo conectar con el servicio: ${err.message}`, 'error');
    }
  });

 
  //CERRAR SESIÓN

  btnLogout.addEventListener('click', () => {
    // Borramos el rastro del usuario en la memoria del navegador
    localStorage.removeItem('usuarioActivo');
    
    // Volvemos a mostrar el formulario de visitante
    vistaAutenticado.style.display = 'none';
    vistaVisitante.style.display = 'block';
    formAuth.reset();
    mostrarFeedback('Sesión finalizada correctamente.', 'info');
  });

  // FUNCIONES DE REUTILIZABLES 

  
  // Función para alternar visualmente al estado autenticado
  function mostrarVistaAutenticado(nombre) {
    vistaVisitante.style.display = 'none';
    vistaAutenticado.style.display = 'block';
    userNombre.textContent = nombre;
    feedback.textContent = '';
    feedback.className = 'mensaje-alerta';
  }

  // Función para mostrar mensajes de color en pantalla
  function mostrarFeedback(mensaje, tipo) {
    feedback.textContent = mensaje;
    feedback.className = `mensaje-alerta alerta-${tipo}`;
  }
});