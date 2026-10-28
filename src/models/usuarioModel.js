// Modelo de usuario: define la forma de los datos y las consultas a la tabla "usuarios".
// Aqui solo se habla con la base de datos; las reglas del negocio estan en services/.
import { pool } from '../config/baseDatos.js';

/**
 * Convierte una fila de la base de datos (nombres con guion bajo) en un objeto camelCase.
 * Importante: NUNCA se incluye la contrasena para que no salga en las respuestas.
 */
export function aUsuarioPublico(fila) {
  return {
    idUsuario: fila.id_usuario,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    correo: fila.correo,
    telefono: fila.telefono,
    rol: fila.nombre_rol,
    estado: Boolean(fila.estado),
    fechaRegistro: fila.fecha_registro,
  };
}

const CONSULTA_BASE = `
  SELECT u.id_usuario, u.nombres, u.apellidos, u.correo, u.contrasena, u.telefono,
         u.estado, u.fecha_registro, r.nombre_rol
  FROM usuarios u
  INNER JOIN roles r ON r.id_rol = u.id_rol`;

export async function buscarPorCorreo(correo) {
  const [filas] = await pool.execute(`${CONSULTA_BASE} WHERE u.correo = ?`, [correo]);
  return filas[0] || null;
}

export async function buscarPorId(idUsuario) {
  const [filas] = await pool.execute(`${CONSULTA_BASE} WHERE u.id_usuario = ?`, [idUsuario]);
  return filas[0] || null;
}

/**
 * Devuelve el id de un rol por su nombre. Si el rol no existe todavia, lo crea.
 */
export async function obtenerIdRol(nombreRol) {
  await pool.execute('INSERT IGNORE INTO roles (nombre_rol, descripcion) VALUES (?, ?)', [
    nombreRol,
    `Rol ${nombreRol}`,
  ]);
  const [filas] = await pool.execute('SELECT id_rol FROM roles WHERE nombre_rol = ?', [nombreRol]);
  return filas[0].id_rol;
}

export async function crear({ idRol, nombres, apellidos, correo, contrasenaCifrada, telefono }) {
  const [resultado] = await pool.execute(
    `INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena, telefono)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idRol, nombres, apellidos, correo, contrasenaCifrada, telefono],
  );
  return resultado.insertId;
}
