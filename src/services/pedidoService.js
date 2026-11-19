// Servicio de pedidos: reglas del negocio.
//  - Un cliente solo ve sus propios pedidos; la administradora ve todos.
//  - Un pedido ya entregado no se puede cambiar.
import * as pedidoModel from '../models/pedidoModel.js';
import { ErrorApi } from '../utils/ErrorApi.js';

export const listarEmpaques = () => pedidoModel.listarEmpaques();

export async function crearPedido(idUsuario, items) {
  const id = await pedidoModel.crearConItems(idUsuario, items);
  return pedidoModel.buscarPorId(id);
}

export function listarPedidos(usuarioToken, filtros) {
  const esAdmin = usuarioToken.rol === 'Administrador';
  return pedidoModel.listar({ ...filtros, idUsuario: esAdmin ? null : usuarioToken.idUsuario });
}

export async function obtenerPedido(usuarioToken, idPedido) {
  const pedido = await pedidoModel.buscarPorId(idPedido);
  if (!pedido) throw new ErrorApi(404, 'El pedido no existe.');
  if (usuarioToken.rol !== 'Administrador' && pedido.idUsuario !== usuarioToken.idUsuario) {
    // Se responde 404 (y no 403) para no revelar que ese pedido existe
    throw new ErrorApi(404, 'El pedido no existe.');
  }
  return pedido;
}

export async function cambiarEstado(idPedido, estadoPedido) {
  const pedido = await pedidoModel.buscarPorId(idPedido);
  if (!pedido) throw new ErrorApi(404, 'El pedido no existe.');
  if (pedido.estadoPedido === 'Entregado') throw new ErrorApi(409, 'El pedido ya fue entregado y no se puede cambiar.');
  await pedidoModel.cambiarEstado(idPedido, estadoPedido);
  return pedidoModel.buscarPorId(idPedido);
}

export const obtenerResumen = () => pedidoModel.resumen();
