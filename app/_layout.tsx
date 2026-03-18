import { Stack } from "expo-router";
import { AppThemeProvider } from "@/src/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppThemeProvider>
  );
}
