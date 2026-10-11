
"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import PhoneField, {
  getPhoneError,
} from "@/components/auth/PhoneField";
import TextField from "@/components/auth/TextField";
import Icon, { type IconName } from "@/components/ui/Icon";
import { AuthError, login, type FieldErrors } from "@/lib/auth";

// What the app does, listed in the blue panel beside the form on desktop.
const BRAND_POINTS: { icon: IconName; text: string }[] = [
  { icon: "wallet", text: "Balances and transactions from your bank" },
  { icon: "budget", text: "Budgets and savings goals" },
  { icon: "deals", text: "Student discounts where you shop" },
];

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("+1");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Changing the key remounts the phone boxes, which empties them.
  const [formKey, setFormKey] = useState(0);

  // The page keeps its state after navigating away, so it is cleared by hand once the user is in.
  function resetForm() {
    setPhone("+1");
    setPassword("");
    setError("");
    setFieldErrors({});
    setSubmitting(false);
    setFormKey((key) => key + 1);
  }

  async function handleSubmit() {
    setError("");
    setFieldErrors({});

    const phoneError = getPhoneError(phone);

    if (phoneError) {
      setFieldErrors({ phone: phoneError });
      return;
    }

    setSubmitting(true);

    try {
      await login({ phone, password });

      resetForm();
      router.push("/");
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError("Unable to reach the server. Try again.");
      }

      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-2">

      {/* Brand Panel */}
      <aside className="hidden bg-primary p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="font-display text-xl font-bold tracking-tight">
          B2B
        </p>

        <div>
          <h2 className="max-w-md text-4xl font-bold tracking-tight">
            Your money, one text away.
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-blue-100">
            See your balances and budgets in one place, and text your
            finance agent whenever you have a question.
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

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12 sm:px-8">

        {/* Page Header */}
        <header className="mb-8">
          <p className="mb-8 font-display text-xl font-bold tracking-tight text-primary lg:hidden">
            B2B
          </p>

          <p className="text-sm text-muted">
            Log in
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-muted">
            Log in to see your accounts, budgets, and offers.
          </p>
        </header>

        <Card className="sm:p-6">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
            className="space-y-5"
          >
            <PhoneField
              key={formKey}
              id="login-phone"
              label="Phone number"
              onChange={setPhone}
              error={fieldErrors.phone}
            />

            <TextField
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              error={fieldErrors.password}
            />

            {error && (
              <p role="alert" className="text-sm text-accent">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              fullWidth
            >
              {submitting ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-secondary hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
