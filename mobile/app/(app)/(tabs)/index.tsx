import { useMemo } from "react";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import TopBar from "@/src/components/layout/TopBar";
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

const tools = [
  {
    key: "diagnostico",
    title: "Diagnosticar",
    subtitle: "Verifica salud",
    icon: "heart-pulse",
    route: "/(app)/(tabs)/care",
  },
  {
    key: "identificar",
    title: "Identificar",
    subtitle: "Reconoce especie",
    icon: "camera",
    route: "/(app)/(tabs)/identify",
  },
  {
    key: "coleccion",
    title: "Mi coleccion",
    subtitle: "Estado por planta",
    icon: "sprout",
    route: "/(app)/(tabs)/my-plants",
  },
  {
    key: "recordatorios",
    title: "Recordatorios",
    subtitle: "Agenda de riego",
    icon: "calendar-check",
    route: "/(app)/(tabs)/care",
  },
] as const;

export default function HomeTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUser, plants } = useDemoData();
  const styles = createStyles(colors, isDark);

  const firstName = getFirstName(currentUser?.name);
  const greetingLabel = firstName
    ? `${getGreeting()}, ${firstName}`
    : getGreeting();

  const highlights = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [];

    const plantCount = plants.length;
    items.push({
      id: "count",
      title: plantCount === 1 ? "1 planta activa" : `${plantCount} plantas activas`,
      subtitle: "en tu coleccion",
      icon: "sprout",
    });

    const featured = plants[0];
    if (featured) {
      items.push({
        id: "featured",
        title: featured.name,
        subtitle: featured.locationName || "Sin ubicacion",
        icon: "leaf",
      });
      items.push({
        id: "watering",
        title: featured.wateringFrequencyLabel,
        subtitle: featured.name,
        icon: "water",
      });
    } else {
      items.push({
        id: "empty",
        title: "Sin plantas aun",
        subtitle: "Toca Identificar",
        icon: "plus-circle-outline",
      });
    }

    return items;
  }, [plants]);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title={greetingLabel} subtitle="Tu jardin de hoy" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar plantas"
          onPress={() => router.push("/(app)/(tabs)/identify")}
          style={({ pressed }) => [styles.searchBar, pressed && styles.searchBarPressed]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <Text style={styles.searchText}>Buscar por especie, sintoma o foto</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Herramientas de cuidado</Text>
        </View>

        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <Pressable
              key={tool.key}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${tool.title}`}
              onPress={() => router.push(tool.route)}
              style={({ pressed }) => [
                styles.toolCard,
                tool.key === "identificar" && styles.toolCardHighlight,
                pressed && styles.toolCardPressed,
              ]}
            >
              <View style={[styles.toolIconWrap, tool.key === "identificar" && styles.toolIconWrapHighlight]}>
                <MaterialCommunityIcons
                  name={tool.icon}
                  size={20}
                  color={tool.key === "identificar" ? colors.accentWarm : colors.primary}
                />
              </View>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pulso del jardin</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsRow}>
          {highlights.map((item, index) => (
            <View key={item.id} style={styles.highlightCard}>
              <View
                style={[
                  styles.highlightIcon,
                  index === 0 && { backgroundColor: colors.accentCool },
                  index === 1 && { backgroundColor: colors.accentWarm },
                  index === 2 && { backgroundColor: colors.accentLavender },
                ]}
              >
                <MaterialCommunityIcons name={item.icon} size={18} color={colors.onPrimary} />
              </View>
              <Text style={styles.highlightTitle}>{item.title}</Text>
              <Text style={styles.highlightSubtitle}>{item.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    greeting: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "700",
      lineHeight: Typography.title.lineHeight,
    },
    brand: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginTop: 2,
    },
    headerBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerBadgePressed: {
      backgroundColor: isDark ? "#22332F" : "#EAF4F0",
    },
    headerAvatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 22,
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
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    sectionHeader: {
      marginTop: Spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 3,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    toolsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    toolCard: {
      width: "48.5%",
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
      minHeight: 132,
    },
    toolCardHighlight: {
      borderColor: colors.accentWarm,
      backgroundColor: isDark ? "#2B2A1D" : "#FFF6E8",
    },
    toolCardPressed: {
      opacity: 0.85,
    },
    toolIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
    },
    toolIconWrapHighlight: {
      backgroundColor: isDark ? "#3A3322" : "#FFE5B8",
    },
    toolTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    toolSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    highlightsRow: {
      gap: Spacing.sm,
      paddingRight: Spacing.sm,
    },
    highlightCard: {
      width: 126,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    highlightIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
    },
    highlightTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    highlightSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
  });
