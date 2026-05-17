export const normalizarTexto = (texto) => {
  if (texto === null || texto === undefined) return '';
  return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};
