const menuToggle = document.getElementById('menuToggle');
const headerPrincipal = document.querySelector('.header-principal');

menuToggle.addEventListener('click', function() {
    headerPrincipal.classList.toggle('menu-abierto');
});