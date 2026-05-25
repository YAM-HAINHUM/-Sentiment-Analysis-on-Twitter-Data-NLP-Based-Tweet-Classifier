import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, RefreshCw, User } from "lucide-react";
import type { Message } from "../types";
import { useChatStore } from "../store/chatStore";

interface Props {
  message: Message;
  isLast: boolean;
}

export default function MessageBubble({ message, isLast }: Props) {
  const [copied, setCopied] = useState(false);
  const { regenerate, streaming } = useChatStore();
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex gap-3 px-4 py-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
        isUser ? "bg-gray-700 text-gray-300" : "bg-indigo-600 text-white"
      }`}>
        {isUser ? <User size={14} /> : "AI"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] relative ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "glass rounded-tl-sm"
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat text-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? "flex-row-reverse" : ""}`}>
          <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-all">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {!isUser && isLast && !streaming && (
            <button onClick={regenerate} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-all">
              <RefreshCw size={12} />
              Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
