import ActionButton from "@/components/ActionButton";
import SafeAreaContent from "@/components/SafeAreaContent";
import AddMaterialModal from "@/components/attest/AddMaterialModal";
import FormSection from "@/components/forms/FormSection";
import { ACTION_SLUGS } from "@/constants/action";
import { MATERIAL_ID_TO_NAME } from "@/constants/material";
import { ActionTitle } from "@/types/action";
import { MaterialDetails } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import uuid from "react-native-uuid";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { useCreateEvent } from "@/api/events/new";

// TODO: Setup form inputs
// TODO: Update validation so that atleast one incoming or outgoing material is required
const eventFormSchema = z.object({
  type: z
    .string()
    .refine((value) => Object.keys(ACTION_SLUGS).includes(value), {
      message: "Please select an action that exists",
    }) as z.ZodType<ActionTitle>,
  location: z.string().min(1),
  date: z.string().min(1),
  incomingMaterials: z
    .record(
      z.string(),
      z.object({
        weight: z.number().min(0).optional(),
        code: z.string().min(0).optional(),
      })
    )
    .optional(),
  outgoingMaterials: z
    .record(
      z.string(),
      z.object({
        weight: z.number().min(0).optional(),
        code: z.string().min(0).optional(),
      })
    )
    .optional(),
  manufacturing: z
    .object({
      weightInKg: z.number().min(0).optional(),
      quantity: z.number().min(0).optional(),
      product: z.string().min(0).optional(),
    })
    .optional(),
});

export type EventFormType = z.infer<typeof eventFormSchema>;

