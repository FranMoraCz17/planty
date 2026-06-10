import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDemoData } from "@/src/data/DemoDataProvider";
import ChatService, {
  type ChatMessage,
  type ChatSocket,
} from "@/src/services/chatService";
import { useAppTheme } from "@/src/theme/ThemeProvider";
import { createStyles } from "./ChatScreen.styles";

type ConnectionState = "connecting" | "online" | "offline";

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

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { currentUser } = useDemoData();

  const nickname =
    currentUser?.username || currentUser?.name || "Invitado";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<ChatSocket | null>(null);
  const myIdRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Conectar al chat al montar: join (REST) → abrir WebSocket.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        setConnection("connecting");
        const { user, token } = await ChatService.join(nickname);
        if (cancelled) return;
        myIdRef.current = user.id;

        const socket = ChatService.connect(token, {
          onOpen: () => !cancelled && setConnection("online"),
          onClose: () => !cancelled && setConnection("offline"),
          onError: () => !cancelled && setConnection("offline"),
          onEvent: (event) => {
            if (cancelled) return;
            switch (event.type) {
              case "group_history":
                setMessages(event.messages);
                break;
              case "group_message":
                setMessages((prev) => [...prev, event.message]);
                break;
              case "users_list":
                setOnlineCount(event.users.length);
                break;
              case "user_joined":
                setOnlineCount((n) => n + 1);
                break;
              case "user_left":
                setOnlineCount((n) => Math.max(0, n - 1));
                break;
              case "typing":
                if (event.user_id !== myIdRef.current) {
                  setTypingUser(event.nickname);
                  if (clearTypingRef.current) clearTimeout(clearTypingRef.current);
                  clearTypingRef.current = setTimeout(
                    () => setTypingUser(null),
                    3000,
                  );
                }
                break;
              case "stop_typing":
                if (event.user_id !== myIdRef.current) setTypingUser(null);
                break;
              case "error":
                setError(event.message);
                break;
              default:
                break;
            }
          },
        });
        socketRef.current = socket;
      } catch (err) {
        if (cancelled) return;
        setConnection("offline");
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo conectar al chat. Intenta de nuevo.",
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (clearTypingRef.current) clearTimeout(clearTypingRef.current);
      socketRef.current?.close();
    };
  }, [nickname]);

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || connection !== "online") return;
    socketRef.current?.sendGroupMessage(content);
    socketRef.current?.sendStopTyping();
    setDraft("");
  }, [draft, connection]);

  const handleChangeText = useCallback(
    (text: string) => {
      setDraft(text);
      if (connection !== "online") return;
      socketRef.current?.sendTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(
        () => socketRef.current?.sendStopTyping(),
        1500,
      );
    },
    [connection],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const mine = item.sender_id === myIdRef.current;
      return (
        <View
          style={[
            styles.bubbleRow,
            mine ? styles.bubbleRowMine : styles.bubbleRowOther,
          ]}
        >
          {!mine && (
            <Text style={styles.senderName}>{item.sender_nickname}</Text>
          )}
          <View
            style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}
          >
            <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}>
              {item.content}
            </Text>
          </View>
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        </View>
      );
    },
    [styles],
  );

  const canSend = draft.trim().length > 0 && connection === "online";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={colors.text}
          />
        </Pressable>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>Chat de la comunidad</Text>
          <Text style={styles.headerSubtitle}>
            {connection === "online"
              ? `${onlineCount} conectado${onlineCount === 1 ? "" : "s"}`
              : connection === "connecting"
                ? "Conectando…"
                : "Sin conexión"}
          </Text>
        </View>
        {connection === "online" && <View style={styles.onlineDot} />}
      </View>

      {connection === "connecting" && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.centeredText}>
            Conectando al chat… (el servidor puede tardar unos segundos en
            despertar)
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {error && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusBannerText}>{error}</Text>
            </View>
          )}

          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={40}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  Todavía no hay mensajes. ¡Escribe el primero!
                </Text>
              </View>
            }
          />

          {typingUser && (
            <Text style={styles.typingText}>
              {typingUser} está escribiendo…
            </Text>
          )}

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={handleChangeText}
              placeholder="Escribe un mensaje…"
              placeholderTextColor={colors.textSecondary}
              multiline
              editable={connection === "online"}
              onSubmitEditing={handleSend}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              onPress={handleSend}
              disabled={!canSend}
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            >
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={colors.onPrimary}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
