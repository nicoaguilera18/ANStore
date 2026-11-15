const API = new URL('../api/', window.location.href).href;
const CART_KEY = 'anstore_carrito';
const GUEST_CART_KEY = `${CART_KEY}:invitado`;
const USER_CART_KEY_PREFIX = `${CART_KEY}:usuario:`;
const app = document.getElementById('app');
const nav = document.getElementById('navegacion-principal');
const menuButton = document.getElementById('menuToggle');
const globalStatus = document.getElementById('estado-global');
document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    app.focus();
});
const state = {
    user: null,
    renderId: 0,
    editingProduct: null,
    noticeTimer: null,
};

function element(tag, text = '', className = '') {
    const node = document.createElement(tag);
    if (text !== '') node.textContent = text;
    if (className) node.className = className;
    return node;
}

function setAttributes(node, attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
        if (value !== undefined && value !== null) node.setAttribute(name, String(value));
    });
    return node;
}

function link(text, href, className = '') {
    const node = element('a', text, className);
    node.href = href;
    node.dataset.nav = '';
    return node;
}

function button(text, className = 'boton') {
    const node = element('button', text, className);
    node.type = 'button';
    return node;
}

function crearAccionProducto(producto, textoAgregar = 'Agregar al carrito') {
    if (state.user?.rol === 'administrador') {
        const edit = link('Editar desde administración', '#/admin', 'boton boton-secundario');
        edit.setAttribute('aria-label', `Editar ${producto.nombre} desde administración`);
        edit.addEventListener('click', () => {
            state.editingProduct = producto;
        });
        return edit;
    }

    const add = button(textoAgregar);
    add.setAttribute('aria-label', `Agregar ${producto.nombre} al carrito`);
    add.disabled = Number(producto.stock) < 1;
    add.addEventListener('click', () => agregarAlCarrito(producto));
    return add;
}

function configurarImagenProducto(image, producto, decorativa = false) {
    const placeholder = 'images/product-placeholder.svg';
    const ruta = producto.imagen;
    const imagenLocalValida = typeof ruta === 'string'
        && /^images\/products\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(ruta);

    image.src = imagenLocalValida ? ruta : placeholder;
    image.alt = decorativa
        ? ''
        : imagenLocalValida
            ? `Imagen de ${producto.nombre}`
            : `Imagen ilustrativa de ${producto.nombre}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
        if (image.getAttribute('src') !== placeholder) image.src = placeholder;
    });
}

function configurarImagenPortada(image, portada) {
    const ilustracionPredeterminada = 'images/hero-gaming-pc.svg';
    const ruta = portada.imagen;
    const imagenLocalValida = typeof ruta === 'string'
        && /^images\/site\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(ruta);

    image.src = imagenLocalValida ? ruta : ilustracionPredeterminada;
    image.alt = portada.texto_alternativo;
    image.decoding = 'async';
    if (image.dataset.fallbackConfigurado !== 'true') {
        image.addEventListener('error', () => {
            if (image.getAttribute('src') !== ilustracionPredeterminada) {
                image.src = ilustracionPredeterminada;
            }
        });
        image.dataset.fallbackConfigurado = 'true';
    }
}

function field(labelText, name, type = 'text', value = '', required = true, options = {}) {
    const wrapper = element('div', '', 'campo');
    const id = `campo-${name}`;
    const label = element('label', labelText);
    label.htmlFor = id;
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    input.id = id;
    input.name = name;
    input.value = value ?? '';
    input.required = required;
    if (options.min !== undefined) input.min = String(options.min);
    if (options.max !== undefined) input.max = String(options.max);
    if (options.step !== undefined) input.step = String(options.step);
    if (options.minlength !== undefined) input.minLength = options.minlength;
    if (options.maxlength !== undefined) input.maxLength = options.maxlength;
    if (options.autocomplete) input.autocomplete = options.autocomplete;
    if (options.placeholder) input.placeholder = options.placeholder;
    if (type === 'textarea' && options.rows) input.rows = options.rows;
    wrapper.append(label, input);
    if (options.help) {
        const help = element('small', options.help);
        wrapper.appendChild(help);
        input.setAttribute('aria-describedby', `${id}-ayuda`);
        help.id = `${id}-ayuda`;
    }
    return { wrapper, input };
}

function selectField(labelText, name, values, selected = '') {
    const wrapper = element('div', '', 'campo');
    const id = `campo-${name}`;
    const label = element('label', labelText);
    label.htmlFor = id;
    const select = document.createElement('select');
    select.id = id;
    select.name = name;
    select.required = true;
    values.forEach(([value, text]) => {
        const option = element('option', text);
        option.value = value;
        option.selected = value === selected;
        select.appendChild(option);
    });
    wrapper.append(label, select);
    return { wrapper, input: select };
}

function showNotice(message, type = '') {
    globalStatus.textContent = message;
    globalStatus.className = type ? `estado-global mensaje-${type}` : 'estado-global';
    window.clearTimeout(state.noticeTimer);
    if (message) {
        state.noticeTimer = window.setTimeout(() => {
            globalStatus.textContent = '';
            globalStatus.className = 'estado-global';
        }, 5000);
    }
}

async function requestJson(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    const response = await fetch(new URL(path, API), {
        credentials: 'same-origin',
        ...options,
        headers,
    });
    const body = await response.text();
    let data;
    try {
        data = body ? JSON.parse(body) : {};
    } catch {
        throw new Error('El servidor devolvió una respuesta que no es JSON válida.');
    }
    if (!response.ok) {
        const error = new Error(data.error || `La solicitud falló (${response.status}).`);
        error.status = response.status;
        throw error;
    }
    return data;
}

function parseRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const separator = hash.indexOf('?');
    const pathname = separator === -1 ? hash : hash.slice(0, separator);
    const search = separator === -1 ? '' : hash.slice(separator + 1);
    return { pathname, query: new URLSearchParams(search) };
}

function updateHeader() {
    const accountLink = document.getElementById('enlace-cuenta');
    const adminLink = document.getElementById('enlace-admin');
    accountLink.textContent = state.user ? `Mi cuenta: ${state.user.nombre}` : 'Ingresar';
    accountLink.href = state.user ? '#/cuenta' : '#/login';
    adminLink.hidden = !state.user || state.user.rol !== 'administrador';
    updateCartCount();
}

function updateCartCount() {
    const contador = document.getElementById('carrito-contador');
    const cantidad = state.user?.rol === 'administrador'
        ? 0
        : leerCarrito().reduce((suma, item) => suma + item.cantidad, 0);
    contador.textContent = cantidad ? `(${cantidad})` : '';
    const enlace = document.querySelector('a[href="#/carrito"]');
    if (enlace) {
        enlace.setAttribute(
            'aria-label',
            cantidad === 1 ? 'Carrito, 1 producto' : `Carrito, ${cantidad} productos`
        );
    }
}

function claveCarritoActual() {
    if (!state.user) return GUEST_CART_KEY;
    return `${USER_CART_KEY_PREFIX}${encodeURIComponent(state.user.rol)}:${encodeURIComponent(String(state.user.id))}`;
}

async function cargarSesion() {
    try {
        const datos = await requestJson('sesion.php');
        state.user = datos.usuario;
    } catch (error) {
        if (error.status === 401) {
            state.user = null;
        } else {
            showNotice('No se pudo verificar la sesión con el servidor.', 'error');
        }
    }
    updateHeader();
}

function enfocarTitulo() {
    const titulo = app.querySelector('h1');
    if (titulo) {
        titulo.tabIndex = -1;
        titulo.focus();
    }
}

async function renderRoute(shouldFocus = true) {
    const renderId = ++state.renderId;
    const route = parseRoute();
    app.replaceChildren();

    if (route.pathname === '/' || route.pathname === '') {
        await renderHome(renderId);
    } else if (route.pathname === '/productos') {
        await renderCatalog(route.query.get('vista') === 'tabla' ? 'tabla' : 'grilla', renderId);
    } else if (route.pathname.startsWith('/productos/')) {
        await renderProductDetail(route.pathname.slice('/productos/'.length), renderId);
    } else if (route.pathname === '/carrito') {
        await renderCart(renderId);
    } else if (route.pathname === '/checkout') {
        await renderCheckout(renderId);
    } else if (route.pathname === '/login') {
        renderLogin(route.query.get('modo') === 'registro');
    } else if (route.pathname === '/cuenta') {
        await renderAccount(renderId);
    } else if (route.pathname === '/admin') {
        await renderAdmin(renderId);
    } else {
        renderNotFound();
    }

    if (shouldFocus && renderId === state.renderId) enfocarTitulo();
}

function page(title, live = false) {
    const section = element('section', '', 'pagina');
    const heading = element('h1', title);
    section.appendChild(heading);
    if (live) section.setAttribute('aria-live', 'polite');
    return { section, heading };
}

function setPageTitle(text) {
    document.title = `${text} — ANStore`;
}

async function renderHome(renderId) {
    setPageTitle('Inicio');
    const { section, heading: pageHeading } = page('Bienvenido a ANStore');
    const hero = element('div', '', 'hero');
    const copy = document.createElement('div');
    const subtitle = element('p', 'Componentes y computadoras armadas');
    copy.append(subtitle);
    copy.append(link('Explorar catálogo', '#/productos?vista=grilla', 'boton'));
    const image = document.createElement('img');
    configurarImagenPortada(image, {
        imagen: null,
        texto_alternativo: 'Setup gamer con PC iluminada',
    });
    hero.append(copy, image);

    const heading = element('h2', 'Productos destacados');
    const grid = element('div', '', 'productos-grid');
    grid.setAttribute('aria-live', 'polite');
    grid.appendChild(element('p', 'Cargando productos...'));
    section.append(hero, heading, grid);
    app.appendChild(section);

    const [portadaResultado, productosResultado] = await Promise.allSettled([
        requestJson('portada.php'),
        requestJson('productos.php'),
    ]);
    if (renderId !== state.renderId) return;

    if (portadaResultado.status === 'fulfilled') {
        const portada = portadaResultado.value.portada;
        pageHeading.textContent = portada.titulo;
        subtitle.textContent = portada.subtitulo;
        configurarImagenPortada(image, portada);
    } else {
        showNotice('No se pudo cargar la portada personalizada.', 'error');
    }

    if (productosResultado.status === 'fulfilled') {
        grid.replaceChildren();
        const productos = productosResultado.value.productos.slice(0, 4);
        productos.forEach(producto => grid.appendChild(crearTarjeta(producto)));
        if (productos.length === 0) grid.appendChild(element('p', 'Todavía no hay productos publicados.'));
    } else {
        grid.replaceChildren(element('p', 'No se pudieron cargar los productos. Intentá nuevamente.', 'mensaje mensaje-error'));
    }
}

function crearTarjeta(producto) {
    const article = element('article', '', 'producto');
    const image = document.createElement('img');
    configurarImagenProducto(image, producto);
    const heading = element('h2', producto.nombre);
    const category = element('p', producto.categoria);
    const price = element('p', formatearPrecio(producto.precio), 'precio');
    const stock = element('p', producto.stock > 0 ? `Stock: ${producto.stock}` : 'Sin stock');
    const actions = element('div', '', 'acciones');
    actions.appendChild(link('Ver detalle', `#/productos/${producto.id}`, 'boton boton-secundario'));
    actions.appendChild(crearAccionProducto(producto));
    article.append(image, heading, category, price, stock, actions);
    return article;
}

