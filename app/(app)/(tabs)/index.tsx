import { useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "@/src/theme/designSystem";
import ThemedButton from "@/src/components/ui/ThemedButton";

export default function HomeTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Plant Project</Text>
        <Text style={styles.body}>
          Dashboard principal del curso. Desde aqui puedes abrir tu perfil.
        </Text>

        <ThemedButton
          label="Ir a Perfil"
          accessibilityLabel="Ir a pantalla de perfil"
          onPress={() => router.push("/(app)/(tabs)/profile")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontFamily: Typography.family,
    fontSize: Typography.title.fontSize,
    fontWeight: Typography.title.fontWeight,
    lineHeight: Typography.title.lineHeight,
  },
  body: {
    color: Colors.textSecondary,
    fontFamily: Typography.family,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
    lineHeight: Typography.body.lineHeight,
  },
});
