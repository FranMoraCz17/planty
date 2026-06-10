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
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "@/src/components/ui/GlassCard";
import GlassChip from "@/src/components/ui/GlassChip";
import StorageService from "@/src/services/storageService";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
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

  // Respaldo de foto: si la planta no tiene foto subida, usamos la de su
  // especie desde Wikipedia (mismo hook que la Colección).
  const { photoUri: speciesPhoto } = usePlantPhoto({
    userPhotoUri: plant?.photoUri ?? null,
    scientificName: plant?.scientificName ?? null,
  });

  // El héroe va a sangre completa: cada foto ocupa el ancho total de la ventana.
  const PAGE_WIDTH = Dimensions.get("window").width;

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

  // Todas las fotos subidas: la principal + las adicionales, sin duplicados
  const allPhotos: string[] = [
    ...(plant.photoUri ? [plant.photoUri] : []),
    ...(plant.photos ?? []).filter((p) => p !== plant.photoUri),
  ];
  // Fotos a mostrar en el héroe: las subidas, o el respaldo de la especie.
  const displayPhotos =
    allPhotos.length > 0 ? allPhotos : speciesPhoto ? [speciesPhoto] : [];

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
    const idx = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
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

  const hasScientific =
    plant.scientificName &&
    plant.scientificName !== "Especie sin definir" &&
    plant.scientificName !== "Especie sin definir";

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO: foto arriba ── */}
        <View style={styles.hero}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {displayPhotos.length > 0 ? (
              displayPhotos.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.heroImage, { width: PAGE_WIDTH }]}
                />
              ))
            ) : (
              <View style={[styles.heroPlaceholder, { width: PAGE_WIDTH }]}>
                <MaterialCommunityIcons name="leaf" size={72} color={colors.onPrimary} />
              </View>
            )}
          </ScrollView>

          {/* Scrim superior para los botones */}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "transparent"]}
            locations={[0, 0.4]}
            style={styles.heroTopScrim}
            pointerEvents="none"
          />

          {/* Desvanecido inferior: la foto se disuelve en el fondo (truco yate) */}
          <LinearGradient
            colors={["transparent", colors.surface]}
            locations={[0.5, 1]}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          {/* Botones flotantes de cristal */}
          <SafeAreaView edges={["top"]} style={styles.heroTopBar} pointerEvents="box-none">
            <GlassButton
              icon="chevron-left"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
            />
            <View style={styles.heroTopRight}>
              <GlassButton
                icon={addingPhoto ? undefined : "camera-plus-outline"}
                loading={addingPhoto}
                accessibilityLabel="Agregar foto"
                onPress={() => void handleAddPhoto()}
              />
              <GlassButton
                icon="pencil-outline"
                accessibilityLabel="Editar planta"
                onPress={() => router.push(`/(app)/forms/plant?mode=edit&plantId=${plant.id}`)}
              />
            </View>
          </SafeAreaView>

          {/* Contador de fotos discreto */}
          {displayPhotos.length > 1 && (
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {carouselIndex + 1} / {displayPhotos.length}
              </Text>
            </View>
          )}
        </View>

        {/* ── PANEL transparente (cristal) que sube sobre la foto ── */}
        <View style={styles.panelWrap}>
          <GlassCard radius={BorderRadius.lg} intensity={55}>
            <View style={styles.panelInner}>
              {plant.aiAnalyzed && <Text style={styles.aiOverline}>ANALIZADO POR IA</Text>}
              <Text style={styles.commonName}>{plant.name}</Text>
              {hasScientific && (
                <Text style={styles.scientificName}>{plant.scientificName}</Text>
              )}

              {plant.locationName && plant.locationName !== "Sin ubicación" && (
                <View style={styles.panelLocation}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={15}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.panelLocationText}>{plant.locationName}</Text>
                </View>
              )}

              <View style={styles.specsRow}>
                <GlassChip icon="water-outline" value={wateringValue} />
                <GlassChip icon="white-balance-sunny" value={plant.aiLight ?? "Sin datos"} />
              </View>

              {plant.aiAnalyzed && plant.aiDescription ? (
                <Text style={styles.panelDescription} numberOfLines={4}>
                  {plant.aiDescription}
                </Text>
              ) : null}

              {/* CTA principal */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Diagnosticar salud"
                onPress={handleDiagnose}
                disabled={diagnosing}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
              >
                {diagnosing ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="stethoscope"
                      size={18}
                      color={colors.onPrimary}
                    />
                    <Text style={styles.ctaText}>Diagnosticar salud</Text>
                  </>
                )}
              </Pressable>
            </View>
          </GlassCard>
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
              label="Riego"
              value={wateringValue}
              detail={plant.aiWateringDetail}
              colors={colors}
              isDark={isDark}
            />
            <CareCard
              icon="white-balance-sunny"
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
    </View>
  );
}

