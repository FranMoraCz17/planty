import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { BorderRadius, Spacing, Typography } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function OfflineBanner() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.accentWarm }]}>
      <MaterialCommunityIcons name="wifi-off" size={16} color="#fff" />
      <Text style={styles.text}>Sin conexión — algunos datos pueden no estar actualizados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    margin: Spacing.sm,
  },
  text: {
    color: "#fff",
    fontFamily: "System",
    fontSize: Typography.caption.fontSize + 1,
    fontWeight: "600",
    flex: 1,
  },
});
