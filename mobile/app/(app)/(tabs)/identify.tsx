import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import TopBar from "@/src/components/layout/TopBar";
import { useHideTabBar } from "@/src/hooks/useHideTabBar";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useDemoData } from "@/src/data/DemoDataProvider";
import { useCamera } from "@/src/hooks/useCamera";
import IdentifyService, {
  PlantIdentifyResult,
} from "@/src/services/identifyService";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type ScreenState = "camera" | "identifying" | "result";
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function IdentifyTab() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const { createPlant } = useDemoData();

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

  // Cuando la camara esta a pantalla completa Y con permiso, ocultamos la tab bar
  useHideTabBar(screenState === "camera" && isPermissionGranted);

  const flashIcon: IconName =
    flashMode === "on"
      ? "flash"
      : flashMode === "auto"
        ? "flash-auto"
        : "flash-off";

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
      const message =
        error instanceof Error
          ? error.message
          : "Error al identificar la planta.";
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
        wateringFrequencyLabel: result.wateringFrequency || "Cada 7 días",
        photoUri: lastPhotoUri ?? undefined,
      });
      Alert.alert(
        "Planta guardada",
        `${result.commonName} se agregó a tu colección.`,
        [
          {
            text: "Ver mis plantas",
            onPress: () => router.push("/(app)/(tabs)/my-plants"),
          },
        ],
      );
      setScreenState("camera");
      setResult(null);
      setLastPhotoUri(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la planta.";
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
      <FullScreenLoader
        text="Verificando permisos"
        colors={colors}
        isDark={isDark}
      />
    );
  }

  if (!isPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Identificar" subtitle="Permiso necesario" />
        <View style={[styles.content, styles.centered]}>
          <MaterialCommunityIcons
            name="camera-off"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.permissionBody}>
            Habilita la camara para identificar plantas.
          </Text>
          <Pressable
            onPress={() => void requestPermissions()}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>Solicitar permisos</Text>
          </Pressable>
          <Pressable onPress={handleOpenSettings} style={styles.settingsLink}>
            <Text style={styles.settingsLinkText}>
              Abrir configuracion del sistema
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === "identifying") {
    return (
      <IdentifyingLoader
        photoUri={lastPhotoUri}
        colors={colors}
        isDark={isDark}
      />
    );
  }

  if (screenState === "result" && result) {
    return (
      <SafeAreaView style={styles.container}>
        <TopBar title="Resultado" subtitle="Identificacion completa" />
        <ScrollView
          contentContainerStyle={styles.resultContent}
          showsVerticalScrollIndicator={false}
        >
          {lastPhotoUri && (
            <View style={styles.heroPhotoWrap}>
              <Image source={{ uri: lastPhotoUri }} style={styles.heroPhoto} />
              <View style={styles.heroOverlay} />
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>Identificado por IA</Text>
              </View>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="camera-retake-outline"
                size={16}
                color={colors.text}
              />
              <Text style={styles.actionBtnText}>Abrir cámara</Text>
            </Pressable>
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => [
                styles.actionBtnDanger,
                pressed && styles.actionBtnPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color={colors.error}
              />
              <Text style={styles.actionBtnTextDanger}>Eliminar</Text>
            </Pressable>
          </View>

          <View style={styles.identityCard}>
            <View style={styles.identityHeader}>
              <View style={styles.identityIconWrap}>
                <MaterialCommunityIcons
                  name={result.isPlant ? "leaf" : "help-circle-outline"}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.identityName}>{result.commonName}</Text>
                {result.scientificName ? (
                  <Text style={styles.identityScientific}>
                    {result.scientificName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.confidenceBlock}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceLabel}>
                  Confianza del análisis
                </Text>
                <Text style={styles.confidencePercent}>
                  {result.confidence}%
                </Text>
              </View>
              <ConfidenceBar
                value={result.confidence}
                colors={colors}
                isDark={isDark}
              />
            </View>

            {(result.family || result.origin) && (
              <View style={styles.metaRow}>
                {result.family && (
                  <MetaChip
                    icon="dna"
                    label={result.family}
                    colors={colors}
                    isDark={isDark}
                  />
                )}
                {result.origin && (
                  <MetaChip
                    icon="earth"
                    label={result.origin}
                    colors={colors}
                    isDark={isDark}
                  />
                )}
              </View>
            )}

            {result.description ? (
              <Text style={styles.description}>{result.description}</Text>
            ) : null}
          </View>

          {result.isPlant && (
            <>
              <View style={styles.statsGrid}>
                <StatCard
                  icon="water-outline"
                  iconColor={colors.accentCool}
                  label="Riego"
                  value={result.wateringFrequency || "—"}
                  detail={result.wateringDetail}
                  colors={colors}
                  isDark={isDark}
                />
                <StatCard
                  icon="white-balance-sunny"
                  iconColor={colors.accentWarm}
                  label="Luz"
                  value={result.light || "—"}
                  detail={result.lightDetail}
                  colors={colors}
                  isDark={isDark}
                />
                <StatCard
                  icon="thermometer"
                  iconColor={colors.error}
                  label="Temperatura"
                  value={result.temperature || "—"}
                  colors={colors}
                  isDark={isDark}
                />
                <StatCard
                  icon="water-percent"
                  iconColor={colors.accentLavender}
                  label="Humedad"
                  value={result.humidity || "—"}
                  colors={colors}
                  isDark={isDark}
                />
              </View>

              <View style={styles.tagsRow}>
                <Tag
                  icon="speedometer"
                  label={`Dificultad: ${result.difficulty}`}
                  tone="neutral"
                  colors={colors}
                  isDark={isDark}
                />
                <Tag
                  icon={
                    result.toxicity === "no tóxica" ? "shield-check" : "alert"
                  }
                  label={
                    result.toxicity === "no tóxica" ? "No tóxica" : `Tóxica`
                  }
                  tone={result.toxicity === "no tóxica" ? "success" : "warning"}
                  colors={colors}
                  isDark={isDark}
                />
              </View>

              {result.toxicityDetail && (
                <View style={styles.warningCard}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={colors.accentWarm}
                  />
                  <Text style={styles.warningText}>
                    {result.toxicityDetail}
                  </Text>
                </View>
              )}

              {result.soil ? (
                <SectionRow
                  icon="layers-triple-outline"
                  iconColor={colors.primary}
                  title="Sustrato recomendado"
                  body={result.soil}
                  colors={colors}
                  isDark={isDark}
                />
              ) : null}

              {result.careTips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Consejos de cuidado</Text>
                  <View style={styles.tipsList}>
                    {result.careTips.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <View style={styles.tipNumber}>
                          <Text style={styles.tipNumberText}>{i + 1}</Text>
                        </View>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {result.commonPests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Plagas comunes</Text>
                  <View style={styles.pestsRow}>
                    {result.commonPests.map((pest, i) => (
                      <View key={i} style={styles.pestChip}>
                        <MaterialCommunityIcons
                          name="bug-outline"
                          size={12}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.pestText}>{pest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {result.funFact && (
                <View style={styles.funFactCard}>
                  <View style={styles.funFactHeader}>
                    <MaterialCommunityIcons
                      name="lightbulb-on-outline"
                      size={16}
                      color={colors.accentWarm}
                    />
                    <Text style={styles.funFactLabel}>Dato curioso</Text>
                  </View>
                  <Text style={styles.funFactText}>{result.funFact}</Text>
                </View>
              )}

              <Pressable
                onPress={() => void handleSavePlant()}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed,
                  isSaving && styles.saveBtnDisabled,
                ]}
              >
                <MaterialCommunityIcons
                  name="bookmark-plus-outline"
                  size={20}
                  color={colors.onPrimary}
                />
                <Text style={styles.saveBtnText}>
                  {isSaving ? "Guardando..." : "Guardar en Mis Plantas"}
                </Text>
              </Pressable>
            </>
          )}
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
            onPress={toggleFlash}
            style={({ pressed }) => [
              styles.cameraControlBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons name={flashIcon} size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={toggleFacing}
            style={({ pressed }) => [
              styles.cameraControlBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialCommunityIcons
              name="camera-flip-outline"
              size={22}
              color="#fff"
            />
          </Pressable>
        </View>

        <View style={styles.cameraBottomBar}>
          <View style={styles.cameraHintWrap}>
            <View style={styles.cameraHintDot} />
            <Text style={styles.cameraHint}>
              Apunta a una planta y toma la foto
            </Text>
          </View>
          <Pressable
            onPress={() => void handleTakePhoto()}
            style={({ pressed }) => [
              styles.shutterBtn,
              pressed && styles.shutterBtnPressed,
            ]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ConfidenceBar({
  value,
  colors,
  isDark,
}: {
  value: number;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(100, value)), {
      duration: 900,
    });
  }, [value, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      style={[
        barStyles.track,
        { backgroundColor: isDark ? "#1F1F1F" : "#E4E4E7" },
      ]}
    >
      <Animated.View
        style={[
          barStyles.fill,
          { backgroundColor: colors.primary },
          animatedStyle,
        ]}
      />
    </View>
  );
}

function StatCard({
  icon,
  iconColor,
  label,
  value,
  detail,
  colors,
  isDark,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
  detail?: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.statCard}>
      <View style={[s.statIconWrap, { backgroundColor: iconColor + "22" }]}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue} numberOfLines={2}>
        {value}
      </Text>
      {detail ? (
        <Text style={s.statDetail} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

function MetaChip({
  icon,
  label,
  colors,
  isDark,
}: {
  icon: IconName;
  label: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.metaChip}>
      <MaterialCommunityIcons
        name={icon}
        size={12}
        color={colors.textSecondary}
      />
      <Text style={s.metaChipText}>{label}</Text>
    </View>
  );
}

function Tag({
  icon,
  label,
  tone,
  colors,
  isDark,
}: {
  icon: IconName;
  label: string;
  tone: "success" | "warning" | "neutral";
  colors: ThemeColors;
  isDark: boolean;
}) {
  const toneColor =
    tone === "success"
      ? colors.primary
      : tone === "warning"
        ? colors.error
        : colors.textSecondary;
  const bgColor =
    tone === "success"
      ? isDark
        ? "#143018"
        : "#DCFCE7"
      : tone === "warning"
        ? isDark
          ? "#3A1414"
          : "#FEE2E2"
        : isDark
          ? "#1F1F1F"
          : "#F4F4F5";

  return (
    <View style={[tagStyles.tag, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={icon} size={12} color={toneColor} />
      <Text style={[tagStyles.tagText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

function SectionRow({
  icon,
  iconColor,
  title,
  body,
  colors,
  isDark,
}: {
  icon: IconName;
  iconColor: string;
  title: string;
  body: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  return (
    <View style={s.sectionRow}>
      <View style={[s.sectionRowIcon, { backgroundColor: iconColor + "22" }]}>
        <MaterialCommunityIcons name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionRowTitle}>{title}</Text>
        <Text style={s.sectionRowBody}>{body}</Text>
      </View>
    </View>
  );
}

function FullScreenLoader({
  text,
  colors,
  isDark,
}: {
  text: string;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <SafeAreaView style={[s.container, s.centered]}>
      <Animated.View style={[s.loaderPulse, animatedStyle]}>
        <MaterialCommunityIcons name="leaf" size={28} color={colors.primary} />
      </Animated.View>
      <Text style={s.loaderText}>{text}</Text>
    </SafeAreaView>
  );
}

const LOADER_MESSAGES = [
  {
    title: "Procesando imagen",
    subtitle: "Optimizando la fotografía antes de enviarla al modelo.",
  },
  {
    title: "Conectando con Gemini",
    subtitle: "Despertando el servidor y abriendo conexión con la IA.",
  },
  {
    title: "Analizando hojas y forma",
    subtitle: "El modelo está extrayendo características visuales.",
  },
  {
    title: "Buscando coincidencias",
    subtitle: "Comparando con miles de especies en el catálogo botánico.",
  },
  {
    title: "Generando recomendaciones",
    subtitle: "Preparando consejos de cuidado personalizados para ti.",
  },
];

function IdentifyingLoader({
  photoUri,
  colors,
  isDark,
}: {
  photoUri: string | null;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const s = createStyles(colors, isDark);
  const scanY = useSharedValue(0);
  const dotOpacity = useSharedValue(0.3);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 }),
      ),
      -1,
      false,
    );
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 }),
      ),
      -1,
      false,
    );
  }, [scanY, dotOpacity]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADER_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanY.value * 95}%`,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const message = LOADER_MESSAGES[messageIndex];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.identifyingContent}>
        <View style={s.identifyingPhotoWrap}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={s.identifyingPhoto} />
          )}
          <View style={s.identifyingScanOverlay} />
          <Animated.View
            style={[
              s.identifyingScanLine,
              scanStyle,
              { backgroundColor: colors.primary },
            ]}
          />
          <View
            style={[
              s.identifyingCorner,
              s.cornerTL,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              s.identifyingCorner,
              s.cornerTR,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              s.identifyingCorner,
              s.cornerBL,
              { borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              s.identifyingCorner,
              s.cornerBR,
              { borderColor: colors.primary },
            ]}
          />
        </View>

        <View style={s.identifyingTextWrap}>
          <View style={s.identifyingStatus}>
            <Animated.View
              style={[
                s.identifyingDot,
                dotStyle,
                { backgroundColor: colors.primary },
              ]}
            />
            <Text style={s.identifyingStatusText}>Analizando con IA</Text>
          </View>
          <Text style={s.identifyingTitle}>{message.title}</Text>
          <Text style={s.identifyingSubtitle}>{message.subtitle}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});

const tagStyles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontFamily: Typography.family,
    fontSize: 11,
    fontWeight: "700",
  },
});

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
    resultContent: {
      paddingBottom: Spacing.xxl,
      gap: Spacing.md,
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
      backgroundColor: isDark ? "#1F1F1F" : "#F4F4F5",
      alignItems: "center",
      justifyContent: "center",
    },
    permissionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.subtitle.fontSize,
      fontWeight: "700",
      textAlign: "center",
    },
    permissionBody: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      textAlign: "center",
      lineHeight: 22,
    },
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      alignItems: "center",
      width: "100%",
    },
    primaryBtnPressed: {
      opacity: 0.85,
    },
    primaryBtnText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 15,
      fontWeight: "700",
    },
    settingsLink: {
      paddingVertical: Spacing.sm,
    },
    settingsLinkText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    cameraWrapper: {
      flex: 1,
      position: "relative",
      backgroundColor: "#000",
    },
    camera: {
      flex: 1,
    },
    cameraTopBar: {
      position: "absolute",
      top: Spacing.lg,
      right: Spacing.lg,
      flexDirection: "row",
      gap: Spacing.sm,
    },
    cameraControlBtn: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      backgroundColor: "rgba(0,0,0,0.55)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
    },
    cameraBottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      gap: Spacing.lg,
      paddingBottom: Spacing.xxl + 8,
    },
    cameraHintWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
    },
    cameraHintDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    cameraHint: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "600",
    },
    shutterBtn: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 4,
      borderColor: "#fff",
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    shutterBtnPressed: {
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    shutterInner: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#fff",
    },
    heroPhotoWrap: {
      width: "100%",
      height: 280,
      backgroundColor: "#000",
      position: "relative",
    },
    heroPhoto: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(10,10,10,0.35)" : "rgba(0,0,0,0.18)",
    },
    heroBadge: {
      position: "absolute",
      top: Spacing.lg,
      left: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.65)",
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: "rgba(163,230,53,0.35)",
    },
    heroBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    heroBadgeText: {
      color: "#fff",
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    actionsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      marginTop: -28,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingVertical: 11,
    },
    actionBtnDanger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: isDark ? "#3A1414" : "#FECACA",
      borderRadius: BorderRadius.md,
      paddingVertical: 11,
    },
    actionBtnPressed: {
      opacity: 0.7,
    },
    actionBtnText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "600",
    },
    actionBtnTextDanger: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: 13,
      fontWeight: "600",
    },
    identityCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    identityHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    identityIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    identityName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    identityScientific: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 13,
      fontStyle: "italic",
      marginTop: 2,
    },
    confidenceBlock: {
      gap: 8,
    },
    confidenceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    confidenceLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    confidencePercent: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 16,
      fontWeight: "800",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "#1F1F1F" : "#F4F4F5",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    metaChipText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },
    description: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 14,
      lineHeight: 21,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.lg,
    },
    statCard: {
      width: "48%",
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      gap: 4,
    },
    statIconWrap: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    statLabel: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    statValue: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
    statDetail: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: Spacing.lg,
    },
    warningCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      backgroundColor: isDark ? "#241D0E" : "#FEF3C7",
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: isDark ? "#3F3315" : "#FDE68A",
      padding: Spacing.md,
    },
    warningText: {
      flex: 1,
      color: isDark ? "#FBBF24" : "#92400E",
      fontFamily: Typography.family,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "500",
    },
    sectionRow: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    sectionRowIcon: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionRowTitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    sectionRowBody: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      lineHeight: 19,
    },
    section: {
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 15,
      fontWeight: "700",
    },
    tipsList: {
      gap: Spacing.sm,
    },
    tipRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    tipNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    tipNumberText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "800",
    },
    tipText: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      lineHeight: 19,
    },
    pestsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    pestChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: isDark ? "#1F1F1F" : "#F4F4F5",
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pestText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "600",
    },
    funFactCard: {
      marginHorizontal: Spacing.lg,
      backgroundColor: isDark ? "#1A1A0F" : "#FEF9C3",
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: isDark ? "#3F3315" : "#FDE68A",
      padding: Spacing.md,
      gap: 6,
    },
    funFactHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    funFactLabel: {
      color: colors.accentWarm,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    funFactText: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 13,
      lineHeight: 19,
      fontStyle: "italic",
    },
    saveBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: Spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md + 2,
      marginTop: Spacing.sm,
    },
    saveBtnPressed: {
      opacity: 0.85,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: colors.onPrimary,
      fontFamily: Typography.family,
      fontSize: 15,
      fontWeight: "800",
    },
    loaderPulse: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: isDark ? "#143018" : "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    loaderText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "600",
    },
    identifyingContent: {
      flex: 1,
      padding: Spacing.lg,
      gap: Spacing.xl,
      justifyContent: "center",
    },
    identifyingPhotoWrap: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      backgroundColor: "#000",
      position: "relative",
    },
    identifyingPhoto: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    identifyingScanOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    identifyingScanLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    identifyingCorner: {
      position: "absolute",
      width: 24,
      height: 24,
      borderColor: colors.primary,
    },
    cornerTL: {
      top: 12,
      left: 12,
      borderTopWidth: 3,
      borderLeftWidth: 3,
      borderTopLeftRadius: 6,
    },
    cornerTR: {
      top: 12,
      right: 12,
      borderTopWidth: 3,
      borderRightWidth: 3,
      borderTopRightRadius: 6,
    },
    cornerBL: {
      bottom: 12,
      left: 12,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
      borderBottomLeftRadius: 6,
    },
    cornerBR: {
      bottom: 12,
      right: 12,
      borderBottomWidth: 3,
      borderRightWidth: 3,
      borderBottomRightRadius: 6,
    },
    identifyingTextWrap: {
      gap: 6,
    },
    identifyingStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    identifyingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    identifyingStatusText: {
      color: colors.primary,
      fontFamily: Typography.family,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    identifyingTitle: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    identifyingSubtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: 14,
      lineHeight: 21,
    },
  });
