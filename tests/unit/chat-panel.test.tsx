import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "@/components/chat/chat-panel";

function streamingResponse(text: string, status = 200): Response {
  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(text));
      c.close();
    },
  });
  return new Response(body, { status, headers: { "content-type": "text/plain" } });
}

beforeEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("ChatPanel", () => {
  it("offers suggested starter questions and a Book a call CTA on the empty state", () => {
    render(<ChatPanel open onOpenChange={() => {}} />);
    expect(screen.getByRole("link", { name: /book a call/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /BiNuKBoK and Noxa Loyalty/i })).toBeInTheDocument();
  });

  it("makes clear it is an AI assistant, not Omhar himself", () => {
    render(<ChatPanel open onOpenChange={() => {}} />);
    expect(screen.getByText(/not omhar/i)).toBeInTheDocument();
  });

  it("streams the assistant reply after the visitor sends a message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamingResponse("Omhar builds web apps."));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ChatPanel open onOpenChange={() => {}} />);
    const textarea = screen.getByPlaceholderText(/ask/i);
    await user.type(textarea, "what does he build?");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(screen.getByText("Omhar builds web apps.")).toBeInTheDocument());
    expect(screen.getByText("what does he build?")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("sends the conversation as a messages array to /api/chat", async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamingResponse("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ChatPanel open onOpenChange={() => {}} />);
    await user.type(screen.getByPlaceholderText(/ask/i), "hi");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.messages.at(-1)).toEqual({ role: "user", content: "hi" });
  });

  it("shows a graceful, Calendly-pointing message when the request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(streamingResponse("nope", 429));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ChatPanel open onOpenChange={() => {}} />);
    await user.type(screen.getByPlaceholderText(/ask/i), "hello");
    await user.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByText(/sending messages a little quickly/i)).toBeInTheDocument(),
    );
  });

  it("does not send while an IME composition is active (Enter confirms a candidate)", () => {
    const fetchMock = vi.fn().mockResolvedValue(streamingResponse("x"));
    vi.stubGlobal("fetch", fetchMock);
    render(<ChatPanel open onOpenChange={() => {}} />);
    const textarea = screen.getByPlaceholderText(/ask/i);
    fireEvent.change(textarea, { target: { value: "こんにちは" } });
    fireEvent.keyDown(textarea, { key: "Enter", isComposing: true, keyCode: 229 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("aborts the in-flight request when the panel closes (no error bubble, controls reset)", async () => {
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          signal.addEventListener("abort", () => c.error(new DOMException("aborted", "AbortError")));
        },
      });
      return Promise.resolve(new Response(body, { status: 200, headers: { "content-type": "text/plain" } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const { rerender } = render(<ChatPanel open onOpenChange={() => {}} />);
    await user.type(screen.getByPlaceholderText(/ask/i), "hi");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    rerender(<ChatPanel open={false} onOpenChange={() => {}} />); // closing aborts
    rerender(<ChatPanel open onOpenChange={() => {}} />); // reopen to inspect state

    // The abort clears busy (Send returns, not Stop) and appends no error bubble.
    await waitFor(() => expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument());
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});
