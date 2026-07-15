"use client";

import { useState, useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updatePage, logout } from "./actions";
import type { AdminField, AdminPage } from "@/cocms/client";
import type { ArrayItemSchema } from "@/cocms/types";

// ── helpers ───────────────────────────────────────────────────────────

function pageLabel(pagePath: string): string {
  if (pagePath === "/") return "Home";
  if (pagePath === "/__site") return "Site Settings";
  const parts = pagePath.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
}

interface FlatTab extends AdminPage {
  depth: number;
  label: string;
}

function flattenPages(
  pages: AdminPage[],
  depth = 0,
): FlatTab[] {
  const flat: FlatTab[] = [];
  for (const p of pages) {
    flat.push({ ...p, label: pageLabel(p.pagePath), depth });
    const children = (p as AdminPage & { children?: AdminPage[] }).children;
    if (children) {
      flat.push(...flattenPages(children, depth + 1));
    }
  }
  return flat;
}

/** Build a nested page tree from a flat list — immutable, no mutation of input objects. */
function buildPageTree(
  pages: AdminPage[],
): (AdminPage & { children?: AdminPage[] })[] {
  const sorted = [...pages].sort((a, b) =>
    a.pagePath.localeCompare(b.pagePath),
  );
  const tree: (AdminPage & { children?: AdminPage[] })[] = [];
  const map = new Map<string, AdminPage & { children?: AdminPage[] }>();

  for (const page of sorted) {
    // Shallow-clone so we never mutate the original page object from props
    const node = { ...page, children: undefined } as AdminPage & {
      children?: AdminPage[];
    };
    map.set(node.pagePath, node);

    const parts = page.pagePath.split("/").filter(Boolean);
    if (parts.length === 0) {
      tree.push(node);
      continue;
    }

    const parentPath = "/" + parts.slice(0, -1).join("/");
    const parent = map.get(parentPath);

    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
}

function fieldLabel(name: string): string {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
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

function ArrayFieldEditor({
  field,
}: {
  field: AdminField;
}) {
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
      {/* Hidden input carries the JSON to the server action */}
      <input type="hidden" name={`${field.name}_json`} value={JSON.stringify(items)} />

      {items.length === 0 && (
        <p className="text-sm text-slate-400 italic">No items yet.</p>
      )}

      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(idx)}
            className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Remove item"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* ── Primitive array (string / number) ── */}
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

          {/* ── Object array ── */}
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
                        onChange={(e) => updateObjectField(idx, fKey, e.target.value)}
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
                        {fType === "image" && typeof val === "string" && val && (
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
                          placeholder={fType === "image" ? "Image URL" : "File URL"}
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

      {/* Add item button */}
      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-x-1.5 rounded-lg border-2 border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add Item
      </button>
    </div>
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
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            {fieldLabel(field.name)}
          </label>

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

// ── Main Panel ────────────────────────────────────────────────────────

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
              {tab.depth > 0 && <span className="mr-1 text-slate-300">└</span>}
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
              {activePage ? pageLabel(activePage.pagePath) : "Select a page"}
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
  );
}
