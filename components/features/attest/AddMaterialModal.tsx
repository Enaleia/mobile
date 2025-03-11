import { MaterialDetail, MaterialNames, MaterialsData } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const SelectMaterialChip = React.memo(
  ({
    label,
    value,
    handleAddMaterial,
  }: {
    label: MaterialNames;
    value: number;
    handleAddMaterial: (materialId: number) => void;
  }) => {
    const handlePress = useCallback(() => {
      handleAddMaterial(value);
    }, [value, handleAddMaterial]);

    return (
      <Pressable
        accessibilityLabel={`Select ${label}`}
        accessibilityRole="button"
        accessibilityHint={`Double tap to select ${label} material`}
        className="bg-white w-full px-4 py-3 rounded-3xl flex flex-row items-center justify-center border-[1.5px] border-grey-3"
        onPress={handlePress}
      >
        <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter text-center">
          {label}
        </Text>
      </Pressable>
    );
  }
);

const SelectMaterial = React.memo(
  ({
    materials,
    handleAddMaterial,
  }: {
    materials: MaterialsData["options"];
    handleAddMaterial: (materialId: number) => void;
  }) => {
    return (
      <View accessibilityRole="none" accessibilityLabel="Material selection">
        <Text
          className="text-xl font-dm-bold text-enaleia-black tracking-tighter text-center"
          accessibilityRole="header"
        >
          Select Material
        </Text>
        <View className="p-1 mt-5">
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginHorizontal: -4,
              width: '100%'
            }}
            accessibilityRole="none"
            accessibilityLabel="Available materials"
          >
            {materials.map(({ label, value }) => (
              <View 
                key={value} 
                style={{
                  width: '50%',
                  paddingHorizontal: 4,
                  marginBottom: 8
                }}
              >
                <SelectMaterialChip
                  label={label as MaterialNames}
                  value={value}
                  handleAddMaterial={handleAddMaterial}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }
);

export default function AddMaterialModal({
  isVisible,
  onClose,
  selectedMaterials,
  setSelectedMaterials,
  materials,
}: {
  isVisible: boolean;
  materials: MaterialsData["options"];
  onClose: () => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
}) {
  const handleAddMaterial = (materialId: number) => {
    const currentMaterials = selectedMaterials || [];
    const newMaterialDetails: MaterialDetail[] = [
      ...currentMaterials,
      {
        id: materialId,
        weight: null,
        code: "",
      },
    ];
    setSelectedMaterials(newMaterialDetails);
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="fade"
      accessibilityViewIsModal={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-slate-950/75 p-3"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-slate-50 p-5 rounded-3xl relative">
            <SelectMaterial
              materials={materials}
              handleAddMaterial={handleAddMaterial}
            />
            <Pressable
              onPress={onClose}
              className="h-10 w-10 absolute right-0 top-3"
              accessibilityRole="button"
              accessibilityLabel="Close material selection"
              accessibilityHint="Double tap to close material selection"
            >
              <Ionicons name="close" size={20} color="gray" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
