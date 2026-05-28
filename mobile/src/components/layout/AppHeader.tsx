import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import {
  BorderRadius,
  Spacing,
  Typography,
  type ThemeColors,
} from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onAvatarPress: () => void;
}

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

export default function AppHeader({
  title,
  subtitle,
  onAvatarPress,
}: AppHeaderProps) {
  const { colors, isDark } = useAppTheme();
  const { currentUser } = useDemoData();
  const router = useRouter();
  const styles = createStyles(colors, isDark);

  const displayTitle = title ?? "Planty";
  const displaySubtitle =
    subtitle ?? (currentUser?.name ? `Hola, ${getFirstName(currentUser.name)}` : "");

  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        {displaySubtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {displaySubtitle}
          </Text>
        ) : null}
      </View>
      {/* Acciones rápidas en el header */}
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clínica de diagnósticos"
          onPress={() => router.push("/(app)/clinic" as never)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="stethoscope" size={20} color={colors.accentWarm} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mi Herbario"
          onPress={() => router.push("/herbario" as never)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialCommunityIcons name="flask-outline" size={20} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menu de cuenta"
          onPress={onAvatarPress}
          style={({ pressed }) => [
            styles.avatarWrap,
            pressed && styles.avatarPressed,
          ]}
        >
          {currentUser?.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.avatarImage}
              accessibilityIgnoresInvertColors
            />
          ) : (
            <MaterialCommunityIcons
              name="account-circle"
              size={26}
              color={colors.primary}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      gap: Spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: colors.text,
      fontFamily: Typography.family,
      fontSize: Typography.body.fontSize + 4,
      fontWeight: "800",
      lineHeight: Typography.body.lineHeight + 2,
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.textSecondary,
      fontFamily: Typography.family,
      fontSize: Typography.caption.fontSize + 1,
      fontWeight: "600",
      lineHeight: Typography.caption.lineHeight + 2,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarPressed: {
      opacity: 0.8,
      backgroundColor: isDark ? "#22332F" : "#EAF4F0",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
  });
