import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import type { PlantDocument } from "@/src/services/plantService";
import PhotoDetailSheet from "@/src/components/ui/PhotoDetailSheet";
import GlassChip from "@/src/components/ui/GlassChip";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface HerbariumEntry {
  speciesKey: string;
  name: string;
  scientificName: string;
  photoUri?: string;
  count: number;
  aiDescription?: string;
  aiLight?: string;
  family?: string;
  discoveredAt?: string;
}

function buildEntries(plants: PlantDocument[]): HerbariumEntry[] {
  const map = new Map<string, HerbariumEntry>();
  plants.forEach((plant) => {
    const key = plant.scientificName?.toLowerCase().replace(/\s+/g, "-") ?? plant.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        speciesKey: key,
        name: plant.name,
        scientificName: plant.scientificName ?? "",
        photoUri: plant.photoUri,
        count: 1,
        aiDescription: plant.aiDescription,
        aiLight: plant.aiLight,
        discoveredAt: plant.createdAt,
      });
    } else {
      existing.count += 1;
      if (!existing.photoUri && plant.photoUri) existing.photoUri = plant.photoUri;
      if (!existing.aiDescription && plant.aiDescription) existing.aiDescription = plant.aiDescription;
      if (!existing.aiLight && plant.aiLight) existing.aiLight = plant.aiLight;
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return "—"; }
}

export default function HerbariumScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { getPlantsByUser, currentUserId } = useDemoData();
  const styles = createStyles(colors, isDark);

  const plants = getPlantsByUser(currentUserId);
  const entries = buildEntries(plants);

  const [selected, setSelected] = useState<HerbariumEntry | null>(null);

  // Respaldo de foto por especie (Wikipedia) si la foto subida falla al cargar.
  const { photoUri: speciesFallback } = usePlantPhoto({
    scientificName: selected?.scientificName,
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Herbario</Text>
          <Text style={styles.headerSubtitle}>
            {entries.length} {entries.length === 1 ? "especie descubierta" : "especies descubiertas"}
          </Text>
        </View>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons
            name="book-open-page-variant-outline"
            size={56}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Sin fichas todavía</Text>
          <Text style={styles.emptyBody}>
            Cuando identifiques plantas con IA, sus especies aparecerán aquí como fichas botánicas coleccionables.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry) => (
            <Pressable
              key={entry.speciesKey}
              accessibilityRole="button"
              accessibilityLabel={`Ver ficha de ${entry.name}`}
              onPress={() => setSelected(entry)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
            >
              <View style={styles.cardPhotoWrap}>
                {entry.photoUri ? (
                  <Image source={{ uri: entry.photoUri }} style={styles.cardPhoto} />
                ) : (
                  <View style={styles.cardPhotoPlaceholder}>
                    <MaterialCommunityIcons name="leaf" size={28} color={colors.primary} />
                  </View>
                )}

                {/* Badge analizada con IA */}
                {entry.aiDescription && (
                  <View style={styles.aiBadge}>
                    <MaterialCommunityIcons name="creation" size={9} color="#fff" />
                  </View>
                )}

                {/* Badge cantidad */}
                {entry.count > 1 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>×{entry.count}</Text>
                  </View>
                )}

                {/* Overlay nombre en la foto */}
                <View style={styles.cardOverlay} pointerEvents="none">
                  <Text style={styles.cardOverlayName} numberOfLines={2}>{entry.name}</Text>
                </View>
              </View>

              {entry.scientificName ? (
                <Text style={styles.cardScientific} numberOfLines={1}>{entry.scientificName}</Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Detalle de ficha — patrón yate (foto a sangre + hoja de cristal) */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <PhotoDetailSheet
            photoUri={selected.photoUri ?? null}
            fallbackUri={speciesFallback}
            placeholderIcon="leaf"
            closeIcon="close"
            onClose={() => setSelected(null)}
          >
            <Text style={styles.sheetOverline}>FICHA DE HERBARIO</Text>
            <Text style={styles.sheetName}>{selected.name}</Text>
            {selected.scientificName ? (
              <Text style={styles.sheetScientific}>{selected.scientificName}</Text>
            ) : null}

            <View style={styles.sheetChips}>
              <GlassChip
                icon="sprout-outline"
                value={String(selected.count)}
                label={selected.count === 1 ? "planta" : "plantas"}
              />
              {selected.discoveredAt ? (
                <GlassChip
                  icon="calendar-outline"
                  value={new Date(selected.discoveredAt).toLocaleDateString("es-CR", {
                    day: "numeric",
                    month: "short",
                  })}
                />
              ) : null}
              <GlassChip
                icon="creation"
                value={selected.aiDescription ? "Sí" : "No"}
                label="IA"
              />
            </View>

            {selected.aiDescription ? (
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionHeader}>
                  <MaterialCommunityIcons name="creation" size={16} color={colors.primary} />
                  <Text style={styles.sheetSectionTitle}>Descripción botánica</Text>
                </View>
                <Text style={styles.sheetBody}>{selected.aiDescription}</Text>
              </View>
            ) : null}

            {selected.aiLight ? (
              <View style={styles.sheetSection}>
                <View style={styles.sheetSectionHeader}>
                  <MaterialCommunityIcons
                    name="white-balance-sunny"
                    size={16}
                    color={colors.accentWarm}
                  />
                  <Text style={styles.sheetSectionTitle}>Luz recomendada</Text>
                </View>
                <Text style={styles.sheetBody}>{selected.aiLight}</Text>
              </View>
            ) : null}

            <View style={styles.sheetSection}>
              <View style={styles.sheetSectionHeader}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.sheetSectionTitle}>Primera vez en tu colección</Text>
              </View>
              <Text style={styles.sheetBody}>{formatDate(selected.discoveredAt)}</Text>
            </View>
          </PhotoDetailSheet>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
      marginTop: Spacing.sm,
    },
    emptyBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: 21,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: Spacing.md,
      gap: Spacing.sm,
      paddingBottom: 120,
    },
    card: {
      width: "31%",
      gap: 4,
    },
    cardPhotoWrap: {
      width: "100%",
      aspectRatio: 3 / 4,
      borderRadius: BorderRadius.md,
      overflow: "hidden",
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
      position: "relative",
    },
    cardPhoto: { width: "100%", height: "100%", resizeMode: "cover" },
    cardPhotoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    cardOverlay: {
      position: "absolute",
      left: 0, right: 0, bottom: 0,
      paddingHorizontal: 5,
      paddingVertical: 5,
      paddingTop: 16,
      backgroundColor: "rgba(0,0,0,0.55)",
    },
    cardOverlayName: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: 9,
      fontWeight: "800",
      lineHeight: 12,
    },
    aiBadge: {
      position: "absolute",
      top: 4,
      left: 4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    countBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: BorderRadius.full,
    },
    countText: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: 9,
      fontWeight: "800",
    },
    cardScientific: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 9,
      fontStyle: "italic",
    },
    // ── Contenido de la hoja de cristal (patrón yate) ──
    sheetOverline: {
      ...Typography.overline,
      color: colors.primary,
      marginBottom: 2,
    },
    sheetName: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: -0.5,
      lineHeight: 36,
    },
    sheetScientific: {
      color: colors.textSecondary,
      fontFamily: Typography.serif,
      fontSize: 15,
      fontStyle: "italic",
    },
    sheetChips: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      flexWrap: "wrap",
    },
    sheetSection: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    sheetSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    sheetSectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "700",
    },
    sheetBody: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: 22,
    },
  });
