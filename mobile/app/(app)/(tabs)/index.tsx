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
  const restTasks = upcomingTasks.slice(1, 4);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={greetingLabel} subtitle="Tu jardin de hoy" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ============== BLOQUE 1: BUSCADOR + HERO ============== */}
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
              size={56}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Aun no tienes plantas. Identifica una para empezar.
            </Text>
          </View>
        ) : (
          <>
            {heroTask ? (
              <HeroTaskCard
                task={heroTask}
                colors={colors}
                isDark={isDark}
                onPress={() => router.push("/(app)/(tabs)/calendar")}
              />
            ) : null}

            {/* ============== BLOQUE 2: COLECCION ============== */}
            <SectionDivider />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Tu coleccion</Text>
                <Text style={styles.sectionSubtitle}>
                  {plants.length}{" "}
                  {plants.length === 1 ? "planta activa" : "plantas activas"}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/my-plants")}
                accessibilityLabel="Ver todas las plantas"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
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
              <StatChip
                icon="calendar-month-outline"
                value={`${upcomingTasks.length}`}
                label="Tareas"
                colors={colors}
                isDark={isDark}
              />
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

            {/* ============== BLOQUE 3: PROXIMAS TAREAS ============== */}
            {restTasks.length > 0 ? (
              <>
                <SectionDivider />
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Proximas tareas</Text>
                    <Text style={styles.sectionSubtitle}>
                      Despues de la mas urgente
                    </Text>
                  </View>
                </View>
                <View style={styles.taskList}>
                  {restTasks.map((task) => (
                    <Pressable
                      key={task.plant.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Tarea de ${task.plant.name}`}
                      onPress={() => router.push("/(app)/(tabs)/calendar")}
                      style={({ pressed }) => [
                        styles.taskRow,
                        pressed && styles.taskRowPressed,
                      ]}
                    >
                      <View style={styles.taskIcon}>
                        <MaterialCommunityIcons
                          name="water"
                          size={16}
                          color={colors.onPrimary}
                        />
                      </View>
                      <View style={styles.taskBody}>
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          Regar {task.plant.name}
                        </Text>
                        <Text style={styles.taskSubtitle}>
                          En {task.daysAway}{" "}
                          {task.daysAway === 1 ? "dia" : "dias"}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}

        {/* ============== BLOQUE 4: HOY EN EL JARDIN ============== */}
        <SectionDivider />
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Hoy en el jardin</Text>
            <Text style={styles.sectionSubtitle}>
              {today.weather?.city ?? "Tu ubicacion"}
            </Text>
          </View>
        </View>

        <View style={styles.contextCard}>
          <View style={styles.contextBody}>
            <View style={styles.contextBlock}>
              <Text style={styles.contextEmoji}>{today.moon.emoji}</Text>
              <Text style={styles.contextBlockLabel}>{today.moon.label}</Text>
              <Text style={styles.contextBlockMeta}>
                {today.moon.illumination}% iluminada
              </Text>
            </View>

            <View style={styles.contextDivider} />

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

          <View style={styles.contextAdviceWrap}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.contextAdvice}>{today.moon.gardenAdvice}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// SUB-COMPONENTES
// ============================================================

function SectionDivider() {
  return <View style={{ height: Spacing.md }} />;
}

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
      accessibilityLabel={`Tarea destacada: ${task.plant.name} ${urgencyLabel}`}
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
            size={44}
            color={colors.onPrimary}
          />
        )}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{urgencyLabel}</Text>
        </View>
      </View>
      <View style={styles.heroBody}>
        <Text style={styles.heroOverline}>Proxima tarea</Text>
        <Text style={styles.heroTitle}>Regar {task.plant.name}</Text>
        <Text style={styles.heroSubtitle}>
          {task.plant.scientificName} - cada {task.cycle} dias
        </Text>
        <View style={styles.heroCta}>
          <Text style={styles.heroCtaText}>Ver calendario</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={14}
            color={colors.primary}
          />
        </View>
      </View>
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
        <MaterialCommunityIcons name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.statChipText}>
        <Text style={styles.statChipValue}>{value}</Text>
        <Text style={styles.statChipLabel}>{label}</Text>
      </View>
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
      paddingBottom: 130,
      gap: Spacing.md,
    },
    searchBar: {
      minHeight: 48,
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
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    heroPressed: {
      opacity: 0.9,
    },
    heroPhotoWrap: {
      width: 110,
      height: 110,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative",
    },
    heroPhoto: {
      width: "100%",
      height: "100%",
    },
    heroBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      backgroundColor: "rgba(0,0,0,0.7)",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    heroBadgeText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    heroBody: {
      flex: 1,
      justifyContent: "center",
      gap: 4,
    },
    heroOverline: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    heroTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "800",
      lineHeight: Typography.body.lineHeight + 4,
    },
    heroSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },
    heroCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    heroCtaText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },

    // Headers de seccion
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
      marginTop: 2,
    },
    sectionLink: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },

    // Stats chips
    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    statChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    statChipIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
    },
    statChipText: {
      flex: 1,
      gap: 0,
    },
    statChipValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "800",
      lineHeight: Typography.body.lineHeight,
    },
    statChipLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "600",
    },

    // Carrusel
    carouselRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.md,
      paddingVertical: 4,
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

    // Lista de tareas
    taskList: {
      gap: Spacing.xs,
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
    },
    taskRowPressed: {
      opacity: 0.8,
    },
    taskIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    taskBody: {
      flex: 1,
      gap: 1,
    },
    taskTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    taskSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
    },

    // Context card (luna + clima)
    contextCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: Spacing.sm,
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
      height: 64,
      backgroundColor: colors.border,
    },
    contextEmoji: {
      fontSize: 34,
      marginBottom: 4,
    },
    contextBlockLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "800",
      textAlign: "center",
    },
    contextBlockMeta: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
      textAlign: "center",
    },
    contextAdviceWrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    contextAdvice: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
      lineHeight: Typography.body.lineHeight,
      fontStyle: "italic",
    },
  });
