import React from 'react';
import { Modal as RNModal, View, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
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

  return (
    <RNModal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View 
        className="flex-1"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)',
          paddingTop: insets.top,
        }}
      >
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
        >
          <BlurView
            intensity={10}
            className="flex-1"
          />
        </Pressable>
        
        <View 
          className={`flex-1 ${className}`}
          style={{
            marginTop: 'auto',
            maxHeight: '95%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          {children}
        </View>
      </View>
    </RNModal>
  );
}; 