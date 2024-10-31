import {
  collectionFormSchema,
  CollectionFormType,
} from "@/config/forms/schemas";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Pressable, Text, TextInput, View } from "react-native";

const collectionForm = useForm<CollectionFormType>({
  defaultValues: {
    collectorId: "",
    collectionBatch: "",
    materials: [],
    totalWeightInKilograms: 0,
  },
});

const CollectionForm = () => {
  return (
    <View>
      <Text className="font-bold text-lg">New country</Text>
      <collectionForm.Field
        name="collectorId"
        validators={{
          onChange: collectionFormSchema.shape.collectorId.parse,
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
      </collectionForm.Field>
      <Pressable
        onPress={() => collectionForm.handleSubmit()}
        className="flex flex-row items-center justify-center px-2 py-3 mt-2 bg-blue-700 rounded-md"
      >
        <Text className="text-white font-bold">Add Country</Text>
      </Pressable>
    </View>
  );
};

export default CollectionForm;
