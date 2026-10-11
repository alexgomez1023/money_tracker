import Icon, { type IconName } from "@/components/ui/Icon";

// What the app does, listed under the headline.
const BRAND_POINTS: { icon: IconName; text: string }[] = [
  { icon: "wallet", text: "Balances and transactions from your bank" },
  { icon: "budget", text: "Budgets and savings goals" },
  { icon: "deals", text: "Student discounts where you shop" },
];

// The blue panel beside the login and signup forms. Only desktop has room for it.
export default function BrandPanel() {
  return (
    <aside className="hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <p className="font-display text-xl font-bold tracking-tight">B2B</p>

      <div>
        <h2 className="max-w-md text-4xl font-bold tracking-tight">
          Your money, one text away.
        </h2>

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
          See your balances and budgets in one place, and text your finance
          agent whenever you have a question.
        </p>
      </div>

      <ul className="space-y-4 border-t border-white/20 pt-6">
        {BRAND_POINTS.map((point) => (
          <li
            key={point.text}
            className="flex items-center gap-3 text-sm text-blue-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
              <Icon name={point.icon} size={18} />
            </span>

            {point.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
