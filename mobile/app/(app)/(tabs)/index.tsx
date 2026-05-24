import { useMemo } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
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
import { useTodayContext } from "@/src/hooks/useTodayContext";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import type { PlantDocument } from "@/src/services/plantService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dias";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

function parseFrequencyDays(label: string | undefined): number | null {
  if (!label) return null;
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const days = parseInt(match[1], 10);
  return Number.isFinite(days) && days > 0 ? days : null;
}

interface UpcomingTask {
  plant: PlantDocument;
  daysAway: number;
  cycle: number;
}

export default function HomeTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUser, plants } = useDemoData();
  const today = useTodayContext();
  const styles = createStyles(colors, isDark);

  const firstName = getFirstName(currentUser?.name);
  const greetingLabel = firstName
    ? `${getGreeting()}, ${firstName}`
    : getGreeting();

  const upcomingTasks = useMemo<UpcomingTask[]>(() => {
    const items: UpcomingTask[] = [];
    plants.forEach((plant) => {
      const cycle = parseFrequencyDays(plant.wateringFrequencyLabel);
      if (!cycle) return;
      items.push({ plant, daysAway: cycle, cycle });
    });
    return items.sort((a, b) => a.daysAway - b.daysAway);
  }, [plants]);

  const heroTask = upcomingTasks[0] ?? null;
  const nextDays = upcomingTasks[0]?.daysAway ?? null;

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={greetingLabel} subtitle="Tu jardin de hoy" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar especie"
          onPress={() => router.push("/(app)/(tabs)/identify")}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.searchBarPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.searchText}>Buscar especie o sintoma</Text>
        </Pressable>

        {plants.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name="sprout-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Aun no tienes plantas. Identifica una para empezar.
            </Text>
          </View>
        ) : (
          <>
            {/* Hero del dia */}
            {heroTask ? (
              <HeroTaskCard
                task={heroTask}
                colors={colors}
                isDark={isDark}
                onPress={() => router.push("/(app)/(tabs)/calendar")}
              />
            ) : null}

            {/* Stats chips */}
            <View style={styles.statsRow}>
              <StatChip
                icon="sprout"
                value={`${plants.length}`}
                label={plants.length === 1 ? "Planta" : "Plantas"}
                colors={colors}
                isDark={isDark}
              />
              <StatChip
                icon="water"
                value={nextDays === null ? "-" : `${nextDays}d`}
                label="Proximo riego"
                colors={colors}
                isDark={isDark}
              />
              <StatChip
                icon="map-marker-radius-outline"
                value={`${new Set(plants.map((p) => p.locationName)).size}`}
                label="Sitios"
                colors={colors}
                isDark={isDark}
              />
            </View>

            {/* Carrusel coleccion */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tu coleccion</Text>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/my-plants")}
                accessibilityLabel="Ver todas las plantas"
                accessibilityRole="button"
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselRow}
            >
              {plants.map((plant) => (
                <PlantThumbCard
                  key={plant.id}
                  plant={plant}
                  colors={colors}
                  isDark={isDark}
                  onPress={() =>
                    router.push(`/(app)/forms/plant?id=${plant.id}`)
                  }
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* Widget luna + clima */}
        <View style={styles.contextCard}>
          <View style={styles.contextHeader}>
            <Text style={styles.contextHeaderTitle}>Hoy en el jardin</Text>
            {today.weather?.city ? (
              <Text style={styles.contextHeaderCity}>{today.weather.city}</Text>
            ) : null}
          </View>

          <View style={styles.contextBody}>
            {/* Luna */}
            <View style={styles.contextBlock}>
              <Text style={styles.contextEmoji}>{today.moon.emoji}</Text>
              <Text style={styles.contextBlockLabel}>{today.moon.label}</Text>
              <Text style={styles.contextBlockMeta}>
                {today.moon.illumination}% iluminada
              </Text>
            </View>

            <View style={styles.contextDivider} />

            {/* Clima */}
            <View style={styles.contextBlock}>
              {today.isLoadingWeather ? (
                <ActivityIndicator color={colors.primary} />
              ) : today.weather ? (
                <>
                  <Text style={styles.contextEmoji}>
                    {today.weather.conditionEmoji}
                  </Text>
                  <Text style={styles.contextBlockLabel}>
                    {today.weather.temperatureC}°C
                  </Text>
                  <Text style={styles.contextBlockMeta}>
                    {today.weather.humidity}% humedad
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.contextEmoji}>🌡️</Text>
                  <Text style={styles.contextBlockLabel}>Sin clima</Text>
                  <Text style={styles.contextBlockMeta}>
                    Activa ubicacion
                  </Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.contextAdvice}>{today.moon.gardenAdvice}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

function HeroTaskCard({
  task,
  colors,
  isDark,
  onPress,
}: {
  task: UpcomingTask;
  colors: ThemeColors;
  isDark: boolean;
  onPress: () => void;
}) {
  const styles = createStyles(colors, isDark);
  const { photoUri } = usePlantPhoto({
    scientificName: task.plant.scientificName,
  });

  const urgencyLabel =
    task.daysAway === 0
      ? "Hoy"
      : task.daysAway === 1
        ? "Manana"
        : `En ${task.daysAway} dias`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tarea: regar ${task.plant.name} ${urgencyLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.heroCard, pressed && styles.heroPressed]}
    >
      <View style={styles.heroPhotoWrap}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.heroPhoto}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <MaterialCommunityIcons
            name="leaf"
            size={36}
            color={colors.onPrimary}
          />
        )}
      </View>
      <View style={styles.heroBody}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{urgencyLabel}</Text>
        </View>
        <Text style={styles.heroTitle}>Regar {task.plant.name}</Text>
        <Text style={styles.heroSubtitle}>
          {task.plant.scientificName} - cada {task.cycle} dias
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

