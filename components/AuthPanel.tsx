"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Mode = "signin" | "signup";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [password, setPassword] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signin") {
        await api("/api/auth/signin", {
          method: "POST",
          body: JSON.stringify({ telegramId, password }),
        });
      } else {
        await api("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ telegramId, password }),
        });
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute left-8 top-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line-strong)] text-[var(--brass)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 5 6.5v5.2c0 4.3 2.9 8.2 7 9.3 4.1-1.1 7-5 7-9.3V6.5L12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </span>
        <span className="display text-lg tracking-[0.08em] text-[var(--brass)]">
          Hehehe
        </span>
      </div>

      <section className="panel w-full max-w-md rounded-3xl p-8">
        <p className="mb-2 text-xs tracking-[0.28em] text-[var(--brass)]">
          SECURE ACCESS
        </p>
        <h1 className="display mb-2 text-4xl">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
          {mode === "signin"
            ? "Enter your Telegram ID and password to unlock the portal."
            : "Provide your Telegram ID and a password to create an account."}
        </p>

        <div className="mb-6 grid grid-cols-2 rounded-full border border-[var(--line)] p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`rounded-full py-2 text-sm ${mode === "signin" ? "bg-[var(--brass)] text-[#1a140c]" : "text-[var(--muted)]"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-full py-2 text-sm ${mode === "signup" ? "bg-[var(--brass)] text-[#1a140c]" : "text-[var(--muted)]"}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Telegram ID"
            type="text"
            autoComplete="username"
            placeholder="@username"
            value={telegramId}
            onChange={setTelegramId}
            required
          />
          <Field
            label="Password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={setPassword}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />

          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-[var(--brass)] py-3 font-medium text-[#1a140c] disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Unlock portal"
                : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  required,
  autoComplete,
  placeholder,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs tracking-[0.16em] text-[var(--muted)]">
        {label}
      </span>
      <input
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 outline-none ring-[var(--brass)] focus:ring-1"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
      />
    </label>
  );
}
