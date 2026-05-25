import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView } from "expo-camera";
import TopBar from "@/src/components/layout/TopBar";
import { useCamera } from "@/src/hooks/useCamera";
import { useHideTabBar } from "@/src/hooks/useHideTabBar";
import DiagnoseService, {
  type DiagnoseHealthStatus,
  type DiagnoseIssueCategory,
  type DiagnoseIssueSeverity,
  type DiagnoseResult,
} from "@/src/services/diagnoseService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type ScreenState = "intro" | "camera" | "loading" | "result";

const HEALTH_TONE: Record<
  DiagnoseHealthStatus,
  { bg: string; bgDark: string; fg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }
> = {
  saludable: {
    bg: "#DDF4E6",
    bgDark: "#1B3527",
    fg: "#15803D",
    icon: "check-circle-outline",
  },
  atencion: {
    bg: "#FFF0D7",
    bgDark: "#3B2A1A",
    fg: "#B45309",
    icon: "alert-outline",
  },
  enferma: {
    bg: "#FBE1DE",
    bgDark: "#3B201D",
    fg: "#B91C1C",
    icon: "alert-circle-outline",
  },
  critica: {
    bg: "#FBE1DE",
    bgDark: "#3B1418",
    fg: "#7F1D1D",
    icon: "alert-octagon-outline",
  },
};

const SEVERITY_LABEL: Record<DiagnoseIssueSeverity, string> = {
  baja: "Leve",
  media: "Moderada",
  alta: "Severa",
};

const CATEGORY_LABEL: Record<DiagnoseIssueCategory, string> = {
  plaga: "Plaga",
  enfermedad: "Enfermedad",
  deficiencia: "Deficiencia",
  exceso: "Exceso",
  ambiental: "Ambiental",
};

const CATEGORY_ICON: Record<
  DiagnoseIssueCategory,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  plaga: "bug-outline",
  enfermedad: "virus-outline",
  deficiencia: "minus-circle-outline",
  exceso: "water-alert-outline",
  ambiental: "weather-cloudy",
};

