
"use client";

import Button, { buttonClass } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import PhoneDisplay from "@/components/ui/PhoneDisplay";
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
import { formatPhone } from "@/lib/phone";
import { showToast } from "@/lib/toast";

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

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-primary">
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
            <h2 className="text-lg font-bold text-primary">
              You&apos;re not logged in
            </h2>

            <p className="mt-2 text-sm text-muted">
              Log in to manage your account settings.
            </p>

            <Link
              href="/login"
              className={buttonClass({
            size: "lg",
            fullWidth: true,
            className: "mt-5",
          })}
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className={buttonClass({
            variant: "secondary",
            size: "lg",
            fullWidth: true,
            className: "mt-3",
          })}
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
  const [profileError, setProfileError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Agent number, read from the backend so it shows on any device
  const [agentPhone, setAgentPhone] = useState<string | null>(
    session.agentPhone
  );
  const [agentLoading, setAgentLoading] = useState(true);

  // Connected banks
  const [banks, setBanks] = useState<BankItem[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Delete account
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load the agent's number saved on the user's account.
  useEffect(() => {
    async function loadAgentPhone() {
      try {
        const response = await authFetch("/api/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load account");
        }

        const data = await response.json();
        setAgentPhone(data.user?.agentPhone ?? null);
      } catch {
        // Keeps whatever number this device already had.
      } finally {
        setAgentLoading(false);
      }
    }

    loadAgentPhone();
  }, []);

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
    setProfileError("");
    setFieldErrors({});

    try {
      await updateProfile({ name, email });

      showToast("Profile saved.");
    } catch (err) {
      if (err instanceof AuthError) {
        setProfileError(err.message);
        setFieldErrors(err.fields);
      } else {
        showToast("Unable to reach the server. Try again.", "error");
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

      showToast("Bank disconnected.");
    } catch {
      showToast("Unable to disconnect that bank. Try again.", "error");
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

    try {
      await deleteAccount();

      clearBankData();
      router.push("/signup");
    } catch {
      showToast("Unable to delete your account. Try again.", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-bold text-primary">
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

            <PhoneDisplay value={session.user.phone} />

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

          <Button
            type="submit"
            disabled={saving}
            size="lg"
            fullWidth
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      {/* Agent */}
      <div className="rounded-2xl bg-primary p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
          Your agent&apos;s number
        </p>

        {agentPhone ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={`sms:${agentPhone}`}
                className="block w-fit rounded-xl transition hover:opacity-90"
              >
                <PhoneDisplay
                  value={agentPhone}
                  tone="onPrimary"
                  size="large"
                />
              </a>

              <CopyButton
                value={agentPhone}
                label="Copy agent number"
              />
            </div>

            <p className="mt-3 text-sm leading-relaxed text-white/85">
              Text this number from{" "}
              {formatPhone(session.user.phone)} to
              reach your finance agent.
            </p>
          </>
        ) : agentLoading ? (
          <>
            <Skeleton className="mt-3 h-8 w-48 !bg-white/20" />
            <Skeleton className="mt-3 h-4 w-full !bg-white/20" />
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Your account doesn&apos;t have an agent number yet.
            Log out and back in to set one up.
          </p>
        )}
      </div>

      {/* Connected Banks */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-primary">
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

                <Button
                  type="button"
                  onClick={() => handleRemoveBank(bank.id)}
                  disabled={removingId === bank.id}
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                >
                  {removingId === bank.id
                    ? "Disconnecting..."
                    : "Disconnect"}
                </Button>
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
        <h2 className="text-lg font-bold text-primary">
          Account
        </h2>

        <Button
          type="button"
          onClick={handleLogout}
          variant="secondary"
          size="lg"
          fullWidth
          className="mt-5"
        >
          Log Out
        </Button>

        <div className="mt-5 border-t border-border-custom pt-5">
          <p className="text-sm font-semibold text-accent">
            Delete account
          </p>

          <p className="mt-1 text-xs leading-relaxed text-muted">
            Permanently removes your profile, connected banks,
            transactions, and messages. This can&apos;t be
            undone.
          </p>

          {confirmingDelete ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                variant="secondary"
                size="lg"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                variant="danger"
                size="lg"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              variant="dangerOutline"
              size="lg"
              fullWidth
              className="mt-4"
            >
              Delete Account
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
