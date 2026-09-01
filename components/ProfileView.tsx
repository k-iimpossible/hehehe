"use client";

import { useState } from "react";
import type { PublicUser } from "@/lib/types";
import { api } from "@/lib/client";
import { NavBar } from "./NavBar";

export function ProfileView({ user }: { user: PublicUser }) {
  const [copied, setCopied] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function copyAccountId() {
    await navigator.clipboard.writeText(user.accountId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar user={user} />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-xs tracking-[0.28em] text-[var(--brass)]">PROFILE</p>
        <h1 className="display mt-2 text-4xl">Your account</h1>
        <p className="mt-3 text-[var(--muted)]">
          Account ID is assigned at sign-up and never changes. Passwords are
          stored as one-way hashes, so the original value cannot be shown.
        </p>

        <div className="panel mt-8 space-y-5 rounded-3xl p-6">
          <Row label="Telegram ID" value={user.telegramId} />
          <Row label="Password" value="••••••••••••" />
          <div>
            <p className="text-xs tracking-[0.16em] text-[var(--muted)]">
              Account ID
            </p>
            <div className="mt-1 flex items-center gap-3">
              <p className="font-mono text-lg tracking-wide">{user.accountId}</p>
              <button
                type="button"
                onClick={copyAccountId}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <form
          onSubmit={changePassword}
          className="panel mt-6 space-y-4 rounded-3xl p-6"
        >
          <h2 className="display text-2xl">Change password</h2>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.16em] text-[var(--muted)]">
              Current password
            </span>
            <input
              type="password"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 outline-none ring-[var(--brass)] focus:ring-1"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs tracking-[0.16em] text-[var(--muted)]">
              New password
            </span>
            <input
              type="password"
              minLength={8}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 outline-none ring-[var(--brass)] focus:ring-1"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="text-sm text-[var(--ok)]">{message}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[var(--brass)] px-5 py-2.5 text-sm font-medium text-[#1a140c] disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save password"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
    </div>
  );
}
