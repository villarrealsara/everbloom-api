// Servicio de categorias: reglas del negocio (por ejemplo, avisar si la categoria no existe).
import * as categoriaModel from '../models/categoriaModel.js';
import { ErrorApi } from '../utils/ErrorApi.js';

export const listarCategorias = () => categoriaModel.listar();

export async function obtenerCategoria(id) {
  const categoria = await categoriaModel.buscarPorId(id);
  if (!categoria) throw new ErrorApi(404, 'La categoría no existe.');
  return categoria;
}

export const crearCategoria = (datos) => categoriaModel.crear(datos);

export async function actualizarCategoria(id, datos) {
  await obtenerCategoria(id);
  return categoriaModel.actualizar(id, datos);
}

export async function eliminarCategoria(id) {
  if (!(await categoriaModel.eliminar(id))) throw new ErrorApi(404, 'La categoría no existe.');
}
