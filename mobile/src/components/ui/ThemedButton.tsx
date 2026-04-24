import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  BorderRadius,
  Spacing,
  Typography,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function ThemedButton({
  label,
  onPress,
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
}: ThemedButtonProps) {
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>["colors"]) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      backgroundColor: colors.pressed,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled,
    },
    buttonText: {
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
      color: colors.onPrimary,
      lineHeight: Typography.body.lineHeight,
      textAlign: "center",
    },
    buttonTextDisabled: {
      color: colors.surfaceCard,
    },
  });
