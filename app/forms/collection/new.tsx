import FieldInfo from "@/components/forms/FieldInfo";
import FormSection from "@/components/forms/FormSection";
import MaterialsSelect from "@/components/forms/MaterialsSelect";
import QRTextInput from "@/components/forms/QRTextInput";
import { collectionFormSchema } from "@/config/forms/schemas";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { AnimatePresence, MotiView } from "moti";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FadeInUp, FadeOutUp } from "react-native-reanimated";

export default function NewCollection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const collectionForm = useForm({
    defaultValues: {
      collectorId: "",
      collectionBatch: "",
      materials: [] as string[],
      totalWeightInKilograms: "",
    },
    onSubmit: async ({ value }) => {
      setHasAttemptedSubmit(true);
      setSubmitError(null);
      setIsSubmitting(true);

      try {
        const {
          data: parsedData,
          error: parseError,
          success: parseSuccess,
        } = collectionFormSchema.safeParse(value);

        if (!parseSuccess) {
          setSubmitError("Please fix the form errors before submitting");
          console.error("Form validation errors:", parseError);
          return;
        }

        console.log("Valid form data:", parsedData);
      } catch (error) {
        setSubmitError("An error occurred while submitting the form");
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: collectionFormSchema,
    },
  });

  return (
    <ScrollView className="flex-1 bg-white">
      <FormSection>
        <collectionForm.Field
          name="collectionBatch"
          validatorAdapter={zodValidator()}
        >
          {(field) => (
            <View className="mb-4">
              <Text className="text-lg text-gray-700 font-medium mb-2">
                Collection Batch
              </Text>
              <QRTextInput
                id="collection-batch-input"
                value={field.state.value}
                onChangeText={(text: string) => {
                  field.handleChange(text);
                  setSubmitError(null);
                }}
                placeholder="Enter or scan collection batch QR"
                className={
                  field.state.meta.errors.length > 0
                    ? "border-red-500"
                    : "border-slate-300"
                }
              />
              <FieldInfo field={field} showErrors={hasAttemptedSubmit} />
            </View>
          )}
        </collectionForm.Field>
        <collectionForm.Field
          name="collectorId"
          validatorAdapter={zodValidator()}
        >
          {(field) => (
            <View className="mb-4">
              <Text className="text-lg text-gray-700 font-medium mb-2">
                Collector ID
              </Text>
              <QRTextInput
                id="collector-id-input"
                value={field.state.value}
                onChangeText={(text: string) => {
                  field.handleChange(text);
                  setSubmitError(null);
                }}
                placeholder="Enter or scan collector ID QR"
                className={
                  field.state.meta.errors.length > 0 ? "border-red-500" : ""
                }
              />
              <FieldInfo field={field} showErrors={hasAttemptedSubmit} />
            </View>
          )}
        </collectionForm.Field>

        <collectionForm.Field name="materials" mode="array">
          {(field) => (
            <View className="mb-4">
              <MaterialsSelect
                selectedMaterials={field.state.value}
                setSelectedMaterials={(materials) => {
                  field.handleChange(materials);
                  setSubmitError(null);
                }}
              />
              <FieldInfo field={field} showErrors={hasAttemptedSubmit} />
            </View>
          )}
        </collectionForm.Field>

        <collectionForm.Field name="totalWeightInKilograms">
          {(field) => (
            <View className="mb-4">
              <Text className="text-lg text-gray-700 font-medium mb-2">
                Total Weight (in kg)
              </Text>
              <TextInput
                value={field.state.value}
                onChangeText={(text) => {
                  field.handleChange(text);
                  setSubmitError(null);
                }}
                onBlur={() => {
                  field.handleChange(
                    isNaN(parseFloat(field.state.value))
                      ? field.state.value
                      : parseFloat(field.state.value).toFixed(2)
                  );
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                className={`flex-1 border-[1.5px] rounded-lg p-2 px-3 border-neutral-300 focus:border-blue-600 focus:shadow-outline focus:ring-offset-2 ${
                  field.state.meta.errors.length > 0 && "border-red-500"
                }`}
              />
              <FieldInfo field={field} showErrors={hasAttemptedSubmit} />
              {field.state.value &&
                !field.state.meta.errors.length &&
                field.state.value !==
                  parseFloat(field.state.value).toFixed(2) && (
                  <AnimatePresence>
                    <MotiView
                      entering={FadeInUp.springify().damping(20).stiffness(100)}
                      exiting={FadeOutUp.springify().damping(20).stiffness(100)}
                      transition={{
                        type: "spring",
                        damping: 10,
                        stiffness: 100,
                      }}
                      className="flex flex-row items-center gap-1 mt-0.5"
                    >
                      <Ionicons
                        name="swap-horizontal"
                        size={16}
                        color="#a3a3a3"
                      />
                      <Text className="text-neutral-600 text-sm font-semibold">
                        {parseFloat(field.state.value).toFixed(2)}kg
                      </Text>
                    </MotiView>
                  </AnimatePresence>
                )}
            </View>
          )}
        </collectionForm.Field>
      </FormSection>

      {/* <FormSection>
        <collectionForm.Subscribe>
          {(state) => (
            <View className="p-4 bg-gray-100 rounded-lg">
              <Text className="font-bold mb-2">Form State:</Text>
              Display form values
              <View className="mb-4">
                <Text className="font-medium">Values:</Text>
                {Object.entries(state.values).map(([key, value]) => (
                  <View key={key} className="ml-4 my-1">
                    <Text>
                      {key}:{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </Text>
                  </View>
                ))}
              </View>

              Display errors if any
              <View>
                <Text className="font-medium">Errors:</Text>
                {Object.entries(state.errors).map(([key, error]) =>
                  error && error.length > 0 ? (
                    <View key={key} className="ml-4 my-1">
                      <Text className="text-red-500">
                        {key}: {error}
                      </Text>
                    </View>
                  ) : null
                )}
              </View>
            </View>
          )}
        </collectionForm.Subscribe>
      </FormSection> */}

      <View className="px-4 pb-8">
        {submitError && isSubmitting && (
          <Text className="text-red-500 text-center mb-2">{submitError}</Text>
        )}

        <collectionForm.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Pressable
              onPress={() => collectionForm.handleSubmit()}
              disabled={!canSubmit}
              className={`flex flex-row items-center justify-center px-2 py-3 rounded-md ${
                isSubmitting ? "bg-blue-400" : "bg-blue-600"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" className="mr-2" />
              ) : null}
              <Text className="text-white text-lg font-bold">
                {isSubmitting ? "Adding Collection..." : "Add Collection"}
              </Text>
            </Pressable>
          )}
        </collectionForm.Subscribe>
      </View>
    </ScrollView>
  );
}
