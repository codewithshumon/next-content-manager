# Business Requirements Document (BRD)
## Project: NextCMS Demo Website

**Version:** 1.0
**Date:** July 2026
**Status:** Draft

---

## 1. Project Overview

NextCMS is a lightweight content-editing layer for Next.js applications. It lets a non-technical admin edit the **content** of a page (text, numbers, images, files) without ever touching code, while the **structure and design** of every page remains fully controlled by the developer in the codebase.

This document covers the first phase of the project: building a real, working **demo website** on top of the NextCMS pattern. The demo serves two purposes — proving the pattern works end-to-end, and acting as the reference implementation before NextCMS is published as an open-source package.

## 2. Business Objective

- Validate the NextCMS pattern (schema file → database table → admin form → live page) on a real, multi-page site before investing in a packaged open-source release.
- Produce a working reference project that later becomes the basis for documentation and starter templates for the open-source release.
- Keep the admin surface intentionally restrictive (edit-only, no structural changes) as the core value proposition, and prove that restriction holds up in practice.

## 3. Problem Statement

Existing CMS options force a tradeoff:

- **Headless CMS / page builders** (Sanity, Contentful, Builder.io, WordPress) give full editorial freedom — including adding/removing sections or pages — which is more power and more risk than many teams want. They also require modeling content in an external tool, disconnected from the actual React/JSX that renders it.
- **Hardcoding content** in JSX is simple for developers but means every text/image change requires a code change and a deploy, which is unnecessary friction for content that changes often (a name, a price, a hero image) but never needs new page structure.

There is no simple, developer-native middle ground: *"let an admin change values, not structure, using the exact fields the developer already declared in code."*

## 4. Proposed Solution

A demo Next.js website where:

1. Each page has a co-located schema file (e.g. `nextcms/home-page.ts`) declaring its editable fields and default values.
2. On server start, NextCMS automatically creates/updates one Postgres table per page from that schema (no manual migrations).
3. The page component reads current values from the database at request time and renders them.
4. An `/admin` panel, auto-generated from the same schemas, lets an admin edit field values per page — grouped into tabs that mirror the site's page structure — and nothing else.
5. Saving an edit updates the database and revalidates the live page immediately.

## 5. Scope

### In scope (Phase 1 — Demo Website)
- A real multi-page Next.js site (e.g. a small business/portfolio site: Home, About, About/Team, Services, Contact) built using the NextCMS pattern.
- Automatic table creation/sync from schema files via `instrumentation.ts`.
- Field types: text, number, image, file.
- Admin panel with tabbed navigation mirroring page hierarchy, edit-only forms.
- Image/file input via both pasted path/URL and local upload to `/public`.
- Single Postgres database, connected via one `DATABASE_URL` env var.

### Out of scope (Phase 1)
- Multi-user roles/permissions (single admin login is sufficient for the demo).
- Page/section creation or deletion from the admin panel (explicitly excluded by design, not a missing feature).
- Multi-database support (MySQL, MongoDB, etc.) — Postgres only for now.
- Cloud storage upload (S3/Cloudinary) — deferred; local upload + URL paste only.
- Packaging as an installable npm package — that is Phase 2 (open-source release), after the demo validates the pattern.

## 6. Stakeholders

| Role | Interest |
|---|---|
| Project owner / developer (you) | Validate the pattern; produce a reference implementation |
| Future open-source adopters | Will use the packaged version once released; the demo shapes the DX they'll get |
| Demo site admin (content editor persona) | Needs to update site content without developer help |

## 7. Success Criteria

- A developer can add a new editable field to a page by editing one schema file only — no manual SQL, no admin-panel configuration step.
- An admin can change any declared field's value from `/admin` and see it reflected on the live page without a redeploy.
- At no point does the admin panel expose a way to add/remove a page or a field.
- The same pattern works unmodified across at least two nested page groups (e.g. `/about` and `/about/team`) to prove the tab hierarchy generalizes.

## 8. Assumptions & Constraints

- The demo runs on a single Postgres instance; connection is provided via `DATABASE_URL`.
- The developer is comfortable writing plain TypeScript schema files; no visual schema builder is provided.
- Deployment target is a standard Node.js host (Vercel or equivalent) that runs `instrumentation.ts` on boot.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Schema/table drift if a field is renamed rather than added | Renames are treated as remove-old-add-new; old column is kept (nullable) rather than dropped, to avoid silent data loss |
| Admin edits content type not matching the field type (e.g. text in an image field) | Field type is enforced by the schema (`image()`/`file()` helpers), and the admin form renders the correct input per type |
| Sync step running on every server boot could be slow on large sites | Sync only performs `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, cheap no-ops once tables exist |

## 10. Phased Timeline

1. **Phase 1 (this document's scope):** Build the demo website + core NextCMS engine (sync, data access, admin UI) inside the same repo.
2. **Phase 2:** Extract the engine into a standalone npm package; write install docs; open-source release.
3. **Phase 3 (future):** Multi-DB support, cloud storage, role-based admin access — driven by real adopter feedback.