export default function DiagnoseScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const {
    cameraRef,
    permissions,
    isPermissionGranted,
    isLoadingPermissions,
    takePhoto,
    requestPermissions,
  } = useCamera({ requestOnMount: false });

  const [screenState, setScreenState] = useState<ScreenState>("intro");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnoseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useHideTabBar(screenState === "camera");

  const openCamera = async () => {
    setError(null);
    if (!isPermissionGranted) {
      await requestPermissions();
    }
    setScreenState("camera");
  };

  const handleCapture = async () => {
    try {
      const photo = await takePhoto({ quality: 0.75 });
      if (!photo) return;
      setPhotoUri(photo.uri);
      setScreenState("loading");

      const diagnosed = await DiagnoseService.diagnoseFromUri(photo.uri);
      setResult(diagnosed);
      setScreenState("result");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar el diagnostico.",
      );
      setScreenState("intro");
    }
  };

  const reset = () => {
    setPhotoUri(null);
    setResult(null);
    setError(null);
    setScreenState("intro");
  };

  // CARGA DE PERMISOS
  if (isLoadingPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Diagnostico" subtitle="Salud por foto" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // PERMISO DENEGADO
  if (screenState === "camera" && permissions && !isPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Diagnostico" subtitle="Permiso necesario" />
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="camera-off-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            Habilita el acceso a la camara desde la configuracion del sistema.
          </Text>
          <Pressable
            onPress={() => void Linking.openSettings()}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
          >
            <Text style={styles.linkBtnText}>Abrir configuracion</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // CAMARA
  if (screenState === "camera" && isPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView ref={cameraRef} style={styles.fullCamera} facing="back">
          <View style={styles.cameraOverlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={reset}
              style={styles.cameraCloseBtn}
            >
              <MaterialCommunityIcons name="close" size={22} color="#FFFFFF" />
            </Pressable>

            <View style={styles.cameraBottom}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tomar foto"
                onPress={() => void handleCapture()}
                style={styles.shutter}
              >
                <View style={styles.shutterInner} />
              </Pressable>
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // LOADING
  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Diagnostico" subtitle="Analizando" />
        <View style={styles.centered}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : null}
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // RESULTADO
  if (screenState === "result" && result) {
    const tone = HEALTH_TONE[result.healthStatus];
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Diagnostico" subtitle="Resultado" />
        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.resultImage} />
          ) : null}

          <View
            style={[
              styles.healthCard,
              { backgroundColor: isDark ? tone.bgDark : tone.bg },
            ]}
          >
            <View style={styles.healthHeader}>
              <MaterialCommunityIcons
                name={tone.icon}
                size={26}
                color={tone.fg}
              />
              <View style={styles.healthHeaderText}>
                <Text style={[styles.healthLabel, { color: tone.fg }]}>
                  {result.healthLabel}
                </Text>
                <Text style={styles.healthConfidence}>
                  Confianza {result.overallConfidence}%
                </Text>
              </View>
            </View>
            <Text style={styles.healthSummary}>{result.healthSummary}</Text>
          </View>

          {result.issues.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Problemas detectados</Text>
              {result.issues.map((issue, idx) => (
                <View key={`${issue.name}-${idx}`} style={styles.issueCard}>
                  <View style={styles.issueHeader}>
                    <View style={styles.issueIcon}>
                      <MaterialCommunityIcons
                        name={CATEGORY_ICON[issue.category]}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.issueHeaderText}>
                      <Text style={styles.issueName}>{issue.name}</Text>
                      <View style={styles.issueMeta}>
                        <Text style={styles.issueMetaText}>
                          {CATEGORY_LABEL[issue.category]}
                        </Text>
                        <Text style={styles.metaDot}>-</Text>
                        <Text style={styles.issueMetaText}>
                          {SEVERITY_LABEL[issue.severity]}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.issueDescription}>
                    {issue.description}
                  </Text>
                  <View style={styles.issueTreatmentBlock}>
                    <Text style={styles.issueTreatmentLabel}>Tratamiento</Text>
                    <Text style={styles.issueTreatmentText}>
                      {issue.treatment}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {result.immediateActions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acciones inmediatas</Text>
              <View style={styles.listCard}>
                {result.immediateActions.map((action, idx) => (
                  <View key={`act-${idx}`} style={styles.listItem}>
                    <MaterialCommunityIcons
                      name="check-circle-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.listItemText}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {result.preventiveTips.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prevencion</Text>
              <View style={styles.listCard}>
                {result.preventiveTips.map((tip, idx) => (
                  <View key={`tip-${idx}`} style={styles.listItem}>
                    <MaterialCommunityIcons
                      name="shield-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.listItemText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {result.estimatedRecovery ? (
            <View style={styles.recoveryCard}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={colors.primary}
              />
              <View style={styles.recoveryText}>
                <Text style={styles.recoveryLabel}>Recuperacion estimada</Text>
                <Text style={styles.recoveryValue}>
                  {result.estimatedRecovery}
                </Text>
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={reset}
            style={({ pressed }) => [styles.linkBtn, pressed && styles.pressed]}
          >
            <Text style={styles.linkBtnText}>Hacer otro diagnostico</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // INTRO MINIMAL + FAB
  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Diagnostico" subtitle="Salud por foto" />
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons
            name="stethoscope"
            size={48}
            color={colors.textSecondary}
          />
        </View>
        <Text style={styles.emptyText}>Toma una foto para empezar.</Text>
        {error ? <Text style={styles.errorInline}>{error}</Text> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir camara para diagnosticar"
        onPress={() => void openCamera()}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <MaterialCommunityIcons name="camera" size={24} color={colors.onPrimary} />
      </Pressable>
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      gap: Spacing.md,
    },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      maxWidth: 280,
    },
    errorInline: {
      color: isDark ? "#FECACA" : "#B91C1C",
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      textAlign: "center",
      marginTop: Spacing.sm,
    },
    fab: {
      position: "absolute",
      right: Spacing.lg,
      bottom: 100,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    fabPressed: {
      opacity: 0.85,
    },
    pressed: {
      opacity: 0.6,
    },
    linkBtn: {
      paddingVertical: 12,
      alignItems: "center",
    },
    linkBtnText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    fullCamera: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      justifyContent: "space-between",
      padding: Spacing.lg,
    },
    cameraCloseBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
    },
    cameraBottom: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    shutter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: "#FFFFFF",
    },
    shutterInner: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: "#FFFFFF",
    },
    previewImage: {
      width: 140,
      height: 140,
      borderRadius: BorderRadius.lg,
    },
    resultContent: {
      padding: Spacing.lg,
      paddingBottom: 140,
      gap: Spacing.md,
    },
    resultImage: {
      width: "100%",
      height: 200,
      borderRadius: BorderRadius.lg,
    },
    healthCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    healthHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    healthHeaderText: {
      flex: 1,
      gap: 2,
    },
    healthLabel: {
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "800",
    },
    healthConfidence: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
    },
    healthSummary: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      lineHeight: Typography.body.lineHeight + 2,
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
    issueCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    issueHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    issueIcon: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
    },
    issueHeaderText: {
      flex: 1,
      gap: 2,
    },
    issueName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
    issueMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    issueMetaText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "600",
    },
    metaDot: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
    },
    issueDescription: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: Typography.body.lineHeight,
    },
    issueTreatmentBlock: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      gap: 2,
    },
    issueTreatmentLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    issueTreatmentText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: Typography.body.lineHeight,
    },
    listCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    listItemText: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize - 1,
      lineHeight: Typography.body.lineHeight,
    },
    recoveryCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    recoveryText: {
      flex: 1,
      gap: 2,
    },
    recoveryLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    recoveryValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
  });
