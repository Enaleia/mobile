import { useMaterialsAndActionsByRoles } from "@/api/user/materials_actions";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { z } from "zod";

const LoginData = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginData = z.infer<typeof LoginData>;

// ["Manufacturer", "Administrator", "Internal", "Fisherman", "Recycler", "Port Coordinator"]
const mockRoleFetch = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

export default function LoginForm() {
  const [roles, setRoles] = useState<string[]>([]);
  const {
    data: rolesData,
    isLoading: isLoadingRolesData,
    refetch: refetchMaterialsAndActions,
  } = useMaterialsAndActionsByRoles(roles);
  const form = useForm<LoginData>({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (value.email === "test@test.com" && value.password === "test") {
        console.log("Login successful");
        mockRoleFetch();
        setRoles(["Port Coordinator"]);
        refetchMaterialsAndActions();
        router.replace("/home");
      } else {
        console.log("Login failed");
      }
    },
  });

  if (isLoadingRolesData) {
    return <Text>Loading roles...</Text>;
  }

  if (rolesData) {
    console.log({ rolesData });
  }

  return (
    <View>
      <Text className="font-bold text-lg">Login</Text>
      <form.Field
        name="email"
        validators={{
          onChange: z.string().trim().min(1, "Please enter your email"),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <>
            <Text>Name</Text>
            <TextInput
              autoCapitalize="words"
              keyboardType="default"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`border py-2 px-3 rounded-lg ${
                field.state.meta.errors.length > 0
                  ? "border-red-600"
                  : "border-slate-800"
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

      <form.Field
        name="password"
        validators={{
          onChange: z.string().trim().min(1, "Please enter your password"),
        }}
        validatorAdapter={zodValidator()}
      >
        {(field) => (
          <>
            <Text>Password</Text>
            <TextInput
              secureTextEntry={true}
              autoCapitalize="none"
              keyboardType="default"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              className={`border py-2 px-3 rounded-lg ${
                field.state.meta.errors.length > 0
                  ? "border-red-600"
                  : "border-slate-800"
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
      <Pressable
        onPress={() => form.handleSubmit()}
        className="flex flex-row items-center justify-center px-2 py-3 mt-2 bg-blue-700 rounded-md"
      >
        <Text className="text-white font-bold">Login</Text>
      </Pressable>
    </View>
  );
}
