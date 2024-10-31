import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCodeScanner from "@/components/QRCodeScanner";

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
    onChangeText(scannedData);
    console.log({ scannedData });
    setIsQRScannerVisible(false);
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
