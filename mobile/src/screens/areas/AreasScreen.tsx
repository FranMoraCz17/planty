import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import type {
  AreaDocument,
  AreaLightLevel,
} from "@/src/services/areaService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const LIGHT_LABEL: Record<AreaLightLevel, string> = {
  sombra: "Sombra",
  "luz-indirecta": "Luz indirecta",
  "luz-brillante": "Luz brillante",
  "sol-directo": "Sol directo",
};

const LIGHT_ICON: Record<
  AreaLightLevel,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  sombra: "weather-night",
  "luz-indirecta": "weather-partly-cloudy",
  "luz-brillante": "weather-sunny",
  "sol-directo": "white-balance-sunny",
};

export default function AreasScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { areas, plants } = useDemoData();
  const styles = createStyles(colors, isDark);

  const plantsCountByArea = useMemo(() => {
    const map = new Map<string, number>();
    plants.forEach((plant) => {
      if (!plant.areaId) return;
      map.set(plant.areaId, (map.get(plant.areaId) ?? 0) + 1);
    });
    return map;
  }, [plants]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Areas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {areas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="home-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Sin areas todavia</Text>
            <Text style={styles.emptyText}>
              Crea espacios fisicos (sala, patio, invernadero) para organizar tus plantas y recibir mejores recomendaciones.
            </Text>
          </View>
        ) : (
          areas.map((area) => {
            const count = plantsCountByArea.get(area.id) ?? 0;
            return (
              <AreaCard
                key={area.id}
                area={area}
                plantCount={count}
                colors={colors}
                isDark={isDark}
                onPress={() => router.push(`/(app)/forms/area?id=${area.id}`)}
              />
            );
          })
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear area"
        onPress={() => router.push("/(app)/forms/area")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
      </Pressable>
    </SafeAreaView>
  );
}

function AreaCard({
  area,
  plantCount,
  colors,
  isDark,
  onPress,
}: {
  area: AreaDocument;
  plantCount: number;
  colors: ThemeColors;
  isDark: boolean;
  onPress: () => void;
}) {
  const styles = createStyles(colors, isDark);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver area ${area.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.areaCard,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.areaPhotoWrap}>
        {area.photoUri ? (
          <Image source={{ uri: area.photoUri }} style={styles.areaPhoto} />
        ) : (
          <View style={styles.areaPhotoPlaceholder}>
            <MaterialCommunityIcons
              name={area.indoor ? "home-outline" : "tree-outline"}
              size={36}
              color={colors.onPrimary}
            />
          </View>
        )}
        <View style={styles.areaBadge}>
          <MaterialCommunityIcons
            name="leaf"
            size={12}
            color="#FFFFFF"
          />
          <Text style={styles.areaBadgeText}>
            {plantCount} {plantCount === 1 ? "planta" : "plantas"}
          </Text>
        </View>
      </View>
      <View style={styles.areaBody}>
        <Text style={styles.areaName}>{area.name}</Text>
        {area.description ? (
          <Text style={styles.areaDescription} numberOfLines={2}>
            {area.description}
          </Text>
        ) : null}
        <View style={styles.areaMetaRow}>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name={LIGHT_ICON[area.lightLevel]}
              size={12}
              color={colors.primary}
            />
            <Text style={styles.areaMetaText}>
              {LIGHT_LABEL[area.lightLevel]}
            </Text>
          </View>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name="water-percent"
              size={12}
              color={colors.primary}
            />
            <Text style={styles.areaMetaText}>
              Humedad {area.humidityLevel}
            </Text>
          </View>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name={area.indoor ? "home" : "tree"}
              size={12}
              color={colors.primary}
            />
            <Text style={styles.areaMetaText}>
              {area.indoor ? "Interior" : "Exterior"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 130,
      gap: Spacing.md,
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.sm,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
      marginTop: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      textAlign: "center",
      maxWidth: 280,
    },
    areaCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    areaPhotoWrap: {
      width: "100%",
      aspectRatio: 16 / 9,
      backgroundColor: colors.primary,
      position: "relative",
    },
    areaPhoto: {
      width: "100%",
      height: "100%",
    },
    areaPhotoPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    areaBadge: {
      position: "absolute",
      top: Spacing.sm,
      right: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    areaBadgeText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    areaBody: {
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    areaName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    areaDescription: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
      lineHeight: Typography.body.lineHeight,
    },
    areaMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      marginTop: 4,
    },
    areaMetaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    areaMetaText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    fab: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 30,
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
