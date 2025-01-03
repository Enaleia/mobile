import { ACTION_COLORS, ACTION_ICONS, ACTION_SLUGS } from "@/constants/action";
import { ActionTitle } from "@/types/action";
import { router } from "expo-router";
import { Image, Pressable, Text } from "react-native";

const buttonClassName = "items-center justify-center px-2 py-3 rounded-2xl";

const buttonClasses = `w-[48%] mr-1 mb-1 active:opacity-70 transition-opacity duration-200 active:scale-95 ease-out ${buttonClassName}`;
const bannerClasses = `w-full ${buttonClassName}`;

const ActionButton = ({
  title,
  presentation = "button",
}: {
  title: ActionTitle;
  presentation?: "button" | "banner";
}) => {
  return (
    <Pressable
      className={presentation === "button" ? buttonClasses : bannerClasses}
      style={{ backgroundColor: ACTION_COLORS[title] }}
      onPress={() =>
        presentation === "button"
          ? router.push(`/attest/new/${ACTION_SLUGS[title]}`)
          : null
      }
    >
      <Image source={ACTION_ICONS[title]} className="w-16 h-16" />
      <Text className="text-sm font-dm-light tracking-[-0.25px] text-enaleia-black">
        {title}
      </Text>
    </Pressable>
  );
};

export default ActionButton;
