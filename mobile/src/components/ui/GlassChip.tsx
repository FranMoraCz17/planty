import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface GlassChipProps {
  // Valor protagonista (ej: "78", "4").
  value: string;
  // Etiqueta secundaria (ej: "cm", "Cabinas"). Opcional.
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

/**
 * Chip de especificación en cristal, estilo ficha técnica.
 * Iconografía monocromática (sin círculos de color), valor + etiqueta sobria.
 */
export default function GlassChip({ value, label, icon }: GlassChipProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.chip}>
      <BlurView
        intensity={Platform.OS === "ios" ? 30 : 80}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tint} />
      <View style={styles.row}>
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={15}
            color={colors.textSecondary}
          />
        ) : null}
        <Text style={styles.value}>{value}</Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    chip: {
      overflow: "hidden",
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    tint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark
        ? "rgba(255,255,255,0.06)"
        : "rgba(0,0,0,0.04)",
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    value: {
      ...Typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    label: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: "600",
    },
  });
