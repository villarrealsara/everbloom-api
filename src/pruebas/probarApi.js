// Prueba automatica de la API: levanta el servidor, manda peticiones reales y revisa las respuestas.
// Ejecutar con:  npm run probar
import { crearApp } from '../app.js';
import { pool, cerrarBaseDatos } from '../config/baseDatos.js';

const servidor = crearApp().listen(0);
const base = `http://localhost:${servidor.address().port}/api`;
const correoPrueba = `prueba.${Date.now()}@everbloom.com`;
let total = 0;
let fallas = 0;

async function llamar(metodo, ruta, cuerpo, token) {
  const opciones = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (token) opciones.headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) opciones.body = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  const respuesta = await fetch(base + ruta, opciones);
  return { estado: respuesta.status, datos: await respuesta.json() };
}

function revisar(nombre, condicion) {
  total += 1;
  if (!condicion) fallas += 1;
  console.log(`${condicion ? 'OK    ' : 'FALLA '} ${nombre}`);
}

try {
  const valido = { nombres: 'Sara', apellidos: 'Villarreal', correo: correoPrueba, contrasena: 'clave123', telefono: '3001234567' };

  let r = await llamar('GET', '/salud');
  revisar('GET /salud responde 200', r.estado === 200 && r.datos.estado === 'ok');

  r = await llamar('POST', '/auth/registro', valido);
  revisar('Registro correcto responde 201', r.estado === 201 && r.datos.usuario.correo === correoPrueba);
  revisar('La respuesta NO trae la contraseña', !JSON.stringify(r.datos).includes('contrasena'));

  const [filas] = await pool.execute('SELECT contrasena FROM usuarios WHERE correo = ?', [correoPrueba]);
  revisar('En la base de datos la contraseña está cifrada', filas[0].contrasena !== 'clave123' && filas[0].contrasena.includes(':'));

  r = await llamar('POST', '/auth/registro', valido);
  revisar('Registro con correo repetido responde 409', r.estado === 409);

  r = await llamar('POST', '/auth/registro', { nombres: '', correo: 'malo', contrasena: '123' });
  revisar('Registro con datos inválidos responde 400 y lista los errores', r.estado === 400 && r.datos.detalles.length >= 4);

  r = await llamar('POST', '/auth/registro', '{"nombres": ');
  revisar('JSON mal escrito responde 400', r.estado === 400);

  r = await llamar('POST', '/auth/login', { correo: correoPrueba, contrasena: 'clave123' });
  revisar('Login correcto responde 200 con token', r.estado === 200 && typeof r.datos.token === 'string');
  const token = r.datos.token;

  r = await llamar('POST', '/auth/login', { correo: correoPrueba, contrasena: 'otraclave' });
  revisar('Login con contraseña incorrecta responde 401', r.estado === 401);

  r = await llamar('POST', '/auth/login', { correo: 'noexiste@everbloom.com', contrasena: 'clave123' });
  revisar('Login con correo que no existe responde 401', r.estado === 401);

  r = await llamar('POST', '/auth/login', { correo: correoPrueba });
  revisar('Login sin contraseña responde 400', r.estado === 400);

  r = await llamar('GET', '/auth/perfil', undefined, token);
  revisar('Perfil con token responde 200', r.estado === 200 && r.datos.usuario.correo === correoPrueba);

  r = await llamar('GET', '/auth/perfil');
  revisar('Perfil sin token responde 401', r.estado === 401);

  r = await llamar('GET', '/auth/perfil', undefined, 'token.falso.123');
  revisar('Perfil con token falso responde 401', r.estado === 401);

  r = await llamar('GET', '/ruta/inventada');
  revisar('Ruta que no existe responde 404', r.estado === 404);

  await pool.execute('DELETE FROM usuarios WHERE correo = ?', [correoPrueba]);
} catch (error) {
  console.log(`Error en la prueba: ${error.message}`);
  fallas += 1;
} finally {
  servidor.close();
  await cerrarBaseDatos();
}
console.log(`\nResultado: ${total - fallas} de ${total} pruebas correctas.`);
process.exit(fallas === 0 ? 0 : 1);
