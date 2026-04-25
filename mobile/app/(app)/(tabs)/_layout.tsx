import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Typography } from "@/src/theme/designSystem";
import { useAppTheme } from "@/src/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useAppTheme();

  const getTabIcon = (routeName: string) => {
    switch (routeName) {
      case "index":
        return "home-variant";
      case "my-plants":
        return "sprout";
      case "care":
        return "calendar-check";
      case "profile":
      default:
        return "account-circle";
    }
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarStyle: {
          backgroundColor: colors.surfaceCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: Typography.caption.fontSize,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = getTabIcon(route.name);
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="my-plants" options={{ title: "Mis plantas" }} />
      <Tabs.Screen
        name="identify"
        options={{
          title: "",
          tabBarAccessibilityLabel: "Tomar foto",
          tabBarLabel: () => null,
          tabBarItemStyle: { marginTop: -12 },
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.cameraButton,
                {
                  backgroundColor: focused ? colors.pressed : colors.primary,
                  borderColor: colors.surfaceCard,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons name="leaf-circle" size={28} color={colors.onPrimary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="care" options={{ title: "Cuidado" }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
  },
});
