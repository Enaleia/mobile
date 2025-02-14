type JsonPrimitive = null | boolean | number | string;
export type JsonValue =
  | JsonPrimitive
  | JsonPrimitive[]
  | { [key: string]: JsonValue };
