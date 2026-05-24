import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BorderRadius, Spacing, Typography } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM = 18;
const TAB_BAR_INSET = 16;
const PILL_VERTICAL_INSET = 8;
const PILL_HORIZONTAL_INSET = 6;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const ICON_MAP: Record<string, IconName> = {
  index: "home-variant",
  "my-plants": "sprout",
  identify: "leaf",
  calendar: "calendar-month",
  diagnose: "stethoscope",
};

const LABEL_MAP: Record<string, string> = {
  index: "Inicio",
  "my-plants": "Plantas",
  identify: "",
  calendar: "Calendario",
  diagnose: "Diagnostico",
};

interface SlotLayout {
  x: number;
  width: number;
}

export default function AnimatedTabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const { colors, isDark } = useAppTheme();
  const [layouts, setLayouts] = useState<Record<number, SlotLayout>>({});

  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;

  const activeIndex = state.index;
  const activeRoute = state.routes[activeIndex];
  const activeIsCenter = activeRoute?.name === "identify";
  const activeLayout = layouts[activeIndex];

  useEffect(() => {
    if (!activeLayout || activeIsCenter) return;
    Animated.parallel([
      Animated.timing(pillX, {
        toValue: activeLayout.x + PILL_HORIZONTAL_INSET,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(pillW, {
        toValue: activeLayout.width - PILL_HORIZONTAL_INSET * 2,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, activeIsCenter, pillX, pillW]);

  const handleLayout =
    (index: number) =>
    (e: LayoutChangeEvent) => {
      const { x, width } = e.nativeEvent.layout;
      setLayouts((prev) => {
        const prevLayout = prev[index];
        if (prevLayout && prevLayout.x === x && prevLayout.width === width) {
          return prev;
        }
        return { ...prev, [index]: { x, width } };
      });
    };

  const goTo = (routeName: string, key: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName as never);
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Layer de fondo (blur + tint) recortado en pill */}
      <View
        style={[
          styles.backgroundLayer,
          { shadowOpacity: isDark ? 0.45 : 0.18 },
        ]}
      >
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
        {/* Pill animada detras de los iconos */}
        {activeLayout && !activeIsCenter ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                left: pillX,
                width: pillW,
                backgroundColor: isDark
                  ? "rgba(22,163,74,0.22)"
                  : "rgba(22,163,74,0.16)",
              },
            ]}
          />
        ) : null}
      </View>

      {/* Tabs sin overflow: hidden, para que el boton central pueda salir */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const isFocused = activeIndex === index;
          const isCenter = route.name === "identify";
          const iconName = ICON_MAP[route.name] ?? "leaf";
          const label = LABEL_MAP[route.name] ?? "";

          if (isCenter) {
            return (
              <Pressable
                key={route.key}
                onLayout={handleLayout(index)}
                accessibilityRole="button"
                accessibilityLabel="Identificar planta"
                onPress={() => goTo(route.name, route.key, isFocused)}
                style={styles.centerSlot}
              >
                <View
                  style={[
                    styles.cameraButton,
                    {
                      backgroundColor: isFocused
                        ? colors.pressed
                        : colors.primary,
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
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              onLayout={handleLayout(index)}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={() => goTo(route.name, route.key, isFocused)}
              style={styles.slot}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={20}
                color={isFocused ? colors.primary : colors.disabled}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  { color: isFocused ? colors.primary : colors.disabled },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: TAB_BAR_INSET,
    right: TAB_BAR_INSET,
    bottom: TAB_BAR_BOTTOM,
    height: TAB_BAR_HEIGHT,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 12,
  },
  pill: {
    position: "absolute",
    top: PILL_VERTICAL_INSET,
    bottom: PILL_VERTICAL_INSET,
    borderRadius: BorderRadius.full,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  slot: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  centerSlot: {
    width: 64,
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
    marginTop: -22,
  },
  label: {
    fontFamily: Typography.family,
    fontSize: Typography.caption.fontSize - 1,
    fontWeight: "600",
  },
});
