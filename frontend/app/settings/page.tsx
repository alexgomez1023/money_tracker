
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import TextField from "@/components/auth/TextField";
import {
  AuthError,
  authFetch,
  deleteAccount,
  logout,
  updateProfile,
  useSession,
  type FieldErrors,
  type Session,
} from "@/lib/auth";
import { clearBankData } from "@/lib/bank-data";

type BankItem = {
  id: string;
  institutionName: string | null;
  status: string;
};

export default function SettingsPage() {
  const session = useSession();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 pb-32 pt-8 sm:px-8">

        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm text-muted">
            Your account
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary">
            Settings
          </h1>

          <p className="mt-2 text-sm text-muted">
            Manage your profile, agent, and connected banks.
          </p>
        </header>

        {session ? (
          <SettingsSections
            key={session.user.id}
            session={session}
          />
        ) : (
          <Card>
            <h2 className="font-bold text-primary">
              You&apos;re not logged in
            </h2>

            <p className="mt-2 text-sm text-muted">
              Log in to manage your account settings.
            </p>

            <Link
              href="/login"
              className="mt-5 block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-primary-hover"
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="mt-3 block w-full rounded-xl border border-border-custom bg-white px-4 py-3 text-center text-sm font-semibold text-primary transition hover:bg-surface-blue"
            >
              Create an Account
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}

function SettingsSections({ session }: { session: Session }) {
  const router = useRouter();

  // Profile form
  const [name, setName] = useState(session.user.name);
  const [email, setEmail] = useState(session.user.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Connected banks
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Delete account
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Load the user's connected banks.
  useEffect(() => {
    async function loadBanks() {
      try {
        const response = await authFetch("/api/plaid/items", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load banks");
        }

        const data = await response.json();
        setBanks(data.items ?? []);
      } catch {
        setBanksError("Unable to load your connected banks.");
      } finally {
        setBanksLoading(false);
      }
    }

    loadBanks();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setSaved(false);
    setProfileError("");
    setFieldErrors({});

    try {
      await updateProfile({ name, email });

      setSaved(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setProfileError(err.message);
        setFieldErrors(err.fields);
      } else {
        setProfileError("Unable to reach the server. Try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveBank(id: string) {
    setRemovingId(id);
    setBanksError("");

    try {
      const response = await authFetch(`/api/plaid/items/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to disconnect bank");
      }

      clearBankData();
      setBanks((current) =>
        current.filter((bank) => bank.id !== id)
      );
    } catch {
      setBanksError("Unable to disconnect that bank. Try again.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleLogout() {
    await logout();

    router.push("/login");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");

    try {
      await deleteAccount();

      clearBankData();
      router.push("/signup");
    } catch {
      setDeleteError("Unable to delete your account. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Profile */}
      <Card>
        <h2 className="font-bold text-primary">
          Profile
        </h2>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveProfile();
          }}
          className="mt-5 space-y-5"
        >
          <TextField
            id="settings-name"
            label="Name"
            value={name}
            onChange={setName}
            autoComplete="name"
            error={fieldErrors.name}
          />

          <TextField
            id="settings-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            error={fieldErrors.email}
          />

          <div>
            <p className="mb-2 text-sm font-semibold text-primary">
              Phone number
            </p>

            <p className="rounded-xl bg-surface-blue px-4 py-3 text-sm text-foreground">
              {session.user.phone}
            </p>

            <p className="mt-2 text-xs text-muted">
              Your phone number is your login and can&apos;t be
              changed.
            </p>
          </div>

          {profileError && (
            <p role="alert" className="text-sm text-accent">
              {profileError}
            </p>
          )}

          {saved && (
            <p role="status" className="text-sm text-secondary">
              Profile saved.
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </Card>

      {/* Agent */}
      <div className="rounded-2xl bg-primary p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
          Your agent&apos;s number
        </p>

        {session.agentPhone ? (
          <>
            <a
              href={`sms:${session.agentPhone}`}
              className="mt-2 block text-2xl font-bold tracking-tight hover:underline"
            >
              {session.agentPhone}
            </a>

            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Text this number from {session.user.phone} to
              reach your finance agent.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Your agent&apos;s number is shown when you sign up
            and isn&apos;t available on this device.
          </p>
        )}
      </div>

      {/* Connected Banks */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-primary">
            Connected Banks
          </h2>

          <Link
            href="/connect-bank"
            className="text-sm font-semibold text-secondary hover:text-primary"
          >
            Connect a bank
          </Link>
        </div>

        {banksError && (
          <p role="alert" className="mt-3 text-sm text-accent">
            {banksError}
          </p>
        )}

        {banksLoading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-12 w-full !rounded-xl" />
            <Skeleton className="h-12 w-full !rounded-xl" />
          </div>
        ) : banks.length > 0 ? (
          <div className="mt-4 divide-y divide-border-custom">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {bank.institutionName ?? "Bank account"}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      bank.status === "active"
                        ? "text-muted"
                        : "text-accent"
                    }`}
                  >
                    {bank.status === "active"
                      ? "Connected"
                      : "Needs to be reconnected"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveBank(bank.id)}
                  disabled={removingId === bank.id}
                  className="shrink-0 rounded-xl border border-border-custom bg-white px-4 py-2 text-xs font-semibold text-primary transition hover:bg-surface-blue disabled:opacity-60"
                >
                  {removingId === bank.id
                    ? "Disconnecting..."
                    : "Disconnect"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          !banksError && (
            <p className="mt-3 text-sm text-muted">
              No banks connected yet.
            </p>
          )
        )}
      </Card>

      {/* Account */}
      <Card>
        <h2 className="font-bold text-primary">
          Account
        </h2>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 w-full rounded-xl border border-border-custom bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface-blue"
        >
          Log Out
        </button>

        <div className="mt-5 border-t border-border-custom pt-5">
          <p className="text-sm font-semibold text-accent">
            Delete account
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted">
            Permanently removes your profile, connected banks,
            transactions, and messages. This can&apos;t be
            undone.
          </p>

          {deleteError && (
            <p role="alert" className="mt-3 text-sm text-accent">
              {deleteError}
            </p>
          )}

          {confirmingDelete ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-xl border border-border-custom bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface-blue disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="mt-4 w-full rounded-xl border border-accent bg-white px-4 py-3 text-sm font-semibold text-accent transition hover:bg-accent hover:text-white"
            >
              Delete Account
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
