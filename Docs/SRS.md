# Software Requirements Specification (SRS)
## Project: NextCMS Demo Website

**Version:** 1.0
**Date:** July 2026
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
Defines the technical requirements for the NextCMS engine and the demo website built on it, translating the BRD/URD into implementable specifications.

### 1.2 Scope
Covers: schema file format, sync-to-database mechanism, data access layer, admin panel, and the public-facing demo site. Excludes packaging as an npm module (Phase 2).

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Schema file | A `.ts` file under `nextcms/` declaring a page's editable fields and defaults |
| pagePath | Unique route path a schema file corresponds to (e.g. `/about/team`) |
| Field | A single editable value (text, number, image, or file) declared in a schema file |
| Sync | The startup process that creates/updates DB tables from schema files |
| nextcms_fields | Internal registry table storing field type metadata |

## 2. Overall Description

### 2.1 Product Perspective
NextCMS is embedded directly inside the Next.js app (not a separate service). It consists of:
- A **sync module**, run once at server boot via `instrumentation.ts`.
- A **data access layer** (`getContent`, `updatePage`) used by pages and the admin panel.
- An **admin UI** at `/admin`, generated from schema/registry data.
- **Schema files** authored by the developer, one per page (or per page group).

### 2.2 User Classes
See URD §2 (Developer, Content Admin, Site Visitor).

### 2.3 Constraints
- Database: PostgreSQL only.
- Runtime: Node.js hosting that supports Next.js `instrumentation.ts` (e.g. Vercel, self-hosted Node).
- No ORM with fixed schema (e.g. Prisma) for the dynamic per-page tables, since tables must be created/altered at runtime from arbitrary schema files. Raw SQL via `pg` is used instead.

## 3. System Architecture

```
┌─────────────────────────────┐
│        Next.js App          │
│                              │
│  app/home/page.tsx           │──uses──▶ getContent(schema)
│  app/about/page.tsx          │──uses──▶ getContent(schema)
│  app/about/team/page.tsx     │──uses──▶ getContent(schema)
│                              │
│  nextcms/home-page.ts        │
│  nextcms/about-page.ts       │◀── read at boot by sync
│  nextcms/about-team-page.ts  │
│                              │
│  app/admin/...                │──uses──▶ getFields(), updatePage()
│                              │
│  instrumentation.ts          │──runs syncSchemas() once at boot
└──────────────┬───────────────┘
               │ pg (node-postgres)
               ▼
        ┌──────────────┐
        │  PostgreSQL   │
        │               │
        │ nextcms_fields          (registry: field types per page)
        │ nextcms_home            (1 row: pagePath + field columns)
        │ nextcms_about
        │ nextcms_about_team
        └──────────────┘
```

## 4. Functional Requirements

### FR-1 — Schema File Format
- Each schema file default-exports an object with a required `pagePath: string` and one or more field entries.
- Field values are plain JS types (`string`, `number`) for text/number fields, or wrapped with `image(defaultValue: string)` / `file(defaultValue: string)` helper functions for those types.
- System MUST reject sync (with a clear console error) if two schema files declare the same `pagePath`.

### FR-2 — Sync on Boot
- `instrumentation.ts` MUST call `syncSchemas()` exactly once when the Next.js server starts (dev and prod).
- For each schema file found under `nextcms/`:
  - Compute table name via `nextcms_` + `pagePath` sanitized (`/` → `_`, leading/trailing slashes stripped, `/` → `home` for root).
  - If table does not exist: `CREATE TABLE` with `id SERIAL PRIMARY KEY`, `page_path TEXT UNIQUE NOT NULL`, one column per field (type-mapped per FR-4), `updated_at TIMESTAMPTZ DEFAULT now()`; insert one row with schema defaults.
  - If table exists: for each field in the schema not present as a column, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Never drop columns automatically.
  - Upsert corresponding rows into `nextcms_fields` (pagePath, fieldName, fieldType).

### FR-3 — Content Read (Public Pages)
- `getContent(schema)` MUST query the row matching `page_path` from the schema's table and return field values as a typed object.
- If no row exists yet (race before first sync), MUST fall back to the schema file's default values.
- MUST be safely callable from Server Components (async function, no client-side fetch required).

