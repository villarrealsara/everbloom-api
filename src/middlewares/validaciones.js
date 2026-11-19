// Middlewares de validacion: revisan los datos ANTES de que lleguen al controlador.
// Si algo esta mal, responden 400 con la lista de errores y la peticion se detiene ahi.

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function responderErrores(respuesta, errores) {
  respuesta.status(400).json({ error: 'Datos inválidos.', detalles: errores });
}

function esTexto(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

export function validarRegistro(peticion, respuesta, siguiente) {
  const { nombres, apellidos, correo, contrasena, telefono } = peticion.body || {};
  const errores = [];
  if (!esTexto(nombres)) errores.push('El campo nombres es obligatorio.');
  if (!esTexto(apellidos)) errores.push('El campo apellidos es obligatorio.');
  if (!esTexto(correo)) errores.push('El campo correo es obligatorio.');
  else if (!PATRON_CORREO.test(correo.trim())) errores.push('El correo no tiene un formato válido.');
  if (!esTexto(contrasena)) errores.push('El campo contrasena es obligatorio.');
  else if (contrasena.length < 6) errores.push('La contraseña debe tener mínimo 6 caracteres.');
  if (telefono !== undefined && telefono !== null && telefono !== ''
      && !/^[0-9+\s-]{7,15}$/.test(String(telefono))) {
    errores.push('El teléfono debe tener entre 7 y 15 números.');
  }
  if (errores.length > 0) return responderErrores(respuesta, errores);
  return siguiente();
}

export function validarLogin(peticion, respuesta, siguiente) {
  const { correo, contrasena } = peticion.body || {};
  const errores = [];
  if (!esTexto(correo)) errores.push('El campo correo es obligatorio.');
  if (!esTexto(contrasena)) errores.push('El campo contrasena es obligatorio.');
  if (errores.length > 0) return responderErrores(respuesta, errores);
  return siguiente();
}

// ---------- Categorias ----------
export function validarCategoria(peticion, respuesta, siguiente) {
  const { nombreCategoria, descripcion } = peticion.body || {};
  const errores = [];
  if (!esTexto(nombreCategoria)) errores.push('El campo nombreCategoria es obligatorio.');
  else if (nombreCategoria.trim().length > 100) errores.push('nombreCategoria debe tener máximo 100 caracteres.');
  if (descripcion !== undefined && descripcion !== null && String(descripcion).length > 200) {
    errores.push('descripcion debe tener máximo 200 caracteres.');
  }
  if (errores.length > 0) return responderErrores(respuesta, errores);
  peticion.body = {
    nombreCategoria: nombreCategoria.trim(),
    descripcion: descripcion ? String(descripcion).trim() : null,
  };
  return siguiente();
}

// ---------- Productos ----------
export function validarProducto(peticion, respuesta, siguiente) {
  const { idCategoria, nombreProducto, descripcion, precio, imagen, cantidad, estadoProducto } = peticion.body || {};
  const errores = [];
  if (!esTexto(nombreProducto)) errores.push('El campo nombreProducto es obligatorio.');
  else if (nombreProducto.trim().length > 150) errores.push('nombreProducto debe tener máximo 150 caracteres.');
  if (!Number.isInteger(Number(idCategoria)) || Number(idCategoria) <= 0) errores.push('idCategoria debe ser un número entero positivo.');
  if (precio === undefined || precio === null || precio === '' || Number.isNaN(Number(precio)) || Number(precio) < 0) {
    errores.push('precio debe ser un número mayor o igual a cero.');
  }
  if (cantidad !== undefined && (!Number.isInteger(Number(cantidad)) || Number(cantidad) < 0)) {
    errores.push('cantidad debe ser un número entero mayor o igual a cero.');
  }
  if (estadoProducto !== undefined && typeof estadoProducto !== 'boolean') errores.push('estadoProducto debe ser true o false.');
  if (errores.length > 0) return responderErrores(respuesta, errores);
  peticion.body = {
    idCategoria: Number(idCategoria),
    nombreProducto: nombreProducto.trim(),
    descripcion: descripcion ? String(descripcion).trim() : null,
    precio: Number(precio),
    imagen: imagen ? String(imagen).trim() : null,
    cantidad: cantidad === undefined ? 0 : Number(cantidad),
    estadoProducto,
  };
  return siguiente();
}

export function validarInventario(peticion, respuesta, siguiente) {
  const { cantidad } = peticion.body || {};
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return responderErrores(respuesta, ['cantidad debe ser un número entero mayor o igual a cero.']);
  }
  return siguiente();
}

// ---------- Pedidos ----------
const ESTADOS_PEDIDO = ['Pendiente', 'En proceso', 'Enviado', 'Entregado'];

export function validarPedido(peticion, respuesta, siguiente) {
  const { items } = peticion.body || {};
  const errores = [];
  if (!Array.isArray(items) || items.length === 0) {
    errores.push('items debe ser una lista con al menos un producto.');
  } else {
    items.forEach((item, i) => {
      const n = i + 1;
      if (!Number.isInteger(item.idProducto) || item.idProducto <= 0) errores.push(`items[${n}]: idProducto debe ser un número entero positivo.`);
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) errores.push(`items[${n}]: cantidad debe ser un número entero mayor a cero.`);
      if (item.idEmpaque !== undefined && item.idEmpaque !== null && (!Number.isInteger(item.idEmpaque) || item.idEmpaque <= 0)) {
        errores.push(`items[${n}]: idEmpaque debe ser un número entero positivo.`);
      }
      if (item.mensajeTarjeta && String(item.mensajeTarjeta).length > 255) errores.push(`items[${n}]: mensajeTarjeta debe tener máximo 255 caracteres.`);
    });
  }
  if (errores.length > 0) return responderErrores(respuesta, errores);
  return siguiente();
}

export function validarEstadoPedido(peticion, respuesta, siguiente) {
  const { estadoPedido } = peticion.body || {};
  if (!ESTADOS_PEDIDO.includes(estadoPedido)) {
    return responderErrores(respuesta, [`estadoPedido debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}.`]);
  }
  return siguiente();
}
