import { useMemo } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";
import TopBar from "@/src/components/layout/TopBar";

// Catalogo educativo de enfermedades comunes. Es informacion general de jardineria,
// no mock de datos del usuario.
const commonDiseases = [
  {
    id: "dis-1",
    nombre: "Oidio",
    sintoma: "Polvo blanco sobre hojas nuevas",
    accion: "Aislar planta y mejorar ventilacion.",
  },
  {
    id: "dis-2",
    nombre: "Pudricion de raiz",
    sintoma: "Hojas caidas y sustrato con olor fuerte",
    accion: "Reducir riego y revisar drenaje.",
  },
  {
    id: "dis-3",
    nombre: "Mancha foliar",
    sintoma: "Puntos marrones con borde amarillo",
    accion: "Retirar hojas afectadas y controlar humedad.",
  },
] as const;

function getPriorityFromFrequency(label: string): "Alta" | "Media" | "Baja" {
  const match = label.match(/(\d+)/);
  if (!match) return "Media";
  const days = parseInt(match[1], 10);
  if (days <= 4) return "Alta";
  if (days <= 8) return "Media";
  return "Baja";
}

export default function CareTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { plants } = useDemoData();
  const styles = createStyles(colors, isDark);

  const reminders = useMemo(
    () =>
      plants.slice(0, 4).map((plant) => ({
        id: `rem-${plant.id}`,
        title: `Riego - ${plant.name}`,
        time: plant.wateringFrequencyLabel,
        priority: getPriorityFromFrequency(plant.wateringFrequencyLabel),
      })),
    [plants],
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Cuidado" subtitle="Recordatorios y diagnostico" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Centro de cuidado</Text>
          <Text style={styles.body}>
            Monitorea recordatorios, revisa diagnosticos recientes y consulta enfermedades comunes.
          </Text>
        </View>

        <View style={styles.cameraCard}>
          <View style={styles.cameraHeader}>
            <View style={styles.cameraIconWrap}>
              <MaterialCommunityIcons name="camera" size={20} color={colors.onPrimary} />
            </View>
            <View style={styles.cameraInfo}>
              <Text style={styles.subtitle}>Diagnostico por camara</Text>
              <Text style={styles.caption}>Toma una foto para evaluar sintomas foliares.</Text>
            </View>
          </View>

          <ThemedButton
            label="Abrir camara para diagnosticar"
            accessibilityLabel="Abrir camara para diagnosticar planta"
            onPress={() => router.push("/(app)/(tabs)/identify")}
          />
        </View>

        <View style={styles.listCard}>
          <Text style={styles.subtitle}>Recordatorios proximos</Text>
          {reminders.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.body}>
                Agrega plantas a tu coleccion para generar recordatorios automaticos de riego.
              </Text>
            </View>
          ) : (
            reminders.map((item) => (
              <View key={item.id} style={styles.reminderItem}>
                <View style={styles.reminderTop}>
                  <Text style={styles.reminderTitle}>{item.title}</Text>
                  <View style={styles.priorityChip}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                </View>
                <Text style={styles.reminderTime}>{item.time}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.subtitle}>Historial de diagnosticos</Text>
          <View style={styles.emptyBlock}>
            <Text style={styles.body}>
              Aun no se ha guardado historial. Usa el diagnostico por camara para empezar a registrar tus revisiones.
            </Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.subtitle}>Enfermedades comunes</Text>
          {commonDiseases.map((item) => (
            <View key={item.id} style={styles.diseaseCard}>
              <Text style={styles.diseaseTitle}>{item.nombre}</Text>
              <Text style={styles.diseaseText}>Sintoma: {item.sintoma}</Text>
              <Text style={styles.diseaseText}>Accion: {item.accion}</Text>
            </View>
          ))}
        </View>

        <ThemedButton
          label="Gestionar coleccion"
          accessibilityLabel="Ir a pantalla Mis plantas"
          onPress={() => router.push("/(app)/(tabs)/my-plants")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    headerCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    cameraCard: {
      backgroundColor: isDark ? "#1E2F2A" : "#E7F6F1",
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.md,
    },
    cameraHeader: {
      flexDirection: "row",
      gap: Spacing.sm,
      alignItems: "center",
    },
    cameraIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    cameraInfo: {
      flex: 1,
      gap: 2,
    },
    listCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 2,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    subtitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    body: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    caption: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    reminderItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      gap: Spacing.xs,
    },
    reminderTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: Spacing.sm,
    },
    reminderTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
      lineHeight: Typography.body.lineHeight,
      flex: 1,
    },
    priorityChip: {
      backgroundColor: colors.accentWarm,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    priorityText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    reminderTime: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    emptyBlock: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    diagnosisRow: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    diagnosisContent: {
      flex: 1,
      gap: 2,
    },
    diagnosisPlant: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    diagnosisResult: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    metaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    metaDot: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    diseaseCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      gap: 2,
    },
    diseaseTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    diseaseText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
  });
