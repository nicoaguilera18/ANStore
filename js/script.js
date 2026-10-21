const menuToggle = document.getElementById('menuToggle');
const headerPrincipal = document.querySelector('.header-principal');

menuToggle.addEventListener('click', function() {
    headerPrincipal.classList.toggle('menu-abierto');
});
function mostrarFeedback(mensaje, tipo) {
  feedback.textContent = mensaje; // Escribe el texto dentro del <div>
  feedback.className = `mensaje-alerta alerta-${tipo}`; // Aplica el diseño CSS
}