import QRCodeScanner from "@/components/features/scanning/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useReducer } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

interface QRTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  ref?: React.RefObject<TextInput>;
  id?: string;
  variant?: "standalone" | "embedded";
}

const scannerReducer = (state: any, action: any) => {
  switch (action.type) {
    case "SET_SCANNER":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          isVisible: action.payload.isVisible,
        },
      };
    case "SET_ERROR":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          error: action.payload.error,
        },
      };
    default:
      return state;
  }
};

const QRTextInput: React.FC<QRTextInputProps> = React.memo(
  ({
    value,
    onChangeText,
    placeholder = "",
    className = "",
    id = "default",
    variant = "embedded",
  }) => {
    const [scannerStates, dispatch] = useReducer(scannerReducer, {});

    const currentState = scannerStates[id] || { isVisible: false, error: null };

    const setScanner = (isVisible: boolean) => {
      dispatch({
        type: "SET_SCANNER",
        payload: {
          id,
          isVisible,
        },
      });
    };

    const setError = (error: string | null) => {
      dispatch({
        type: "SET_ERROR",
        payload: {
          id,
          error,
        },
      });
    };

    const handleQRScan = useCallback(
      (scannedData: unknown) => {
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
          dispatch({
            type: "SET_ERROR",
            payload: {
              id,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to process QR code",
            },
          });
        }
      },
      [id, onChangeText]
    );

    const containerClass =
      variant === "standalone"
        ? "h-12 border-[1.5px] border-grey-3 rounded-lg p-2 bg-white items-center"
        : "";

    const inputClass =
      variant === "standalone"
        ? "overflow-hidden my-0 py-0 font-dm-regular tracking-tighter text-base items-center h-full"
        : "w-[100px] h-[28px] overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-lg items-center";

    return (
      <View className={containerClass}>
        <View className="relative flex-row items-center gap-2">
          <View className="flex-1">
            <TextInput
              value={value}
              onChangeText={(text) => {
                setError(null);
                onChangeText(text);
                setScanner(false);
              }}
              placeholder={placeholder}
              accessibilityLabel={placeholder}
              accessibilityRole="text"
              accessibilityState={{
                selected: !!value,
                disabled: false,
              }}
              accessibilityHint="Enter text or tap QR code button to scan"
              className={`${inputClass} ${className}`}
            />
          </View>
          <View className="w-6 h-6 justify-center items-center">
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setError(null);
                setScanner(true);
              }}
              className="active:scale-75 transition-transform"
              accessibilityRole="button"
              accessibilityLabel="Open QR scanner"
              accessibilityHint="Double tap to open QR code scanner"
            >
              <Ionicons name="qr-code-outline" size={24} color="#8E8E93" />
            </Pressable>
          </View>
        </View>

        {currentState.error && (
          <Text className="text-red-500 text-sm mt-1">
            {currentState.error}
          </Text>
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
  }
);

export default QRTextInput;
