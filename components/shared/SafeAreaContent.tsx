import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const SafeAreaContent = ({ children }: { children: any }) => {
  return (
    <SafeAreaView 
      className="flex-1 px-5 pt-5 bg-white-sand"
      edges={['top', 'left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaContent;
