// =========================================================
// ANStore - tienda.js
// Pinta las vistas que dependen del catálogo y del carrito:
//   - index.html          -> #destacadosGrid
//   - listado_tabla.html  -> #tablaProductosBody
//   - producto.html       -> #detalleProducto  (producto.html?id=N)
//   - comprar.html        -> #resumenItems + #form-compra
// Cada función revisa si su contenedor existe, así el mismo
// archivo sirve para todas las páginas. Requiere carrito.js.
// Sin innerHTML: todo con createElement + textContent.
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    pintarDestacados();
    pintarTabla();
    pintarDetalle();
    iniciarPaginaCompra();
});

// ---------------------------------------------------------
// PIEZAS REUTILIZABLES
// ---------------------------------------------------------
function crearBotonAgregar(producto, texto = 'Agregar al carrito') {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn';
    boton.textContent = texto;
    boton.dataset.agregarId = producto.id;
    boton.setAttribute('aria-label', `${texto}: ${producto.nombre}`);
    if (producto.stock === 0) {
        boton.disabled = true;
        boton.textContent = 'Sin stock';
        boton.removeAttribute('aria-label');
    }
    return boton;
}

function crearLinkVer(producto, texto = 'Ver') {
    const link = document.createElement('a');
    link.href = `producto.html?id=${encodeURIComponent(producto.id)}`;
    link.className = 'btn btn-secundario';
    link.textContent = texto;
    link.setAttribute('aria-label', `${texto}: ${producto.nombre}`);
    return link;
}

// Tarjeta usada en la home y en listado_box (app.js también la usa)
function crearTarjetaProducto(producto) {
    const article = document.createElement('article');
    article.className = 'producto';

    const img = document.createElement('img');
    img.src = urlImagen(producto);
    img.alt = producto.nombre;

    const h3 = document.createElement('h3');
    h3.textContent = producto.nombre;

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = formatearPrecio(producto.precio);

    const acciones = document.createElement('div');
    acciones.className = 'producto-acciones';
    acciones.append(crearLinkVer(producto), crearBotonAgregar(producto, 'Agregar'));

    article.append(img, h3, precio, acciones);
    return article;
}

function mostrarErrorEn(contenedor, mensaje) {
    const p = document.createElement('p');
    p.className = 'mensaje-alerta alerta-error';
    p.textContent = mensaje;
    contenedor.replaceChildren(p);
}

// ---------------------------------------------------------
// INDEX: "Los más vendidos"
// ---------------------------------------------------------
async function pintarDestacados() {
    const grid = document.getElementById('destacadosGrid');
    if (!grid) return;
    try {
        const catalogo = await obtenerCatalogo();
        grid.replaceChildren(...catalogo.slice(0, 5).map(crearTarjetaProducto));
    } catch {
        mostrarErrorEn(grid, 'No se pudieron cargar los productos.');
    }
}

// ---------------------------------------------------------
// LISTADO EN TABLA
// ---------------------------------------------------------
async function pintarTabla() {
    const tbody = document.getElementById('tablaProductosBody');
    if (!tbody) return;
    try {
        const catalogo = await obtenerCatalogo();
        tbody.replaceChildren(...catalogo.map(producto => {
            const tr = document.createElement('tr');

            const celdas = [producto.nombre, producto.categoria, formatearPrecio(producto.precio)]
                .map(texto => {
                    const td = document.createElement('td');
                    td.textContent = texto;
                    return td;
                });

            const tdAccion = document.createElement('td');
            tdAccion.className = 'celda-acciones';
            tdAccion.append(crearLinkVer(producto), crearBotonAgregar(producto, 'Agregar'));

            tr.append(...celdas, tdAccion);
            return tr;
        }));
    } catch {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.textContent = 'No se pudieron cargar los productos.';
        tr.appendChild(td);
        tbody.replaceChildren(tr);
    }
}

