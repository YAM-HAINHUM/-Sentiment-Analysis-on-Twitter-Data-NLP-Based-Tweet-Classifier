import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatPage from "./ChatPage";
import { Menu } from "lucide-react";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-72 flex flex-col">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <span className="font-semibold text-white text-sm">AI Chatbot</span>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatPage />
        </div>
      </div>
    </div>
  );
}
