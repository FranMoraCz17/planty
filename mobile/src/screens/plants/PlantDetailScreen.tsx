import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import StorageService from "@/src/services/storageService";
import { useDemoData } from "@/src/data/DemoDataProvider";
import IdentifyService from "@/src/services/identifyService";
import DiagnoseService from "@/src/services/diagnoseService";
import {
  getDiagnosesByPlant,
  saveDiagnose,
  type DiagnoseRecord,
} from "@/src/services/diagnoseHistoryService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

// Convierte días numéricos a etiqueta legible
function daysToLabel(days: number | null | undefined): string {
  if (!days) return "Sin datos";
  if (days === 1) return "Diario";
  if (days <= 3) return `Cada ${days} días`;
  if (days === 7) return "Semanal";
  if (days === 14 || days === 15) return "Quincenal";
  if (days >= 28) return "Mensual";
  return `Cada ${days} días`;
}

function parseWateringDays(text: string | null | undefined): number | null {
  if (!text) return null;
  const normalized = text.toLowerCase();
  const exactMatch = normalized.match(/cada\s+(\d+)\s*d[íi]/i) ??
    normalized.match(/every\s+(\d+)\s*day/i);
  if (exactMatch) return parseInt(exactMatch[1], 10);
  const rangeMatch = normalized.match(/cada\s+(\d+)[–\-](\d+)\s*d[íi]/i) ??
    normalized.match(/every\s+(\d+)[–\-](\d+)\s*day/i);
  if (rangeMatch) {
    return Math.round((parseInt(rangeMatch[1], 10) + parseInt(rangeMatch[2], 10)) / 2);
  }
  if (normalized.includes("twice a week") || normalized.includes("2 veces")) return 3;
  if (normalized.includes("once a week") || normalized.includes("semanal")) return 7;
  if (normalized.includes("quincenal")) return 15;
  if (normalized.includes("mensual")) return 30;
  if (normalized.includes("daily") || normalized.includes("diario")) return 1;
  return null;
}

