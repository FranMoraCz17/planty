import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import { useCamera } from "@/src/hooks/useCamera";
import IdentifyService, { PlantIdentifyResult } from "@/src/services/identifyService";
import { BorderRadius, Spacing, Typography, type ThemeColors } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import ThemedButton from "@/src/components/ui/ThemedButton";

type ScreenState = "camera" | "identifying" | "result" | "no_permission";

export default function IdentifyTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const { createPlant, currentUserId } = useDemoData();

  const {
    cameraRef,
    isPermissionGranted,
    isLoadingPermissions,
    facing,
    flashMode,
    requestPermissions,
    takePhoto,
    toggleFacing,
    toggleFlash,
  } = useCamera({ requestOnMount: true });

  const [screenState, setScreenState] = useState<ScreenState>("camera");
  const [result, setResult] = useState<PlantIdentifyResult | null>(null);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const flashIcon =
    flashMode === "on" ? "flash" : flashMode === "auto" ? "flash-auto" : "flash-off";

  const handleTakePhoto = async () => {
    const photo = await takePhoto({ quality: 0.8, base64: false });
    if (!photo) return;

    setLastPhotoUri(photo.uri);
    setScreenState("identifying");

    try {
      const identifyResult = await IdentifyService.identifyFromUri(photo.uri);
      setResult(identifyResult);
      setScreenState("result");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al identificar la planta.";
      Alert.alert("Error de identificación", message);
      setScreenState("camera");
    }
  };

  const handleSavePlant = async () => {
    if (!result || !result.isPlant) return;

    setIsSaving(true);
    try {
      await createPlant({
        name: result.commonName,
        scientificName: result.scientificName,
        locationName: "Sin ubicación",
        wateringFrequencyLabel: "Cada 7 días",
      });
      Alert.alert(
        "Planta guardada",
        `${result.commonName} fue agregada a tu colección.`,
        [{ text: "Ver mis plantas", onPress: () => router.push("/(app)/(tabs)/my-plants") }],
      );
      setScreenState("camera");
      setResult(null);
      setLastPhotoUri(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la planta.";
      Alert.alert("Error", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setScreenState("camera");
    setResult(null);
    setLastPhotoUri(null);
  };

  const handleOpenSettings = () => {
    void Linking.openSettings();
  };

  if (isLoadingPermissions) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </SafeAreaView>
    );
  }

  if (!isPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, styles.centered]}>
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconWrap}>
              <MaterialCommunityIcons name="camera-off" size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.permissionTitle}>Cámara sin acceso</Text>
            <Text style={styles.permissionBody}>
              Planty necesita acceso a tu cámara para identificar plantas. Sin este permiso, la
              identificación no estará disponible, pero puedes seguir usando el resto de la app.
            </Text>
            <ThemedButton
              label="Solicitar permisos"
              accessibilityLabel="Solicitar permisos de cámara"
              onPress={() => void requestPermissions()}
            />
            <Pressable
              accessibilityRole="button"
              onPress={handleOpenSettings}
              style={styles.settingsLink}
            >
              <Text style={styles.settingsLinkText}>Abrir configuración del sistema</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (screenState === "identifying") {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Identificando planta con IA...</Text>
        <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
      </SafeAreaView>
    );
  }

  if (screenState === "result" && result) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeader}>
            <View style={styles.resultIconWrap}>
              <MaterialCommunityIcons
                name={result.isPlant ? "leaf-circle" : "help-circle-outline"}
                size={28}
                color={result.isPlant ? colors.primary : colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.resultName}>{result.commonName}</Text>
              {result.scientificName ? (
                <Text style={styles.resultScientific}>{result.scientificName}</Text>
              ) : null}
            </View>
            <View style={[styles.confidenceBadge, !result.isPlant && styles.confidenceBadgeLow]}>
              <Text style={styles.confidenceText}>
                Confianza: {result.confidence}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descripción</Text>
            <Text style={styles.cardBody}>{result.description}</Text>
          </View>

          {result.isPlant && result.careTips.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Consejos de cuidado</Text>
              {result.careTips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            {result.isPlant && (
              <ThemedButton
                label={isSaving ? "Guardando..." : "Agregar a mi colección"}
                accessibilityLabel="Guardar planta identificada"
                onPress={() => void handleSavePlant()}
                disabled={isSaving}
                style={{ flex: 1 }}
              />
            )}
            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.7 }]}
            >
              <MaterialCommunityIcons name="camera-retake" size={18} color={colors.primary} />
              <Text style={styles.retryText}>Tomar otra foto</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flashMode}
        />
        <View style={styles.cameraTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cambiar flash"
            onPress={toggleFlash}
            style={({ pressed }) => [styles.cameraControlBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name={flashIcon} size={24} color="#fff" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotar cámara"
            onPress={toggleFacing}
            style={({ pressed }) => [styles.cameraControlBtn, pressed && { opacity: 0.7 }]}
          >
            <MaterialCommunityIcons name="camera-flip-outline" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.cameraBottomBar}>
          <Text style={styles.cameraHint}>Apunta a una planta y toma la foto</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tomar foto para identificar planta"
            onPress={() => void handleTakePhoto()}
            style={({ pressed }) => [styles.shutterBtn, pressed && styles.shutterBtnPressed]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    loadingText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
      marginTop: Spacing.md,
    },
    loadingSubtext: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      marginTop: Spacing.xs,
    },
    permissionCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.xl,
      margin: Spacing.lg,
      alignItems: "center",
      gap: Spacing.md,
    },
    permissionIconWrap: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#20352F" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
    },
    permissionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "700",
      textAlign: "center",
    },
    permissionBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      textAlign: "center",
      lineHeight: Typography.body.lineHeight + 4,
    },
    settingsLink: {
      paddingVertical: Spacing.sm,
    },
    settingsLinkText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
    cameraWrapper: {
      flex: 1,
      position: "relative",
    },
    camera: {
      flex: 1,
    },
    cameraTopBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: Spacing.sm,
      padding: Spacing.lg,
      paddingTop: Spacing.xl,
    },
    cameraControlBtn: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
    cameraBottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      gap: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    cameraHint: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    shutterBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: "#fff",
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    shutterBtnPressed: {
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    shutterInner: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: "#fff",
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
    },
    resultIconWrap: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
    },
    resultName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    resultScientific: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      fontStyle: "italic",
    },
    confidenceBadge: {
      backgroundColor: isDark ? "#1A3A2A" : "#D1FAE5",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    confidenceBadgeLow: {
      backgroundColor: isDark ? "#2C211F" : "#FEE2E2",
    },
    confidenceText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    cardTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    cardBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight + 4,
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    tipText: {
      flex: 1,
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: Typography.body.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    actionsRow: {
      gap: Spacing.sm,
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    retryText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      fontWeight: "600",
    },
  });
