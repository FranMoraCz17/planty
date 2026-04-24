import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

export default function IdentifyTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cameraHeader}>
            <View style={styles.cameraIconWrap}>
              <MaterialCommunityIcons name="camera" size={20} color={colors.onPrimary} />
            </View>
            <View style={styles.cameraInfo}>
              <Text style={styles.title}>Identificar</Text>
              <Text style={styles.body}>Modulo de camara en preparacion.</Text>
            </View>
          </View>

          <ThemedButton
            label="Abrir camara (proximamente)"
            accessibilityLabel="Abrir camara proximamente"
            disabled
            onPress={() => {}}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Ultimos resultados</Text>
          <Text style={styles.item}>- Monstera deliciosa (94%)</Text>
          <Text style={styles.item}>- Potos aureus (89%)</Text>
          <Text style={styles.item}>- Ficus elastica (87%)</Text>
          <ThemedButton
            label="Ir a Mis plantas"
            accessibilityLabel="Ir a Mis plantas"
            onPress={() => router.push("/(app)/(tabs)/my-plants")}
          />
        </View>
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
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    cameraHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    cameraIconWrap: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? colors.accentWarm : colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    cameraInfo: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 2,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    subtitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    body: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    item: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
  });
