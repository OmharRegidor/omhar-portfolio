"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "./chat-panel";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask Omhar AI"
        className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 h-12 text-sm font-medium text-[hsl(var(--foreground))] shadow-[var(--shadow-elevated)] hover:bg-[hsl(var(--muted))] motion-safe:transition-colors print:hidden"
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
        <span>Ask Omhar AI</span>
      </button>
      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
