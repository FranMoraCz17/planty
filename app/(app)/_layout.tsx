import { Redirect, Stack } from "expo-router";
import { useDemoData } from "@/src/data/DemoDataProvider";

export default function AppLayout() {
  const { isReady, isAuthenticated } = useDemoData();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
