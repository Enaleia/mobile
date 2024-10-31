import { RoleFormConfig } from "@/types/forms";
import { fishermanFormSchema, observerFormSchema } from "./schemas";

export const formStepsConfig: RoleFormConfig = {
  fisherman: {
    steps: [
      {
        id: "vessel",
        title: "Vessel Information",
        fields: [
          {
            name: "vesselName",
            type: "text",
            label: "Vessel Name",
            required: true,
          },
          {
            name: "licenseNumber",
            type: "text",
            label: "License Number",
            required: true,
          },
        ],
        validation: fishermanFormSchema.pick({
          vesselName: true,
          licenseNumber: true,
        }),
      },
      // Additional steps...
    ],
    initialValues: {
      vesselName: "",
      licenseNumber: "",
    },
    onSubmit: async (values) => {
      // Submit logic
    },
  },
};