const NewActionScreen = () => {
  const { type } = useLocalSearchParams(); // slug format
  const { mutateAsync: createEvent } = useCreateEvent();

  const title = Object.keys(ACTION_SLUGS).find(
    (key) => ACTION_SLUGS[key as ActionTitle] === type
  ) as ActionTitle;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const form = useForm({
    defaultValues: {
      type: title as ActionTitle,
      location: "Durban, South Africa",
      date: new Date().toISOString(),
      incomingMaterials: {},
      outgoingMaterials: {},
      manufacturing: {
        product: "",
        quantity: 0,
        weightInKg: 0,
      },
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
        } = eventFormSchema.safeParse(value);

        if (!parseSuccess) {
          setSubmitError("Please fix the form errors before submitting");
          console.error("Form validation errors:", parseError);
          return;
        }

        const formDataWithLocalId = {
          ...value,
          localId: uuid.v4() as string,
          date: new Date().toISOString(),
        };

        try {
          // TODO: Implement API call
          // console.log(
          //   "Form submitted with values:",
          //   JSON.stringify(formDataWithLocalId, null, 2)
          // );
          await createEvent({
            ...formDataWithLocalId,
            isNotSynced: true,
          });
          // console.log({ response });
        } catch (error) {
          console.error("Failed to create action:", error);
          throw error;
        }
      } catch (error) {
        setSubmitError("An error occurred while submitting the form");
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: eventFormSchema,
    },
  });

  const [
    isIncomingMaterialsPickerVisible,
    setIsIncomingMaterialsPickerVisible,
  ] = useState(false);

  const [
    isOutgoingMaterialsPickerVisible,
    setIsOutgoingMaterialsPickerVisible,
  ] = useState(false);

  // TODO: Add a button to save the action
  // TODO: Refactor incoming and outgoing materials to be the same component
  return (
    <SafeAreaContent>
      <Link href="/home" asChild>
        <Pressable className="flex-row items-center gap-0.5 mb-4 justify-start active:translate-x-1 transition-transform duration-200 ease-out">
          <Ionicons name="chevron-back" size={16} color="#24548b" />
          <Text className="text-sm font-dm-medium text-neutral-600">Home</Text>
        </Pressable>
      </Link>
      <Text className="text-3xl font-dm-medium text-slate-600 tracking-[-1px] mb-2">
        Add new action
      </Text>
      <ActionButton title={title} presentation="banner" />
      <View className="flex-1 py-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 0, paddingBottom: 20 }}
        >
          <View
            onStartShouldSetResponder={() => true}
            onResponderRelease={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="incomingMaterials">
              {(field) => (
                <MaterialSection
                  category="incoming"
                  isModalVisible={isIncomingMaterialsPickerVisible}
                  setModalVisible={setIsIncomingMaterialsPickerVisible}
                  selectedMaterials={field.state.value as MaterialDetails}
                  setSelectedMaterials={field.handleChange}
                />
              )}
            </form.Field>
            <form.Field name="outgoingMaterials">
              {(field) => (
                <MaterialSection
                  category="outgoing"
                  isModalVisible={isOutgoingMaterialsPickerVisible}
                  setModalVisible={setIsOutgoingMaterialsPickerVisible}
                  selectedMaterials={field.state.value as MaterialDetails}
                  setSelectedMaterials={field.handleChange}
                />
              )}
            </form.Field>
            {title === "Manufacturing" && (
              <View className="mt-6 bg-slate-50 rounded-lg">
                <Text className="text-base font-dm-bold text-slate-600 tracking-tighter mb-2 px-3 pt-3">
                  Manufacturing details
                </Text>

                <FormSection>
                  <View className="space-y-0.5">
                    <Text className="text-base font-dm-medium text-slate-600 tracking-tighter mb-2">
                      Choose product
                    </Text>
                    <form.Field name="manufacturing.product">
                      {(field) => (
                        <TextInput
                          value={field.state.value as string}
                          onChangeText={(text) => {
                            field.handleChange(text);
                          }}
                          className="flex-1 border-[1.5px] border-slate-300 rounded-md px-3"
                          placeholder="Product name"
                        />
                      )}
                    </form.Field>
                  </View>
                  <form.Field name="manufacturing.quantity">
                    {(field) => (
                      <View className="space-y-0.5">
                        <Text className="text-base font-dm-medium text-slate-600 tracking-tighter mb-2">
                          Quantity
                        </Text>
                        <TextInput
                          value={field.state.value.toString()}
                          onChangeText={(text) => {
                            field.handleChange(Number(text));
                          }}
                          className="flex-1 border-[1.5px] border-slate-300 rounded-md px-3"
                          placeholder="Quantity"
                          inputMode="numeric"
                        />
                      </View>
                    )}
                  </form.Field>
                  <form.Field
                    name="manufacturing.weightInKg"
                    children={(field) => (
                      <View className="space-y-0.5">
                        <Text className="text-base font-dm-medium text-slate-600 tracking-tighter mb-2">
                          Weight
                        </Text>
                        <TextInput
                          value={field.state.value.toString()}
                          onChangeText={(text) => {
                            field.handleChange(Number(text));
                          }}
                          className="flex-1 border-[1.5px] border-slate-300 rounded-md px-3"
                          placeholder="Weight in kg"
                          inputMode="numeric"
                        />
                      </View>
                    )}
                  ></form.Field>
                </FormSection>
              </View>
            )}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Pressable
                  onPress={() => {
                    console.log("Submit button pressed");
                    console.log({ canSubmit, isSubmitting });
                    form.handleSubmit();
                  }}
                  // disabled={!canSubmit || isSubmitting}
                  className={`flex-row items-center justify-center mt-4 px-3 py-2 rounded-md border-[1.5px] border-slate-300 ${
                    !canSubmit || isSubmitting ? "bg-blue-400" : "bg-blue-600"
                  }`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" className="mr-2" />
                  ) : null}
                  <Text className="text-base font-dm-medium text-slate-50 tracking-tight">
                    {isSubmitting ? "Adding action..." : "Add action"}
                  </Text>
                </Pressable>
              )}
            </form.Subscribe>
            <View className="px-4 mt-4">
              <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                  <Text className="text-xs font-dm-regular text-slate-500 bg-slate-100 p-2 rounded">
                    {JSON.stringify(values, null, 2)}
                  </Text>
                )}
              </form.Subscribe>
              {submitError && (
                <Text className="text-sm font-dm-regular text-red-500 mt-2">
                  {submitError}
                </Text>
              )}
              <form.Subscribe selector={(state) => state.errorMap}>
                {(errorMap) => {
                  return Object.entries(errorMap).map(
                    ([validationType, errors]) => {
                      if (
                        typeof errors === "object" &&
                        errors !== null &&
                        "fields" in errors
                      ) {
                        return Object.entries(errors.fields).map(
                          ([fieldName, error]) => (
                            <Text
                              key={`${validationType}-${fieldName}`}
                              className="text-red-600"
                            >
                              {fieldName}: {String(error)}
                            </Text>
                          )
                        );
                      }
                      return (
                        <Text key={validationType} className="text-red-600">
                          {validationType}: {String(errors)}
                        </Text>
                      );
                    }
                  );
                }}
              </form.Subscribe>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaContent>
  );
};

