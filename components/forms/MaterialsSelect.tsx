import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

const Materials = [
  { label: "Metal", value: "metal" },
  { label: "PP", value: "pp" },
  { label: "PET", value: "pet" },
  { label: "HDPE", value: "hdpe" },
  { label: "LDPE", value: "ldpe" },
  { label: "PS", value: "ps" },
];

const Chip = ({
  label,
  value,
  selectedMaterials,
  setSelectedMaterials,
}: {
  label: string;
  value: string;
  selectedMaterials: string[];
  setSelectedMaterials: (materials: string[]) => void;
}) => {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedMaterials.includes(value) }}
      className={`bg-neutral-50 px-2 py-1 rounded-lg flex flex-row items-center mx-1 my-1 border-[1.5px] border-neutral-300 ${
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
  selectedMaterials: string[];
  setSelectedMaterials: (materials: string[]) => void;
}

const MaterialsSelect = ({
  selectedMaterials,
  setSelectedMaterials,
}: MaterialsSelectProps) => {
  return (
    <View>
      <Text className="text-lg text-gray-700 font-medium">Materials</Text>
      <View className="flex flex-row flex-wrap">
        {Materials.map((material) => (
          <Chip
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
