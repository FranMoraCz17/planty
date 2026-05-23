import React, { useState } from "react";
import { Link } from "expo-router";
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
import { sendPasswordResetEmail } from "firebase/auth";
import FormNotice from "@/src/components/forms/FormNotice";
import { auth } from "@/src/firebase/firebaseConfig";
import { getFirebaseAuthErrorMessage } from "@/src/services/authErrors";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type NoticeState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);

  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const validate = (): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Escribe tu correo para enviarte el enlace.";
    if (!/^\S+@\S+\.\S+$/.test(trimmed))
      return "El correo no tiene un formato valido.";
    return null;
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (validation) {
      setNotice({
        variant: "warning",
        title: "Correo invalido",
        message: validation,
      });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice({
        variant: "success",
        title: "Correo enviado",
        message:
          "Revisa tu bandeja de entrada. El enlace llega en unos minutos. Si no aparece, revisa la carpeta de spam.",
      });
      setEmail("");
    } catch (error) {
      setNotice({
        variant: "error",
        title: "No se pudo enviar",
        message: getFirebaseAuthErrorMessage(error, "reset"),
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
                <MaterialCommunityIcons
                  name="leaf"
                  size={18}
                  color={colors.onPrimary}
                />
              </View>
            </View>
            <Text style={styles.brandText}>planty</Text>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>v1</Text>
            </View>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.heroTitle}>Recupera tu acceso</Text>
            <Text style={styles.heroBody}>
              Escribe el correo con el que te registraste y te enviaremos un
              enlace para crear una contrasena nueva.
            </Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo</Text>
              <View
                style={[styles.inputWrap, focused && styles.inputWrapFocused]}
              >
                <TextInput
                  accessibilityLabel="Correo"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="tu@correo.com"
                  placeholderTextColor={colors.disabled}
                  selectionColor={colors.primary}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                isSubmitting && styles.submitBtnDisabled,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </Text>
              <MaterialCommunityIcons
                name="email-arrow-right-outline"
                size={16}
                color={colors.onPrimary}
              />
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                el enlace se procesa con Firebase Auth
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Recordaste tu contrasena?</Text>
              <Link href="/(auth)/login" style={styles.link}>
                Inicia sesion
              </Link>
            </View>
          </View>

          <View style={styles.bottomMeta}>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>
              El correo puede tardar unos minutos en llegar.
            </Text>
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