function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 2,
    }).format(Number(valor));
}

async function renderCatalog(vista, renderId) {
    setPageTitle(vista === 'tabla' ? 'Catálogo en tabla' : 'Catálogo');
    const { section } = page(vista === 'tabla' ? 'Catálogo de productos' : 'Todos los productos');
    const selector = element('div', '', 'selector-vista');
    const grilla = link('Vista en grilla', '#/productos?vista=grilla');
    const tabla = link('Vista en tabla', '#/productos?vista=tabla');
    (vista === 'tabla' ? tabla : grilla).setAttribute('aria-current', 'page');
    selector.append(grilla, tabla);

    const form = document.createElement('form');
    form.role = 'search';
    form.className = 'catalogo-filtros';
    const buscar = field('Buscar productos', 'q', 'search', '', false, {
        maxlength: 100,
        placeholder: 'Nombre o tipo de producto',
    });
    const category = selectField('Categoría', 'filtro_categoria', [
        ['', 'Todas las categorías'],
        ['PC_ARMADA', 'Computadora armada'],
        ['PROCESADOR', 'Procesador'],
        ['MEMORIA_RAM', 'Memoria RAM'],
        ['TARJETA_MADRE', 'Tarjeta madre'],
        ['FUENTE_PODER', 'Fuente de poder'],
        ['PLACA_VIDEO', 'Placa de video'],
        ['GABINETE', 'Gabinete'],
    ]);
    const minPrice = field('Precio mínimo', 'precio_minimo', 'number', '', false, {
        min: 0,
        max: 99999999.99,
        step: 0.01,
    });
    const maxPrice = field('Precio máximo', 'precio_maximo', 'number', '', false, {
        min: 0,
        max: 99999999.99,
        step: 0.01,
    });
    const sort = selectField('Ordenar por', 'ordenar', [
        ['relevancia', 'Orden predeterminado'],
        ['nombre', 'Nombre: A a Z'],
        ['precio-asc', 'Precio: menor a mayor'],
        ['precio-desc', 'Precio: mayor a menor'],
    ], 'relevancia');
    const filterFields = element('div', '', 'catalogo-filtros-campos');
    filterFields.append(category.wrapper, minPrice.wrapper, maxPrice.wrapper, sort.wrapper);
    const formActions = element('div', '', 'acciones');
    const searchButton = button('Buscar');
    searchButton.type = 'submit';
    const clearButton = button('Limpiar filtros', 'boton boton-secundario');
    formActions.append(searchButton, clearButton);
    form.append(buscar.wrapper, filterFields, formActions);
    const results = element('div', '', vista === 'tabla' ? 'tabla-scroll' : 'productos-grid');
    results.setAttribute('aria-live', 'polite');
    results.appendChild(element('p', 'Cargando productos...'));
    section.append(selector, form, results);
    app.appendChild(section);

    let productos = [];
    let solicitudActual = 0;
    const renderizarResultados = () => {
        const minimo = minPrice.input.value === '' ? null : Number(minPrice.input.value);
        const maximo = maxPrice.input.value === '' ? null : Number(maxPrice.input.value);
        if (minimo !== null && maximo !== null && minimo > maximo) {
            results.replaceChildren(element('p', 'El precio mínimo no puede superar al máximo.', 'mensaje'));
            return;
        }

        const categoriaSeleccionada = category.input.value;
        const filtrados = productos.filter(producto => (
            (!categoriaSeleccionada || producto.tipo === categoriaSeleccionada)
            && (minimo === null || Number(producto.precio) >= minimo)
            && (maximo === null || Number(producto.precio) <= maximo)
        ));

        if (sort.input.value === 'nombre') {
            filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        } else if (sort.input.value === 'precio-asc') {
            filtrados.sort((a, b) => Number(a.precio) - Number(b.precio));
        } else if (sort.input.value === 'precio-desc') {
            filtrados.sort((a, b) => Number(b.precio) - Number(a.precio));
        }

        const contenido = [
            element('p', `${filtrados.length} ${filtrados.length === 1 ? 'producto encontrado' : 'productos encontrados'}`, 'resultado-conteo'),
        ];
        if (filtrados.length === 0) {
            contenido.push(element('p', 'No hay productos que coincidan con esos filtros.'));
        } else if (vista === 'tabla') {
            contenido.push(crearTablaProductos(filtrados));
        } else {
            filtrados.forEach(producto => contenido.push(crearTarjeta(producto)));
        }
        results.replaceChildren(...contenido);
    };

    const cargar = async () => {
        const solicitud = ++solicitudActual;
        results.replaceChildren(element('p', 'Buscando productos...'));
        try {
            const query = new URLSearchParams();
            if (buscar.input.value.trim()) query.set('q', buscar.input.value.trim());
            const datos = await requestJson(`productos.php?${query.toString()}`);
            if (renderId !== state.renderId || solicitud !== solicitudActual) return;
            productos = datos.productos;
            renderizarResultados();
        } catch {
            if (renderId === state.renderId && solicitud === solicitudActual) {
                results.replaceChildren(element('p', 'No se pudo cargar el catálogo.', 'mensaje mensaje-error'));
            }
        }
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        cargar();
    });
    buscar.input.addEventListener('input', cargar);
    category.input.addEventListener('change', renderizarResultados);
    minPrice.input.addEventListener('input', renderizarResultados);
    maxPrice.input.addEventListener('input', renderizarResultados);
    sort.input.addEventListener('change', renderizarResultados);
    clearButton.addEventListener('click', () => {
        form.reset();
        cargar();
    });
    await cargar();
}

