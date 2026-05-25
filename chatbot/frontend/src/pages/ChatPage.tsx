import { useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import MessageBubble from "../components/MessageBubble";
import TypingIndicator from "../components/TypingIndicator";
import ChatInput from "../components/ChatInput";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Sparkles, Code2, BookOpen, Lightbulb } from "lucide-react";

const SUGGESTIONS = [
  { icon: Sparkles, text: "Explain quantum computing in simple terms" },
  { icon: Code2, text: "Write a Python function to sort a list" },
  { icon: BookOpen, text: "Summarize the key ideas of stoicism" },
  { icon: Lightbulb, text: "Give me 5 startup ideas for 2025" },
];

export default function ChatPage() {
  const { messages, streaming, streamingText, activeId, createConversation, sendMessage } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSuggestion = async (text: string) => {
    let id = activeId;
    if (!id) id = await createConversation();
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!activeId ? (
          /* Welcome screen */
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 animate-fade-in">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-600/30">
              <Bot size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
            <p className="text-gray-400 text-sm mb-10">Start a new conversation or pick a suggestion below.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => handleSuggestion(text)}
                  className="glass rounded-xl p-4 text-left hover:bg-white/10 transition-all duration-200 group"
                >
                  <Icon size={18} className="text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-gray-300">{text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} />
            ))}

            {/* Streaming bubble */}
            {streaming && streamingText && (
              <div className="flex gap-3 px-4 py-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white">
                  AI
                </div>
                <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-[75%]">
                  <div className="prose-chat text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                  </div>
                  <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
                </div>
              </div>
            )}

            {/* Typing indicator (before first chunk) */}
            {streaming && !streamingText && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatInput />
    </div>
  );
}
