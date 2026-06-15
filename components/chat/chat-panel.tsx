"use client";
import * as React from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Send, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { profile } from "@/content/profile";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const HISTORY_KEY = "omhar-chat-v1";
const MAX_SEND = 8; // matches the server's ChatRequestSchemaV2 turn cap
const SUGGESTED = [
  "What kind of projects has Omhar shipped?",
  "What's Omhar's tech stack?",
  "Is Omhar available for freelance work?",
  "Tell me about BiNuKBoK and Noxa Loyalty.",
];
const ERROR_REPLY = `Sorry — something went wrong on my end. You can reach Omhar directly here: ${profile.calendlyUrl}`;
const RATE_REPLY = `You're sending messages a little quickly! Give it a moment, or just book a quick call: ${profile.calendlyUrl}`;

/** One-time read of this tab's prior conversation (SSR-safe). */
function loadHistory(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Msg[]) : [];
  } catch {
    return [];
  }
}

const MOBILE_QUERY = "(max-width: 767px)";
function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const getMobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

/** Linkify only the exact, known-good Calendly URL (no arbitrary-URL surface). */
function renderContent(text: string): React.ReactNode {
  const url = profile.calendlyUrl;
  if (!text.includes(url)) return text;
  const parts = text.split(url);
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part}
      {i < parts.length - 1 && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
          {url}
        </a>
      )}
    </React.Fragment>
  ));
}

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: Role;
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-md p-3 text-sm whitespace-pre-wrap break-words",
          isUser
            ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
            : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
        )}
      >
        {renderContent(content)}
        {streaming && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current motion-safe:animate-pulse"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, () => false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Persist this tab's conversation (sessionStorage — not shared across tabs).
  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-12)));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Abort any in-flight request when the panel closes (the Stop button lives
  // inside the portal and disappears on close) or when the component unmounts —
  // otherwise the request keeps consuming free-tier output tokens for an answer
  // nobody will read.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    // Respect prefers-reduced-motion: an explicit `behavior: "smooth"` overrides
    // the element's computed scroll-behavior (CSSOM View), so the global CSS
    // guard can't govern it — we must pick the behavior here, like the carousel.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim().slice(0, 1000);
    if (!trimmed || busy) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreaming("");
    setBusy(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-MAX_SEND) }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const reply = res.status === 429 ? RATE_REPLY : ERROR_REPLY;
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      setMessages((m) => [...m, { role: "assistant", content: acc.trim() || ERROR_REPLY }]);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setMessages((m) => [...m, { role: "assistant", content: ERROR_REPLY }]);
      }
    } finally {
      setStreaming(null);
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Don't submit while an IME composition is active — pressing Enter to confirm
    // a candidate (CJK input) must commit the candidate, not send the message.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  const Body = (
    <div className="flex h-full min-h-0 flex-col">
      {/* Persona header + always-visible booking CTA. pr-8 reserves room for the
          dialog/sheet close (×) at absolute right-4 top-4, so the CTA never sits
          under it. */}
      <div className="flex items-center gap-3 border-b border-[hsl(var(--border))] pb-3 pr-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.photoSrc}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Omhar&apos;s AI assistant</p>
          <p className="text-xs leading-tight text-[hsl(var(--muted-foreground))]">
            AI · grounded on Omhar&apos;s portfolio. Not Omhar himself.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={profile.calendlyUrl} target="_blank" rel="noopener noreferrer">
            Book a call
          </a>
        </Button>
      </div>

      {/* Conversation */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-busy={busy}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto py-3"
      >
        {messages.length === 0 && streaming === null && (
          <div className="space-y-3">
            <div className="rounded-md bg-[hsl(var(--muted))] p-3 text-sm">
              Hi! I can tell you about Omhar&apos;s work, experience, and the projects he&apos;s built.
              What would you like to know?
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded-md border border-[hsl(var(--border))] px-3 py-2 text-left text-xs hover:bg-[hsl(var(--muted))] motion-safe:transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {/* The growing partial answer is hidden from assistive tech so screen
            readers aren't spammed with every token; the committed message below
            is announced once when it lands. */}
        {streaming !== null && (
          <div aria-hidden>
            <MessageBubble role="assistant" content={streaming} streaming />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Polite, one-shot SR cue while a reply is in flight (the streamed bubble
          itself is aria-hidden to avoid per-token spam; the committed answer is
          announced when it lands). */}
      {streaming !== null && (
        <p role="status" className="sr-only">
          Omhar&apos;s AI assistant is responding…
        </p>
      )}

      {/* Composer */}
      <div className="border-t border-[hsl(var(--border))] pt-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 1000))}
          onKeyDown={onKeyDown}
          maxLength={1000}
          rows={2}
          className="w-full resize-none rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-sm"
          placeholder="Ask me about Omhar's work…"
          aria-label="Message"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{input.length}/1000</span>
          {busy ? (
            <Button type="button" variant="outline" size="sm" onClick={() => abortRef.current?.abort()}>
              <Square className="mr-1 h-3.5 w-3.5" aria-hidden />
              Stop
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => void send(input)} disabled={input.trim().length === 0}>
              <Send className="mr-1 h-3.5 w-3.5" aria-hidden />
              Send
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-[85dvh] flex-col gap-0 overflow-hidden p-4">
          <SheetHeader className="sr-only">
            <SheetTitle>Chat with Omhar&apos;s AI assistant</SheetTitle>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-h-[85dvh] flex-col gap-0 p-4">
        <DialogHeader className="sr-only">
          <DialogTitle>Chat with Omhar&apos;s AI assistant</DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
