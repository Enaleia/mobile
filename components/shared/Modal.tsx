import React, { useEffect, useRef } from 'react';
import { Modal as RNModal, View, Pressable, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isVisible,
  onClose,
  children,
  className = '',
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10000)).current;

  useEffect(() => {
    if (isVisible) {
      // Start fade-in animation immediately
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Delay slide-up animation slightly
      setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }).start();
      }, 0);
    } else {
      // Reset animations when modal is hidden
      fadeAnim.setValue(0);
      slideAnim.setValue(10000);
    }
  }, [isVisible]);

  return (
    <RNModal
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      animationType="none"
    >
      <Animated.View 
        className="flex-1"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingTop: insets.top,
          opacity: fadeAnim,
          // Adding a subtle backdrop filter effect using native shadows
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
        />
        
        <Animated.View 
          className={`flex-1 ${className}`}
          style={{
            marginTop: 'auto',
            maxHeight: '95%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
}; 