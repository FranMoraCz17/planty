import React, { useEffect, useState } from "react";
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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import FormNotice from "@/src/components/forms/FormNotice";
import { useDemoData } from "@/src/data/DemoDataProvider";
import { auth } from "@/src/firebase/firebaseConfig";
import { getFirebaseAuthErrorMessage } from "@/src/services/authErrors";
import { ensureUserDocument } from "@/src/services/userService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type AuthMode = "login" | "register";

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

type NoticeState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

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
  const [focused, setFocused] = useState(false);
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const { isAuthenticated } = useDemoData();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(app)/(tabs)");
    }
  }, [isAuthenticated, router]);

  const title = isRegister ? "Crea tu cuenta" : "Hola de nuevo";
  const description = isRegister
    ? "Regístrate para empezar a identificar y cuidar tus plantas con IA."
    : "Ingresa con tu correo para acceder a tu colección.";
  const buttonLabel = isRegister ? "Crear cuenta" : "Iniciar sesión";
  const switchHref = isRegister ? "/(auth)/login" : "/(auth)/register";
  const switchPrompt = isRegister ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?";
  const switchText = isRegister ? "Inicia sesión" : "Regístrate";

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      return "Correo y contraseña son obligatorios.";
    }
    if (isRegister) {
      if (!name.trim()) return "El nombre es obligatorio.";
      if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    }
    return null;
  };

  const handleAuth = async () => {
    const validationError = validateForm();

    if (validationError) {
      setNotice({ variant: "warning", title: "Formulario incompleto", message: validationError });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      if (isRegister) {
        const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserDocument({
          id: credentials.user.uid,
          email: credentials.user.email,
          name: name.trim(),
          username: email.trim().split("@")[0],
          city: "Sin ciudad",
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setNotice({
        variant: "error",
        title: isRegister ? "Error al registrar" : "Error al iniciar sesión",
        message: getFirebaseAuthErrorMessage(
          error,
          isRegister ? "register" : "login",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <View style={styles.brandLogoInner}>
                <MaterialCommunityIcons name="leaf" size={18} color={colors.onPrimary} />
              </View>
            </View>
            <Text style={styles.brandText}>planty</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>v1</Text>
            </View>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroBody}>{description}</Text>
          </View>

          <View style={styles.formCard}>
            {notice && (
              <FormNotice
                title={notice.title}
                message={notice.message}
                variant={notice.variant}
                onDismiss={() => setNotice(null)}
              />
            )}

            {isRegister && (
              <AuthInput
                autoCapitalize="words"
                colors={colors}
                isDark={isDark}
                label="Nombre"
                onChangeText={setName}
                placeholder="Tu nombre"
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
              placeholder="tu@correo.com"
              value={email}
            />

            <AuthInput
              autoCapitalize="none"
              colors={colors}
              isDark={isDark}
              label="Contraseña"
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              rightAction={
                <Pressable
                  accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((p) => !p)}
                  style={({ pressed }) => [styles.inputIconButton, pressed && styles.inputIconPressed]}
                >
                  <MaterialCommunityIcons
                    color={colors.textSecondary}
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                  />
                </Pressable>
              }
              secureTextEntry={!showPassword}
              value={password}
            />

            {!isRegister && (
              <View style={styles.forgotRow}>
                <Link href="/(auth)/forgot-password" style={styles.link}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </View>
            )}

            {isRegister && (
              <AuthInput
                autoCapitalize="none"
                colors={colors}
                isDark={isDark}
                label="Confirmar contraseña"
                onChangeText={setConfirmPassword}
                placeholder="Repite la contraseña"
                rightAction={
                  <Pressable
                    accessibilityLabel={showConfirmPassword ? "Ocultar" : "Mostrar"}
                    accessibilityRole="button"
                    onPress={() => setShowConfirmPassword((p) => !p)}
                    style={({ pressed }) => [styles.inputIconButton, pressed && styles.inputIconPressed]}
                  >
                    <MaterialCommunityIcons
                      color={colors.textSecondary}
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                    />
                  </Pressable>
                }
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
              />
            )}

            <Pressable
              onPress={handleAuth}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                isSubmitting && styles.submitBtnDisabled,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "Procesando..." : buttonLabel}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color={colors.onPrimary} />
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>seguro con Firebase Auth</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>{switchPrompt}</Text>
              <Link href={switchHref} style={styles.link}>
                {switchText}
              </Link>
            </View>
          </View>

          <View style={styles.bottomMeta}>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>Identificación con Gemini · Datos en Firestore</Text>
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
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
      gap: Spacing.xl,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    brandLogo: {
      width: 32,
      height: 32,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    brandLogoInner: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    brandText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.8,
    },
    brandBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: isDark ? "#1F1F1F" : "#F4F4F5",
      borderWidth: 1,
      borderColor: colors.border,
    },
    brandBadgeText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    heroBlock: {
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    heroTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
      lineHeight: 38,
    },
    heroBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 15,
      lineHeight: 22,
    },
    formCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    inputGroup: {
      gap: 6,
    },
    inputLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    inputWrap: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#0F0F0F" : "#FAFAFA",
      paddingLeft: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
    },
    inputWrapFocused: {
      borderColor: colors.primary,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 15,
      fontWeight: "500",
      paddingVertical: Spacing.sm,
    },
    inputIconButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 2,
      borderRadius: BorderRadius.full,
    },
    inputIconPressed: {
      backgroundColor: isDark ? "#1F1F1F" : "#F4F4F5",
    },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: 14,
      marginTop: Spacing.xs,
    },
    submitBtnPressed: {
      opacity: 0.85,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitBtnText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: 2,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    footerText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
    },
    link: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "700",
    },
    forgotRow: {
      alignItems: "flex-end",
      marginTop: -Spacing.xs,
    },
    bottomMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: Spacing.sm,
    },
    metaDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.primary,
    },
    metaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "500",
    },
  });
