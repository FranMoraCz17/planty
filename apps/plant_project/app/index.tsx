import { Redirect } from "expo-router";
import { useDemoData } from "@/src/data/DemoDataProvider";

export default function Index() {
  const { isReady, isAuthenticated } = useDemoData();

  if (!isReady) {
    return null;
  }

  return <Redirect href={isAuthenticated ? "/(app)/(tabs)" : "/(auth)/login"} />;
}
