import { useCallback, useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import * as Location from "expo-location";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  visible: boolean;
  initial?: LatLng;
  onConfirm: (coords: LatLng) => void;
  onClose: () => void;
}

const DEFAULT_REGION: Region = {
  // Costa Rica como centro por defecto
  latitude: 9.7489,
  longitude: -83.7534,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

export function MapLocationPicker({
  visible,
  initial,
  onConfirm,
  onClose,
}: MapLocationPickerProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const mapRef = useRef<MapView>(null);

  const [marker, setMarker] = useState<LatLng | null>(initial ?? null);
  const [isLocating, setIsLocating] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  // Reset al abrir el modal
  useEffect(() => {
    if (visible) {
      setMarker(initial ?? null);
      setAddress(null);
    }
  }, [visible, initial]);

  // Reverse geocoding cuando cambia el marcador
  useEffect(() => {
    if (!marker) { setAddress(null); return; }
    let cancelled = false;
    void (async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: marker.lat, longitude: marker.lng });
        if (cancelled) return;
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.street, r.district, r.city, r.region, r.country].filter(Boolean);
          setAddress(parts.slice(0, 3).join(", ") || null);
        }
      } catch {
        // geocoding es best-effort, no es crítico
      }
    })();
    return () => { cancelled = true; };
  }, [marker]);

  const handleMapPress = useCallback((e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ lat: latitude, lng: longitude });
  }, []);

  const handleMyLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setMarker(coords);
      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 600);
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (marker) onConfirm(marker);
  }, [marker, onConfirm]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar mapa"
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Seleccionar ubicación</Text>
            <Text style={styles.headerSubtitle}>Tocá el mapa para marcar el área</Text>
          </View>
        </View>

        {/* Mapa */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={
            initial
              ? {
                  latitude: initial.lat,
                  longitude: initial.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : DEFAULT_REGION
          }
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="hybrid"
        >
          {marker && (
            <Marker
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              pinColor={colors.primary}
            />
          )}
        </MapView>

        {/* Botón de mi ubicación (flotante sobre el mapa) */}
        <Pressable
          onPress={() => void handleMyLocation()}
          disabled={isLocating}
          style={({ pressed }) => [styles.myLocationBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Ir a mi ubicación"
        >
          {isLocating
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.primary} />
          }
        </Pressable>

        {/* Panel inferior */}
        <View style={styles.panel}>
          {marker ? (
            <View style={styles.coordsBlock}>
              <View style={styles.coordsRow}>
                <MaterialCommunityIcons name="map-marker-check" size={16} color={colors.primary} />
                <Text style={styles.coordsText}>
                  {marker.lat.toFixed(6)},  {marker.lng.toFixed(6)}
                </Text>
              </View>
              {address && (
                <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
              )}
            </View>
          ) : (
            <View style={styles.coordsBlock}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.noMarkerText}>Tocá el mapa para seleccionar la ubicación</Text>
            </View>
          )}

          <Pressable
            onPress={handleConfirm}
            disabled={!marker}
            style={({ pressed }) => [
              styles.confirmBtn,
              !marker && styles.confirmBtnDisabled,
              pressed && marker && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirmar ubicación"
          >
            <MaterialCommunityIcons name="check" size={18} color={colors.onPrimary} />
            <Text style={styles.confirmBtnText}>Confirmar ubicación</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl + 8,
      paddingBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTextWrap: {
      flex: 1,
      gap: 2,
    },
    headerTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 1,
      fontWeight: "800",
    },
    headerSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "500",
    },
    map: {
      flex: 1,
    },
    myLocationBtn: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 200,
      width: 46,
      height: 46,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    panel: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: Spacing.lg,
      paddingBottom: Spacing.xl + 8,
      gap: Spacing.md,
    },
    coordsBlock: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    coordsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    coordsText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    addressText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "500",
      lineHeight: 18,
      flex: 1,
    },
    noMarkerText: {
      flex: 1,
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontStyle: "italic",
    },
    confirmBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: 14,
    },
    confirmBtnDisabled: {
      opacity: 0.4,
    },
    confirmBtnText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "800",
    },
    panelShadow: {
      shadowColor: isDark ? "#000" : "#00000022",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  });
