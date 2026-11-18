import { useCallback } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Image, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/firebaseConfig";
import { useDemoData } from "@/src/data/DemoDataProvider";
import GlassSheetBackground from "@/src/components/ui/GlassSheetBackground";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface AccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

type SheetItem = {
  key: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  description?: string;
  color: string;
  onPress: () => void;
};

export default function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { currentUser } = useDemoData();
  const router = useRouter();
  const styles = createStyles(colors, isDark);

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as never), 120);
  };

  const handleSignOut = () => {
    onClose();
    setTimeout(() => {
      Alert.alert(
        "Cerrar sesión",
        "Tendrás que volver a iniciar sesión para acceder a tu colección.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: () => void signOut(auth) },
        ],
      );
    }, 200);
  };

  const items: SheetItem[] = [
    {
      key: "profile",
      icon: "account-outline",
      label: "Mi perfil",
      description: "Colección, sitios y estadísticas",
      color: colors.primary,
      onPress: () => navigate("/(app)/(tabs)/profile"),
    },
    {
      key: "chat",
      icon: "message-text-outline",
      label: "Mensajería",
      description: "Chat de la comunidad en tiempo real",
      color: colors.accentCool,
      onPress: () => navigate("/(app)/chat"),
    },
    {
      key: "favorites",
      icon: "heart-outline",
      label: "Notas favoritas",
      description: "Datos curiosos guardados",
      color: colors.error,
      onPress: () => navigate("/(app)/favorites"),
    },
    {
      key: "settings",
      icon: "cog-outline",
      label: "Configuración",
      description: "Cuenta, accesibilidad, permisos",
      color: colors.textSecondary,
      onPress: () => navigate("/(app)/settings"),
    },
  ];

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <BottomSheet
          index={0}
          enableDynamicSizing
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={renderBackdrop}
          backgroundComponent={(props) => (
            <GlassSheetBackground {...props} isDark={isDark} />
          )}
          handleIndicatorStyle={styles.handle}
        >
          <BottomSheetView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerAvatar}>
                {currentUser?.avatarUrl ? (
                  <Image
                    source={{ uri: currentUser.avatarUrl }}
                    style={styles.headerAvatarImg}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="account"
                    size={26}
                    color={colors.onPrimary}
                  />
                )}
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {currentUser?.name ?? "Tu cuenta"}
                </Text>
                <Text style={styles.headerEmail} numberOfLines={1}>
                  {currentUser?.email ?? ""}
                </Text>
              </View>
            </View>

            {/* Grupo principal */}
            <View style={styles.card}>
              {items.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={[styles.iconSquircle, { backgroundColor: item.color + "1C" }]}>
                    <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {item.description ? (
                      <Text style={styles.rowDescription}>{item.description}</Text>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <View style={styles.divider} />
                </Pressable>
              ))}

              {/* Toggle de modo oscuro, integrado en el mismo grupo */}
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconSquircle,
                    { backgroundColor: colors.accentCool + "1C" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isDark ? "weather-night" : "weather-sunny"}
                    size={18}
                    color={colors.accentCool}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>Modo oscuro</Text>
                  <Text style={styles.rowDescription}>
                    {isDark ? "Activado" : "Desactivado"}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Cerrar sesión */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={handleSignOut}
              style={({ pressed }) => [styles.signoutCard, pressed && { opacity: 0.75 }]}
            >
              <MaterialCommunityIcons name="logout" size={16} color={colors.error} />
              <Text style={styles.signoutText}>Cerrar sesión</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    handle: {
      backgroundColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
      width: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    headerAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    headerAvatarImg: { width: "100%", height: "100%" },
    headerText: { flex: 1, gap: 2 },
    headerName: {
      color: colors.text,
      fontFamily: Typography.serif,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    headerEmail: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
    },
    card: {
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.4)",
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: 11,
      paddingHorizontal: Spacing.md,
      position: "relative",
    },
    rowPressed: { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)" },
    divider: {
      position: "absolute",
      left: Spacing.md + 34 + Spacing.md,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    iconSquircle: {
      width: 34,
      height: 34,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: { flex: 1, gap: 1 },
    rowLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    rowDescription: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
    },
    signoutCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(225,120,107,0.4)" : "rgba(166,58,46,0.3)",
      backgroundColor: isDark ? "rgba(225,120,107,0.08)" : "rgba(166,58,46,0.05)",
    },
    signoutText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: 14,
      fontWeight: "700",
    },
  });
