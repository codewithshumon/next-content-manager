"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword } from "./actions";

interface UserRow {
  id: number;
  username: string;
  display_name: string | null;
  created_at: string;
}

// ── Password Change Form ─────────────────────────────────────────────

function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Change password
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">
          New Password
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={4}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex items-center gap-x-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600">Password updated.</p>
      )}
    </form>
  );
}

// ── Quick-links card ──────────────────────────────────────────────────

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-start gap-x-4 rounded-xl border border-slate-200 p-5 transition-all hover:border-indigo-200 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 text-lg">
        {label === "Header" ? "↑" : "↓"}
      </div>
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </Link>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────

export default function SettingsPanel({ user }: { user: UserRow | null }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your admin account and site configuration.</p>
      </div>

      {/* ── User Info ── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Admin User</h2>
        {user ? (
          <div className="mt-3 rounded-xl border border-slate-200 p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-slate-500">Username</span>
                <p className="font-medium text-slate-900">{user.username}</p>
              </div>
              <div>
                <span className="text-slate-500">Display Name</span>
                <p className="font-medium text-slate-900">{user.display_name || "—"}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500">Created</span>
                <p className="font-medium text-slate-900">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <PasswordForm />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No user data available. Restart the server to seed the users table.
          </p>
        )}
      </section>

      {/* ── Header & Footer ── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Site Layout</h2>
        <p className="mt-1 text-sm text-slate-500">
          Edit the header navigation and footer content.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <QuickLink
            href="/admin"
            label="Header"
            description="Site name, navigation links, and brand logo."
          />
          <QuickLink
            href="/admin"
            label="Footer"
            description="Footer text and social links."
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Tip: Select the <strong>Header</strong> or <strong>Footer</strong> tab in the admin sidebar to edit them.
        </p>
      </section>

      {/* ── Back ── */}
      <button
        type="button"
        onClick={() => router.push("/admin")}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        ← Back to admin
      </button>
    </div>
  );
}
