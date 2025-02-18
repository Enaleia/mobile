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

  return (
    <>
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        className={`flex-row items-center justify-between rounded-md px-3 py-2 bg-white border ${
          error ? "border-red-500" : "border-slate-200"
        } ${disabled ? "opacity-50" : ""}`}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        accessibilityState={{ selected: !!selectedOption, disabled }}
        accessibilityHint="Double tap to open selection"
      >
        {isLoading ? (
          <ActivityIndicator size="small" className="mr-2" />
        ) : (
          <Text
            className="flex-1 font-dm-regular text-enaleia-black"
            numberOfLines={1}
          >
            {selectedOption?.label || placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-down"
          size={20}
          color="#0D0D0D"
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      <ModalBase isVisible={isOpen} onClose={() => setIsOpen(false)}>
        <View className="pb-8 pt-2">
          <Text className="text-xl font-dm-medium text-enaleia-black mb-4">
            {placeholder}
          </Text>
          <ScrollView className="max-h-96">
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`p-3 border-b border-slate-100 ${
                  option.value === value ? "bg-slate-100" : ""
                }`}
                accessibilityRole="menuitem"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: option.value === value }}
              >
                <View className="flex-row items-center justify-start">
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={option.value === value ? "#0D0D0D" : "transparent"}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    className={`font-dm-regular ${
                      option.value === value
                        ? "text-primary-dark-blue"
                        : "text-enaleia-black"
                    }`}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ModalBase>
    </>
  );
}
