"use client";

import { useMemo, useState } from "react";
import type { PublicUser } from "@/lib/types";
import { api } from "@/lib/client";
import {
  ACCOUNT_HELP,
  COLLABORATION,
  OTHER_SERVICES,
  type ServiceId,
} from "@/lib/services";
import { NavBar } from "./NavBar";

type AdminUser = PublicUser & { createdAt: string };

export function AccountsTable({
  actor,
  initialUsers,
}: {
  actor: PublicUser;
  initialUsers: AdminUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      `${user.telegramId} ${user.accountId}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query, users]);

  async function toggle(user: AdminUser, id: ServiceId, value: boolean) {
    setError("");
    setPending(`${user.id}:${id}`);
    const previous = users;
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, flags: { ...item.flags, [id]: value } }
          : item,
      ),
    );
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ flags: { [id]: value } }),
      });
    } catch (err) {
      setUsers(previous);
      setError(err instanceof Error ? err.message : "Could not save flags.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar user={actor} />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <p className="text-xs tracking-[0.28em] text-[var(--brass)]">
          SUPER ADMIN
        </p>
        <h1 className="display mt-2 text-4xl">Accounts</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Enable or disable each service per account. Changes are saved
          immediately and enforced on the server.
        </p>

        <input
          className="mt-6 w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-3 py-3 outline-none ring-[var(--brass)] focus:ring-1"
          placeholder="Search Telegram ID or account ID"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {error ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="panel mt-6 overflow-x-auto rounded-3xl">
          <table className="min-w-[1100px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-[11px] tracking-[0.12em] text-[var(--muted)]">
                <th className="sticky left-0 bg-[var(--bg-2)] px-4 py-3">Account</th>
                {ACCOUNT_HELP.map((service) => (
                  <th key={service.id} className="px-2 py-3">
                    {service.shortLabel}
                  </th>
                ))}
                {OTHER_SERVICES.map((service) => (
                  <th key={service.id} className="px-2 py-3">
                    {service.shortLabel}
                  </th>
                ))}
                {COLLABORATION.map((service) => (
                  <th key={service.id} className="px-2 py-3">
                    {service.shortLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[var(--line)]">
                  <td className="sticky left-0 bg-[var(--bg-2)] px-4 py-3">
                    <p>{user.telegramId}</p>
                    <p className="font-mono text-[11px] text-[var(--muted)]">
                      {user.accountId}
                      {user.role === "SUPER_ADMIN" ? " · admin" : ""}
                    </p>
                  </td>
                  {[...ACCOUNT_HELP, ...OTHER_SERVICES, ...COLLABORATION].map(
                    (service) => (
                      <td key={service.id} className="px-2 py-3">
                        <input
                          type="checkbox"
                          checked={user.flags[service.id]}
                          disabled={pending === `${user.id}:${service.id}`}
                          onChange={(event) =>
                            toggle(user, service.id, event.target.checked)
                          }
                          aria-label={`${service.label} for ${user.telegramId}`}
                        />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
