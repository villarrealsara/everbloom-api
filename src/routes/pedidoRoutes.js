// Rutas de pedidos. Todas necesitan haber iniciado sesion.
import { Router } from 'express';
import * as c from '../controllers/pedidoController.js';
import { validarPedido, validarEstadoPedido } from '../middlewares/validaciones.js';
import { validarId } from '../middlewares/validarId.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { soloRol } from '../middlewares/soloRol.js';

const router = Router();
router.use(verificarToken);

router.post('/', validarPedido, c.crear);                                                       // POST  /api/pedidos
router.get('/', c.listar);                                                                      // GET   /api/pedidos?estado=&desde=&hasta=
router.get('/:id', validarId(), c.obtener);                                                     // GET   /api/pedidos/:id
router.patch('/:id/estado', soloRol('Administrador'), validarId(), validarEstadoPedido, c.cambiarEstado); // PATCH /api/pedidos/:id/estado

export default router;
