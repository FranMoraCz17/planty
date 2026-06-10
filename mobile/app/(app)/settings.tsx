import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { auth } from "@/src/firebase/firebaseConfig";
import { useDemoData } from "@/src/data/DemoDataProvider";
import SeedService from "@/src/services/seedService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function SectionHeader({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{
        ...Typography.overline,
        color: colors.textSecondary,
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
      }}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function SettingRow({
  icon,
  label,
  hint,
  value,
  onToggle,
  last,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        rowStyles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={colors.textSecondary} />
      <View style={rowStyles.copy}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        {hint ? (
          <Text style={[rowStyles.hint, { color: colors.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function NavRow({
  icon,
  label,
  hint,
  onPress,
  danger,
  last,
}: {
  icon: IconName;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  const fg = danger ? colors.error : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.6 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={fg} />
      <View style={rowStyles.copy}>
        <Text style={[rowStyles.label, { color: danger ? colors.error : colors.text }]}>
          {label}
        </Text>
        {hint ? (
          <Text style={[rowStyles.hint, { color: colors.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
  },
  copy: { flex: 1, gap: 1 },
  label: {
    fontFamily: Typography.family,
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  hint: {
    fontFamily: Typography.family,
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
});

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        marginHorizontal: Spacing.lg,
        backgroundColor: colors.surfaceCard,
        borderRadius: BorderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, toggleTheme } = useAppTheme();
  const { currentUserId, createArea, createPlant } = useDemoData();
  const styles = createStyles(colors);

  const [notifRiego, setNotifRiego] = useState(true);
  const [notifDiag, setNotifDiag] = useState(true);
  const [notifResumen, setNotifResumen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = () => {
    Alert.alert(
      "Llenar con datos de ejemplo",
      "Se crearán áreas, plantas y registros de diagnóstico de muestra en tu cuenta. Úsalo en una cuenta de demostración.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Llenar",
          onPress: () => {
            void (async () => {
              try {
                setIsSeeding(true);
                const summary = await SeedService.seedDemoData({
                  currentUserId,
                  createArea,
                  createPlant,
                });
                Alert.alert(
                  "Datos creados",
                  `Se agregaron ${summary.areas} áreas, ${summary.plants} plantas y ${summary.diagnoses} diagnósticos.`,
                );
              } catch (e) {
                Alert.alert(
                  "Error",
                  e instanceof Error ? e.message : "No se pudieron crear los datos.",
                );
              } finally {
                setIsSeeding(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "No se pudo cerrar la sesión.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      "Borrar todos mis datos",
      "Esta acción elimina tus plantas, áreas e historial de diagnósticos de forma permanente. No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: () =>
            Alert.alert("Próximamente", "Esta función estará disponible en la próxima versión."),
        },
      ],
    );
  };

  const handleExport = () => {
    Alert.alert("Próximamente", "La exportación de datos estará disponible en la próxima versión.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Apariencia" />
        <Card>
          <NavRow
            icon={mode === "dark" ? "weather-night" : "weather-sunny"}
            label={mode === "dark" ? "Modo oscuro" : "Modo claro"}
            hint="Toca para cambiar el tema"
            onPress={toggleTheme}
            last
          />
        </Card>

        <SectionHeader title="Notificaciones" />
        <Card>
          <SettingRow
            icon="water-outline"
            label="Recordatorios de riego"
            hint="Alertas cuando toque regar una planta"
            value={notifRiego}
            onToggle={setNotifRiego}
          />
          <SettingRow
            icon="stethoscope"
            label="Diagnósticos programados"
            hint="Aviso cuando una planta necesita revisión"
            value={notifDiag}
            onToggle={setNotifDiag}
          />
          <SettingRow
            icon="chart-bar"
            label="Resumen semanal"
            hint="Reporte de salud de tu colección cada lunes"
            value={notifResumen}
            onToggle={setNotifResumen}
            last
          />
        </Card>

        <SectionHeader title="Accesibilidad" />
        <Card>
          <SettingRow
            icon="motion-sensor-off"
            label="Reducir animaciones"
            hint="Menos movimiento en transiciones"
            value={reduceMotion}
            onToggle={setReduceMotion}
          />
          <SettingRow
            icon="vibrate"
            label="Vibración táctil"
            hint="Respuesta háptica en acciones"
            value={hapticsEnabled}
            onToggle={setHapticsEnabled}
            last
          />
        </Card>

        <SectionHeader title="Permisos del sistema" />
        <Card>
          <NavRow
            icon="shield-lock-outline"
            label="Gestionar permisos"
            hint="Cámara, ubicación y notificaciones"
            onPress={() => void Linking.openSettings()}
            last
          />
        </Card>

        <SectionHeader title="Privacidad y datos" />
        <Card>
          <NavRow
            icon="database-export-outline"
            label="Exportar mis datos"
            hint="Descarga un archivo con toda tu información"
            onPress={handleExport}
          />
          <NavRow
            icon="account-edit-outline"
            label="Editar perfil"
            hint="Nombre, usuario y foto"
            onPress={() => router.push("/(app)/forms/user")}
          />
          <NavRow
            icon="trash-can-outline"
            label="Borrar todos mis datos"
            hint="Elimina plantas, áreas e historial"
            onPress={handleDeleteData}
            danger
            last
          />
        </Card>

        <SectionHeader title="Acerca de" />
        <Card>
          <NavRow
            icon="github"
            label="Código fuente"
            hint="github.com/FranMoraCz17/planty"
            onPress={() => void Linking.openURL("https://github.com/FranMoraCz17/planty")}
          />
          <NavRow
            icon="leaf"
            label="Versión"
            hint="Planty v1.0 — EIF411 UNA Brunca 2025"
            onPress={() => {}}
            last
          />
        </Card>

        <SectionHeader title="Desarrollo" />
        <Card>
          <NavRow
            icon="database-plus-outline"
            label={isSeeding ? "Creando datos..." : "Llenar con datos de ejemplo"}
            hint="Áreas, plantas y diagnósticos de muestra"
            onPress={handleSeed}
            last
          />
        </Card>

        <SectionHeader title="Cuenta" />
        <Card>
          <NavRow
            icon="logout"
            label={isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
            onPress={() => void handleSignOut()}
            danger
            last
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    backBtn: {
      width: 26,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    headerTitle: {
      ...Typography.title,
      color: colors.text,
    },
    content: {
      paddingBottom: 120,
      gap: Spacing.xs,
    },
  });
