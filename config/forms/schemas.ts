import { ActivityType } from "@/types/activity";
import { z } from "zod";

// Define reusable validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_NUMBER: "Please enter a valid number",
  MIN_MATERIALS: "Select at least one material",
} as const;

// Define activity types schema
const activityTypeSchema = z.enum(ActivityType);

// Define weight validation schema
const weightSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.REQUIRED)
  .refine(
    (val) => val !== "" && !isNaN(parseFloat(val)),
    VALIDATION_MESSAGES.INVALID_NUMBER
  )
  .transform((val) => parseFloat(val).toFixed(2));

// Define materials schema
const materialsSchema = z
  .array(z.string())
  .min(1, VALIDATION_MESSAGES.MIN_MATERIALS);

// Main collection form schema
export const collectionFormSchema = z.object({
  action: activityTypeSchema,
  collectorId: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  collectionBatch: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  materials: materialsSchema,
  totalWeightInKilograms: weightSchema,
});

export type CollectionFormType = z.infer<typeof collectionFormSchema>;
