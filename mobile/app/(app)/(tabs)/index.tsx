import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

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

const highlights = [
  { id: "h1", title: "Luz filtrada", subtitle: "Sala norte", icon: "white-balance-sunny" },
  { id: "h2", title: "Riego en 2 dias", subtitle: "Monstera", icon: "water" },
  { id: "h3", title: "Nueva hoja", subtitle: "Pothos", icon: "leaf" },
] as const;

const profilePhotoUri: string | null = null;

export default function HomeTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Buenas tardes, Francisco</Text>
            <Text style={styles.brand}>Planty</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir al perfil"
            onPress={() => router.push("/(app)/(tabs)/profile")}
            style={({ pressed }) => [styles.headerBadge, pressed && styles.headerBadgePressed]}
          >
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.headerAvatarImage} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={26} color={colors.primary} />
            )}
          </Pressable>
        </View>

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
