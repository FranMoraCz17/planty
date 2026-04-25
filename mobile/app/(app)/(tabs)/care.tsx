import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

const reminders = [
  { title: "Riego - Potos", time: "Hoy 6:00 PM", priority: "Alta" },
  { title: "Fertilizar - Monstera", time: "Manana 8:00 AM", priority: "Media" },
  { title: "Rotar maceta - Ficus", time: "Viernes 4:00 PM", priority: "Baja" },
] as const;

const diagnosisHistory = [
  {
    id: "dx-1",
    planta: "Potos",
    resultado: "Clorosis por riego irregular",
    confianza: "91%",
    fecha: "11 Mar",
  },
  {
    id: "dx-2",
    planta: "Hortensia",
    resultado: "Posible oidio inicial",
    confianza: "84%",
    fecha: "09 Mar",
  },
  {
    id: "dx-3",
    planta: "Lirio de la paz",
    resultado: "Sin enfermedad detectada",
    confianza: "96%",
    fecha: "06 Mar",
  },
] as const;

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

export default function CareTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
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
          {reminders.map((item) => (
            <View key={item.title} style={styles.reminderItem}>
              <View style={styles.reminderTop}>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <View style={styles.priorityChip}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              </View>
              <Text style={styles.reminderTime}>{item.time}</Text>
            </View>
          ))}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.subtitle}>Historial de diagnosticos</Text>
          {diagnosisHistory.map((item) => (
            <Pressable key={item.id} style={styles.diagnosisRow}>
              <View style={styles.diagnosisContent}>
                <Text style={styles.diagnosisPlant}>{item.planta}</Text>
                <Text style={styles.diagnosisResult}>{item.resultado}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{item.confianza}</Text>
                  <Text style={styles.metaDot}>-</Text>
                  <Text style={styles.metaText}>{item.fecha}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </Pressable>
          ))}
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
