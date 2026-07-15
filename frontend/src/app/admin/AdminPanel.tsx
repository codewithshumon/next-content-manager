"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { updatePage, logout } from "./actions";

// ── types ─────────────────────────────────────────────────────────────

interface AdminField {
  name: string;
  type: string;
  value: string | number;
}

interface AdminPage {
  pagePath: string;
  label?: string;
  fields: AdminField[];
  children?: AdminPage[];
}

// ── helpers ───────────────────────────────────────────────────────────

function pageLabel(pagePath: string): string {
  if (pagePath === "/") return "Home";
  // /about      → About
  // /about/team → Team
  const parts = pagePath.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/** Flatten nested page tree into ordered tab list with depth info */
function flattenPages(
  pages: AdminPage[],
  depth = 0,
): (AdminPage & { depth: number })[] {
  const flat: (AdminPage & { depth: number })[] = [];
  for (const p of pages) {
    flat.push({ ...p, label: pageLabel(p.pagePath), depth });
    if (p.children) {
      flat.push(...flattenPages(p.children, depth + 1));
    }
  }
  return flat;
}

/** Build a nested page tree from a flat list sorted by path. */
function buildPageTree(pages: AdminPage[]): AdminPage[] {
  const sorted = [...pages].sort((a, b) => a.pagePath.localeCompare(b.pagePath));
  const tree: AdminPage[] = [];

  for (const page of sorted) {
    const parts = page.pagePath.split("/").filter(Boolean);
    if (parts.length === 0) {
      // root "/"
      tree.push(page);
      continue;
    }

    // Find parent path
    const parentPath = "/" + parts.slice(0, -1).join("/");
    const parent = findPage(tree, parentPath);

    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(page);
    } else {
      tree.push(page);
    }
  }

  return tree;
}

function findPage(pages: AdminPage[], pagePath: string): AdminPage | null {
  for (const p of pages) {
    if (p.pagePath === pagePath) return p;
    if (p.children) {
      const found = findPage(p.children, pagePath);
      if (found) return found;
    }
  }
  return null;
}

// ── components ────────────────────────────────────────────────────────

function PageEditForm({
  page,
  onSaved,
}: {
  page: AdminPage;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    (_prevState: unknown, fd: FormData) =>
      updatePage(page.pagePath, page.fields, null, fd).then((r) => {
        if (r?.success) onSaved();
        return r;
      }),
    null,
  );

  return (
    <form action={formAction} className="space-y-6">
      {page.fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1.5 block text-sm font-medium capitalize text-slate-600">
            {field.name.replace(/([A-Z])/g, " $1").trim()}
          </label>

          {/* Text input */}
          {field.type === "text" && (
            <textarea
              name={field.name}
              defaultValue={String(field.value ?? "")}
              rows={field.name === "bio" || field.name.includes("Subtitle") ? 3 : 1}
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          )}

          {/* Number input */}
          {(field.type === "integer" || field.type === "numeric") && (
            <input
              name={field.name}
              type="number"
              defaultValue={field.value}
              className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          )}

          {/* Image field */}
          {field.type === "image" && (
            <div className="space-y-3">
              {field.value && (
                <img
                  src={String(field.value)}
                  alt={field.name}
                  className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
                />
              )}
              <input
                name={`${field.name}_url`}
                type="text"
                defaultValue={String(field.value ?? "")}
                placeholder="/img/photo.jpg or https://…"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                name={field.name}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}

          {/* File field */}
          {field.type === "file" && (
            <div className="space-y-3">
              {field.value && (
                <a
                  href={String(field.value)}
                  target="_blank"
                  className="inline-block text-sm text-indigo-600 underline"
                >
                  Current file: {String(field.value).split("/").pop()}
                </a>
              )}
              <input
                name={`${field.name}_url`}
                type="text"
                defaultValue={String(field.value ?? "")}
                placeholder="/files/doc.pdf or https://…"
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                name={field.name}
                type="file"
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          )}
        </div>
      ))}

      {/* Feedback */}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          ✓ Saved successfully!
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

// ── main panel ────────────────────────────────────────────────────────

export default function AdminPanel({ pages }: { pages: AdminPage[] }) {
  const router = useRouter();
  const tree = buildPageTree(pages);
  const flatTabs = flattenPages(tree);
  const [activePath, setActivePath] = useState(flatTabs[0]?.pagePath ?? "");
  const [savedKey, setSavedKey] = useState(0);

  const activePage = pages.find((p) => p.pagePath === activePath);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
        <nav className="space-y-0.5">
          {flatTabs.map((tab) => (
            <button
              key={tab.pagePath}
              onClick={() => setActivePath(tab.pagePath)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activePath === tab.pagePath
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              style={{ paddingLeft: `${12 + tab.depth * 16}px` }}
            >
              {tab.depth > 0 && (
                <span className="mr-1 text-slate-300">└</span>
              )}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">
              {activePage
                ? pageLabel(activePage.pagePath)
                : "Select a page"}
            </h2>
            {activePage && (
              <p className="mt-1 text-sm text-slate-500">
                {activePage.pagePath}
              </p>
            )}
          </div>

          {activePage && (
            <PageEditForm
              key={`${activePage.pagePath}-${savedKey}`}
              page={activePage}
              onSaved={() => {
                setSavedKey((k) => k + 1);
                router.refresh();
              }}
            />
          )}

          {!activePage && (
            <p className="text-sm text-slate-400">
              No pages registered yet. Create a schema file in{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-700">
                src/cocms/
              </code>{" "}
              and restart the server.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
