"use client";

import Button from "@/components/ui/Button";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import BrandPanel from "@/components/auth/BrandPanel";
import PhoneField, { getPhoneError } from "@/components/auth/PhoneField";
import TextField from "@/components/auth/TextField";
import { AuthError, login, type FieldErrors } from "@/lib/auth";

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
      <BrandPanel />

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-12 sm:px-8">
        {/* Page Header */}
        <header className="mb-8">
          <p className="mb-8 font-display text-xl font-bold tracking-tight text-primary lg:hidden">
            B2B
          </p>

          <p className="text-sm text-muted">Log in</p>

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

            <Button type="submit" disabled={submitting} size="lg" fullWidth>
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
