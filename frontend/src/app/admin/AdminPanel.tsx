"use client";

import { useState, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updatePage, logout } from "./actions";
import type { AdminField, AdminPage } from "@/cocms/client";
import type { ArrayItemSchema } from "@/cocms/types";

// ── helpers ───────────────────────────────────────────────────────────

function pageLabel(pagePath: string): string {
  if (pagePath === "/") return "Home";
  if (pagePath === "/__header") return "Header";
  if (pagePath === "/__footer") return "Footer";
  const parts = pagePath.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

function fieldLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

interface FlatTab {
  pagePath: string;
  label: string;
  depth: number;
  hasChildren: boolean;
}

/** Build a tree where top-level pages (depth-1 from /) are siblings of Home. */
function buildSidebarTabs(pages: AdminPage[]): FlatTab[] {
  const sorted = [...pages].sort((a, b) =>
    a.pagePath.localeCompare(b.pagePath),
  );
  const childrenMap = new Map<string, AdminPage[]>();

  for (const page of sorted) {
    const parts = page.pagePath.split("/").filter(Boolean);
    if (parts.length <= 1) continue; // top-level, no parent
    const parentPath = "/" + parts.slice(0, -1).join("/");
    if (!childrenMap.has(parentPath)) childrenMap.set(parentPath, []);
    childrenMap.get(parentPath)!.push(page);
  }

  const tabs: FlatTab[] = [];
  for (const page of sorted) {
    const parts = page.pagePath.split("/").filter(Boolean);
    if (parts.length > 1) continue; // nested — handled by parent group
    const children = childrenMap.get(page.pagePath);
    tabs.push({
      pagePath: page.pagePath,
      label: pageLabel(page.pagePath),
      depth: 0,
      hasChildren: !!children && children.length > 0,
    });
    if (children) {
      // "Main" entry for the parent page itself
      tabs.push({
        pagePath: page.pagePath,
        label: "Main",
        depth: 1,
        hasChildren: false,
      });
      for (const child of children) {
        tabs.push({
          pagePath: child.pagePath,
          label: pageLabel(child.pagePath),
          depth: 1,
          hasChildren: false,
        });
      }
    }
  }
  return tabs;
}

/** Create a default value for a new array item based on the item schema. */
function newItemDefault(schema: ArrayItemSchema): unknown {
  if (schema.itemType === "string") return "";
  if (schema.itemType === "number") return 0;
  if (schema.itemType === "object") {
    const obj: Record<string, unknown> = {};
    for (const [key, fType] of Object.entries(schema.fields)) {
      switch (fType) {
        case "integer":
        case "numeric":
          obj[key] = 0;
          break;
        case "image":
        case "file":
        case "text":
        default:
          obj[key] = "";
      }
    }
    return obj;
  }
  return "";
}

// ── Array Field Editor ────────────────────────────────────────────────

function ArrayFieldEditor({ field }: { field: AdminField }) {
  const initial: unknown[] =
    field.value && typeof field.value === "object" && Array.isArray(field.value)
      ? (field.value as unknown[])
      : [];

  const [items, setItems] = useState<unknown[]>(initial);
  const schema = field.fieldMeta;

  const addItem = useCallback(() => {
    if (!schema) return;
    setItems((prev) => [...prev, newItemDefault(schema)]);
  }, [schema]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, newValue: unknown) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  }, []);

  const updateObjectField = useCallback(
    (itemIndex: number, fieldKey: string, newVal: unknown) => {
      setItems((prev) => {
        const next = [...prev];
        const obj = { ...(next[itemIndex] as Record<string, unknown>) };
        obj[fieldKey] = newVal;
        next[itemIndex] = obj;
        return next;
      });
    },
    [],
  );

  if (!schema) {
    return (
      <p className="text-sm text-amber-600">
        Array schema metadata missing — please restart the server to re-sync.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name={`${field.name}_json`}
        value={JSON.stringify(items)}
      />

      {items.length === 0 && (
        <p className="text-sm italic text-slate-400">No items yet.</p>
      )}

      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Remove item"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {schema.itemType === "string" && (
            <input
              type="text"
              value={item as string}
              onChange={(e) => updateItem(idx, e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          )}

          {schema.itemType === "number" && (
            <input
              type="number"
              value={item as number}
              onChange={(e) => updateItem(idx, Number(e.target.value))}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          )}

          {schema.itemType === "object" && (
            <div className="space-y-3 pr-6">
              {Object.entries(schema.fields).map(([fKey, fType]) => {
                const val = (item as Record<string, unknown>)[fKey] ?? "";
                return (
                  <div key={fKey}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {fieldLabel(fKey)}
                    </label>
                    {fType === "text" && (
                      <input
                        type="text"
                        value={val as string}
                        onChange={(e) =>
                          updateObjectField(idx, fKey, e.target.value)
                        }
                        className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    )}
                    {(fType === "integer" || fType === "numeric") && (
                      <input
                        type="number"
                        value={val as number}
                        onChange={(e) =>
                          updateObjectField(idx, fKey, Number(e.target.value))
                        }
                        className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    )}
                    {(fType === "image" || fType === "file") && (
                      <div className="space-y-1">
                        {fType === "image" &&
                          typeof val === "string" &&
                          val && (
                            <img
                              src={val}
                              alt={fKey}
                              className="h-16 w-16 rounded-md border border-slate-200 object-cover"
                            />
                          )}
                        <input
                          type="text"
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) =>
                            updateObjectField(idx, fKey, e.target.value)
                          }
                          placeholder={
                            fType === "image" ? "Image URL" : "File URL"
                          }
                          className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-x-1.5 rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Item
      </button>
    </div>
  );
}

// ── Field Input ───────────────────────────────────────────────────────

function FieldInput({ field }: { field: AdminField }) {
  return (
    <>
      {/* Array field */}
      {field.type === "array" && <ArrayFieldEditor field={field} />}

      {/* Text input */}
      {field.type === "text" && (
        <textarea
          name={field.name}
          defaultValue={String(field.value ?? "")}
          rows={
            field.name === "bio" || String(field.value ?? "").length > 60
              ? 3
              : 1
          }
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      )}

      {/* Number input */}
      {(field.type === "integer" || field.type === "numeric") && (
        <input
          name={field.name}
          type="number"
          defaultValue={field.value as number}
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      )}

      {/* Image field */}
      {field.type === "image" && (
        <div className="space-y-3">
          {typeof field.value === "string" && field.value && (
            <img
              src={field.value}
              alt={field.name}
              className="h-32 w-32 rounded-lg border border-slate-200 object-cover"
            />
          )}
          <input
            name={`${field.name}_url`}
            type="text"
            defaultValue={typeof field.value === "string" ? field.value : ""}
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
          {typeof field.value === "string" && field.value && (
            <a
              href={field.value}
              target="_blank"
              className="inline-block text-sm text-indigo-600 underline"
            >
              Current file: {field.value.split("/").pop()}
            </a>
          )}
          <input
            name={`${field.name}_url`}
            type="text"
            defaultValue={typeof field.value === "string" ? field.value : ""}
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
    </>
  );
}

// ── Header ────────────────────────────────────────────────────────────

function AdminHeader({
  pagePath,
  pending,
  onCancel,
}: {
  pagePath: string;
  pending: boolean;
  onCancel: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-2.5">
      {/* Left: logo */}
      <div className="flex items-center gap-x-3">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          <span className="text-indigo-600">Co</span>CMS
        </span>
        <span className="hidden text-sm text-slate-400 sm:inline">Admin</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-x-2">
        {/* Save */}
        <button
          type="submit"
          form="cocms-edit-form"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>

        {/* Preview */}
        <button
          type="button"
          onClick={() =>
            window.open(pagePath === "/__site" ? "/" : pagePath, "_blank")
          }
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Preview
        </button>

        {/* Logo dropdown */}
        <div className="relative ml-2">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-200"
          >
            C
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    document
                      .querySelector<HTMLButtonElement>(
                        '[data-tab="/__site"]',
                      )
                      ?.click();
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Settings
                </button>
                <form action={logout}>
                  <button
                    type="submit"
                    className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Page Edit Form ────────────────────────────────────────────────────

function PageEditForm({
  page,
  onSaved,
}: {
  page: AdminPage;
  onSaved: () => void;
}) {
  const [_state, formAction, pending] = useActionState(
    (_prev: unknown, fd: FormData) =>
      updatePage(page.pagePath, page.fields, null, fd).then((r) => {
        if (r?.success) onSaved();
        return r;
      }),
    null,
  );

  return (
    <form id="cocms-edit-form" action={formAction} className="space-y-6">
      {page.fields.map((field) => (
        <div key={field.name}>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            {fieldLabel(field.name)}
          </label>
          <FieldInput field={field} />
        </div>
      ))}
    </form>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────

export default function AdminPanel({ pages }: { pages: AdminPage[] }) {
  const router = useRouter();
  const tabs = buildSidebarTabs(pages);
  const [activePath, setActivePath] = useState(tabs[0]?.pagePath ?? "");
  const [savedKey, setSavedKey] = useState(0);

  const activePage = pages.find((p) => p.pagePath === activePath);

  return (
    <div className="flex h-screen flex-col">
      {/* ── Header ── */}
      <AdminHeader
        pagePath={activePath}
        pending={false}
        onCancel={() => {
          setSavedKey((k) => k + 1);
          router.refresh();
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
          <nav className="space-y-0.5">
            {tabs.map((tab) => {
              const isGroup = tab.hasChildren;
              const isActive = activePath === tab.pagePath && !isGroup;

              if (isGroup) {
                return (
                  <div
                    key={`group-${tab.pagePath}`}
                    className="pt-2 first:pt-0"
                  >
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {tab.label} Pages
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={tab.pagePath + (tab.label === "Main" ? "-main" : "")}
                  data-tab={tab.pagePath}
                  onClick={() => setActivePath(tab.pagePath)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
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
              );
            })}
          </nav>
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
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
                  src/cocms/
                </code>{" "}
                and restart the server.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
