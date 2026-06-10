import { useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import StorageService from "@/src/services/storageService";
import {
  type AreaHumidityLevel,
  type AreaLightLevel,
  type AreaType,
} from "@/src/services/areaService";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const LIGHT_OPTIONS: { value: AreaLightLevel; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { value: "sombra", label: "Sombra", icon: "weather-night" },
  { value: "luz-indirecta", label: "Luz indirecta", icon: "weather-partly-cloudy" },
  { value: "luz-brillante", label: "Luz brillante", icon: "weather-sunny" },
  { value: "sol-directo", label: "Sol directo", icon: "white-balance-sunny" },
];

const HUMIDITY_OPTIONS: { value: AreaHumidityLevel; label: string }[] = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const TYPE_OPTIONS: {
  value: AreaType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  defaultIndoor: boolean;
}[] = [
  { value: "casa", label: "Casa", icon: "home", defaultIndoor: true },
  { value: "patio", label: "Patio", icon: "tree-outline", defaultIndoor: false },
  { value: "finca", label: "Finca", icon: "barn", defaultIndoor: false },
  {
    value: "invernadero",
    label: "Invernadero",
    icon: "greenhouse",
    defaultIndoor: true,
  },
  { value: "balcon", label: "Balcón", icon: "balcony", defaultIndoor: false },
  { value: "vivero", label: "Vivero", icon: "sprout", defaultIndoor: false },
  { value: "huerto", label: "Huerto", icon: "carrot", defaultIndoor: false },
  {
    value: "otro",
    label: "Otro",
    icon: "dots-horizontal-circle-outline",
    defaultIndoor: true,
  },
];

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;

type SizeUnit = "m2" | "ha" | "manzana" | "cuerda";

const SIZE_UNITS: { value: SizeUnit; label: string; toM2: number }[] = [
  { value: "m2", label: "m²", toM2: 1 },
  { value: "ha", label: "ha", toM2: 10000 },
  { value: "manzana", label: "mz", toM2: 6988 },
  { value: "cuerda", label: "cda", toM2: 3888 },
];

async function pickPhoto(source: "camera" | "library"): Promise<string | null> {
  if (source === "library") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Necesitamos permiso para acceder a tu galeria.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  } else {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Necesitamos permiso para usar la camara.");
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0].uri;
  }
}

async function compressImage(uri: string): Promise<string> {
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG },
  );
  return manipulated.uri;
}

