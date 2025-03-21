import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ModalBase from "@/components/shared/ModalBase";

interface SelectOption {
  label: string;
  value: number;
  type?: string;
}

interface GroupedOptions {
  [key: string]: SelectOption[];
}

interface SelectFieldProps {
  value?: number;
  onChange: (value: number) => void;
  options: SelectOption[];
  placeholder?: string;
  isLoading?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function SelectField({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  isLoading = false,
  error,
  disabled = false,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  // Group options by type
  const groupedOptions = options.reduce<GroupedOptions>((acc, option) => {
    const type = option.type || "Other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(option);
    return acc;
  }, {});

  // Sort groups alphabetically
  const sortedGroups = Object.entries(groupedOptions)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as GroupedOptions);

  return (
    <>
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        className={`flex-row items-center justify-between rounded-2xl p-2 px-4 h-[65px] bg-white border-[1.5px] ${
          error ? "border-red-500" : "border-grey-3"
        } ${disabled ? "opacity-50" : ""}`}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityState={{ selected: !!selectedOption, disabled }}
        accessibilityHint="Double tap to open selection"
      >
        {isLoading ? (
          <ActivityIndicator size="small" className="mr-2" />
        ) : (
          <View className="flex-1">
            <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
              {placeholder}
            </Text>
            <Text
              className="font-dm-bold text-xl tracking-tighter text-enaleia-black"
              numberOfLines={1}
            >
              {selectedOption?.label || "Select"}
            </Text>
          </View>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color="#0D0D0D"
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      <ModalBase isVisible={isOpen} onClose={() => setIsOpen(false)}>
        <View className="pb-8 pt-4 px-4">
          <Text className="text-xl font-dm-bold text-enaleia-black tracking-tighter text-center mb-6">
            {placeholder}
          </Text>
          <ScrollView className="max-h-96">
            {Object.entries(sortedGroups).map(([type, typeOptions]) => (
              <View key={type} className="mb-4">
                <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                  {type}
                </Text>
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="bg-white w-full px-4 py-3 rounded-2xl flex flex-row items-center justify-between border-[1.5px] border-grey-3 mb-2"
                    accessibilityRole="menuitem"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: option.value === value }}
                  >
                    <Text
                      className="text-base font-dm-bold text-enaleia-black tracking-tighter"
                    >
                      {option.label}
                    </Text>
                    {option.value === value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#0D0D0D"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ModalBase>
    </>
  );
}
