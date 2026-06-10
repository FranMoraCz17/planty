import { useLocalSearchParams } from "expo-router";
import ConversationScreen from "./ConversationScreen";

export default function DmConversationScreen() {
  const { userId, nickname } = useLocalSearchParams<{
    userId: string;
    nickname?: string;
  }>();

  return (
    <ConversationScreen
      conversation={{ kind: "dm", peerId: userId }}
      title={nickname || "Mensaje directo"}
    />
  );
}
