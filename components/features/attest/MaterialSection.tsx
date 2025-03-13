import AddMaterialModal from "@/components/features/attest/AddMaterialModal";
import QRTextInput, {
  QRTextInputRef,
} from "@/components/features/scanning/QRTextInput";
import { MaterialDetail, MaterialsData } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface MaterialSectionProps {
  materials: MaterialsData | undefined;
  category: "incoming" | "outgoing";
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
  hideCodeInput?: boolean;
}

const MaterialSection = ({
  materials,
  category,
  isModalVisible,
  setModalVisible,
  selectedMaterials,
  setSelectedMaterials,
  hideCodeInput,
}: MaterialSectionProps) => {
  const title = category === "incoming" ? "Incoming" : "Outgoing";
  const icon = category === "incoming" ? "arrow-down" : "arrow-up";

  // Create refs array for weight inputs
  const weightInputRefs = useRef<Array<TextInput | null>>([]);
  // Create refs array for QR code inputs
  const codeInputRefs = useRef<Array<QRTextInputRef | null>>([]);

  const getMaterialCount = useMemo(() => {
    return (id: number, currentIndex: number) => {
      const count = selectedMaterials.filter(
        (material, index) => material.id === id && index < currentIndex
      ).length;
      return count > 0 ? `(${count + 1})` : "";
    };
  }, [selectedMaterials]);

  if (!materials) {
    return null;
  }

  return (
    <View>
      <View className="flex-row items-start space-x-1 mb-1">
        <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter">
          {title}
        </Text>
        <View className={category === "incoming" ? "-rotate-45" : "rotate-45"}>
          <Ionicons name={icon} size={24} color="#8E8E93" />
        </View>
      </View>
      <View className="flex-col items-center justify-center">
        {selectedMaterials.length > 0 ? (
          <View className="w-full">
            {selectedMaterials.map((material, index) => (
              <View key={index} className="mb-3">
                <View className="flex-row items-center justify-between w-full mb-1">
                  <Text className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px]">
                    {materials?.idToName?.[material.id] ?? "Unknown Material"}
                    <Text className="text-sm font-dm-regular text-grey-6">
                      {" "}
                      {getMaterialCount(material.id, index)}
                    </Text>
                  </Text>
                  <Pressable
                    onPress={() => {
                      const newMaterials = [...selectedMaterials];
                      newMaterials.splice(index, 1);
                      setSelectedMaterials(newMaterials);
                    }}
                    className="active:opacity-70"
                  >
                    <Ionicons name="trash-outline" size={24} color="#8E8E93" />
                  </Pressable>
                </View>
                <View className="flex-row items-center space-x-2">
                  <View className="flex-1">
                    <TextInput
                      ref={(el) => (weightInputRefs.current[index] = el)}
                      className="bg-white px-4 py-3 rounded-3xl border-[1.5px] border-grey-3 text-base font-dm-regular text-enaleia-black tracking-tighter"
                      placeholder="Weight (kg)"
                      keyboardType="numeric"
                      value={material.weight?.toString() ?? ""}
                      onChangeText={(text) => {
                        const newMaterials = [...selectedMaterials];
                        newMaterials[index] = {
                          ...newMaterials[index],
                          weight: text ? parseFloat(text) : null,
                        };
                        setSelectedMaterials(newMaterials);
                      }}
                      onSubmitEditing={() => {
                        if (index < selectedMaterials.length - 1) {
                          weightInputRefs.current[index + 1]?.focus();
                        }
                      }}
                      returnKeyType={
                        index === selectedMaterials.length - 1 ? "done" : "next"
                      }
                    />
                  </View>
                  {!hideCodeInput && (
                    <View className="flex-1">
                      <QRTextInput
                        ref={(el) => (codeInputRefs.current[index] = el)}
                        value={material.code || ""}
                        onChangeText={(text) => {
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = {
                            ...newMaterials[index],
                            code: text,
                          };
                          setSelectedMaterials(newMaterials);
                          if (text && index < selectedMaterials.length - 1) {
                            codeInputRefs.current[index + 1]?.focus();
                          }
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <Pressable
        className="flex-row items-center justify-center mt-2 bg-white-sand px-3 py-2 rounded-full border-[1.5px] border-grey-6"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={24} color="#8E8E93" />
        <Text className="text-sm font-dm-bold text-slate-600 tracking-tight">
          Add
        </Text>
      </Pressable>
      <AddMaterialModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
        materials={materials?.options || []}
      />
    </View>
  );
};

export default MaterialSection;
