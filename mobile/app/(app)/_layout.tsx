import { Redirect, Stack } from "expo-router";
import { View } from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import OfflineBanner from "@/src/components/ui/OfflineBanner";
import { TabBarVisibilityProvider } from "@/src/components/layout/TabBarVisibilityContext";

export default function AppLayout() {
  const { isReady, isAuthenticated } = useDemoData();
  const { isConnected } = useNetworkStatus();

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <TabBarVisibilityProvider>
      <View style={{ flex: 1 }}>
        {!isConnected && <OfflineBanner />}
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </TabBarVisibilityProvider>
  );
}
