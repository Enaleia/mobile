import { z } from "zod";

export const baseFormSchema = z.object({
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const fishermanFormSchema = baseFormSchema.extend({
  vesselName: z.string().min(2, "Vessel name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  catchType: z.array(z.string()).min(1, "Select at least one catch type"),
});

export const observerFormSchema = baseFormSchema.extend({
  observerId: z.string().min(1, "Observer ID is required"),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export type BaseForm = z.infer<typeof baseFormSchema>;
export type FishermanForm = z.infer<typeof fishermanFormSchema>;
export type ObserverForm = z.infer<typeof observerFormSchema>;

export type RoleFormType = FishermanForm | ObserverForm;
