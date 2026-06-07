import { Text, View } from "@react-pdf/renderer";
import { colors, styles } from "./styles";

type HeaderProps = {
  centroNombre: string;
  centroServicio: string | null;
  fechaGeneracion: string; // pre-formateado
};

export function PdfHeader({
  centroNombre,
  centroServicio,
  fechaGeneracion,
}: HeaderProps) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>
        <Text style={styles.centroNombre}>{centroNombre}</Text>
        {centroServicio && (
          <Text style={styles.centroServicio}>{centroServicio}</Text>
        )}
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.fechaLabel}>Generado</Text>
        <Text style={styles.fechaTexto}>{fechaGeneracion}</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ generadoPor }: { generadoPor: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>Generado por {generadoPor} · Aula · Semillitas del Oriente</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

export function Pill({
  texto,
  bg,
  color,
}: {
  texto: string;
  bg: string;
  color: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 7, color, fontFamily: "Helvetica-Bold" }}>
        {texto}
      </Text>
    </View>
  );
}

export function Divider() {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginVertical: 10,
      }}
    />
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: colors.primary,
        marginBottom: 6,
        marginTop: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {children}
    </Text>
  );
}

export function KeyValue({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <View
      style={{
        width: full ? "100%" : "50%",
        marginBottom: 6,
        paddingRight: 8,
      }}
    >
      <Text
        style={{
          fontSize: 7,
          color: colors.muted,
          textTransform: "uppercase",
          marginBottom: 1,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 9 }}>{value || "—"}</Text>
    </View>
  );
}
