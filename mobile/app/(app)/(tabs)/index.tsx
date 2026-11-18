import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import SearchSheet from "@/src/components/layout/SearchSheet";
import { useTodayContext } from "@/src/hooks/useTodayContext";
import { usePlantPhoto } from "@/src/hooks/usePlantPhoto";
import PlantFactService from "@/src/services/plantFactService";
import FavoriteFactsService from "@/src/services/favoriteFactsService";
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
  const [searchOpen, setSearchOpen] = useState(false);

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
      <TopBar brand title={greetingLabel} subtitle="Tu jardin de hoy" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ============== BLOQUE 1: BUSCADOR + HERO ============== */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar especie"
          onPress={() => setSearchOpen(true)}
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

        <SearchSheet
          visible={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={(item) => {
            const q = new URLSearchParams({
              sci: item.scientificName,
              common: item.commonName,
            }).toString();
            router.push(`/(app)/species?${q}`);
          }}
        />

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

            {heroTask ? (
              <FeaturedFactCard
                scientificName={heroTask.plant.scientificName}
                colors={colors}
                isDark={isDark}
              />
            ) : null}

            {/* ============== BLOQUE 2: COLECCION ============== */}
            <SectionDivider />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Tu coleccion</Text>
                <Text style={styles.sectionSubtitle}>
                  {plants.length} {plants.length === 1 ? "planta" : "plantas"}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/(app)/(tabs)/collection")}
                accessibilityLabel="Ver todas las plantas"
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.sectionLink}>Ver todas</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <StatChip
                value={nextDays === null ? "-" : `${nextDays}d`}
                label="Próximo riego"
                colors={colors}
                isDark={isDark}
              />
              <View style={styles.statDivider} />
              <StatChip
                value={`${new Set(plants.map((p) => p.locationName)).size}`}
                label="Sitios"
                colors={colors}
                isDark={isDark}
              />
              <View style={styles.statDivider} />
              <StatChip
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
                  <Text style={styles.contextBlockMeta}>Activa ubicacion</Text>
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

function getCareNote(daysAway: number): string {
  if (daysAway <= 0) return "Hoy le viene bien un poco de agua";
  if (daysAway === 1) return "Mañana conviene regarla";
  if (daysAway <= 3) return "Conviene regarla esta semana";
  return "Por ahora esta tranquila, disfrutala";
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
    userPhotoUri: task.plant.photoUri,
    scientificName: task.plant.scientificName,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Destacada hoy: ${task.plant.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.heroCard, pressed && styles.heroPressed]}
    >
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.heroImage}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.heroImageFallback}>
          <MaterialCommunityIcons
            name="leaf"
            size={48}
            color={colors.onPrimary}
          />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(10,12,8,0.05)", "rgba(10,12,8,0.92)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroContent}>
        <Text style={styles.heroOverline}>Destacada hoy</Text>
        <Text style={styles.heroTitle}>{task.plant.name}</Text>
        <Text style={styles.heroSubtitle}>{task.plant.scientificName}</Text>
        <View style={styles.heroCareRow}>
          <MaterialCommunityIcons
            name="water-outline"
            size={14}
            color="rgba(255,255,255,0.85)"
          />
          <Text style={styles.heroCareText}>{getCareNote(task.daysAway)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function FeaturedFactCard({
  scientificName,
  colors,
  isDark,
}: {
  scientificName: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  const [fact, setFact] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void PlantFactService.getDailyFact(scientificName).then((value) => {
      if (!cancelled) setFact(value);
    });
    return () => {
      cancelled = true;
    };
  }, [scientificName]);

  useEffect(() => {
    if (!fact) return;
    let cancelled = false;
    void FavoriteFactsService.isFavorite(scientificName, fact).then((value) => {
      if (!cancelled) setIsFavorite(value);
    });
    return () => {
      cancelled = true;
    };
  }, [scientificName, fact]);

  if (!fact) return null;

  const handleToggleFavorite = () => {
    void FavoriteFactsService.toggleFavorite(scientificName, fact).then(setIsFavorite);
  };

  return (
    <View style={styles.factCard}>
      <View style={styles.factHeader}>
        <Text style={styles.factOverline}>Sabias que...</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          onPress={handleToggleFavorite}
          hitSlop={8}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? colors.error : colors.textSecondary}
          />
        </Pressable>
      </View>
      <Text style={styles.factText}>{fact}</Text>
    </View>
  );
}

function StatChip({
  value,
  label,
  colors,
  isDark,
}: {
  value: string;
  label: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const styles = createStyles(colors, isDark);
  return (
    <View style={styles.statChip}>
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
    userPhotoUri: plant.photoUri,
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
      {photoUri ? (
        <Image
          source={{ uri: photoUri }}
          style={styles.thumbImage}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.thumbImageFallback}>
          <MaterialCommunityIcons
            name="leaf"
            size={28}
            color={colors.onPrimary}
          />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(10,12,8,0.05)", "rgba(10,12,8,0.88)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.thumbContent}>
        <Text style={styles.thumbName} numberOfLines={1}>
          {plant.name}
        </Text>
        <Text style={styles.thumbLocation} numberOfLines={1}>
          {plant.locationName}
        </Text>
      </View>
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
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
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
      height: 210,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      position: "relative",
      backgroundColor: colors.surfaceCard,
    },
    heroPressed: {
      opacity: 0.93,
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    heroImageFallback: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    heroContent: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: Spacing.lg,
      gap: 3,
    },
    heroOverline: {
      color: "rgba(255,255,255,0.7)",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    heroTitle: {
      color: "#FFFFFF",
      fontFamily: Typography.serif,
      fontSize: Typography.title.fontSize,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      color: "rgba(255,255,255,0.78)",
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontSize: Typography.caption.fontSize + 1,
    },
    heroCareRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: Spacing.xs,
    },
    heroCareText: {
      color: "rgba(255,255,255,0.85)",
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontSize: Typography.caption.fontSize + 1,
    },

    // Sabias que...
    factCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      gap: 4,
    },
    factHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    factOverline: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    factText: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight + 2,
    },

    // Headers de seccion
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: Typography.body.fontSize + 6,
      fontWeight: "700",
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

    // Stats
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.xs,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: colors.border,
    },
    statChip: {
      flex: 1,
      alignItems: "center",
      gap: 2,
    },
    statChipValue: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: Typography.body.fontSize + 5,
      fontWeight: "700",
    },
    statChipLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },

    // Carrusel
    carouselRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.md,
      paddingVertical: 4,
    },
    thumbCard: {
      width: 132,
      aspectRatio: 0.78,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      position: "relative",
      backgroundColor: colors.surfaceCard,
    },
    thumbCardPressed: {
      opacity: 0.92,
    },
    thumbImage: {
      ...StyleSheet.absoluteFillObject,
      width: "100%",
      height: "100%",
    },
    thumbImageFallback: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    thumbContent: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: Spacing.sm,
      gap: 1,
    },
    thumbName: {
      color: "#FFFFFF",
      fontFamily: Typography.serif,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    thumbLocation: {
      color: "rgba(255,255,255,0.75)",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize - 1,
      fontWeight: "500",
    },

    // Context card (luna + clima)
    contextCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
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
      borderTopWidth: StyleSheet.hairlineWidth,
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
