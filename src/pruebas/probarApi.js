// Prueba automatica de la API completa: levanta el servidor, manda peticiones reales y revisa
// los codigos de estado y las respuestas JSON. Ejecutar con:  npm run probar
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { crearApp } from '../app.js';
import { pool, cerrarBaseDatos } from '../config/baseDatos.js';
import { obtenerIdRol } from '../models/usuarioModel.js';

const servidor = crearApp().listen(0);
const base = `http://localhost:${servidor.address().port}/api`;
const sufijo = Date.now();
const correoCliente = `cliente.${sufijo}@everbloom.com`;
const correoAdmin = `admin.${sufijo}@everbloom.com`;
const correoOtro = `otro.${sufijo}@everbloom.com`;
let total = 0;
let fallas = 0;

async function llamar(metodo, ruta, cuerpo, token) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (token) opciones.headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  const respuesta = await fetch(base + ruta, opciones);
  const texto = await respuesta.text();
  return { estado: respuesta.status, datos: texto ? JSON.parse(texto) : null };
}
function revisar(nombre, condicion) {
  total += 1;
  if (!condicion) fallas += 1;
  console.log(`${condicion ? 'OK    ' : 'FALLA '} ${nombre}`);
}
async function crearAdminDePrueba() {
  const salt = randomBytes(16).toString('hex');
  const hash = (await promisify(scrypt)('claveAdmin1', salt, 64)).toString('hex');
  const idRol = await obtenerIdRol('Administrador');
  await pool.execute(
    "INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena) VALUES (?, 'Admin', 'Prueba', ?, ?)",
    [idRol, correoAdmin, `${salt}:${hash}`],
  );
}

