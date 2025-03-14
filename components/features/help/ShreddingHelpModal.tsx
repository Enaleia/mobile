import React from 'react';
import { Text, View, Image } from 'react-native';
import { HelpModal } from './HelpModal';

interface ShreddingHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ShreddingHelpModal: React.FC<ShreddingHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      <Text className="text-base font-dm-light text-enaleia-black mb-2">
        This attestation is used when shredding materials.
      </Text>

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
              Scan the <Text className="font-dm-bold">QR code</Text> of the incoming material or enter it manually
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">4.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              If possible enter the <Text className="font-dm-bold">weight</Text>
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

      <View>
        <Text className="text-lg font-dm-bold text-enaleia-black mb-1">
          Outgoing
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
              <Text className="font-dm-bold">Put a new QR</Text> code sticker on the shredded material
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">4.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              <Text className="font-dm-bold">Scan the QR</Text> code or enter it manually
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">5.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              If possible enter the <Text className="font-dm-bold">weight</Text>
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">6.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              <Text className="font-dm-bold">Repeat</Text> for each additional outgoing materials, if applicable
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <HelpModal
      isVisible={isVisible}
      onClose={onClose}
      title="Shredding"
      content={content}
      importantNote="If the shredding action has multiple incoming containers, each should have it's own incoming entry. If the shredded outgoing material require 2 or more containers, make sure each materials have it's own QR code stickers and outgoing entry."
      importantNoteBgColor="#EAD9B4"
      categories={[
        {
          name: "Shredding",
          icon: <Image 
            source={require('../../../assets/images/action-icons/Shredding.webp')}
            className="w-14 h-14 mb-1"
            resizeMode="contain"
          />
        }
      ]}
    />
  );
}; 