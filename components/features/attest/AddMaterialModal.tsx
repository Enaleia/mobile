import { MaterialsData } from "@/hooks/useMaterials";
import { MaterialDetail, MaterialNames } from "@/types/material";
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
        accessibilityLabel={label}
        accessibilityRole="button"
        className={`bg-white min-w-[60px] px-3 py-2 rounded-3xl flex flex-row items-center justify-center mx-1 my-1 border-[1.5px] border-grey-3`}
        onPress={handlePress}
      >
        <Text className="text-sm font-dm-bold text-enaleia-black tracking-tighter">
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
      <View>
        <Text className="text-xl font-dm-bold text-enaleia-black tracking-tighter text-center">
          Select Material
        </Text>
        <View className="p-1 mt-5">
          <View className="flex-row flex-wrap gap-2 justify-center">
            {materials.map(({ label, value }) => (
              <SelectMaterialChip
                key={value}
                label={label as MaterialNames}
                value={value}
                handleAddMaterial={handleAddMaterial}
              />
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
        weight: 0,
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
          <View className="bg-slate-50 p-3 rounded-lg relative">
            <SelectMaterial
              materials={materials}
              handleAddMaterial={handleAddMaterial}
            />
            <Pressable
              onPress={onClose}
              className="h-10 w-10 absolute right-0 top-3"
            >
              <Ionicons name="close" size={20} color="gray" />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
