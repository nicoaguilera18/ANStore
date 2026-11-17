# ANStore - Trabajo Final Integrador - AE4

Tienda web de componentes de computadora y computadoras armadas. Este proyecto evoluciona la maqueta de AE1 a una SPA JavaScript Vanilla conectada por JSON a una API PHP y al modelo relacional MySQL seleccionado en el trabajo de Base de Datos.

## Integrantes

- Aguilera Danese Leandro Nicolás
- Schenone Bravo Agustín Ezequiel

## Arquitectura

```text
ANStore/
|-- api/                         Controladores REST; respuestas JSON y HTTP
|   |-- admin/                   Endpoints protegidos de productos, compras y portada
|   |-- bootstrap.php            Validación HTTP, JSON, sesión y errores
|   |-- portada.php              Configuración pública de portada
|   |-- login.php
|   |-- registro.php
|   |-- sesion.php
|   |-- productos.php
|   |-- compras.php
|   |-- mis_compras.php
|   `-- logout.php
|-- config/
|   `-- conexion.php             Conexion PDO con MySQL
|-- database/
|   |-- anstore.sql              Modelo gestion_hardware, vistas, procedimiento, triggers y datos
|   |-- actualizar_imagen_productos.sql  Migración de imágenes para bases ya instaladas
|   `-- actualizar_portada_inicio.sql    Migración de configuración de portada
|-- models/                      Consultas PDO y reglas de persistencia
|-- public/                      Vista SPA (HTML5, CSS3 y JavaScript Vanilla)
|   |-- index.html
|   |-- images/                  Portada gamer, imágenes y placeholder
|   |-- css/style.css
|   `-- js/app.js
|-- scripts/
|   `-- crear_admin.php          Provisionamiento local de una cuenta administradora
|-- docs/                        Informe AE4 y evidencias visuales
`-- README.md
```

El cliente y la API se comunican mediante `fetch()` y JSON. Las vistas del catálogo, detalle, carrito, compra, cuenta, portada e inventario se renderizan desde `public/js/app.js`; los datos de productos, clientes, compras y configuración de portada se leen y persisten en MySQL.

El carrito se guarda en el navegador con una clave separada para cada usuario (rol e id) y otra para visitantes; así no se mezcla al cerrar sesión o cambiar de cuenta en el mismo navegador. El carrito previo, que usaba una clave compartida sin identificar a su dueño, se descarta al iniciar la aplicación para evitar asignarlo a otra persona. Los carritos no se sincronizan entre dispositivos.

## Controles según el rol

Las cuentas de administrador pueden recorrer el catálogo y consultar el detalle completo de los productos. En lugar de un control para agregar al carrito, se muestra **Editar desde administración**; al usarlo, se abre el formulario administrativo con ese producto seleccionado. El carrito y el checkout bloquean la navegación de administradores, y el envío del formulario de compra vuelve a comprobar que la sesión corresponda a un cliente. Las cuentas de cliente sí pueden agregar productos, revisar el carrito y completar compras; la API también exige una sesión de cliente para registrar una compra.

## Puesta en marcha con XAMPP

1. Copie la carpeta `ANStore` dentro de `C:\xampp\htdocs`.
2. Inicie Apache y MySQL desde XAMPP.
3. En phpMyAdmin, importar `database/anstore.sql` una sola vez. El script crea la base `gestion_hardware`; está pensado para ejecutarse sobre una base vacía y no elimina bases existentes.
4. Si ya tenía una base `gestion_hardware` anterior a las imágenes de productos y todavía no existe `producto.imagen`, ejecute una sola vez `database/actualizar_imagen_productos.sql`. Para agregar la portada editable, ejecute `database/actualizar_portada_inicio.sql`; esta migración se puede repetir sin sobrescribir una portada ya configurada.
5. Si MySQL no usa `root` sin contraseña, actualize las variables de conexión en `config/conexion.php`.
6. Para habilitar el acceso de administrador, abra una consola en la carpeta del proyecto y ejecute:

   ```powershell
   C:\xampp\php\php.exe scripts\crear_admin.php
   ```

   El asistente solicita nombre, correo y contraseña; la contraseña se guarda con BCRYPT. La cuenta inicial de catálogo `admin@anstore.com` queda sin contraseña hasta completar este paso.
7. Abra `http://localhost/ANStore/`. La página inicial redirige a la SPA en `public/`.

El script incluye dos cuentas de cliente de prueba:

- `agustin@anstore.com` — `Contraseña2026`
- `test@anstore.com` — `UserSecure123`

Las contraseñas de prueba se almacenan únicamente como hashes BCRYPT. No uses estos datos de demostración en una instalación pública.

## Casos de uso cubiertos

- Consultar el catálogo como grilla o tabla y cambiar entre ambas vistas.
- Filtrar por nombre, categoría y rango de precios; ordenar por nombre o precio.
- Ver imágenes de producto y, desde administración, cargar o reemplazar una imagen local.
- Personalizar la portada desde Administración: imagen, título, texto de apoyo y texto alternativo; también se puede volver a la ilustración predeterminada.
- Ver el detalle de componentes y computadoras armadas.
- Desde una cuenta de cliente, revisar el carrito y completar una compra con datos de entrega y medio de pago.
- Registrarse, iniciar/cerrar sesión y consultar el historial propio de compras.
- Desde una cuenta de administrador, consultar el detalle y editar productos desde el acceso a Administración o el panel, administrar el catálogo (alta y baja), consultar ventas y detectar productos con stock bajo (5 unidades o menos). No puede agregar productos al carrito ni completar compras.

