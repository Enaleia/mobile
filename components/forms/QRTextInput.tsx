import QRCodeScanner from "@/components/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, TextInput, TouchableOpacity, View, Text } from "react-native";

interface QRTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  ref?: React.RefObject<TextInput>;
  id?: string;
}

const QRTextInput: React.FC<QRTextInputProps> = ({
  value,
  onChangeText,
  placeholder = "Enter or scan text...",
  className = "",
  id = "default",
}) => {
  const [scannerStates, setScannerStates] = useState<{
    [key: string]: { isVisible: boolean; error: string | null };
  }>({});

  const currentState = scannerStates[id] || { isVisible: false, error: null };

  const setScanner = (isVisible: boolean) => {
    setScannerStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], isVisible },
    }));
  };

  const setError = (error: string | null) => {
    setScannerStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], error },
    }));
  };

  const handleQRScan = (scannedData: unknown) => {
    try {
      let textValue: string;

      if (typeof scannedData === "string") {
        textValue = scannedData;
      } else if (
        scannedData &&
        typeof scannedData === "object" &&
        "data" in scannedData
      ) {
        textValue = String(scannedData.data);
      } else {
        throw new Error("Invalid QR code data format");
      }

      if (!textValue.trim()) {
        throw new Error("QR code data is empty");
      }

      onChangeText(textValue.trim());
      setError(null);
      setScanner(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to process QR code"
      );
      console.error("Error processing QR data:", error);
    }
  };

  return (
    <View>
      <View className="relative flex-row items-center">
        <TextInput
          value={value}
          onChangeText={(text) => {
            setError(null);
            onChangeText(text);
          }}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          accessibilityRole="text"
          accessibilityState={{ selected: !!value }}
          className={`flex-1 border-[1.5px] border-neutral-300 rounded-lg p-2 px-3 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 ${className}`}
        />
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setScanner(true);
          }}
          className="absolute right-2"
        >
          <Ionicons name="qr-code-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {currentState.error && (
        <Text className="text-red-500 text-sm mt-1">{currentState.error}</Text>
      )}

      <Modal
        visible={currentState.isVisible}
        animationType="slide"
        onRequestClose={() => setScanner(false)}
      >
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setScanner(false)}
        />
      </Modal>
    </View>
  );
};

export default QRTextInput;