function crearTablaProductos(productos) {
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Imagen', 'Producto', 'Categoría', 'Precio', 'Stock', 'Acciones'].forEach(text => {
        const th = element('th', text);
        th.scope = 'col';
        headerRow.appendChild(th);
    });
    head.appendChild(headerRow);
    const body = document.createElement('tbody');
    productos.forEach(producto => {
        const row = document.createElement('tr');
        const imageCell = document.createElement('td');
        const image = document.createElement('img');
        image.className = 'tabla-producto-imagen';
        configurarImagenProducto(image, producto);
        imageCell.appendChild(image);
        row.appendChild(imageCell);
        [producto.nombre, producto.categoria, formatearPrecio(producto.precio), String(producto.stock)]
            .forEach(text => row.appendChild(element('td', text)));
        const actions = document.createElement('td');
        actions.appendChild(link('Ver detalle', `#/productos/${producto.id}`));
        actions.appendChild(crearAccionProducto(producto, 'Agregar'));
        row.appendChild(actions);
        body.appendChild(row);
    });
    table.append(head, body);
    return table;
}

async function cargarProducto(id) {
    const datos = await requestJson(`productos.php?id=${encodeURIComponent(id)}`);
    return datos.producto;
}

async function renderProductDetail(id, renderId) {
    setPageTitle('Detalle de producto');
    const { section } = page('Detalle del producto', true);
    section.appendChild(element('p', 'Cargando producto...'));
    app.appendChild(section);

    if (!/^[1-9]\d*$/.test(id)) {
        section.replaceChildren(element('h1', 'Producto no encontrado'));
        section.appendChild(link('Volver al catálogo', '#/productos?vista=grilla', 'boton'));
        return;
    }

    try {
        const producto = await cargarProducto(id);
        if (renderId !== state.renderId) return;
        const heading = element('h1', producto.nombre);
        const image = document.createElement('img');
        configurarImagenProducto(image, producto);
        const details = element('div', '', 'detalle-grid');
        const info = document.createElement('div');
        info.append(
            element('p', producto.categoria),
            element('p', formatearPrecio(producto.precio), 'precio'),
            element('p', producto.descripcion),
            element('p', producto.stock > 0 ? `Stock disponible: ${producto.stock}` : 'Sin stock')
        );
        if (producto.especificaciones.length) {
            const list = document.createElement('dl');
            producto.especificaciones.forEach(spec => {
                const row = document.createElement('div');
                const [labelText, value] = spec.split(': ');
                row.append(element('dt', labelText), element('dd', value));
                list.appendChild(row);
            });
            info.appendChild(list);
        }
        if (producto.componentes?.length) {
            const partsHeading = element('h2', 'Componentes incluidos');
            const parts = document.createElement('ul');
            producto.componentes.forEach(part => {
                parts.appendChild(element('li', `${part.nombre} x${part.cantidad}`));
            });
            info.append(partsHeading, parts);
        }
        const actions = element('div', '', 'acciones');
        actions.appendChild(crearAccionProducto(producto));
        if (state.user?.rol !== 'administrador') {
            actions.appendChild(link('Ir al carrito', '#/carrito', 'boton boton-secundario'));
        }
        info.appendChild(actions);
        details.append(image, info);
        section.replaceChildren(heading, details);
    } catch (error) {
        if (renderId !== state.renderId) return;
        const heading = element('h1', error.status === 404 ? 'Producto no encontrado' : 'No se pudo cargar el producto');
        section.replaceChildren(heading, link('Volver al catálogo', '#/productos?vista=grilla', 'boton'));
    }
}

function leerCarrito() {
    const cartKey = claveCarritoActual();
    try {
        const guardado = localStorage.getItem(cartKey);
        if (!guardado) return [];
        const items = JSON.parse(guardado);
        if (!Array.isArray(items)) throw new Error('El carrito guardado no es una lista.');
        return items
            .map(item => ({ id: Number(item.id), cantidad: Math.floor(Number(item.cantidad)) }))
            .filter(item => Number.isInteger(item.id) && item.id > 0 && Number.isInteger(item.cantidad) && item.cantidad > 0);
    } catch {
        showNotice('No se pudo leer el carrito guardado; se vació para evitar datos inválidos.', 'error');
        try {
            localStorage.removeItem(cartKey);
        } catch {
            showNotice('El navegador no permite acceder al almacenamiento local.', 'error');
        }
        return [];
    }
}

function guardarCarrito(items) {
    if (state.user?.rol === 'administrador') {
        showNotice('Las cuentas de administrador no pueden modificar el carrito.', 'error');
        return false;
    }

    try {
        localStorage.setItem(claveCarritoActual(), JSON.stringify(items));
        updateCartCount();
        document.dispatchEvent(new Event('carrito:cambio'));
        return true;
    } catch {
        showNotice('No se pudo guardar el carrito en este navegador.', 'error');
        return false;
    }
}

