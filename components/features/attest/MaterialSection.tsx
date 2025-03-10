import { useMemo, useRef } from "react";
import { Alert, Linking, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import QRTextInput, {
  QRTextInputRef,
} from "@/components/features/scanning/QRTextInput";
import { MaterialDetail, MaterialsData } from "@/types/material";
import AddMaterialModal from "@/components/features/attest/AddMaterialModal";

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
                <View
                  className={`flex-row items-center justify-between w-full rounded-lg ${
                    hideCodeInput ? "flex-1" : ""
                  }`}
                >
                  {!hideCodeInput && (
                  <Pressable
                    className="flex-1 border-[1.5px] border-grey-3 rounded-l-2xl rounded-r-[1.7px]  p-2 px-4 bg-white h-[65px]"
                    onPress={async () => {
                      try {
                        const { status } = await Camera.requestCameraPermissionsAsync();
 
                        if (status === 'granted') {
                          setModalVisible(true); // Open scanner modal
                        } else {
                          console.warn("Camera permission denied.");
                          Alert.alert(
                            "Camera Permission Required",
                            "This persmission is required to scan QR codes, Please enable it in settings.",
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Settings", onPress: () => Linking.openSettings() }
                            ]
                          );
                        }
                      } catch (error) {
                        console.error("Error requesting camera permissions:", error);
                      }
                    }}
                  >
                      <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                        Code
                      </Text>
                      <QRTextInput
                        ref={(ref) => {
                          // Store ref in the array
                          if (codeInputRefs.current.length <= index) {
                            codeInputRefs.current = [
                              ...codeInputRefs.current,
                              ref,
                            ];
                          } else {
                            codeInputRefs.current[index] = ref;
                          }
                        }}
                        placeholder=""
                        value={material.code || ""}
                        onChangeText={(text) => {
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = { ...material, code: text };
                          setSelectedMaterials(newMaterials);
                        }}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    className={`border-[1.5px] border-grey-3 h-[65px] ${
                      !hideCodeInput
                        ? "flex-[1] border-l-0 rounded-r-2xl"
                        : "flex-1 rounded-2xl"
                    } p-2 px-4 bg-white `}
                    onPress={() => {
                      // Focus the weight input when its container is tapped
                      if (weightInputRefs.current[index]) {
                        weightInputRefs.current[index]?.focus();
                      }
                    }}
                  >
                    <Text className="w-full text-sm font-dm-bold text-grey-6 tracking-tighter text-left">
                      Weight
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        ref={(ref) => {
                          // Store ref in the array
                          if (weightInputRefs.current.length <= index) {
                            weightInputRefs.current = [
                              ...weightInputRefs.current,
                              ref,
                            ];
                          } else {
                            weightInputRefs.current[index] = ref;
                          }
                        }}
                        value={material.weight?.toString() || ""}
                        style={{
                          textAlign: "left",
                          direction: "ltr",
                        }}
                        className="flex-1 h-[28px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl text-left"
                        onChangeText={(text) => {
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = {
                            ...material,
                            weight: text === "" ? null : Number(text),
                          };
                          setSelectedMaterials(newMaterials);
                        }}
                        keyboardType="numeric"
                      />
                      <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter text-right self-end pl-1">
                        kg
                      </Text>
                    </View>
                  </Pressable>
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