export default function PlantDetailScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const { plants, updatePlant } = useDemoData();

  const plant = plants.find((p) => p.id === plantId) ?? null;

  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [diagnoseHistory, setDiagnoseHistory] = useState<DiagnoseRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const carouselRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!plant) return;
    getDiagnosesByPlant(plant.id)
      .then(setDiagnoseHistory)
      .catch(() => setDiagnoseHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [plant?.id]);
  const SCREEN_WIDTH = Dimensions.get("window").width - Spacing.lg * 2;

  if (!plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Planta no encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const wateringDays = plant.wateringFrequencyDays ?? parseWateringDays(plant.wateringFrequencyLabel);
  // Cuando Gemini devuelve texto narrativo sin número extraíble, usar el label original como valor
  const wateringValue = wateringDays
    ? daysToLabel(wateringDays)
    : plant.aiAnalyzed && plant.wateringFrequencyLabel && plant.wateringFrequencyLabel !== "Cada 7 dias"
      ? plant.wateringFrequencyLabel
      : wateringDays === null && plant.aiWateringDetail
        ? "Ver descripción"
        : "Sin datos";

  // Todas las fotos: la principal + las adicionales, sin duplicados ni nulls
  const allPhotos: string[] = [
    ...(plant.photoUri ? [plant.photoUri] : []),
    ...(plant.photos ?? []).filter((p) => p !== plant.photoUri),
  ];

  const handleAddPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para agregar fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]) return;

    setAddingPhoto(true);
    try {
      const uploaded = await StorageService.uploadPlantPhoto(
        plant.userId,
        plant.id,
        result.assets[0].uri,
      );
      const newPhotos = [...(plant.photos ?? []), uploaded];
      await updatePlant(plant.id, {
        name: plant.name,
        scientificName: plant.scientificName,
        locationName: plant.locationName,
        wateringFrequencyLabel: plant.wateringFrequencyLabel,
        photos: newPhotos,
      });
    } catch (err) {
      Alert.alert("Error", "No se pudo agregar la foto.");
    } finally {
      setAddingPhoto(false);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCarouselIndex(idx);
  };

  const runDiagnose = async (photoUri: string) => {
    setDiagnosing(true);
    try {
      const result = await DiagnoseService.diagnoseFromUri(photoUri);
      const record = await saveDiagnose(plant.id, plant.name, result, photoUri);
      setDiagnoseHistory((prev) => [record, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al diagnosticar.";
      Alert.alert("Error de diagnóstico", msg);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleDiagnose = () => {
    const options: { text: string; onPress: () => void }[] = [];

    options.push({
      text: "Tomar foto con cámara",
      onPress: () => void (async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permiso necesario", "Necesitamos acceso a la cámara.");
          return;
        }
        const res = await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [3, 4] });
        if (!res.canceled && res.assets[0]) await runDiagnose(res.assets[0].uri);
      })(),
    });

    options.push({
      text: "Elegir de galería",
      onPress: () => void (async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permiso necesario", "Necesitamos acceso a la galería.");
          return;
        }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [3, 4] });
        if (!res.canceled && res.assets[0]) await runDiagnose(res.assets[0].uri);
      })(),
    });

    if (allPhotos.length > 0) {
      options.push({
        text: `Usar foto actual (${carouselIndex + 1}/${allPhotos.length})`,
        onPress: () => void runDiagnose(allPhotos[carouselIndex]),
      });
    }

    Alert.alert(
      "Diagnosticar planta",
      "Elige la foto que quieres analizar",
      [
        ...options,
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const handleAnalyze = async () => {
    if (!plant.photoUri) {
      Alert.alert(
        "Sin foto",
        "Esta planta no tiene foto. Editala y agregá una foto para poder analizarla con IA.",
      );
      return;
    }

    setAnalyzing(true);
    try {
      const result = await IdentifyService.identifyFromUri(plant.photoUri);
      if (!result.isPlant) {
        Alert.alert("Sin resultado", "La IA no pudo identificar una planta en la foto guardada.");
        return;
      }

      await updatePlant(plant.id, {
        name: plant.name,
        scientificName: plant.scientificName,
        locationName: plant.locationName,
        wateringFrequencyLabel: result.wateringFrequency || plant.wateringFrequencyLabel,
        wateringFrequencyDays: parseWateringDays(result.wateringFrequency),
        aiAnalyzed: true,
        aiDescription: result.description || undefined,
        aiLight: result.light || undefined,
        aiLightDetail: result.lightDetail || undefined,
        aiWateringDetail: result.wateringDetail || undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al analizar la planta.";
      Alert.alert("Error", msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {plant.name}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Editar planta"
          onPress={() => router.push(`/(app)/forms/plant?mode=edit&plantId=${plant.id}`)}
          hitSlop={12}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Carrusel de fotos */}
        <View style={{ position: "relative" }}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            style={{ borderRadius: BorderRadius.lg, overflow: "hidden" }}
          >
            {allPhotos.length > 0 ? (
              allPhotos.map((uri, i) => (
                <View key={i} style={[styles.heroWrap, { width: SCREEN_WIDTH }]}>
                  <Image source={{ uri }} style={styles.heroImage} />
                </View>
              ))
            ) : (
              <View style={[styles.heroWrap, { width: SCREEN_WIDTH }]}>
                <View style={styles.heroPlaceholder}>
                  <MaterialCommunityIcons name="leaf" size={64} color={colors.onPrimary} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Badge IA */}
          {plant.aiAnalyzed && (
            <View style={styles.aiBadge}>
              <MaterialCommunityIcons name="creation" size={12} color="#fff" />
              <Text style={styles.aiBadgeText}>Analizado por IA</Text>
            </View>
          )}

          {/* Indicadores de página */}
          {allPhotos.length > 1 && (
            <View style={styles.dotsRow}>
              {allPhotos.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === carouselIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Botón agregar foto */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar foto"
            onPress={() => void handleAddPhoto()}
            disabled={addingPhoto}
            style={({ pressed }) => [
              styles.addPhotoBtn,
              pressed && { opacity: 0.75 },
            ]}
          >
            {addingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Identidad */}
        <View style={styles.identityBlock}>
          <Text style={styles.commonName}>{plant.name}</Text>
          {plant.scientificName !== "Especie sin definir" && (
            <Text style={styles.scientificName}>{plant.scientificName}</Text>
          )}
        </View>

        {/* Descripción de IA o botón para analizar */}
        {plant.aiAnalyzed && plant.aiDescription ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="creation" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Descripción</Text>
            </View>
            <Text style={styles.bodyText}>{plant.aiDescription}</Text>
          </View>
        ) : !plant.aiAnalyzed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Analizar con IA"
            onPress={() => void handleAnalyze()}
            disabled={analyzing}
            style={({ pressed }) => [
              styles.analyzeCard,
              pressed && { opacity: 0.85 },
              analyzing && { opacity: 0.7 },
            ]}
          >
            {analyzing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="creation" size={24} color={colors.primary} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.analyzeTitle}>
                {analyzing ? "Analizando con IA..." : "Analizar con IA"}
              </Text>
              <Text style={styles.analyzeSubtitle}>
                {analyzing
                  ? "Gemini Vision está procesando la foto."
                  : "Obtiene descripción, cuidados y frecuencia de riego automáticamente."}
              </Text>
            </View>
            {!analyzing && (
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
            )}
          </Pressable>
        ) : null}

        {/* Cuidados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="water-outline" size={16} color={colors.accentCool} />
            <Text style={styles.sectionTitle}>Cuidados</Text>
          </View>
          <View style={styles.careGrid}>
            <CareCard
              icon="water-outline"
              iconColor={colors.accentCool}
              label="Riego"
              value={wateringValue}
              detail={plant.aiWateringDetail}
              colors={colors}
              isDark={isDark}
            />
            <CareCard
              icon="white-balance-sunny"
              iconColor={colors.accentWarm}
              label="Luz"
              value={plant.aiLight ?? "Sin datos"}
              detail={plant.aiLightDetail}
              colors={colors}
              isDark={isDark}
            />
          </View>
          {!plant.aiAnalyzed && (
            <Text style={styles.careHint}>
              Analizá con IA para obtener datos de cuidado precisos.
            </Text>
          )}
        </View>

        {/* Diagnóstico de salud */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Diagnosticar salud de la planta"
          onPress={handleDiagnose}
          disabled={diagnosing}
          style={({ pressed }) => [
            styles.diagnoseCard,
            pressed && { opacity: 0.85 },
            diagnosing && { opacity: 0.7 },
          ]}
        >
          {diagnosing ? (
            <ActivityIndicator color={colors.accentWarm} />
          ) : (
            <MaterialCommunityIcons name="stethoscope" size={24} color={colors.accentWarm} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.diagnoseTitle}>
              {diagnosing ? "Diagnosticando..." : "Diagnosticar salud"}
            </Text>
            <Text style={styles.diagnoseSubtitle}>
              {diagnosing
                ? "La IA está analizando el estado de tu planta."
                : "Detecta plagas, enfermedades y deficiencias con IA."}
            </Text>
          </View>
          {!diagnosing && (
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.accentWarm} />
          )}
        </Pressable>

        {/* Historial de diagnósticos */}
        {diagnoseHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={16} color={colors.accentWarm} />
              <Text style={styles.sectionTitle}>Historial de diagnósticos</Text>
            </View>
            {diagnoseHistory.map((entry, i) => (
              <DiagnoseEntry key={i} entry={entry} colors={colors} isDark={isDark} />
            ))}
          </View>
        )}

        {/* Área */}
        {plant.locationName && plant.locationName !== "Sin ubicación" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.primary} />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="sprout" size={16} color={colors.textSecondary} />
              <Text style={styles.locationText}>{plant.locationName}</Text>
            </View>
          </View>
        )}

        {/* Notas */}
        {plant.notes ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="note-text-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>Notas</Text>
            </View>
            <Text style={styles.bodyText}>{plant.notes}</Text>
          </View>
        ) : null}

        {/* Historial */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={16} color={colors.textSecondary} />
            <Text style={styles.sectionTitle}>Historial</Text>
          </View>
          <HistoryRow
            label="Agregada"
            value={formatDate(plant.createdAt)}
            colors={colors}
          />
          {plant.acquiredAt && (
            <HistoryRow
              label="Adquirida"
              value={formatDate(plant.acquiredAt)}
              colors={colors}
            />
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const HEALTH_COLOR: Record<string, string> = {
  saludable: "#16A34A",
  atencion: "#D97706",
  enferma: "#DC2626",
  critica: "#7F1D1D",
};
const HEALTH_LABEL: Record<string, string> = {
  saludable: "Saludable",
  atencion: "Atención",
  enferma: "Enferma",
  critica: "Crítica",
};

function DiagnoseEntry({
  entry,
  colors,
  isDark,
}: {
  entry: DiagnoseRecord;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const color = HEALTH_COLOR[entry.healthStatus] ?? colors.textSecondary;
  const label = HEALTH_LABEL[entry.healthStatus] ?? entry.healthStatus;
  const dateStr = (() => {
    try { return new Date(entry.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  })();

  return (
    <View style={[diagnoseEntryStyles.wrap, { borderLeftColor: color }]}>
      <View style={diagnoseEntryStyles.row}>
        <View style={[diagnoseEntryStyles.dot, { backgroundColor: color }]} />
        <Text style={[diagnoseEntryStyles.status, { color }]}>{label}</Text>
        <Text style={[diagnoseEntryStyles.date, { color: colors.textSecondary }]}>{dateStr}</Text>
      </View>
      <Text style={[diagnoseEntryStyles.summary, { color: colors.text }]} numberOfLines={2}>
        {entry.healthSummary}
      </Text>
      {entry.issues.length > 0 && (
        <View style={diagnoseEntryStyles.issuesRow}>
          {entry.issues.slice(0, 3).map((issue, i) => (
            <View key={i} style={[diagnoseEntryStyles.issuePill, { backgroundColor: isDark ? "#2A1A0E" : "#FEF3C7" }]}>
              <Text style={[diagnoseEntryStyles.issueText, { color: colors.accentWarm }]}>
                {issue.name}
              </Text>
            </View>
          ))}
        </View>
      )}
      {entry.immediateActions.length > 0 && (
        <Text style={[diagnoseEntryStyles.action, { color: colors.primary }]} numberOfLines={2}>
          → {entry.immediateActions[0]}
        </Text>
      )}
    </View>
  );
}

const diagnoseEntryStyles = StyleSheet.create({
  wrap: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    gap: 4,
    paddingVertical: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontFamily: Typography.family, fontSize: 13, fontWeight: "800" },
  date: { fontFamily: Typography.family, fontSize: 11, fontWeight: "500", marginLeft: "auto" },
  summary: { fontFamily: Typography.family, fontSize: 12, lineHeight: 17 },
  issuesRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  issuePill: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  issueText: { fontFamily: Typography.family, fontSize: 10, fontWeight: "700" },
  action: { fontFamily: Typography.family, fontSize: 12, fontWeight: "600", marginTop: 2 },
});

function CareCard({
  icon, iconColor, label, value, detail, colors, isDark,
}: {
  icon: IconName; iconColor: string; label: string;
  value: string; detail?: string; colors: ThemeColors; isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.careCard}>
      <View style={[s.careIconWrap, { backgroundColor: iconColor + "22" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={s.careLabel}>{label}</Text>
      <Text style={s.careValue}>{value}</Text>
      {detail ? <Text style={s.careDetail}>{detail}</Text> : null}
    </View>
  );
}

function HistoryRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ color: colors.textSecondary, fontFamily: Typography.family, fontSize: 13, fontWeight: "600" }}>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontFamily: Typography.family, fontSize: 13, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CR", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { color: colors.textSecondary, fontFamily: Typography.family, fontSize: 14 },
    headerBar: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
    },
    headerTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1, fontWeight: "700", flex: 1,
      textAlign: "center", marginHorizontal: Spacing.sm,
    },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },
    heroWrap: {
      width: "100%", aspectRatio: 16 / 10, borderRadius: BorderRadius.lg,
      overflow: "hidden", backgroundColor: colors.primary, position: "relative",
    },
    heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
    heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    aiBadge: {
      position: "absolute", top: Spacing.sm, left: Spacing.sm,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: BorderRadius.full, borderWidth: 1,
      borderColor: "rgba(163,230,53,0.4)",
    },
    aiBadgeText: {
      color: "#fff", fontFamily: Typography.family, fontSize: 11, fontWeight: "700",
    },
    identityBlock: { gap: 4 },
    commonName: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 10, fontWeight: "800", letterSpacing: -0.5,
    },
    scientificName: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontStyle: "italic",
    },
    section: {
      backgroundColor: colors.surfaceCard, borderRadius: BorderRadius.lg,
      borderWidth: 1, borderColor: colors.border, padding: Spacing.lg, gap: Spacing.sm,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1, fontWeight: "800",
    },
    bodyText: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1, lineHeight: 22,
    },
    analyzeCard: {
      flexDirection: "row", alignItems: "center", gap: Spacing.md,
      backgroundColor: isDark ? "#0F2318" : "#F0FDF4",
      borderRadius: BorderRadius.lg, borderWidth: 1.5,
      borderColor: isDark ? "#1A4028" : "#BBF7D0",
      padding: Spacing.lg,
    },
    analyzeTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontWeight: "800",
    },
    analyzeSubtitle: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1, marginTop: 2, lineHeight: 18,
    },
    careGrid: { flexDirection: "row", gap: Spacing.sm },
    careCard: {
      flex: 1, backgroundColor: isDark ? "#1A1A1A" : "#F9FAFB",
      borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border,
      padding: Spacing.md, gap: 4,
    },
    careIconWrap: {
      width: 32, height: 32, borderRadius: BorderRadius.full,
      alignItems: "center", justifyContent: "center", marginBottom: 4,
    },
    careLabel: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4,
    },
    careValue: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: 14, fontWeight: "800",
    },
    careDetail: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 11, lineHeight: 15, marginTop: 2,
    },
    careHint: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 12, fontStyle: "italic", textAlign: "center", marginTop: 2,
    },
    diagnoseCard: {
      flexDirection: "row", alignItems: "center", gap: Spacing.md,
      backgroundColor: isDark ? "#1A0F00" : "#FFFBF0",
      borderRadius: BorderRadius.lg, borderWidth: 1.5,
      borderColor: isDark ? "#3B2A10" : "#FDE68A",
      padding: Spacing.lg,
    },
    diagnoseTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontWeight: "800",
    },
    diagnoseSubtitle: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1, marginTop: 2, lineHeight: 18,
    },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    locationText: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontWeight: "600",
    },
    dotsRow: {
      position: "absolute", bottom: Spacing.sm,
      left: 0, right: 0, flexDirection: "row",
      justifyContent: "center", alignItems: "center", gap: 5,
    },
    dot: { borderRadius: 99 },
    dotActive: { width: 18, height: 6, backgroundColor: "#fff" },
    dotInactive: { width: 6, height: 6, backgroundColor: "rgba(255,255,255,0.45)" },
    addPhotoBtn: {
      position: "absolute", bottom: Spacing.sm, right: Spacing.sm,
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    },
  });
