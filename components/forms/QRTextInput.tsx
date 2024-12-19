import QRCodeScanner from "@/components/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

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
  placeholder = "",
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
      <View className="relative flex-row items-center gap-2">
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
          className={`w-[100px] h-[28px] overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl ${className}`}
        />
        <Pressable
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => {
            setError(null);
            setScanner(true);
          }}
          className="absolute right-2.5 z-10 active:scale-75"
        >
          <Ionicons name="qr-code-outline" size={24} color="#8E8E93" />
        </Pressable>
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