async function agregarAlCarrito(producto) {
    if (state.user?.rol === 'administrador') {
        showNotice('Las cuentas de administrador no pueden agregar productos al carrito.', 'error');
        return;
    }

    try {
        const actualizados = await cargarProducto(producto.id);
        if (state.user?.rol === 'administrador') {
            showNotice('Las cuentas de administrador no pueden agregar productos al carrito.', 'error');
            return;
        }
        const items = leerCarrito();
        const item = items.find(row => row.id === Number(actualizados.id));
        const cantidadActual = item ? item.cantidad : 0;
        const cantidadNueva = Math.min(cantidadActual + 1, Number(actualizados.stock));
        if (cantidadNueva <= cantidadActual) {
            showNotice(`No hay más stock disponible de ${actualizados.nombre}.`, 'error');
            return;
        }
        if (item) item.cantidad = cantidadNueva;
        else items.push({ id: Number(actualizados.id), cantidad: 1 });
        if (state.user?.rol === 'administrador') {
            showNotice('Las cuentas de administrador no pueden agregar productos al carrito.', 'error');
            return;
        }
        if (guardarCarrito(items)) {
            showNotice(`${actualizados.nombre} agregado al carrito.`, 'exito');
        }
    } catch {
        showNotice('No se pudo agregar el producto. Actualizá el catálogo e intentá de nuevo.', 'error');
    }
}

async function obtenerProductosCarrito() {
    const datos = await requestJson('productos.php');
    const porId = new Map(datos.productos.map(producto => [Number(producto.id), producto]));
    return leerCarrito()
        .map(item => ({ ...item, producto: porId.get(item.id) }))
        .filter(item => item.producto);
}

async function renderCart(renderId) {
    setPageTitle('Carrito');
    const { section } = page('Carrito de compras', true);
    if (state.user?.rol === 'administrador') {
        section.append(
            element('p', 'Las compras solo están disponibles para cuentas de cliente. Desde Administración podés consultar y editar productos.'),
            link('Ir a administración', '#/admin', 'boton')
        );
        app.appendChild(section);
        return;
    }
    const list = element('ul', '', 'lista-carrito');
    list.appendChild(element('li', 'Cargando carrito...'));
    section.appendChild(list);
    app.appendChild(section);

    try {
        const items = await obtenerProductosCarrito();
        if (renderId !== state.renderId) return;
        list.replaceChildren();
        if (items.length === 0) {
            section.replaceChildren(element('h1', 'Tu carrito está vacío.'));
            section.appendChild(link('Ver productos', '#/productos?vista=grilla', 'boton'));
            return;
        }

        let total = 0;
        items.forEach(item => {
            const row = element('li', '', 'fila-carrito');
            const info = document.createElement('div');
            info.append(element('h2', item.producto.nombre), element('p', formatearPrecio(item.producto.precio)));
            const inputLabel = element('label', 'Cantidad');
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = String(item.producto.stock);
            input.value = String(item.cantidad);
            input.setAttribute('aria-label', `Cantidad de ${item.producto.nombre}`);
            input.addEventListener('change', () => {
                const nueva = Math.floor(Number(input.value));
                if (!Number.isInteger(nueva) || nueva < 1 || nueva > Number(item.producto.stock)) {
                    input.value = String(item.cantidad);
                    showNotice(`Ingresá una cantidad entre 1 y ${item.producto.stock}.`, 'error');
                    return;
                }
                const carrito = leerCarrito().map(rowItem =>
                    rowItem.id === item.id ? { ...rowItem, cantidad: nueva } : rowItem
                );
                guardarCarrito(carrito);
            });
            inputLabel.appendChild(input);
            const remove = button('Quitar', 'boton boton-secundario');
            remove.setAttribute('aria-label', `Quitar ${item.producto.nombre} del carrito`);
            remove.addEventListener('click', () => {
                guardarCarrito(leerCarrito().filter(rowItem => rowItem.id !== item.id));
                showNotice(`${item.producto.nombre} quitado del carrito.`, 'exito');
            });
            total += Number(item.producto.precio) * item.cantidad;
            row.append(info, inputLabel, remove);
            list.appendChild(row);
        });

        const totalText = element('p', `Total: ${formatearPrecio(total)}`, 'precio');
        totalText.setAttribute('aria-live', 'polite');
        const actions = element('div', '', 'resumen-acciones');
        actions.append(
            link('Continuar comprando', '#/productos?vista=grilla', 'boton boton-secundario'),
            link(state.user ? 'Finalizar compra' : 'Ingresar para comprar', state.user ? '#/checkout' : '#/login?next=checkout', 'boton')
        );
        section.append(totalText, actions);
    } catch {
        if (renderId === state.renderId) {
            section.replaceChildren(element('h1', 'No se pudo cargar el carrito'), link('Reintentar', '#/carrito', 'boton'));
        }
    }
}

async function renderCheckout(renderId) {
    setPageTitle('Finalizar compra');
    const { section } = page('Finalizar compra', true);
    if (state.user?.rol === 'administrador') {
        section.append(
            element('p', 'La cuenta de administrador no puede registrar compras. Desde Administración podés consultar y editar productos.'),
            link('Ir a administración', '#/admin', 'boton')
        );
        app.appendChild(section);
        return;
    }
    if (!state.user || state.user.rol !== 'cliente') {
        section.append(
            element('p', 'Para registrar una compra, iniciá sesión con una cuenta de cliente.'),
            link('Ingresar o registrarme', '#/login?next=checkout', 'boton')
        );
        app.appendChild(section);
        return;
    }

    const form = document.createElement('form');
    form.className = 'form-auth';
    const heading = element('h2', 'Datos de entrega');
    form.append(heading, element('p', `Compra a nombre de ${state.user.nombre} (${state.user.email}).`));
    const phone = field('Teléfono de contacto', 'telefono', 'tel', '', true, {
        maxlength: 20,
        autocomplete: 'tel',
        placeholder: 'Ej.: +54 376 4000000',
    });
    const address = field('Dirección de entrega', 'direccion', 'textarea', '', true, {
        maxlength: 255,
        autocomplete: 'street-address',
        rows: 3,
    });
    const payment = selectField('Medio de pago', 'metodo_pago', [
        ['Transferencia', 'Transferencia bancaria'],
        ['Tarjeta de Credito', 'Tarjeta de crédito'],
        ['Tarjeta de Debito', 'Tarjeta de débito'],
        ['Mercado Pago', 'Mercado Pago'],
        ['Efectivo', 'Efectivo'],
    ]);
    const status = element('p', '', 'mensaje');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const submit = button('Confirmar compra');
    submit.type = 'submit';
    form.append(phone.wrapper, address.wrapper, payment.wrapper, submit, status);
    const summary = element('div', '', 'panel');
    summary.setAttribute('aria-live', 'polite');
    summary.appendChild(element('p', 'Cargando resumen...'));
    section.append(form, element('h2', 'Resumen del pedido'), summary);
    app.appendChild(section);

    let items;
    try {
        items = await obtenerProductosCarrito();
        if (renderId !== state.renderId) return;
        summary.replaceChildren();
        if (items.length === 0) {
            summary.append(element('p', 'Tu carrito está vacío.'), link('Ver productos', '#/productos?vista=grilla', 'boton'));
            submit.disabled = true;
        } else {
            const list = document.createElement('ul');
            let total = 0;
            items.forEach(item => {
                total += Number(item.producto.precio) * item.cantidad;
                list.appendChild(element(
                    'li',
                    `${item.producto.nombre} x${item.cantidad}: ${formatearPrecio(Number(item.producto.precio) * item.cantidad)}`
                ));
            });
            summary.append(list, element('p', `Total: ${formatearPrecio(total)}`, 'precio'));
        }
    } catch {
        summary.replaceChildren(element('p', 'No se pudo cargar el resumen de compra.', 'mensaje mensaje-error'));
        submit.disabled = true;
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (state.user?.rol !== 'cliente') {
            status.className = 'mensaje mensaje-error';
            status.textContent = 'Solo las cuentas de cliente pueden completar una compra.';
            submit.disabled = true;
            return;
        }
        if (!items || items.length === 0) return;
        status.className = 'mensaje';
        status.textContent = 'Registrando compra...';
        submit.disabled = true;
        const payload = {
            telefono: phone.input.value.trim(),
            direccion: address.input.value.trim(),
            metodo_pago: payment.input.value,
            items: items.map(item => ({ id: item.id, cantidad: item.cantidad })),
        };
        try {
            const result = await requestJson('compras.php', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            guardarCarrito([]);
            showNotice(`Compra ${result.id_venta} registrada correctamente.`, 'exito');
            window.location.hash = '#/cuenta';
        } catch (error) {
            status.className = 'mensaje mensaje-error';
            status.textContent = error.message;
            submit.disabled = false;
        }
    });
}

