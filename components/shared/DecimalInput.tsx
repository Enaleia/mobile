import React from "react";
import { TextInput, Text, View, Pressable } from "react-native";
import { FieldApi } from "@tanstack/react-form";

interface DecimalInputProps {
  field: any;
  label: string;
  placeholder: string;
  fullWidth?: boolean;
  allowDecimals?: boolean;
  suffix?: string;
}

export default function DecimalInput({
  field,
  label,
  placeholder,
  fullWidth = false,
  allowDecimals = true,
  suffix,
}: DecimalInputProps) {
  const [localValue, setLocalValue] = React.useState(
    field.state.value?.toString() || ""
  );

  return (
    <View className={fullWidth ? 'w-full' : 'flex-1'}>
      <View className="rounded-2xl bg-white border-[1.5px] border-grey-3 p-2 px-4 h-[65px]">
        <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
          {label}
        </Text>
        <View className="flex-row items-center">
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
            <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter ml-1">
              {suffix}
            </Text>
          )}
        </View>
      </View>
      {field.state.meta.errors && (
        <Text className="text-sm text-red-500 mt-1">
          {field.state.meta.errors.join(", ")}
        </Text>
      )}
    </View>
  );
}