// Botón circular de cristal para flotar sobre las fotos.
function GlassButton({
  icon,
  onPress,
  accessibilityLabel,
  loading,
}: {
  icon?: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [glassButtonStyles.btn, pressed && { opacity: 0.7 }]}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={glassButtonStyles.tint} />
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <MaterialCommunityIcons name={icon ?? "circle-small"} size={22} color="#fff" />
      )}
    </Pressable>
  );
}

const glassButtonStyles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
});

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
  icon, label, value, detail, colors, isDark,
}: {
  icon: IconName; label: string;
  value: string; detail?: string; colors: ThemeColors; isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.careCard}>
      <View style={s.careHeaderRow}>
        <MaterialCommunityIcons name={icon} size={15} color={colors.textSecondary} />
        <Text style={s.careLabel}>{label}</Text>
      </View>
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
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.xxl, paddingBottom: Spacing.sm,
    },
    headerTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1, fontWeight: "700", flex: 1,
      textAlign: "center", marginHorizontal: Spacing.sm,
    },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 40, gap: Spacing.lg },

    // ── HERO a sangre ──
    hero: {
      marginHorizontal: -Spacing.lg,
      height: 360,
      position: "relative",
      overflow: "hidden",
      backgroundColor: colors.primary,
    },
    heroImage: { height: 360, resizeMode: "cover" },
    heroPlaceholder: {
      height: 360, alignItems: "center", justifyContent: "center",
      backgroundColor: colors.primary,
    },
    heroTopScrim: {
      position: "absolute", top: 0, left: 0, right: 0, height: 130, zIndex: 1,
    },
    heroBottomFade: {
      position: "absolute", left: 0, right: 0, bottom: 0, height: 200, zIndex: 1,
    },
    heroTopBar: {
      position: "absolute", top: 0, left: 0, right: 0,
      flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
      paddingHorizontal: Spacing.lg, zIndex: 3,
    },
    heroTopRight: { flexDirection: "row", gap: Spacing.sm },
    photoCounter: {
      position: "absolute", top: 60, left: 0, right: 0,
      alignItems: "center", zIndex: 2,
    },
    photoCounterText: {
      color: "#fff", fontFamily: Typography.family, fontSize: 12, fontWeight: "700",
      backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 10, paddingVertical: 3,
      borderRadius: BorderRadius.full, overflow: "hidden",
    },

    // ── Panel de cristal que sube sobre la foto ──
    panelWrap: {
      marginTop: -72,
      zIndex: 2,
    },
    panelInner: {
      padding: Spacing.lg,
      gap: 4,
    },
    aiOverline: { ...Typography.overline, color: colors.primary, marginBottom: 2 },
    commonName: {
      color: colors.text, fontFamily: Typography.serif,
      fontSize: 32, fontWeight: "700", letterSpacing: -0.5, lineHeight: 36,
    },
    scientificName: {
      color: colors.textSecondary, fontFamily: Typography.serif,
      fontSize: 15, fontStyle: "italic",
    },
    panelLocation: {
      flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4,
    },
    panelLocationText: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 13, fontWeight: "600",
    },
    specsRow: {
      flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, flexWrap: "wrap",
    },
    panelDescription: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 14, lineHeight: 21, marginTop: Spacing.md,
    },
    cta: {
      marginTop: Spacing.lg, height: 52, borderRadius: BorderRadius.full,
      backgroundColor: colors.primary, flexDirection: "row",
      alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    },
    ctaText: {
      color: colors.onPrimary, fontFamily: Typography.family,
      fontSize: 16, fontWeight: "700",
    },

    // ── Secciones translúcidas flotantes ──
    section: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.lg, gap: Spacing.sm,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    sectionTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1, fontWeight: "700",
    },
    bodyText: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1, lineHeight: 22,
    },
    analyzeCard: {
      flexDirection: "row", alignItems: "center", gap: Spacing.md,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg, borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.lg,
    },
    analyzeTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontWeight: "700",
    },
    analyzeSubtitle: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1, marginTop: 2, lineHeight: 18,
    },
    careGrid: { flexDirection: "row", gap: Spacing.sm },
    careCard: {
      flex: 1,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
      borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.md, gap: 4,
    },
    careHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    careLabel: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4,
    },
    careValue: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: 15, fontWeight: "700",
    },
    careDetail: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 11, lineHeight: 15, marginTop: 2,
    },
    careHint: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 12, fontStyle: "italic", textAlign: "center", marginTop: 2,
    },
  });
