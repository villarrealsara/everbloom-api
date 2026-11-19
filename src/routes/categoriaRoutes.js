// Rutas de categorias. Consultar es publico; crear, cambiar y borrar es solo del Administrador.
import { Router } from 'express';
import * as c from '../controllers/categoriaController.js';
import { validarCategoria } from '../middlewares/validaciones.js';
import { validarId } from '../middlewares/validarId.js';
import { verificarToken } from '../middlewares/verificarToken.js';
import { soloRol } from '../middlewares/soloRol.js';

const router = Router();
const admin = [verificarToken, soloRol('Administrador')];

router.get('/', c.listar);                                                   // GET    /api/categorias
router.get('/:id', validarId(), c.obtener);                                  // GET    /api/categorias/:id
router.post('/', ...admin, validarCategoria, c.crear);                       // POST   /api/categorias
router.put('/:id', ...admin, validarId(), validarCategoria, c.actualizar);   // PUT    /api/categorias/:id
router.delete('/:id', ...admin, validarId(), c.eliminar);                    // DELETE /api/categorias/:id

export default router;
