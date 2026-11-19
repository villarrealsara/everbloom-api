// Junta todos los grupos de rutas bajo el prefijo /api.
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoriaRoutes from './categoriaRoutes.js';
import productoRoutes from './productoRoutes.js';
import pedidoRoutes from './pedidoRoutes.js';
import { listarEmpaques, resumen } from '../controllers/pedidoController.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { soloRol } from '../middlewares/soloRol.js';

const router = Router();

router.get('/salud', (peticion, respuesta) => {
  respuesta.json({ estado: 'ok', servicio: 'EVERBLOOM API' });
});
router.use('/auth', authRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/pedidos', pedidoRoutes);
router.get('/empaques', listarEmpaques);                                              // GET /api/empaques
router.get('/reportes/resumen', verificarToken, soloRol('Administrador'), resumen);   // GET /api/reportes/resumen

export default router;
