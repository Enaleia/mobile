import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

const LoginData = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginData = z.infer<typeof LoginData>;

export default function LoginForm() {
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
          onChange: z.string().trim().min(1, "Please enter your email"),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <>
            <Text className="font-medium mb-2">Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`border-[1.5px] rounded-lg p-2 px-3 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 ${
                field.state.meta.errors.length > 0 && "border-red-500"
              }`}
            />
            {field.state.meta.errors.length > 0 ? (
              <Text className="text-red-600 font-semibold">
                {field.state.meta.errors.join(", ")}
              </Text>
            ) : null}
          </>
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
          <View>
            <Text className="font-medium mb-2">Password</Text>
            <TextInput
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`border-[1.5px] rounded-lg p-2 px-3 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 ${
                field.state.meta.errors.length > 0 && "border-red-500"
              }`}
            />
            {field.state.meta.errors.length > 0 ? (
              <Text className="text-red-600 font-semibold">
                {field.state.meta.errors.join(", ")}
              </Text>
            ) : null}
          </View>
        )}
      </form.Field>
      <Pressable
        onPress={() => form.handleSubmit()}
        className="flex flex-row items-center justify-center px-2 py-3 mt-2 bg-blue-700 rounded-md"
      >
        <Text className="text-white font-bold text-lg">Login</Text>
      </Pressable>
    </View>
  );
}
