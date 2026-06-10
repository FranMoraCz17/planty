import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Switch,
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

// Duraciones disponibles para mensajes temporales (segundos).
const TTL_CHOICES: { label: string; value: number | null }[] = [
  { label: "Permanente", value: null },
  { label: "30 s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "1 h", value: 3600 },
];

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
    seenIds,
    setActiveConversation,
    markIncomingRead,
    sendGroup,
    sendDM,
    notifyTyping,
    loadDmHistory,
  } = useChat();

  const isDm = conversation.kind === "dm";
  const peerId = isDm ? conversation.peerId : null;

  const [draft, setDraft] = useState("");
  const [optionsVisible, setOptionsVisible] = useState(false);
  // Opciones de envío activas para los próximos mensajes.
  const [ttl, setTtl] = useState<number | null>(null);
  const [readReceipt, setReadReceipt] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Registramos la conversación abierta (limpia no leídos y evita contarlos).
  useEffect(() => {
    setActiveConversation(conversation);
    return () => setActiveConversation(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveConversation, conversation.kind, peerId]);

  // Al abrir un DM, traemos su historial persistido.
  useEffect(() => {
    if (peerId) loadDmHistory(peerId);
  }, [peerId, loadDmHistory]);

  const messages = isDm && peerId ? getThread(peerId) : groupMessages;

  // Confirmamos lectura de los mensajes ajenos visibles (doble check).
  useEffect(() => {
    if (messages.length > 0) markIncomingRead(messages);
  }, [messages, markIncomingRead]);

  const typing = typingNickname(conversation);
  const peerOnline = peerId ? Boolean(userById(peerId)) : false;

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content || connection !== "online") return;
    const options = { ttl, allowReadReceipt: readReceipt };
    if (isDm && peerId) {
      sendDM(peerId, content, options);
    } else {
      sendGroup(content, options);
    }
    setDraft("");
  }, [draft, connection, isDm, peerId, sendDM, sendGroup, ttl, readReceipt]);

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
      const seen = mine && seenIds.has(item.id);
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
          <View style={styles.metaRow}>
            {item.ttl ? (
              <View style={styles.ttlBadge}>
                <MaterialCommunityIcons
                  name="timer-sand"
                  size={11}
                  color={colors.accentWarm}
                />
              </View>
            ) : null}
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
            {mine && (
              <MaterialCommunityIcons
                name={seen ? "check-all" : "check"}
                size={13}
                color={seen ? colors.primary : colors.textSecondary}
              />
            )}
          </View>
        </View>
      );
    },
    [me?.id, styles, conversation.kind, seenIds, colors],
  );

  const canSend = draft.trim().length > 0 && connection === "online";
  const ttlLabel =
    TTL_CHOICES.find((c) => c.value === ttl)?.label ?? "Permanente";

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Opciones del mensaje"
          onPress={() => setOptionsVisible(true)}
          style={styles.optionsBtn}
        >
          <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.text} />
        </Pressable>
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
                Aún no hay mensajes. ¡Escribe el primero!
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
            placeholder={
              ttl ? `Mensaje temporal (${ttlLabel})…` : "Escribe un mensaje…"
            }
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
            <MaterialCommunityIcons
              name={ttl ? "timer-outline" : "send"}
              size={20}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Menú de opciones del mensaje (temporal + confirmación de visto) */}
      <Modal
        visible={optionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOptionsVisible(false)}
        >
          <Pressable style={styles.optionsCard} onPress={() => {}}>
            <Text style={styles.optionsTitle}>Opciones del mensaje</Text>

            <View style={styles.optionRow}>
              <MaterialCommunityIcons
                name="timer-sand"
                size={20}
                color={colors.accentWarm}
              />
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Mensaje temporal</Text>
                <Text style={styles.optionSubtitle}>
                  Se elimina para todos al vencer el tiempo
                </Text>
              </View>
              <Text style={styles.optionValue}>{ttlLabel}</Text>
            </View>

            <View style={styles.ttlChips}>
              {TTL_CHOICES.map((choice) => {
                const active = choice.value === ttl;
                return (
                  <Pressable
                    key={choice.label}
                    accessibilityRole="button"
                    onPress={() => setTtl(choice.value)}
                    style={[styles.ttlChip, active && styles.ttlChipActive]}
                  >
                    <Text
                      style={[
                        styles.ttlChipText,
                        active && styles.ttlChipTextActive,
                      ]}
                    >
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.optionDivider} />

            <View style={styles.optionRow}>
              <MaterialCommunityIcons
                name="check-all"
                size={20}
                color={colors.primary}
              />
              <View style={styles.optionBody}>
                <Text style={styles.optionTitle}>Confirmación de visto</Text>
                <Text style={styles.optionSubtitle}>
                  El remitente verá el doble check al leerse
                </Text>
              </View>
              <Switch
                value={readReceipt}
                onValueChange={setReadReceipt}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surfaceCard}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
