// Helpers de presentación para datos de niños.
// Puras funciones — no dependen de la fuente de datos.

export const calcularEdad = (
  fechaNacimiento: string,
  hoy: Date = new Date(),
): { anios: number; meses: number; texto: string } => {
  const nac = new Date(fechaNacimiento);
  let anios = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (hoy.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  const texto =
    anios === 0
      ? `${meses} ${meses === 1 ? "mes" : "meses"}`
      : meses === 0
        ? `${anios} ${anios === 1 ? "año" : "años"}`
        : `${anios} ${anios === 1 ? "año" : "años"} ${meses} m`;
  return { anios, meses, texto };
};

export const diasHastaCumple = (
  fechaNacimiento: string,
  hoy: Date = new Date(),
): number => {
  const nac = new Date(fechaNacimiento);
  const proximo = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
  if (proximo < hoy) proximo.setFullYear(hoy.getFullYear() + 1);
  const diff = proximo.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const inicialesDe = (nombre: string, apellido: string) =>
  `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();
