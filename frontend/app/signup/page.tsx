
"use client";

import Button, { buttonClass } from "@/components/ui/Button";
import { useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import PhoneDisplay from "@/components/ui/PhoneDisplay";
import PhoneField, {
  getPhoneError,
} from "@/components/auth/PhoneField";
import TextField from "@/components/auth/TextField";
import {
  AuthError,
  signup,
  type FieldErrors,
  type Session,
} from "@/lib/auth";
import { formatPhone } from "@/lib/phone";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+1");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Set once the account exists, which switches the page to the agent number.
  const [session, setSession] = useState<Session | null>(null);

  // Changing the key remounts the phone boxes, which empties them.
  const [formKey, setFormKey] = useState(0);

  // The page keeps its state after navigating away, so the form is cleared by hand once the account exists.
  function resetForm() {
    setName("");
    setPhone("+1");
    setEmail("");
    setPassword("");
    setError("");
    setFieldErrors({});
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
      setSession(await signup({ name, phone, email, password }));

      resetForm();
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
        setFieldErrors(err.fields);
      } else {
        setError("Unable to reach the server. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (session) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-md px-5 pb-12 pt-12 sm:px-8">

          {/* Page Header */}
          <header className="mb-8">
            <p className="text-sm text-muted">
              Account created
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
              Welcome, {session.user.name}
            </h1>

            <p className="mt-2 text-sm text-muted">
              Your personal finance agent is ready.
            </p>
          </header>

          {/* Agent Number */}
          <div className="mb-6 rounded-2xl bg-primary p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
              Your agent&apos;s number
            </p>

            {session.agentPhone ? (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={`sms:${session.agentPhone}`}
                    className="block w-fit rounded-xl transition hover:opacity-90"
                  >
                    <PhoneDisplay
                      value={session.agentPhone}
                      tone="onPrimary"
                      size="large"
                    />
                  </a>

                  <CopyButton
                    value={session.agentPhone}
                    label="Copy agent number"
                  />
                </div>

                <p className="mt-3 text-sm leading-relaxed text-white/85">
                  Text this number from{" "}
                  {formatPhone(session.user.phone)} to ask
                  about your spending or find student discounts.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                We couldn&apos;t get your agent&apos;s number
                yet. You can still use the app.
              </p>
            )}
          </div>

          <Card>
            <h2 className="text-lg font-bold text-primary">
              Next step
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-muted">
              Connect a bank so your agent and dashboard have
              transactions to work with.
            </p>

            <Link
              href="/connect-bank"
              onClick={() => setSession(null)}
              className={buttonClass({
                size: "lg",
                fullWidth: true,
                className: "mt-5",
              })}
            >
              Connect Your Bank
            </Link>

            <Link
              href="/"
              onClick={() => setSession(null)}
              className={buttonClass({
                variant: "secondary",
                size: "lg",
                fullWidth: true,
                className: "mt-3",
              })}
            >
              Go to Dashboard
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-5 pb-12 pt-12 sm:px-8">

        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            B2B
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-muted">
            Sign up to get a finance agent you can text.
          </p>
        </header>

        <Card>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
            className="space-y-5"
          >
            <TextField
              id="signup-name"
              label="Name"
              value={name}
              onChange={setName}
              autoComplete="name"
              error={fieldErrors.name}
            />

            <PhoneField
              key={formKey}
              id="signup-phone"
              label="Phone number"
              onChange={setPhone}
              hint="This is the number you'll text your agent from."
              error={fieldErrors.phone}
            />

            <TextField
              id="signup-email"
              label="Email (optional)"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              error={fieldErrors.email}
            />

            <TextField
              id="signup-password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint="At least 8 characters."
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
              {submitting ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-secondary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
