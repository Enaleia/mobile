import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeAreaContentProps {
  children: React.ReactNode;
  className?: string;
}

const SafeAreaContent = ({ children, className = "" }: SafeAreaContentProps) => {
  return (
    <SafeAreaView 
      className={`flex-1 px-4 pt-2 bg-white-sand ${className}`}
      edges={['top', 'left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaContent;
