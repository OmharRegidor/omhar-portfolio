"use client";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "./chat-panel";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ask Omhar AI"
          className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 h-12 text-sm font-medium text-[hsl(var(--foreground))] shadow-[var(--shadow-elevated)] hover:bg-[hsl(var(--muted))] motion-safe:transition-colors"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          <span>Ask Omhar AI</span>
        </button>
        {/* Always-on breathing accent ring. opacity-0 by default; only the
            motion-safe animation reveals it — so it's invisible under reduced
            motion (the keyframes drive the opacity). pointer-events-none + outside
            the button face, so it never affects clicks or focus. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-full border border-[hsl(var(--accent))] opacity-0 motion-safe:animate-breathe"
        />
      </div>
      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
