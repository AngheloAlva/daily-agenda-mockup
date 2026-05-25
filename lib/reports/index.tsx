"use client";

import { pdf } from "@react-pdf/renderer";
import type { PGlite } from "@electric-sql/pglite";
import { getFichaCompleta } from "@/lib/db/repositories/ninos";
import { getMatrizMensual } from "@/lib/db/repositories/asistencia";
import { listApoderadosConNinos } from "@/lib/db/repositories/usuarios";
import { registrar } from "@/lib/db/repositories/reportes";
import type { Centro, Usuario } from "@/lib/db/types";
import { FichaParvuloPdf } from "./ficha-parvulo";
import { AsistenciaMensualPdf } from "./asistencia-mensual";
import { ListaApoderadosPdf } from "./lista-apoderados";

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const fechaGeneracion = () =>
  new Date().toLocaleString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

type Contexto = {
  db: PGlite;
  centro: Centro;
  usuario: Usuario;
};

export async function generarFichaParvulo(
  ctx: Contexto,
  ninoId: number,
): Promise<string> {
  const ficha = await getFichaCompleta(ctx.db, ninoId);
  if (!ficha) throw new Error("Párvulo no encontrado");

  const doc = (
    <FichaParvuloPdf
      centroNombre={ctx.centro.nombre}
      centroServicio={ctx.centro.servicio}
      generadoPor={`${ctx.usuario.nombre} ${ctx.usuario.apellido}`}
      fechaGeneracion={fechaGeneracion()}
      ficha={ficha}
    />
  );
  const blob = await pdf(doc).toBlob();
  const nombre = `ficha-${slugify(`${ficha.nino.nombre}-${ficha.nino.apellido}`)}.pdf`;
  descargar(blob, nombre);
  await registrar(ctx.db, {
    centroId: ctx.centro.id,
    tipo: "informe_parvulo",
    parametros: { ninoId, nombre: `${ficha.nino.nombre} ${ficha.nino.apellido}` },
    generadoPor: ctx.usuario.id,
    archivoNombre: nombre,
  });
  return nombre;
}

export async function generarAsistenciaMensual(
  ctx: Contexto,
  anio: number,
  mes: number,
): Promise<string> {
  const filas = await getMatrizMensual(ctx.db, ctx.centro.id, anio, mes);
  const doc = (
    <AsistenciaMensualPdf
      centroNombre={ctx.centro.nombre}
      centroServicio={ctx.centro.servicio}
      generadoPor={`${ctx.usuario.nombre} ${ctx.usuario.apellido}`}
      fechaGeneracion={fechaGeneracion()}
      anio={anio}
      mes={mes}
      filas={filas}
    />
  );
  const blob = await pdf(doc).toBlob();
  const nombre = `asistencia-${MESES[mes - 1]}-${anio}.pdf`;
  descargar(blob, nombre);
  await registrar(ctx.db, {
    centroId: ctx.centro.id,
    tipo: "asistencia_mensual",
    parametros: { anio, mes },
    generadoPor: ctx.usuario.id,
    archivoNombre: nombre,
  });
  return nombre;
}

export async function generarListaApoderados(ctx: Contexto): Promise<string> {
  const apoderados = await listApoderadosConNinos(ctx.db, ctx.centro.id);
  const doc = (
    <ListaApoderadosPdf
      centroNombre={ctx.centro.nombre}
      centroServicio={ctx.centro.servicio}
      generadoPor={`${ctx.usuario.nombre} ${ctx.usuario.apellido}`}
      fechaGeneracion={fechaGeneracion()}
      apoderados={apoderados}
    />
  );
  const blob = await pdf(doc).toBlob();
  const nombre = `lista-apoderados-${slugify(ctx.centro.nombre)}.pdf`;
  descargar(blob, nombre);
  await registrar(ctx.db, {
    centroId: ctx.centro.id,
    tipo: "lista_apoderados",
    parametros: {},
    generadoPor: ctx.usuario.id,
    archivoNombre: nombre,
  });
  return nombre;
}
