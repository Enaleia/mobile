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
      className={`bg-neutral-100 px-2 py-1 rounded-lg flex flex-row items-center mx-1 my-1 border border-transparent ${
        selectedMaterials.includes(value) ? "border-blue-500 bg-blue-50" : ""
      }`}
      onPress={() => {
        selectedMaterials.includes(value)
          ? setSelectedMaterials(selectedMaterials.filter((m) => m !== value))
          : setSelectedMaterials([...selectedMaterials, value]);
      }}
    >
      <Ionicons
        name={selectedMaterials.includes(value) ? "checkmark" : "add"}
        size={18}
        color={selectedMaterials.includes(value) ? "blue" : "gray"}
      />
      <Text className="ml-1">{label}</Text>
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
