import React, { useState } from "react";
import { TextInput, TextInputProps, Text, View } from "react-native";
import { FieldApi } from "@tanstack/react-form";

interface DecimalInputProps {
  field: any;
  label: string;
  placeholder: string;
  fullWidth?: boolean;
}

export default function DecimalInput({
  field,
  label,
  placeholder,
  fullWidth = false,
}: DecimalInputProps) {
  const [localValue, setLocalValue] = useState(
    field.state.value?.toString() || ""
  );

  return (
    <View className={`${fullWidth ? 'w-full' : 'flex-1'}`}>
      <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter mb-2">
        {label}
      </Text>
      <TextInput
        value={localValue}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9.]/g, "");
          if (numericValue.match(/^\d*\.?\d*$/)) {
            setLocalValue(numericValue);
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
        className="rounded-3xl px-4 py-3 h-14 bg-white border-[1.5px] border-slate-200 focus:border-primary-dark-blue w-full"
        placeholder={placeholder}
        inputMode="decimal"
      />
      {field.state.meta.errors ? (
        <Text className="text-sm text-red-500 mt-1">
          {field.state.meta.errors.join(", ")}
        </Text>
      ) : null}
    </View>
  );
}
