import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { FichaCompleta } from "@/lib/db/types";
import {
  Divider,
  KeyValue,
  PdfFooter,
  PdfHeader,
  Pill,
  SectionTitle,
} from "./components";
import { colors, styles } from "./styles";

type Props = {
  centroNombre: string;
  centroServicio: string | null;
  generadoPor: string;
  fechaGeneracion: string;
  ficha: FichaCompleta;
};

const fmtFecha = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const calcularEdad = (fechaNac: string) => {
  const nac = new Date(fechaNac);
  const hoy = new Date();
  let anios = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (hoy.getDate() < nac.getDate()) meses -= 1;
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }
  if (anios === 0) return `${meses} meses`;
  if (meses === 0) return `${anios} ${anios === 1 ? "año" : "años"}`;
  return `${anios} ${anios === 1 ? "año" : "años"} ${meses} m`;
};

export function FichaParvuloPdf({
  centroNombre,
  centroServicio,
  generadoPor,
  fechaGeneracion,
  ficha,
}: Props) {
  const { nino, ficha: detalle, autorizadosRetiro, contactosEmergencia, entrevistas } = ficha;
  return (
    <Document
      title={`Ficha de ${nino.nombre} ${nino.apellido}`}
      author={generadoPor}
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader
          centroNombre={centroNombre}
          centroServicio={centroServicio}
          fechaGeneracion={fechaGeneracion}
        />

        <Text style={styles.titulo}>
          Ficha del párvulo
        </Text>
        <Text style={styles.subtitulo}>
          {nino.nombre} {nino.apellido} · {nino.salaNombre}
        </Text>

        <SectionTitle>Datos personales</SectionTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <KeyValue label="Nombre completo" value={`${nino.nombre} ${nino.apellido}`} />
          <KeyValue label="RUT" value={nino.rut ?? "—"} />
          <KeyValue label="Fecha de nacimiento" value={fmtFecha(nino.fechaNacimiento)} />
          <KeyValue label="Edad" value={calcularEdad(nino.fechaNacimiento)} />
          <KeyValue label="Nacionalidad" value={nino.nacionalidad ?? "—"} />
          <KeyValue label="Grupo sanguíneo" value={nino.grupoSanguineo ?? "—"} />
          <KeyValue
            label="Dirección"
            value={
              nino.direccion
                ? `${nino.direccion}${nino.comuna ? `, ${nino.comuna}` : ""}`
                : "—"
            }
            full
          />
        </View>

        <Divider />

        <SectionTitle>Salud</SectionTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <KeyValue label="Previsión" value={detalle.prevision ?? "—"} />
          <KeyValue
            label="Seguro escolar"
            value={detalle.seguroEscolar ? "Vigente" : "No registrado"}
          />
          <View style={{ width: "100%", marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 7,
                color: colors.muted,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              Alergias
            </Text>
            {detalle.alergias.length === 0 ? (
              <Text style={{ fontSize: 9, color: colors.muted }}>
                Sin alergias registradas
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {detalle.alergias.map((a) => (
                  <Pill key={a} texto={a} bg={colors.roseBg} color={colors.rose} />
                ))}
              </View>
            )}
          </View>
          <View style={{ width: "100%", marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 7,
                color: colors.muted,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              Enfermedades / condiciones
            </Text>
            {detalle.enfermedades.length === 0 ? (
              <Text style={{ fontSize: 9, color: colors.muted }}>
                Sin condiciones registradas
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                {detalle.enfermedades.map((e) => (
                  <Pill key={e} texto={e} bg={colors.amberBg} color={colors.amber} />
                ))}
              </View>
            )}
          </View>
          {detalle.dietaEspecial && (
            <View
              style={{
                width: "100%",
                backgroundColor: colors.amberBg,
                padding: 6,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontFamily: "Helvetica-Bold",
                  color: colors.amber,
                  marginBottom: 2,
                }}
              >
                DIETA ESPECIAL
              </Text>
              <Text style={{ fontSize: 9 }}>{detalle.dietaEspecial}</Text>
            </View>
          )}
        </View>

        <Divider />

        <SectionTitle>Familia</SectionTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <KeyValue label="Vive con" value={detalle.viveCon ?? "—"} />
          <KeyValue label="Ocupación madre" value={detalle.ocupacionMadre ?? "—"} />
          <KeyValue label="Ocupación padre" value={detalle.ocupacionPadre ?? "—"} />
        </View>

        <View style={{ marginTop: 4 }}>
          <Text
            style={{
              fontSize: 7,
              color: colors.muted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Personas autorizadas para retiro
          </Text>
          {autorizadosRetiro.length === 0 ? (
            <Text style={{ fontSize: 9, color: colors.muted }}>
              Sin registros
            </Text>
          ) : (
            autorizadosRetiro.map((p, i) => (
              <Text key={i} style={{ fontSize: 9, marginBottom: 1 }}>
                · {p.nombre} ({p.parentesco}) — {p.telefono}
              </Text>
            ))
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              fontSize: 7,
              color: colors.muted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Contactos de emergencia
          </Text>
          {contactosEmergencia.length === 0 ? (
            <Text style={{ fontSize: 9, color: colors.muted }}>
              Sin registros
            </Text>
          ) : (
            contactosEmergencia.map((p, i) => (
              <Text key={i} style={{ fontSize: 9, marginBottom: 1 }}>
                · {p.nombre} ({p.parentesco}) — {p.telefono}
              </Text>
            ))
          )}
        </View>

        <Divider />

        <SectionTitle>Información educativa</SectionTitle>
        <View>
          <Text
            style={{
              fontSize: 7,
              color: colors.muted,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Periodo de adaptación
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 6 }}>
            {detalle.periodoAdaptacion ?? "Sin registro"}
          </Text>
          <Text
            style={{
              fontSize: 7,
              color: colors.muted,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Observaciones generales
          </Text>
          <Text style={{ fontSize: 9, marginBottom: 6, lineHeight: 1.4 }}>
            {detalle.observaciones ?? "Sin observaciones"}
          </Text>
          <Text
            style={{
              fontSize: 7,
              color: colors.muted,
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Convivencia escolar
          </Text>
          <Text style={{ fontSize: 9, lineHeight: 1.4 }}>
            {detalle.convivencia ?? "Sin registro"}
          </Text>
        </View>

        {entrevistas.length > 0 && (
          <>
            <Divider />
            <SectionTitle>Entrevistas con apoderados</SectionTitle>
            {entrevistas.map((e) => (
              <View
                key={e.id}
                style={{ flexDirection: "row", marginBottom: 3 }}
              >
                <Text style={{ fontSize: 9, width: "60%" }}>· {e.titulo}</Text>
                <Text style={{ fontSize: 9, width: "30%", color: colors.muted }}>
                  {fmtFecha(e.fecha)}
                </Text>
                <Text
                  style={{
                    fontSize: 8,
                    width: "10%",
                    color: e.realizada ? colors.emerald : colors.muted,
                  }}
                >
                  {e.realizada ? "Realizada" : "Pendiente"}
                </Text>
              </View>
            ))}
          </>
        )}

        <PdfFooter generadoPor={generadoPor} />
      </Page>
    </Document>
  );
}
