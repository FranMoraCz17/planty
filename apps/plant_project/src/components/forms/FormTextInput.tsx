import React, { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface FormTextInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  helperText?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  leadingIcon?: MaterialIconName;
}

export default function FormTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  helperText,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  leadingIcon,
}: FormTextInputProps<TFieldValues>) {
  const { colors, isDark } = useAppTheme();
  const styles = createStyles(colors, isDark);
  const [showSecureText, setShowSecureText] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <View style={styles.group}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.inputWrap, error && styles.inputWrapError]}>
            {leadingIcon ? (
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name={leadingIcon}
                  size={18}
                  color={colors.textSecondary}
                />
              </View>
            ) : null}
            <TextInput
              autoCapitalize={autoCapitalize}
              keyboardType={keyboardType}
              multiline={multiline}
              numberOfLines={numberOfLines}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={colors.disabled}
              secureTextEntry={secureTextEntry && !showSecureText}
              selectionColor={colors.primary}
              style={[styles.input, multiline && styles.inputMultiline]}
              textAlignVertical={multiline ? "top" : "center"}
              value={String(value ?? "")}
            />
            {secureTextEntry ? (
              <Pressable
                accessibilityLabel={showSecureText ? "Ocultar contenido" : "Mostrar contenido"}
                accessibilityRole="button"
                onPress={() => setShowSecureText((previous) => !previous)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              >
                <MaterialCommunityIcons
                  name={showSecureText ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            ) : null}
          </View>
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
          {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        </View>
      )}
    />
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    group: {
      gap: 6,
    },
    label: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "700",
      lineHeight: Typography.caption.lineHeight,
    },
    inputWrap: {
      minHeight: 54,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "#13231F" : "#F5FBF8",
      paddingLeft: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    inputWrapError: {
      borderColor: colors.error,
    },
    iconWrap: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize,
      fontWeight: "500",
      paddingVertical: Spacing.sm,
      minHeight: 52,
    },
    inputMultiline: {
      minHeight: 104,
      paddingTop: Spacing.md,
    },
    actionButton: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 2,
    },
    actionButtonPressed: {
      backgroundColor: isDark ? "#223630" : "#E6F2ED",
    },
    helperText: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: Typography.caption.fontWeight,
      lineHeight: Typography.caption.lineHeight,
    },
    errorText: {
      color: colors.error,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight,
    },
  });
