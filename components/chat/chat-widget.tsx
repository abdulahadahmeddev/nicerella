"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircleIcon, XIcon, SendIcon, SparklesIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatContext } from "@/lib/ai/chat-providers";

interface ChatWidgetProps {
  context?: ChatContext;
  isPro?: boolean;
}

interface Message extends ChatMessage {
  id: string;
  timestamp: number;
}

const STORAGE_KEY = "nicerella_chat_history";
const SESSION_ID_KEY = "nicerella_chat_session";
const HISTORY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function loadChatHistory(productId?: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const data = JSON.parse(stored);
    const key = productId || "global";
    const history = data[key] || [];
    const now = Date.now();
    // Filter out expired messages (> 24h old)
    return history.filter((msg: Message) => now - msg.timestamp < HISTORY_EXPIRY_MS);
  } catch {
    return [];
  }
}

function saveChatHistory(messages: Message[], productId?: string) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    const key = productId || "global";
    data[key] = messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

export function ChatWidget({ context, isPro = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const productId = context?.productTitle
    ? context.productTitle.slice(0, 50).replace(/\s+/g, "_")
    : undefined;

  // Load history on mount
  useEffect(() => {
    const history = loadChatHistory(productId);
    if (history.length > 0) {
      setMessages(history);
    }
  }, [productId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages, productId);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context,
          sessionId: getSessionId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "rate_limit_exceeded") {
          setError(data.message);
          setRemaining(0);
        } else {
          setError(data.error || "Failed to get response");
        }
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages, productId);
      setRemaining(data.remaining);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    saveChatHistory([], productId);
    setError(null);
    setRemaining(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
        aria-label="Open chat"
      >
        <MessageCircleIcon size={24} weight="fill" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-3rem)] flex-col rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-4 py-3 text-white rounded-t-[var(--radius-2xl)]">
        <div className="flex items-center gap-2">
          <SparklesIcon size={20} weight="fill" />
          <div>
            <h3 className="text-body font-medium">Nicerella AI</h3>
            <p className="text-caption opacity-90">Shopping Assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 transition-colors hover:bg-white/20"
          aria-label="Close chat"
        >
          <XIcon size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-body-sm text-[var(--color-foreground-muted)] py-8">
            <SparklesIcon size={32} weight="fill" className="mx-auto mb-3 text-[var(--color-primary)]" />
            <p className="font-medium text-[var(--color-foreground)]">
              Hi! Ask me anything 👋
            </p>
            <p className="mt-2">
              I can help you understand trust scores, explain reviews, and answer product questions.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-[var(--radius-lg)] px-4 py-2.5 text-body-sm ${
                msg.role === "user"
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-elevated)] text-[var(--color-foreground)]"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] px-4 py-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--color-primary)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius-lg)] bg-red-500/10 border border-red-500/20 p-3 text-body-sm text-red-600 dark:text-red-400">
            {error}
            {error.includes("Upgrade to Pro") && (
              <Button href="/pricing" size="sm" className="mt-2 w-full">
                Upgrade to Pro
              </Button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] p-3">
        {remaining !== null && remaining >= 0 && !isPro && (
          <p className="text-caption text-[var(--color-foreground-muted)] mb-2 text-center">
            {remaining} messages remaining today
          </p>
        )}

        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={isLoading || (remaining !== null && remaining === 0)}
            className="flex-1 resize-none rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-body-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || (remaining !== null && remaining === 0)}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon size={18} weight="fill" />
          </button>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-2 w-full text-caption text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  );
}
