// Middleware de permisos: deja pasar solo a los usuarios que tengan uno de los roles indicados.
// Se usa DESPUES de verificarToken, que es el que pone los datos del token en peticion.usuarioToken.
export function soloRol(...rolesPermitidos) {
  return (peticion, respuesta, siguiente) => {
    if (!rolesPermitidos.includes(peticion.usuarioToken.rol)) {
      return respuesta.status(403).json({ error: 'No tienes permiso para hacer esta acción.' });
    }
    return siguiente();
  };
}
