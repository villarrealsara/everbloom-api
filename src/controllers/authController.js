// Controlador de autenticacion: recibe la peticion, llama al servicio y arma la respuesta.
// Los errores se mandan con next(error) y los atiende el middleware manejarErrores.
import * as authService from '../services/authService.js';

export async function registro(peticion, respuesta, siguiente) {
  try {
    const usuario = await authService.registrarUsuario(peticion.body);
    respuesta.status(201).json({ mensaje: 'Usuario registrado correctamente.', usuario });
  } catch (error) {
    siguiente(error);
  }
}

export async function login(peticion, respuesta, siguiente) {
  try {
    const { token, usuario } = await authService.iniciarSesion(peticion.body);
    respuesta.status(200).json({ mensaje: 'Inicio de sesión exitoso.', token, usuario });
  } catch (error) {
    siguiente(error);
  }
}

export async function perfil(peticion, respuesta, siguiente) {
  try {
    const usuario = await authService.obtenerPerfil(peticion.usuarioToken.idUsuario);
    respuesta.status(200).json({ usuario });
  } catch (error) {
    siguiente(error);
  }
}
