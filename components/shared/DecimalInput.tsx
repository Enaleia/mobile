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
        <Text className="text-sm font-dm-regular text-rose-500 mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
