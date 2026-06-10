import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import type { ChatMessage } from "@/src/services/chatService";
import { useChat, type ChatConversation } from "./ChatProvider";
import { createStyles } from "./ChatScreen.styles";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface Props {
  conversation: ChatConversation;
  title: string;
}

export default function ConversationScreen({ conversation, title }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const {
    connection,
    me,
    groupMessages,
    getThread,
    typingNickname,
    userById,
    sendGroup,
    sendDM,
    notifyTyping,
    loadDmHistory,
  } = useChat();

  const isDm = conversation.kind === "dm";
  const peerId = isDm ? conversation.peerId : null;

  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Al abrir un DM, traemos su historial persistido.
  useEffect(() => {
    if (peerId) loadDmHistory(peerId);
  }, [peerId, loadDmHistory]);

  const messages = isDm && peerId ? getThread(peerId) : groupMessages;
  const typing = typingNickname(conversation);
  const peerOnline = peerId ? Boolean(userById(peerId)) : false;

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || connection !== "online") return;
    if (isDm && peerId) {
      sendDM(peerId, content);
    } else {
      sendGroup(content);
    }
    setDraft("");
  }, [draft, connection, isDm, peerId, sendDM, sendGroup]);

  const handleChange = useCallback(
    (text: string) => {
      setDraft(text);
      if (connection === "online") notifyTyping(conversation);
    },
    [connection, notifyTyping, conversation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.sender_id === me?.id;
      return (
        <View
          style={[
            styles.bubbleRow,
            mine ? styles.bubbleRowMine : styles.bubbleRowOther,
          ]}
        >
          {!mine && conversation.kind === "group" && (
            <Text style={styles.senderName}>{item.sender_nickname}</Text>
          )}
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}>
              {item.content}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
      );
    },
    [me?.id, styles, conversation.kind],
  );

  const canSend = draft.trim().length > 0 && connection === "online";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>
            {isDm
              ? peerOnline
                ? "En línea"
                : "Desconectado"
              : "Conversación de la comunidad"}
          </Text>
        </View>
        {isDm && peerOnline && <View style={styles.onlineDot} />}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={40}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {isDm
                  ? "Aún no hay mensajes. ¡Escribe el primero!"
                  : "Todavía no hay mensajes. ¡Escribe el primero!"}
              </Text>
            </View>
          }
        />

        {typing && <Text style={styles.typingText}>{typing} está escribiendo…</Text>}

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={handleChange}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={colors.textSecondary}
            multiline
            editable={connection === "online"}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            onPress={handleSend}
            disabled={!canSend}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <MaterialCommunityIcons name="send" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
