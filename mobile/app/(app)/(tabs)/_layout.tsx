import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { BorderRadius, Spacing, Typography } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM_INSET = 18;
const TAB_BAR_HORIZONTAL_INSET = 16;

export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();

  const getTabIcon = (routeName: string) => {
    switch (routeName) {
      case "index":
        return "home-variant";
      case "my-plants":
        return "sprout";
      case "care":
        return "calendar-check";
      default:
        return "leaf";
    }
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarShowLabel: true,
        tabBarBackground: () => (
          <View style={styles.backgroundWrap}>
            <BlurView
              intensity={Platform.OS === "ios" ? 60 : 95}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? "rgba(20,20,20,0.55)"
                    : "rgba(255,255,255,0.65)",
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: BorderRadius.full,
                },
              ]}
            />
          </View>
        ),
        tabBarStyle: {
          position: "absolute",
          left: TAB_BAR_HORIZONTAL_INSET,
          right: TAB_BAR_HORIZONTAL_INSET,
          bottom: TAB_BAR_BOTTOM_INSET,
          height: TAB_BAR_HEIGHT,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: Spacing.sm,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          borderRadius: BorderRadius.full,
          elevation: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.45 : 0.18,
          shadowRadius: 16,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: Typography.caption.fontSize - 1,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName = getTabIcon(route.name);
          return (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? "rgba(22,163,74,0.18)"
                    : "rgba(22,163,74,0.12)",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={size - 2}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="my-plants" options={{ title: "Plantas" }} />
      <Tabs.Screen
        name="identify"
        options={{
          title: "",
          tabBarAccessibilityLabel: "Tomar foto",
          tabBarLabel: () => null,
          tabBarItemStyle: { marginTop: -22 },
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.cameraButton,
                {
                  backgroundColor: focused ? colors.pressed : colors.primary,
                  borderColor: isDark ? "#0F0F0F" : "#FFFFFF",
                  shadowColor: colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="leaf-circle"
                size={28}
                color={colors.onPrimary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="care" options={{ title: "Cuidado" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  backgroundWrap: {
    flex: 1,
    overflow: "hidden",
    borderRadius: BorderRadius.full,
  },
  iconWrap: {
    width: 34,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
});
