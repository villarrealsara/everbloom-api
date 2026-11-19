// Crea la aplicacion de Express: configura el JSON, las rutas y el manejo de errores.
import express from 'express';
import rutas from './routes/index.js';
import { rutaNoEncontrada, manejarErrores } from './middlewares/manejarErrores.js';

export function crearApp() {
  const app = express();
  app.use(express.json());      // permite leer el cuerpo JSON de las peticiones
  // CORS (GA8): deja que el front-end en React, que corre en otra dirección, consuma la API.
  const origenPermitido = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.use((peticion, respuesta, siguiente) => {
    respuesta.setHeader('Access-Control-Allow-Origin', origenPermitido);
    respuesta.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    respuesta.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (peticion.method === 'OPTIONS') return respuesta.sendStatus(204);
    siguiente();
  });
  app.use('/api', rutas);
  app.use(rutaNoEncontrada);    // si ninguna ruta coincide: 404
  app.use(manejarErrores);      // siempre al final
  return app;
}
