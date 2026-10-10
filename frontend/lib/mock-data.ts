
import type { IconName } from "@/components/ui/Icon";

export const transactions: {
  id: number;
  name: string;
  category: string;
  amount: number;
  icon: IconName;
}[] = [
  {
    id: 1,
    name: "Starbucks",
    category: "Food & Drink",
    amount: -8.75,
    icon: "coffee",
  },
  {
    id: 2,
    name: "Direct Deposit",
    category: "Income",
    amount: 850,
    icon: "income",
  },
  {
    id: 3,
    name: "Target",
    category: "Shopping",
    amount: -42.5,
    icon: "shopping",
  },
  {
    id: 4,
    name: "Chipotle",
    category: "Food & Drink",
    amount: -13.25,
    icon: "food",
  },
];

export const spending = [
  { name: "Food & Drink", amount: 320, color: "#0076A8" },
  { name: "Shopping", amount: 210, color: "#D22E3A" },
  { name: "Transportation", amount: 95, color: "#73B9DF" },
];

export const navigation: {
  label: string;
  icon: IconName;
  href: string;
}[] = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Activity", icon: "activity", href: "/transactions" },
  { label: "Budgets", icon: "budget", href: "/budgets" },
  { label: "Deals", icon: "deals", href: "/deals" },
  { label: "AI Chat", icon: "assistant", href: "/assistant" },
];
