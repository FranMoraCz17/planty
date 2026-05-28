import React, { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import type { AreaDocument } from "@/src/services/areaService";
import type { PlantDocument } from "@/src/services/plantService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

function parseFrequencyDays(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) && days > 0 ? days : null;
}

const TYPE_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  casa: "home", patio: "tree-outline", finca: "barn",
  invernadero: "greenhouse", balcon: "balcony",
  vivero: "sprout", huerto: "carrot", otro: "dots-horizontal-circle-outline",
};

export default function CollectionScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, deletePlant, getPlantsByUser, areas } = useDemoData();
  const styles = createStyles(colors, isDark);
  const plants = getPlantsByUser(currentUserId);

  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(
    () => new Set(areas.map((a) => a.id).concat("unassigned")),
  );

  const plantsByAreaId = useMemo(() => {
    const map = new Map<string, PlantDocument[]>();
    map.set("unassigned", []);
    areas.forEach((a) => map.set(a.id, []));
    plants.forEach((p) => {
      const key = p.areaId ?? "unassigned";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    });
    return map;
  }, [plants, areas]);

  const healthPct = useMemo(() => {
    if (plants.length === 0) return 0;
    const valid = plants.filter((p) => p.aiAnalyzed).length;
    return Math.round((valid / plants.length) * 100);
  }, [plants]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId); else next.add(areaId);
      return next;
    });
  };

  const handleDelete = (plantId: string, plantName: string) => {
    Alert.alert("Eliminar planta", `Se eliminará ${plantName} de tu colección.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive",
        onPress: () => void deletePlant(plantId).catch(() => Alert.alert("Error", "No se pudo eliminar.")),
      },
    ]);
  };

  const unassigned = plantsByAreaId.get("unassigned") ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Colección" subtitle={`${plants.length} plantas · ${areas.length} áreas`} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Resumen compacto */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{plants.length}</Text>
            <Text style={styles.summaryLabel}>Plantas</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{areas.length}</Text>
            <Text style={styles.summaryLabel}>Áreas</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{healthPct}%</Text>
            <Text style={styles.summaryLabel}>Con IA</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nueva área"
            onPress={() => router.push("/(app)/forms/area")}
            style={({ pressed }) => [styles.newAreaBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
            <Text style={styles.newAreaBtnText}>Nueva área</Text>
          </Pressable>
        </View>

        {plants.length === 0 && areas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="sprout-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>
              Escanea tu primera planta con el botón central para comenzar tu colección.
            </Text>
          </View>
        ) : (
          <>
            {areas.map((area) => {
              const areaPlants = plantsByAreaId.get(area.id) ?? [];
              const expanded = expandedAreas.has(area.id);
              return (
                <AreaCard
                  key={area.id}
                  area={area}
                  plants={areaPlants}
                  expanded={expanded}
                  onToggle={() => toggleArea(area.id)}
                  onViewPlant={(p) => router.push(`/(app)/plant/${p.id}`)}
                  onDeletePlant={(p) => handleDelete(p.id, p.name)}
                  onEditArea={() => router.push(`/(app)/forms/area?id=${area.id}`)}
                  colors={colors}
                  isDark={isDark}
                />
              );
            })}

            {unassigned.length > 0 && (
              <UnassignedCard
                plants={unassigned}
                expanded={expandedAreas.has("unassigned")}
                onToggle={() => toggleArea("unassigned")}
                onViewPlant={(p) => router.push(`/(app)/plant/${p.id}`)}
                onDeletePlant={(p) => handleDelete(p.id, p.name)}
                colors={colors}
                isDark={isDark}
              />
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar planta"
        onPress={() => router.push("/(app)/add-plant")}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Area Card (foto grande + grid 3 col de plantas) ────────────────────────

function AreaCard({
  area, plants, expanded, onToggle, onViewPlant, onDeletePlant, onEditArea, colors, isDark,
}: {
  area: AreaDocument; plants: PlantDocument[];
  expanded: boolean; onToggle: () => void;
  onViewPlant: (p: PlantDocument) => void;
  onDeletePlant: (p: PlantDocument) => void;
  onEditArea: () => void;
  colors: ThemeColors; isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  const healthPct = useMemo(() => {
    if (plants.length === 0) return 0;
    return Math.round(plants.filter((p) => p.aiAnalyzed).length / plants.length * 100);
  }, [plants]);

  return (
    <View style={s.areaCard}>
      {/* Foto grande del área como hero */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Contraer" : "Expandir"} área ${area.name}`}
        onPress={onToggle}
        style={({ pressed }) => [pressed && { opacity: 0.92 }]}
      >
        <View style={s.areaHero}>
          {area.photoUri ? (
            <Image source={{ uri: area.photoUri }} style={s.areaHeroImg} />
          ) : (
            <View style={[s.areaHeroImg, s.areaHeroPlaceholder]}>
              <MaterialCommunityIcons
                name={TYPE_ICON[area.type] ?? "home"}
                size={48}
                color="rgba(255,255,255,0.6)"
              />
            </View>
          )}
          {/* Gradiente simulado */}
          <View style={s.areaHeroOverlay} />

          {/* Tipo badge */}
          <View style={s.areaTypeBadge}>
            <MaterialCommunityIcons
              name={TYPE_ICON[area.type] ?? "home"}
              size={11}
              color="#fff"
            />
            <Text style={s.areaTypeBadgeText}>{area.type}</Text>
          </View>

          {/* Contador arriba derecha */}
          <View style={s.areaCountBadge}>
            <MaterialCommunityIcons name="leaf" size={11} color="#fff" />
            <Text style={s.areaCountBadgeText}>
              {plants.length} {plants.length === 1 ? "planta" : "plantas"}
            </Text>
          </View>

          {/* Nombre e info abajo */}
          <View style={s.areaHeroBottom}>
            <Text style={s.areaHeroName} numberOfLines={1}>{area.name}</Text>
            <View style={s.areaHeroMeta}>
              <Text style={s.areaHeroMetaText}>
                {area.indoor ? "Interior" : "Exterior"}
              </Text>
              {healthPct > 0 && (
                <Text style={s.areaHeroMetaText}>· {healthPct}% con IA</Text>
              )}
            </View>
          </View>

          {/* Chevron */}
          <View style={s.areaChevron}>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="rgba(255,255,255,0.85)"
            />
          </View>
        </View>
      </Pressable>

      {/* Grid 3 columnas de plantas */}
      {expanded && (
        <View style={s.areaPlants}>
          {plants.length === 0 ? (
            <Text style={s.areaEmptyText}>Sin plantas asignadas todavía.</Text>
          ) : (
            <View style={s.plantGrid}>
              {plants.map((plant) => (
                <PlantThumb
                  key={plant.id}
                  plant={plant}
                  onPress={() => onViewPlant(plant)}
                  onDelete={() => onDeletePlant(plant)}
                  colors={colors}
                  isDark={isDark}
                />
              ))}
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Editar área"
            onPress={onEditArea}
            style={({ pressed }) => [s.editAreaLink, pressed && { opacity: 0.6 }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={13} color={colors.primary} />
            <Text style={s.editAreaLinkText}>Editar área</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function UnassignedCard({
  plants, expanded, onToggle, onViewPlant, onDeletePlant, colors, isDark,
}: {
  plants: PlantDocument[]; expanded: boolean; onToggle: () => void;
  onViewPlant: (p: PlantDocument) => void;
  onDeletePlant: (p: PlantDocument) => void;
  colors: ThemeColors; isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.areaCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Contraer" : "Expandir"} plantas sin área`}
        onPress={onToggle}
        style={({ pressed }) => [s.unassignedHeader, pressed && { opacity: 0.85 }]}
      >
        <View style={[s.unassignedIcon, { backgroundColor: colors.disabled }]}>
          <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.unassignedTitle}>Sin área asignada</Text>
          <Text style={s.unassignedCount}>{plants.length} {plants.length === 1 ? "planta" : "plantas"}</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      {expanded && (
        <View style={s.areaPlants}>
          <View style={s.plantGrid}>
            {plants.map((plant) => (
              <PlantThumb
                key={plant.id}
                plant={plant}
                onPress={() => onViewPlant(plant)}
                onDelete={() => onDeletePlant(plant)}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function PlantThumb({
  plant, onPress, onDelete, colors, isDark,
}: {
  plant: PlantDocument; onPress: () => void; onDelete: () => void;
  colors: ThemeColors; isDark: boolean;
}) {
  const { photoUri: catalogPhoto } = usePlantPhoto({ scientificName: plant.scientificName });
  const photo = plant.photoUri ?? catalogPhoto;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${plant.name}`}
      onPress={onPress}
      style={({ pressed }) => [thumbStyles.wrap, pressed && { opacity: 0.82 }]}
    >
      <View style={thumbStyles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={thumbStyles.photo} />
        ) : (
          <View style={[thumbStyles.photo, { backgroundColor: isDark ? "#143018" : "#DCFCE7", alignItems: "center", justifyContent: "center" }]}>
            <MaterialCommunityIcons name="leaf" size={22} color={colors.primary} />
          </View>
        )}
        {plant.aiAnalyzed && (
          <View style={thumbStyles.aiBadge}>
            <MaterialCommunityIcons name="creation" size={8} color="#fff" />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${plant.name}`}
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [thumbStyles.deleteBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="close" size={10} color="#fff" />
        </Pressable>
      </View>
      <Text style={[thumbStyles.name, { color: colors.text }]} numberOfLines={1}>{plant.name}</Text>
    </Pressable>
  );
}

const thumbStyles = StyleSheet.create({
  wrap: { width: "31%", gap: 4 },
  photoWrap: {
    width: "100%", aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  aiBadge: {
    position: "absolute", top: 3, left: 3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: "#16A34A",
    alignItems: "center", justifyContent: "center",
  },
  deleteBtn: {
    position: "absolute", top: 3, right: 3,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  name: {
    fontFamily: Typography.family,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
});

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.md, paddingTop: Spacing.xs },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    summaryItem: { alignItems: "center", gap: 1, paddingHorizontal: 2 },
    summaryDivider: { width: 1, height: 28, backgroundColor: colors.border },
    summaryValue: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: 18, fontWeight: "800",
    },
    summaryLabel: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3,
    },
    newAreaBtn: {
      flexDirection: "row", alignItems: "center", gap: 3,
      paddingHorizontal: Spacing.sm, paddingVertical: 5,
      borderRadius: BorderRadius.full,
      borderWidth: 1, borderColor: colors.primary,
    },
    newAreaBtnText: {
      color: colors.primary, fontFamily: Typography.family,
      fontSize: 11, fontWeight: "700",
    },
    emptyWrap: {
      alignItems: "center", justifyContent: "center",
      paddingVertical: Spacing.xxl, gap: Spacing.md,
    },
    emptyText: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, textAlign: "center", maxWidth: 260,
    },
    // Area card
    areaCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    areaHero: {
      width: "100%", height: 180,
      backgroundColor: colors.primary,
      position: "relative",
    },
    areaHeroImg: { width: "100%", height: "100%", resizeMode: "cover" },
    areaHeroPlaceholder: { alignItems: "center", justifyContent: "center" },
    areaHeroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.38)",
    },
    areaTypeBadge: {
      position: "absolute", top: Spacing.sm, left: Spacing.sm,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    areaTypeBadgeText: {
      color: "#fff", fontFamily: Typography.family,
      fontSize: 10, fontWeight: "800", textTransform: "capitalize",
    },
    areaCountBadge: {
      position: "absolute", top: Spacing.sm, right: Spacing.sm,
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    areaCountBadgeText: {
      color: "#fff", fontFamily: Typography.family,
      fontSize: 10, fontWeight: "700",
    },
    areaHeroBottom: {
      position: "absolute", left: Spacing.md, right: 48, bottom: Spacing.md, gap: 2,
    },
    areaHeroName: {
      color: "#fff", fontFamily: Typography.family,
      fontSize: 22, fontWeight: "800", letterSpacing: -0.4,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    areaHeroMeta: { flexDirection: "row", gap: 4 },
    areaHeroMetaText: {
      color: "rgba(255,255,255,0.8)", fontFamily: Typography.family,
      fontSize: 12, fontWeight: "600",
    },
    areaChevron: {
      position: "absolute", bottom: Spacing.md, right: Spacing.md,
    },
    areaPlants: {
      padding: Spacing.md, gap: Spacing.sm,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    areaEmptyText: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: 13, fontStyle: "italic", textAlign: "center",
      paddingVertical: Spacing.sm,
    },
    plantGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm,
    },
    editAreaLink: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 4, paddingVertical: 4, marginTop: 2,
    },
    editAreaLinkText: {
      color: colors.primary, fontFamily: Typography.family,
      fontSize: 12, fontWeight: "700",
    },
    // Unassigned
    unassignedHeader: {
      flexDirection: "row", alignItems: "center",
      gap: Spacing.sm, padding: Spacing.md,
    },
    unassignedIcon: {
      width: 42, height: 42, borderRadius: 21,
      alignItems: "center", justifyContent: "center",
    },
    unassignedTitle: {
      color: colors.text, fontFamily: Typography.family,
      fontSize: Typography.body.fontSize, fontWeight: "700",
    },
    unassignedCount: {
      color: colors.textSecondary, fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1, fontWeight: "500",
    },
    // FAB
    fab: {
      position: "absolute", right: Spacing.lg, bottom: 100,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4, shadowRadius: 10, elevation: 10,
    },
  });
