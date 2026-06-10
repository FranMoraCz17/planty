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
import { LinearGradient } from "expo-linear-gradient";
import { useDemoData } from "@/src/data/DemoDataProvider";
import type {
  AreaDocument,
  AreaLightLevel,
  AreaType,
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

const TYPE_LABEL: Record<AreaType, string> = {
  casa: "Casa",
  patio: "Patio",
  finca: "Finca",
  invernadero: "Invernadero",
  balcon: "Balcón",
  vivero: "Vivero",
  huerto: "Huerto",
  otro: "Otro",
};

const TYPE_ICON: Record<AreaType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  casa: "home",
  patio: "tree-outline",
  finca: "barn",
  invernadero: "greenhouse",
  balcon: "balcony",
  vivero: "sprout",
  huerto: "carrot",
  otro: "dots-horizontal-circle-outline",
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
        <Text style={styles.headerTitle}>Áreas</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Card editorial para crear una nueva área */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear nueva área"
          onPress={() => router.push("/(app)/forms/area")}
          style={({ pressed }) => [styles.newAreaCard, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.newAreaIcon}>
            <MaterialCommunityIcons name="plus" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.newAreaTitle}>Nueva área</Text>
            <Text style={styles.newAreaSubtitle}>
              Un espacio para organizar tus plantas
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>

        {areas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="home-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Sin áreas todavía</Text>
            <Text style={styles.emptyText}>
              Crea espacios físicos (sala, patio, invernadero) para organizar tus
              plantas y recibir mejores recomendaciones.
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
      accessibilityLabel={`Ver área ${area.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.areaCard, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.areaPhotoWrap}>
        {area.photoUri ? (
          <Image source={{ uri: area.photoUri }} style={styles.areaPhoto} />
        ) : (
          <View style={styles.areaPhotoPlaceholder}>
            <MaterialCommunityIcons
              name={TYPE_ICON[area.type]}
              size={52}
              color={colors.onPrimary}
            />
          </View>
        )}

        {/* Degradado suave para legibilidad del título (estilo editorial) */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          locations={[0.35, 1]}
          style={styles.areaScrim}
          pointerEvents="none"
        />

        {/* Tipo arriba a la izquierda */}
        <View style={[styles.areaTopBadge, styles.areaTopLeft]}>
          <MaterialCommunityIcons
            name={TYPE_ICON[area.type]}
            size={12}
            color="#FFFFFF"
          />
          <Text style={styles.areaTopBadgeText}>{TYPE_LABEL[area.type]}</Text>
        </View>

        {/* Cantidad arriba a la derecha */}
        <View style={[styles.areaTopBadge, styles.areaTopRight]}>
          <Text style={styles.areaCountText}>
            {plantCount} {plantCount === 1 ? "planta" : "plantas"}
          </Text>
        </View>

        {/* Nombre y zona abajo, sobre la foto */}
        <View style={styles.areaTitleOverlay}>
          <Text style={styles.areaNameOverlay} numberOfLines={1}>
            {area.name}
          </Text>
          {area.zone ? (
            <Text style={styles.areaZoneOverlay} numberOfLines={1}>
              {area.zone}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.areaBody}>
        {area.description ? (
          <Text style={styles.areaDescription} numberOfLines={2}>
            {area.description}
          </Text>
        ) : null}
        <View style={styles.areaMetaRow}>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name={LIGHT_ICON[area.lightLevel]}
              size={13}
              color={colors.textSecondary}
            />
            <Text style={styles.areaMetaText}>{LIGHT_LABEL[area.lightLevel]}</Text>
          </View>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name="water-percent"
              size={13}
              color={colors.textSecondary}
            />
            <Text style={styles.areaMetaText}>Humedad {area.humidityLevel}</Text>
          </View>
          <View style={styles.areaMetaChip}>
            <MaterialCommunityIcons
              name={area.indoor ? "home" : "tree"}
              size={13}
              color={colors.textSecondary}
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
      ...Typography.title,
      color: colors.text,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: 130,
      gap: Spacing.md,
    },

    // ── Card "nueva área" ──
    newAreaCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primary,
      borderStyle: "dashed",
      padding: Spacing.md,
    },
    newAreaIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: isDark ? "rgba(111,191,149,0.14)" : "rgba(47,107,79,0.10)",
      alignItems: "center",
      justifyContent: "center",
    },
    newAreaTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    newAreaSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
      marginTop: 1,
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

    // ── Card de área ──
    areaCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    areaPhotoWrap: {
      width: "100%",
      aspectRatio: 4 / 3,
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
    areaScrim: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "70%",
    },
    areaTopBadge: {
      position: "absolute",
      top: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(0,0,0,0.45)",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    areaTopLeft: { left: Spacing.sm },
    areaTopRight: { right: Spacing.sm },
    areaTopBadgeText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    areaCountText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    areaTitleOverlay: {
      position: "absolute",
      left: Spacing.lg,
      right: Spacing.lg,
      bottom: Spacing.md,
      gap: 2,
    },
    areaNameOverlay: {
      color: "#FFFFFF",
      fontFamily: Typography.serif,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: -0.4,
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    areaZoneOverlay: {
      color: "rgba(255,255,255,0.9)",
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
      textShadowColor: "rgba(0,0,0,0.6)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    areaBody: {
      padding: Spacing.md,
      gap: Spacing.sm,
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
    },
    areaMetaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    areaMetaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },
  });