function renderLogin(registro) {
    setPageTitle(registro ? 'Crear cuenta' : 'Ingresar');
    const { section } = page(registro ? 'Crear cuenta' : 'Ingreso de usuarios');
    const form = document.createElement('form');
    form.className = 'form-auth';
    form.noValidate = true;
    const status = element('p', '', 'mensaje');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    if (registro) {
        const nombre = field('Nombre', 'nombre', 'text', '', true, { maxlength: 100, autocomplete: 'given-name' });
        const apellido = field('Apellido', 'apellido', 'text', '', true, { maxlength: 100, autocomplete: 'family-name' });
        const email = field('Correo electrónico', 'email', 'email', '', true, { maxlength: 150, autocomplete: 'email' });
        const password = field('Contraseña (8 a 72 bytes)', 'password', 'password', '', true, {
            minlength: 8,
            maxlength: 72,
            autocomplete: 'new-password',
        });
        form.append(nombre.wrapper, apellido.wrapper, email.wrapper, password.wrapper);
    } else {
        const email = field('Correo electrónico', 'email', 'email', '', true, { maxlength: 150, autocomplete: 'email' });
        const password = field('Contraseña', 'password', 'password', '', true, { autocomplete: 'current-password' });
        form.append(email.wrapper, password.wrapper);
    }

    const submit = button(registro ? 'Crear cuenta' : 'Ingresar');
    submit.type = 'submit';
    form.append(submit, status);
    const switchText = registro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?';
    const switchLink = link(registro ? 'Ingresar' : 'Registrarme', registro ? '#/login' : '#/login?modo=registro');
    section.append(form, element('p', switchText), switchLink);
    app.appendChild(section);

    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        status.className = 'mensaje';
        status.textContent = registro ? 'Creando cuenta...' : 'Verificando credenciales...';
        submit.disabled = true;
        try {
            if (registro) {
                await requestJson('registro.php', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                status.className = 'mensaje mensaje-exito';
                status.textContent = 'Cuenta creada. Ahora podés ingresar.';
                window.location.hash = '#/login';
            } else {
                const result = await requestJson('login.php', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                state.user = result.usuario;
                updateHeader();
                const route = parseRoute();
                window.location.hash = route.query.get('next') === 'checkout'
                    ? '#/checkout'
                    : state.user.rol === 'administrador' ? '#/admin' : '#/cuenta';
            }
        } catch (error) {
            status.className = 'mensaje mensaje-error';
            status.textContent = error.message;
            submit.disabled = false;
        }
    });
}

async function renderAccount(renderId) {
    setPageTitle('Mi cuenta');
    const { section } = page('Mi cuenta', true);
    if (!state.user) {
        section.append(element('p', 'Iniciá sesión para ver tu cuenta y tus compras.'), link('Ingresar', '#/login', 'boton'));
        app.appendChild(section);
        return;
    }
    if (state.user.rol === 'administrador') {
        section.append(
            element('p', `Sesión iniciada como administrador: ${state.user.nombre}.`),
            element('p', state.user.email),
            link('Ir a administración', '#/admin', 'boton boton-secundario')
        );
        const logout = button('Cerrar sesión');
        logout.addEventListener('click', cerrarSesion);
        section.appendChild(logout);
        app.appendChild(section);
        return;
    }

    const loading = element('p', 'Cargando datos de la cuenta...');
    section.append(loading);
    app.appendChild(section);

    try {
        const data = await requestJson('mis_compras.php');
        if (renderId !== state.renderId) return;
        section.replaceChildren(element('h1', `Hola, ${data.usuario.nombre}`));
        section.append(element('p', data.usuario.email), element('h2', 'Mis compras'));
        if (data.compras.length === 0) {
            section.appendChild(element('p', 'Todavía no realizaste compras.'));
        } else {
            const purchases = element('ul', '', 'lista-compras');
            data.compras.forEach(purchase => {
                const item = element('li', '', 'fila-compra');
                item.append(
                    element('h3', `Compra #${purchase.id} - ${purchase.fecha}`),
                    element('p', `Pago: ${purchase.metodo_pago} | Total: ${formatearPrecio(purchase.total)}`),
                    element('p', `Entrega: ${purchase.direccion}`),
                );
                const lines = document.createElement('ul');
                purchase.items.forEach(line => {
                    lines.appendChild(element(
                        'li',
                        `${line.producto} x${line.cantidad} - ${formatearPrecio(line.subtotal)}`
                    ));
                });
                item.appendChild(lines);
                purchases.appendChild(item);
            });
            section.appendChild(purchases);
        }
        section.append(
            link('Continuar comprando', '#/productos?vista=grilla', 'boton boton-secundario'),
            button('Cerrar sesión', 'boton')
        );
        section.querySelector('button').addEventListener('click', cerrarSesion);
    } catch (error) {
        if (renderId === state.renderId) {
            section.replaceChildren(element('h1', 'No se pudo cargar la cuenta'), element('p', error.message, 'mensaje mensaje-error'));
        }
    }
}

async function cerrarSesion() {
    try {
        await requestJson('logout.php', { method: 'POST' });
        state.user = null;
        updateHeader();
        showNotice('Sesión finalizada correctamente.', 'exito');
        window.location.hash = '#/';
    } catch {
        showNotice('No se pudo cerrar la sesión en el servidor.', 'error');
    }
}