### FR-4 — Field Type Mapping

| Schema declaration | Column type | Admin input rendered |
|---|---|---|
| `string` literal | `TEXT` | single-line text input |
| `number` literal | `INTEGER` or `NUMERIC` (inferred from int vs float default) | number input |
| `image(default)` | `TEXT` (stores path/URL) | image preview + URL field + file upload button |
| `file(default)` | `TEXT` (stores path/URL) | file name/link + URL field + file upload button |

### FR-5 — Admin Panel Navigation
- `/admin` MUST list all known `pagePath`s from `nextcms_fields`, grouped into tabs mirroring path hierarchy (e.g. `/about` and `/about/team` render as a parent "About" tab with a "Team" sub-tab).
- Root path `/` MUST render as the first tab (e.g. labeled "Home").
- Selecting a tab MUST display a form with one input per field registered for that `pagePath`, pre-filled with current DB values.

### FR-6 — Admin Edit & Save
- Submitting a page's form MUST run a server action that:
  1. Validates submitted values against expected field types.
  2. Executes a single `UPDATE <table> SET ... WHERE page_path = $1`.
  3. For image/file fields with an uploaded file: saves the file to `/public/uploads/`, stores the resulting path as the field value.
  4. Calls `revalidatePath(pagePath)` so the public page reflects the change on next request.
- The system MUST NOT expose any admin action that creates a new `pagePath`, creates a new field/column, or deletes a page/field/table.

### FR-7 — File/Image Upload
- Admin MUST be able to either (a) paste a path/URL directly into the field, or (b) upload a file from their device, which is written to `/public/uploads/` and its resulting relative path stored as the field's value.

### FR-8 — Authentication
- `/admin` MUST be protected by authentication (minimum: single admin credential via env-configured username/password for the demo). Unauthenticated requests MUST be redirected to a login screen.

## 5. Non-Functional Requirements

- **NFR-1 Performance:** Sync operations on unchanged schemas MUST complete as no-ops in under ~200ms combined (all `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` calls).
- **NFR-2 Reliability:** A sync failure for one schema file MUST NOT prevent other schema files from syncing (isolated per-file try/catch, errors logged).
- **NFR-3 Data Safety:** No automatic `DROP TABLE` or `DROP COLUMN` is ever executed by the system.
- **NFR-4 Portability:** The entire system MUST be configurable via a single `DATABASE_URL` env var, with no additional infrastructure.
- **NFR-5 Security:** Uploaded files MUST be restricted by MIME type/extension allowlist (images: jpg/png/webp/svg; files: pdf/doc/docx by default, configurable).

## 6. Data Model

### 6.1 `nextcms_fields` (registry)
| Column | Type |
|---|---|
| page_path | TEXT |
| field_name | TEXT |
| field_type | TEXT (`text`\|`number`\|`image`\|`file`) |
| Primary key | (page_path, field_name) |

### 6.2 Per-page table, e.g. `nextcms_home`
| Column | Type |
|---|---|
| id | SERIAL PRIMARY KEY |
| page_path | TEXT UNIQUE NOT NULL |
| name | TEXT |
| age | INTEGER |
| updated_at | TIMESTAMPTZ |

## 7. External Interfaces

- **Environment:** `DATABASE_URL` (required), `NEXTCMS_ADMIN_USER` / `NEXTCMS_ADMIN_PASSWORD` (demo auth).
- **Filesystem:** `nextcms/*.ts` (input, read at boot), `public/uploads/*` (output, written on file upload).
- **Server Actions:** `updatePage(pagePath, values)` — the only write path into content tables.

## 8. Appendix — Example Files

**`nextcms/home-page.ts`**
```ts
import { image } from '@/nextcms/fields'

export default {
  pagePath: '/',
  name: 'Shumon Khan',
  age: 13,
  avatar: image('/img/avatar.png'),
}
```

**`app/page.tsx`**
```tsx
import { getContent } from '@/nextcms/client'
import schema from '@/nextcms/home-page'

export default async function HomePage() {
  const { name, age, avatar } = await getContent(schema)
  return (
    <div>
      <img src={avatar} alt={name} />
      <h1>{name}</h1>
      <p>{age}</p>
    </div>
  )
}
```