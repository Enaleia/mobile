import { z } from "zod";

export type FormStep = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  validation?: z.ZodSchema;
};

export type FormField = {
  name: string;
  type: "text" | "email" | "select" | "date" | "checkbox";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: z.ZodSchema;
};

export type FormConfig = {
  steps: FormStep[];
  initialValues: Record<string, any>;
  onSubmit: (values: any) => Promise<void>;
};

export type RoleFormConfig = Record<string, FormConfig>;
