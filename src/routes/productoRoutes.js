// Rutas de productos e inventario. Consultar es publico; el resto es solo del Administrador.
import { Router } from 'express';
import * as c from '../controllers/productoController.js';
import { validarProducto, validarInventario } from '../middlewares/validaciones.js';
import { validarId } from '../middlewares/validarId.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { soloRol } from '../middlewares/soloRol.js';

const router = Router();
const admin = [verificarToken, soloRol('Administrador')];

router.get('/', c.listar);                                                          // GET    /api/productos?busqueda=&idCategoria=
router.get('/:id', validarId(), c.obtener);                                         // GET    /api/productos/:id
router.post('/', ...admin, validarProducto, c.crear);                               // POST   /api/productos
router.put('/:id', ...admin, validarId(), validarProducto, c.actualizar);           // PUT    /api/productos/:id
router.delete('/:id', ...admin, validarId(), c.eliminar);                           // DELETE /api/productos/:id
router.put('/:id/inventario', ...admin, validarId(), validarInventario, c.cambiarInventario); // PUT /api/productos/:id/inventario

export default router;
