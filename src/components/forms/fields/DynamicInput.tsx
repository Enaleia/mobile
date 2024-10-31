import { Text, TextInput, View, Pressable } from "react-native";
import { FieldApi } from "@tanstack/react-form";
import { FormField } from "@/types/forms";

interface DynamicInputProps {
  field: FormField;
  fieldState: FieldApi<any, any>;
}

export function DynamicInput({ field, fieldState }: DynamicInputProps) {
  const renderInput = () => {
    switch (field.type) {
      case "text":
      case "email":
        return (
          <TextInput
            value={fieldState.state.value}
            onChangeText={fieldState.handleChange}
            onBlur={fieldState.handleBlur}
            keyboardType={field.type === "email" ? "email-address" : "default"}
            autoCapitalize={field.type === "email" ? "none" : "words"}
            placeholder={field.placeholder}
            className={`border py-2 px-3 rounded-lg ${
              fieldState.state.meta.errors.length > 0
                ? "border-red-600"
                : "border-slate-800"
            }`}
          />
        );

      case "select":
        return (
          <View>
            {field.options?.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => fieldState.handleChange(option.value)}
                className={`py-2 px-3 mb-1 rounded-lg ${
                  fieldState.state.value === option.value
                    ? "bg-blue-600"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`${
                    fieldState.state.value === option.value
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case "checkbox":
        return (
          <Pressable
            onPress={() => fieldState.handleChange(!fieldState.state.value)}
            className={`flex-row items-center`}
          >
            <View
              className={`w-6 h-6 border rounded mr-2 ${
                fieldState.state.value ? "bg-blue-600" : "bg-white"
              }`}
            />
            <Text>{field.label}</Text>
          </Pressable>
        );

      default:
        return null;
    }
  };

  return (
    <View className="mb-4">
      {renderInput()}
      {fieldState.state.meta.errors.length > 0 && (
        <Text className="text-red-600 text-sm mt-1">
          {fieldState.state.meta.errors.join(", ")}
        </Text>
      )}
    </View>
  );
}
