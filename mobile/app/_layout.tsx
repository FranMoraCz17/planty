import { Stack } from "expo-router";
import { DemoDataProvider } from "@/src/data/DemoDataProvider";
import { AppThemeProvider } from "@/src/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <DemoDataProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DemoDataProvider>
    </AppThemeProvider>
  );
}