let idCategoria = null;
let idProducto = null;
let idPedido = null;
try {
  await crearAdminDePrueba();
  console.log('--- Autenticación ---');
  let r = await llamar('POST', '/auth/registro', { nombres: 'Sara', apellidos: 'Villarreal', correo: correoCliente, contrasena: 'clave123' });
  revisar('Registro de cliente: 201', r.estado === 201 && r.datos.usuario.rol === 'Cliente');
  r = await llamar('POST', '/auth/registro', { nombres: 'Otro', apellidos: 'Cliente', correo: correoOtro, contrasena: 'clave123' });
  revisar('Registro de otro cliente: 201', r.estado === 201);
  r = await llamar('POST', '/auth/registro', { nombres: '', correo: 'malo', contrasena: '1' });
  revisar('Registro con datos inválidos: 400', r.estado === 400);
  r = await llamar('POST', '/auth/login', { correo: correoCliente, contrasena: 'clave123' });
  revisar('Login cliente: 200 con token', r.estado === 200 && !!r.datos.token);
  const tokenCliente = r.datos.token;
  r = await llamar('POST', '/auth/login', { correo: correoCliente, contrasena: 'mala' });
  revisar('Login con contraseña incorrecta: 401', r.estado === 401);
  r = await llamar('POST', '/auth/login', { correo: correoOtro, contrasena: 'clave123' });
  const tokenOtro = r.datos.token;
  r = await llamar('POST', '/auth/login', { correo: correoAdmin, contrasena: 'claveAdmin1' });
  revisar('Login administrador: 200', r.estado === 200 && r.datos.usuario.rol === 'Administrador');
  const tokenAdmin = r.datos.token;
  r = await llamar('GET', '/auth/perfil', undefined, tokenCliente);
  revisar('Perfil con token: 200', r.estado === 200);
  r = await llamar('GET', '/auth/perfil');
  revisar('Perfil sin token: 401', r.estado === 401);

  console.log('--- Categorías ---');
  r = await llamar('GET', '/categorias');
  revisar('Listar categorías (público): 200', r.estado === 200 && Array.isArray(r.datos));
  r = await llamar('POST', '/categorias', { nombreCategoria: `Cat ${sufijo}` }, tokenCliente);
  revisar('Crear categoría siendo cliente: 403', r.estado === 403);
  r = await llamar('POST', '/categorias', { nombreCategoria: `Cat ${sufijo}` });
  revisar('Crear categoría sin token: 401', r.estado === 401);
  r = await llamar('POST', '/categorias', { nombreCategoria: '  ' }, tokenAdmin);
  revisar('Crear categoría sin nombre: 400', r.estado === 400);
  r = await llamar('POST', '/categorias', { nombreCategoria: `Cat ${sufijo}`, descripcion: 'de prueba' }, tokenAdmin);
  revisar('Crear categoría (admin): 201', r.estado === 201);
  idCategoria = r.datos.idCategoria;
  r = await llamar('POST', '/categorias', { nombreCategoria: `Cat ${sufijo}` }, tokenAdmin);
  revisar('Crear categoría repetida: 409', r.estado === 409);
  r = await llamar('PUT', `/categorias/${idCategoria}`, { nombreCategoria: `Cat ${sufijo} editada` }, tokenAdmin);
  revisar('Actualizar categoría: 200', r.estado === 200 && r.datos.nombreCategoria.endsWith('editada'));
  r = await llamar('GET', '/categorias/abc');
  revisar('Id que no es número: 400', r.estado === 400);
  r = await llamar('GET', '/categorias/999999');
  revisar('Categoría que no existe: 404', r.estado === 404);

  console.log('--- Productos e inventario ---');
  const nuevo = { idCategoria, nombreProducto: `Rosa prueba ${sufijo}`, descripcion: 'creada en la prueba', precio: 25000, cantidad: 5 };
  r = await llamar('POST', '/productos', nuevo, tokenAdmin);
  revisar('Crear producto (admin): 201 con inventario inicial', r.estado === 201 && r.datos.cantidad === 5);
  idProducto = r.datos.idProducto;
  r = await llamar('POST', '/productos', { ...nuevo, precio: -5, nombreProducto: '' }, tokenAdmin);
  revisar('Crear producto con datos inválidos: 400', r.estado === 400 && r.datos.detalles.length === 2);
  r = await llamar('POST', '/productos', { ...nuevo, idCategoria: 999999 }, tokenAdmin);
  revisar('Crear producto con categoría que no existe: 400', r.estado === 400);
  r = await llamar('POST', '/productos', nuevo, tokenCliente);
  revisar('Crear producto siendo cliente: 403', r.estado === 403);
  r = await llamar('GET', '/productos?busqueda=prueba ' + sufijo);
  revisar('Buscar producto por nombre (público): 200 y 1 resultado', r.estado === 200 && r.datos.length === 1);
  r = await llamar('GET', `/productos?idCategoria=${idCategoria}`);
  revisar('Filtrar productos por categoría: 200', r.estado === 200 && r.datos.length === 1);
  r = await llamar('GET', `/productos/${idProducto}`);
  revisar('Consultar un producto: 200', r.estado === 200 && r.datos.precio === 25000);
  r = await llamar('PUT', `/productos/${idProducto}`, { ...nuevo, precio: 27000, estadoProducto: true }, tokenAdmin);
  revisar('Actualizar producto: 200', r.estado === 200 && r.datos.precio === 27000);
  r = await llamar('PUT', '/productos/999999', nuevo, tokenAdmin);
  revisar('Actualizar producto que no existe: 404', r.estado === 404);
  r = await llamar('PUT', `/productos/${idProducto}/inventario`, { cantidad: 10 }, tokenAdmin);
  revisar('Cambiar inventario: 200', r.estado === 200 && r.datos.cantidad === 10);
  r = await llamar('PUT', `/productos/${idProducto}/inventario`, { cantidad: -1 }, tokenAdmin);
  revisar('Inventario negativo: 400', r.estado === 400);

  console.log('--- Pedidos ---');
  r = await llamar('POST', '/pedidos', { items: [{ idProducto, cantidad: 2 }] });
  revisar('Crear pedido sin sesión: 401', r.estado === 401);
  r = await llamar('POST', '/pedidos', { items: [] }, tokenCliente);
  revisar('Pedido sin productos: 400', r.estado === 400);
  r = await llamar('POST', '/pedidos', { items: [{ idProducto: 999999, cantidad: 1 }] }, tokenCliente);
  revisar('Pedido con producto que no existe: 404', r.estado === 404);
  r = await llamar('POST', '/pedidos', { items: [{ idProducto, cantidad: 50 }] }, tokenCliente);
  revisar('Pedido con más unidades que el inventario: 409', r.estado === 409);
  r = await llamar('GET', `/productos/${idProducto}`);
  revisar('Un pedido fallido NO descuenta inventario (sigue en 10)', r.datos.cantidad === 10);
  r = await llamar('POST', '/pedidos', { items: [{ idProducto, cantidad: 2, color: 'Rojo', mensajeTarjeta: 'Feliz día' }] }, tokenCliente);
  revisar('Crear pedido: 201 con total calculado', r.estado === 201 && r.datos.total === 54000 && r.datos.items.length === 1);
  idPedido = r.datos.idPedido;
  r = await llamar('GET', `/productos/${idProducto}`);
  revisar('El inventario se descuenta (10 → 8)', r.datos.cantidad === 8);
  r = await llamar('GET', '/pedidos', undefined, tokenCliente);
  revisar('El cliente ve sus pedidos: 200', r.estado === 200 && r.datos.some((p) => p.idPedido === idPedido));
  r = await llamar('GET', '/pedidos', undefined, tokenOtro);
  revisar('Otro cliente NO ve pedidos ajenos', r.estado === 200 && !r.datos.some((p) => p.idPedido === idPedido));
  r = await llamar('GET', `/pedidos/${idPedido}`, undefined, tokenOtro);
  revisar('Otro cliente no puede abrir un pedido ajeno: 404', r.estado === 404);
  r = await llamar('GET', `/pedidos/${idPedido}`, undefined, tokenCliente);
  revisar('El dueño abre su pedido: 200', r.estado === 200 && r.datos.items[0].mensajeTarjeta === 'Feliz día');
  r = await llamar('GET', '/pedidos?estado=Pendiente', undefined, tokenAdmin);
  revisar('Administrador busca pedidos por estado: 200', r.estado === 200 && r.datos.some((p) => p.idPedido === idPedido));
  r = await llamar('PATCH', `/pedidos/${idPedido}/estado`, { estadoPedido: 'Enviado' }, tokenCliente);
  revisar('Cliente no puede cambiar el estado: 403', r.estado === 403);
  r = await llamar('PATCH', `/pedidos/${idPedido}/estado`, { estadoPedido: 'Volando' }, tokenAdmin);
  revisar('Estado inválido: 400', r.estado === 400);
  r = await llamar('PATCH', `/pedidos/${idPedido}/estado`, { estadoPedido: 'Entregado' }, tokenAdmin);
  revisar('Administrador cambia el estado: 200', r.estado === 200 && r.datos.estadoPedido === 'Entregado');
  r = await llamar('PATCH', `/pedidos/${idPedido}/estado`, { estadoPedido: 'Pendiente' }, tokenAdmin);
  revisar('Pedido entregado no se puede cambiar: 409', r.estado === 409);
  r = await llamar('GET', '/empaques');
  revisar('Listar empaques (público): 200', r.estado === 200);
  r = await llamar('GET', '/reportes/resumen', undefined, tokenAdmin);
  revisar('Reporte resumen (admin): 200', r.estado === 200 && r.datos.totalPedidos >= 1);
  r = await llamar('GET', '/reportes/resumen', undefined, tokenCliente);
  revisar('Reporte resumen siendo cliente: 403', r.estado === 403);

  console.log('--- Eliminar ---');
  r = await llamar('DELETE', `/productos/${idProducto}`, undefined, tokenAdmin);
  revisar('Eliminar producto que ya está en un pedido: 409', r.estado === 409);
  r = await llamar('DELETE', `/categorias/${idCategoria}`, undefined, tokenAdmin);
  revisar('Eliminar categoría que tiene productos: 409', r.estado === 409);
} catch (error) {
  console.log(`Error en la prueba: ${error.stack}`);
  fallas += 1;
} finally {
  // Limpieza de los datos de prueba
  try {
    if (idPedido) await pool.execute('DELETE FROM pedidos WHERE id_pedido = ?', [idPedido]);
    if (idProducto) await pool.execute('DELETE FROM productos WHERE id_producto = ?', [idProducto]);
    if (idCategoria) await pool.execute('DELETE FROM categorias WHERE id_categoria = ?', [idCategoria]);
    await pool.execute('DELETE FROM usuarios WHERE correo IN (?, ?, ?)', [correoCliente, correoAdmin, correoOtro]);
  } catch (e) { console.log(`No se pudo limpiar: ${e.message}`); }
  servidor.close();
  await cerrarBaseDatos();
}
console.log(`\nResultado: ${total - fallas} de ${total} pruebas correctas.`);
process.exit(fallas === 0 ? 0 : 1);
