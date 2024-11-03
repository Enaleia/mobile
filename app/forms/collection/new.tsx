import FormSection from "@/components/FormSection";
import QRTextInput from "@/components/QRTextInput";
import {
  collectionFormSchema,
  CollectionFormType,
} from "@/config/forms/schemas";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import React from "react";
import { Pressable, Text, View } from "react-native";

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
    <View className="flex-1 bg-white">
      <FormSection>
        <collectionForm.Field
          name="collectorId"
          validators={{
            onChange: collectionFormSchema.shape.collectorId.parse,
          }}
          validatorAdapter={zodValidator()}
        >
          {(field) => (
            <View>
              <Text className="text-lg text-gray-700 font-medium">
                Collector ID
              </Text>
              <QRTextInput
                value={field.state.value}
                onChangeText={field.handleChange}
                placeholder="Enter or scan collector ID QR"
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
            </View>
          )}
        </collectionForm.Field>

        <collectionForm.Field
          name="collectionBatch"
          validators={{
            onChange: collectionFormSchema.shape.collectionBatch.parse,
          }}
          validatorAdapter={zodValidator()}
        >
          {(field) => (
            <View>
              <Text className="text-lg text-gray-700 font-medium">
                Collection Batch
              </Text>
              <QRTextInput
                value={field.state.value}
                onChangeText={field.handleChange}
                placeholder="Enter or scan collection batch QR"
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
            </View>
          )}
        </collectionForm.Field>
      </FormSection>

      <View className="px-4 pb-8">
        <Pressable
          onPress={() => collectionForm.handleSubmit()}
          className="flex flex-row items-center justify-center px-2 py-3 bg-blue-600 rounded-md"
        >
          <Text className="text-white text-lg font-bold">Add Collection</Text>
        </Pressable>
      </View>
    </View>
  );
}