async function renderAdmin(renderId) {
    setPageTitle('Administración');
    const { section } = page('Administración de ANStore', true);
    if (!state.user || state.user.rol !== 'administrador') {
        section.append(element('p', 'Esta sección requiere una cuenta de administrador.'), link('Ingresar', '#/login', 'boton'));
        app.appendChild(section);
        return;
    }
    const portadaPanel = element('section', '', 'panel admin-portada');
    portadaPanel.appendChild(element('h2', 'Personalizar portada de inicio'));
    const portadaContent = element('div', 'Cargando configuración de portada...', 'admin-portada-contenido');
    portadaContent.setAttribute('aria-live', 'polite');
    portadaPanel.appendChild(portadaContent);
    const summaryPanel = element('section', '', 'panel admin-resumen');
    summaryPanel.appendChild(element('h2', 'Resumen de ventas y stock'));
    const summaryContent = element('div', 'Cargando resumen...', 'admin-resumen-contenido');
    summaryContent.setAttribute('aria-live', 'polite');
    summaryPanel.appendChild(summaryContent);
    const formArea = element('section', '', 'panel');
    formArea.appendChild(element('h2', state.editingProduct ? 'Editar producto' : 'Agregar producto'));
    const form = crearFormularioProducto(state.editingProduct);
    conectarFormularioAdmin(form);
    formArea.appendChild(form);
    const productsPanel = element('section', '', 'panel');
    productsPanel.appendChild(element('h2', 'Productos'));
    const products = element('ul', '', 'admin-lista');
    products.setAttribute('aria-live', 'polite');
    products.appendChild(element('li', 'Cargando productos...'));
    productsPanel.appendChild(products);
    const ordersPanel = element('section', '', 'panel');
    ordersPanel.appendChild(element('h2', 'Compras realizadas'));
    const orders = element('ul', '', 'lista-compras');
    orders.setAttribute('aria-live', 'polite');
    orders.appendChild(element('li', 'Cargando compras...'));
    ordersPanel.appendChild(orders);
    section.append(portadaPanel, summaryPanel, formArea, productsPanel, ordersPanel);
    app.appendChild(section);
    const portadaPromise = cargarFormularioPortada(portadaContent, renderId);

    try {
        const [productData, orderData] = await Promise.all([
            requestJson('admin/productos.php'),
            requestJson('admin/compras.php'),
        ]);
        if (renderId !== state.renderId) return;
        const stats = element('div', '', 'admin-resumen-tarjetas');
        [
            ['Ventas registradas', String(orderData.resumen.cantidad_compras)],
            ['Total vendido', formatearPrecio(orderData.resumen.total_vendido)],
            ['Productos con stock bajo', `${orderData.resumen.productos_bajo_stock.length} (≤ ${orderData.resumen.limite_stock_bajo})`],
        ].forEach(([title, value]) => {
            const card = element('article', '', 'admin-resumen-tarjeta');
            card.append(element('h3', title), element('p', value));
            stats.appendChild(card);
        });
        const lowStock = element('section', '', 'admin-stock-bajo');
        lowStock.appendChild(element('h3', `Stock bajo: ${orderData.resumen.limite_stock_bajo} unidades o menos`));
        if (orderData.resumen.productos_bajo_stock.length === 0) {
            lowStock.appendChild(element('p', 'No hay productos con stock bajo.'));
        } else {
            const lowStockList = document.createElement('ul');
            orderData.resumen.productos_bajo_stock.forEach(product => {
                lowStockList.appendChild(element(
                    'li',
                    `${product.nombre} — ${product.stock} ${product.stock === 1 ? 'unidad' : 'unidades'}`
                ));
            });
            lowStock.appendChild(lowStockList);
        }
        summaryContent.replaceChildren(stats, lowStock);

        products.replaceChildren();
        productData.productos.forEach(product => {
            const item = element('li', '', 'panel admin-producto');
            const thumbnail = document.createElement('img');
            thumbnail.className = 'admin-producto-imagen';
            configurarImagenProducto(thumbnail, product, true);
            const info = element('div');
            info.append(
                element('h3', product.nombre),
                element('p', `${product.categoria} | ${formatearPrecio(product.precio)} | Stock: ${product.stock}`)
            );
            const actions = element('div', '', 'acciones');
            const edit = button('Editar');
            edit.setAttribute('aria-label', `Editar ${product.nombre}`);
            edit.addEventListener('click', () => {
                state.editingProduct = product;
                renderRoute();
            });
            const remove = button('Eliminar', 'boton boton-secundario');
            remove.setAttribute('aria-label', `Eliminar ${product.nombre}`);
            remove.addEventListener('click', async () => {
                if (!window.confirm(`¿Eliminar ${product.nombre} del catálogo?`)) return;
                try {
                    await requestJson('admin/productos.php', {
                        method: 'DELETE',
                        body: JSON.stringify({ id: product.id }),
                    });
                    showNotice('Producto eliminado.', 'exito');
                    renderRoute();
                } catch (error) {
                    showNotice(error.message, 'error');
                }
            });
            actions.append(edit, remove);
            item.append(thumbnail, info, actions);
            products.appendChild(item);
        });
        if (productData.productos.length === 0) products.appendChild(element('li', 'Todavía no hay productos.'));

        orders.replaceChildren();
        orderData.compras.forEach(order => {
            const item = element('li', '', 'fila-compra');
            item.append(
                element('h3', `Compra #${order.id} - ${order.fecha}`),
                element('p', `${order.cliente.nombre} (${order.cliente.email})`),
                element('p', `Total: ${formatearPrecio(order.total)} | ${order.metodo_pago}`),
                element('p', `Entrega: ${order.direccion}`),
            );
            const lines = document.createElement('ul');
            order.items.forEach(line => lines.appendChild(element(
                'li',
                `${line.producto} x${line.cantidad} - ${formatearPrecio(line.subtotal)}`
            )));
            item.appendChild(lines);
            orders.appendChild(item);
        });
        if (orderData.compras.length === 0) orders.appendChild(element('li', 'Todavía no hay compras registradas.'));
    } catch (error) {
        if (renderId === state.renderId) {
            summaryContent.textContent = 'No se pudo cargar el resumen administrativo.';
            products.replaceChildren(element('li', error.message, 'mensaje mensaje-error'));
            orders.replaceChildren(element('li', error.message, 'mensaje mensaje-error'));
        }
    }
    await portadaPromise;
}

function leerArchivoComoDataURL(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('No se pudo leer la imagen seleccionada.'));
        });
        reader.addEventListener('error', () => reject(new Error('No se pudo leer la imagen seleccionada.')));
        reader.readAsDataURL(archivo);
    });
}

async function cargarFormularioPortada(contenido, renderId) {
    try {
        const datos = await requestJson('admin/portada.php');
        if (renderId !== state.renderId) return;
        const form = crearFormularioPortada(datos.portada);
        contenido.replaceChildren(form);
    } catch (error) {
        if (renderId === state.renderId) {
            contenido.replaceChildren(element('p', error.message, 'mensaje mensaje-error'));
        }
    }
}

