import { MaterialDetail, MaterialNames, MaterialsData } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Animated,
  StyleSheet,
  Dimensions,
  PanResponder,
} from "react-native";
import { Modal as RNModal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SelectMaterialChip = React.memo(
  ({
    label,
    value,
    handleAddMaterial,
  }: {
    label: MaterialNames;
    value: number;
    handleAddMaterial: (materialId: number) => void;
  }) => {
    const handlePress = useCallback(() => {
      handleAddMaterial(value);
    }, [value, handleAddMaterial]);

    return (
      <Pressable
        accessibilityLabel={`Select ${label}`}
        accessibilityRole="button"
        accessibilityHint={`Tap to select ${label} material`}
        className="bg-white w-full px-4 py-3 rounded-3xl flex flex-row items-center justify-center border-[1.5px] border-grey-3"
        onPress={handlePress}
      >
        <Text className="text-[15px] font-dm-bold text-enaleia-black tracking-tighter text-center">
          {label}
        </Text>
      </Pressable>
    );
  }
);

const SelectMaterial = React.memo(
  ({
    materials,
    handleAddMaterial,
  }: {
    materials: MaterialsData["options"];
    handleAddMaterial: (materialId: number) => void;
  }) => {
    return (
      <View accessibilityRole="none" accessibilityLabel="Material selection">
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
            width: '100%'
          }}
          accessibilityRole="none"
          accessibilityLabel="Available materials"
        >
          {materials.map(({ label, value }) => (
            <View 
              key={value} 
              style={{
                width: '50%',
                paddingHorizontal: 4,
                marginBottom: 8
              }}
            >
              <SelectMaterialChip
                label={label as MaterialNames}
                value={value}
                handleAddMaterial={handleAddMaterial}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }
);

export default function AddMaterialModal({
  isVisible,
  onClose,
  selectedMaterials,
  setSelectedMaterials,
  materials,
  onMaterialSelect,
}: {
  isVisible: boolean;
  materials: MaterialsData["options"];
  onClose: () => void;
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
  onMaterialSelect?: () => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Create the pan responder for swipe gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only handle vertical gestures that are moving downward
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down, not up (beyond the starting position)
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If dragged down more than 100px or with high velocity, dismiss the modal
        if (gestureState.dy > 100 || (gestureState.vy > 0.5 && gestureState.dy > 0)) {
          closeModal();
        } else {
          // Otherwise, snap back to original position
          Animated.spring(dragY, {
            toValue: 0,
            tension: 80,
            friction: 12,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Animation when modal visibility changes
  useEffect(() => {
    if (isVisible) {
      // Reset the drag position
      dragY.setValue(0);
      
      // Start fade-in animation immediately
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Slide up animation with natural spring physics
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(Dimensions.get('window').height);
    }
  }, [isVisible]);

  // Function to close the modal with animation
  const closeModal = (skipAnimation = false) => {
    if (skipAnimation) {
      // Immediately close without animation
      onClose();
      return;
    }
    
    // Animate closing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      dragY.setValue(0);
    });
  };

  // Handle modal request close (for hardware back button, etc)
  const handleRequestClose = () => {
    closeModal();
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    closeModal();
  };

  const handleAddMaterial = async (materialId: number) => {
    const currentMaterials = selectedMaterials || [];
    const newMaterialDetails: MaterialDetail[] = [
      ...currentMaterials,
      {
        id: materialId,
        weight: null,
        code: "",
      },
    ];
    setSelectedMaterials(newMaterialDetails);
    Keyboard.dismiss();
    
    // Close modal without animation to ensure auto QR scanner works
    closeModal(true);
    
    if (onMaterialSelect) {
      await onMaterialSelect();
    }
  };

  // Combine the base slide animation with the drag gesture
  const translateY = Animated.add(slideAnim, dragY);

  return (
    <RNModal
      transparent={true}
      visible={isVisible}
      onRequestClose={handleRequestClose}
      statusBarTranslucent={Platform.OS === 'android'}
      animationType="none"
    >
      <Animated.View 
        style={[
          styles.overlay,
          { 
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingTop: insets.top,
            opacity: fadeAnim,
          }
        ]}
      >
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
        />
        
        <Animated.View 
          style={[
            styles.contentContainer,
            {
              paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
              transform: [{ translateY: translateY }],
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandle} />
          
          {/* Fixed Header */}
          <View style={styles.headerContainer}>
            <Text className="text-3xl font-dm-bold text-enaleia-black text-center w-full">
              Select Material
            </Text>
          </View>
          
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.materialsContainer}>
                <SelectMaterial
                  materials={materials}
                  handleAddMaterial={handleAddMaterial}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 'auto',
    height: '90%',
    maxHeight: '90%',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDDDDD',
    marginVertical: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 0,
    borderBottomColor: '#EEEEEE',
    backgroundColor: 'white',
    zIndex: 10,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  materialsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
});
