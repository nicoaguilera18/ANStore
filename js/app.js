// =========================================================
// ANStore - app.js
// 1) Verifica la sesión contra el endpoint privado (api/mis_compras.php)
// 2) Muestra/oculta partes del DOM según haya sesión o no
// 3) Login, registro y logout con fetch() + JSON
// 4) Todo dato del usuario se pinta con .textContent (anti XSS)
// =========================================================

const API = './api';

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    iniciarFormularios();
    iniciarCatalogo();
});

// ---------------------------------------------------------
// SESIÓN
// ---------------------------------------------------------

// Al cargar la página preguntamos al endpoint privado si hay sesión.
// 200 -> hay sesión | 401 -> visitante
async function verificarSesion() {
    try {
        const resp = await fetch(`${API}/mis_compras.php`, { credentials: 'same-origin' });

        if (resp.status === 401) {
            aplicarEstadoSesion(false);
            return;
        }
        if (!resp.ok) throw new Error(`Error ${resp.status}`);

        const datos = await resp.json();
        aplicarEstadoSesion(true, datos);
    } catch (err) {
        // Si el servidor no responde, tratamos al usuario como visitante
        aplicarEstadoSesion(false);
        mostrarFeedback('No se pudo conectar con el servidor.', 'error');
    }
}

// Alterna el DOM: elementos con data-solo-sesion / data-solo-visitante
function aplicarEstadoSesion(logueado, datos = null) {
    document.querySelectorAll('[data-solo-sesion]').forEach(el => el.hidden = !logueado);
    document.querySelectorAll('[data-solo-visitante]').forEach(el => el.hidden = logueado);

    if (!logueado || !datos) return;

    // Nombre del usuario en todos los lugares marcados (header, saludo...)
    // .textContent: si el nombre fuera "<script>...</script>" se ve como texto, no se ejecuta.
    document.querySelectorAll('.js-nombre-usuario')
        .forEach(el => el.textContent = datos.usuario.nombre);

    const emailEl = document.getElementById('user-email');
    if (emailEl) emailEl.textContent = datos.usuario.email;

    renderizarCompras(datos.compras);
}

// Lista de compras creada con createElement + textContent (sin innerHTML)
function renderizarCompras(compras) {
    const lista = document.getElementById('lista-compras');
    if (!lista) return;

    lista.replaceChildren(); // limpia la lista

    if (compras.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Todavía no realizaste compras.';
        lista.appendChild(li);
        return;
    }

    compras.forEach(c => {
        const li = document.createElement('li');

        const producto = document.createElement('span');
        producto.textContent = `${c.producto} x${c.cantidad}`;

        const total = document.createElement('strong');
        total.textContent = `$${Number(c.total).toLocaleString('es-AR')}`;

        li.append(producto, total);
        lista.appendChild(li);
    });
}

