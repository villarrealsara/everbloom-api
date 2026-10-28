// Arranca el servidor. Para detenerlo: Ctrl + C.
import { crearApp } from './app.js';
import { CONFIG } from './config/entorno.js';

crearApp().listen(CONFIG.puerto, () => {
  console.log(`EVERBLOOM API funcionando en http://localhost:${CONFIG.puerto}/api`);
});
