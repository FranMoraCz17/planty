import React, { useState } from "react";
import { Link, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import ThemedButton from "@/src/components/ui/ThemedButton";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type AuthMode = "login" | "register";
type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface AuthFormScreenProps {
  mode: AuthMode;
}

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  rightAction?: React.ReactNode;
  colors: ThemeColors;
  isDark: boolean;
}

function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  rightAction,
  colors,
  isDark,
}: AuthInputProps) {
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.disabled}
          secureTextEntry={secureTextEntry}
          selectionColor={colors.primary}
          style={styles.input}
          value={value}
        />
        {rightAction}
      </View>
    </View>
  );
}

export default function AuthFormScreen({ mode }: AuthFormScreenProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const stats: Array<{ icon: MaterialIconName; value: string; caption: string }> = isRegister
    ? [
        { icon: "sprout", value: "Coleccion", caption: "Tus plantas en un solo lugar" },
        { icon: "calendar-check", value: "Rutinas", caption: "Recordatorios basicos de cuidado" },
      ]
    : [
        { icon: "leaf", value: "Seguimiento", caption: "Riego, luz y diagnostico" },
        { icon: "camera", value: "Registro", caption: "Fotos e historial por planta" },
      ];

  const title = isRegister ? "Crear cuenta" : "Bienvenido otra vez";
  const description = isRegister
    ? "Dejamos listo el formulario base para empezar a guardar usuarios despues."
    : "Pantalla inicial pensada para que el acceso quede separado del resto de la app.";
  const buttonLabel = isRegister ? "Crear cuenta" : "Iniciar sesion";
  const switchHref = isRegister ? "/(auth)/login" : "/(auth)/register";
  const switchText = isRegister ? "Ya tengo cuenta" : "Crear cuenta";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="pine-tree" size={18} color={colors.onPrimary} />
              <Text style={styles.heroBadgeText}>Planty</Text>
            </View>

            <Text style={styles.heroTitle}>
              {isRegister ? "Organiza tu cuidado desde el primer dia" : "Tu jardin en un solo panel"}
            </Text>
            <Text style={styles.heroBody}>
              La idea es entrar rapido, ver lo importante y despues seguir a cuidado, perfil o
              coleccion sin perderse.
            </Text>

            <View style={styles.statsRow}>
              {stats.map((item) => (
                <View key={item.value} style={styles.statCard}>
                  <View style={styles.statIcon}>
                    <MaterialCommunityIcons
                      color={isDark ? colors.onPrimary : colors.primary}
                      name={item.icon}
                      size={18}
                    />
                  </View>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statCaption}>{item.caption}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{description}</Text>

            {isRegister && (
              <AuthInput
                autoCapitalize="words"
                colors={colors}
                isDark={isDark}
                label="Nombre"
                onChangeText={setName}
                placeholder="Francisco Mora"
                value={name}
              />
            )}

            <AuthInput
              autoCapitalize="none"
              colors={colors}
              isDark={isDark}
              keyboardType="email-address"
              label="Correo"
              onChangeText={setEmail}
              placeholder="fran@planty.com"
              value={email}
            />

            <AuthInput
              autoCapitalize="none"
              colors={colors}
              isDark={isDark}
              label="Contrasena"
              onChangeText={setPassword}
              placeholder="Minimo 8 caracteres"
              rightAction={
                <Pressable
                  accessibilityLabel={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((previous) => !previous)}
                  style={({ pressed }) => [styles.inputIconButton, pressed && styles.inputIconPressed]}
                >
                  <MaterialCommunityIcons
                    color={colors.textSecondary}
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                  />
                </Pressable>
              }
              secureTextEntry={!showPassword}
              value={password}
            />

            {isRegister && (
              <AuthInput
                autoCapitalize="none"
                colors={colors}
                isDark={isDark}
                label="Confirmar contrasena"
                onChangeText={setConfirmPassword}
                placeholder="Repite la contrasena"
                rightAction={
                  <Pressable
                    accessibilityLabel={
                      showConfirmPassword ? "Ocultar confirmacion" : "Mostrar confirmacion"
                    }
                    accessibilityRole="button"
                    onPress={() => setShowConfirmPassword((previous) => !previous)}
                    style={({ pressed }) => [
                      styles.inputIconButton,
                      pressed && styles.inputIconPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      color={colors.textSecondary}
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                    />
                  </Pressable>
                }
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
              />
            )}

            <Text style={styles.helperText}>
              Por ahora este flujo es visual y local. La siguiente parte natural es conectar estos
              campos con autenticacion y una base de datos.
            </Text>

            <ThemedButton
              accessibilityLabel={buttonLabel}
              label={buttonLabel}
              onPress={() => router.replace("/(app)/(tabs)")}
            />

            {!isRegister && (
              <Pressable
                accessibilityLabel="Ir a la app en modo demo"
                accessibilityRole="button"
                onPress={() => router.push("/(app)/(tabs)")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              >
                <Text style={styles.secondaryButtonText}>Entrar en modo demo</Text>
              </Pressable>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>
                {isRegister ? "Si ya habias entrado antes:" : "Si todavia no tienes cuenta:"}
              </Text>
              <Link href={switchHref} style={styles.link}>
                {switchText}
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    keyboard: {
      flex: 1,
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    heroCard: {
      backgroundColor: isDark ? "#18302A" : "#DDF2E8",
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    heroBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
    },
    heroBadgeText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    heroTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    heroBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    statsRow: {
      gap: Spacing.sm,
    },
    statCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#294039" : "#EDF8F3",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    statValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    statCaption: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    formCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.title.fontSize - 2,
      fontWeight: Typography.title.fontWeight,
      lineHeight: Typography.title.lineHeight,
    },
    body: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    inputWrap: {
      minHeight: 52,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#13231F" : "#F5FBF8",
      paddingLeft: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "500",
      paddingVertical: Spacing.sm,
    },
    inputIconButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 2,
      borderRadius: BorderRadius.full,
    },
    inputIconPressed: {
      backgroundColor: isDark ? "#223630" : "#E6F2ED",
    },
    helperText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    secondaryButton: {
      minHeight: 46,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.lg,
    },
    secondaryButtonPressed: {
      backgroundColor: isDark ? "#22332F" : "#EDF7F3",
    },
    secondaryButtonText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    footerText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    link: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
  });
