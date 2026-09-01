"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PublicUser } from "@/lib/types";
import { api } from "@/lib/client";

export function NavBar({ user }: { user: PublicUser }) {
  const router = useRouter();

  async function signOut() {
    await api("/api/auth/signout", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(11,12,10,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line-strong)] text-[var(--brass)]">
            <ShieldIcon />
          </span>
          <span className="display text-lg tracking-[0.08em] text-[var(--brass)]">
            Hehehe
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/profile">
            Profile
          </Link>
          {user.role === "SUPER_ADMIN" ? (
            <Link className="nav-link" href="/accounts">
              Accounts
            </Link>
          ) : null}
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 5 6.5v5.2c0 4.3 2.9 8.2 7 9.3 4.1-1.1 7-5 7-9.3V6.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M9 12.2 11 14l4-4.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
