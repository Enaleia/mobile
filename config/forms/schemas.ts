import { z } from "zod";

// Define reusable validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_NUMBER: "Please enter a valid number",
  MIN_MATERIALS: "Select at least one material",
} as const;

// Define weight validation schema
const weightSchema = z
  .number({ coerce: true, message: VALIDATION_MESSAGES.INVALID_NUMBER })
  .min(1, VALIDATION_MESSAGES.REQUIRED);

// Define materials schema
const materialsSchema = z
  .array(z.string())
  .min(1, VALIDATION_MESSAGES.MIN_MATERIALS);

// Main collection form schema
export const collectionFormSchema = z.object({
  action: z.number(),
  collectorId: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  collectionBatch: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  materials: materialsSchema,
  totalWeightInKilograms: weightSchema,
});

export type CollectionFormType = z.infer<typeof collectionFormSchema>;
