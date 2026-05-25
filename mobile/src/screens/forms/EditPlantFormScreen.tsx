import React, { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import FormNotice from "@/src/components/forms/FormNotice";
import FormTextInput from "@/src/components/forms/FormTextInput";
import ThemedButton from "@/src/components/ui/ThemedButton";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  type PlantFormValues,
  plantFormSchema,
} from "@/src/features/forms/formSchemas";
import StorageService from "@/src/services/storageService";
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

const FREQUENCY_PRESETS = [
  { label: "Cada 3 dias", value: "Cada 3 dias" },
  { label: "Cada 5 dias", value: "Cada 5 dias" },
  { label: "Cada 7 dias", value: "Cada 7 dias" },
  { label: "Cada 10 dias", value: "Cada 10 dias" },
  { label: "Cada 14 dias", value: "Cada 14 dias" },
];

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("es-CR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function pickAndCompressImage(
  source: "library" | "camera",
): Promise<string | null> {
  if (source === "library") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Necesitamos permiso para acceder a tu galeria.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const manipulated = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: SaveFormat.JPEG },
    );
    return manipulated.uri;
  } else {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Necesitamos permiso para usar la camara.");
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return null;
    const manipulated = await manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: SaveFormat.JPEG },
    );
    return manipulated.uri;
  }
}

