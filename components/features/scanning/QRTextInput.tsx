import QRCodeScanner from "@/components/features/scanning/QRCodeScanner";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import React, {
  useCallback,
  useReducer,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Alert, Linking, Modal, Pressable, Text, TextInput, View } from "react-native";

interface QRTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  variant?: "standalone" | "embedded";
  label?: string;
  error?: string;
  editable?: boolean;
  onScanComplete?: () => void;
  keyboardType?: "default" | "numeric";
}

export interface QRTextInputRef {
  focus: () => void;
  blur: () => void;
  openScanner: () => void;
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

const QRTextInput = forwardRef<QRTextInputRef, QRTextInputProps>(
  (
    {
      value,
      onChangeText,
      placeholder = "",
      className = "",
      id = "default",
      variant = "embedded",
      label,
      error,
      editable = true,
      onScanComplete,
      keyboardType = variant === "embedded" ? "numeric" : "default",
    },
    ref
  ) => {
    const [scannerStates, dispatch] = useReducer(scannerReducer, {});
    const inputRef = React.useRef<TextInput>(null);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      blur: () => {
        inputRef.current?.blur();
      },
      openScanner: async () => {
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          if (status === 'granted') {
            setScanner(true);
          }
        } catch (error) {
          console.error("Error opening scanner:", error);
        }
      }
    }));

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
          onScanComplete?.();
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
      [id, onChangeText, onScanComplete]
    );

    const containerClass =
      variant === "standalone"
        ? "h-[65px] border-[1.5px] border-grey-3 rounded-2xl px-4 py-2 bg-white"
        : "";

    const inputClass =
      variant === "standalone"
        ? "overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-xl text-enaleia-black items-center h-[26px]"
        : "w-[100px] h-[26px] overflow-hidden my-0 py-0 font-dm-bold tracking-tighter text-xl items-center";

    return (
      <View className={containerClass}>
        {variant === "standalone" && label && (
          <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
            {label}
          </Text>
        )}
        <View className="relative flex-row items-center gap-2">
          <View className="flex-1">
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(text) => {
                onChangeText(text);
              }}
              autoCapitalize="characters"
              placeholder={placeholder}
              accessibilityLabel={placeholder}
              accessibilityRole="text"
              accessibilityState={{
                selected: !!value,
                disabled: !editable,
              }}
              accessibilityHint="Enter text or tap QR code button to scan"
              className={`${inputClass} ${className} ${error ? 'border-red-500' : 'border-gray-300'}`}
              style={{
                textAlignVertical: "center", // Ensures text is vertically centered (Android)
                paddingVertical: 0, // Removes default iOS padding
                lineHeight: 26, // Ensures proper line height consistency
              }}
              keyboardType={keyboardType}
              editable={editable}
            />
          </View>
          <View className="w-6 h-6 justify-center items-center">
            <Pressable
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={async () => {
                if (!editable) return;
                try {
                  const { status } = await Camera.requestCameraPermissionsAsync();
 
                  if (status === 'granted') {
                    setScanner(true); // Open QR scanner
                  } else {
                    console.warn("Camera permission denied.");
                    Alert.alert(
                      "QR Code scanning",
                      "Access to the camera is required to scan QR codes, Please toggle on the camera access it in settings.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Settings", style: "default", onPress: () => Linking.openSettings() }
                      ]
                    );
                  }
                } catch (error) {
                  console.error("Error requesting camera permissions:", error);
                }
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
          animationType="fade"
          onRequestClose={() => setScanner(false)}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
        >
          <View style={{ flex: 1, backgroundColor: 'black' }}>
            <QRCodeScanner
              onScan={handleQRScan}
              onClose={() => setScanner(false)}
            />
          </View>
        </Modal>
      </View>
    );
  }
);

export default QRTextInput;