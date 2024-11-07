import { z } from "zod";

export const collectionFormSchema = z.object({
  collectorId: z.string().min(1, "Collector ID is required"),
  collectionBatch: z.string().min(1, "Collection batch is required"),
  materials: z.array(z.string()).min(1, "Select at least one material"),
  totalWeightInKilograms: z
    .string()
    .min(1, "Total weight is required")
    .refine(
      (val) => val !== "" && !isNaN(parseFloat(val)),
      "Please enter a number"
    )
    .transform((val) => parseFloat(val).toFixed(2)),
});

export type CollectionFormType = z.infer<typeof collectionFormSchema>;
