import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ThemedButton from "@/src/components/ui/ThemedButton";
import { auth } from "@/src/firebase/firebaseConfig";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, toggleTheme } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleOpenSystemSettings = () => {
    void Linking.openSettings();
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setErrorMessage(null);
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cerrar la sesion.";
      setErrorMessage(message);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver al perfil"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Ajustes</Text>
            <Text style={styles.subtitle}>Tema y sesion</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tema visual</Text>
          <Text style={styles.cardBody}>Modo actual: {mode === "dark" ? "Oscuro" : "Claro"}</Text>
          <ThemedButton
            accessibilityLabel="Alternar tema de la aplicacion"
            label={mode === "dark" ? "Pasar a claro" : "Pasar a oscuro"}
            onPress={toggleTheme}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permisos</Text>
          <Text style={styles.cardBody}>
            Gestiona permisos del dispositivo como camara y galeria desde la configuracion del sistema.
          </Text>
          <Pressable
            accessibilityLabel="Abrir configuracion del sistema"
            accessibilityRole="button"
            onPress={handleOpenSystemSettings}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={18}
              color={colors.text}
            />
            <Text style={styles.settingsButtonText}>Abrir configuracion del sistema</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sesion</Text>
          <Text style={styles.cardBody}>Cierra la sesion actual y vuelve al login.</Text>
          <Pressable
            accessibilityLabel="Cerrar sesion"
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.signOutButtonPressed,
              isSigningOut && styles.signOutButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.onPrimary} />
            <Text style={styles.signOutButtonText}>
              {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
            </Text>
          </Pressable>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </View>
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
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backButtonPressed: {
      backgroundColor: isDark ? "#223630" : "#E8F4EF",
    },
    headerCopy: {
      gap: 2,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 4,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    cardBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    signOutButton: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.md,
    },
    settingsButton: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.md,
    },
    settingsButtonPressed: {
      opacity: 0.75,
    },
    settingsButtonText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    signOutButtonPressed: {
      backgroundColor: colors.pressed,
    },
    signOutButtonDisabled: {
      opacity: 0.7,
    },
    signOutButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    errorText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
  });
