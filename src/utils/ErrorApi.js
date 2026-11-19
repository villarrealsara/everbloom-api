// Error con codigo HTTP: lo lanzamos a proposito en los servicios para que el middleware
// manejarErrores sepa con que codigo y mensaje responder (404, 409, 401...).
export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}
