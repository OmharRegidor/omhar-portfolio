"use client";
import { useEffect, useState } from "react";
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

export function ChatPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onSubmit = async () => {
    setBusy(true);
    setReply(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      setReply(json.reply ?? json.error?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const Body = (
    <div className="space-y-3">
      <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">
        Hi! Thanks for visiting. The chat is coming soon — for now, please reach me via Calendly.
      </div>
      {reply && <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-sm">{reply}</div>}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
        maxLength={1000}
        rows={3}
        className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 text-sm"
        placeholder="Ask me about programming, web dev, or tech!"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{message.length}/1000</span>
        <Button onClick={onSubmit} disabled={busy || message.length === 0}>
          {busy ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Chat</SheetTitle>
          </SheetHeader>
          {Body}
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chat</DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
