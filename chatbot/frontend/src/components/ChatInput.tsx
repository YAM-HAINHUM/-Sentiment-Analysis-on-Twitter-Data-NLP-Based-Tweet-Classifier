import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import toast from "react-hot-toast";

export default function ChatInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, streaming, activeId } = useChatStore();

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  const submit = async () => {
    const msg = text.trim();
    if (!msg || streaming) return;
    if (!activeId) { toast.error("Select or create a conversation first"); return; }
    setText("");
    try {
      await sendMessage(msg);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="p-4 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-2xl flex items-end gap-3 p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Message AI Chatbot... (Shift+Enter for new line)"
            disabled={streaming}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm leading-relaxed max-h-40 disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || !activeId}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
              streaming
                ? "bg-red-600 hover:bg-red-500 cursor-pointer"
                : text.trim() && activeId
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-gray-700 opacity-50 cursor-not-allowed"
            }`}
          >
            {streaming ? <Square size={14} className="text-white fill-white" /> : <Send size={14} className="text-white" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-600 mt-2">AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}
