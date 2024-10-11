import SafeAreaContent from "@/components/SafeAreaContent";
import { AllCountriesQuery } from "@/lib/queries";
import { StatusBar } from "expo-status-bar";
import { AnimatePresence, View as MotiView } from "moti";
import React from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "urql";
import { z } from "zod";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";

const Country = z.object({
  Country: z.string(),
});

type Country = z.infer<typeof Country>;

const App = () => {
  const [result, reexecuteQuery] = useQuery({
    query: AllCountriesQuery,
  });
  const form = useForm<Country>({
    defaultValues: {
      Country: "",
    },
    onSubmit: async ({ value }) => {
      // Handle form submission
      console.log(value);
    },
  });

  const { data, fetching, error } = result;
  if (error && !fetching) console.log({ error });

  return (
    <SafeAreaContent>
      <View>
        <Text className="text-3xl font-bold">ENALEIA</Text>
        <Text className="text-lg">
          Removing plastic from the ocean, one fisherman's boat at a time.
        </Text>
      </View>

      {fetching && <Text>Loading countries...</Text>}
      {error && <Text>Error loading countries: {error.message}</Text>}
      {data && (
        <AnimatePresence>
          <FlatList
            data={data.Country}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateX: -10 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ opacity: 0, translateX: -10 }}
                transition={{ delay: index * 60, type: "spring" }}
                className="mt-4 text-base"
              >
                <Text className="font-bold text-lg">{item.Country}</Text>
              </MotiView>
            )}
          />
        </AnimatePresence>
      )}
      <View>
        <Text className="font-semibold text-lg">Add country</Text>
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
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                className={`border py-2 px-3 ${
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
          className="flex items-center justify-center px-2 py-3 bg-blue-700 rounded-md"
        >
          <Text className="text-white font-medium">Add Country</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </SafeAreaContent>
  );
};

export default App;
