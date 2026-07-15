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

/** Possible values a schema field can hold. */
export type FieldDeclaration = string | number | ImageField | FileField;

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
      : T[K];
};
