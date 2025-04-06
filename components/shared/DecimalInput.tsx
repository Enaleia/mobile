import React from "react";
import { TextInput, Text, View, Pressable, Platform } from "react-native";
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

  // Sync localValue when the external field value changes
  React.useEffect(() => {
    // Only update if the external value is different from the local raw value
    // to avoid disrupting typing. Check for both number and string representations.
    const fieldValueStr = field.state.value?.toString() ?? "";
    if (field.state.value !== parseFloat(localValue) && fieldValueStr !== localValue) {
       setLocalValue(fieldValueStr);
    }
  }, [field.state.value]);

  // Use numeric for Android regardless of allowDecimals, but respect the setting for iOS
  const inputMode = Platform.select<"numeric" | "decimal">({
    android: "numeric",
    ios: allowDecimals ? "decimal" : "numeric",
    default: allowDecimals ? "decimal" : "numeric", // fallback for web or other platforms
  });

  return (
    <View className={fullWidth ? 'w-full' : 'flex-1'}>
      <View className="rounded-2xl bg-white border-[1.5px] border-grey-3 p-2 px-4 h-[72px]">
        <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter mb-1">
          {label}
        </Text>
        <View className="flex-row items-center justify-between">
          <TextInput
            value={localValue}
            onChangeText={(text) => {
              // Allow digits and potentially a single decimal point
              const cleanedValue = text.replace(/[^0-9.]/g, "");

              // Prevent multiple decimal points
              if ((cleanedValue.match(/\./g) || []).length > 1) {
                return; // Don't update if more than one decimal point
              }

              // Update the local state with the cleaned value
              // Allows intermediate states like "7." or ".5"
              setLocalValue(cleanedValue);
            }}
            onBlur={() => {
              field.handleBlur(); // Notify form lib that field lost focus

              let finalValue: number | undefined = undefined;

              // Try parsing the localValue
              if (localValue && localValue !== ".") {
                const numericValue = parseFloat(localValue);
                if (!isNaN(numericValue)) {
                  // Process the value based on allowDecimals
                  if (allowDecimals) {
                    finalValue = numericValue; // Keep decimals
                  } else {
                    finalValue = Math.round(numericValue); // Round if not allowed
                  }
                }
              }

              // Update the actual form state via field.handleChange
              field.handleChange(finalValue);

              // Optional: Sync localValue back? Let's not for now.
              // If the field value updates externally, useEffect will handle it.
            }}
            className="flex-1 h-[32px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl"
            placeholder={placeholder}
            inputMode={inputMode}
          />
          {suffix && (
            <Text className="text-sm font-dm-bold text-grey-6 ml-2 mt-1">
              {suffix}
            </Text>
          )}
        </View>
      </View>
      {error && (
        <Text className="text-sm font-dm-regular text-red-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
