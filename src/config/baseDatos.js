// Conexion a MySQL. Se usa un "pool" (grupo de conexiones) porque una API recibe muchas
// peticiones al mismo tiempo y cada una puede necesitar su propia conexion.
import mysql from 'mysql2/promise';
import { CONFIG } from './entorno.js';

export const pool = mysql.createPool({ ...CONFIG.baseDatos, connectionLimit: 10 });

export async function cerrarBaseDatos() {
  await pool.end();
}