function crearFormularioPortada(portada) {
    const form = document.createElement('form');
    const titulo = field('Título principal', 'titulo', 'text', portada.titulo, true, {
        maxlength: 100,
    });
    const subtitulo = field('Texto de apoyo', 'subtitulo', 'textarea', portada.subtitulo, true, {
        maxlength: 180,
        rows: 2,
    });
    const textoAlternativo = field(
        'Texto alternativo de la imagen',
        'texto_alternativo',
        'text',
        portada.texto_alternativo,
        true,
        {
            maxlength: 180,
            help: 'Describí brevemente la imagen para quienes usan lectores de pantalla.',
        }
    );
    const imagen = field(
        'Imagen de portada',
        'imagen_portada',
        'file',
        '',
        false,
        { help: 'JPEG, PNG o WebP; máximo 2 MB. Si no elegís otra, se conserva la imagen actual.' }
    );
    imagen.input.accept = 'image/jpeg,image/png,image/webp';

    const vistaPrevia = document.createElement('img');
    vistaPrevia.className = 'admin-portada-vista-previa';
    vistaPrevia.setAttribute('aria-hidden', 'true');
    configurarImagenPortada(vistaPrevia, portada);
    vistaPrevia.alt = '';

    const imagenControl = element('div', '', 'admin-imagen-control');
    imagenControl.append(imagen.wrapper, vistaPrevia);
    form.append(titulo.wrapper, subtitulo.wrapper, textoAlternativo.wrapper, imagenControl);

    const estado = element('p', '', 'mensaje');
    estado.setAttribute('role', 'status');
    estado.setAttribute('aria-live', 'polite');
    form.appendChild(estado);

    let restaurarImagen = false;
    imagen.input.addEventListener('change', async () => {
        const archivo = imagen.input.files?.[0];
        imagen.input.setCustomValidity('');
        restaurarImagen = false;
        if (!archivo) {
            configurarImagenPortada(vistaPrevia, portada);
            vistaPrevia.alt = '';
            estado.textContent = '';
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)
            || archivo.size > 2 * 1024 * 1024) {
            const mensaje = 'Elegí una imagen JPEG, PNG o WebP de hasta 2 MB.';
            imagen.input.setCustomValidity(mensaje);
            estado.className = 'mensaje mensaje-error';
            estado.textContent = mensaje;
            return;
        }

        try {
            vistaPrevia.src = await leerArchivoComoDataURL(archivo);
            vistaPrevia.alt = '';
            estado.className = 'mensaje';
            estado.textContent = 'Vista previa lista. Se guardará al actualizar la portada.';
        } catch (error) {
            imagen.input.setCustomValidity(error.message);
            estado.className = 'mensaje mensaje-error';
            estado.textContent = error.message;
        }
    });

    const actions = element('div', '', 'acciones');
    const submit = button('Guardar portada');
    submit.type = 'submit';
    const restore = button('Usar ilustración predeterminada', 'boton boton-secundario');
    restore.addEventListener('click', () => {
        restaurarImagen = true;
        imagen.input.value = '';
        imagen.input.setCustomValidity('');
        vistaPrevia.src = 'images/hero-gaming-pc.svg';
        vistaPrevia.alt = '';
        estado.className = 'mensaje';
        estado.textContent = 'Se usará la ilustración predeterminada al guardar.';
    });
    actions.append(submit, restore);
    form.appendChild(actions);

    form.addEventListener('submit', event => guardarPortadaAdmin(event, form, () => restaurarImagen));
    return form;
}

async function guardarPortadaAdmin(event, form, restaurarImagen = () => false) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const archivo = form.elements.imagen_portada.files?.[0];
    const payload = {
        titulo: form.elements.titulo.value,
        subtitulo: form.elements.subtitulo.value,
        texto_alternativo: form.elements.texto_alternativo.value,
    };
    if (restaurarImagen()) {
        payload.imagen = null;
    } else if (archivo) {
        try {
            const dataUrl = await leerArchivoComoDataURL(archivo);
            const separador = dataUrl.indexOf(',');
            if (separador < 0) throw new Error('No se pudo preparar la imagen seleccionada.');
            payload.imagen = {
                mime: archivo.type,
                base64: dataUrl.slice(separador + 1),
            };
        } catch (error) {
            const status = form.querySelector('[role="status"]');
            status.className = 'mensaje mensaje-error';
            status.textContent = error.message;
            return;
        }
    }

    const status = form.querySelector('[role="status"]');
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.className = 'mensaje';
    status.textContent = 'Guardando portada...';
    try {
        await requestJson('admin/portada.php', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        showNotice('Portada actualizada.', 'exito');
        renderRoute();
    } catch (error) {
        status.className = 'mensaje mensaje-error';
        status.textContent = error.message;
        submit.disabled = false;
    }
}

function crearFormularioProducto(producto, tipoInicial = 'PROCESADOR') {
    const form = document.createElement('form');
    form.className = 'form-admin';
    const editing = Boolean(producto);
    let tipo = producto ? producto.tipo : tipoInicial;

    if (!editing) {
        const typeField = selectField('Tipo de producto', 'tipo', [
            ['PROCESADOR', 'Procesador'],
            ['MEMORIA_RAM', 'Memoria RAM'],
            ['TARJETA_MADRE', 'Tarjeta madre'],
            ['FUENTE_PODER', 'Fuente de poder'],
            ['PLACA_VIDEO', 'Placa de video'],
            ['GABINETE', 'Gabinete'],
            ['PC_ARMADA', 'Computadora armada'],
        ], tipo);
        form.appendChild(typeField.wrapper);
    }

    const common = element('div', '', 'campos-producto');
    form.appendChild(common);
    const price = field('Precio', 'precio', 'number', producto?.precio ?? '', true, { min: 0, max: 99999999.99, step: 0.01 });
    const stock = field('Stock', 'stock', 'number', producto?.stock ?? '', true, { min: 0, max: 2147483647 });
    common.append(price.wrapper, stock.wrapper);

    if (tipo === 'PC_ARMADA') {
        const name = field('Nombre de la PC', 'nombre', 'text', producto?.nombre ?? '', true, { maxlength: 100 });
        const date = field('Fecha de armado', 'fecha_armado', 'date', producto?.fecha_armado ?? new Date().toISOString().slice(0, 10), true);
        common.append(name.wrapper, date.wrapper);
        if (!editing) {
            const ids = field('Componentes (ID:cantidad, separados por coma)', 'componentes_texto', 'text', '', true, {
                placeholder: '1:1, 2:2, 3:1',
                help: 'Usá los identificadores de componentes que aparecen en la lista de productos.',
            });
            common.appendChild(ids.wrapper);
        }
    } else {
        const brand = field('Marca', 'marca', 'text', producto?.marca ?? '', true, { maxlength: 50 });
        const model = field('Modelo', 'modelo', 'text', producto?.modelo ?? '', true, { maxlength: 100 });
        common.append(brand.wrapper, model.wrapper);

        if (!editing) {
            if (tipo === 'PROCESADOR') {
                common.append(
                    field('Consumo (W)', 'consumo', 'number', '', true, { min: 1 }).wrapper,
                    field('Frecuencia (MHz)', 'frecuencia', 'number', '', true, { min: 1 }).wrapper,
                    field('Socket', 'socket', 'text', '', true, { maxlength: 20 }).wrapper
                );
            } else if (tipo === 'MEMORIA_RAM') {
                common.append(
                    field('Frecuencia (MHz)', 'frecuencia_mhz', 'number', '', true, { min: 1 }).wrapper,
                    field('Capacidad (GB)', 'capacidad_gb', 'number', '', true, { min: 1 }).wrapper,
                    field('Tipo de RAM', 'tipo_ram', 'text', '', true, { maxlength: 10 }).wrapper
                );
            } else if (tipo === 'TARJETA_MADRE') {
                common.append(
                    field('Chipset', 'chipset', 'text', '', true, { maxlength: 50 }).wrapper,
                    field('Formato (ATX, mATX o ITX)', 'formato', 'text', '', true, { maxlength: 10 }).wrapper,
                    field('Socket', 'socket', 'text', '', true, { maxlength: 20 }).wrapper,
                    field('Tipo de RAM', 'tipo_ram', 'text', '', true, { maxlength: 10 }).wrapper,
                    field('PCIe', 'pcie', 'text', '', true, { maxlength: 10 }).wrapper
                );
            } else if (tipo === 'FUENTE_PODER') {
                common.append(
                    field('Certificación', 'certificacion', 'text', '', true, { maxlength: 50 }).wrapper,
                    field('Potencia (W)', 'potencia', 'number', '', true, { min: 1 }).wrapper,
                    field('Tipo de fuente', 'tipo_fuente', 'text', '', true, { maxlength: 30 }).wrapper
                );
            } else if (tipo === 'PLACA_VIDEO') {
                common.append(
                    field('Consumo (W)', 'consumo', 'number', '', true, { min: 1 }).wrapper,
                    field('Memoria VRAM (GB)', 'memoria_vram_gb', 'number', '', true, { min: 1 }).wrapper,
                    field('PCIe', 'pcie', 'text', '', true, { maxlength: 10 }).wrapper
                );
            } else if (tipo === 'GABINETE') {
                const formats = element('fieldset');
                formats.appendChild(element('legend', 'Formatos admitidos'));
                ['ATX', 'mATX', 'ITX'].forEach(format => {
                    const label = element('label', '', 'campo-check');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'formatos';
                    checkbox.value = format;
                    checkbox.dataset.formato = '';
                    label.append(checkbox, element('span', format));
                    formats.appendChild(label);
                });
                common.appendChild(formats);
            }
        }
    }

    const status = element('p', '', 'mensaje');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const imageField = field(
        'Imagen del producto',
        'imagen',
        'file',
        '',
        false,
        { help: 'JPEG, PNG o WebP; máximo 2 MB. Si no elegís otra, se conserva la imagen actual.' }
    );
    imageField.input.accept = 'image/jpeg,image/png,image/webp';
    const preview = document.createElement('img');
    preview.className = 'admin-imagen-vista-previa';
    preview.alt = '';
    preview.setAttribute('aria-hidden', 'true');
    configurarImagenProducto(preview, producto || { nombre: 'producto', imagen: null }, true);
    const imageControl = element('div', '', 'admin-imagen-control');
    imageControl.append(imageField.wrapper, preview);
    common.appendChild(imageControl);
    imageField.input.addEventListener('change', async () => {
        const archivo = imageField.input.files?.[0];
        imageField.input.setCustomValidity('');
        if (!archivo) {
            configurarImagenProducto(preview, producto || { nombre: 'producto', imagen: null }, true);
            status.textContent = '';
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)
            || archivo.size > 2 * 1024 * 1024) {
            const mensaje = 'Elegí una imagen JPEG, PNG o WebP de hasta 2 MB.';
            imageField.input.setCustomValidity(mensaje);
            status.className = 'mensaje mensaje-error';
            status.textContent = mensaje;
            return;
        }

        try {
            preview.src = await leerArchivoComoDataURL(archivo);
            status.className = 'mensaje';
            status.textContent = 'Vista previa lista. Se guardará con el producto.';
        } catch (error) {
            imageField.input.setCustomValidity(error.message);
            status.className = 'mensaje mensaje-error';
            status.textContent = error.message;
        }
    });
    form.appendChild(status);
    const submit = button(editing ? 'Guardar cambios' : 'Crear producto');
    submit.type = 'submit';
    form.appendChild(submit);
    if (editing) {
        const cancel = button('Cancelar edición', 'boton boton-secundario');
        cancel.addEventListener('click', () => {
            state.editingProduct = null;
            renderRoute();
        });
        form.appendChild(cancel);
    }
    return form;
}

