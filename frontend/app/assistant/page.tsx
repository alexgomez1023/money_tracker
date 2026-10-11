
"use client";

import { useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { authFetch } from "@/lib/auth";
import {
  loadBudgets,
  saveBudgetLimits,
} from "@/lib/budget-storage";
import { getSavingsGoals } from "@/lib/plaid-savings";

type ProposedBudget = {
  category: string;
  limit: number;
};

type ProposedPlan = {
  budgets: ProposedBudget[];
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  proposedPlan?: ProposedPlan | null;
  planStatus?: "idle" | "applying" | "applied" | "error";
};

const BUDGET_CATEGORIES = [
  "Food & Drink",
  "Shopping",
  "Transportation",
  "Other",
];

const suggestedQuestions = [
  "Create a monthly budget based on my spending",
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
      "Hi! I'm your AI Finance Assistant. I can help you review your spending, track budgets, understand your account balances, and work toward your savings goals. I can also create a monthly budget plan for you to review and apply. What would you like to discuss?",
  },
];

function isValidProposedPlan(value: unknown): value is ProposedPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as { budgets?: unknown };

  if (
    !Array.isArray(plan.budgets) ||
    plan.budgets.length === 0 ||
    plan.budgets.length > BUDGET_CATEGORIES.length
  ) {
    return false;
  }

  const seen = new Set<string>();

  for (const item of plan.budgets) {
    if (!item || typeof item !== "object") {
      return false;
    }

    const budget = item as {
      category?: unknown;
      limit?: unknown;
    };

    if (
      typeof budget.category !== "string" ||
      !BUDGET_CATEGORIES.includes(budget.category) ||
      seen.has(budget.category)
    ) {
      return false;
    }

    if (
      typeof budget.limit !== "number" ||
      !Number.isFinite(budget.limit) ||
      budget.limit <= 0 ||
      budget.limit > 1000000
    ) {
      return false;
    }

    seen.add(budget.category);
  }

  return true;
}

export default function AssistantPage() {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);
  const sendingRef = useRef(false);
  const applyingRef = useRef(new Set<number>());
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

    if (
      !question ||
      question.length > 1000 ||
      sendingRef.current
    ) {
      return;
    }

    sendingRef.current = true;

    const chatVersion = chatVersionRef.current;

    const userMessage: Message = {
      id: nextIdRef.current++,
      role: "user",
      content: question,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setIsTyping(true);

    try {
      // Read the user's latest saved budget limits.
      const budgets = (await loadBudgets()).map(
        (budget) => ({
          category: budget.category,
          limit: budget.limit,
        })
      );

      // Read the user's latest savings goals.
      const savingsGoals = getSavingsGoals();

      const response = await authFetch(
        "/api/finance-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            budgets,
            savingsGoals,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The finance assistant returned an unexpected response. Check that the backend is running."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "Unable to answer your question."
        );
      }

      // Ignore responses from a previous chat.
      if (chatVersion !== chatVersionRef.current) {
        return;
      }

      const proposedPlan = isValidProposedPlan(
        data.proposedPlan
      )
        ? data.proposedPlan
        : null;

      const assistantMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content:
          typeof data.reply === "string" &&
          data.reply.trim()
            ? data.reply
            : "The assistant returned an empty response.",
        proposedPlan,
        planStatus: "idle",
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      if (chatVersion !== chatVersionRef.current) {
        return;
      }

      const errorMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      };

      setMessages((current) => [
        ...current,
        errorMessage,
      ]);
    } finally {
      if (chatVersion === chatVersionRef.current) {
        sendingRef.current = false;
        setIsTyping(false);
      }
    }
  }

  async function applyPlan(messageId: number) {
    if (applyingRef.current.has(messageId)) {
      return;
    }

    const message = messages.find(
      (item) => item.id === messageId
    );

    if (
      !message ||
      !isValidProposedPlan(message.proposedPlan) ||
      message.planStatus === "applying" ||
      message.planStatus === "applied"
    ) {
      return;
    }

    const proposedBudgets =
      message.proposedPlan.budgets;

    const chatVersion = chatVersionRef.current;

    applyingRef.current.add(messageId);

    setMessages((current) =>
      current.map((item) =>
        item.id === messageId
          ? {
              ...item,
              planStatus: "applying",
            }
          : item
      )
    );

    try {
      // Send only the proposed categories.
      // The existing backend preserves all other limits.
      const response = await authFetch(
        "/api/budgets",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            budgets: proposedBudgets,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to save the budget plan."
        );
      }

      // Refresh other budget views.
      // The existing storage helper broadcasts this event.
      // Here we trigger it directly because this request
      // saves only the proposed categories.
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event("budgets-updated")
        );
      }

      if (chatVersion !== chatVersionRef.current) {
        return;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                planStatus: "applied",
              }
            : item
        )
      );
    } catch {
      if (chatVersion !== chatVersionRef.current) {
        return;
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === messageId
            ? {
                ...item,
                planStatus: "error",
              }
            : item
        )
      );
    } finally {
      applyingRef.current.delete(messageId);
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
            <p className="text-sm text-muted">
              Your Financial Companion
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
              AI Finance Assistant
            </h1>

            <p className="mt-2 text-sm text-muted">
              Ask questions about your money or create a budget plan.
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
                  <p className="whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* AI Budget Proposal */}
                  {message.role === "assistant" &&
                    message.proposedPlan && (
                      <div className="mt-4 rounded-xl border border-border-custom bg-white p-4">
                        <h3 className="font-bold text-primary">
                          Suggested Monthly Budget
                        </h3>

                        <p className="mt-1 text-xs text-muted">
                          Review these limits before saving them
                          to your account.
                        </p>

                        <div className="mt-4 space-y-3">
                          {message.proposedPlan.budgets.map(
                            (budget) => (
                              <div
                                key={budget.category}
                                className="flex items-center justify-between gap-4"
                              >
                                <span className="text-sm text-foreground">
                                  {budget.category}
                                </span>

                                <span className="text-sm font-semibold text-primary">
                                  $
                                  {budget.limit.toFixed(2)}
                                </span>
                              </div>
                            )
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            applyPlan(message.id)
                          }
                          disabled={
                            message.planStatus ===
                              "applying" ||
                            message.planStatus ===
                              "applied"
                          }
                          className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {message.planStatus ===
                          "applying"
                            ? "Applying Plan..."
                            : message.planStatus ===
                                "applied"
                              ? "Plan Applied"
                              : "Apply Plan"}
                        </button>

                        {message.planStatus ===
                          "applied" && (
                          <p className="mt-3 text-center text-xs font-semibold text-secondary">
                            Budget updated successfully!
                            Your new limits are available
                            in the Budgets tab.
                          </p>
                        )}

                        {message.planStatus ===
                          "error" && (
                          <p className="mt-3 text-center text-xs text-accent">
                            Unable to save your budget.
                            Please try again.
                          </p>
                        )}
                      </div>
                    )}
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
          <label
            htmlFor="chat-input"
            className="sr-only"
          >
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
            maxLength={1000}
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
          Financial information is for educational purposes only,
          not personalized financial advice.
        </p>
      </div>
    </main>
  );
}
