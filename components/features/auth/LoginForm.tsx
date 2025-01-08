import { UserInfo } from "@/types/user";
import { directus } from "@/utils/directus";
import { login, readMe } from "@directus/sdk";
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

const LoginData = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
  // Check for existing access token on component mount
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const token = await directus.getToken();

        if (token) {
          await queryClient.setQueryData(["user-info"], {
            token,
          });
          router.replace("/home");
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

  const handleLogin = async (value: LoginData) => {
    try {
      const loginResult = await directus.request(
        login(value.email, value.password)
      );
      const token = loginResult.access_token;
      await directus.setToken(token);
      const user = await directus.request(readMe());
      await queryClient.setQueryData<UserInfo>(["user-info"], {
        token: token || "",
        email: value.email,
        name: user.first_name || "",
        lastName: user.last_name || "",
        avatar: user.avatar || "",
        id: user.id || "",
      });

      router.replace("/home");
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
    validators: {
      onSubmitAsync: async ({ value }) => {
        setIsSubmitting(true);
        try {
          const result = LoginData.safeParse(value);
          if (!result.success) {
            // Return validation errors if parsing fails
            return {
              form: "Please check your email and password",
              fields: Object.fromEntries(
                result.error.errors.map((err) => [
                  err.path[0], // Field name
                  err.message, // Error message
                ])
              ),
            };
          }
          // Continue with validated data
          value = result.data;
          await handleLogin(value);
          return undefined;
        } catch (error) {
          const { errors } = error as {
            errors: { message: string; extensions: { code: string } }[];
          };

          console.log({ errorCode: errors[0].extensions.code });

          if (
            errors[0].extensions.code === "INVALID_PAYLOAD" ||
            errors[0].extensions.code === "INVALID_CREDENTIALS"
          ) {
            return {
              form: "Could not login",
              fields: {
                email: "Check that your email is correct",
                password: "Check that your password is correct",
              },
            };
          }
          return undefined;
        } finally {
          setIsSubmitting(false);
        }
      },
    },
  });

  return (
    <View>
      <form.Field
        name="email"
        validators={{
          onChange: z.string().trim().min(1, "Please enter your email"),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <View
            className={`bg-white p-2 rounded-xl h-[100px] border-[1.5px] border-transparent ${
              field.state.meta.errors.length > 0 && "border-red-500"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              placeholder="email@email.com"
              inputMode="email"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`h-12 px-0 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px]`}
            />
            {field.state.meta.errors.length > 0 && (
              <Text className="text-red-600 font-dm-regular text-xs">
                {field.state.meta.errors.join(", ")}
              </Text>
            )}
          </View>
        )}
      </form.Field>

      <View className="p-2" />

      <form.Field
        name="password"
        validators={{
          onChange: z.string().trim().min(1, "Please enter your password"),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <View
            className={`bg-white p-2 rounded-xl h-[100px] border-[1.5px] border-transparent ${
              field.state.meta.errors.length > 0 && "border-red-500"
            }`}
          >
            <Text className="font-dm-light text-grey-6 text-sm">Password</Text>
            <View className="flex flex-row items-center justify-between">
              <TextInput
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="********"
                autoComplete="password"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                className={`h-12 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px] ${
                  field.state.meta.errors.length > 0 && "border-red-500"
                }`}
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

            {field.state.meta.errors.length > 0 && (
              <Text className="text-red-600 font-dm-regular text-xs">
                {field.state.meta.errors.join(", ")}
              </Text>
            )}
          </View>
        )}
      </form.Field>

      <form.Subscribe selector={(state) => [state.errorMap.onSubmit]}>
        {([formError]) =>
          formError ? (
            <Text className="text-red-600 font-dm-regular text-xs text-center mt-2">
              {formError.toString()}
            </Text>
          ) : null
        }
      </form.Subscribe>

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
    </View>
  );
}
