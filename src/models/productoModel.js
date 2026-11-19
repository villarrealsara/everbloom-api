// Modelo de productos: consultas a las tablas "productos" e "inventario".
import { pool } from '../config/baseDatos.js';

const CONSULTA_BASE = `
  SELECT p.id_producto, p.id_categoria, p.nombre_producto, p.descripcion, p.precio,
         p.imagen, p.estado_producto, c.nombre_categoria, COALESCE(i.cantidad, 0) AS cantidad
  FROM productos p
  INNER JOIN categorias c ON c.id_categoria = p.id_categoria
  LEFT JOIN inventario i ON i.id_producto = p.id_producto`;

export function aProducto(fila) {
  return {
    idProducto: fila.id_producto,
    idCategoria: fila.id_categoria,
    nombreProducto: fila.nombre_producto,
    descripcion: fila.descripcion,
    precio: Number(fila.precio),
    imagen: fila.imagen,
    estadoProducto: Boolean(fila.estado_producto),
    nombreCategoria: fila.nombre_categoria,
    cantidad: Number(fila.cantidad),
  };
}

export async function listar({ busqueda, idCategoria }) {
  const condiciones = [];
  const valores = [];
  if (busqueda) { condiciones.push('p.nombre_producto LIKE ?'); valores.push(`%${busqueda}%`); }
  if (idCategoria) { condiciones.push('p.id_categoria = ?'); valores.push(idCategoria); }
  const donde = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  const [filas] = await pool.execute(`${CONSULTA_BASE}${donde} ORDER BY p.id_producto`, valores);
  return filas.map(aProducto);
}

export async function buscarPorId(id) {
  const [filas] = await pool.execute(`${CONSULTA_BASE} WHERE p.id_producto = ?`, [id]);
  return filas[0] ? aProducto(filas[0]) : null;
}

/** Crea el producto y su fila de inventario (cantidad inicial) en una sola transaccion. */
export async function crear({ idCategoria, nombreProducto, descripcion, precio, imagen, cantidad }) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [r] = await conexion.execute(
      'INSERT INTO productos (id_categoria, nombre_producto, descripcion, precio, imagen) VALUES (?, ?, ?, ?, ?)',
      [idCategoria, nombreProducto, descripcion, precio, imagen],
    );
    await conexion.execute('INSERT INTO inventario (id_producto, cantidad) VALUES (?, ?)', [r.insertId, cantidad]);
    await conexion.commit();
    return r.insertId;
  } catch (error) {
    await conexion.rollback();   // si algo falla, se deshace todo
    throw error;
  } finally {
    conexion.release();
  }
}

export async function actualizar(id, { idCategoria, nombreProducto, descripcion, precio, imagen, estadoProducto }) {
  await pool.execute(
    `UPDATE productos SET id_categoria = ?, nombre_producto = ?, descripcion = ?, precio = ?,
            imagen = ?, estado_producto = ? WHERE id_producto = ?`,
    [idCategoria, nombreProducto, descripcion, precio, imagen, estadoProducto, id],
  );
}

export async function eliminar(id) {
  const [r] = await pool.execute('DELETE FROM productos WHERE id_producto = ?', [id]);
  return r.affectedRows > 0;
}

export async function actualizarCantidad(id, cantidad) {
  const [r] = await pool.execute(
    `INSERT INTO inventario (id_producto, cantidad) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad), fecha_actualizacion = CURRENT_TIMESTAMP`,
    [id, cantidad],
  );
  return r.affectedRows > 0;
}
