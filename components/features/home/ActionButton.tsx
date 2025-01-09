import { ACTION_SLUGS } from "@/constants/action";
import { router } from "expo-router";
import { Image, ImageSourcePropType, Pressable, Text } from "react-native";

const buttonClassName = "items-center justify-center px-2 py-3 rounded-2xl";

const buttonClasses = `w-[48%] mr-1 mb-1 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out ${buttonClassName}`;
const bannerClasses = `w-full ${buttonClassName}`;

const ActionButton = ({
  presentation = "button",
  name,
  color,
  icon,
}: {
  name: string;
  color: string;
  icon: ImageSourcePropType;
  presentation?: "button" | "banner";
}) => {
  return (
    <Pressable
      className={presentation === "button" ? buttonClasses : bannerClasses}
      style={{ backgroundColor: color }}
      onPress={() =>
        presentation === "button"
          ? router.push(
              `/attest/new/${ACTION_SLUGS[name as keyof typeof ACTION_SLUGS]}`
            )
          : null
      }
    >
      <Image source={icon} className="w-16 h-16" />
      <Text className="text-sm font-dm-regular tracking-[-0.25px] text-enaleia-black text-center w-full">
        {name}
      </Text>
    </Pressable>
  );
};

export default ActionButton;
