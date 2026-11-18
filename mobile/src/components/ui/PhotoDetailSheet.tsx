import { type ReactNode, useEffect, useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import GlassIconButton from "./GlassIconButton";
import GlassSheetBackground from "./GlassSheetBackground";
import ImageBleedFade from "./ImageBleedFade";
import { Spacing, type ThemeColors } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface PhotoDetailSheetProps {
  // Foto protagonista a sangre.
  photoUri?: string | null;
  // Foto de respaldo (ej: Wikipedia) si la principal falla al cargar.
  fallbackUri?: string | null;
  placeholderIcon?: IconName;
  // Icono del botón de cierre (chevron-left para rutas, close para modales).
  closeIcon?: IconName;
  // Si se omite, no se muestra botón de cierre (útil en tabs raíz como Perfil).
  onClose?: () => void;
  // Botones de cristal extra en la esquina superior derecha.
  actions?: ReactNode;
  // Posiciones de la hoja arrastrable.
  snapPoints?: (string | number)[];
  // Contenido dentro de la hoja de cristal.
  children: ReactNode;
}

export default function PhotoDetailSheet({
  photoUri,
  fallbackUri,
  placeholderIcon = "leaf",
  closeIcon = "chevron-left",
  onClose,
  actions,
  snapPoints,
  children,
}: PhotoDetailSheetProps) {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, isDark);
  const points = useMemo(() => snapPoints ?? ["48%", "92%"], [snapPoints]);

  // Cascada de fuentes de foto: probamos en orden y avanzamos al fallar.
  const candidates = useMemo(
    () => [photoUri, fallbackUri].filter((u): u is string => !!u),
    [photoUri, fallbackUri],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  useEffect(() => setSourceIndex(0), [candidates]);
  const activeUri = candidates[sourceIndex] ?? null;

  // Dentro de un Modal de RN los insets pueden venir en 0; garantizamos un
  // mínimo para que el botón de cierre no se solape con el status bar.
  const topPadding = Math.max(insets.top, 52);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Foto de fondo a pantalla completa */}
      {activeUri ? (
        <>
          <Image
            source={{ uri: activeUri }}
            style={styles.bg}
            onError={() => setSourceIndex((i) => i + 1)}
          />
          <ImageBleedFade
            uri={activeUri}
            fadeColor={colors.surface}
            style={styles.bleed}
          />
        </>
      ) : (
        <View style={[styles.bg, styles.bgPlaceholder]}>
          <MaterialCommunityIcons
            name={placeholderIcon}
            size={84}
            color={colors.onPrimary}
          />
        </View>
      )}
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        locations={[0, 0.35]}
        style={styles.scrim}
        pointerEvents="none"
      />

      {/* Botones flotantes de cristal */}
      <View
        style={[styles.topBar, { paddingTop: topPadding }]}
        pointerEvents="box-none"
      >
        {onClose ? (
          <GlassIconButton
            icon={closeIcon}
            accessibilityLabel="Cerrar"
            onPress={onClose}
          />
        ) : (
          <View style={styles.spacer} />
        )}
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>

      {/* Hoja de cristal arrastrable */}
      <BottomSheet
        snapPoints={points}
        index={0}
        handleIndicatorStyle={styles.handle}
        enableDynamicSizing={false}
        backgroundComponent={(props) => (
          <GlassSheetBackground {...props} isDark={isDark} />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.surface },
    bg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "70%",
      resizeMode: "cover",
    },
    bgPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    bleed: {
      top: "65%",
      bottom: 0,
    },
    scrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 140,
      zIndex: 1,
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      zIndex: 3,
    },
    actions: { flexDirection: "row", gap: Spacing.sm },
    spacer: { width: 40, height: 40 },
    handle: {
      backgroundColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
      width: 40,
      height: 5,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      // Holgura inferior para librar la tab bar flotante cuando la hoja se usa
      // en una tab raíz (Perfil); inofensivo en rutas/modales.
      paddingBottom: 110,
      gap: Spacing.md,
    },
  });