export default function EditPlantFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    mode?: string;
    prefillCommon?: string;
    prefillSci?: string;
  }>();
  const { colors, isDark } = useAppTheme();
  const {
    currentUserId,
    getPlantById,
    getPlantsByUser,
    updatePlant,
    createPlant,
    areas,
  } = useDemoData();
  const styles = createStyles(colors, isDark);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const isCreateMode = params.mode === "create";

  const fallbackPlant = isCreateMode
    ? null
    : getPlantsByUser(currentUserId)[0] ?? null;
  const plant = !isCreateMode && params.id ? getPlantById(params.id) : fallbackPlant;

  // Estado extra que no maneja react-hook-form
  const [areaId, setAreaId] = useState<string | null>(
    plant?.areaId ?? null,
  );
  const [acquiredAt, setAcquiredAt] = useState<string | null>(
    plant?.acquiredAt ?? null,
  );
  const [photoUri, setPhotoUri] = useState<string | null>(
    plant?.photoUri ?? null,
  );
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const selectedArea = useMemo(
    () => (areaId ? areas.find((a) => a.id === areaId) ?? null : null),
    [areaId, areas],
  );

  const { control, handleSubmit, reset, formState, watch, setValue } =
    useForm<PlantFormValues>({
      resolver: zodResolver(plantFormSchema),
      defaultValues: {
        name: "",
        scientificName: "",
        locationName: "",
        wateringFrequencyLabel: "",
        notes: "",
      },
    });

  const watchedFrequency = watch("wateringFrequencyLabel");

  useEffect(() => {
    if (isCreateMode) {
      reset({
        name: params.prefillCommon ?? "",
        scientificName: params.prefillSci ?? "",
        locationName: "",
        wateringFrequencyLabel: "",
        notes: "",
      });
      setAreaId(null);
      setAcquiredAt(new Date().toISOString());
      setPhotoUri(null);
      setLocalPhotoUri(null);
      return;
    }
    if (!plant) return;
    reset({
      name: plant.name,
      scientificName: plant.scientificName,
      locationName: plant.locationName,
      wateringFrequencyLabel: plant.wateringFrequencyLabel,
      notes: plant.notes ?? "",
    });
    setAreaId(plant.areaId ?? null);
    setAcquiredAt(plant.acquiredAt ?? null);
    setPhotoUri(plant.photoUri ?? null);
    setLocalPhotoUri(null);
  }, [isCreateMode, plant, reset, params.prefillCommon, params.prefillSci]);

  // Cuando se selecciona un area, sincronizamos locationName con su nombre
  useEffect(() => {
    if (selectedArea) {
      setValue("locationName", selectedArea.name, { shouldValidate: true });
    }
  }, [selectedArea, setValue]);

  const handlePickPhoto = () => {
    Alert.alert("Foto de la planta", "Elegi de donde tomar la foto", [
      {
        text: "Galeria",
        onPress: () => {
          void (async () => {
            try {
              const uri = await pickAndCompressImage("library");
              if (uri) {
                setLocalPhotoUri(uri);
                setPhotoUri(uri);
              }
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "No se pudo cargar la foto.",
              );
            }
          })();
        },
      },
      {
        text: "Camara",
        onPress: () => {
          void (async () => {
            try {
              const uri = await pickAndCompressImage("camera");
              if (uri) {
                setLocalPhotoUri(uri);
                setPhotoUri(uri);
              }
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "No se pudo cargar la foto.",
              );
            }
          })();
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const onSubmit = async (values: PlantFormValues) => {
    try {
      let finalPhotoUri: string | undefined = photoUri ?? undefined;

      if (isCreateMode) {
        const created = await createPlant({
          name: values.name,
          scientificName: values.scientificName,
          locationName: values.locationName,
          wateringFrequencyLabel: values.wateringFrequencyLabel,
          areaId,
          acquiredAt,
          notes: values.notes ?? "",
        });
        // Si hay foto local, subimos a Storage usando el ID de la planta creada
        if (localPhotoUri) {
          const url = await StorageService.uploadProfilePhoto(
            `plants-${created.id}`,
            localPhotoUri,
          ).catch(() => null);
          if (url) {
            await updatePlant(created.id, {
              name: values.name,
              scientificName: values.scientificName,
              locationName: values.locationName,
              wateringFrequencyLabel: values.wateringFrequencyLabel,
              photoUri: url,
            });
            finalPhotoUri = url;
          }
        }
      } else {
        if (!plant) return;
        // Si hay foto nueva, subimos antes de actualizar
        if (localPhotoUri) {
          const url = await StorageService.uploadProfilePhoto(
            `plants-${plant.id}`,
            localPhotoUri,
          ).catch(() => null);
          if (url) finalPhotoUri = url;
        }
        await updatePlant(plant.id, {
          name: values.name,
          scientificName: values.scientificName,
          locationName: values.locationName,
          wateringFrequencyLabel: values.wateringFrequencyLabel,
          areaId,
          acquiredAt,
          notes: values.notes ?? "",
          photoUri: finalPhotoUri,
        });
      }

      setNotice({
        variant: "success",
        title: isCreateMode ? "Planta creada" : "Planta actualizada",
        message: isCreateMode
          ? "Se guardo correctamente en la coleccion."
          : "Los cambios quedaron aplicados.",
      });

      setTimeout(() => router.back(), 600);
    } catch (error) {
      setNotice({
        variant: "error",
        title: "Error al guardar",
        message:
          error instanceof Error
            ? error.message
            : "Ocurrio un error inesperado al guardar la planta.",
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.headerTitle}>
            {isCreateMode ? "Nueva planta" : "Editar planta"}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        {notice ? (
          <FormNotice
            message={notice.message}
            onDismiss={() => setNotice(null)}
            title={notice.title}
            variant={notice.variant}
          />
        ) : null}

        {/* Foto */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar foto"
          onPress={handlePickPhoto}
          style={({ pressed }) => [
            styles.photoBox,
            pressed && { opacity: 0.85 },
          ]}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons
                name="camera-plus-outline"
                size={32}
                color={colors.textSecondary}
              />
              <Text style={styles.photoPlaceholderText}>Agregar foto</Text>
            </View>
          )}
        </Pressable>

        {/* Identidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identidad</Text>
          <FormTextInput
            autoCapitalize="words"
            control={control}
            label="Nombre comun"
            leadingIcon="leaf"
            name="name"
            placeholder="Monstera"
          />
          <FormTextInput
            autoCapitalize="words"
            control={control}
            label="Nombre botanico"
            leadingIcon="flask-outline"
            name="scientificName"
            placeholder="Monstera deliciosa"
          />
        </View>

        {/* Area */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Area</Text>
          <Text style={styles.sectionHint}>
            Asigna la planta a un espacio para organizarla mejor.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sin area"
              onPress={() => setAreaId(null)}
              style={({ pressed }) => [
                styles.chip,
                areaId === null && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  areaId === null && styles.chipTextActive,
                ]}
              >
                Sin area
              </Text>
            </Pressable>
            {areas.map((area) => (
              <Pressable
                key={area.id}
                accessibilityRole="button"
                accessibilityLabel={`Area ${area.name}`}
                onPress={() => setAreaId(area.id)}
                style={({ pressed }) => [
                  styles.chip,
                  areaId === area.id && styles.chipActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    areaId === area.id && styles.chipTextActive,
                  ]}
                >
                  {area.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crear nueva area"
              onPress={() => router.push("/(app)/forms/area")}
              style={({ pressed }) => [
                styles.chipCreate,
                pressed && { opacity: 0.7 },
              ]}
            >
              <MaterialCommunityIcons
                name="plus"
                size={12}
                color={colors.primary}
              />
              <Text style={styles.chipCreateText}>Nueva area</Text>
            </Pressable>
          </ScrollView>

          {!areaId ? (
            <FormTextInput
              autoCapitalize="words"
              control={control}
              label="Ubicacion (texto libre)"
              leadingIcon="map-marker-outline"
              name="locationName"
              placeholder="Sala norte"
            />
          ) : null}
        </View>

        {/* Frecuencia visual */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frecuencia de riego</Text>
          <View style={styles.presetGrid}>
            {FREQUENCY_PRESETS.map((preset) => {
              const active = watchedFrequency === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  onPress={() =>
                    setValue("wateringFrequencyLabel", preset.value, {
                      shouldValidate: true,
                    })
                  }
                  style={({ pressed }) => [
                    styles.preset,
                    active && styles.presetActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="water"
                    size={14}
                    color={active ? colors.onPrimary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      active && styles.presetTextActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <FormTextInput
            autoCapitalize="sentences"
            control={control}
            label="O escribi una frecuencia personalizada"
            leadingIcon="pencil-outline"
            name="wateringFrequencyLabel"
            placeholder="Cada 4 dias en verano"
          />
        </View>

        {/* Notas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value ?? ""}
                onChangeText={onChange}
                placeholder="Observaciones, tratamientos, recordatorios..."
                placeholderTextColor={colors.disabled}
                multiline
                style={styles.notesInput}
              />
            )}
          />
        </View>

        {/* Fecha adquisicion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fecha de adquisicion</Text>
          <View style={styles.dateRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Marcar adquirida hoy"
              onPress={() => setAcquiredAt(new Date().toISOString())}
              style={({ pressed }) => [
                styles.chip,
                acquiredAt &&
                  formatDate(acquiredAt) === formatDate(new Date().toISOString()) &&
                  styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  acquiredAt &&
                    formatDate(acquiredAt) ===
                      formatDate(new Date().toISOString()) &&
                    styles.chipTextActive,
                ]}
              >
                Hoy
              </Text>
            </Pressable>
            {acquiredAt ? (
              <View style={styles.dateBadge}>
                <MaterialCommunityIcons
                  name="calendar"
                  size={14}
                  color={colors.primary}
                />
                <Text style={styles.dateBadgeText}>
                  {formatDate(acquiredAt)}
                </Text>
              </View>
            ) : null}
            {acquiredAt ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Quitar fecha"
                onPress={() => setAcquiredAt(null)}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={18}
                  color={colors.disabled}
                />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ThemedButton
          accessibilityLabel={
            isCreateMode
              ? "Guardar nueva planta"
              : "Guardar cambios de la planta"
          }
          label={
            formState.isSubmitting
              ? "Guardando..."
              : isCreateMode
                ? "Crear planta"
                : "Guardar cambios"
          }
          onPress={handleSubmit(onSubmit, onInvalid)}
        />
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
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    emptyBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    backButtonPressed: {
      opacity: 0.7,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    photoBox: {
      width: "100%",
      aspectRatio: 1,
      maxHeight: 240,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    photoImage: {
      width: "100%",
      height: "100%",
    },
    photoPlaceholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
    },
    photoPlaceholderText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
    section: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    sectionHint: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
      marginTop: -4,
    },
    chipsRow: {
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    chipTextActive: {
      color: colors.onPrimary,
      fontWeight: "800",
    },
    chipCreate: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
    },
    chipCreateText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    presetGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    preset: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    presetActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    presetTextActive: {
      color: colors.onPrimary,
      fontWeight: "800",
    },
    notesInput: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 80,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlignVertical: "top",
    },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flexWrap: "wrap",
    },
    dateBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
    },
    dateBadgeText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
  });
