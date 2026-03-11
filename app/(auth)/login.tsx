import { Link, useRouter } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from "@/src/theme/designSystem";
import ThemedButton from "@/src/components/ui/ThemedButton";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar sesion</Text>
        <Text style={styles.body}>Pantalla base de autenticacion.</Text>

        <ThemedButton
          label="Entrar a la app"
          accessibilityLabel="Entrar a la aplicacion"
          onPress={() => router.push("/(app)/(tabs)")}
        />

        <Link href="/(auth)/register" style={styles.link}>
          Crear cuenta
        </Link>
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
  },
  body: {
    color: Colors.textSecondary,
    fontFamily: Typography.family,
    fontSize: Typography.body.fontSize,
    fontWeight: Typography.body.fontWeight,
  },
  link: {
    color: Colors.primary,
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
});
