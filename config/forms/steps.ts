import { RoleFormConfig } from "@/types/forms";
import { fishermanFormSchema } from "./schemas";

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
      {
        id: "catch",
        title: "Catch Information",
        fields: [
          {
            name: "catchType",
            type: "select",
            label: "Catch Type",
            required: true,
            options: [
              { label: "Fish", value: "fish" },
              { label: "Shellfish", value: "shellfish" },
            ],
          },
        ],
      },
    ],
    initialValues: {
      vesselName: "",
      licenseNumber: "",
      catchType: "",
    },
    onSubmit: async (values) => {
      console.log(values);
    },
  },
};
