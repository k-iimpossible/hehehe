"use client";

import { useState } from "react";
import type { PublicUser } from "@/lib/types";
import { api } from "@/lib/client";
import {
  ACCOUNT_HELP,
  COLLABORATION,
  OTHER_SERVICES,
  type ServiceDefinition,
  type ServiceId,
} from "@/lib/services";
import { Dialog } from "./Dialog";
import { NavBar } from "./NavBar";

type DialogState = {
  title: string;
  body: string;
  url: string | null;
};

export function HomeDashboard({ user }: { user: PublicUser }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [loadingId, setLoadingId] = useState<ServiceId | null>(null);
  const [error, setError] = useState("");

  async function openService(service: ServiceDefinition) {
    if (!user.flags[service.id]) return;
    setError("");
    setLoadingId(service.id);
    try {
      const result = await api<{ label: string; url: string | null }>(
        `/api/services/${service.id}`,
      );
      setDialog({
        title: result.label,
        url: result.url,
        body: result.url
          ? "This form is issued only after your account was checked on the server."
          : "This service is enabled on your account. Our team will follow up with you on Telegram.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access denied.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="min-h-screen">
      <NavBar user={user} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs tracking-[0.28em] text-[var(--brass)]">
          CLIENT DESK
        </p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">Welcome back</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)]">
          Locked services stay disabled until an administrator enables them.
        </p>
        {error ? (
          <p className="mt-4 text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        <Section title="Account Help">
          <ServiceGrid
            items={ACCOUNT_HELP}
            user={user}
            loadingId={loadingId}
            onOpen={openService}
          />
        </Section>

        <Section title="Other Services">
          <ServiceGrid
            items={OTHER_SERVICES}
            user={user}
            loadingId={loadingId}
            onOpen={openService}
          />
        </Section>

        <section className="panel mt-10 rounded-3xl p-6 sm:p-8">
          <p className="text-xs tracking-[0.22em] text-[var(--brass)]">
            SOMETHING ELSE?
          </p>
          <h2 className="display mt-2 text-3xl">
            Do you have another collaboration idea?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
            If you want to work together on a service that is not listed here,
            send a note through Contact Us.
          </p>
          <div className="mt-6">
            <ServiceButton
              service={COLLABORATION[0]}
              enabled={user.flags.contactUs}
              loading={loadingId === "contactUs"}
              onOpen={openService}
            />
          </div>
        </section>
      </main>

      <Dialog
        open={Boolean(dialog)}
        title={dialog?.title || ""}
        onClose={() => setDialog(null)}
      >
        <p className="text-sm leading-6 text-[var(--muted)]">{dialog?.body}</p>
        {dialog?.url ? (
          <div className="mt-4 space-y-3">
            <p className="break-all rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-3 text-sm">
              {dialog.url}
            </p>
            <a
              href={dialog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[var(--brass)] px-5 py-2.5 text-sm font-medium text-[#1a140c]"
            >
              Open form
            </a>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-4">
        <h2 className="display text-2xl">{title}</h2>
        <div className="hairline flex-1" />
      </div>
      {children}
    </section>
  );
}

function ServiceGrid({
  items,
  user,
  loadingId,
  onOpen,
}: {
  items: ServiceDefinition[];
  user: PublicUser;
  loadingId: ServiceId | null;
  onOpen: (service: ServiceDefinition) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service) => (
        <ServiceButton
          key={service.id}
          service={service}
          enabled={user.flags[service.id]}
          loading={loadingId === service.id}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function ServiceButton({
  service,
  enabled,
  loading,
  onOpen,
}: {
  service: ServiceDefinition;
  enabled: boolean;
  loading: boolean;
  onOpen: (service: ServiceDefinition) => void;
}) {
  return (
    <button
      type="button"
      disabled={!enabled || loading}
      aria-disabled={!enabled}
      title={
        enabled
          ? service.label
          : "This service is not enabled for your account."
      }
      onClick={() => onOpen(service)}
      className={`flex min-h-16 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
        enabled
          ? "border-[var(--line-strong)] bg-[var(--bg-3)] hover:border-[var(--brass)]"
          : "cursor-not-allowed border-[var(--line)] bg-[rgba(255,255,255,0.02)] opacity-45"
      }`}
    >
      <span className="pr-3">{service.label}</span>
      <span className="text-[10px] tracking-[0.18em] text-[var(--muted)]">
        {loading ? "CHECKING" : enabled ? "OPEN" : "LOCKED"}
      </span>
    </button>
  );
}
