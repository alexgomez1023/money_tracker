
"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "How can I save more money?",
  "Help me review my budget",
  "How can I reduce food spending?",
  "What should I prioritize financially?",
];

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hi! I'm your AI Finance Assistant. I can help you explore spending habits, budgets, and savings goals. What would you like to discuss?",
  },
];

function getDemoResponse(question: string): string {
  const text = question.toLowerCase();

  if (
    text.includes("food") ||
    text.includes("restaurant") ||
    text.includes("coffee")
  ) {
    return (
      "Food and drink spending can add up quickly. " +
      "Try reviewing your restaurant and coffee purchases, " +
      "setting a realistic weekly spending target, and " +
      "planning a few meals ahead. " +
      "These are general suggestions based on demo data."
    );
  }

  if (
    text.includes("budget") ||
    text.includes("spending")
  ) {
    return (
      "A useful starting point is comparing your spending " +
      "against each category's monthly limit. " +
      "Look for categories approaching 80% of their budget " +
      "and consider adjusting discretionary purchases. " +
      "This is a simulated response, not a live account analysis."
    );
  }

  if (
    text.includes("save") ||
    text.includes("saving") ||
    text.includes("goal")
  ) {
    return (
      "Consider setting a specific savings goal and " +
      "contributing a manageable amount consistently. " +
      "Reviewing recurring expenses can help identify " +
      "money you might redirect toward that goal. " +
      "This is a demo recommendation."
    );
  }

  if (
    text.includes("debt") ||
    text.includes("credit")
  ) {
    return (
      "A good first step is listing your balances, " +
      "interest rates, and minimum payments. " +
      "Prioritizing high-interest debt may reduce " +
      "the total interest you pay. " +
      "For now, I can only provide general demo guidance."
    );
  }

  return (
    "That's a great financial question. " +
    "You can start by reviewing your recent transactions, " +
    "checking your budget limits, and setting a clear " +
    "savings goal. Once our AI backend is connected, " +
    "this assistant will be able to provide more " +
    "personalized responses using authorized account data."
  );
}

export default function AssistantPage() {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function sendMessage(messageText?: string) {
    const question = (messageText ?? input).trim();

    if (!question || isTyping) return;

    const userMessage: Message = {
      id: nextIdRef.current++,
      role: "user",
      content: question,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    // Temporary demo response.
    // Replace with backend API call when Gemini is ready.
    timeoutRef.current = setTimeout(() => {
      const assistantMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content: getDemoResponse(question),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      setIsTyping(false);
      timeoutRef.current = null;
    }, 800);
  }

  function clearChat() {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

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
            <p className="text-sm text-muted">
              Your Financial Companion
            </p>

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

        {/* Demo Notice */}
        <div className="mb-5 rounded-xl border border-border-custom bg-surface-blue px-4 py-3">
          <p className="text-xs leading-relaxed text-primary">
            <strong>Demo Mode:</strong> Responses are simulated.
            Live Gemini-powered financial insights are coming soon.
          </p>
        </div>

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
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-surface-blue text-foreground"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-surface-blue px-4 py-3 text-sm text-muted">
                  Preparing demo response...
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
            onChange={(event) =>
              setInput(event.target.value)
            }
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
          Demo assistant — not personalized financial advice.
        </p>
      </div>
    </main>
  );
}
