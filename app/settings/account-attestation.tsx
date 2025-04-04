import { View, Text, Pressable, Image } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollView } from "moti";
import { Company } from "@/types/company";
import { router } from "expo-router";

// Define props type for DataItem - remove className
interface DataItemProps {
  label: string;
  value: string | null | undefined;
  // Removed className prop
}

// Reusable component for displaying label-value pairs according to the new design
// Removed className prop from function signature and usage
const DataItem: React.FC<DataItemProps> = ({ label, value }) => (
  <View className="self-stretch flex flex-col justify-start items-start gap-1">
    <Text className="text-grey-6 text-sm font-dm-bold">
      {label}
    </Text>
    <Text className="self-stretch text-enaleia-black text-lg font-dm-bold ">
      {value || "N/A"} {/* Display N/A if value is missing */}
    </Text>
  </View>
);

// Function to obscure email
const obscureEmail = (email: string | null | undefined): string => {
  if (!email || !email.includes('@')) {
    return "N/A";
  }
  const [localPart, domain] = email.split('@');
  const [domainName, ...tlds] = domain.split('.');
  const tld = tlds.join('.'); // Handle multi-part TLDs like .co.uk

  if (!localPart || !domainName || !tld) {
     return "N/A"; // Invalid format
  }

  const obscuredLocal = localPart.length > 2 ? localPart.substring(0, 2) + '****' : '****';
  const obscuredDomainName = '***';

  return `${obscuredLocal}@${obscuredDomainName}.${tld}`;
};

const AccountAttestationScreen = () => {
  const { user } = useAuth();

  // Helper function to safely get company name
  const getCompanyName = (): string | null => {
    if (!user?.Company) return null;

    if (typeof user.Company === "object" && "name" in user.Company) {
      // Ensure name is truthy before returning, otherwise return null
      return user.Company.name ? user.Company.name : null;
    }

    return null;
  };

  // Format User ID to remove hyphens
  const formattedUserId = user?.id

  return (
    <SafeAreaContent>
        {/* Header with Back Button - No horizontal padding as per user edit */}
        <View className="flex-row items-center justify-start pb-4">
            <Pressable
            onPress={() => router.back()}
            className="flex-row items-center space-x-1"
            >
            <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
            {/* Use bold font as per HTML */}
            <Text className="text-base font-dm-regular text-enaleia-black tracking-tight">
                Settings
            </Text>
            </Pressable>
          </View>
        {/* Title */}
        <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4">
              Account
            </Text>
            {/* Description */}
            <Text className="text-base font-dm-regular text-enaleia-black mb-6">
              The informations associated with this account
            </Text>
            <View className="flex-1">
            {/* Using border instead of outline */}
            <View className="bg-white rounded-2xl border border-grey-3 flex flex-col justify-start items-start mb-6">
                {/* Add border-b and padding-b to all but the last item's wrapper */}
                <View className="p-4 w-full border-b border-grey-3">
                  <DataItem label="User ID" value={formattedUserId} />
                </View>
                <View className="p-4 w-full">
                  <DataItem label="Company name" value={getCompanyName()} />
                </View>
                {/* <View className="mb-6 w-full">
                  <DataItem label="First name" value={user?.first_name} />
                </View> */}
                {/* Assuming user.role exists, otherwise might need adjustment */}
                {/* <View className="mb-6 w-full">
                  <DataItem label="Email" value={obscureEmail(user?.email)} />
                </View> */}
            </View>
          </View>

        {/* Restore Absolutely positioned image container */}
        <View className="absolute bottom-3 right-0 pointer-events-none z-[-1]">
            <Image
               source={require("@/assets/images/Coast.png")} 
               className="max-w-[353px] max-h-[234px]" 
               resizeMode="contain"
               accessibilityLabel="Decorative account illustration"
            />
        </View>
    </SafeAreaContent>
  );
};

export default AccountAttestationScreen; 