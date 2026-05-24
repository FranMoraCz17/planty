import { Tabs } from "expo-router";
import AnimatedTabBar from "@/src/components/layout/AnimatedTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio" }} />
      <Tabs.Screen name="my-plants" options={{ title: "Plantas" }} />
      <Tabs.Screen name="identify" options={{ title: "" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendario" }} />
      <Tabs.Screen name="diagnose" options={{ title: "Diagnostico" }} />
    </Tabs>
  );
}