// ---------------------------------------------------------
// FICHA DE PRODUCTO (producto.html?id=N)
// ---------------------------------------------------------
async function pintarDetalle() {
    const contenedor = document.getElementById('detalleProducto');
    if (!contenedor) return;

    const id = new URLSearchParams(location.search).get('id');
    let producto = null;
    try {
        producto = id ? await buscarProducto(id) : null;
    } catch {
        mostrarErrorEn(contenedor, 'No se pudo cargar el producto.');
        return;
    }

    if (!producto) {
        const titulo = document.createElement('h1');
        titulo.textContent = 'Producto no encontrado';
        const volver = document.createElement('a');
        volver.href = 'listado_box.html';
        volver.className = 'btn';
        volver.textContent = 'Volver al catálogo';
        contenedor.replaceChildren(titulo, volver);
        return;
    }

    document.title = `${producto.nombre} — ANStore`;

    const divImg = document.createElement('div');
    divImg.className = 'producto-imagen';
    const img = document.createElement('img');
    img.src = urlImagen(producto, 600, 500);
    img.alt = producto.nombre;
    divImg.appendChild(img);

    const info = document.createElement('div');
    info.className = 'producto-info';

    const h1 = document.createElement('h1');
    h1.textContent = producto.nombre;

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = formatearPrecio(producto.precio);

    const desc = document.createElement('p');
    desc.className = 'descripcion';
    desc.textContent = producto.descripcion || '';

    const stock = document.createElement('p');
    stock.className = 'stock';
    stock.textContent = producto.stock > 0
        ? `Stock disponible: ${producto.stock} unidades`
        : 'Sin stock';

    const label = document.createElement('label');
    label.htmlFor = 'cantidad';
    label.textContent = 'Cantidad:';

    const input = document.createElement('input');
    input.type = 'number';
    input.id = 'cantidad';
    input.name = 'cantidad';
    input.min = '1';
    input.max = String(producto.stock);
    input.value = '1';

    const boton = crearBotonAgregar(producto);
    boton.dataset.cantidadInput = 'cantidad';

    const irCarrito = document.createElement('a');
    irCarrito.href = 'comprar.html';
    irCarrito.className = 'btn btn-secundario';
    irCarrito.textContent = 'Ir al carrito';

    const acciones = document.createElement('div');
    acciones.className = 'producto-acciones';
    acciones.append(boton, irCarrito);

    info.append(h1, precio, desc, stock, label, input, acciones);
    contenedor.replaceChildren(divImg, info);
}

// ---------------------------------------------------------
// CARRITO / COMPRA (comprar.html)
// ---------------------------------------------------------
function iniciarPaginaCompra() {
    const lista = document.getElementById('resumenItems');
    if (!lista) return;

    pintarResumen();
    // Si se modifica desde otra pestaña, se vuelve a pintar
    window.addEventListener('storage', (e) => {
        if (e.key === CLAVE_CARRITO) pintarResumen();
    });

    // Cambios de cantidad (evento 'change': al salir del campo o con Enter)
    lista.addEventListener('change', async (e) => {
        const input = e.target.closest('[data-cantidad-id]');
        if (!input) return;
        const producto = await buscarProducto(input.dataset.cantidadId);
        let cantidad = Math.floor(Number(input.value));
        if (!Number.isFinite(cantidad) || cantidad < 1) cantidad = 1;
        if (producto && cantidad > producto.stock) {
            cantidad = producto.stock;
            avisar(`Solo hay ${producto.stock} unidades de ${producto.nombre}.`);
        }
        input.value = cantidad;
        cambiarCantidad(input.dataset.cantidadId, cantidad);
        actualizarImportes();
    });

    // Botón "Quitar"
    lista.addEventListener('click', async (e) => {
        const boton = e.target.closest('[data-quitar-id]');
        if (!boton) return;
        const botones = [...lista.querySelectorAll('[data-quitar-id]')];
        const posicion = botones.indexOf(boton);
        const producto = await buscarProducto(boton.dataset.quitarId);

        quitarDelCarrito(boton.dataset.quitarId);
        await pintarResumen();
        avisar(`${producto ? producto.nombre : 'Producto'} quitado del carrito.`);

        // El foco pasa al siguiente "Quitar" (o al título si ya no quedan)
        const restantes = lista.querySelectorAll('[data-quitar-id]');
        (restantes[posicion] || restantes[posicion - 1] || document.getElementById('titulo-resumen')).focus();
    });

    document.getElementById('btn-vaciar')?.addEventListener('click', async () => {
        vaciarCarrito();
        await pintarResumen();
        avisar('Carrito vaciado.');
        document.getElementById('titulo-resumen').focus();
    });

    document.getElementById('form-compra')?.addEventListener('submit', confirmarCompra);
}

