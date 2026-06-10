import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DemoDataProvider } from "@/src/data/DemoDataProvider";
import { AppThemeProvider } from "@/src/theme/ThemeProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <DemoDataProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </DemoDataProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
