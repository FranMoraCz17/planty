import React, { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ViewMode = "by-area" | "list";

const LIGHT_LABEL: Record<string, string> = {
  sombra: "Sombra",
  "luz-indirecta": "Luz indirecta",
  "luz-brillante": "Luz brillante",
  "sol-directo": "Sol directo",
};

const LIGHT_ICON: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  sombra: "weather-night",
  "luz-indirecta": "weather-partly-cloudy",
  "luz-brillante": "weather-sunny",
  "sol-directo": "white-balance-sunny",
};

function parseFrequencyDays(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) && days > 0 ? days : null;
}

export default function MyPlantsTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, deletePlant, getPlantsByUser, areas } = useDemoData();
  const styles = createStyles(colors, isDark);
  const plants = getPlantsByUser(currentUserId);

  const [viewMode, setViewMode] = useState<ViewMode>("by-area");
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

  const totalAreas = areas.length;
  const totalPlants = plants.length;

  const healthPct = useMemo(() => {
    if (plants.length === 0) return 0;
    const valid = plants.filter(
      (p) => parseFrequencyDays(p.wateringFrequencyLabel) !== null,
    ).length;
    return Math.round((valid / plants.length) * 100);
  }, [plants]);

  const toggleArea = (areaId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  };

  const handleDelete = (plantId: string, plantName: string) => {
    Alert.alert(
      "Eliminar planta",
      `Se eliminara ${plantName} de tu coleccion.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deletePlant(plantId).catch((error: unknown) => {
              const message =
                error instanceof Error
                  ? error.message
                  : "No se pudo eliminar la planta.";
              Alert.alert("Error", message);
            });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Plantas" subtitle="Tu coleccion" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalPlants}</Text>
              <Text style={styles.summaryLabel}>
                {totalPlants === 1 ? "Planta" : "Plantas"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalAreas}</Text>
              <Text style={styles.summaryLabel}>
                {totalAreas === 1 ? "Area" : "Areas"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{healthPct}%</Text>
              <Text style={styles.summaryLabel}>Al dia</Text>
            </View>
          </View>
          <View style={styles.healthBarWrap}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${healthPct}%` as `${number}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.viewToggle}>
          <ToggleOption
            label="Por area"
            icon="home-outline"
            active={viewMode === "by-area"}
            onPress={() => setViewMode("by-area")}
            colors={colors}
            isDark={isDark}
          />
          <ToggleOption
            label="Lista"
            icon="format-list-bulleted"
            active={viewMode === "list"}
            onPress={() => setViewMode("list")}
            colors={colors}
            isDark={isDark}
          />
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gestionar areas"
            onPress={() => router.push("/(app)/areas")}
            style={({ pressed }) => [
              styles.manageBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.manageBtnText}>Gestionar</Text>
          </Pressable>
        </View>

        {plants.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="sprout-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Aun no hay plantas. Agrega la primera.
            </Text>
          </View>
        ) : viewMode === "list" ? (
          plants.map((plant) => (
            <PlantRow
              key={plant.id}
              plant={plant}
              colors={colors}
              isDark={isDark}
              onEdit={() => router.push(`/(app)/forms/plant?id=${plant.id}`)}
              onDelete={() => handleDelete(plant.id, plant.name)}
            />
          ))
        ) : (
          <>
            {areas.map((area) => {
              const areaPlants = plantsByAreaId.get(area.id) ?? [];
              const expanded = expandedAreas.has(area.id);
              return (
                <AreaSection
                  key={area.id}
                  area={area}
                  plants={areaPlants}
                  expanded={expanded}
                  onToggle={() => toggleArea(area.id)}
                  onEditPlant={(p) =>
                    router.push(`/(app)/forms/plant?id=${p.id}`)
                  }
                  onDeletePlant={(p) => handleDelete(p.id, p.name)}
                  onEditArea={() =>
                    router.push(`/(app)/forms/area?id=${area.id}`)
                  }
                  colors={colors}
                  isDark={isDark}
                />
              );
            })}

            {(plantsByAreaId.get("unassigned") ?? []).length > 0 ? (
              <UnassignedSection
                plants={plantsByAreaId.get("unassigned") ?? []}
                expanded={expandedAreas.has("unassigned")}
                onToggle={() => toggleArea("unassigned")}
                onEditPlant={(p) =>
                  router.push(`/(app)/forms/plant?id=${p.id}`)
                }
                onDeletePlant={(p) => handleDelete(p.id, p.name)}
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {areas.length === 0 ? (
              <View style={styles.noAreasHint}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.noAreasHintText}>
                  Crea areas para organizar tus plantas por espacio fisico.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar planta"
        onPress={() => router.push("/(app)/forms/plant?mode=create")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

function ToggleOption({
  label,
  icon,
  active,
  onPress,
  colors,
  isDark,
}: {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleBtn,
        active && styles.toggleBtnActive,
        pressed && { opacity: 0.7 },
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={14}
        color={active ? colors.onPrimary : colors.textSecondary}
      />
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AreaSection({
  area,
  plants,
  expanded,
  onToggle,
  onEditPlant,
  onDeletePlant,
  onEditArea,
  colors,
  isDark,
}: {
  area: AreaDocument;
  plants: PlantDocument[];
  expanded: boolean;
  onToggle: () => void;
  onEditPlant: (p: PlantDocument) => void;
  onDeletePlant: (p: PlantDocument) => void;
  onEditArea: () => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const validCount = plants.filter(
    (p) => parseFrequencyDays(p.wateringFrequencyLabel) !== null,
  ).length;
  const healthPct =
    plants.length === 0 ? 0 : Math.round((validCount / plants.length) * 100);

  return (
    <View style={styles.areaSection}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Contraer" : "Expandir"} ${area.name}`}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.areaHeader,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View style={styles.areaThumbWrap}>
          {area.photoUri ? (
            <Image source={{ uri: area.photoUri }} style={styles.areaThumb} />
          ) : (
            <MaterialCommunityIcons
              name={area.indoor ? "home" : "tree"}
              size={20}
              color={colors.onPrimary}
            />
          )}
        </View>
        <View style={styles.areaHeaderBody}>
          <View style={styles.areaHeaderRow}>
            <Text style={styles.areaName} numberOfLines={1}>
              {area.name}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.areaMetaRow}>
            <MaterialCommunityIcons
              name={LIGHT_ICON[area.lightLevel] ?? "weather-partly-cloudy"}
              size={11}
              color={colors.textSecondary}
            />
            <Text style={styles.areaMetaText}>
              {LIGHT_LABEL[area.lightLevel] ?? area.lightLevel}
            </Text>
            <Text style={styles.areaMetaDot}>·</Text>
            <Text style={styles.areaMetaText}>
              Humedad {area.humidityLevel}
            </Text>
            <Text style={styles.areaMetaDot}>·</Text>
            <Text style={styles.areaMetaText}>
              {plants.length} {plants.length === 1 ? "planta" : "plantas"}
            </Text>
          </View>
          <View style={styles.miniHealthBar}>
            <View
              style={[
                styles.miniHealthFill,
                { width: `${healthPct}%` as `${number}%` },
              ]}
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.areaPlantsList}>
          {plants.length === 0 ? (
            <View style={styles.emptyAreaBlock}>
              <Text style={styles.emptyAreaText}>
                Sin plantas asignadas todavia.
              </Text>
            </View>
          ) : (
            plants.map((plant) => (
              <PlantRow
                key={plant.id}
                plant={plant}
                colors={colors}
                isDark={isDark}
                onEdit={() => onEditPlant(plant)}
                onDelete={() => onDeletePlant(plant)}
                compact
              />
            ))
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar area ${area.name}`}
            onPress={onEditArea}
            style={({ pressed }) => [
              styles.editAreaLink,
              pressed && { opacity: 0.6 },
            ]}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.editAreaLinkText}>Editar area</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function UnassignedSection({
  plants,
  expanded,
  onToggle,
  onEditPlant,
  onDeletePlant,
  colors,
  isDark,
}: {
  plants: PlantDocument[];
  expanded: boolean;
  onToggle: () => void;
  onEditPlant: (p: PlantDocument) => void;
  onDeletePlant: (p: PlantDocument) => void;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.areaSection}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? "Contraer" : "Expandir"} sin area`}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.areaHeader,
          pressed && { opacity: 0.9 },
        ]}
      >
        <View
          style={[styles.areaThumbWrap, { backgroundColor: colors.disabled }]}
        >
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={20}
            color={colors.onPrimary}
          />
        </View>
        <View style={styles.areaHeaderBody}>
          <View style={styles.areaHeaderRow}>
            <Text style={styles.areaName}>Sin area asignada</Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </View>
          <Text style={styles.areaMetaText}>
            {plants.length} {plants.length === 1 ? "planta" : "plantas"}
          </Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.areaPlantsList}>
          {plants.map((plant) => (
            <PlantRow
              key={plant.id}
              plant={plant}
              colors={colors}
              isDark={isDark}
              onEdit={() => onEditPlant(plant)}
              onDelete={() => onDeletePlant(plant)}
              compact
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PlantRow({
  plant,
  colors,
  isDark,
  onEdit,
  onDelete,
  compact = false,
}: {
  plant: PlantDocument;
  colors: ThemeColors;
  isDark: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const { photoUri } = usePlantPhoto({
    scientificName: plant.scientificName,
  });

  return (
    <View style={[styles.plantRow, compact && styles.plantRowCompact]}>
      <View style={styles.plantPhotoWrap}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.plantPhoto} />
        ) : (
          <MaterialCommunityIcons
            name="leaf"
            size={16}
            color={colors.onPrimary}
          />
        )}
      </View>
      <View style={styles.plantBody}>
        <Text style={styles.plantName} numberOfLines={1}>
          {plant.name}
        </Text>
        <Text style={styles.plantMeta} numberOfLines={1}>
          {plant.wateringFrequencyLabel}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`Editar ${plant.name}`}
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="pencil-outline"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
      <Pressable
        accessibilityLabel={`Eliminar ${plant.name}`}
        accessibilityRole="button"
        onPress={onDelete}
        style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={16}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xs,
      paddingBottom: 130,
      gap: Spacing.sm,
    },
    summaryCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryItem: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    summaryDivider: {
      width: 1,
      height: 32,
      backgroundColor: colors.border,
    },
    summaryValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 6,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    healthBarWrap: {
      height: 6,
      backgroundColor: isDark ? "#22332F" : "#E5F3EE",
      borderRadius: 3,
      overflow: "hidden",
    },
    healthBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    viewToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginVertical: Spacing.xs,
    },
    toggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    toggleTextActive: {
      color: colors.onPrimary,
      fontWeight: "800",
    },
    manageBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
    },
    manageBtnText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      maxWidth: 260,
    },
    areaSection: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    areaHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
    },
    areaThumbWrap: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    areaThumb: {
      width: "100%",
      height: "100%",
    },
    areaHeaderBody: {
      flex: 1,
      gap: 4,
    },
    areaHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    areaName: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "800",
    },
    areaMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap",
    },
    areaMetaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },
    areaMetaDot: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
    },
    miniHealthBar: {
      height: 4,
      backgroundColor: isDark ? "#22332F" : "#E5F3EE",
      borderRadius: 2,
      overflow: "hidden",
      marginTop: 4,
    },
    miniHealthFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    areaPlantsList: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.sm,
      gap: Spacing.xs,
    },
    emptyAreaBlock: {
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    emptyAreaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontStyle: "italic",
    },
    editAreaLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: Spacing.xs,
      marginTop: Spacing.xs,
    },
    editAreaLinkText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    noAreasHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      padding: Spacing.md,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      borderRadius: BorderRadius.md,
    },
    noAreasHintText: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
    },
    plantRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    plantRowCompact: {
      borderWidth: 0,
      borderRadius: BorderRadius.md,
      paddingVertical: 6,
      paddingHorizontal: Spacing.xs,
      backgroundColor: "transparent",
    },
    plantPhotoWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    plantPhoto: {
      width: "100%",
      height: "100%",
    },
    plantBody: {
      flex: 1,
      gap: 1,
    },
    plantName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    plantMeta: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
    },
    rowAction: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.5,
      backgroundColor: isDark ? "#22332F" : "#EAF4F0",
    },
    fab: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 100,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    fabPressed: {
      opacity: 0.85,
    },
  });
