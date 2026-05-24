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
import type {
  BottomTabBarProps,
  BottomTabDescriptorMap,
} from "@react-navigation/bottom-tabs";
import { BorderRadius, Spacing, Typography } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import SearchSheet from "./SearchSheet";

const TAB_BAR_HEIGHT = 64;
const TAB_BAR_BOTTOM = 18;
const TAB_BAR_INSET = 16;
const PILL_INSET = 6;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const ICON_MAP: Record<string, IconName> = {
  index: "home-variant",
  "my-plants": "sprout",
  identify: "leaf-circle",
  care: "calendar-check",
};

const LABEL_MAP: Record<string, string> = {
  index: "Inicio",
  "my-plants": "Plantas",
  identify: "",
  care: "Cuidado",
};

export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors, isDark } = useAppTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});
  const pillX = useRef(new Animated.Value(0)).current;
  const pillW = useRef(new Animated.Value(0)).current;

  const visibleRoutes = state.routes;
  const activeIndex = state.index;
  const activeLayout = layouts[activeIndex];

  useEffect(() => {
    if (!activeLayout) return;
    Animated.parallel([
      Animated.timing(pillX, {
        toValue: activeLayout.x + PILL_INSET,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(pillW, {
        toValue: activeLayout.width - PILL_INSET * 2,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeLayout, pillX, pillW]);

  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const prevLayout = prev[index];
      if (prevLayout && prevLayout.x === x && prevLayout.width === width) {
        return prev;
      }
      return { ...prev, [index]: { x, width } };
    });
  };

  const onPressTab = (routeName: string, isFocused: boolean, key: string) => {
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
    <>
      <View
        style={[
          styles.wrapper,
          {
            shadowOpacity: isDark ? 0.45 : 0.18,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.bar}>
          <View style={styles.backgroundLayer}>
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

          {/* Pill animada detras de los iconos */}
          {activeLayout && activeIndex !== getIdentifyIndex(descriptors) ? (
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

          {/* Tabs */}
          {visibleRoutes.map((route, index) => {
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
                  onPress={() => onPressTab(route.name, isFocused, route.key)}
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
                      size={26}
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
                onPress={() => onPressTab(route.name, isFocused, route.key)}
                style={styles.slot}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.primary : colors.disabled}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isFocused ? colors.primary : colors.disabled,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}

          {/* 5to slot fijo: buscador */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar plantas"
            onPress={() => setSearchOpen(true)}
            style={styles.slot}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={colors.disabled}
            />
            <Text style={[styles.label, { color: colors.disabled }]}>
              Buscar
            </Text>
          </Pressable>
        </View>
      </View>
      <SearchSheet visible={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function getIdentifyIndex(descriptors: BottomTabDescriptorMap): number {
  const keys = Object.keys(descriptors);
  for (let i = 0; i < keys.length; i++) {
    const route = descriptors[keys[i]].route;
    if (route.name === "identify") return i;
  }
  return -1;
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: TAB_BAR_INSET,
    right: TAB_BAR_INSET,
    bottom: TAB_BAR_BOTTOM,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 12,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    overflow: "hidden",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    borderRadius: BorderRadius.full,
  },
  pill: {
    position: "absolute",
    top: 8,
    bottom: 8,
    borderRadius: BorderRadius.full,
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  centerSlot: {
    width: 64,
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
    marginTop: -18,
  },
  label: {
    fontFamily: Typography.family,
    fontSize: Typography.caption.fontSize - 1,
    fontWeight: "600",
  },
});
