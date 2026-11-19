// Controlador de categorias.
import * as servicio from '../services/categoriaService.js';

export async function listar(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.listarCategorias()); } catch (e) { siguiente(e); }
}
export async function obtener(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.obtenerCategoria(peticion.params.id)); } catch (e) { siguiente(e); }
}
export async function crear(peticion, respuesta, siguiente) {
  try { respuesta.status(201).json(await servicio.crearCategoria(peticion.body)); } catch (e) { siguiente(e); }
}
export async function actualizar(peticion, respuesta, siguiente) {
  try { respuesta.json(await servicio.actualizarCategoria(peticion.params.id, peticion.body)); } catch (e) { siguiente(e); }
}
export async function eliminar(peticion, respuesta, siguiente) {
  try { await servicio.eliminarCategoria(peticion.params.id); respuesta.status(204).end(); } catch (e) { siguiente(e); }
}
