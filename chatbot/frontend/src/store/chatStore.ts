import { create } from "zustand";
import type { Conversation, Message } from "../types";
import api from "../api/client";

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  messages: Message[];
  streaming: boolean;
  streamingText: string;
  searchQuery: string;

  fetchConversations: (search?: string) => Promise<void>;
  createConversation: () => Promise<string>;
  deleteConversation: (id: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  regenerate: () => Promise<void>;
  setSearch: (q: string) => void;
  clearChat: () => void;
}

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function readStream(
  response: Response,
  onChunk: (chunk: string) => void,
  onDone: () => void
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.chunk) onChunk(json.chunk);
        if (json.done) onDone();
      } catch {}
    }
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  streaming: false,
  streamingText: "",
  searchQuery: "",

  fetchConversations: async (search = "") => {
    const { data } = await api.get(`/conversations?search=${encodeURIComponent(search)}`);
    set({ conversations: data });
  },

  createConversation: async () => {
    const { data } = await api.post("/conversations", { title: "New Chat" });
    set((s) => ({ conversations: [data, ...s.conversations], activeId: data.id, messages: [] }));
    return data.id;
  },

  deleteConversation: async (id) => {
    await api.delete(`/conversations/${id}`);
    set((s) => {
      const convs = s.conversations.filter((c) => c.id !== id);
      return { conversations: convs, activeId: s.activeId === id ? null : s.activeId, messages: s.activeId === id ? [] : s.messages };
    });
  },

  selectConversation: async (id) => {
    set({ activeId: id, messages: [], streamingText: "" });
    const { data } = await api.get(`/conversations/${id}/messages`);
    set({ messages: data });
  },

  sendMessage: async (content) => {
    const { activeId } = get();
    if (!activeId) return;

    const userMsg: Message = { id: Date.now().toString(), conversation_id: activeId, role: "user", content, created_at: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true, streamingText: "" }));

    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: content, conversation_id: activeId }),
    });

    let full = "";
    await readStream(
      response,
      (chunk) => { full += chunk; set({ streamingText: full }); },
      () => {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), conversation_id: activeId, role: "assistant", content: full, created_at: new Date().toISOString() };
        set((s) => ({ messages: [...s.messages, aiMsg], streaming: false, streamingText: "" }));
        // Update conversation title in sidebar
        get().fetchConversations(get().searchQuery);
      }
    );
  },

  regenerate: async () => {
    const { activeId, messages } = get();
    if (!activeId) return;
    const lastAi = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAi) return;

    set((s) => ({ messages: s.messages.filter((m) => m.id !== lastAi.id), streaming: true, streamingText: "" }));

    const token = localStorage.getItem("token");
    const response = await fetch(`${BASE}/chat/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ conversation_id: activeId, message_id: lastAi.id }),
    });

    let full = "";
    await readStream(
      response,
      (chunk) => { full += chunk; set({ streamingText: full }); },
      () => {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), conversation_id: activeId, role: "assistant", content: full, created_at: new Date().toISOString() };
        set((s) => ({ messages: [...s.messages, aiMsg], streaming: false, streamingText: "" }));
      }
    );
  },

  setSearch: (q) => set({ searchQuery: q }),
  clearChat: () => set({ activeId: null, messages: [], streamingText: "", streaming: false }),
}));
