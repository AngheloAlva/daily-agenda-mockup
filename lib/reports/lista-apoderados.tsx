import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ApoderadoConNinos } from "@/lib/db/repositories/usuarios";
import { PdfFooter, PdfHeader } from "./components";
import { colors, styles } from "./styles";

type Props = {
  centroNombre: string;
  centroServicio: string | null;
  generadoPor: string;
  fechaGeneracion: string;
  apoderados: ApoderadoConNinos[];
};

export function ListaApoderadosPdf({
  centroNombre,
  centroServicio,
  generadoPor,
  fechaGeneracion,
  apoderados,
}: Props) {
  return (
    <Document title="Lista de apoderados" author={generadoPor}>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          centroNombre={centroNombre}
          centroServicio={centroServicio}
          fechaGeneracion={fechaGeneracion}
        />

        <Text style={styles.titulo}>Lista de apoderados</Text>
        <Text style={styles.subtitulo}>
          {apoderados.length} apoderados activos en el centro
        </Text>

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.bgSubtle,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.borderDark,
            paddingVertical: 5,
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ width: "28%", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            Apoderado
          </Text>
          <Text style={{ width: "22%", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            Teléfono
          </Text>
          <Text style={{ width: "25%", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            Email
          </Text>
          <Text style={{ width: "25%", fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            Párvulos a cargo
          </Text>
        </View>

        {apoderados.map((a) => (
          <View
            key={a.id}
            style={{
              flexDirection: "row",
              borderBottomWidth: 0.5,
              borderBottomColor: colors.border,
              paddingVertical: 4,
              paddingHorizontal: 4,
            }}
            wrap={false}
          >
            <Text style={{ width: "28%", fontSize: 9 }}>
              {a.nombre} {a.apellido}
            </Text>
            <Text style={{ width: "22%", fontSize: 9 }}>
              {a.telefono ?? "—"}
            </Text>
            <Text style={{ width: "25%", fontSize: 8 }}>
              {a.email ?? "—"}
            </Text>
            <View style={{ width: "25%" }}>
              {a.ninos.map((n) => (
                <Text key={n.id} style={{ fontSize: 8 }}>
                  {n.nombreCompleto}
                  <Text style={{ color: colors.muted }}> · {n.sala}</Text>
                </Text>
              ))}
            </View>
          </View>
        ))}

        <PdfFooter generadoPor={generadoPor} />
      </Page>
    </Document>
  );
}
