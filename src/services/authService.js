// Servicio de autenticacion: aqui estan las REGLAS DEL NEGOCIO del registro y el inicio de sesion.
// No sabe nada de HTTP (peticiones o respuestas): solo recibe datos y devuelve datos o lanza errores.
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/entorno.js';
import * as usuarioModel from '../models/usuarioModel.js';
import { ErrorApi } from '../utils/ErrorApi.js';

export { ErrorApi };

const scryptAsync = promisify(scrypt);

/**
 * Cifra la contrasena. Nunca se guarda la contrasena real en la base de datos:
 * se guarda un "hash" (resultado de una operacion que no se puede devolver al texto original).
 * El formato guardado es  salt:hash  (el salt es un texto al azar distinto para cada usuario).
 */
async function cifrarContrasena(contrasena) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(contrasena, salt, 64)).toString('hex');
  return `${salt}:${hash}`;
}

async function contrasenaCorrecta(contrasena, guardada) {
  const [salt, hash] = guardada.split(':');
  const calculado = await scryptAsync(contrasena, salt, 64);
  return timingSafeEqual(calculado, Buffer.from(hash, 'hex'));
}

/** Registra un usuario nuevo con el rol Cliente. */
export async function registrarUsuario({ nombres, apellidos, correo, contrasena, telefono }) {
  const correoLimpio = correo.trim().toLowerCase();
  if (await usuarioModel.buscarPorCorreo(correoLimpio)) {
    throw new ErrorApi(409, 'Ya existe un usuario registrado con ese correo.');
  }
  const idRol = await usuarioModel.obtenerIdRol('Cliente');
  const idUsuario = await usuarioModel.crear({
    idRol,
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    correo: correoLimpio,
    contrasenaCifrada: await cifrarContrasena(contrasena),
    telefono: telefono ? String(telefono).trim() : null,
  });
  return usuarioModel.aUsuarioPublico(await usuarioModel.buscarPorId(idUsuario));
}

/** Valida correo y contrasena. Si son correctos devuelve el usuario y un token. */
export async function iniciarSesion({ correo, contrasena }) {
  const fila = await usuarioModel.buscarPorCorreo(correo.trim().toLowerCase());
  // El mensaje es el mismo si falla el correo o la contrasena, para no dar pistas a un atacante.
  const mensajeFallo = 'Correo o contraseña incorrectos.';
  if (!fila || !(await contrasenaCorrecta(contrasena, fila.contrasena))) {
    throw new ErrorApi(401, mensajeFallo);
  }
  if (!fila.estado) {
    throw new ErrorApi(403, 'El usuario está inactivo. Comunícate con la administradora.');
  }
  const token = jwt.sign(
    { idUsuario: fila.id_usuario, rol: fila.nombre_rol },
    CONFIG.jwtSecreto,
    { expiresIn: CONFIG.jwtExpira },
  );
  return { token, usuario: usuarioModel.aUsuarioPublico(fila) };
}

/** Devuelve los datos del usuario a partir del id que viene dentro del token. */
export async function obtenerPerfil(idUsuario) {
  const fila = await usuarioModel.buscarPorId(idUsuario);
  if (!fila) {
    throw new ErrorApi(404, 'El usuario ya no existe.');
  }
  return usuarioModel.aUsuarioPublico(fila);
}
