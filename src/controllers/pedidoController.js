// Controlador de pedidos, empaques y reportes.
import * as servicio from '../services/pedidoService.js';

export async function listarEmpaques(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.listarEmpaques()); } catch (e) { siguiente(e); }
}
export async function crear(peticion, respuesta, siguiente) {
  try {
    const items = peticion.body.items.map((i) => ({
      idProducto: i.idProducto,
      cantidad: i.cantidad,
      idEmpaque: i.idEmpaque ?? null,
      color: i.color ? String(i.color).trim() : null,
      mensajeTarjeta: i.mensajeTarjeta ? String(i.mensajeTarjeta).trim() : null,
    }));
    respuesta.status(201).json(await servicio.crearPedido(peticion.usuarioToken.idUsuario, items));
  } catch (e) { siguiente(e); }
}
export async function listar(peticion, respuesta, siguiente) {
  try {
    const { estado, desde, hasta } = peticion.query;
    respuesta.json(await servicio.listarPedidos(peticion.usuarioToken, { estado, desde, hasta }));
  } catch (e) { siguiente(e); }
}
export async function obtener(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.obtenerPedido(peticion.usuarioToken, peticion.params.id)); } catch (e) { siguiente(e); }
}
export async function cambiarEstado(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.cambiarEstado(peticion.params.id, peticion.body.estadoPedido)); } catch (e) { siguiente(e); }
}
export async function resumen(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.obtenerResumen()); } catch (e) { siguiente(e); }
}
