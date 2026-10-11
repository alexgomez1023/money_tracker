"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { loadBudgets } from "@/lib/budget-storage";
import { getSavingsGoals } from "@/lib/plaid-savings";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "Review my monthly budgets",
  "How are my savings goals progressing?",
  "Am I spending more than I earn?",
  "What should I prioritize financially?",
];

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hi! I'm your AI Finance Assistant. I can help you review your spending, track budgets, understand your account balances, and work toward your savings goals. What would you like to discuss?",
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);
  const sendingRef = useRef(false);
  const chatVersionRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      chatVersionRef.current += 1;
    };
  }, []);

  async function sendMessage(messageText?: string) {
    const question = (messageText ?? input).trim();

    if (!question || sendingRef.current) return;

    sendingRef.current = true;
    const chatVersion = chatVersionRef.current;

    const userMessage: Message = {
      id: nextIdRef.current++,
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Read the user's latest saved budget limits.
      const budgets = (await loadBudgets()).map((budget) => ({
        category: budget.category,
        limit: budget.limit,
      }));

      // Read the user's latest savings goals.
      const savingsGoals = getSavingsGoals();

      // Send dashboard preferences with the question.
      const response = await fetch("/api/finance-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          budgets,
          savingsGoals,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The finance assistant returned an unexpected response. Check that the backend is running.",
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to answer your question.",
        );
      }

      // Ignore responses from a previous chat.
      if (chatVersion !== chatVersionRef.current) return;

      const assistantMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content:
          typeof data.reply === "string" && data.reply.trim()
            ? data.reply
            : "The assistant returned an empty response.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      if (chatVersion !== chatVersionRef.current) return;

      const errorMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      if (chatVersion === chatVersionRef.current) {
        sendingRef.current = false;
        setIsTyping(false);
      }
    }
  }

  function clearChat() {
    chatVersionRef.current += 1;
    sendingRef.current = false;

    setMessages(initialMessages);
    setInput("");
    setIsTyping(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 pb-32 pt-8 sm:px-8">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Your Financial Companion</p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
              AI Finance Assistant
            </h1>

            <p className="mt-2 text-sm text-muted">
              Ask questions about your money.
            </p>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="shrink-0 rounded-xl border border-border-custom bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-surface-blue"
          >
            New Chat
          </button>
        </header>

        {/* Chat Messages */}
        <Card className="flex min-h-[350px] flex-1 flex-col !p-0">
          <div
            className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-surface-blue text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-blue px-4 py-3 text-sm text-muted">
                  Analyzing your finances...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Suggested Questions */}
        <section className="mt-5">
          <p className="mb-3 text-xs font-semibold text-muted">
            Suggested Questions
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                disabled={isTyping}
                className="rounded-full border border-border-custom bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:border-secondary hover:bg-surface-blue disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </section>

        {/* Message Input */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
          className="mt-5 flex items-end gap-3 rounded-2xl border border-border-custom bg-white p-3 shadow-sm"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask a financial question
          </label>

          <textarea
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about your finances..."
            rows={2}
            className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-muted">
          Financial information is for educational purposes only, not
          personalized financial advice.
        </p>
      </div>
    </main>
  );
}
