import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface GlassIconButtonProps {
  icon?: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  loading?: boolean;
  // Tinte del cristal: "dark" para flotar sobre fotos (por defecto).
  tint?: "dark" | "light";
}

/**
 * Botón circular de cristal esmerilado para flotar sobre fotos a sangre.
 * Extraído del detalle de planta para reutilizarse en todas las pantallas
 * que adoptan el patrón "yate" (foto + hoja de cristal).
 */
export default function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  loading,
  tint = "dark",
}: GlassIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}
    >
      <BlurView intensity={30} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={styles.tint} />
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <MaterialCommunityIcons name={icon ?? "circle-small"} size={22} color="#fff" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
});
