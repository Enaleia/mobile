import AddMaterialModal from "@/components/features/attest/AddMaterialModal";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import { MaterialDetail, MaterialsData } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

const MaterialSection = ({
  materials,
  category,
  isModalVisible,
  setModalVisible,
  selectedMaterials,
  setSelectedMaterials,
}: {
  materials: MaterialsData | undefined;
  category: "incoming" | "outgoing";
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
}) => {
  const title = category === "incoming" ? "Incoming" : "Outgoing";
  const icon = category === "incoming" ? "arrow-down" : "arrow-up";
  const iconRotation = category === "incoming" ? "-rotate-45" : "rotate-45";
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const getMaterialCount = useMemo(() => {
    return (materialId: number, currentIndex: number) => {
      const totalCount = selectedMaterials.filter(
        (material) => material.id === materialId
      ).length;

      if (totalCount === 1) return null;

      const position = selectedMaterials
        .slice(0, currentIndex + 1)
        .filter((material) => material.id === materialId).length;

      return `(${position} of ${totalCount})`;
    };
  }, [selectedMaterials]);

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials.splice(index, 1);
    setSelectedMaterials(newMaterials);
  };

  if (!materials) {
    return null;
  }

  return (
    <View className="mt-6">
      <View className="flex-row items-start space-x-1 mb-1">
        <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter">
          {title}
        </Text>
        <View className={iconRotation}>
          <Ionicons name={icon} size={24} color="#8E8E93" />
        </View>
      </View>
      <View className="flex-col items-center justify-center">
        {selectedMaterials.length > 0 ? (
          <View className="w-full">
            {selectedMaterials.map(({ id, weight, code }, materialIndex) => (
              <View key={materialIndex} className="mb-5">
                <View className="flex-row items-center justify-between w-full mb-1">
                  <Text className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px]">
                    {materials?.idToName?.[id] ?? "Unknown Material"}
                    {getMaterialCount(id, materialIndex) && (
                      <Text className="text-sm font-dm-regular text-grey-6">
                        {" "}
                        {getMaterialCount(id, materialIndex)}
                      </Text>
                    )}
                  </Text>
                  {isDeleting === materialIndex ? (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => setIsDeleting(null)}
                        className="active:opacity-70 bg-white rounded-full px-2 py-1 flex-row items-center justify-center space-x-1"
                      >
                        <Text className="text-xs font-dm-regular text-enaleia-black tracking-tighter">
                          Cancel
                        </Text>
                        <Ionicons
                          name="close-outline"
                          size={16}
                          color="#8E8E93"
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          handleRemoveMaterial(materialIndex);
                          setIsDeleting(null);
                        }}
                        className="active:opacity-70 bg-red-500 rounded-full px-2 py-1 flex-row items-center justify-center space-x-1"
                      >
                        <Text className="text-xs font-dm-regular text-white tracking-tighter">
                          Delete
                        </Text>
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="white"
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setIsDeleting(materialIndex)}
                      className="active:opacity-70"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={24}
                        color="#8E8E93"
                      />
                    </Pressable>
                  )}
                </View>
                <View className="flex-row items-center justify-between w-full rounded-lg">
                  <View className="flex-1 border-[1.5px] border-grey-3 rounded-l-2xl p-2 bg-white">
                    <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                      Code
                    </Text>
                    <QRTextInput
                      value={code || ""}
                      onChangeText={(text) => {
                        setSelectedMaterials(
                          selectedMaterials.map((material, index) =>
                            index === materialIndex
                              ? { ...material, code: text }
                              : material
                          )
                        );
                      }}
                    />
                  </View>
                  <View className="flex-1 border-[1.5px] border-grey-3 border-l-0 rounded-r-2xl p-2 bg-white justify-end">
                    <Text className="w-full text-sm font-dm-bold text-grey-6 tracking-tighter text-right">
                      Weight
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        value={weight.toString()}
                        className="flex-1 h-[28px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl text-right"
                        onChangeText={(text) => {
                          const parsedWeight = Number(text);
                          setSelectedMaterials(
                            selectedMaterials.map((material, index) =>
                              index === materialIndex
                                ? {
                                    ...material,
                                    weight: isNaN(parsedWeight)
                                      ? 0
                                      : parsedWeight,
                                  }
                                : material
                            )
                          );
                        }}
                        keyboardType="numeric"
                      />
                      <Text className="flex-[0.2] text-sm font-dm-bold text-grey-6 tracking-tighter text-right">
                        kg
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <Pressable
        className="flex-row items-center justify-center mt-2 bg-white px-3 py-2 rounded-full border-[1.5px] border-grey-3"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={24} color="#8E8E93" />
        <Text className="text-sm font-dm-bold text-slate-600 tracking-tight">
          Add {category}
        </Text>
      </Pressable>
      <AddMaterialModal
        materials={materials?.options}
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
      />
    </View>
  );
};

export default MaterialSection;
