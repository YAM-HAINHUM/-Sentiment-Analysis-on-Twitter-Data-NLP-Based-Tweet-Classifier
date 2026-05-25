import { useEffect, useState } from "react";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { Bot, Plus, Search, Trash2, MessageSquare, Settings, LogOut, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: Props) {
  const { conversations, activeId, fetchConversations, createConversation, deleteConversation, selectConversation, searchQuery, setSearch } = useChatStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations(searchQuery);
  }, [searchQuery]);

  const handleNew = async () => {
    await createConversation();
    onClose?.();
  };

  const handleSelect = async (id: string) => {
    await selectConversation(id);
    onClose?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleting(id);
    await deleteConversation(id);
    setDeleting(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white">AI Chatbot</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn-ghost p-1.5">
              <X size={18} />
            </button>
          )}
        </div>
        <button onClick={handleNew} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field pl-9 py-2 text-sm"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm">
            <MessageSquare size={24} className="mb-2 opacity-50" />
            {searchQuery ? "No results found" : "No conversations yet"}
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className={`group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 animate-slide-in ${
                activeId === conv.id ? "bg-indigo-600/20 border border-indigo-500/30" : "hover:bg-white/5"
              }`}
            >
              <MessageSquare size={14} className={`shrink-0 ${activeId === conv.id ? "text-indigo-400" : "text-gray-500"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${activeId === conv.id ? "text-white" : "text-gray-300"}`}>
                  {conv.title}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                disabled={deleting === conv.id}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-gray-600 transition-all rounded"
              >
                {deleting === conv.id
                  ? <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin block" />
                  : <Trash2 size={13} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button onClick={() => navigate("/settings")} className="btn-ghost w-full flex items-center gap-3 text-sm">
          <Settings size={16} />
          Settings
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-1">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
