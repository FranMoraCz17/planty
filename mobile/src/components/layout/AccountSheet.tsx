import { useCallback, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase/firebaseConfig";
import { useDemoData } from "@/src/data/DemoDataProvider";
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
  const { colors, isDark } = useAppTheme();
  const { currentUser } = useDemoData();
  const router = useRouter();
  const styles = createStyles(colors, isDark);
  const sheetRef = useRef<BottomSheet>(null);

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
      icon: "account",
      label: "Mi perfil",
      description: "Colección, sitios y estadísticas",
      color: colors.primary,
      onPress: () => navigate("/(app)/profile-details"),
    },
    {
      key: "chat",
      icon: "message-text",
      label: "Mensajería",
      description: "Chat de la comunidad en tiempo real",
      color: "#3B82F6",
      onPress: () => navigate("/(app)/chat"),
    },
    {
      key: "edit",
      icon: "pencil",
      label: "Editar cuenta",
      description: "Nombre, usuario, ciudad",
      color: "#A855F7",
      onPress: () => navigate("/(app)/forms/user"),
    },
    {
      key: "settings",
      icon: "cog",
      label: "Configuración",
      description: "Tema, accesibilidad, permisos",
      color: "#6B7280",
      onPress: () => navigate("/(app)/settings"),
    },
    {
      key: "privacy",
      icon: "lock",
      label: "Privacidad y seguridad",
      description: "Datos y permisos del sistema",
      color: "#0EA5E9",
      onPress: () => navigate("/(app)/settings"),
    },
    {
      key: "about",
      icon: "information",
      label: "Acerca de Planty",
      description: "Versión 1.0",
      color: "#64748B",
      onPress: () =>
        Alert.alert(
          "Planty",
          "franmorac17"
        ),
    },
  ];

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
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
          ref={sheetRef}
          index={0}
          enableDynamicSizing
          enablePanDownToClose
          onClose={onClose}
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.border, width: 42 }}
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

            {/* Grupo principal (estilo iOS) */}
            <View style={styles.card}>
              {items.map((item, index) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={[styles.iconSquircle, { backgroundColor: item.color }]}>
                    <MaterialCommunityIcons name={item.icon} size={17} color="#fff" />
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
                  {index < items.length - 1 ? <View style={styles.divider} /> : null}
                </Pressable>
              ))}
            </View>

            {/* Cerrar sesión */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={handleSignOut}
              style={({ pressed }) => [styles.signoutCard, pressed && styles.rowPressed]}
            >
              <View style={[styles.iconSquircle, { backgroundColor: "#DC2626" }]}>
                <MaterialCommunityIcons name="logout" size={17} color="#fff" />
              </View>
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
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
    rowPressed: { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" },
    divider: {
      position: "absolute",
      left: Spacing.md + 30 + Spacing.md,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    iconSquircle: {
      width: 30,
      height: 30,
      borderRadius: 7,
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
      gap: Spacing.md,
      backgroundColor: colors.surfaceCard,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: 11,
      paddingHorizontal: Spacing.md,
    },
    signoutText: {
      color: "#DC2626",
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
    },
  });
