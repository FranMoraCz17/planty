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
    <Text style={{
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
    }}>
      {title}
    </Text>
  );
}

function SettingRow({
  icon,
  iconColor,
  label,
  hint,
  value,
  onToggle,
  last,
}: {
  icon: IconName;
  iconColor?: string;
  label: string;
  hint?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[
      rowStyles.row,
      !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
    ]}>
      <View style={[rowStyles.iconWrap, { backgroundColor: (iconColor ?? colors.primary) + "22" }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor ?? colors.primary} />
      </View>
      <View style={rowStyles.copy}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{label}</Text>
        {hint && <Text style={[rowStyles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
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
  iconColor,
  iconBg,
  label,
  hint,
  onPress,
  danger,
  last,
}: {
  icon: IconName;
  iconColor?: string;
  iconBg?: string;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors, isDark } = useAppTheme();
  const fg = danger ? colors.error : (iconColor ?? colors.primary);
  const bg = iconBg ?? (danger
    ? (isDark ? "#3A1414" : "#FEE2E2")
    : fg + "22");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.row,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={16} color={fg} />
      </View>
      <View style={rowStyles.copy}>
        <Text style={[rowStyles.label, { color: danger ? colors.error : colors.text }]}>{label}</Text>
        {hint && <Text style={[rowStyles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
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
    <View style={{
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    }}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, toggleTheme } = useAppTheme();

  const [notifRiego, setNotifRiego] = useState(true);
  const [notifDiag, setNotifDiag] = useState(true);
  const [notifResumen, setNotifResumen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
          onPress: () => Alert.alert("Próximamente", "Esta función estará disponible en la próxima versión."),
        },
      ],
    );
  };

  const handleExport = () => {
    Alert.alert("Próximamente", "La exportación de datos estará disponible en la próxima versión.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, gap: Spacing.sm, paddingTop: Spacing.sm }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{
              width: 40, height: 40, borderRadius: 20,
              alignItems: "center", justifyContent: "center",
              backgroundColor: colors.surfaceCard,
              borderWidth: 1, borderColor: colors.border,
            }, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View>
            <Text style={{ color: colors.text, fontFamily: Typography.family, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 }}>
              Configuración
            </Text>
            <Text style={{ color: colors.textSecondary, fontFamily: Typography.family, fontSize: 13, fontWeight: "500" }}>
              App y privacidad
            </Text>
          </View>
        </View>

        {/* Apariencia */}
        <SectionHeader title="Apariencia" />
        <Card>
          <NavRow
            icon={mode === "dark" ? "weather-night" : "weather-sunny"}
            iconColor={mode === "dark" ? "#8B5CF6" : "#F59E0B"}
            label={mode === "dark" ? "Modo oscuro" : "Modo claro"}
            hint="Toca para cambiar el tema"
            onPress={toggleTheme}
            last
          />
        </Card>

        {/* Notificaciones */}
        <SectionHeader title="Notificaciones" />
        <Card>
          <SettingRow
            icon="water-outline"
            iconColor={colors.accentCool}
            label="Recordatorios de riego"
            hint="Alertas cuando toque regar una planta"
            value={notifRiego}
            onToggle={setNotifRiego}
          />
          <SettingRow
            icon="stethoscope"
            iconColor={colors.accentWarm}
            label="Diagnósticos programados"
            hint="Aviso cuando una planta necesita revisión"
            value={notifDiag}
            onToggle={setNotifDiag}
          />
          <SettingRow
            icon="chart-bar"
            iconColor={colors.primary}
            label="Resumen semanal"
            hint="Reporte de salud de tu colección cada lunes"
            value={notifResumen}
            onToggle={setNotifResumen}
            last
          />
        </Card>

        {/* Accesibilidad */}
        <SectionHeader title="Accesibilidad" />
        <Card>
          <SettingRow
            icon="motion-sensor-off"
            iconColor={colors.accentLavender}
            label="Reducir animaciones"
            hint="Menos movimiento en transiciones"
            value={reduceMotion}
            onToggle={setReduceMotion}
          />
          <SettingRow
            icon="vibrate"
            iconColor={colors.primary}
            label="Vibración táctil"
            hint="Respuesta háptica en acciones"
            value={hapticsEnabled}
            onToggle={setHapticsEnabled}
            last
          />
        </Card>

        {/* Permisos */}
        <SectionHeader title="Permisos del sistema" />
        <Card>
          <NavRow
            icon="shield-lock-outline"
            iconColor={colors.primary}
            label="Gestionar permisos"
            hint="Cámara, ubicación y notificaciones"
            onPress={() => void Linking.openSettings()}
            last
          />
        </Card>

        {/* Privacidad */}
        <SectionHeader title="Privacidad y datos" />
        <Card>
          <NavRow
            icon="database-export-outline"
            iconColor={colors.accentCool}
            label="Exportar mis datos"
            hint="Descarga un archivo con toda tu información"
            onPress={handleExport}
          />
          <NavRow
            icon="account-edit-outline"
            iconColor={colors.primary}
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

        {/* Acerca de */}
        <SectionHeader title="Acerca de" />
        <Card>
          <NavRow
            icon="github"
            iconColor={isDark ? "#E2E8F0" : "#1E293B"}
            iconBg={isDark ? "#2D3748" : "#F1F5F9"}
            label="Código fuente"
            hint="github.com/FranMoraCz17/planty"
            onPress={() => void Linking.openURL("https://github.com/FranMoraCz17/planty")}
          />
          <NavRow
            icon="leaf"
            iconColor={colors.primary}
            label="Versión"
            hint="Planty v1.0 — EIF411 UNA Brunca 2025"
            onPress={() => {}}
            last
          />
        </Card>

        {/* Cuenta */}
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
