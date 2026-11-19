// Revisa que el parametro de la direccion (por ejemplo /productos/:id) sea un numero entero positivo.
export function validarId(nombreParametro = 'id') {
  return (peticion, respuesta, siguiente) => {
    const valor = Number(peticion.params[nombreParametro]);
    if (!Number.isInteger(valor) || valor <= 0) {
      return respuesta.status(400).json({ error: `El parámetro ${nombreParametro} debe ser un número entero positivo.` });
    }
    peticion.params[nombreParametro] = valor;
    return siguiente();
  };
}
