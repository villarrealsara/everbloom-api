// Controlador de productos e inventario.
import * as servicio from '../services/productoService.js';

export async function listar(peticion, respuesta, siguiente) {
  try {
    const { busqueda, idCategoria } = peticion.query;
    respuesta.json(await servicio.listarProductos({
      busqueda: busqueda ? String(busqueda).trim() : '',
      idCategoria: idCategoria ? Number(idCategoria) : null,
    }));
  } catch (e) { siguiente(e); }
}
export async function obtener(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.obtenerProducto(peticion.params.id)); } catch (e) { siguiente(e); }
}
export async function crear(peticion, respuesta, siguiente) {
  try { respuesta.status(201).json(await servicio.crearProducto(peticion.body)); } catch (e) { siguiente(e); }
}
export async function actualizar(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.actualizarProducto(peticion.params.id, peticion.body)); } catch (e) { siguiente(e); }
}
export async function eliminar(peticion, respuesta, siguiente) {
  try { await servicio.eliminarProducto(peticion.params.id); respuesta.status(204).end(); } catch (e) { siguiente(e); }
}
export async function cambiarInventario(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.cambiarInventario(peticion.params.id, peticion.body.cantidad)); } catch (e) { siguiente(e); }
}
