import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useForm } from "react-hook-form";
import FormNotice from "@/src/components/forms/FormNotice";
import FormTextInput from "@/src/components/forms/FormTextInput";
import ThemedButton from "@/src/components/ui/ThemedButton";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  type PlantFormValues,
  plantFormSchema,
} from "@/src/features/forms/formSchemas";
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

export default function EditPlantFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { colors, isDark } = useAppTheme();
  const { currentUserId, getPlantById, getPlantsByUser, updatePlant, createPlant } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const isCreateMode = params.mode === "create";

  const fallbackPlant = isCreateMode ? null : getPlantsByUser(currentUserId)[0] ?? null;
  const plant = !isCreateMode && params.id ? getPlantById(params.id) : fallbackPlant;
  const currentPlant = plant;

  const { control, handleSubmit, reset, formState } = useForm<PlantFormValues>({
    resolver: zodResolver(plantFormSchema),
    defaultValues: {
      name: "",
      scientificName: "",
      locationName: "",
      wateringFrequencyLabel: "",
    },
  });

  useEffect(() => {
    if (isCreateMode) {
      reset({
        name: "",
        scientificName: "",
        locationName: "",
        wateringFrequencyLabel: "",
      });
      return;
    }

    if (!plant) {
      return;
    }

    reset({
      name: plant.name,
      scientificName: plant.scientificName,
      locationName: plant.locationName,
      wateringFrequencyLabel: plant.wateringFrequencyLabel,
    });
  }, [isCreateMode, plant, reset]);

  const onSubmit = async (values: PlantFormValues) => {
    try {
      if (isCreateMode) {
        await createPlant(values, { simulateFailure });
      } else {
        if (!plant) {
          return;
        }

        await updatePlant(plant.id, values, { simulateFailure });
      }

      setNotice({
        variant: "success",
        title: isCreateMode ? "Planta creada" : "Planta actualizada",
        message: isCreateMode
          ? "La planta se guardo correctamente en la coleccion."
          : "Los cambios quedaron aplicados sobre la planta seleccionada.",
      });
      setSimulateFailure(false);

      if (isCreateMode) {
        reset({
          name: "",
          scientificName: "",
          locationName: "",
          wateringFrequencyLabel: "",
        });
      }
    } catch (error) {
      setNotice({
        variant: "error",
        title: "Error al guardar",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrio un error inesperado al actualizar la planta.",
      });
    }
  };

  const onInvalid = () => {
    setNotice({
      variant: "warning",
      title: "Formulario incompleto",
      message: "Corrige los campos marcados antes de volver a guardar.",
    });
  };

  if (!isCreateMode && !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No hay planta disponible</Text>
          <Text style={styles.emptyBody}>
            No se encontro el registro solicitado para editar.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Volver"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Formulario de planta</Text>
            <Text style={styles.subtitle}>
              {isCreateMode
                ? "Registra una planta nueva y valida los campos relevantes del cuidado."
                : "Edita un registro existente y valida los campos relevantes del cuidado."}
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

        {!isCreateMode && currentPlant ? (
          <View style={styles.snapshotCard}>
            <Text style={styles.cardTitle}>Datos actuales</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Nombre comun</Text>
                <Text style={styles.snapshotValue}>{currentPlant.name}</Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Nombre botanico</Text>
                <Text style={styles.snapshotValue}>{currentPlant.scientificName}</Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Ubicacion</Text>
                <Text style={styles.snapshotValue}>{currentPlant.locationName}</Text>
              </View>
              <View style={styles.snapshotItem}>
                <Text style={styles.snapshotLabel}>Frecuencia de riego</Text>
                <Text style={styles.snapshotValue}>{currentPlant.wateringFrequencyLabel}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>{isCreateMode ? "Nueva planta" : "Editar planta"}</Text>
          <Text style={styles.cardBody}>
            {isCreateMode
              ? "Completa la informacion principal para agregar una planta nueva a tu coleccion."
              : "El formulario parte de la planta ya almacenada y deja el registro listo para actualizar."}
          </Text>

          <FormTextInput
            autoCapitalize="words"
            control={control}
            helperText="Nombre principal mostrado en la coleccion."
            label="Nombre comun"
            leadingIcon="leaf"
            name="name"
            placeholder="Monstera"
          />

          <FormTextInput
            autoCapitalize="words"
            control={control}
            helperText="Nombre botanico o cientifico de la especie."
            label="Nombre botanico"
            leadingIcon="flask-outline"
            name="scientificName"
            placeholder="Monstera deliciosa"
          />

          <FormTextInput
            autoCapitalize="words"
            control={control}
            helperText="Lugar actual donde se ubica la planta."
            label="Ubicacion"
            leadingIcon="map-marker-outline"
            name="locationName"
            placeholder="Sala norte"
          />

          <FormTextInput
            autoCapitalize="sentences"
            control={control}
            helperText="Etiqueta corta de cuidado para riego."
            label="Frecuencia de riego"
            leadingIcon="water-outline"
            name="wateringFrequencyLabel"
            placeholder="Cada 5 dias"
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
            accessibilityLabel={isCreateMode ? "Guardar nueva planta" : "Guardar cambios de la planta"}
            label={
              formState.isSubmitting
                ? "Guardando..."
                : isCreateMode
                  ? "Crear planta"
                  : "Guardar cambios"
            }
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
