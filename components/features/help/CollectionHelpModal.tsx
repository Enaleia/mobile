import React from 'react';
import { Text, View } from 'react-native';
import { HelpModal } from './HelpModal';

interface CollectionHelpModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export const CollectionHelpModal: React.FC<CollectionHelpModalProps> = ({
  isVisible,
  onClose,
}) => {
  const content = (
    <>
      {/* Introduction */}
      <Text className="text-base font-dm-light text-enaleia-black mb-4">
        A collection attestation is used to capture a single collection. It involves one incoming materials and has no outgoing materials entry.
      </Text>

      {/* Section with title and numbered list */}
      <View className="mb-6">
        <Text className="text-lg font-dm-bold text-enaleia-black mb-3">
          Creating a Collection Attestation
        </Text>
        
        <View className="gap-2">
          <View className="flex-row">
            <Text className="text-base font-dm-bold text-enaleia-black w-6">1.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Select the type of collection you want to create
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-bold text-enaleia-black w-6">2.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Fill in the required information
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-bold text-enaleia-black w-6">3.</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Submit the attestation
            </Text>
          </View>
        </View>
      </View>

      {/* Section with subtitle and bullet points */}
      <View className="mb-6">
        <Text className="text-base font-dm-bold text-enaleia-black mb-2">
          Incoming materials
        </Text>
        <View className="gap-2">
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">•</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Tap "Add Incoming" button
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">•</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Select the material type present in the collection
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">•</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Scan the collector's ID card or manually enter the code
            </Text>
          </View>
          <View className="flex-row">
            <Text className="text-base font-dm-light text-enaleia-black w-4">•</Text>
            <Text className="text-base font-dm-light text-enaleia-black flex-1">
              Enter the weight of the material
            </Text>
          </View>
        </View>
      </View>

      {/* Section with mixed formatting */}
      <View>
        <Text className="text-base font-dm-bold text-enaleia-black mb-2">
          Outgoing materials
        </Text>
        <Text className="text-base font-dm-light text-enaleia-black">
          A collection typically has <Text className="font-dm-bold">no outgoing materials</Text> entry so do not add any unless instructed otherwise.
        </Text>
      </View>
    </>
  );

  return (
    <HelpModal
      isVisible={isVisible}
      onClose={onClose}
      title="Collection"
      content={content}
      importantNote="A collection attestation should not be used to enter multiple collections from multiple collectors at once. It it use for a single or multiple collection from the same collector at any given time."
      icons={[
        {
          name: "Fishing for Litter",
          icon: <Text>Icon1</Text> // Replace with actual icon
        },
        {
          name: "Prevention",
          icon: <Text>Icon2</Text> // Replace with actual icon
        },
        {
          name: "Ad-hoc",
          icon: <Text>Icon3</Text> // Replace with actual icon
        },
        {
          name: "Beach Cleanup",
          icon: <Text>Icon4</Text> // Replace with actual icon
        }
      ]}
    />
  );
}; 