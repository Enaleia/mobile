import ModalBase from "@/components/shared/ModalBase";
import { TypeInformationProps } from "@/types/action";
import { View } from "moti";
import React from "react";
import { Image, Text } from "react-native";

const TypeInformationModal = ({
  icons,
  title,
  description,
  incomingInstructions,
  outgoingInstructions,
  important,
  notes,
  isVisible,
  onClose,
}: TypeInformationProps) => {
  return (
    <ModalBase isVisible={isVisible} onClose={onClose}>
      <Text className="text-2xl font-dm-bold text-enaleia-black tracking-[-1px] my-3">
        {title}
      </Text>
      <View className="flex-row items-center justify-start gap-3">
        {icons.map((icon, index) => (
          <Image source={icon} className="w-14 h-14" key={index} />
        ))}
      </View>
      <Text className="text-base font-dm-regular text-enaleia-black mt-2 tracking-[-0.5px]">
        {description}
      </Text>
      <View className="mt-4">
        <Text className="text-lg font-dm-bold text-enaleia-black tracking-[-1px]">
          Creating a {title} Attestation
        </Text>
      </View>
      {incomingInstructions.length > 0 && (
        <View className="mt-2">
          <Text className="text-base font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Incoming materials
          </Text>
          <View>
            {incomingInstructions.map((instruction, index) => (
              <Text
                key={index}
                className="text-sm text-enaleia-black/70 font-dm-regular"
              >
                {" "}
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>
        </View>
      )}
      {outgoingInstructions.length > 0 && (
        <View className="mt-2">
          <Text className="text-base font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            Outgoing materials
          </Text>

          <View className="mb-1">
            {outgoingInstructions.map((instruction, index) => (
              <Text
                key={index}
                className="text-sm text-enaleia-black/70 font-dm-regular"
              >
                {index + 1}. {instruction}
              </Text>
            ))}
          </View>
        </View>
      )}
      <View className="mt-3 p-3 bg-blue-100 rounded-md">
        {important && (
          <View>
            <Text className="text-base font-dm-bold tracking-[-0.5px] text-enaleia-black mb-1">
              Important
            </Text>
            <Text className="text-sm text-enaleia-black/70 font-dm-regular">
              {important}
            </Text>
          </View>
        )}
        {notes && (
          <View className="mt-2">
            <Text className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px] mb-1">
              Notes
            </Text>
            <Text className="text-sm text-enaleia-black/70 font-dm-regular">
              {notes}
            </Text>
          </View>
        )}
      </View>
    </ModalBase>
  );
};

export default TypeInformationModal;
