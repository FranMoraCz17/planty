import { useEffect, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  tone?: "default" | "danger";
  onPress: () => void;
};

export default function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const { colors, isDark } = useAppTheme();
  const { currentUser } = useDemoData();
  const router = useRouter();
  const styles = createStyles(colors, isDark);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as never), 100);
  };

  const handleSignOut = () => {
    onClose();
    Alert.alert(
      "Cerrar sesion",
      "Tendras que volver a iniciar sesion para acceder a tu coleccion.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: () => {
            void signOut(auth);
          },
        },
      ],
    );
  };

  const items: SheetItem[] = [
    {
      key: "profile",
      icon: "account-outline",
      label: "Mi perfil",
      description: "Coleccion, sitios y estadisticas",
      onPress: () => navigate("/(app)/profile-details"),
    },
    {
      key: "edit",
      icon: "pencil-outline",
      label: "Editar cuenta",
      description: "Nombre, usuario, ciudad",
      onPress: () => navigate("/(app)/forms/user"),
    },
    {
      key: "settings",
      icon: "cog-outline",
      label: "Configuracion",
      description: "Tema, accesibilidad, permisos",
      onPress: () => navigate("/(app)/settings"),
    },
    {
      key: "privacy",
      icon: "shield-lock-outline",
      label: "Privacidad y seguridad",
      description: "Datos y permisos del sistema",
      onPress: () => navigate("/(app)/settings"),
    },
    {
      key: "about",
      icon: "information-outline",
      label: "Acerca de Planty",
      description: "Version 1.0 - Curso EIF209",
      onPress: () =>
        Alert.alert(
          "Planty",
          "Aplicacion movil para el cuidado e identificacion de plantas con IA.\n\nProyecto del curso EIF209 - Diseno e implementacion de plataformas moviles.\n\nUniversidad Nacional, Sede Regional Brunca.",
        ),
    },
    {
      key: "signout",
      icon: "logout",
      label: "Cerrar sesion",
      tone: "danger",
      onPress: handleSignOut,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        accessibilityLabel="Cerrar menu"
        onPress={onClose}
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.handle} />

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
                  name="account-outline"
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

          <View style={styles.list}>
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={item.onPress}
                style={({ pressed }) => [
                  styles.row,
                  index < items.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    item.tone === "danger" && styles.iconWrapDanger,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={
                      item.tone === "danger" ? "#DC2626" : colors.primary
                    }
                  />
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.rowLabel,
                      item.tone === "danger" && styles.rowLabelDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text style={styles.rowDescription}>{item.description}</Text>
                  ) : null}
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xl,
      gap: Spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 16,
    },
    handle: {
      alignSelf: "center",
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 6,
      marginBottom: Spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    headerAvatarImg: {
      width: "100%",
      height: "100%",
    },
    headerText: {
      flex: 1,
      gap: 2,
    },
    headerName: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 2,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight + 2,
    },
    headerEmail: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight + 2,
    },
    list: {
      gap: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
    },
    rowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.6,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#1F3430" : "#E5F3EE",
      alignItems: "center",
      justifyContent: "center",
    },
    iconWrapDanger: {
      backgroundColor: isDark ? "#3B1D1D" : "#FBE1DE",
    },
    rowText: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    rowLabelDanger: {
      color: "#DC2626",
    },
    rowDescription: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight + 2,
    },
  });