const MaterialSection = ({
  category,
  isModalVisible,
  setModalVisible,
  selectedMaterials,
  setSelectedMaterials,
}: {
  category: "incoming" | "outgoing";
  isModalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectedMaterials: MaterialDetails;
  setSelectedMaterials: (materials: MaterialDetails) => void;
}) => {
  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between px-1">
        <Text className="text-base font-dm-bold text-slate-600 tracking-tighter mb-2">
          {category === "incoming" ? "Incoming" : "Outgoing"} materials
        </Text>
        <Text className="text-sm font-dm-medium text-slate-600 tracking-tighter bg-slate-200 px-1 py-0.5 rounded-full min-w-6 min-h-6 flex-row items-center justify-center">
          {Object.keys(selectedMaterials)?.length || 0}
        </Text>
      </View>
      <View className="flex-col items-center justify-center max-h-[300px]">
        {Object.keys(selectedMaterials).length > 0 ? (
          <ScrollView className="w-full rounded-lg overflow-clip border-[1.5px] border-slate-200">
            {Object.entries(selectedMaterials).map(
              ([materialId, { weight, code }]) => (
                <View
                  key={materialId}
                  className="border-b-[1.5px] last-of-type:border-b-0 border-slate-200"
                >
                  <View className="bg-slate-50 w-full">
                    <Text className="text-base font-dm-bold tracking-tight text-slate-950 bg-slate-50 px-3 py-2">
                      {MATERIAL_ID_TO_NAME[materialId]}
                    </Text>
                    <View className="flex-row justify-between px-3 pb-2">
                      {weight && (
                        <View className="flex-row items-center justify-center space-x-1">
                          <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                            <Ionicons
                              name="scale-outline"
                              size={14}
                              color="#24548b"
                            />
                          </View>
                          <View className="flex-row items-baseline gap-1">
                            <Text className="text-sm font-dm-medium text-slate-500">
                              {weight}
                            </Text>
                            <Text className="text-xs font-dm-medium text-slate-500">
                              kg
                            </Text>
                          </View>
                        </View>
                      )}
                      {code && (
                        <View className="flex-row items-center justify-center gap-1">
                          <View className="bg-slate-200 rounded-full p-1 h-6 w-6 flex-row items-center justify-center">
                            <Ionicons
                              name="barcode-outline"
                              size={14}
                              color="#24548b"
                            />
                          </View>
                          <Text className="font-mono text-sm text-slate-500 bg-slate-200 px-1 py-0.5 rounded-md">
                            {code}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="py-1 bg-slate-50" />
                </View>
              )
            )}
          </ScrollView>
        ) : null}
      </View>
      <Pressable
        className="flex-row items-center justify-center mt-2 bg-blue-100 px-3 py-2 rounded-md border-[1.5px] border-slate-300"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-base font-dm-medium text-slate-600 tracking-tight">
          {Object.keys(selectedMaterials).length > 0
            ? `Update ${category} materials`
            : `Add ${category} materials`}
        </Text>
      </Pressable>
      <AddMaterialModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
        type={category}
      />
    </View>
  );
};

export default NewActionScreen;
