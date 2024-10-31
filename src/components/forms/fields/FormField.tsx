import { FormField as FormFieldType } from "@/types/forms";
import { FieldApi } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Text, View } from "react-native";
import { DynamicInput } from "./DynamicInput";

interface FormFieldProps {
  field: FormFieldType;
  form: any; // FormApi<FormFieldType, ZodValidator>;
}

export function FormField({ field, form }: FormFieldProps) {
  return (
    <View className="mb-4">
      <Text className="font-semibold mb-1">{field.label}</Text>
      <form.Field
        name={field.name}
        validators={{
          onChange: field.validation,
        }}
        validatorAdapter={zodValidator()}
      >
        {(fieldState: FieldApi<any, any>) => (
          <DynamicInput field={field} fieldState={fieldState} />
        )}
      </form.Field>
    </View>
  );
}