// Arma la lista del carrito a partir de localStorage + catálogo
async function pintarResumen() {
    const lista = document.getElementById('resumenItems');
    const vacio = document.getElementById('carrito-vacio');
    const btnVaciar = document.getElementById('btn-vaciar');

    let catalogo;
    try {
        catalogo = await obtenerCatalogo();
    } catch {
        mostrarErrorEn(lista, 'No se pudo cargar el carrito.');
        return;
    }

    // Se descartan ítems de productos que ya no existen en el catálogo
    const items = leerCarrito().filter(i => catalogo.some(p => p.id === i.id));

    lista.replaceChildren(...items.map(item => {
        const producto = catalogo.find(p => p.id === item.id);
        const li = document.createElement('li');
        li.className = 'resumen-item';

        const img = document.createElement('img');
        img.src = urlImagen(producto, 80, 80);
        img.alt = '';  // decorativa: el nombre ya está escrito al lado

        const info = document.createElement('div');
        info.className = 'resumen-item-info';

        const nombre = document.createElement('p');
        nombre.className = 'resumen-item-nombre';
        nombre.textContent = producto.nombre;

        const precio = document.createElement('p');
        precio.className = 'precio';
        precio.textContent = `${formatearPrecio(producto.precio)} c/u`;

        const idInput = `cantidad-${producto.id}`;
        const label = document.createElement('label');
        label.htmlFor = idInput;
        label.textContent = `Cantidad de ${producto.nombre}`;
        label.className = 'visualmente-oculto';

        const input = document.createElement('input');
        input.type = 'number';
        input.id = idInput;
        input.className = 'input-cantidad';
        input.min = '1';
        input.max = String(producto.stock);
        input.value = String(item.cantidad);
        input.dataset.cantidadId = producto.id;

        const subtotal = document.createElement('p');
        subtotal.className = 'resumen-subtotal';
        subtotal.dataset.subtotalId = producto.id;
        subtotal.textContent = `Subtotal: ${formatearPrecio(producto.precio * item.cantidad)}`;

        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'btn-quitar';
        quitar.dataset.quitarId = producto.id;
        quitar.textContent = 'Quitar';
        quitar.setAttribute('aria-label', `Quitar ${producto.nombre} del carrito`);

        info.append(nombre, precio, label, input, subtotal, quitar);
        li.append(img, info);
        return li;
    }));

    const hayItems = items.length > 0;
    vacio.hidden = hayItems;
    lista.hidden = !hayItems;
    if (btnVaciar) btnVaciar.hidden = !hayItems;
    actualizarImportes(catalogo);
}

// Recalcula subtotales y total sin volver a pintar la lista
// (así el foco no se pierde mientras el usuario cambia cantidades)
async function actualizarImportes(catalogo) {
    catalogo = catalogo || await obtenerCatalogo();
    let total = 0;
    leerCarrito().forEach(item => {
        const producto = catalogo.find(p => p.id === item.id);
        if (!producto) return;
        const subtotal = producto.precio * item.cantidad;
        total += subtotal;
        const el = document.querySelector(`[data-subtotal-id="${producto.id}"]`);
        if (el) el.textContent = `Subtotal: ${formatearPrecio(subtotal)}`;
    });
    document.getElementById('resumenTotal').textContent = `Total: ${formatearPrecio(total)}`;
}

// Validación del formulario (RF05) y confirmación de la compra (CU04)
async function confirmarCompra(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const mensaje = document.getElementById('mensaje-compra');

    const mostrar = (texto, tipo) => {
        mensaje.textContent = texto;
        mensaje.className = `mensaje-alerta alerta-${tipo}`;
    };

    const items = leerCarrito();
    if (items.length === 0) {
        mostrar('Tu carrito está vacío. Agregá productos antes de comprar.', 'error');
        return;
    }

    // Validación nativa de HTML5 (required, type="email") + mensaje propio
    const invalido = [...form.elements].find(campo => campo.willValidate && !campo.checkValidity());
    if (invalido) {
        const nombreCampo = invalido.type === 'radio'
            ? 'medio de pago'
            : (form.querySelector(`label[for="${invalido.id}"]`)?.textContent.replace(':', '') || 'un campo');
        mostrar(invalido.type === 'email' && invalido.value
            ? 'El email no tiene un formato válido.'
            : `Completá el campo: ${nombreCampo}.`, 'error');
        invalido.focus();
        return;
    }

    const datos = new FormData(form);
    const pedido = {
        cliente: {
            nombre:    datos.get('nombre').trim(),
            email:     datos.get('email').trim(),
            telefono:  datos.get('telefono').trim(),
            direccion: datos.get('direccion').trim(),
        },
        medio_pago: datos.get('metodoPago'),
        items, // [{ id, cantidad }] -> el servidor debe recalcular precios y stock
    };

    // TODO (AE4): enviar el pedido a la API cuando exista:
    //   const resp = await fetch('api/pedidos.php', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       credentials: 'same-origin',
    //       body: JSON.stringify(pedido),
    //   });
    //   if (resp.status !== 201) { mostrar('No se pudo registrar el pedido.', 'error'); return; }
    console.info('Pedido listo para enviar a la API:', pedido);

    form.reset();
    vaciarCarrito();
    await pintarResumen();
    mostrar(`¡Gracias, ${pedido.cliente.nombre}! Recibimos tu pedido.`, 'exito');
}
