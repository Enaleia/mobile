import ModalBase from "@/components/shared/ModalBase";
import { View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InitializationModalProps {
  isVisible: boolean;
  progress: {
    user: boolean;
    actions: boolean;
    materials: boolean;
    collectors: boolean;
    products: boolean;
  };
  error: Error | null;
}

function ProgressItem({
  label,
  isComplete,
}: {
  label: string;
  isComplete: boolean;
}) {
  return (
    <View className="flex-row items-center space-x-2 py-2">
      {isComplete ? (
        <Ionicons name="checkmark-circle" size={24} color="green" />
      ) : (
        <ActivityIndicator size="small" />
      )}
      <Text className="text-base font-dm-medium">{label}</Text>
    </View>
  );
}

export function InitializationModal({
  isVisible,
  progress,
  error,
}: InitializationModalProps) {
  return (
    <ModalBase isVisible={isVisible} onClose={() => {}} canClose={false}>
      <View className="p-4">
        <Text className="text-xl font-dm-bold mb-4">
          Please wait while we load the required data...
        </Text>

        <ProgressItem label="User Info" isComplete={progress.user} />
        <ProgressItem label="Actions" isComplete={progress.actions} />
        <ProgressItem label="Materials" isComplete={progress.materials} />
        <ProgressItem label="Collectors" isComplete={progress.collectors} />
        <ProgressItem label="Products" isComplete={progress.products} />

        {error && (
          <View className="mt-4 p-4 bg-red-50 rounded-lg">
            <Text className="text-red-600">Error: {error.message}</Text>
          </View>
        )}
      </View>
    </ModalBase>
  );
}
