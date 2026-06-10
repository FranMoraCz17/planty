import { Stack } from "expo-router";
import { ChatProvider } from "@/src/screens/chat/ChatProvider";

export default function ChatLayout() {
  return (
    <ChatProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ChatProvider>
  );
}
