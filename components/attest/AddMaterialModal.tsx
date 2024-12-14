import {
  MATERIAL_CATEGORIES,
  MATERIAL_NAME_TO_ID,
  MATERIAL_OPTIONS,
} from "@/constants/material";
import { MaterialDetails, MaterialNames } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import FormSection from "@/components/forms/FormSection";
import QRTextInput from "@/components/forms/QRTextInput";

const SelectMaterialChip = ({
  label,
  value,
  selectedMaterials,
  goNext,
}: {
  label: MaterialNames;
  value: number;
  selectedMaterials: MaterialDetails;
  goNext: (materialId: number) => void;
}) => {
  const isSelected = useMemo(() => {
    if (!selectedMaterials[value]) return false;
    const isWeightSelected = selectedMaterials[value]?.weight > 0;
    const isCodeSelected = selectedMaterials[value]?.code !== "";
    return isWeightSelected || isCodeSelected;
  }, [selectedMaterials, value]);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={`bg-white px-2 py-1 rounded-xl flex flex-row items-center mx-1 my-1 border-[1.5px] border-slate-300 ${
        isSelected ? "border-blue-600 bg-blue-50" : ""
      }`}
      onPress={() => {
        goNext(value);
      }}
    >
      <Ionicons
        name={isSelected ? "checkmark-circle" : "add-circle-outline"}
        size={20}
        color={isSelected ? "#007AFF" : "#64748B"}
      />
      <Text
        className={`ml-1 ${isSelected ? "text-blue-800" : "text-slate-700"}`}
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
  handleClose,
}: {
  selectedMaterials: MaterialDetails;
  goNext: (materialId: number) => void;
  type: "incoming" | "outgoing";
  handleClose: () => void;
}) {
  return (
    <View>
      <ModalHeader title="Choose Material" type={type} />
      <Text className="text-sm font-dm-regular text-slate-700 my-2 border-l-2 rounded-l-sm border-slate-300 pl-2 py-0.5">
        You can return to this screen anytime to add or update materials. Tap a
        selected item to update or remove it.
      </Text>
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
                  value={MATERIAL_NAME_TO_ID[material]}
                  selectedMaterials={selectedMaterials}
                  goNext={goNext}
                />
              ))}
            </View>
          </View>
        ))}
        <Pressable onPress={handleClose} className="p-4 rounded-md bg-blue-600">
          <Text className="text-base text-center font-dm-bold text-white tracking-tighter">
            Done
          </Text>
        </Pressable>
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
  selectedMaterials: MaterialDetails;
  handleAddMaterial: ({
    weight,
    code,
  }: {
    weight: number;
    code: string;
  }) => void;
  goBack: () => void;
  type: "incoming" | "outgoing";
  handleRemoveMaterial: () => void;
  hasBack?: boolean;
}) => {
  if (!materialId) return null;

  const materialName =
    MATERIAL_OPTIONS.find((m) => m.value === materialId)?.label || "";

  const isSelected =
    selectedMaterials[materialId] !== undefined &&
    (selectedMaterials[materialId]?.weight > 0 ||
      selectedMaterials[materialId]?.code !== null);

  const [currentWeight, setCurrentWeight] = useState(
    selectedMaterials[materialId]?.weight || 0
  );
  const [currentCode, setCurrentCode] = useState(
    selectedMaterials[materialId]?.code || ""
  );

  return (
    <View>
      <ModalHeader
        title={materialName}
        type={type}
        hasBack={hasBack}
        goBack={goBack}
      />
      <View className="flex-1 px-4 py-6 space-y-4">
        <View className="flex-col justify-between">
          <Text className="text-base font-dm-medium text-slate-600 tracking-tighter my-2">
            Weight (kg)
          </Text>
          <TextInput
            value={currentWeight.toString()}
            onChangeText={(text) => {
              const parsed = parseInt(text, 10);
              setCurrentWeight(isNaN(parsed) ? 0 : parsed);
            }}
            placeholder="0"
            inputMode="numeric"
            className={`flex-1 border-[1.5px] rounded-lg p-2 px-3 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2`}
          />
        </View>
        <View className="flex-col justify-between">
          <Text className="text-base font-dm-medium text-slate-600 tracking-tighter my-2">
            Code
          </Text>
          <QRTextInput
            value={currentCode}
            onChangeText={(text) => {
              setCurrentCode(text);
            }}
            placeholder="Code"
          />
        </View>
      </View>

      <View className="gap-2">
        <Pressable
          onPress={() => {
            if (currentWeight > 0 || currentCode !== "") {
              handleAddMaterial({ weight: currentWeight, code: currentCode });
            }
          }}
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
        <Text className="text-xs font-dm-medium text-blue-700 uppercase tracking-widest">
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
  selectedMaterials: MaterialDetails;
  setSelectedMaterials: (materials: MaterialDetails) => void;
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

  const handleAddMaterial = ({
    weight,
    code,
  }: {
    weight: number;
    code: string;
  }) => {
    if (chosenMaterialId) {
      // only add if it has a weight or code
      if (weight > 0 || code !== "") {
        setSelectedMaterials({
          ...selectedMaterials,
          [chosenMaterialId]: { weight, code },
        });
      }
    }
    Keyboard.dismiss();
    goBack();
  };

  const handleRemoveMaterial = () => {
    if (chosenMaterialId) {
      setSelectedMaterials(
        Object.fromEntries(
          Object.entries(selectedMaterials).filter(
            ([id]) => parseInt(id, 10) !== chosenMaterialId
          )
        )
      );
    }

    goBack();
  };

  const pages = [
    <SelectMaterial
      key="select"
      selectedMaterials={selectedMaterials}
      goNext={goNext}
      type={type}
      handleClose={handleClose}
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
