import type { ImageField, FileField, ArrayField } from "./types";

/**
 * Declare an image field.
 * Stored as a TEXT path/URL in the DB; the admin panel renders an
 * image preview + URL input + file-upload button.
 */
export function image(defaultValue: string): ImageField {
  return { type: "image", defaultValue };
}

/**
 * Declare a file field (PDF, DOC, etc.).
 * Stored as a TEXT path/URL in the DB; the admin panel renders a
 * file link + URL input + file-upload button.
 */
export function file(defaultValue: string): FileField {
  return { type: "file", defaultValue };
}

/**
 * Declare an array field (list of strings, numbers, or objects).
 * Stored as JSONB in the DB; the admin panel renders a dynamic
 * list editor with add/remove buttons.
 *
 * Item shape is inferred from the first element of the default value:
 * - `["a", "b"]` → array of strings
 * - `[1, 2]`     → array of numbers
 * - `[{...}]`    → array of objects (field types inferred from values)
 */
export function array(defaultValue: unknown[]): ArrayField {
  return { type: "array", defaultValue };
}
