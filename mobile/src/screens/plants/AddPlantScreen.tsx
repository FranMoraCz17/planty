import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SearchSheet from "@/src/components/layout/SearchSheet";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type Mode = "manual" | "ia" | "buscar";

interface ModeOption {
  value: Mode;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  cta: string;
}

const MODES: ModeOption[] = [
  {
    value: "buscar",
    label: "Buscar",
    icon: "magnify",
    title: "Buscar en el catálogo",
    description:
      "Eligé una especie de nuestro catálogo. Ideal cuando ya sabés qué planta es.",
    cta: "Abrir buscador",
  },
  {
    value: "ia",
    label: "IA",
    icon: "camera-iris",
    title: "Identificar con IA",
    description:
      "Toma una foto y la IA reconoce la especie automáticamente, sugiere cuidados y área.",
    cta: "Abrir cámara",
  },
  {
    value: "manual",
    label: "Manual",
    icon: "pencil-outline",
    title: "Agregar manualmente",
    description:
      "Llená los datos vos mismo. Útil para plantas que no salen en el catálogo o para productores con cultivos específicos.",
    cta: "Abrir formulario",
  },
];

export default function AddPlantScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [mode, setMode] = useState<Mode>("buscar");
  const [searchOpen, setSearchOpen] = useState(false);

  const activeOption = MODES.find((m) => m.value === mode) as ModeOption;

  const handleAction = () => {
    if (mode === "buscar") {
      setSearchOpen(true);
    } else if (mode === "ia") {
      router.replace("/(app)/(tabs)/identify");
    } else {
      router.replace("/(app)/forms/plant?mode=create");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Agregar planta</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {MODES.map((option) => {
          const active = mode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={`Modo ${option.label}`}
              onPress={() => setMode(option.value)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.tabActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={18}
                color={active ? colors.onPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  active && styles.tabTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Card del modo activo */}
      <View style={styles.modeCard}>
        <View style={styles.modeIconWrap}>
          <MaterialCommunityIcons
            name={activeOption.icon}
            size={32}
            color={colors.onPrimary}
          />
        </View>
        <Text style={styles.modeTitle}>{activeOption.title}</Text>
        <Text style={styles.modeDescription}>{activeOption.description}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activeOption.cta}
          onPress={handleAction}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.ctaButtonText}>{activeOption.cta}</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={18}
            color={colors.onPrimary}
          />
        </Pressable>
      </View>

      {/* Hint inferior */}
      <View style={styles.hintWrap}>
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={14}
          color={colors.textSecondary}
        />
        <Text style={styles.hintText}>
          Podes cambiar entre los modos en cualquier momento.
        </Text>
      </View>

      <SearchSheet
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          const q = new URLSearchParams({
            sci: item.scientificName,
            common: item.commonName,
          }).toString();
          router.replace(`/(app)/species?${q}`);
        }}
      />
    </SafeAreaView>
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
    tabsRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    tabTextActive: {
      color: colors.onPrimary,
      fontWeight: "800",
    },
    modeCard: {
      margin: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.xl,
      alignItems: "center",
      gap: Spacing.md,
    },
    modeIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
    },
    modeTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 6,
      fontWeight: "800",
      letterSpacing: -0.3,
      textAlign: "center",
    },
    modeDescription: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: Typography.body.lineHeight + 2,
      textAlign: "center",
      maxWidth: 320,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: Spacing.xl,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.sm,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    ctaButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "800",
    },
    hintWrap: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: Spacing.lg,
      marginTop: -Spacing.xs,
    },
    hintText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },
  });
