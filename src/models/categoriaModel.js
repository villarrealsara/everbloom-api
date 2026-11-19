// Modelo de categorias: consultas a la tabla "categorias".
import { pool } from '../config/baseDatos.js';

function aCategoria(fila) {
  return { idCategoria: fila.id_categoria, nombreCategoria: fila.nombre_categoria, descripcion: fila.descripcion };
}

export async function listar() {
  const [filas] = await pool.execute('SELECT * FROM categorias ORDER BY nombre_categoria');
  return filas.map(aCategoria);
}

export async function buscarPorId(id) {
  const [filas] = await pool.execute('SELECT * FROM categorias WHERE id_categoria = ?', [id]);
  return filas[0] ? aCategoria(filas[0]) : null;
}

export async function crear({ nombreCategoria, descripcion }) {
  const [r] = await pool.execute('INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)', [nombreCategoria, descripcion]);
  return buscarPorId(r.insertId);
}

export async function actualizar(id, { nombreCategoria, descripcion }) {
  await pool.execute('UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?', [nombreCategoria, descripcion, id]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  const [r] = await pool.execute('DELETE FROM categorias WHERE id_categoria = ?', [id]);
  return r.affectedRows > 0;
}
