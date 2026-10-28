// Crea la aplicacion de Express: configura el JSON, las rutas y el manejo de errores.
import express from 'express';
import rutas from './routes/index.js';
import { rutaNoEncontrada, manejarErrores } from './middlewares/manejarErrores.js';

export function crearApp() {
  const app = express();
  app.use(express.json());      // permite leer el cuerpo JSON de las peticiones
  app.use('/api', rutas);
  app.use(rutaNoEncontrada);    // si ninguna ruta coincide: 404
  app.use(manejarErrores);      // siempre al final
  return app;
}
