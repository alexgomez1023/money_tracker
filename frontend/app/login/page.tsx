
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import PhoneField, {
  getPhoneError,
} from "@/components/auth/PhoneField";
import TextField from "@/components/auth/TextField";
import { AuthError, login, type FieldErrors } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("+1");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formKey, setFormKey] = useState(0);

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

      setPhone("+1");
      setPassword("");
      setFormKey((key) => key + 1);

      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError("Unable to reach the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F6FB] text-[#15315D]">
      

      {/* Main content */}
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-24">
        {/* Left introduction */}
        <section className="hidden lg:block">
          <span className="inline-flex rounded-full bg-[#E2EBF8] px-4 py-2 text-sm font-semibold text-[#153B78]">
            SMARTER STUDENT FINANCES
          </span>

          <h1 className="mt-7 text-5xl font-bold leading-tight tracking-tight">
            Take control of
            <span className="block text-[#D52B41]">
              your money.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-8 text-[#64748B]">
            Track your spending, manage budgets, discover student
            deals, and build better financial habits—all in one place.
          </p>

          <div className="mt-10 space-y-4 text-sm font-medium text-[#15315D]">
            <p>✓ Track your accounts and spending</p>
            <p>✓ Create smarter monthly budgets</p>
            <p>✓ Discover personalized student deals</p>
            <p>✓ Get AI-powered financial insights</p>
          </div>
        </section>

        {/* Login card */}
        <section className="rounded-3xl border border-[#DFE6F0] bg-white p-7 shadow-xl shadow-[#153B78]/5 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D52B41]">
              Secure sign in
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Sign in to access your financial dashboard.
            </p>
          </div>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
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
              <p role="alert" className="text-sm text-[#C5253A]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              fullWidth
            >
              {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 border-t border-[#E8EDF4] pt-6 text-center">
            <p className="text-sm text-[#64748B]">
              New to Money Tracker?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#153B78] hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>

      <footer className="px-6 pb-8 text-center text-xs text-[#94A3B8]">
        Money Tracker · Built for smarter student finances
      </footer>
    </main>
  );
}
