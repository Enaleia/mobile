import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const SafeAreaContent = ({ children }: { children: any }) => {
  return <SafeAreaView className="flex-1 p-5">{children}</SafeAreaView>;
};

export default SafeAreaContent;
