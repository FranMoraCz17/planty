import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BorderRadius, type ThemeColors } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  // Radio de las esquinas (cuadrado tipo iOS por defecto).
  radius?: number;
  // Intensidad del desenfoque (0–100).
  intensity?: number;
  // Borde hairline sutil (true por defecto).
  bordered?: boolean;
}

/**
 * Tarjeta de cristal esmerilado (liquid glass) para superponer sobre fotos.
 * Usa desenfoque real en iOS y un tinte translúcido de respaldo en Android.
 */
export default function GlassCard({
  children,
  style,
  radius = BorderRadius.lg,
  intensity = 40,
  bordered = true,
}: GlassCardProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.wrapper, { borderRadius: radius }, style]}>
      <BlurView
        intensity={Platform.OS === "ios" ? intensity : Math.min(intensity + 45, 100)}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(12,14,11,0.45)"
              : "rgba(251,249,243,0.55)",
            borderRadius: radius,
            borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
            borderColor: isDark
              ? "rgba(255,255,255,0.14)"
              : "rgba(0,0,0,0.08)",
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (_colors: ThemeColors, _isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      overflow: "hidden",
    },
    content: {
      // El contenido se posiciona sobre las capas de cristal.
    },
  });