La carga de imágenes acepta JPEG, PNG y WebP de hasta 2 MB; el servidor valida tipo real y dimensiones, y guarda los archivos en `public/images/products/`. El API conserva JSON y recibe la imagen como `{ "imagen": { "mime": "image/png", "base64": "..." } }`. Las animaciones de interfaz respetan `prefers-reduced-motion`.

La portada usa una ilustración SVG local mientras no se cargue una imagen propia. Su configuración se guarda en MySQL; las imágenes personalizadas van a `public/images/site/` con los mismos formatos y límites que las imágenes de producto.

Las compras requieren una sesión de cliente; los precios y el stock se validan en el servidor dentro de una transacción. El cliente nunca determina el precio final.

## Inventario de endpoints

Todos los endpoints devuelven `application/json; charset=utf-8`. En los ejemplos, la URL base es `http://localhost/ANStore/api/`.

| Método y URL | Entrada | Salida exitosa | Códigos relevantes |
|---|---|---|---|
| `GET sesion.php` | Cookie de sesión | `usuario` con id, nombre, email y rol | 200, 401 |
| `POST login.php` | `{ "email", "password" }` | Usuario autenticado; cookie de sesión | 200, 400, 401, 500 |
| `POST registro.php` | `{ "nombre", "apellido", "email", "password" }` | Id de cliente registrado | 201, 400, 409, 500 |
| `POST logout.php` | Cookie de sesión | Mensaje de cierre | 200, 405 |
| `GET productos.php` | Opcional: `q` | `{ "productos": [...] }` | 200, 400, 500 |
| `GET productos.php?id={id}` | Id entero positivo | `{ "producto": {...} }` | 200, 400, 404, 500 |
| `GET portada.php` | Público | `{ "portada": { "titulo", "subtitulo", "texto_alternativo", "imagen" } }` | 200, 405, 500 |
| `POST compras.php` | Sesión cliente y `{ "metodo_pago", "direccion", "telefono", "items": [{ "id", "cantidad" }] }` | Id de venta | 201, 400, 401, 404, 409, 500 |
| `GET mis_compras.php` | Sesión de cliente | Datos propios e historial de compras | 200, 401, 403, 500 |
| `GET admin/productos.php` | Sesión administrador | Catálogo de administración | 200, 401, 403, 500 |
| `POST admin/productos.php` | Sesión administrador, datos tipados del producto e imagen opcional `{ "mime", "base64" }` | Id creado | 201, 400, 401, 403, 409, 500 |
| `PUT admin/productos.php` | Sesión administrador, `{ "id", "precio", "stock", ... }` e imagen opcional `{ "mime", "base64" }` | Mensaje de actualización | 200, 400, 401, 403, 404, 409, 500 |
| `DELETE admin/productos.php` | Sesión administrador y `{ "id" }` | Mensaje de eliminación | 200, 400, 401, 403, 404, 409, 500 |
| `GET admin/compras.php` | Sesión administrador | Compras, clientes y `resumen` (ventas y productos con stock bajo) | 200, 401, 403, 500 |
| `GET admin/portada.php` | Sesión administrador | Configuración actual de portada | 200, 401, 403, 405, 500 |
| `PUT admin/portada.php` | Sesión administrador, `{ "titulo", "subtitulo", "texto_alternativo" }` e imagen opcional Base64 o `null` para restaurar | Confirmación de actualización | 200, 400, 401, 403, 405, 500 |

Los métodos no admitidos responden `405 Method Not Allowed`. Un visitante recibe `401` al solicitar recursos privados; una sesión autenticada sin rol administrador recibe `403` en las rutas de administración.

## Informe AE4 y evidencias

- `docs/Informe_Tecnico_AE4_ANStore.pdf`: informe técnico para la entrega.

## Evidencias técnicas para la autoevaluación

- **Adecuación funcional:** catálogo, detalle, carrito, compra, historial y administración conectados con la API y el modelo relacional; los flujos principales se probaron en XAMPP.
- **Eficiencia de desempeño:** consumo asíncrono con `fetch()` y consultas preparadas. No se informa un puntaje de rendimiento ni una prueba de carga.
- **Compatibilidad:** interfaz estática en `public/`, API PHP desacoplada y persistencia MySQL; la vista se probó en Chrome con XAMPP.
- **Fiabilidad:** transacción/rollback de compra, bloqueo de stock, triggers de actualización y auditoría; compra por encima del stock disponible rechazada con HTTP 409.
- **Seguridad:** BCRYPT, regeneración de sesión, control de rol, PDO con parámetros nombrados y renderizado de texto con `textContent`; se verificaron HTTP 401 para acceso anónimo y 403 para cliente en ruta administrativa.
- **Usabilidad y accesibilidad:** controles nativos, foco `:focus-visible`, regiones `aria-live`, enlace de salto y prueba de navegación por teclado. Ver matriz y capturas en `docs/`.
- **Mantenibilidad:** controladores en `api/`, persistencia en `models/`, configuración separada y cliente en `public/js/app.js`.

