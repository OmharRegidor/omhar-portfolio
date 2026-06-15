"use client";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ChatPanel } from "./chat-panel";

const SEEN_KEY = "omhar-chat-launcher-seen";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [breathing, setBreathing] = useState(false);

  // Breathe to invite a first chat, but only until the visitor has opened it once
  // this session. Starts false so SSR and first client paint agree (no hydration
  // flash); the ring fades in after mount when the visitor hasn't been seen.
  useEffect(() => {
    try {
      // Hydration-safe init: sessionStorage is browser-only, so we read it after
      // mount (not during render). Documented pattern — cf. theme-switch.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!sessionStorage.getItem(SEEN_KEY)) setBreathing(true);
    } catch {
      /* ignore */
    }
  }, []);

  function openChat() {
    setOpen(true);
    setBreathing(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 print:hidden">
        <button
          type="button"
          onClick={openChat}
          aria-label="Ask Omhar AI"
          className="relative z-10 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] px-4 h-12 text-sm font-medium text-[hsl(var(--foreground))] shadow-[var(--shadow-elevated)] hover:bg-[hsl(var(--muted))] motion-safe:transition-colors"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          <span>Ask Omhar AI</span>
        </button>
        {/* Breathing accent ring. opacity-0 by default; only the motion-safe
            animation reveals it — so under reduced motion it stays invisible. */}
        {breathing && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-full border border-[hsl(var(--accent))] opacity-0 motion-safe:animate-breathe"
          />
        )}
      </div>
      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
