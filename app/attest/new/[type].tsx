import { useCreateEvent } from "@/api/events/new";
import SafeAreaContent from "@/components/SafeAreaContent";
import AddMaterialModal from "@/components/attest/AddMaterialModal";
import FormSection from "@/components/forms/FormSection";
import QRTextInput from "@/components/forms/QRTextInput";
import { ACTION_SLUGS } from "@/constants/action";
import { MATERIAL_ID_TO_NAME } from "@/constants/material";
import { ActionTitle } from "@/types/action";
import { MaterialDetail } from "@/types/material";
import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { z } from "zod";

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
    .array(
      z
        .object({
          id: z.number(),
          weight: z.number().min(0).optional(),
          code: z.string().min(0).optional(),
        })
        .optional()
    )
    .optional() as z.ZodType<MaterialDetail[]>,
  outgoingMaterials: z
    .array(
      z
        .object({
          id: z.number(),
          weight: z.number().min(0).optional(),
          code: z.string().min(0).optional(),
        })
        .optional()
    )
    .optional() as z.ZodType<MaterialDetail[]>,
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
      incomingMaterials: [] as MaterialDetail[],
      outgoingMaterials: [] as MaterialDetail[],
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

  return (
    <SafeAreaContent>
      <View className="absolute top-20 right-[-30px] bg-white-sand">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[223px] h-[228px]"
          accessibilityLabel="Decorative turtle illustration"
          accessibilityRole="image"
        />
      </View>
      <View className="flex-row items-center justify-end">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#0D0D0D" />
        </Pressable>
      </View>
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        {title}
      </Text>
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
            className="flex-1space-y-4"
          >
            <form.Field name="incomingMaterials">
              {(field) => (
                <MaterialSection
                  category="incoming"
                  isModalVisible={isIncomingMaterialsPickerVisible}
                  setModalVisible={setIsIncomingMaterialsPickerVisible}
                  selectedMaterials={field.state.value as MaterialDetail[]}
                  setSelectedMaterials={(materials: MaterialDetail[]) =>
                    field.handleChange(materials)
                  }
                />
              )}
            </form.Field>
            <form.Field name="outgoingMaterials">
              {(field) => (
                <MaterialSection
                  category="outgoing"
                  isModalVisible={isOutgoingMaterialsPickerVisible}
                  setModalVisible={setIsOutgoingMaterialsPickerVisible}
                  selectedMaterials={field.state.value as MaterialDetail[]}
                  setSelectedMaterials={field.handleChange}
                />
              )}
            </form.Field>
            {title === "Manufacturing" && (
              <View className="mt-10 rounded-lg">
                <View className="flex-row items-center space-x-0.5">
                  <Text className="text-xl font-dm-light text-enaleia-black tracking-tighter">
                    Manufacturing informations
                  </Text>
                  <View className="-rotate-45">
                    <Ionicons name="arrow-down" size={24} color="#8E8E93" />
                  </View>
                </View>

                <FormSection>
                  <View className="space-y-0.5">
                    <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter mb-2">
                      Choose product
                    </Text>
                    <form.Field name="manufacturing.product">
                      {(field) => (
                        <TextInput
                          value={field.state.value as string}
                          onChangeText={(text) => {
                            field.handleChange(text);
                          }}
                          className="flex-1 rounded-md px-3 bg-white"
                          placeholder="Product name"
                        />
                      )}
                    </form.Field>
                  </View>
                  <form.Field name="manufacturing.quantity">
                    {(field) => (
                      <View className="space-y-0.5">
                        <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter mb-2">
                          Quantity
                        </Text>
                        <TextInput
                          value={field.state.value.toString()}
                          onChangeText={(text) => {
                            field.handleChange(Number(text));
                          }}
                          className="flex-1 rounded-md px-3 bg-white"
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
                        <Text className="text-base font-dm-bold text-enaleia-black tracking-tighter mb-2">
                          Weight
                        </Text>
                        <TextInput
                          value={field.state.value.toString()}
                          onChangeText={(text) => {
                            field.handleChange(Number(text));
                          }}
                          className="flex-1 rounded-md px-3 bg-white"
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
                  className={`flex-row items-center justify-center mt-4 p-3 rounded-full ${
                    !canSubmit || isSubmitting ? "bg-blue-400" : "bg-blue-ocean"
                  }`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" className="mr-2" />
                  ) : null}
                  <Text className="text-base font-dm-medium text-slate-50 tracking-tight">
                    {isSubmitting ? "Submitting..." : "Submit Attestation"}
                  </Text>
                </Pressable>
              )}
            </form.Subscribe>
            {/* DEBUG SECTION */}
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
  selectedMaterials: MaterialDetail[];
  setSelectedMaterials: (materials: MaterialDetail[]) => void;
}) => {
  const title = category === "incoming" ? "Incoming" : "Outgoing";
  const icon = category === "incoming" ? "arrow-down" : "arrow-up";
  const iconRotation = category === "incoming" ? "-rotate-45" : "rotate-45";

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials.splice(index, 1);
    setSelectedMaterials(newMaterials);
  };

  return (
    <View className="mt-6">
      <View className="flex-row items-start space-x-1 mb-4">
        <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter">
          {title}
        </Text>
        <View className={iconRotation}>
          <Ionicons name={icon} size={24} color="#8E8E93" />
        </View>
      </View>
      <View className="flex-col items-center justify-center">
        {selectedMaterials.length > 0 ? (
          <View className="w-full">
            {selectedMaterials.map(({ id, weight, code }, materialIndex) => (
              <View key={materialIndex} className="mb-5">
                <View className="flex-row items-center justify-between w-full mb-1">
                  <Text className="text-base font-dm-bold text-enaleia-black tracking-[-0.5px]">
                    {MATERIAL_ID_TO_NAME[id]}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveMaterial(materialIndex)}
                  >
                    <Ionicons name="trash-outline" size={24} color="#8E8E93" />
                  </Pressable>
                </View>
                <View className="flex-row items-center justify-between w-full rounded-lg">
                  <View className="flex-1 border-[1.5px] border-grey-3 rounded-l-2xl p-2 bg-white">
                    <Text className="text-sm font-dm-bold text-grey-6 tracking-tighter">
                      Code
                    </Text>
                    <QRTextInput
                      value={code || ""}
                      onChangeText={(text) => {
                        setSelectedMaterials(
                          selectedMaterials.map((material, index) =>
                            index === materialIndex
                              ? { ...material, code: text }
                              : material
                          )
                        );
                      }}
                    />
                  </View>
                  <View className="flex-1 border-[1.5px] border-grey-3 border-l-0 rounded-r-2xl p-2 bg-white justify-end">
                    <Text className="w-full text-sm font-dm-bold text-grey-6 tracking-tighter text-right">
                      Weight
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        value={weight.toString()}
                        className="flex-1 h-[28px] py-0 font-dm-bold tracking-tighter text-enaleia-black text-xl text-right"
                        onChangeText={(text) => {
                          const parsedWeight = Number(text);
                          setSelectedMaterials(
                            selectedMaterials.map((material, index) =>
                              index === materialIndex
                                ? {
                                    ...material,
                                    weight: isNaN(parsedWeight)
                                      ? 0
                                      : parsedWeight,
                                  }
                                : material
                            )
                          );
                        }}
                        keyboardType="numeric"
                      />
                      <Text className="flex-[0.2] text-sm font-dm-bold text-grey-6 tracking-tighter text-right">
                        kg
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <Pressable
        className="flex-row items-center justify-center mt-2 bg-white px-3 py-2 rounded-full border-[1.5px] border-grey-3"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-outline" size={24} color="#8E8E93" />
        <Text className="text-sm font-dm-bold text-slate-600 tracking-tight">
          Add {category}
        </Text>
      </Pressable>
      <AddMaterialModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        selectedMaterials={selectedMaterials}
        setSelectedMaterials={setSelectedMaterials}
      />
    </View>
  );
};

export default NewActionScreen;
