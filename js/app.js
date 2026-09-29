let listaProductos = [];

async function cargarProductos() {
    const respuesta = await fetch('productos.json');
    listaProductos = await respuesta.json();
    mostrarProductos(listaProductos);
}

function mostrarProductos(productos) {
    const contenedor = document.getElementById('productosGrid');

    contenedor.innerHTML = productos.map(function(producto) {
        return `
            <article class="producto">
                <img src="https://placehold.co/300x300/1A1A1A/F5D033?text=${producto.nombre.replace(' ', '+')}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <p class="precio">$${producto.precio}</p>
                <a href="producto.html" class="btn">Ver</a>
            </article>
        `;
    }).join('');
}

const inputBuscador = document.getElementById('buscador');

inputBuscador.addEventListener('input', function() {
    const texto = inputBuscador.value.trim().toLowerCase();

    const filtrados = listaProductos.filter(function(producto) {
        return producto.nombre.toLowerCase().includes(texto);
    });

    mostrarProductos(filtrados);
});

cargarProductos();