// ---------------------------------------------------------
// FORMULARIOS (solo existen en login.html)
// ---------------------------------------------------------
function iniciarFormularios() {
    const formLogin    = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    const btnLogout    = document.getElementById('btn-logout');

    // Cambiar entre "Ingresar" y "Crear cuenta"
    document.getElementById('ir-registro')?.addEventListener('click', () => alternarFormulario(true));
    document.getElementById('ir-login')?.addEventListener('click', () => alternarFormulario(false));

    // ----- LOGIN -----
    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-clave').value;

        if (!email || !password) {
            mostrarFeedback('Completá correo y contraseña.', 'error');
            return;
        }

        mostrarFeedback('Verificando credenciales...', 'cargando');
        const { ok, datos } = await enviarJSON('login.php', { email, password });

        if (ok) {
            formLogin.reset();
            mostrarFeedback('', '');
            verificarSesion(); // vuelve a consultar el endpoint privado y actualiza el DOM
        } else {
            mostrarFeedback(datos.error || 'No se pudo iniciar sesión.', 'error');
        }
    });

    // ----- REGISTRO -----
    formRegistro?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre   = document.getElementById('reg-nombre').value.trim();
        const email    = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-clave').value;
        const repetir  = document.getElementById('reg-repetir').value;

        if (!nombre || !email) {
            mostrarFeedback('Completá nombre y correo.', 'error');
            return;
        }
        if (password.length < 6) {
            mostrarFeedback('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        if (password !== repetir) {
            mostrarFeedback('Las contraseñas no coinciden.', 'error');
            return;
        }

        mostrarFeedback('Creando cuenta...', 'cargando');
        const { ok, datos } = await enviarJSON('registro.php', { nombre, email, password });

        if (ok) {
            formRegistro.reset();
            alternarFormulario(false);
            document.getElementById('login-email').value = email;
            mostrarFeedback('Cuenta creada. Ahora ingresá con tu contraseña.', 'exito');
        } else {
            mostrarFeedback(datos.error || 'No se pudo registrar.', 'error');
        }
    });

    // ----- LOGOUT -----
    btnLogout?.addEventListener('click', async () => {
        await fetch(`${API}/logout.php`, { method: 'POST', credentials: 'same-origin' });
        aplicarEstadoSesion(false);
        mostrarFeedback('Sesión finalizada correctamente.', 'info');
    });
}

function alternarFormulario(mostrarRegistro) {
    document.getElementById('bloque-login').hidden = mostrarRegistro;
    document.getElementById('bloque-registro').hidden = !mostrarRegistro;
    mostrarFeedback('', '');
}

// Envía un objeto como JSON por POST y devuelve { ok, datos }
async function enviarJSON(archivo, cuerpo) {
    try {
        const resp = await fetch(`${API}/${archivo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(cuerpo),
        });
        const datos = await resp.json().catch(() => ({}));
        return { ok: resp.ok, datos };
    } catch {
        return { ok: false, datos: { error: 'No se pudo conectar con el servidor.' } };
    }
}

// Mensajes en pantalla (también con textContent)
function mostrarFeedback(mensaje, tipo) {
    const feedback = document.getElementById('mensaje-feedback');
    if (!feedback) return;
    feedback.textContent = mensaje;
    feedback.className = tipo ? `mensaje-alerta alerta-${tipo}` : 'mensaje-alerta';
}

// ---------------------------------------------------------
// CATÁLOGO (solo existe en listado_box.html)
// Antes usaba innerHTML con los nombres; ahora se arma con
// createElement + textContent para evitar XSS.
// ---------------------------------------------------------
let listaProductos = [];

async function iniciarCatalogo() {
    const contenedor = document.getElementById('productosGrid');
    if (!contenedor) return;

    const respuesta = await fetch('productos.json');
    listaProductos = await respuesta.json();
    mostrarProductos(listaProductos);

    const inputBuscador = document.getElementById('buscador');
    inputBuscador?.addEventListener('input', () => {
        const texto = inputBuscador.value.trim().toLowerCase();
        mostrarProductos(listaProductos.filter(p => p.nombre.toLowerCase().includes(texto)));
    });
}

function mostrarProductos(productos) {
    const contenedor = document.getElementById('productosGrid');
    contenedor.replaceChildren();

    productos.forEach(producto => {
        const article = document.createElement('article');
        article.className = 'producto';

        const img = document.createElement('img');
        img.src = `https://placehold.co/300x300/1A1A1A/F5D033?text=${encodeURIComponent(producto.nombre)}`;
        img.alt = producto.nombre;

        const h3 = document.createElement('h3');
        h3.textContent = producto.nombre;

        const precio = document.createElement('p');
        precio.className = 'precio';
        precio.textContent = `$${producto.precio}`;

        const link = document.createElement('a');
        link.href = 'producto.html';
        link.className = 'btn';
        link.textContent = 'Ver';

        article.append(img, h3, precio, link);
        contenedor.appendChild(article);
    });
}
