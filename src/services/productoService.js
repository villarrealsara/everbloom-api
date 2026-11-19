// Servicio de productos e inventario: reglas del negocio.
import * as productoModel from '../models/productoModel.js';
import { ErrorApi } from '../utils/ErrorApi.js';

export const listarProductos = (filtros) => productoModel.listar(filtros);

export async function obtenerProducto(id) {
  const producto = await productoModel.buscarPorId(id);
  if (!producto) throw new ErrorApi(404, 'El producto no existe.');
  return producto;
}

export async function crearProducto(datos) {
  const id = await productoModel.crear(datos);
  return productoModel.buscarPorId(id);
}

export async function actualizarProducto(id, datos) {
  const actual = await obtenerProducto(id);
  await productoModel.actualizar(id, {
    ...datos,
    estadoProducto: datos.estadoProducto === undefined ? actual.estadoProducto : datos.estadoProducto,
  });
  return productoModel.buscarPorId(id);
}

export async function eliminarProducto(id) {
  if (!(await productoModel.eliminar(id))) throw new ErrorApi(404, 'El producto no existe.');
}

export async function cambiarInventario(id, cantidad) {
  await obtenerProducto(id);
  await productoModel.actualizarCantidad(id, cantidad);
  return productoModel.buscarPorId(id);
}