function StatChip({
  icon,
  value,
  label,
  colors,
  isDark,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.statChip}>
      <View style={styles.statChipIcon}>
        <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

function PlantThumbCard({
  plant,
  colors,
  isDark,
  onPress,
}: {
  plant: PlantDocument;
  colors: ThemeColors;
  isDark: boolean;
  onPress: () => void;
}) {
  const styles = createStyles(colors, isDark);
  const { photoUri } = usePlantPhoto({
    scientificName: plant.scientificName,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver ${plant.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.thumbCard,
        pressed && styles.thumbCardPressed,
      ]}
    >
      <View style={styles.thumbImageWrap}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={styles.thumbImage}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <MaterialCommunityIcons
            name="leaf"
            size={28}
            color={colors.onPrimary}
          />
        )}
      </View>
      <Text style={styles.thumbName} numberOfLines={1}>
        {plant.name}
      </Text>
      <Text style={styles.thumbLocation} numberOfLines={1}>
        {plant.locationName}
      </Text>
    </Pressable>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: 120,
      gap: Spacing.md,
    },
    searchBar: {
      minHeight: 50,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    searchBarPressed: {
      backgroundColor: isDark ? "#22332F" : "#EEF7F3",
    },
    searchText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
    },
    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.xxl,
      gap: Spacing.sm,
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      maxWidth: 260,
    },

    // Hero
    heroCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    heroPressed: {
      opacity: 0.85,
    },
    heroPhotoWrap: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroPhoto: {
      width: "100%",
      height: "100%",
    },
    heroBody: {
      flex: 1,
      gap: 4,
    },
    heroBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    heroBadgeText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    heroTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    heroSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    statChip: {
      flex: 1,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      gap: 2,
      alignItems: "flex-start",
    },
    statChipIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    statChipValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "800",
    },
    statChipLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },

    // Section headers
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    sectionLink: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },

    // Carrusel
    carouselRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.md,
    },
    thumbCard: {
      width: 130,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.sm,
      gap: 4,
    },
    thumbCardPressed: {
      opacity: 0.8,
    },
    thumbImageWrap: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginBottom: 4,
    },
    thumbImage: {
      width: "100%",
      height: "100%",
    },
    thumbName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    thumbLocation: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
    },

    // Context (luna + clima)
    contextCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    contextHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
    },
    contextHeaderTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    contextHeaderCity: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
    },
    contextBody: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    contextBlock: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    contextDivider: {
      width: 1,
      height: 56,
      backgroundColor: colors.border,
    },
    contextEmoji: {
      fontSize: 28,
    },
    contextBlockLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      textAlign: "center",
    },
    contextBlockMeta: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
      textAlign: "center",
    },
    contextAdvice: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
      lineHeight: Typography.body.lineHeight,
      fontStyle: "italic",
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
