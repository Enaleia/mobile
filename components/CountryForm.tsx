import { useMutation } from "urql";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { Pressable, Text, TextInput, View } from "react-native";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { CreateCountryMutation } from "@/lib/urql";

const Country = z.object({
  Country: z.string(),
});

type Country = z.infer<typeof Country>;

const CountryForm = () => {
  const [_, create_Country_item] = useMutation(CreateCountryMutation);
  const form = useForm<Country>({
    defaultValues: {
      Country: "",
    },
    onSubmit: async ({ value }) => {
      const result = await create_Country_item({ Country: value.Country });
      if (result.error) {
        console.error("Oh no!", result.error);
      } else {
        console.log("New country created:", result.data?.create_Country_item);
      }
    },
  });

  return (
    <View>
      <Text className="font-bold text-lg">New country</Text>
      <form.Field
        name="Country"
        validators={{
          onChange: z
            .string()
            .trim()
            .min(1, "Please add the name of a country"),
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
      <Pressable
        onPress={() => form.handleSubmit()}
        className="flex flex-row items-center justify-center px-2 py-3 mt-2 bg-blue-700 rounded-md"
      >
        <Text className="text-white font-bold">Add Country</Text>
      </Pressable>
    </View>
  );
};

export default CountryForm;
