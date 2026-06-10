import React, { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
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
  { label: "3 dias", value: "Cada 3 dias" },
  { label: "5 dias", value: "Cada 5 dias" },
  { label: "7 dias", value: "Cada 7 dias" },
  { label: "10 dias", value: "Cada 10 dias" },
  { label: "14 dias", value: "Cada 14 dias" },
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
      mediaTypes: ["images"],
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
    prefillPhoto?: string;
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
      // Foto remota pre-cargada (ej: Wikipedia desde el buscador de especies).
      // No es local, así que no entra a localPhotoUri (no hay que subirla).
      setPhotoUri(params.prefillPhoto ?? null);
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
  }, [isCreateMode, plant, reset, params.prefillCommon, params.prefillSci, params.prefillPhoto]);

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
      // La foto persistente arranca en la que YA estaba guardada (no el file://
      // de preview): así, si la subida falla, no persistimos una ruta local frágil.
      let finalPhotoUri: string | undefined = isCreateMode
        ? undefined
        : plant?.photoUri ?? undefined;
      let photoUploadFailed = false;

      if (isCreateMode) {
        const created = await createPlant({
          name: values.name,
          scientificName: values.scientificName,
          locationName: values.locationName,
          wateringFrequencyLabel: values.wateringFrequencyLabel,
          areaId,
          acquiredAt,
          notes: values.notes ?? "",
          // Foto remota del prefill (Wikipedia) si el usuario no eligió una propia.
          // Ya es una URL pública persistente, no necesita subirse a Storage.
          photoUri: localPhotoUri ? undefined : photoUri ?? undefined,
        });
        // Subimos a Storage en la ruta del usuario (users/{uid}/plants/...),
        // que es la que permiten las reglas de seguridad.
        if (localPhotoUri) {
          const url = await StorageService.uploadPlantPhoto(
            currentUserId,
            created.id,
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
          } else {
            photoUploadFailed = true;
          }
        }
      } else {
        if (!plant) return;
        // Si hay foto nueva, intentamos subirla; solo si sube la persistimos.
        if (localPhotoUri) {
          const url = await StorageService.uploadPlantPhoto(
            currentUserId,
            plant.id,
            localPhotoUri,
          ).catch(() => null);
          if (url) {
            finalPhotoUri = url;
          } else {
            photoUploadFailed = true;
          }
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

      if (photoUploadFailed) {
        // Los datos se guardaron, pero avisamos que la foto no subió en vez de
        // fingir éxito y dejar una imagen rota.
        setNotice({
          variant: "warning",
          title: "Foto no subida",
          message:
            "Guardamos los cambios, pero la foto no se pudo subir. Revisa tu conexion e intenta editarla de nuevo.",
        });
      } else {
        setNotice({
          variant: "success",
          title: isCreateMode ? "Planta creada" : "Planta actualizada",
          message: isCreateMode
            ? "Se guardo correctamente en la coleccion."
            : "Los cambios quedaron aplicados.",
        });
        setTimeout(() => router.back(), 600);
      }
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

  const acquiredToday =
    !!acquiredAt &&
    formatDate(acquiredAt) === formatDate(new Date().toISOString());

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header estilo iOS: cerrar / titulo / guardar ── */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Cerrar"
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.headerClose, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isCreateMode ? "Nueva planta" : "Editar planta"}
        </Text>
        <Pressable
          accessibilityLabel={isCreateMode ? "Crear planta" : "Guardar cambios"}
          accessibilityRole="button"
          onPress={handleSubmit(onSubmit, onInvalid)}
          disabled={formState.isSubmitting}
          hitSlop={10}
          style={({ pressed }) => [styles.headerSave, pressed && { opacity: 0.7 }]}
        >
          {formState.isSubmitting ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
          style={({ pressed }) => [styles.photoBox, pressed && { opacity: 0.85 }]}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons
                name="camera-plus-outline"
                size={30}
                color={colors.textSecondary}
              />
              <Text style={styles.photoPlaceholderText}>Agregar foto</Text>
            </View>
          )}
        </Pressable>

        {/* ── IDENTIDAD ── */}
        <Text style={styles.groupLabel}>IDENTIDAD</Text>
        <View style={styles.group}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={[styles.field, styles.fieldDivider]}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldKey}>Nombre comun</Text>
                  <TextInput
                    value={String(value ?? "")}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Monstera"
                    placeholderTextColor={colors.disabled}
                    autoCapitalize="words"
                    selectionColor={colors.primary}
                    style={styles.fieldInput}
                  />
                </View>
                {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
              </View>
            )}
          />
          <Controller
            control={control}
            name="scientificName"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldKey}>Nombre botanico</Text>
                  <TextInput
                    value={String(value ?? "")}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Monstera deliciosa"
                    placeholderTextColor={colors.disabled}
                    autoCapitalize="words"
                    selectionColor={colors.primary}
                    style={[styles.fieldInput, styles.fieldInputItalic]}
                  />
                </View>
                {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
              </View>
            )}
          />
        </View>

        {/* ── UBICACION ── */}
        <Text style={styles.groupLabel}>UBICACION</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          <SelectChip
            label="Sin area"
            active={areaId === null}
            onPress={() => setAreaId(null)}
            colors={colors}
          />
          {areas.map((area) => (
            <SelectChip
              key={area.id}
              label={area.name}
              active={areaId === area.id}
              onPress={() => setAreaId(area.id)}
              colors={colors}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crear nueva area"
            onPress={() => router.push("/(app)/forms/area")}
            style={({ pressed }) => [styles.chipCreate, pressed && { opacity: 0.6 }]}
          >
            <MaterialCommunityIcons name="plus" size={13} color={colors.textSecondary} />
            <Text style={styles.chipCreateText}>Nueva area</Text>
          </Pressable>
        </ScrollView>

        {!areaId ? (
          <View style={styles.group}>
            <Controller
              control={control}
              name="locationName"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View style={styles.field}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldKey}>Ubicacion</Text>
                    <TextInput
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Sala norte"
                      placeholderTextColor={colors.disabled}
                      autoCapitalize="words"
                      selectionColor={colors.primary}
                      style={styles.fieldInput}
                    />
                  </View>
                  {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
                </View>
              )}
            />
          </View>
        ) : null}

        {/* ── RIEGO ── */}
        <Text style={styles.groupLabel}>RIEGO</Text>
        <View style={styles.presetRow}>
          {FREQUENCY_PRESETS.map((preset) => (
            <SelectChip
              key={preset.value}
              label={preset.label}
              active={watchedFrequency === preset.value}
              onPress={() =>
                setValue("wateringFrequencyLabel", preset.value, {
                  shouldValidate: true,
                })
              }
              colors={colors}
            />
          ))}
        </View>
        <View style={styles.group}>
          <Controller
            control={control}
            name="wateringFrequencyLabel"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View style={styles.field}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldKey}>Personalizada</Text>
                  <TextInput
                    value={String(value ?? "")}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Cada 4 dias en verano"
                    placeholderTextColor={colors.disabled}
                    autoCapitalize="sentences"
                    selectionColor={colors.primary}
                    style={styles.fieldInput}
                  />
                </View>
                {error ? <Text style={styles.fieldError}>{error.message}</Text> : null}
              </View>
            )}
          />
        </View>

        {/* ── NOTAS ── */}
        <Text style={styles.groupLabel}>NOTAS</Text>
        <View style={styles.group}>
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
                selectionColor={colors.primary}
                style={styles.notesInput}
              />
            )}
          />
        </View>

        {/* ── ADQUISICION ── */}
        <Text style={styles.groupLabel}>ADQUISICION</Text>
        <View style={styles.group}>
          <View style={styles.field}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldKey}>Fecha</Text>
              <View style={styles.dateValue}>
                {acquiredAt ? (
                  <Text style={styles.dateValueText}>{formatDate(acquiredAt)}</Text>
                ) : (
                  <Text style={styles.dateValueEmpty}>Sin fecha</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Marcar adquirida hoy"
                  onPress={() => setAcquiredAt(new Date().toISOString())}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.dateToday,
                    acquiredToday && styles.dateTodayActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dateTodayText,
                      acquiredToday && styles.dateTodayTextActive,
                    ]}
                  >
                    Hoy
                  </Text>
                </Pressable>
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
          </View>
        </View>

        {/* Boton grande de respaldo */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isCreateMode ? "Crear planta" : "Guardar cambios de la planta"
          }
          onPress={handleSubmit(onSubmit, onInvalid)}
          disabled={formState.isSubmitting}
          style={({ pressed }) => [styles.submit, pressed && { opacity: 0.85 }]}
        >
          {formState.isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>
              {isCreateMode ? "Crear planta" : "Guardar cambios"}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// Chip de seleccion sobrio (cuadrado, sin iconos de color).
function SelectChip({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        chipStyles.chip,
        {
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? colors.primary : "transparent",
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          chipStyles.text,
          { color: active ? colors.onPrimary : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: {
    fontFamily: Typography.family,
    fontSize: Typography.caption.fontSize + 1,
    fontWeight: "700",
  },
});

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.sm,
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

    // ── Header iOS ──
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerClose: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "700",
    },
    headerSave: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Foto ──
    photoBox: {
      width: "100%",
      aspectRatio: 1,
      maxHeight: 220,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: colors.surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginTop: Spacing.sm,
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

    // ── Grupos estilo lista iOS ──
    groupLabel: {
      ...Typography.overline,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      marginLeft: Spacing.xs,
    },
    group: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
    },
    field: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
    },
    fieldDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    fieldRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 32,
      gap: Spacing.md,
    },
    fieldKey: {
      width: 116,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
    fieldInput: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "500",
      paddingVertical: 2,
    },
    fieldInputItalic: {
      fontFamily: Typography.serif,
      fontStyle: "italic",
      fontWeight: "400",
    },
    fieldError: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
      marginTop: 4,
      marginLeft: 116 + Spacing.md,
    },

    // ── Chips ──
    chipsRow: {
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      paddingRight: Spacing.md,
    },
    chipCreate: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    chipCreateText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    presetRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
    },

    // ── Notas ──
    notesInput: {
      minHeight: 96,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlignVertical: "top",
    },

    // ── Fecha ──
    dateValue: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: Spacing.sm,
    },
    dateValueText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
    dateValueEmpty: {
      color: colors.disabled,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "500",
    },
    dateToday: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    dateTodayActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dateTodayText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
    },
    dateTodayTextActive: {
      color: colors.onPrimary,
    },

    // ── Boton guardar ──
    submit: {
      marginTop: Spacing.lg,
      height: 52,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    submitText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
  });
