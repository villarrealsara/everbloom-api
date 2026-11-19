# EVERBLOOM API - Lista de endpoints

Aprendiz: Sara Julieth Villarreal Ortiz - Ficha 3235896
Evidencia: GA7-220501096-AA5-EV03 (la misma lista se usa en la AA5-EV04)

Dirección base: `http://localhost:3000`. Las rutas con **Token** o **Administrador** necesitan el encabezado `Authorization: Bearer <token>` (el token se obtiene en `POST /api/auth/login`).

| Método | Ruta | Quién puede | Qué hace | Datos que recibe (JSON) | Códigos de estado |
|---|---|---|---|---|---|
| GET | `/api/salud` | Público | Revisar que la API está encendida | — | 200 |
| POST | `/api/auth/registro` | Público | Registrar un usuario (rol Cliente) | nombres, apellidos, correo, contrasena, telefono (opcional) | 201, 400, 409 |
| POST | `/api/auth/login` | Público | Iniciar sesión; devuelve un token | correo, contrasena | 200, 400, 401, 403 |
| GET | `/api/auth/perfil` | Token | Datos del usuario que inició sesión | — | 200, 401 |
| GET | `/api/categorias` | Público | Listar categorías | — | 200 |
| GET | `/api/categorias/:id` | Público | Consultar una categoría | — | 200, 400, 404 |
| POST | `/api/categorias` | Administrador | Crear categoría | nombreCategoria, descripcion (opcional) | 201, 400, 401, 403, 409 |
| PUT | `/api/categorias/:id` | Administrador | Actualizar categoría | nombreCategoria, descripcion (opcional) | 200, 400, 401, 403, 404 |
| DELETE | `/api/categorias/:id` | Administrador | Eliminar categoría (si no tiene productos) | — | 204, 401, 403, 404, 409 |
| GET | `/api/productos` | Público | Listar productos; filtros ?busqueda=texto e ?idCategoria=n | — | 200 |
| GET | `/api/productos/:id` | Público | Consultar un producto (incluye la cantidad en inventario) | — | 200, 400, 404 |
| POST | `/api/productos` | Administrador | Crear producto con su inventario inicial | idCategoria, nombreProducto, precio, descripcion, imagen, cantidad (opcionales) | 201, 400, 401, 403 |
| PUT | `/api/productos/:id` | Administrador | Actualizar producto | idCategoria, nombreProducto, precio, descripcion, imagen, estadoProducto | 200, 400, 401, 403, 404 |
| DELETE | `/api/productos/:id` | Administrador | Eliminar producto (si no está en pedidos) | — | 204, 401, 403, 404, 409 |
| PUT | `/api/productos/:id/inventario` | Administrador | Cambiar la cantidad disponible | cantidad | 200, 400, 401, 403, 404 |
| GET | `/api/empaques` | Público | Listar empaques para el regalo | — | 200 |
| POST | `/api/pedidos` | Cliente con sesión | Crear pedido y descontar inventario | items: [{ idProducto, cantidad, idEmpaque, color, mensajeTarjeta }] | 201, 400, 401, 404, 409 |
| GET | `/api/pedidos` | Token | Cliente: sus pedidos. Administrador: todos. Filtros ?estado=&desde=&hasta= | — | 200, 401 |
| GET | `/api/pedidos/:id` | Token | Consultar un pedido con sus productos (el cliente solo ve los suyos) | — | 200, 400, 401, 404 |
| PATCH | `/api/pedidos/:id/estado` | Administrador | Cambiar el estado del pedido | estadoPedido: Pendiente, En proceso, Enviado o Entregado | 200, 400, 401, 403, 404, 409 |
| GET | `/api/reportes/resumen` | Administrador | Resumen de ventas: pedidos por estado y productos más vendidos | — | 200, 401, 403 |

## Códigos de estado que usa la API
| Código | Significado | Cuándo sale |
|---|---|---|
| 200 | OK | La consulta o el cambio salió bien |
| 201 | Creado | Se creó un registro nuevo |
| 204 | Sin contenido | Se eliminó correctamente |
| 400 | Petición incorrecta | Faltan datos, tienen mal formato o el JSON está mal escrito |
| 401 | No autenticado | Falta el token, es falso o venció; o el correo/contraseña son incorrectos |
| 403 | Prohibido | El usuario no tiene el rol necesario (o está inactivo) |
| 404 | No encontrado | El recurso o la ruta no existe |
| 409 | Conflicto | Correo repetido, inventario insuficiente, o no se puede eliminar porque está en uso |
| 500 | Error del servidor | Error inesperado (el mensaje no muestra detalles internos) |

## Forma de las respuestas
Éxito: el objeto o la lista en JSON. Error: siempre `{ "error": "mensaje" }`; en errores de validación se agrega `"detalles": [ ... ]` con cada problema encontrado.
