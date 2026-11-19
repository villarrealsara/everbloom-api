// Crea (o actualiza) un usuario Administrador para poder probar las rutas protegidas.
// Uso:  npm run crear-admin -- correo@ejemplo.com ClaveSegura123
import { scrypt, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import { pool, cerrarBaseDatos } from '../src/config/baseDatos.js';
import { obtenerIdRol } from '../src/models/usuarioModel.js';

const [correo, clave] = process.argv.slice(2);
if (!correo || !clave || clave.length < 6) {
  console.log('Uso: npm run crear-admin -- correo@ejemplo.com Clave (minimo 6 caracteres)');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const hash = (await promisify(scrypt)(clave, salt, 64)).toString('hex');
const idRol = await obtenerIdRol('Administrador');
await pool.execute(
  `INSERT INTO usuarios (id_rol, nombres, apellidos, correo, contrasena)
   VALUES (?, 'Administradora', 'EverBloom', ?, ?)
   ON DUPLICATE KEY UPDATE id_rol = VALUES(id_rol), contrasena = VALUES(contrasena)`,
  [idRol, correo.trim().toLowerCase(), `${salt}:${hash}`],
);
console.log(`Listo: ${correo} ahora es Administrador.`);
await cerrarBaseDatos();
