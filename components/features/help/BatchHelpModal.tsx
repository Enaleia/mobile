import React from 'react';
import { Text, View, Image } from 'react-native';
import { HelpModal } from './HelpModal';

interface BatchHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const BatchHelpModal: React.FC<BatchHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      <Text className="text-base font-dm-light text-enaleia-black mb-2">
      This attestation is used when shipping a container of waste collections.
      </Text>

      {/* Section with subtitle and bullet points */}
      <View className="mb-3 tighter-tracking">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Incoming
        </Text>
        <View className="gap-0">
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">1.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Tap <Text className="font-dm-bold">+Add</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">2.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Select a <Text className="font-dm-bold">material</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">3.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            <Text className="font-dm-bold">Put a new QR</Text>code sticker on the container
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">4.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            Enter the <Text className="font-dm-bold">weight</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">5.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
            <Text className="font-dm-bold">Repeat</Text> for each additional incoming materials, if applicable
            </Text>
          </View>
        </View>
      </View>

      {/* Section with mixed formatting */}
      <View>
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Outgoing
        </Text>
        <Text className="text-base font-dm-light text-enaleia-black">
        A collection typically has <Text className="font-dm-bold">no outgoing materials</Text> so do not add any unless instructed differently.
        </Text>
      </View>
    </>
  );

  return (
    <HelpModal
      isVisible={isVisible}
      onClose={onClose}
      title="Batch"
      content={content}
      importantNote="If a collector has multiple distinct materials, make sure that each materials have it's own incoming entry."
      importantNoteBgColor="#9FD08B"
      categories={[
        {
          name: "Batch",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Batch.webp')}
            className="w-14 h-14 mb-1 self-center"
            resizeMode="contain"
          />
        }
      ]}
    />
  );
}; 