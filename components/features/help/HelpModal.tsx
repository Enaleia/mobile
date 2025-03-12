import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Icon } from '@/components/shared/Icon';
import { Modal } from '@/components/shared/Modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HelpModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  icons?: Array<{
    name: string;
    icon: React.ReactNode;
  }>;
  content: React.ReactNode;
  importantNote?: string;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isVisible,
  onClose,
  title,
  icons,
  content,
  importantNote,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      className="m-0 mt-auto bg-white rounded-t-2xl overflow-hidden"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="px-5 py-4 flex-row justify-between items-center border-b border-gray-100">
          <Text className="text-2xl font-dm-bold text-enaleia-black">
            {title}
          </Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 items-center justify-center rounded-full"
            accessibilityLabel="Close help modal"
            accessibilityHint="Closes the help information modal"
          >
            <Icon name="close" size={24} color="#0D0D0D" />
          </Pressable>
        </View>

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 20
          }}
        >
          {/* Icons Section */}
          {icons && icons.length > 0 && (
            <View className="px-5 py-2 flex-row gap-6">
              {icons.map((item, index) => (
                <View 
                  key={index}
                  className="w-16 h-16 border border-enaleia-black justify-center items-center"
                >
                  {item.icon}
                </View>
              ))}
            </View>
          )}

          {/* Content Section */}
          <View className="px-5 py-[18px] gap-8">
            <View className="flex-1">
              {content}
            </View>

            {/* Important Note */}
            {importantNote && (
              <View className="p-5 bg-[#A4C5E1] rounded-2xl">
                <Text className="font-dm-bold text-base text-enaleia-black mb-2">
                  IMPORTANT
                </Text>
                <Text className="font-dm-light text-base text-enaleia-black">
                  {importantNote}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}; 