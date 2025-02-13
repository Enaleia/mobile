import { EnaleiaUser } from "@/types/user";
import { directus } from "@/utils/directus";
import { readItem, readMe } from "@directus/sdk";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Company } from "@/types/company";

const LoginData = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = await directus.getToken();

        if (token) {
          await queryClient.setQueryData(["user-info"], {
            token,
          });
          router.replace("/(tabs)");
        }
      } catch (error) {
        console.error("Error checking token:", error);
      }
    };

    checkExistingToken();
  }, []);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (values: LoginData) => {
    try {
      const loginResult = await directus.login(values.email, values.password);
      const token = loginResult.access_token;

      // Store credentials
      await directus.setToken(token);
      await AsyncStorage.setItem("userEmail", values.email);

      // Get basic user info
      const basicUserData = await directus.request(readMe());
      if (!basicUserData) throw new Error("No user data found");

      let userInfo: EnaleiaUser = {
        id: basicUserData.id,
        first_name: basicUserData.first_name,
        last_name: basicUserData.last_name,
        email: basicUserData.email,
        token,
      };

      // If user has a company, fetch company details
      if (basicUserData.Company) {
        try {
          const companyData = await directus.request(
            readItem("Companies", basicUserData.Company as number)
          );
          console.log("Company data:", companyData);
          const company: Pick<Company, "id" | "name"> = {
            id: companyData.id,
            name: companyData.name,
          };
          userInfo.Company = company;
        } catch (error) {
          console.warn("Failed to fetch company data:", error);
        }
      }

      await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
      await queryClient.setQueryData<EnaleiaUser>(["user-info"], userInfo);

      router.replace("/(tabs)");
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      throw error;
    }
  };

  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const result = LoginData.safeParse(value);
        if (!result.success) {
          console.error("Form validation failed:", result.error.errors);
          return;
        }
        await handleLogin(result.data);
      } catch (error) {
        console.error("Login failed:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <View>
      <form.Field name="email">
        {(field) => (
          <View className="bg-white p-2 rounded-xl h-[100px] border-[1.5px] border-transparent">
            <Text className="font-dm-light text-grey-6 text-sm">Email</Text>
            <TextInput
              className="h-12 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px]"
              placeholder="email@email.com"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={() => {
                const result = LoginData.shape.email.safeParse(
                  field.state.value
                );
                if (!result.success) {
                  field.setMeta((prev) => ({
                    ...prev,
                    errors: [result.error.errors[0].message],
                  }));
                } else {
                  field.setMeta((prev) => ({ ...prev, errors: [] }));
                }
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {field.state.meta.errors?.length ? (
              <Text className="text-red-600 font-dm-regular text-xs">
                {field.state.meta.errors.join(", ")}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <View className="p-2" />

      <form.Field name="password">
        {(field) => (
          <View className="bg-white p-2 rounded-xl h-[100px] border-[1.5px] border-transparent">
            <Text className="font-dm-light text-grey-6 text-sm">Password</Text>
            <View className="flex flex-row items-center justify-between">
              <TextInput
                className="h-12 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px]"
                placeholder="********"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => {
                  const result = LoginData.shape.password.safeParse(
                    field.state.value
                  );
                  if (!result.success) {
                    field.setMeta((prev) => ({
                      ...prev,
                      errors: [result.error.errors[0].message],
                    }));
                  } else {
                    field.setMeta((prev) => ({ ...prev, errors: [] }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text className="text-blue-ocean font-dm-medium text-base">
                  {showPassword ? (
                    <Ionicons name="eye-off" size={24} color="black" />
                  ) : (
                    <Ionicons name="eye" size={24} color="black" />
                  )}
                </Text>
              </Pressable>
            </View>
            {field.state.meta.errors?.length ? (
              <Text className="text-red-600 font-dm-regular text-xs">
                {field.state.meta.errors.join(", ")}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          canSubmit: !state.isSubmitting && !state.errors.length,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Pressable
            onPress={() => form.handleSubmit()}
            className="flex flex-row items-center justify-center p-2 mt-2 bg-blue-ocean rounded-full tracking-tight"
          >
            {isSubmitting ? (
              <View className="flex flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-dm-medium text-base">
                  Logging in...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-dm-medium text-base">Login</Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>
    </View>
  );
}
