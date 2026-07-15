# User Requirements Document (URD)
## Project: NextCMS Demo Website

**Version:** 1.0
**Date:** July 2026
**Status:** Draft

---

## 1. Purpose

This document describes what each type of user needs to be able to do with the NextCMS demo website, from their point of view — independent of how it's implemented. It complements the BRD (business rationale) and feeds into the SRS (technical spec).

## 2. User Roles

| Role | Description |
|---|---|
| **Developer** | Builds and maintains the Next.js site. Writes page components and schema files. Only person who can change page structure, add new pages, or add new fields. |
| **Content Admin** | Logs into `/admin`. Edits the value of existing fields (text, numbers, images, files) on existing pages. Cannot add, remove, or restructure anything. |
| **Site Visitor** | Views the public website. Never interacts with `/admin`. Sees content exactly as the Admin last saved it. |

## 3. User Needs

### 3.1 Developer

- **As a developer**, I want to declare a page's editable content in one schema file next to my page, so the values I use in JSX come from a single, obvious source.
- **As a developer**, I want the database table for that page to be created automatically the first time I run the app, so I never write or run a migration by hand.
- **As a developer**, I want to add a new field to an existing page by adding one line to its schema file, and have it appear in the admin panel automatically on next server start.
- **As a developer**, I want to mark a field as an image or a file (not just plain text) so the admin panel renders the right kind of input for it.
- **As a developer**, I want removing a field from the schema file to stop it from rendering in the admin panel, without deleting existing data, so I don't lose content by mistake.
- **As a developer**, I want the whole system to work from a single `DATABASE_URL` environment variable, with no separate CMS server or dashboard to deploy.

### 3.2 Content Admin

- **As an admin**, I want to log into `/admin` and see every page of the site listed as a tab, so I can find the page I need to update.
- **As an admin**, I want pages that are grouped (e.g. About and its sub-pages) shown as nested tabs, so the panel reflects how the site is actually organized.
- **As an admin**, I want each page's tab to show every editable field on that page, with its current value, so I know exactly what I'm changing before I save.
- **As an admin**, I want to edit text and number fields with a plain input box.
- **As an admin**, I want to update an image field either by pasting a URL/path or uploading a file from my computer.
- **As an admin**, I want to update a file field (e.g. a PDF) the same way — paste a path or upload.
- **As an admin**, I want to save my changes and see them live on the actual website immediately, without asking the developer to redeploy.
- **As an admin**, I want the panel to never show me an option to add a new page, delete a page, or add a new field — I should only ever be able to change what already exists.

### 3.3 Site Visitor

- **As a visitor**, I want to see the current content of the site (text, images, files) rendered normally, with no visible difference from a typical static Next.js site.
- **As a visitor**, I should never be able to detect that content is admin-editable (no admin UI leaks onto public pages).

## 4. Key Use Case Scenarios

### UC-1: Developer adds a new page
1. Developer creates `app/services/page.tsx` and `nextcms/services-page.ts` declaring fields (e.g. `title`, `description`, `icon: image(...)`).
2. Developer restarts the dev server (or deploys).
3. NextCMS sync creates the `nextcms_services` table and registers its fields.
4. A "Services" tab appears in `/admin` automatically, pre-filled with the schema's default values.

### UC-2: Admin edits existing content
1. Admin logs into `/admin`.
2. Admin selects the "About" tab, then the "Team" sub-tab.
3. Admin sees fields: `heroTitle` (text), `teamPhoto` (image).
4. Admin uploads a new photo for `teamPhoto`, edits `heroTitle` text, and clicks Save.
5. The live `/about/team` page reflects both changes immediately.

### UC-3: Developer removes a field
1. Developer deletes the `age` field from `nextcms/home-page.ts`.
2. On next server start, sync detects `age` is no longer declared.
3. The admin panel stops showing `age` as an editable field. The underlying database column and its data are left untouched (not deleted).

## 5. Non-Goals (explicit exclusions from the Admin's capabilities)

- Creating a new page.
- Deleting a page.
- Adding a new field to a page.
- Removing a field from a page.
- Changing a field's type (e.g. turning a text field into an image field).
- Reordering or restructuring layout/design of any page.

These are intentionally reserved for the Developer, enforced by the fact that the admin panel has no UI path to perform them — not just a permissions check.