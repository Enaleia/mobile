import ModalBase from "@/components/shared/ModalBase";
import { TypeInformationProps } from "@/types/action";
import { View } from "moti";
import React from "react";
import { Image, Platform, ScrollView, Text } from "react-native";

const TypeInformationModal = ({
  icons = [],
  title,
  description = "",
  incomingInstructions = [],
  outgoingInstructions = [],
  important = "",
  notes = "",
  isVisible = false,
  onClose,
}: Partial<TypeInformationProps>) => {
  if (!title) return null;

  const isIOS = Platform.OS === "ios";

  return (
    <ModalBase isVisible={isVisible} onClose={onClose ?? (() => {})}>
      <ScrollView
        style={{ maxHeight: isIOS ? 600 : "100%" }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingRight: 16, paddingTop: isIOS ? 8 : 0 }}
      >
        <Text
          className="text-2xl font-dm-bold text-enaleia-black tracking-[-1px] my-3 pr-8"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {icons?.length > 0 && (
          <View
            className="flex-row items-center justify-start gap-3"
            accessibilityRole="none"
            accessibilityLabel="Type icons"
          >
            {icons.map((icon, index) => (
              <Image
                source={icon}
                className="w-14 h-14"
                key={index}
                accessibilityRole="image"
                accessibilityLabel={`Type icon ${index + 1}`}
              />
            ))}
          </View>
        )}
        <Text
          className="text-base font-dm-regular text-enaleia-black mt-2 tracking-[-0.5px]"
          accessibilityRole="text"
        >
          {description}
        </Text>
        <View className="mt-4">
          <Text
            className="text-lg font-dm-bold text-enaleia-black tracking-[-1px]"
            accessibilityRole="header"
          >
            Creating a {title} Attestation
          </Text>
        </View>
        {incomingInstructions.length > 0 && (
          <View
            className="mt-2"
            accessibilityRole="none"
            accessibilityLabel="Incoming materials instructions"
          >
            <Text
              className="text-base font-dm-bold text-enaleia-black tracking-[-1px] mb-2"
              accessibilityRole="header"
            >
              Incoming materials
            </Text>
            <View>
              {incomingInstructions.map((instruction, index) => (
                <Text
                  key={index}
                  className="text-sm text-enaleia-black/70 font-dm-regular"
                  accessibilityRole="text"
                >
                  {" "}
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
          </View>
        )}
        {outgoingInstructions.length > 0 && (
          <View
            className="mt-2"
            accessibilityRole="none"
            accessibilityLabel="Outgoing materials instructions"
          >
            <Text
              className="text-base font-dm-bold text-enaleia-black tracking-[-1px] mb-2"
              accessibilityRole="header"
            >
              Outgoing materials
            </Text>

            <View className="mb-1">
              {outgoingInstructions.map((instruction, index) => (
                <Text
                  key={index}
                  className="text-sm text-enaleia-black/70 font-dm-regular"
                  accessibilityRole="text"
                >
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
          </View>
        )}
        <View
          className="mt-3 p-3 bg-blue-100 rounded-md mb-4"
          accessibilityRole="none"
          accessibilityLabel="Additional information"
        >
          {important && (
            <View>
              <Text
                className="text-base font-dm-bold tracking-[-0.5px] text-enaleia-black mb-1"
                accessibilityRole="header"
              >
                Important
              </Text>
              <Text
                className="text-sm text-enaleia-black/70 font-dm-regular"
                accessibilityRole="text"
              >
                {important}
              </Text>
            </View>
          )}
          {notes && (
            <View className="mt-2">
              <Text
                className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px] mb-1"
                accessibilityRole="header"
              >
                Notes
              </Text>
              <Text
                className="text-sm text-enaleia-black/70 font-dm-regular"
                accessibilityRole="text"
              >
                {notes}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ModalBase>
  );
};

export default TypeInformationModal;
