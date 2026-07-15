/** A field declared as an image — stores a file path or URL as TEXT in the DB. */
export interface ImageField {
  type: "image";
  defaultValue: string;
}

/** A field declared as a file — stores a file path or URL as TEXT in the DB. */
export interface FileField {
  type: "file";
  defaultValue: string;
}

/** A field declared as an array — stored as JSONB in the DB. */
export interface ArrayField {
  type: "array";
  defaultValue: unknown[];
}

/** Possible values a schema field can hold. */
export type FieldDeclaration =
  | string
  | number
  | ImageField
  | FileField
  | ArrayField;

/**
 * The shape of every CoCMS schema file.
 * Must include a `pagePath` string and one or more field entries.
 */
export interface PageSchema {
  pagePath: string;
  [key: string]: FieldDeclaration;
}

/** The resolved content object returned by `getContent()`. */
export type ResolvedContent<T extends PageSchema> = {
  [K in keyof T as K extends "pagePath" ? never : K]: T[K] extends ImageField
    ? string
    : T[K] extends FileField
      ? string
      : T[K] extends ArrayField
        ? unknown[]
        : T[K];
};

/** Shape metadata for an array-of-objects field. */
export interface ArrayItemObjectSchema {
  itemType: "object";
  fields: Record<string, string>;
}

/** Shape metadata for an array-of-primitives field. */
export interface ArrayItemPrimitiveSchema {
  itemType: "string" | "number";
}

export type ArrayItemSchema = ArrayItemObjectSchema | ArrayItemPrimitiveSchema;
