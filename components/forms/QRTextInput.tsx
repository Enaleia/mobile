import QRCodeScanner from "@/components/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, TextInput, TouchableOpacity, View } from "react-native";

interface QRTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

const QRTextInput: React.FC<QRTextInputProps> = ({
  value,
  onChangeText,
  placeholder = "Enter or scan text...",
  className = "",
}) => {
  // State to control the QR scanner modal
  const [isQRScannerVisible, setIsQRScannerVisible] = useState(false);

  // Handler for QR scan results
  const handleQRScan = (scannedData: any) => {
    try {
      const textValue =
        typeof scannedData === "object"
          ? scannedData.data || String(scannedData)
          : String(scannedData);

      onChangeText(textValue);
      setIsQRScannerVisible(false);
    } catch (error) {
      console.error("Error processing QR data:", error);
    }
  };

  return (
    <View className="relative flex-row items-center">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        className={`flex-1 border rounded-lg p-2 px-3 ${className}`}
      />
      <TouchableOpacity
        onPress={() => setIsQRScannerVisible(true)}
        className="absolute right-2"
      >
        <Ionicons name="qr-code-outline" size={24} color="black" />
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <Modal
        visible={isQRScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsQRScannerVisible(false)}
      >
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setIsQRScannerVisible(false)}
        />
      </Modal>
    </View>
  );
};

export default QRTextInput;
