import React from "react";
import { TextInput, Text, View, Pressable } from "react-native";
import { FieldApi } from "@tanstack/react-form";

interface DecimalInputProps {
  field: any;
  label: string;
  placeholder?: string;
  fullWidth?: boolean;
  allowDecimals?: boolean;
  suffix?: string;
  error?: string;
}

export default function DecimalInput({
  field,
  label,
  placeholder = "0",
  fullWidth = false,
  allowDecimals = true,
  suffix,
  error,
}: DecimalInputProps) {
  const [localValue, setLocalValue] = React.useState(
    field.state.value?.toString() || ""
  );

  return (
    <View className={fullWidth ? 'w-full' : 'flex-1'}>
      <Text className="text-sm font-dm-regular text-enaleia-black mb-2">
        {label}
      </Text>
      <View className={`flex-row items-center border rounded-lg px-4 py-3 ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <TextInput
          value={localValue}
          onChangeText={(text) => {
            const regex = allowDecimals ? /[^0-9.]/g : /[^0-9]/g;
            const numericValue = text.replace(regex, "");
            if (allowDecimals) {
              if (numericValue.match(/^\d*\.?\d*$/)) {
                setLocalValue(numericValue);
              }
            } else {
              setLocalValue(numericValue);
            }
          }}
          onBlur={() => {
            field.handleBlur();
            if (localValue === "" || localValue === ".") {
              field.handleChange(undefined);
            } else {
              const numericValue = allowDecimals ? parseFloat(localValue) : parseInt(localValue);
              if (!isNaN(numericValue)) {
                field.handleChange(numericValue);
              }
            }
          }}
          className="flex-1 h-[28px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl"
          placeholder={placeholder}
          inputMode={allowDecimals ? "decimal" : "numeric"}
        />
        {suffix && (
          <Text className="text-sm font-dm-regular text-gray-500 ml-2">
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text className="text-sm font-dm-regular text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
