// Manejo de errores de toda la API. Asi todas las respuestas de error tienen la misma forma:
//   { "error": "mensaje para el cliente" }
export function rutaNoEncontrada(peticion, respuesta) {
  respuesta.status(404).json({ error: `La ruta ${peticion.method} ${peticion.originalUrl} no existe.` });
}

// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, peticion, respuesta, siguiente) {
  // JSON mal escrito en el cuerpo de la peticion
  if (error.type === 'entity.parse.failed') {
    return respuesta.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  // Errores que nosotros lanzamos a proposito (ErrorApi) traen su codigo HTTP
  if (error.estado) {
    return respuesta.status(error.estado).json({ error: error.message });
  }
  // Errores conocidos de MySQL traducidos a mensajes faciles de entender
  const erroresMysql = {
    ER_DUP_ENTRY: [409, 'Ya existe un registro con ese valor único.'],
    ER_NO_REFERENCED_ROW_2: [400, 'Uno de los datos relacionados (por ejemplo la categoría) no existe.'],
    ER_ROW_IS_REFERENCED_2: [409, 'No se puede eliminar porque está siendo usado en otros registros.'],
    ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Un valor no cumple las reglas de la base de datos (por ejemplo, un número negativo).'],
  };
  if (erroresMysql[error.code]) {
    const [estado, mensaje] = erroresMysql[error.code];
    return respuesta.status(estado).json({ error: mensaje });
  }
  // Cualquier otro error es inesperado: se registra en consola y al cliente solo se le dice lo basico
  console.log(`Error inesperado: ${error.message}`);
  return respuesta.status(500).json({ error: 'Error interno del servidor. Intenta de nuevo.' });
}
