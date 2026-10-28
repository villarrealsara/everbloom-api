// Configuracion del proyecto: lee las variables del archivo .env en un solo lugar.
export const CONFIG = {
  puerto: Number(process.env.PUERTO) || 3000,
  jwtSecreto: process.env.JWT_SECRETO || 'secreto-solo-para-desarrollo',
  jwtExpira: process.env.JWT_EXPIRA || '2h',
  baseDatos: {
    host: process.env.BD_HOST || 'localhost',
    port: Number(process.env.BD_PUERTO) || 3306,
    user: process.env.BD_USUARIO || 'root',
    password: process.env.BD_CLAVE || '',
    database: process.env.BD_NOMBRE || 'everbloom',
  },
};
