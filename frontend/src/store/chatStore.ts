import { create } from "zustand";
import type { ChatConversation, ChatMessage } from "../types";
import { chatAPI, API_BASE } from "../api/client";

export interface OllamaStatus {
  ollama_running: boolean;
  model: string;
  mode: "ollama" | "openai" | "fallback";
  available_models: string[];
}

interface ChatStore {
  conversations: ChatConversation[];
  activeId: string | null;
  messages: ChatMessage[];
  streaming: boolean;
  streamingText: string;
  searchQuery: string;
  ollamaStatus: OllamaStatus | null;

  fetchConversations: (search?: string) => Promise<void>;
  createConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, conversationId?: string) => Promise<void>;
  regenerate: () => Promise<void>;
  clearChat: () => Promise<void>;
  setSearch: (q: string) => void;
  fetchStatus: () => Promise<void>;
}

async function readSSE(
  response: Response,
  onChunk: (c: string) => void,
  onDone: (full: string) => void,
  onError: () => void
) {
  if (!response.ok) { onError(); return; }
  const reader = response.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { if (full) onDone(full); break; }
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const j = JSON.parse(line.slice(6));
            if (j.error) { onError(); return; }
            if (j.chunk) { full += j.chunk; onChunk(j.chunk); }
            if (j.done) { onDone(full); return; }
          } catch { /* ignore malformed */ }
        }
      }
    }
  } catch {
    onError();
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  streaming: false,
  streamingText: "",
  searchQuery: "",
  ollamaStatus: null,

  fetchStatus: async () => {
    try {
      // Chatbot feature removed. Keep method to avoid TS/build failures.
      set({ ollamaStatus: { ollama_running: false, model: "disabled", mode: "fallback", available_models: [] } });
    } catch {
      set({ ollamaStatus: { ollama_running: false, model: "unknown", mode: "fallback", available_models: [] } });
    }
  },

  fetchConversations: async (search = "") => {
    const { data } = await chatAPI.getConversations(search);
    set({ conversations: data });
  },

  createConversation: async () => {
    const { data } = await chatAPI.createConversation();
    set((s) => ({ conversations: [data, ...s.conversations], activeId: data.id, messages: [] }));
    return data.id;
  },

  deleteConversation: async (id) => {
    await chatAPI.deleteConversation(id);
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeId: s.activeId === id ? null : s.activeId,
      messages: s.activeId === id ? [] : s.messages,
    }));
  },

  clearChat: async () => {
    const { activeId } = get();
    if (!activeId) return;
    await chatAPI.clearChat(activeId);
    set({ messages: [] });
  },

  selectConversation: async (id) => {
    set({ activeId: id, messages: [], streamingText: "" });
    const { data } = await chatAPI.getMessages(id);
    set({ messages: data });
  },

  sendMessage: async (content, conversationId) => {
    const activeId = conversationId ?? get().activeId;
    if (!activeId) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: activeId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true, streamingText: "" }));

    const token = localStorage.getItem("sa_token");
    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: content, conversation_id: activeId }),
      });
      await readSSE(
        res,
        (chunk) => { set((s) => ({ streamingText: s.streamingText + chunk })); },
        (full) => {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversation_id: activeId,
            role: "assistant",
            content: full,
            created_at: new Date().toISOString(),
          };
          set((s) => ({ messages: [...s.messages, aiMsg], streaming: false, streamingText: "" }));
          get().fetchConversations(get().searchQuery);
        },
        () => set({ streaming: false, streamingText: "" })
      );
    } catch {
      set({ streaming: false, streamingText: "" });
    }
  },

  regenerate: async () => {
    const { activeId, messages } = get();
    if (!activeId) return;
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAi) return;
    set((s) => ({ messages: s.messages.filter((m) => m.id !== lastAi.id), streaming: true, streamingText: "" }));

    const token = localStorage.getItem("sa_token");
    try {
      const res = await fetch(`${API_BASE}/chat/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversation_id: activeId, message_id: lastAi.id }),
      });
      await readSSE(
        res,
        (chunk) => { set((s) => ({ streamingText: s.streamingText + chunk })); },
        (full) => {
          const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            conversation_id: activeId,
            role: "assistant",
            content: full,
            created_at: new Date().toISOString(),
          };
          set((s) => ({ messages: [...s.messages, aiMsg], streaming: false, streamingText: "" }));
        },
        () => set({ streaming: false, streamingText: "" })
      );
    } catch {
      set({ streaming: false, streamingText: "" });
    }
  },

  setSearch: (q) => set({ searchQuery: q }),
}));
