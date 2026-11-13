// =========================================================
// ANStore - carrito.js
// Estado del carrito compartido entre todas las páginas.
//
// - Se guarda en localStorage SOLO { id, cantidad } de cada producto.
//   El nombre y el precio se leen siempre del catálogo, así nadie
//   puede "cambiar el precio" editando el localStorage.
// - El catálogo hoy sale de productos.json; cuando exista la API
//   alcanza con cambiar URL_PRODUCTOS por 'api/productos.php'.
// - Todo el texto se escribe con .textContent (anti XSS).
// =========================================================

const URL_PRODUCTOS = 'productos.json';
const CLAVE_CARRITO = 'anstore_carrito';

// ---------------------------------------------------------
// CATÁLOGO (se pide una sola vez por página)
// ---------------------------------------------------------
let promesaCatalogo = null;

function obtenerCatalogo() {
    if (!promesaCatalogo) {
        promesaCatalogo = fetch(URL_PRODUCTOS)
            .then(resp => {
                if (!resp.ok) throw new Error(`Error ${resp.status}`);
                return resp.json();
            })
            .catch(err => {
                promesaCatalogo = null; // permite reintentar
                throw err;
            });
    }
    return promesaCatalogo;
}

async function buscarProducto(id) {
    const catalogo = await obtenerCatalogo();
    return catalogo.find(p => p.id === Number(id)) || null;
}

function formatearPrecio(valor) {
    return `$${Number(valor).toLocaleString('es-AR')}`;
}

function urlImagen(producto, ancho = 300, alto = 300) {
    return `https://placehold.co/${ancho}x${alto}/1A1A1A/F5D033?text=${encodeURIComponent(producto.nombre)}`;
}

// ---------------------------------------------------------
// ESTADO DEL CARRITO (localStorage)
// ---------------------------------------------------------
function leerCarrito() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
        if (!Array.isArray(datos)) return [];
        // Solo se aceptan ítems con forma válida
        return datos
            .map(i => ({ id: Number(i.id), cantidad: Math.floor(Number(i.cantidad)) }))
            .filter(i => Number.isInteger(i.id) && i.id > 0 && i.cantidad > 0);
    } catch {
        return [];
    }
}

function guardarCarrito(items) {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    } catch {
        // Navegación privada o almacenamiento lleno: el carrito no persiste
    }
    actualizarContadorCarrito();
    document.dispatchEvent(new CustomEvent('carrito:cambio'));
}

// Suma `cantidad` al producto (respetando el stock). Devuelve la cantidad final.
async function agregarAlCarrito(id, cantidad = 1) {
    const producto = await buscarProducto(id);
    if (!producto) throw new Error('Producto inexistente');

    const items = leerCarrito();
    const item = items.find(i => i.id === producto.id);
    const actual = item ? item.cantidad : 0;
    const nueva = Math.min(actual + cantidad, producto.stock ?? Infinity);

    if (nueva <= 0) return { producto, cantidad: 0, limitadoPorStock: true };

    if (item) item.cantidad = nueva;
    else items.push({ id: producto.id, cantidad: nueva });

    guardarCarrito(items);
    return { producto, cantidad: nueva, limitadoPorStock: nueva < actual + cantidad };
}

function cambiarCantidad(id, cantidad) {
    const items = leerCarrito();
    const item = items.find(i => i.id === Number(id));
    if (!item) return;
    item.cantidad = cantidad;
    guardarCarrito(items.filter(i => i.cantidad > 0));
}

function quitarDelCarrito(id) {
    guardarCarrito(leerCarrito().filter(i => i.id !== Number(id)));
}

function vaciarCarrito() {
    guardarCarrito([]);
}

function totalUnidades() {
    return leerCarrito().reduce((suma, i) => suma + i.cantidad, 0);
}

// ---------------------------------------------------------
// CONTADOR DEL HEADER (🛒 Carrito (3))
// ---------------------------------------------------------
function actualizarContadorCarrito() {
    const unidades = totalUnidades();
    document.querySelectorAll('[data-carrito-contador]').forEach(el => {
        el.textContent = unidades > 0 ? `(${unidades})` : '';
    });
    document.querySelectorAll('[data-carrito-link]').forEach(link => {
        link.setAttribute('aria-label',
            unidades === 1 ? 'Carrito, 1 producto' : `Carrito, ${unidades} productos`);
    });
}

// ---------------------------------------------------------
// AVISO ACCESIBLE ("Producto 3 agregado al carrito")
// Región aria-live creada una sola vez, compartida por todas las páginas.
// ---------------------------------------------------------
let temporizadorAviso = null;

function avisar(mensaje) {
    let aviso = document.getElementById('aviso-carrito');
    if (!aviso) {
        aviso = document.createElement('div');
        aviso.id = 'aviso-carrito';
        aviso.className = 'aviso-carrito';
        aviso.setAttribute('role', 'status');
        aviso.setAttribute('aria-live', 'polite');
        document.body.appendChild(aviso);
    }
    aviso.textContent = mensaje;
    aviso.classList.add('visible');
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove('visible'), 2500);
}

// ---------------------------------------------------------
// BOTONES "AGREGAR AL CARRITO" (delegación de eventos)
// Cualquier <button data-agregar-id="N"> de cualquier página funciona,
// incluso los que se crean dinámicamente. Si el botón tiene
// data-cantidad-input="idDelInput", toma la cantidad de ese input.
// ---------------------------------------------------------
document.addEventListener('click', async (e) => {
    const boton = e.target.closest('[data-agregar-id]');
    if (!boton) return;

    let cantidad = 1;
    const idInput = boton.dataset.cantidadInput;
    if (idInput) {
        const valor = Math.floor(Number(document.getElementById(idInput)?.value));
        if (!Number.isFinite(valor) || valor < 1) {
            avisar('Ingresá una cantidad válida.');
            return;
        }
        cantidad = valor;
    }

    try {
        const r = await agregarAlCarrito(boton.dataset.agregarId, cantidad);
        avisar(r.cantidad === 0
            ? `${r.producto.nombre} no tiene stock disponible.`
            : r.limitadoPorStock
            ? `Solo hay ${r.producto.stock} unidades de ${r.producto.nombre}. Tenés ${r.cantidad} en el carrito.`
            : `${r.producto.nombre} agregado al carrito (${r.cantidad} en total).`);
    } catch {
        avisar('No se pudo agregar el producto. Intentá de nuevo.');
    }
});

// Si el carrito cambia en otra pestaña, se actualiza el contador acá también
window.addEventListener('storage', (e) => {
    if (e.key === CLAVE_CARRITO) {
        actualizarContadorCarrito();
        document.dispatchEvent(new CustomEvent('carrito:cambio'));
    }
});

document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);
