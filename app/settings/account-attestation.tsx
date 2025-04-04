import { View, Text, Pressable } from "react-native";
import React from "react";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollView } from "moti";
import { Company } from "@/types/company";
import { router } from "expo-router";

// Define props type for InfoBox
interface InfoBoxProps {
  label: string;
  value: string | null | undefined;
  className?: string;
}

// Helper component for info boxes with types
const InfoBox: React.FC<InfoBoxProps> = ({ label, value, className }) => (
  <View className={`bg-sand-beige p-4 rounded-2xl mb-2 ${className || ''}`}>
    <Text className="text-sm font-dm-bold text-grey-6">
      {label}
    </Text>
    <Text className="text-xl font-dm-bold text-enaleia-black">
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

  return (
    <SafeAreaContent>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="flex-row items-center justify-start pb-4">
            <Pressable
            onPress={() => router.back()}
            className="flex-row items-center space-x-1"
            >
            <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
            <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
                Settings
            </Text>
            </Pressable>  
          </View>
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-4">
              Account
            </Text>
        {/* Restructured Info Section */}
        <View className=""> 
          {/* Basic Info Section */}
          <View className="mb-1">
            {/* <Text className="text-base font-dm-bold text-gray-900 mb-1">
              Basic
            </Text> */}
            <Text className="text-base font-dm-bold text-gray-900 mb-2">
             Basic information
            </Text>
          </View>
          <InfoBox label="First name" value={user?.first_name} />
          <InfoBox label="Email" value={obscureEmail(user?.email)} />

          {/* Attestation Info Section */}
          <View className="mb-2 mt-4">
            {/* <Text className="text-base font-dm-bold text-gray-900 mb-1">
              Attest
            </Text> */}
            <Text className="font-dm-regular text-base mb-2 leading-5">
              All attestation would include your user ID and company name, we will not post personal information on the blockchain.
            </Text>
          </View>
          <InfoBox label="User's ID" value={user?.id} />
          <InfoBox label="Company" value={getCompanyName()} />

         
        </View>
      </ScrollView>
    </SafeAreaContent>
  );
};

export default AccountAttestationScreen; 