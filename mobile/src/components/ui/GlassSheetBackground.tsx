import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import type { BottomSheetBackgroundProps } from "@gorhom/bottom-sheet";

interface GlassSheetBackgroundProps extends BottomSheetBackgroundProps {
  isDark: boolean;
}

// Fondo de cristal compartido para hojas arrastrables: blur + tinte translucido
// y esquinas superiores redondeadas (efecto "yate").
export default function GlassSheetBackground({
  style,
  isDark,
}: GlassSheetBackgroundProps) {
  return (
    <View style={[style, styles.bg]}>
      <BlurView
        intensity={Platform.OS === "ios" ? 35 : 80}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(12,14,11,0.35)"
              : "rgba(244,241,234,0.4)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
