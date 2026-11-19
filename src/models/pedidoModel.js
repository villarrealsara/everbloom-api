// Modelo de pedidos: consultas a las tablas "pedidos", "detalle_pedido" y "empaques".
import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utils/ErrorApi.js';

export async function listarEmpaques() {
  const [filas] = await pool.execute('SELECT id_empaque, nombre_empaque, precio_extra FROM empaques ORDER BY nombre_empaque');
  return filas.map((f) => ({ idEmpaque: f.id_empaque, nombreEmpaque: f.nombre_empaque, precioExtra: Number(f.precio_extra) }));
}

/**
 * Crea el pedido con todos sus productos dentro de una TRANSACCION: o se guarda todo,
 * o no se guarda nada. Tambien descuenta las cantidades del inventario.
 */
export async function crearConItems(idUsuario, items) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [pedido] = await conexion.execute('INSERT INTO pedidos (id_usuario) VALUES (?)', [idUsuario]);
    for (const item of items) {
      // FOR UPDATE bloquea la fila para que dos pedidos al tiempo no vendan el mismo stock
      const [filas] = await conexion.execute(
        `SELECT p.precio, p.estado_producto, p.nombre_producto, COALESCE(i.cantidad, 0) AS cantidad
         FROM productos p LEFT JOIN inventario i ON i.id_producto = p.id_producto
         WHERE p.id_producto = ? FOR UPDATE`,
        [item.idProducto],
      );
      const producto = filas[0];
      if (!producto) throw new ErrorApi(404, `El producto ${item.idProducto} no existe.`);
      if (!producto.estado_producto) throw new ErrorApi(409, `El producto "${producto.nombre_producto}" no está disponible.`);
      if (producto.cantidad < item.cantidad) {
        throw new ErrorApi(409, `No hay suficiente inventario de "${producto.nombre_producto}" (disponibles: ${producto.cantidad}).`);
      }
      await conexion.execute(
        `INSERT INTO detalle_pedido (id_pedido, id_producto, id_empaque, cantidad, precio_unitario, color, mensaje_tarjeta)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pedido.insertId, item.idProducto, item.idEmpaque ?? null, item.cantidad, producto.precio, item.color ?? null, item.mensajeTarjeta ?? null],
      );
      await conexion.execute(
        'UPDATE inventario SET cantidad = cantidad - ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_producto = ?',
        [item.cantidad, item.idProducto],
      );
    }
    await conexion.commit();
    return pedido.insertId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

const CONSULTA_PEDIDOS = `
  SELECT p.id_pedido, p.id_usuario, p.fecha_pedido, p.estado_pedido,
         CONCAT(u.nombres, ' ', u.apellidos) AS cliente,
         COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
  FROM pedidos p
  INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
  LEFT JOIN detalle_pedido d ON d.id_pedido = p.id_pedido`;

function aPedido(f) {
  return {
    idPedido: f.id_pedido,
    idUsuario: f.id_usuario,
    cliente: f.cliente,
    fechaPedido: f.fecha_pedido,
    estadoPedido: f.estado_pedido,
    total: Number(f.total),
  };
}

export async function listar({ idUsuario, estado, desde, hasta }) {
  const condiciones = [];
  const valores = [];
  if (idUsuario) { condiciones.push('p.id_usuario = ?'); valores.push(idUsuario); }
  if (estado) { condiciones.push('p.estado_pedido = ?'); valores.push(estado); }
  if (desde) { condiciones.push('DATE(p.fecha_pedido) >= ?'); valores.push(desde); }
  if (hasta) { condiciones.push('DATE(p.fecha_pedido) <= ?'); valores.push(hasta); }
  const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await pool.execute(`${CONSULTA_PEDIDOS}${donde} GROUP BY p.id_pedido ORDER BY p.id_pedido DESC`, valores);
  return filas.map(aPedido);
}

export async function buscarPorId(idPedido) {
  const [filas] = await pool.execute(`${CONSULTA_PEDIDOS} WHERE p.id_pedido = ? GROUP BY p.id_pedido`, [idPedido]);
  if (!filas[0]) return null;
  const [items] = await pool.execute(
    `SELECT d.id_detalle, d.id_producto, pr.nombre_producto, d.id_empaque, d.cantidad,
            d.precio_unitario, d.color, d.mensaje_tarjeta
     FROM detalle_pedido d INNER JOIN productos pr ON pr.id_producto = d.id_producto
     WHERE d.id_pedido = ? ORDER BY d.id_detalle`,
    [idPedido],
  );
  return {
    ...aPedido(filas[0]),
    items: items.map((i) => ({
      idDetalle: i.id_detalle,
      idProducto: i.id_producto,
      nombreProducto: i.nombre_producto,
      idEmpaque: i.id_empaque,
      cantidad: i.cantidad,
      precioUnitario: Number(i.precio_unitario),
      color: i.color,
      mensajeTarjeta: i.mensaje_tarjeta,
    })),
  };
}

export async function cambiarEstado(idPedido, estadoPedido) {
  await pool.execute('UPDATE pedidos SET estado_pedido = ? WHERE id_pedido = ?', [estadoPedido, idPedido]);
}

/** Resumen para el reporte de ventas de la administradora. */
export async function resumen() {
  const [porEstado] = await pool.execute(
    `SELECT p.estado_pedido, COUNT(DISTINCT p.id_pedido) AS pedidos,
            COALESCE(SUM(d.cantidad * d.precio_unitario), 0) AS total
     FROM pedidos p LEFT JOIN detalle_pedido d ON d.id_pedido = p.id_pedido
     GROUP BY p.estado_pedido`,
  );
  const [masVendidos] = await pool.execute(
    `SELECT pr.id_producto, pr.nombre_producto, SUM(d.cantidad) AS unidades
     FROM detalle_pedido d INNER JOIN productos pr ON pr.id_producto = d.id_producto
     GROUP BY pr.id_producto, pr.nombre_producto ORDER BY unidades DESC LIMIT 5`,
  );
  return {
    totalPedidos: porEstado.reduce((s, f) => s + Number(f.pedidos), 0),
    ventasTotales: porEstado.reduce((s, f) => s + Number(f.total), 0),
    porEstado: porEstado.map((f) => ({ estadoPedido: f.estado_pedido, pedidos: Number(f.pedidos), total: Number(f.total) })),
    productosMasVendidos: masVendidos.map((f) => ({ idProducto: f.id_producto, nombreProducto: f.nombre_producto, unidades: Number(f.unidades) })),
  };
}
