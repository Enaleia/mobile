import { router } from "expo-router";
import { Image, ImageSourcePropType, Pressable, Text } from "react-native";

const buttonClassName = "items-center justify-center px-4 rounded-[19px] h-[131px]";

const buttonClasses = `w-[49%] mb-2 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out ${buttonClassName}`;
const bannerClasses = `w-full ${buttonClassName}`;

const ActionButton = ({
  presentation = "button",
  name,
  color,
  icon,
  slug,
}: {
  name: string;
  color: string;
  icon: ImageSourcePropType;
  slug: string;
  presentation?: "button" | "banner";
}) => {
  return (
    <Pressable
      className={presentation === "button" ? buttonClasses : bannerClasses}
      style={{ backgroundColor: color }}
      onPress={() =>
        presentation === "button" ? router.push(`/attest/new/${slug}`) : null
      }
    >
      <Image source={icon} className="w-[88px] h-[88px]" />
      <Text className="text-sm font-dm-regular tracking-[-0.25px] text-enaleia-black text-center w-full">
        {name}
      </Text>
    </Pressable>
  );
};

export default ActionButton;
