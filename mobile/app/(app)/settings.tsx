import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
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

type SettingsVisualOptions = {
  largeText: boolean;
  highContrast: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, mode, toggleTheme } = useAppTheme();

  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const styles = createStyles(colors, isDark, { largeText, highContrast });

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver a la pantalla anterior"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Ajustes</Text>
            <Text style={styles.subtitle}>Configuracion basica y accesibilidad</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Apariencia</Text>
          <Text style={styles.cardBody}>
            Modo actual: {mode === "dark" ? "Oscuro" : "Claro"}
          </Text>
          <ThemedButton
            accessibilityLabel="Alternar tema de la aplicacion"
            label={mode === "dark" ? "Pasar a claro" : "Pasar a oscuro"}
            onPress={toggleTheme}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Accesibilidad</Text>
          <Text style={styles.cardBody}>
            Opciones rapidas para lectura y comodidad visual.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Texto grande</Text>
              <Text style={styles.settingHint}>
                Aumenta el tamano del texto en esta pantalla.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Activar texto grande"
              accessibilityRole="switch"
              onValueChange={setLargeText}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={largeText ? colors.onPrimary : "#FFFFFF"}
              value={largeText}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Alto contraste</Text>
              <Text style={styles.settingHint}>
                Refuerza bordes y contraste para mejorar legibilidad.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Activar alto contraste"
              accessibilityRole="switch"
              onValueChange={setHighContrast}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={highContrast ? colors.onPrimary : "#FFFFFF"}
              value={highContrast}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Reducir animaciones</Text>
              <Text style={styles.settingHint}>
                Minimiza transiciones para evitar fatiga visual.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Reducir animaciones"
              accessibilityRole="switch"
              onValueChange={setReduceMotion}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={reduceMotion ? colors.onPrimary : "#FFFFFF"}
              value={reduceMotion}
            />
          </View>

          <View style={styles.settingRowLast}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingLabel}>Vibracion tactil</Text>
              <Text style={styles.settingHint}>
                Mantiene respuesta tactil en acciones principales.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Activar vibracion tactil"
              accessibilityRole="switch"
              onValueChange={setHapticsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={hapticsEnabled ? colors.onPrimary : "#FFFFFF"}
              value={hapticsEnabled}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Permisos</Text>
          <Text style={styles.cardBody}>
            Gestiona permisos del dispositivo como camara y galeria.
          </Text>
          <Pressable
            accessibilityLabel="Abrir configuracion del sistema"
            accessibilityRole="button"
            onPress={handleOpenSystemSettings}
            style={({ pressed }) => [
              styles.primaryActionButton,
              pressed && styles.primaryActionButtonPressed,
            ]}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.onPrimary} />
            <Text style={styles.primaryActionButtonText}>
              Abrir configuracion del sistema
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cuenta</Text>
          <Text style={styles.cardBody}>Cierra la sesion actual y vuelve al login.</Text>
          <Pressable
            accessibilityLabel="Cerrar sesion"
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.dangerActionButton,
              pressed && styles.dangerActionButtonPressed,
              isSigningOut && styles.actionButtonDisabled,
            ]}
          >
            <MaterialCommunityIcons name="logout" size={18} color="#FFFFFF" />
            <Text style={styles.dangerActionButtonText}>
              {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
            </Text>
          </Pressable>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ThemeColors,
  isDark: boolean,
  options: SettingsVisualOptions,
) =>
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
      flex: 1,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.title.fontSize - 1
        : Typography.title.fontSize - 4,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.caption.fontSize + 3
        : Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: options.highContrast ? colors.text : colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.body.fontSize + 2
        : Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    cardBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.caption.fontSize + 3
        : Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: Spacing.sm,
    },
    settingRowLast: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
    },
    settingCopy: {
      flex: 1,
      gap: 2,
    },
    settingLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.body.fontSize + 1
        : Typography.body.fontSize,
      fontWeight: "700",
    },
    settingHint: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.caption.fontSize + 2
        : Typography.caption.fontSize,
      lineHeight: Typography.caption.lineHeight,
    },
    primaryActionButton: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.md,
    },
    primaryActionButtonPressed: {
      backgroundColor: colors.pressed,
    },
    primaryActionButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.body.fontSize + 1
        : Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    dangerActionButton: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.error,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Spacing.md,
    },
    dangerActionButtonPressed: {
      opacity: 0.85,
    },
    actionButtonDisabled: {
      opacity: 0.65,
    },
    dangerActionButtonText: {
      color: "#FFFFFF",
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.body.fontSize + 1
        : Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    errorText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: options.largeText
        ? Typography.caption.fontSize + 3
        : Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
  });
