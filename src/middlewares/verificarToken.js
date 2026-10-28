// Middleware que protege las rutas privadas: exige el token en el encabezado
//   Authorization: Bearer <token>
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/entorno.js';

export function verificarToken(peticion, respuesta, siguiente) {
  const encabezado = peticion.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return respuesta.status(401).json({ error: 'Falta el token. Inicia sesión primero.' });
  }
  try {
    peticion.usuarioToken = jwt.verify(token, CONFIG.jwtSecreto);
    return siguiente();
  } catch {
    return respuesta.status(401).json({ error: 'El token no es válido o ya venció.' });
  }
}
