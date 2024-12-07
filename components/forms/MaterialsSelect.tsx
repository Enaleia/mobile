import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { MATERIAL_OPTIONS } from "@/constants/material";
import { MaterialNames } from "@/types/material";

const MaterialChip = ({
  label,
  value,
  selectedMaterials,
  setSelectedMaterials,
}: {
  label: MaterialNames;
  value: number;
  selectedMaterials: number[];
  setSelectedMaterials: (materials: number[]) => void;
}) => {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedMaterials.includes(value) }}
      className={`bg-neutral-50 px-2 py-1 rounded-xl flex flex-row items-center mx-1 my-1 border-[1.5px] border-neutral-300 ${
        selectedMaterials.includes(value) ? "border-blue-600 bg-blue-50" : ""
      }`}
      onPress={() => {
        selectedMaterials.includes(value)
          ? setSelectedMaterials(selectedMaterials.filter((m) => m !== value))
          : setSelectedMaterials([...selectedMaterials, value]);
      }}
    >
      <Ionicons
        name={
          selectedMaterials.includes(value)
            ? "checkmark-circle"
            : "add-circle-outline"
        }
        size={20}
        color={selectedMaterials.includes(value) ? "#007AFF" : "gray"}
      />
      <Text
        className={`ml-1 ${
          selectedMaterials.includes(value)
            ? "text-blue-800"
            : "text-neutral-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};

interface MaterialsSelectProps {
  selectedMaterials: number[];
  setSelectedMaterials: (materials: number[]) => void;
}

const MaterialsSelect = ({
  selectedMaterials,
  setSelectedMaterials,
}: MaterialsSelectProps) => {
  return (
    <View>
      <View className="flex flex-row flex-wrap">
        {MATERIAL_OPTIONS.map((material) => (
          <MaterialChip
            key={material.value}
            label={material.label}
            value={material.value}
            selectedMaterials={selectedMaterials}
            setSelectedMaterials={setSelectedMaterials}
          />
        ))}
      </View>
    </View>
  );
};

export default MaterialsSelect;
