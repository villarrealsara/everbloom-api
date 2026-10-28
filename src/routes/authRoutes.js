// Rutas (endpoints) de autenticacion. Cada linea une: metodo + direccion + validacion + controlador.
import { Router } from 'express';
import { registro, login, perfil } from '../controllers/authController.js';
import { validarRegistro, validarLogin } from '../middlewares/validaciones.js';
import { verificarToken } from '../middlewares/verificarToken.js';

const router = Router();

router.post('/registro', validarRegistro, registro);   // POST /api/auth/registro
router.post('/login', validarLogin, login);            // POST /api/auth/login
router.get('/perfil', verificarToken, perfil);         // GET  /api/auth/perfil  (privada)

export default router;
