// Junta todos los grupos de rutas bajo el prefijo /api.
import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

router.get('/salud', (peticion, respuesta) => {
  respuesta.json({ estado: 'ok', servicio: 'EVERBLOOM API' });
});
router.use('/auth', authRoutes);

export default router;
