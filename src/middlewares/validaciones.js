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