function conectarFormularioAdmin(form) {
    form.addEventListener('submit', event => guardarProductoAdmin(event, form));
    const typeSelect = form.querySelector('#campo-tipo');
    typeSelect?.addEventListener('change', () => {
        const replacement = crearFormularioProducto(null, typeSelect.value);
        form.replaceWith(replacement);
        conectarFormularioAdmin(replacement);
    });
}

async function guardarProductoAdmin(event, form) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const editing = Boolean(state.editingProduct);
    const values = Object.fromEntries(new FormData(form).entries());
    const payload = { ...values };
    const archivoImagen = payload.imagen instanceof File && payload.imagen.size > 0
        ? payload.imagen
        : null;
    delete payload.imagen;
    ['precio', 'stock', 'consumo', 'frecuencia', 'frecuencia_mhz', 'capacidad_gb', 'potencia', 'memoria_vram_gb']
        .forEach(key => {
            if (key in payload) payload[key] = Number(payload[key]);
        });

    if (payload.tipo === 'PC_ARMADA' || state.editingProduct?.tipo === 'PC_ARMADA') {
        const text = payload.componentes_texto || '';
        payload.componentes = text.split(',').map(part => part.trim()).filter(Boolean).map(part => {
            const [id, cantidad] = part.split(':').map(Number);
            return { id, cantidad };
        });
        delete payload.componentes_texto;
    }
    if (payload.tipo === 'GABINETE') {
        payload.formatos = [...form.querySelectorAll('[data-formato]:checked')].map(input => input.value);
    }
    if (editing) payload.id = Number(state.editingProduct.id);

    const status = form.querySelector('[role="status"]');
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Guardando producto...';
    try {
        if (archivoImagen) {
            const dataUrl = await leerArchivoComoDataURL(archivoImagen);
            const separador = dataUrl.indexOf(',');
            if (separador < 0) throw new Error('No se pudo preparar la imagen seleccionada.');
            payload.imagen = {
                mime: archivoImagen.type,
                base64: dataUrl.slice(separador + 1),
            };
        }
        await requestJson('admin/productos.php', {
            method: editing ? 'PUT' : 'POST',
            body: JSON.stringify(payload),
        });
        state.editingProduct = null;
        showNotice(editing ? 'Producto actualizado.' : 'Producto creado.', 'exito');
        renderRoute();
    } catch (error) {
        status.className = 'mensaje mensaje-error';
        status.textContent = error.message;
        submit.disabled = false;
    }
}

function renderNotFound() {
    setPageTitle('Página no encontrada');
    const { section } = page('Página no encontrada');
    section.appendChild(link('Volver al inicio', '#/', 'boton'));
    app.appendChild(section);
}

document.addEventListener('DOMContentLoaded', async () => {
    nav.hidden = window.matchMedia('(max-width: 760px)').matches;
    menuButton.addEventListener('click', () => {
        nav.hidden = !nav.hidden;
        menuButton.setAttribute('aria-expanded', String(!nav.hidden));
        menuButton.setAttribute('aria-label', nav.hidden ? 'Abrir menú' : 'Cerrar menú');
    });
    document.addEventListener('click', event => {
        const navigationLink = event.target.closest('a[data-nav]');
        if (navigationLink && window.matchMedia('(max-width: 760px)').matches) {
            nav.hidden = true;
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Abrir menú');
        }
    });
    window.addEventListener('hashchange', () => renderRoute());
    window.addEventListener('storage', event => {
        if (event.key === claveCarritoActual() || event.key === null) {
            updateCartCount();
            if (parseRoute().pathname === '/carrito') renderRoute();
        }
    });
    document.addEventListener('carrito:cambio', () => {
        updateCartCount();
        if (parseRoute().pathname === '/carrito') renderRoute();
    });
    window.addEventListener('resize', () => {
        if (!window.matchMedia('(max-width: 760px)').matches) {
            nav.hidden = false;
            menuButton.setAttribute('aria-expanded', 'false');
            menuButton.setAttribute('aria-label', 'Abrir menú');
        }
    });
    await cargarSesion();
    try {
        // La clave anterior no identificaba al dueño y no puede migrarse con seguridad.
        localStorage.removeItem(CART_KEY);
    } catch {
        showNotice('No se pudo limpiar el carrito compartido anterior.', 'error');
    }
    await renderRoute(false);
});
