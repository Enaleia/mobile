import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { useLingui } from "@lingui/react/macro";
import { Trans } from "@lingui/react/macro";
const LoginData = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
  const { t } = useLingui();
  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (value.email === "test@test.com" && value.password === "test") {
        console.log("Login successful");
        router.replace("/home");
      } else {
        console.log("Login failed");
      }
    },
  });

  return (
    <View>
      <form.Field
        name="email"
        validators={{
          onChange: z
            .string()
            .trim()
            .min(1, t`Please enter your email`),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <View className="bg-white p-2 rounded-xl h-[100px]">
            <Text className="font-dm-light text-grey-6 text-sm">
              <Trans>Email</Trans>
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              placeholder="email@email.com"
              inputMode="email"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`h-12 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 font-dm-bold text-[20px] ${
                field.state.meta.errors.length > 0 && "border-red-500"
              }`}
            />
            {field.state.meta.errors.length > 0 ? (
              <Text className="text-red-600 font-dm-regular text-xs">
                <Trans>{field.state.meta.errors.join(", ")}</Trans>
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>

      <View className="p-2" />

      <form.Field
        name="password"
        validators={{
          onChange: z
            .string()
            .trim()
            .min(1, t`Please enter your password`),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <View className="space-y-0.5 bg-white p-2 rounded-xl">
            <Text className="font-dm-light text-grey-6 text-sm">
              <Trans>Password</Trans>
            </Text>
            <TextInput
              secureTextEntry
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
            {field.state.meta.errors.length > 0 ? (
              <Text className="text-red-600 font-dm-regular text-xs">
                <Trans>{field.state.meta.errors.join(", ")}</Trans>
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>
      <Pressable
        onPress={() => form.handleSubmit()}
        className="flex flex-row items-center justify-center p-2 mt-2 bg-blue-ocean rounded-full tracking-tight"
      >
        <Text className="text-white font-dm-regular text-base">
          <Trans>Login</Trans>
        </Text>
      </Pressable>
    </View>
  );
}
