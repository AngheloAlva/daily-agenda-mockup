import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { FilaAsistenciaMensual } from "@/lib/db/repositories/asistencia";
import { PdfFooter, PdfHeader } from "./components";
import { colors, styles } from "./styles";

type Props = {
  centroNombre: string;
  centroServicio: string | null;
  generadoPor: string;
  fechaGeneracion: string;
  anio: number;
  mes: number;
  filas: FilaAsistenciaMensual[];
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SIMBOLO: Record<string, { letra: string; color: string }> = {
  presente: { letra: "P", color: colors.emerald },
  atrasado: { letra: "T", color: colors.amber },
  retirado: { letra: "R", color: colors.primary },
  ausente: { letra: "A", color: colors.rose },
};

export function AsistenciaMensualPdf({
  centroNombre,
  centroServicio,
  generadoPor,
  fechaGeneracion,
  anio,
  mes,
  filas,
}: Props) {
  // Generar lista de días hábiles del mes (lun-vie)
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const dias: { dia: number; nombre: string }[] = [];
  const nombres = ["D", "L", "M", "X", "J", "V", "S"];
  for (let d = 1; d <= ultimoDia; d++) {
    const fecha = new Date(anio, mes - 1, d);
    const dow = fecha.getDay();
    if (dow >= 1 && dow <= 5) {
      dias.push({ dia: d, nombre: nombres[dow] });
    }
  }

  // Agrupar por sala para mejor legibilidad
  const porSala = new Map<string, FilaAsistenciaMensual[]>();
  for (const f of filas) {
    const lista = porSala.get(f.salaNombre) ?? [];
    lista.push(f);
    porSala.set(f.salaNombre, lista);
  }

  const colDiaWidth = Math.max(12, Math.floor(450 / dias.length));

  return (
    <Document
      title={`Asistencia ${MESES[mes - 1]} ${anio}`}
      author={generadoPor}
    >
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        <PdfHeader
          centroNombre={centroNombre}
          centroServicio={centroServicio}
          fechaGeneracion={fechaGeneracion}
        />

        <Text style={styles.titulo}>
          Asistencia — {MESES[mes - 1]} {anio}
        </Text>
        <Text style={styles.subtitulo}>
          {filas.length} párvulos · {dias.length} días hábiles del mes
        </Text>

        {/* Leyenda */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
          {Object.entries(SIMBOLO).map(([estado, cfg]) => (
            <View key={estado} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: "Helvetica-Bold",
                  color: cfg.color,
                }}
              >
                {cfg.letra}
              </Text>
              <Text style={{ fontSize: 7, color: colors.muted, textTransform: "capitalize" }}>
                {estado}
              </Text>
            </View>
          ))}
        </View>

        {Array.from(porSala.entries()).map(([sala, filasSala]) => (
          <View key={sala} style={{ marginBottom: 12 }} wrap={false}>
            <Text
              style={{
                fontSize: 9,
                fontFamily: "Helvetica-Bold",
                color: colors.primary,
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              {sala}
            </Text>

            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: colors.bgSubtle,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderDark,
                paddingVertical: 3,
              }}
            >
              <Text style={{ width: 140, fontSize: 7, fontFamily: "Helvetica-Bold" }}>
                Párvulo
              </Text>
              {dias.map((d) => (
                <Text
                  key={d.dia}
                  style={{
                    width: colDiaWidth,
                    fontSize: 6,
                    textAlign: "center",
                    color: colors.muted,
                  }}
                >
                  {d.dia}
                </Text>
              ))}
              <Text style={{ width: 28, fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "right" }}>
                P
              </Text>
              <Text style={{ width: 28, fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "right" }}>
                T
              </Text>
              <Text style={{ width: 28, fontSize: 7, fontFamily: "Helvetica-Bold", textAlign: "right" }}>
                A
              </Text>
            </View>

            {filasSala.map((fila) => (
              <View
                key={fila.ninoId}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ width: 140, fontSize: 7 }}>
                  {fila.nombre} {fila.apellido}
                </Text>
                {dias.map((d) => {
                  const fechaIso = `${anio}-${String(mes).padStart(2, "0")}-${String(d.dia).padStart(2, "0")}`;
                  const estado = fila.diasEstado[fechaIso];
                  const cfg = estado ? SIMBOLO[estado] : null;
                  return (
                    <Text
                      key={d.dia}
                      style={{
                        width: colDiaWidth,
                        fontSize: 7,
                        textAlign: "center",
                        color: cfg?.color ?? colors.border,
                        fontFamily: cfg ? "Helvetica-Bold" : "Helvetica",
                      }}
                    >
                      {cfg?.letra ?? "·"}
                    </Text>
                  );
                })}
                <Text style={{ width: 28, fontSize: 7, textAlign: "right", color: colors.emerald }}>
                  {fila.presentes}
                </Text>
                <Text style={{ width: 28, fontSize: 7, textAlign: "right", color: colors.amber }}>
                  {fila.atrasados}
                </Text>
                <Text style={{ width: 28, fontSize: 7, textAlign: "right", color: colors.rose }}>
                  {fila.ausentes}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <PdfFooter generadoPor={generadoPor} />
      </Page>
    </Document>
  );
}
