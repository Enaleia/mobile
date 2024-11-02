import {
  collectionFormSchema,
  CollectionFormType,
} from "@/config/forms/schemas";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import React from "react";
import { Pressable, Text, View } from "react-native";
import QRTextInput from "@/components/forms/QRTextInput";

export default function NewCollection() {
  const collectionForm = useForm<CollectionFormType>({
    defaultValues: {
      collectorId: "",
      collectionBatch: "",
      materials: [],
      totalWeightInKilograms: 0,
    },
  });

  return (
    <View className="flex-1 p-4">
      <View>
        <collectionForm.Field
          name="collectorId"
          validators={{
            onChange: collectionFormSchema.shape.collectorId.parse,
          }}
          validatorAdapter={zodValidator()}
        >
          {(field) => (
            <>
              <Text>Collector ID</Text>
              <QRTextInput
                value={field.state.value}
                onChangeText={field.handleChange}
                placeholder="Enter or scan collector ID"
                className={
                  field.state.meta.errors.length > 0
                    ? "border-red-600"
                    : "border-slate-800"
                }
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
          <Text className="text-white font-bold">Add Collection</Text>
        </Pressable>
      </View>
    </View>
  );
}
