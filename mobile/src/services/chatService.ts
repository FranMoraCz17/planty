const HTTP_BASE_URL =
  process.env.EXPO_PUBLIC_CHAT_APP ?? "https://chat-backend-mjfk.onrender.com";
const WS_BASE_URL =
  process.env.EXPO_PUBLIC_CHAT_WS_APP ?? "wss://chat-backend-mjfk.onrender.com";

export interface ChatUser {
  id: string;
  nickname: string;
  joined_at: string;
  is_online: boolean;
  public_key?: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_nickname: string;
  content: string;
  type: "group" | "dm";
  recipient_id?: string | null;
  timestamp: string;
  ttl?: number | null;
  expires_at?: string | null;
  allow_read_receipt?: boolean;
}

export interface JoinResponse {
  user: ChatUser;
  token: string;
}

// Eventos
export type ChatServerEvent =
  | { type: "group_message"; message: ChatMessage }
  | { type: "group_history"; messages: ChatMessage[] }
  | { type: "dm"; message: ChatMessage }
  | { type: "users_list"; users: ChatUser[] }
  | { type: "user_joined"; user: ChatUser }
  | { type: "user_left"; user_id: string }
  | { type: "typing"; user_id: string; nickname: string }
  | { type: "stop_typing"; user_id: string }
  | { type: "group_key"; key: string }
  | { type: "message_seen"; message_id: string; seen_by: string; seen_at: string }
  | { type: "message_expired"; message_id: string }
  | { type: "pong" }
  | { type: "error"; message: string };

// Handlers que la pantalla registra para reaccionar a los eventos.
export interface ChatSocketHandlers {
  onEvent: (event: ChatServerEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: unknown) => void;
}

// Wrapper sobre el WebSocket nativo con helpers tipados para enviar mensajes.
// El parámetro opcional `to` (user_id) convierte el evento en privado (DM).
export interface ChatSocket {
  sendGroupMessage: (content: string) => void;
  sendDM: (to: string, content: string) => void;
  sendTyping: (to?: string) => void;
  sendStopTyping: (to?: string) => void;
  close: () => void;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${HTTP_BASE_URL}${path}`, init);
  if (!response.ok) {
    let detail = `Error del servidor (${response.status}).`;
    try {
      const body = await response.json();
      detail = body?.detail?.message ?? body?.detail ?? detail;
    } catch {
      //usamos el mensaje por defecto
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

const ChatService = {
  /** Registra un nickname y devuelve el usuario + token de sesión. */
  async join(nickname: string): Promise<JoinResponse> {
    return request<JoinResponse>("/api/chat/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
  },

  /** Historial del chat grupal (respaldo por si el WS tarda en abrir). */
  async getGroupMessages(limit = 50): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/api/chat/messages?limit=${limit}`);
  },

  /** Usuarios conectados ahora mismo. */
  async getOnlineUsers(): Promise<ChatUser[]> {
    return request<ChatUser[]>("/api/chat/users");
  },

  /** Historial de mensajes directos entre el usuario actual y otro. */
  async getDmHistory(token: string, otherId: string): Promise<ChatMessage[]> {
    return request<ChatMessage[]>(`/api/chat/messages/dm/${otherId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Abre el WebSocket del chat y devuelve un wrapper para enviar mensajes.
   * El servidor envía group_history, users_list y group_key al conectar.
   */
  connect(token: string, handlers: ChatSocketHandlers): ChatSocket {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/${token}`);

    ws.onopen = () => handlers.onOpen?.();
    ws.onclose = () => handlers.onClose?.();
    ws.onerror = (event) => handlers.onError?.(event);
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as ChatServerEvent;
        handlers.onEvent(parsed);
      } catch {
        // ignoramos frames que no sean JSON válido
      }
    };

    const send = (payload: Record<string, unknown>) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    return {
      sendGroupMessage: (content: string) =>
        send({ type: "group_message", content }),
      sendDM: (to: string, content: string) =>
        send({ type: "dm", to, content }),
      sendTyping: (to?: string) =>
        send(to ? { type: "typing", to } : { type: "typing" }),
      sendStopTyping: (to?: string) =>
        send(to ? { type: "stop_typing", to } : { type: "stop_typing" }),
      close: () => ws.close(),
    };
  },
};

export default ChatService;
