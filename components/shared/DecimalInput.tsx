import React, { useState } from "react";
import { TextInput, TextInputProps, Text, View } from "react-native";
import { FieldApi } from "@tanstack/react-form";

interface DecimalInputProps
  extends Omit<TextInputProps, "value" | "onChangeText" | "onBlur"> {
  field: FieldApi<any, any, any, any>;
  label: string;
}

export default function DecimalInput({
  field,
  label,
  ...props
}: DecimalInputProps) {
  const [localValue, setLocalValue] = useState(
    field.state.value?.toString() || ""
  );

  return (
    <View className="flex-1 h-full w-full">
      <Text className="text-base font-dm-medium text-enaleia-black tracking-tighter mb-2">
        {label}
      </Text>
      <TextInput
        value={localValue}
        onChangeText={(text) => {
          const parsedValue = text.replace(/,/g, ".");
          if (parsedValue.match(/^\d*\.?\d*$/)) {
            setLocalValue(parsedValue);
          }
        }}
        onBlur={() => {
          field.handleBlur();
          if (localValue === "" || localValue === ".") {
            field.handleChange(undefined);
          } else {
            const numericValue = parseFloat(localValue);
            if (!isNaN(numericValue)) {
              field.handleChange(numericValue);
            }
          }
        }}
        className="rounded-md px-3 bg-white border border-slate-200 focus:border-primary-dark-blue"
        inputMode="decimal"
        keyboardType="decimal-pad"
        {...props}
      />
      {field.state.meta.errors ? (
        <Text className="text-sm text-red-500 mt-1">
          {field.state.meta.errors.join(", ")}
        </Text>
      ) : null}
    </View>
  );
}