export default function AreaFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? null;

  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const {
    currentUserId,
    getAreaById,
    createArea,
    updateArea,
    deleteArea,
  } = useDemoData();

  const existing = useMemo(
    () => (editingId ? getAreaById(editingId) : null),
    [editingId, getAreaById],
  );

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [type, setType] = useState<AreaType>(existing?.type ?? "casa");
  const [zone, setZone] = useState(existing?.zone ?? "");
  const [lightLevel, setLightLevel] = useState<AreaLightLevel>(
    existing?.lightLevel ?? "luz-indirecta",
  );
  const [humidityLevel, setHumidityLevel] = useState<AreaHumidityLevel>(
    existing?.humidityLevel ?? "media",
  );
  const [indoor, setIndoor] = useState<boolean>(existing?.indoor ?? true);
  const [photoUri, setPhotoUri] = useState<string | null>(
    existing?.photoUri ?? null,
  );
  const [locationLat, setLocationLat] = useState<number | undefined>(existing?.locationLat);
  const [locationLng, setLocationLng] = useState<number | undefined>(existing?.locationLng);
  const [sizeValue, setSizeValue] = useState<string>(
    existing?.areaSizeM2 != null ? String(existing.areaSizeM2) : ""
  );
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>("m2");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si existing cambia (carga async), sincronizamos
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
      setType(existing.type);
      setZone(existing.zone);
      setLightLevel(existing.lightLevel);
      setHumidityLevel(existing.humidityLevel);
      setIndoor(existing.indoor);
      setPhotoUri(existing.photoUri);
      setLocationLat(existing.locationLat);
      setLocationLng(existing.locationLng);
      if (existing.areaSizeM2 != null) setSizeValue(String(existing.areaSizeM2));
    }
  }, [existing]);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos permiso de ubicación para registrar las coordenadas del área.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocationLat(loc.coords.latitude);
      setLocationLng(loc.coords.longitude);
    } catch {
      Alert.alert("Error", "No se pudo obtener la ubicación.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert(
      "Foto del area",
      "Elegi de donde quieres tomar la foto",
      [
        {
          text: "Galeria",
          onPress: () => void handlePick("library"),
        },
        {
          text: "Camara",
          onPress: () => void handlePick("camera"),
        },
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  const handlePick = async (source: "camera" | "library") => {
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      const compressed = await compressImage(uri);
      setLocalPhotoUri(compressed);
      setPhotoUri(compressed);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo cargar la foto.",
      );
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError("El nombre del area es obligatorio.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingId && existing) {
        // EDITAR
        let finalPhotoUri = existing.photoUri;
        if (localPhotoUri) {
          finalPhotoUri = await StorageService.uploadAreaPhoto(
            currentUserId,
            editingId,
            localPhotoUri,
          );
        }
        const sizeNum = parseFloat(sizeValue);
        const unit = SIZE_UNITS.find((u) => u.value === sizeUnit)!;
        await updateArea(editingId, {
          name: name.trim(),
          description: description.trim(),
          type,
          zone: zone.trim(),
          lightLevel,
          humidityLevel,
          indoor,
          photoUri: finalPhotoUri,
          locationLat,
          locationLng,
          areaSizeM2: !isNaN(sizeNum) && sizeNum > 0 ? Math.round(sizeNum * unit.toM2) : undefined,
        });
      } else {
        // CREAR: primero el doc, despues subir foto si hay, despues update con URL
        const sizeNum = parseFloat(sizeValue);
        const unit = SIZE_UNITS.find((u) => u.value === sizeUnit)!;
        const created = await createArea({
          userId: currentUserId,
          name: name.trim(),
          description: description.trim(),
          type,
          zone: zone.trim(),
          lightLevel,
          humidityLevel,
          indoor,
          photoUri: null,
          locationLat,
          locationLng,
          areaSizeM2: !isNaN(sizeNum) && sizeNum > 0 ? Math.round(sizeNum * unit.toM2) : undefined,
        });
        if (localPhotoUri) {
          const url = await StorageService.uploadAreaPhoto(
            currentUserId,
            created.id,
            localPhotoUri,
          );
          await updateArea(created.id, { photoUri: url });
        }
      }
      router.back();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el area.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert(
      "Eliminar area",
      "Se eliminara el area. Las plantas asociadas no se borraran, pero quedaran sin area.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteArea(editingId)
              .then(() => router.back())
              .catch((err: unknown) => {
                Alert.alert(
                  "Error",
                  err instanceof Error ? err.message : "No se pudo eliminar.",
                );
              });
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {editingId ? "Editar area" : "Nueva area"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Foto */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar foto del area"
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
                size={36}
                color={colors.textSecondary}
              />
              <Text style={styles.photoPlaceholderText}>
                Agregar foto del area
              </Text>
            </View>
          )}
        </Pressable>

        {/* Nombre */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sala con luz indirecta"
            placeholderTextColor={colors.disabled}
            style={styles.input}
          />
        </View>

        {/* Descripcion */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Descripcion (opcional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Detalles del espacio, ventanas, orientacion..."
            placeholderTextColor={colors.disabled}
            multiline
            style={[styles.input, styles.inputMultiline]}
          />
        </View>

        {/* Tipo de area */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Tipo de espacio</Text>
          <View style={styles.optionsGrid}>
            {TYPE_OPTIONS.map((option) => {
              const active = type === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Tipo ${option.label}`}
                  onPress={() => {
                    setType(option.value);
                    // Sugerir indoor segun tipo (el usuario puede cambiarlo)
                    setIndoor(option.defaultIndoor);
                  }}
                  style={({ pressed }) => [
                    styles.optionPill,
                    active && styles.optionPillActive,
                    pressed && styles.optionPillPressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={16}
                    color={active ? colors.onPrimary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.optionPillText,
                      active && styles.optionPillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Ubicación GPS */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ubicación</Text>
          <Text style={styles.fieldHint}>
            Capturá las coordenadas GPS del área. Podés ingresar lat/lng manualmente si registrás una finca remota.
          </Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={styles.locationIconWrap}>
                <MaterialCommunityIcons
                  name={locationLat != null ? "map-marker-check" : "map-marker-outline"}
                  size={18}
                  color={locationLat != null ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                {locationLat != null && locationLng != null ? (
                  <>
                    <Text style={styles.coordsText}>
                      {locationLat.toFixed(6)},  {locationLng.toFixed(6)}
                    </Text>
                    <Text style={styles.coordsHint}>Coordenadas registradas</Text>
                  </>
                ) : (
                  <Text style={styles.coordsEmpty}>Sin coordenadas aún</Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Usar mi ubicación actual"
                onPress={() => void handleGetLocation()}
                disabled={isFetchingLocation}
                style={({ pressed }) => [
                  styles.gpsBtn,
                  pressed && { opacity: 0.75 },
                  isFetchingLocation && { opacity: 0.5 },
                ]}
              >
                {isFetchingLocation
                  ? <ActivityIndicator size="small" color={colors.onPrimary} />
                  : <>
                      <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.onPrimary} />
                      <Text style={styles.gpsBtnText}>GPS</Text>
                    </>
                }
              </Pressable>
            </View>

            {/* Inputs manuales para registrar finca remota */}
            <View style={styles.coordInputRow}>
              <TextInput
                value={locationLat != null ? String(locationLat) : ""}
                onChangeText={(v) => { const n = parseFloat(v); setLocationLat(isNaN(n) ? undefined : n); }}
                placeholder="Latitud (ej: 9.7489)"
                placeholderTextColor={colors.disabled}
                keyboardType="decimal-pad"
                style={[styles.input, styles.coordInput]}
              />
              <TextInput
                value={locationLng != null ? String(locationLng) : ""}
                onChangeText={(v) => { const n = parseFloat(v); setLocationLng(isNaN(n) ? undefined : n); }}
                placeholder="Longitud (ej: -83.7534)"
                placeholderTextColor={colors.disabled}
                keyboardType="decimal-pad"
                style={[styles.input, styles.coordInput]}
              />
            </View>

            {locationLat != null && (
              <Pressable
                onPress={() => { setLocationLat(undefined); setLocationLng(undefined); }}
                style={styles.clearCoords}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.clearCoordsText}>Limpiar coordenadas</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Superficie */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Superficie (opcional)</Text>
          <View style={styles.sizeRow}>
            <TextInput
              value={sizeValue}
              onChangeText={setSizeValue}
              placeholder="0"
              placeholderTextColor={colors.disabled}
              keyboardType="decimal-pad"
              style={[styles.input, styles.sizeInput]}
            />
            <View style={styles.unitRow}>
              {SIZE_UNITS.map((u) => (
                <Pressable
                  key={u.value}
                  onPress={() => setSizeUnit(u.value)}
                  style={[styles.unitPill, sizeUnit === u.value && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, sizeUnit === u.value && styles.unitPillTextActive]}>
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          {sizeValue !== "" && !isNaN(parseFloat(sizeValue)) && parseFloat(sizeValue) > 0 && sizeUnit !== "m2" && (
            <Text style={styles.sizeConvertHint}>
              ≈ {Math.round(parseFloat(sizeValue) * (SIZE_UNITS.find(u => u.value === sizeUnit)?.toM2 ?? 1)).toLocaleString("es-CR")} m²
            </Text>
          )}
        </View>

        {/* Nombre de zona */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Zona (opcional)</Text>
          <Text style={styles.fieldHint}>
            Ejemplo: Lote A, Sala norte, Parcela 1, Invernadero sur.
          </Text>
          <TextInput
            value={zone}
            onChangeText={setZone}
            placeholder="Nombre de la zona..."
            placeholderTextColor={colors.disabled}
            style={styles.input}
          />
        </View>

        {/* Luz */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nivel de luz</Text>
          <View style={styles.optionsGrid}>
            {LIGHT_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Seleccionar ${option.label}`}
                onPress={() => setLightLevel(option.value)}
                style={({ pressed }) => [
                  styles.optionPill,
                  lightLevel === option.value && styles.optionPillActive,
                  pressed && styles.optionPillPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={16}
                  color={
                    lightLevel === option.value
                      ? colors.onPrimary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.optionPillText,
                    lightLevel === option.value && styles.optionPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Humedad */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Humedad</Text>
          <View style={styles.optionsRow}>
            {HUMIDITY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Humedad ${option.label}`}
                onPress={() => setHumidityLevel(option.value)}
                style={({ pressed }) => [
                  styles.segment,
                  humidityLevel === option.value && styles.segmentActive,
                  pressed && styles.optionPillPressed,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    humidityLevel === option.value && styles.segmentTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Indoor */}
        <View style={styles.indoorRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Espacio interior</Text>
            <Text style={styles.fieldHint}>
              Apaga si el area es patio, jardin o terraza exterior.
            </Text>
          </View>
          <Switch
            value={indoor}
            onValueChange={setIndoor}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Botones */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Guardar area"
          onPress={() => void handleSave()}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.85 },
            isSaving && { opacity: 0.6 },
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.saveButtonText}>
              {editingId ? "Guardar cambios" : "Crear area"}
            </Text>
          )}
        </Pressable>

        {editingId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar area"
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Eliminar area</Text>
          </Pressable>
        ) : null}
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
    headerBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    photoBox: {
      width: "100%",
      aspectRatio: 16 / 10,
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
    field: {
      gap: Spacing.xs,
    },
    fieldLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    fieldHint: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
      marginTop: 2,
    },
    input: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
    },
    inputMultiline: {
      minHeight: 70,
      textAlignVertical: "top",
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    optionsRow: {
      flexDirection: "row",
      gap: Spacing.xs,
    },
    optionPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionPillPressed: {
      opacity: 0.75,
    },
    optionPillText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
    },
    optionPillTextActive: {
      color: colors.onPrimary,
      fontWeight: "800",
    },
    segment: {
      flex: 1,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
    },
    segmentActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    segmentText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    segmentTextActive: {
      color: colors.onPrimary,
    },
    indoorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    errorText: {
      color: isDark ? "#FECACA" : "#B91C1C",
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: Spacing.sm,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "800",
    },
    deleteButton: {
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    deleteButtonText: {
      color: isDark ? "#FECACA" : "#B91C1C",
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "700",
    },
    locationCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    locationIconWrap: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#1A2E24" : "#E8F5EE",
      alignItems: "center",
      justifyContent: "center",
    },
    coordsText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    coordsHint: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "500",
      marginTop: 1,
    },
    coordsEmpty: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "500",
      fontStyle: "italic",
    },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 7,
      borderRadius: BorderRadius.full,
      minWidth: 56,
      justifyContent: "center",
    },
    gpsBtnText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "800",
    },
    coordInputRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    coordInput: {
      flex: 1,
      fontSize: Typography.caption.fontSize + 1,
    },
    clearCoords: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      marginTop: 2,
    },
    clearCoordsText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    sizeRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      alignItems: "center",
      marginTop: Spacing.xs,
    },
    sizeInput: {
      flex: 1,
    },
    unitRow: {
      flexDirection: "row",
      gap: 4,
    },
    unitPill: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 7,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitPillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitPillText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "700",
    },
    unitPillTextActive: {
      color: colors.onPrimary,
    },
    sizeConvertHint: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
      marginTop: -Spacing.xs + 2,
    },
  });
