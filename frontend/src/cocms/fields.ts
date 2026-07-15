import type { ImageField, FileField } from "./types";

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
