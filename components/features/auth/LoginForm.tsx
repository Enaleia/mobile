import ErrorMessage from "@/components/shared/ErrorMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const LoginData = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated, lastLoggedInUser, offlineLogin } =
    useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const isOnline = isConnected && isInternetReachable;
  const queryClient = useQueryClient();

  useEffect(() => {
    // If already authenticated, redirect to tabs
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  // Try to auto-login when offline
  useEffect(() => {
    const tryOfflineLogin = async () => {
      if (!isOnline && lastLoggedInUser) {
        try {
          // Get stored password
          const storedPassword = await SecureStore.getItemAsync(
            "user_password"
          );
          if (storedPassword) {
            const success = await offlineLogin(
              lastLoggedInUser,
              storedPassword
            );
            if (success) {
              router.replace("/(tabs)");
            }
          }
        } catch (error) {
          console.error("Failed to auto-login offline:", error);
        }
      }
    };

    tryOfflineLogin();
  }, [isOnline, lastLoggedInUser]);

  const handleLogin = async (values: LoginData) => {
    try {
      if (isOnline) {
        // Online login
        await login(values.email, values.password);
        router.replace("/(tabs)");
      } else {
        // Offline login
        const success = await offlineLogin(values.email, values.password);
        if (success) {
          router.replace("/(tabs)");
        } else {
          setFormError("Cannot login offline with these credentials");
        }
      }
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      setFormError("Your email or password is incorrect");
      throw error;
    }
  };

  const form = useForm<LoginData>({
    defaultValues: {
      email: lastLoggedInUser || "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        // Check if both fields are filled
        if (!value.email && !value.password) {
          setFormError("Please enter your email and password");
          return;
        }

        // Check if only one field is filled
        if (!value.email) {
          setFormError("Please enter your email");
          return;
        }

        if (!value.password) {
          setFormError("Please enter your password");
          return;
        }

        // Validate email format
        if (value.email && !value.email.includes("@")) {
          setFormError("Please enter a valid email address");
          return;
        }

        // Validate password length
        if (value.password && value.password.length < 8) {
          setFormError("Password must be at least 8 characters");
          return;
        }

        await handleLogin(value);
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
  });

  return (
    <View>
      {!isOnline && (
        <View className="mb-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <Text className="font-dm-medium text-base mb-2">
            You are currently offline
          </Text>
          <Text className="font-dm-light text-sm">
            Limited functionality is available in offline mode.
          </Text>
        </View>
      )}

      <form.Field name="email">
        {(field) => (
          <Pressable
            onPress={() => emailInputRef.current?.focus()}
            className={`bg-white p-2 rounded-xl h-[88px] border-[1.5px] ${
              formError && !field.state.value
                ? "border-red-300"
                : field.state.meta.isTouched
                ? "border-blue-ocean"
                : "border-transparent"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Email</Text>
            <TextInput
              ref={emailInputRef}
              className="h-12 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px]"
              placeholder="email@email.com"
              value={field.state.value}
              onChangeText={(text) => {
                field.handleChange(text);
                if (formError) setFormError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              inputMode="email"
            />
          </Pressable>
        )}
      </form.Field>

      <View className="p-2" />

      <form.Field name="password">
        {(field) => (
          <Pressable
            onPress={() => passwordInputRef.current?.focus()}
            className={`bg-white p-2 rounded-xl h-[88px] border-[1.5px] ${
              formError && !field.state.value
                ? "border-red-300"
                : field.state.meta.isTouched
                ? "border-blue-ocean"
                : "border-transparent"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Password</Text>
            <View className="flex-row items-center">
              <TextInput
                ref={passwordInputRef}
                className="flex-1 h-12 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px]"
                placeholder="••••••••"
                value={field.state.value}
                onChangeText={(text) => {
                  field.handleChange(text);
                  if (formError) setFormError(null);
                }}
                secureTextEntry={true}
              />
            </View>
          </Pressable>
        )}
      </form.Field>

      <View className="p-2" />

      {formError && (
        <View className="mb-4">
          <ErrorMessage message={formError} />
        </View>
      )}

      <form.Subscribe
        selector={(state) => ({
          canSubmit: !isLoading,
          isSubmitting: isLoading,
        })}
      >
        {({ canSubmit, isSubmitting }) => (
          <Pressable
            onPress={() => form.handleSubmit()}
            className="flex flex-row items-center justify-center p-2 mt-4 bg-blue-ocean rounded-full tracking-tight"
          >
            {isSubmitting ? (
              <View className="flex flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-dm-medium text-base">
                  Logging in...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-dm-medium text-base">
                {isOnline ? "Login" : "Login Offline"}
              </Text>
            )}
          </Pressable>
        )}
      </form.Subscribe>
    </View>
  );
}
