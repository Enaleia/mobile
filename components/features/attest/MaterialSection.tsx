import { useMemo, useRef, useEffect } from "react";
import { Alert, Linking, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import QRTextInput, { QRTextInputRef } from "@/components/features/scanning/QRTextInput";
import { MaterialDetail, MaterialsData } from "@/types/material";
import AddMaterialModal from "@/components/features/attest/AddMaterialModal";
import { usePreferences } from "@/contexts/PreferencesContext";

interface MaterialSectionProps {
  materials: MaterialsData | undefined;
  category: "incoming" | "outgoing";
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
  hideCodeInput?: boolean;
  disabled?: boolean;
}

const MaterialSection = ({
  materials,
  category,
  isModalVisible,
  setModalVisible,
  selectedMaterials,
  setSelectedMaterials,
  hideCodeInput = false,
  disabled = false,
}: MaterialSectionProps) => {
  const title = category === "incoming" ? "Incoming" : "Outgoing";
  const icon = category === "incoming" ? "arrow-down" : "arrow-up";
  const { autoScanQR, autoJumpToWeight } = usePreferences();

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

  // Effect to auto-launch QR scanner when material is added
  useEffect(() => {
    const handleAutoLaunchScanner = async () => {
      // Only proceed if we're in the material section and have materials
      if (selectedMaterials.length > 0 && !hideCodeInput && autoScanQR) {
        const lastIndex = selectedMaterials.length - 1;
        const lastMaterial = selectedMaterials[lastIndex];
        
        // Only launch scanner if the code field is empty
        if (!lastMaterial.code) {
          try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status === 'granted') {
              // Get the QR input ref for the last added material
              const qrInputRef = codeInputRefs.current[lastIndex];
              if (qrInputRef) {
                // Trigger the QR scanner
                qrInputRef.openScanner();
              }
            }
          } catch (error) {
            console.error("Error checking camera permissions:", error);
          }
        }
      }
    };

    // Call the function when materials change
    handleAutoLaunchScanner();
  }, [selectedMaterials.length, hideCodeInput, autoScanQR]);

  // Function to focus weight input after QR scan
  const handleQRScanComplete = (index: number) => {
    // Focus the corresponding weight input if auto-jump is enabled
    if (autoJumpToWeight && weightInputRefs.current[index]) {
      weightInputRefs.current[index]?.focus();
    }
  };

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
                  {!disabled && (
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
                  )}
                </View>
                <View
                  className={`flex-row items-center justify-between w-full rounded-lg ${
                    hideCodeInput ? "flex-1" : ""
                  }`}
                >
                  {!hideCodeInput && (
                    <Pressable
                      className={`flex-1 border-[1.5px] border-grey-3 rounded-l-2xl rounded-r-[1.7px] p-2 px-4 bg-white h-[65px] ${disabled ? 'opacity-50' : ''}`}
                      onPress={async () => {
                        if (disabled) return;
                        try {
                          const { status } = await Camera.requestCameraPermissionsAsync();
                          if (status === 'granted') {
                            setModalVisible(true); // Open scanner modal
                          } else {
                            console.warn("Camera permission denied.");
                            Alert.alert(
                              "Camera Permission Required",
                              "This permission is required to scan QR codes, Please enable it in settings.",
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
                          if (codeInputRefs.current.length <= index) {
                            codeInputRefs.current = [...codeInputRefs.current, ref];
                          } else {
                            codeInputRefs.current[index] = ref;
                          }
                        }}
                        placeholder=""
                        value={material.code || ""}
                        onChangeText={(text) => {
                          if (disabled) return;
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = { ...material, code: text };
                          setSelectedMaterials(newMaterials);
                        }}
                        onScanComplete={() => handleQRScanComplete(index)}
                        editable={!disabled}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    className={`border-[1.5px] border-grey-3 h-[65px] ${
                      !hideCodeInput
                        ? "flex-[1] border-l-0 rounded-r-2xl"
                        : "flex-1 rounded-2xl"
                    } p-2 px-4 bg-white ${disabled ? 'opacity-50' : ''}`}
                    onPress={() => {
                      if (disabled) return;
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
                          if (disabled) return;
                          const newMaterials = [...selectedMaterials];
                          newMaterials[index] = {
                            ...material,
                            weight: text === "" ? null : Number(text),
                          };
                          setSelectedMaterials(newMaterials);
                        }}
                        keyboardType="number-pad"
                        editable={!disabled}
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
      {!disabled && (
        <Pressable
          className={`flex-row items-center justify-center mt-2 bg-white-sand px-3 py-1 rounded-full border-[1.5px] border-grey-3 ${disabled ? 'opacity-50' : ''}`}
          onPress={() => {
            if (disabled) return;
            setModalVisible(true);
          }}
        >
          <Ionicons name="add-outline" size={24} color="grey-8" />
          <Text className="text-sm font-dm-bold text-slate-600 tracking-tight color-grey-8">
            Add 
          </Text>
        </Pressable>
      )}
      <AddMaterialModal
        materials={materials?.options ?? []}
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
      />
    </View>
  );
};

export default MaterialSection;