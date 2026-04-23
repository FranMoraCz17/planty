import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type NoticeVariant = "success" | "error" | "warning" | "info";

interface FormNoticeProps {
  title: string;
  message: string;
  variant: NoticeVariant;
  onDismiss?: () => void;
}

const variantMap = {
  success: {
    icon: "check-circle-outline",
    tintLight: "#DDF4E6",
    tintDark: "#1B3527",
  },
  error: {
    icon: "alert-circle-outline",
    tintLight: "#FBE1DE",
    tintDark: "#3B201D",
  },
  warning: {
    icon: "alert-outline",
    tintLight: "#FFF0D7",
    tintDark: "#3B2A1A",
  },
  info: {
    icon: "information-outline",
    tintLight: "#DDEFF6",
    tintDark: "#17303B",
  },
} as const;

export default function FormNotice({
  title,
  message,
  variant,
  onDismiss,
}: FormNoticeProps) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const config = variantMap[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? config.tintDark : config.tintLight },
      ]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={config.icon} size={20} color={colors.text} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityLabel="Cerrar notificacion"
          accessibilityRole="button"
          onPress={onDismiss}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.full,
      backgroundColor: isDark ? "#233A34" : colors.surfaceCard,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "700",
      lineHeight: Typography.body.lineHeight,
    },
    message: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.body.lineHeight,
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonPressed: {
      backgroundColor: isDark ? "#22332F" : "#EEF7F3",
    },
  });
