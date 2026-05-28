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

      {/* Modal de detalle de ficha */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <SafeAreaView style={[styles.container, { flex: 1 }]}>
            <View style={styles.modalHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar ficha"
                onPress={() => setSelected(null)}
                hitSlop={12}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selected.name}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Foto grande */}
              <View style={styles.modalPhotoWrap}>
                {selected.photoUri ? (
                  <Image source={{ uri: selected.photoUri }} style={styles.modalPhoto} />
                ) : (
                  <View style={[styles.modalPhoto, styles.modalPhotoPlaceholder]}>
                    <MaterialCommunityIcons name="leaf" size={64} color={colors.onPrimary} />
                  </View>
                )}
                <View style={styles.modalPhotoOverlay} />
                <View style={styles.modalPhotoIdentity}>
                  <Text style={styles.modalName}>{selected.name}</Text>
                  {selected.scientificName && (
                    <Text style={styles.modalScientific}>{selected.scientificName}</Text>
                  )}
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{selected.count}</Text>
                  <Text style={styles.statLabel}>{selected.count === 1 ? "Planta" : "Plantas"}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {selected.aiDescription ? "Sí" : "No"}
                  </Text>
                  <Text style={styles.statLabel}>IA analizada</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {selected.discoveredAt
                      ? new Date(selected.discoveredAt).toLocaleDateString("es-CR", { day: "numeric", month: "short" })
                      : "—"}
                  </Text>
                  <Text style={styles.statLabel}>Descubierta</Text>
                </View>
              </View>

              {/* Descripción IA */}
              {selected.aiDescription && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <MaterialCommunityIcons name="creation" size={14} color={colors.primary} />
                    <Text style={styles.infoCardTitle}>Descripción botánica</Text>
                  </View>
                  <Text style={styles.infoCardBody}>{selected.aiDescription}</Text>
                </View>
              )}

              {/* Cuidados */}
              {selected.aiLight && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={14} color={colors.accentWarm} />
                    <Text style={styles.infoCardTitle}>Luz recomendada</Text>
                  </View>
                  <Text style={styles.infoCardBody}>{selected.aiLight}</Text>
                </View>
              )}

              {/* Fecha de descubrimiento */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.infoCardTitle}>Primera vez en tu colección</Text>
                </View>
                <Text style={styles.infoCardBody}>{formatDate(selected.discoveredAt)}</Text>
              </View>

            </ScrollView>
          </SafeAreaView>
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
    // Modal
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    modalHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "800",
      flex: 1,
      textAlign: "center",
    },
    modalContent: {
      paddingBottom: 60,
      gap: Spacing.md,
    },
    modalPhotoWrap: {
      width: "100%",
      height: 260,
      position: "relative",
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
    },
    modalPhoto: { width: "100%", height: "100%", resizeMode: "cover" },
    modalPhotoPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
    modalPhotoOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    modalPhotoIdentity: {
      position: "absolute",
      bottom: Spacing.lg,
      left: Spacing.lg,
      right: Spacing.lg,
      gap: 4,
    },
    modalName: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.5,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    modalScientific: {
      color: "rgba(255,255,255,0.8)",
      fontFamily: Typography.family,
      fontSize: 14,
      fontStyle: "italic",
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
    },
    statItem: { flex: 1, alignItems: "center", gap: 2 },
    statDivider: { width: 1, height: 32, backgroundColor: colors.border },
    statValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 20,
      fontWeight: "800",
    },
    statLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    infoCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
    infoCardTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    infoCardBody: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      lineHeight: 20,
    },
  });
