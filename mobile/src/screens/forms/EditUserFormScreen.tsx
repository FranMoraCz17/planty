import FormNotice from "@/src/components/forms/FormNotice";
import FormTextInput from "@/src/components/forms/FormTextInput";
import ThemedButton from "@/src/components/ui/ThemedButton";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  userFormSchema,
  type UserFormValues,
} from "@/src/features/forms/formSchemas";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

type NoticeState = {
  variant: "success" | "error" | "warning";
  title: string;
  message: string;
};

export default function EditUserFormScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { currentUser, updateUser } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const { control, handleSubmit, reset, formState } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      city: "",
    },
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    reset({
      name: currentUser.name,
      username: currentUser.username,
      email: currentUser.email,
      city: currentUser.city,
    });
  }, [currentUser, reset]);

  const onSubmit = async (values: UserFormValues) => {
    if (!currentUser) {
      return;
    }

    try {
      await updateUser(currentUser.id, values, { simulateFailure });
      setNotice({
        variant: "success",
        title: "Usuario actualizado",
        message:
          "Los cambios se guardaron correctamente en la capa de datos activa.",
      });
      setSimulateFailure(false);
    } catch (error) {
      setNotice({
        variant: "error",
        title: "Error al guardar",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrio un error inesperado al actualizar el usuario.",
      });
    }
  };

  const onInvalid = () => {
    setNotice({
      variant: "warning",
      title: "Formulario incompleto",
      message: "Corrige los campos marcados antes de intentar guardar.",
    });
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No hay usuario disponible</Text>
          <Text style={styles.emptyBody}>
            La capa de datos no encontro un registro inicial.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={colors.text}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Formulario de usuario</Text>
            <Text style={styles.subtitle}>
              Carga datos existentes, valida y actualiza el registro.
            </Text>
          </View>
        </View>

        {notice ? (
          <FormNotice
            message={notice.message}
            onDismiss={() => setNotice(null)}
            title={notice.title}
            variant={notice.variant}
          />
        ) : null}

        <View style={styles.snapshotCard}>
          <Text style={styles.cardTitle}>Datos actuales</Text>
          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Nombre</Text>
              <Text style={styles.snapshotValue}>{currentUser.name}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Alias</Text>
              <Text style={styles.snapshotValue}>@{currentUser.username}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Correo</Text>
              <Text style={styles.snapshotValue}>{currentUser.email}</Text>
            </View>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotLabel}>Ciudad</Text>
              <Text style={styles.snapshotValue}>{currentUser.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Editar usuario</Text>
          <Text style={styles.cardBody}>
            Este formulario usa `react-hook-form` y `zod` para validacion
            declarativa y manejo de estado.
          </Text>

          <FormTextInput
            autoCapitalize="words"
            control={control}
            helperText="Nombre visible del perfil."
            label="Nombre"
            leadingIcon="account-outline"
            name="name"
            placeholder="Fran Mora"
          />

          <FormTextInput
            autoCapitalize="none"
            control={control}
            helperText="Identificador corto para la cuenta."
            label="Alias"
            leadingIcon="at"
            name="username"
            placeholder="fran.botanica"
          />

          <FormTextInput
            autoCapitalize="none"
            control={control}
            helperText="Correo principal de acceso."
            keyboardType="email-address"
            label="Correo"
            leadingIcon="email-outline"
            name="email"
            placeholder="fran@planty.com"
          />

          <FormTextInput
            autoCapitalize="words"
            control={control}
            helperText="Ubicacion general del usuario."
            label="Ciudad"
            leadingIcon="map-marker-outline"
            name="city"
            placeholder="Perez Zeledon, Costa Rica"
          />

          <View style={styles.toggleCard}>
            
            <Switch
              onValueChange={setSimulateFailure}
              thumbColor={simulateFailure ? colors.onPrimary : "#F4F3F4"}
              trackColor={{ false: colors.disabled, true: colors.primary }}
              value={simulateFailure}
            />
          </View>

          <ThemedButton
            accessibilityLabel="Guardar cambios del usuario"
            label={formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
            onPress={handleSubmit(onSubmit, onInvalid)}
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      alignItems: "center",
      justifyContent: "center",
    },
    backButtonPressed: {
      backgroundColor: isDark ? "#22332F" : "#EDF7F3",
    },
    headerCopy: {
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
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    snapshotCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    snapshotGrid: {
      gap: Spacing.sm,
    },
    snapshotItem: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      gap: 2,
    },
    snapshotLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
    snapshotValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
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
    cardTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    cardBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    toggleCard: {
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#1E302B" : "#EEF8F4",
      padding: Spacing.md,
      flexDirection: "row",
      gap: Spacing.md,
      alignItems: "center",
    },
    toggleCopy: {
      flex: 1,
      gap: 2,
    },
    toggleTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    toggleBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.sm,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    emptyBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
  });
