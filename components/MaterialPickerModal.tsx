import { Ionicons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Easing } from "react-native-reanimated";
import MaterialsSelect from "./forms/MaterialsSelect";
import { Picker } from "@react-native-picker/picker";
import { MATERIAL_OPTIONS } from "@/constants/material";

type MaterialPickerModalProps = {
  selectedMaterials: number[];
  setSelectedMaterials: (materials: number[]) => void;
  type: "incoming" | "outgoing";
  isVisible: boolean;
  onClose: () => void;
};

export default function MaterialPickerModal({
  selectedMaterials,
  setSelectedMaterials,
  isVisible,
  onClose,
  type,
}: MaterialPickerModalProps) {
  return (
    <Modal transparent visible={isVisible}>
      <AnimatePresence>
        {isVisible && (
          <MotiView
            key="bg"
            from={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            exitTransition={{ type: "timing", duration: 500, delay: 600 }}
            className="flex-1 bg-neutral-800/70 filter backdrop-blur-lg"
          >
            <MotiView
              key="content"
              from={{
                translateY: 100,
              }}
              animate={{
                translateY: 0,
              }}
              transition={{
                type: "timing",
                duration: 200,
                easing: Easing.out(Easing.ease),
              }}
              exit={{
                translateY: 100,
              }}
              exitTransition={{
                type: "timing",
                duration: 200,
                delay: 600,
                easing: Easing.out(Easing.ease),
              }}
              className="max-h-[50vh] bg-white absolute bottom-0 w-full rounded-t-lg overflow-hidden"
            >
              <View className="flex-row justify-between items-center p-4">
                <Text className="text-xl font-dm-medium text-neutral-600 tracking-tighter">
                  Choose {type} materials
                </Text>
                <Pressable onPress={onClose}>
                  <Ionicons name="close" size={24} color="black" />
                </Pressable>
              </View>
              <ScrollView className="px-3 py-2">
                <MaterialsSelect
                  selectedMaterials={selectedMaterials}
                  setSelectedMaterials={setSelectedMaterials}
                />
              </ScrollView>
              {/* <View className="p-4">
                <View className="flex-row justify-between items-center space-y-4">
                  <Text className="text-xl font-dm-medium text-neutral-600 tracking-tighter">
                    Add material
                  </Text>
                  <Pressable onPress={onClose}>
                    <Ionicons name="close" size={24} color="black" />
                  </Pressable>
                </View>
                <View className="border-[1.5px] border-neutral-300 rounded-md mb-4">
                  <Picker
                    selectedValue={selectedMaterials}
                    onValueChange={setSelectedMaterials}
                    placeholder="Select material"
                  >
                    {MATERIAL_OPTIONS.map(({ label, value }) => (
                      <Picker.Item key={value} label={label} value={value} />
                    ))}
                  </Picker>
                </View>
              </View> */}
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>
    </Modal>
  );
}
