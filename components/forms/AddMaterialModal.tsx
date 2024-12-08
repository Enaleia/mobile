import {
  MATERIAL_CATEGORIES,
  MATERIAL_ID_MAP,
  MATERIAL_OPTIONS,
} from "@/constants/material";
import { MaterialNames } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";

const SelectMaterialChip = ({
  label,
  value,
  selectedMaterials,
  goNext,
}: {
  label: MaterialNames;
  value: number;
  selectedMaterials: number[];
  goNext: (materialId: number) => void;
}) => {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedMaterials.includes(value) }}
      className={`bg-white px-2 py-1 rounded-xl flex flex-row items-center mx-1 my-1 border-[1.5px] border-slate-300 ${
        selectedMaterials.includes(value) ? "border-blue-600 bg-blue-50" : ""
      }`}
      onPress={() => {
        goNext(value);
      }}
    >
      <Ionicons
        name={
          selectedMaterials.includes(value)
            ? "checkmark-circle"
            : "add-circle-outline"
        }
        size={20}
        color={selectedMaterials.includes(value) ? "#007AFF" : "#64748B"}
      />
      <Text
        className={`ml-1 ${
          selectedMaterials.includes(value) ? "text-blue-800" : "text-slate-700"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};

function SelectMaterial({
  selectedMaterials,
  goNext,
  type,
}: {
  selectedMaterials: number[];
  goNext: (materialId: number) => void;
  type: "incoming" | "outgoing";
}) {
  return (
    <View>
      <ModalHeader title="Choose Material" type={type} />
      <View className="p-1">
        {Object.entries(MATERIAL_CATEGORIES).map(([category, materials]) => (
          <View key={category} className="mb-2 pb-2">
            <Text className="text-lg font-dm-medium text-slate-600 tracking-tighter my-2">
              {category}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {materials.map((material) => (
                <SelectMaterialChip
                  key={material}
                  label={material}
                  value={MATERIAL_ID_MAP[material]}
                  selectedMaterials={selectedMaterials}
                  goNext={goNext}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const MaterialForm = ({
  materialId,
  handleAddMaterial,
  goBack,
  type,
  selectedMaterials,
  handleRemoveMaterial,
  hasBack = true,
}: {
  materialId: number | null;
  selectedMaterials: number[];
  handleAddMaterial: () => void;
  goBack: () => void;
  type: "incoming" | "outgoing";
  handleRemoveMaterial: () => void;
  hasBack?: boolean;
}) => {
  if (!materialId) return null;

  const materialName =
    MATERIAL_OPTIONS.find((m) => m.value === materialId)?.label || "";

  const isSelected = selectedMaterials.includes(materialId);

  return (
    <View>
      <ModalHeader
        title={materialName}
        type={type}
        hasBack={hasBack}
        goBack={goBack}
      />
      <View className="flex-col justify-between">
        <Text className="text-base font-dm-medium text-slate-600 tracking-tighter my-2">
          Weight
        </Text>
        <TextInput
          className="border-[1.5px] border-slate-300 rounded-md"
          placeholder="Weight in kg"
          inputMode="numeric"
        />
      </View>
      <View className="gap-2 my-2">
        <Pressable
          onPress={handleAddMaterial}
          className="p-4 rounded-md bg-blue-600"
        >
          <Text className="text-base text-center font-dm-bold text-white tracking-tighter">
            {isSelected ? "Update" : "Add"} {materialName}
          </Text>
        </Pressable>
        {isSelected && (
          <Pressable
            onPress={() => {
              handleRemoveMaterial();
            }}
            className="p-4 rounded-md bg-red-100"
          >
            <Text className="text-center font-dm-medium text-red-600">
              Remove material
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const ModalHeader = ({
  title,
  type,
  hasBack = false,
  goBack,
}: {
  title: string;
  type: "incoming" | "outgoing";
  hasBack?: boolean;
  goBack?: () => void;
}) => {
  return (
    <View className="flex-row gap-3 items-center relative">
      {hasBack && (
        <Pressable
          onPress={goBack}
          className="h-max w-max bg-slate-200 justify-center items-center p-2 rounded-full"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
      )}
      <View className="py-2">
        <Text className="text-xs font-dm-medium text-slate-600 uppercase tracking-widest">
          {type} materials
        </Text>
        <View className="flex-row justify-between items-center gap-1">
          <Text className="text-xl font-dm-bold text-slate-800 tracking-tighter">
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function AddMaterialModal({
  isVisible,
  onClose,
  selectedMaterials,
  setSelectedMaterials,
  type,
}: {
  isVisible: boolean;
  onClose: () => void;
  selectedMaterials: number[];
  setSelectedMaterials: (materials: number[]) => void;
  type: "incoming" | "outgoing";
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [chosenMaterialId, setChosenMaterialId] = useState<number | null>(null);

  const goNext = (materialId: number) => {
    setChosenMaterialId(materialId);
    setCurrentPage((prev) => Math.min(prev + 1, 1));
  };
  const goBack = () => {
    setChosenMaterialId(null);
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleClose = () => {
    setChosenMaterialId(null);
    setCurrentPage(0);
    onClose();
  };

  const handleAddMaterial = () => {
    if (chosenMaterialId) {
      setSelectedMaterials([...selectedMaterials, chosenMaterialId]);
    }
    if (currentPage === 1) {
      handleClose();
    }
  };

  const handleRemoveMaterial = () => {
    if (chosenMaterialId) {
      setSelectedMaterials(
        selectedMaterials.filter((id) => id !== chosenMaterialId)
      );
    }
  };

  const pages = [
    <SelectMaterial
      key="select"
      selectedMaterials={selectedMaterials}
      goNext={goNext}
      type={type}
    />,
    <MaterialForm
      key="details"
      materialId={chosenMaterialId}
      selectedMaterials={selectedMaterials}
      handleAddMaterial={handleAddMaterial}
      goBack={goBack}
      type={type}
      handleRemoveMaterial={handleRemoveMaterial}
      hasBack={true}
    />,
  ];

  return (
    <Modal
      visible={isVisible}
      onRequestClose={handleClose}
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
            {pages[currentPage]}
            <Pressable
              onPress={handleClose}
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
