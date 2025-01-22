import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import MaterialSection from "@/components/features/attest/MaterialSection";
import { SentToQueueModal } from "@/components/features/attest/SentToQueueModal";
import TypeInformationModal from "@/components/features/attest/TypeInformationModal";
import FormSection from "@/components/shared/FormSection";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { ACTION_SLUGS } from "@/constants/action";
import { useMaterials } from "@/hooks/data/useMaterials";
import { ActionTitle, typeModalMap } from "@/types/action";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { QueueItem, QueueItemStatus } from "@/types/queue";

const eventFormSchema = z.object({
  type: z
    .string()
    .refine((value) => Object.keys(ACTION_SLUGS).includes(value), {
      message: "Please select an action that exists",
    }) as z.ZodType<ActionTitle>,
  // location: z.string().min(1),
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
  const location = useCurrentLocation();

  const [isSentToQueue, setIsSentToQueue] = useState(false);
  const title = Object.keys(ACTION_SLUGS).find(
    (key) => ACTION_SLUGS[key as ActionTitle] === type
  ) as ActionTitle;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isTypeInformationModalVisible, setIsTypeInformationModalVisible] =
    useState(false);

  const { materialsData, isLoading: materialsLoading } = useMaterials();

  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const validateMaterials = (materials: MaterialDetail[]) => {
    if (materials.length === 0) return false;
    return materials.some(
      (material) =>
        (material.code && material.code.trim() !== "") ||
        (material.weight && material.weight > 0)
    );
  };

  const addItemToQueue = async (queueItem: QueueItem) => {
    const cacheKey = process.env.EXPO_PUBLIC_CACHE_KEY;
    if (!cacheKey) return;

    // Get existing items
    const existingData = await AsyncStorage.getItem(cacheKey);
    const existingItems: QueueItem[] = existingData
      ? JSON.parse(existingData)
      : [];

    // Add new item
    const updatedItems = [...existingItems, queueItem];
    await AsyncStorage.setItem(cacheKey, JSON.stringify(updatedItems));
  };

  const form = useForm({
    defaultValues: {
      type: title as ActionTitle,
      // location: "",
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
        const { success: isValid, error: validationError } =
          eventFormSchema.safeParse(value);
        if (!isValid) {
          setSubmitError("Please fix the form errors before submitting");
          console.error("Form validation errors:", validationError);
          return;
        }

        const queueItem: QueueItem = {
          ...value,
          localId: uuid.v4() as string,
          date: new Date().toISOString(),
          status: QueueItemStatus.PENDING,
          retryCount: 0,
        };

        await addItemToQueue(queueItem);
        setIsSentToQueue(true);
      } catch (error) {
        setSubmitError("An error occurred while adding to queue");
        console.error("Error adding to queue:", error);
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

  const hasAnyMaterials = (values: any) => {
    if (typeof values !== "object" || values === null) return false;

    const incomingMaterials =
      "incomingMaterials" in values ? values.incomingMaterials || [] : [];
    const outgoingMaterials =
      "outgoingMaterials" in values ? values.outgoingMaterials || [] : [];

    return incomingMaterials.length > 0 || outgoingMaterials.length > 0;
  };

  return (
    <SafeAreaContent>
      <View className="absolute top-20 right-[-30px] bg-white-sand opacity-20">
        <Image
          source={require("@/assets/images/animals/Turtle.png")}
          className="w-[223px] h-[228px]"
          accessibilityLabel="Decorative turtle illustration"
          accessibilityRole="image"
        />
      </View>
      <View className="flex-row items-center justify-between pb-4">
        <form.Subscribe selector={(state) => state.values}>
          {(values) => (
            <Pressable
              onPress={() => {
                if (hasAnyMaterials(values)) {
                  setShowLeaveModal(true);
                } else {
                  router.back();
                }
              }}
              className="flex-row items-center space-x-1"
            >
              <Ionicons
                name="chevron-back-circle-outline"
                size={24}
                color="#0D0D0D"
              />
              <Text className="text-base font-dm-regular text-enaleia-black tracking-tighter">
                Back
              </Text>
            </Pressable>
          )}
        </form.Subscribe>

        <Pressable onPress={() => setIsTypeInformationModalVisible(true)}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#0D0D0D"
          />
        </Pressable>
      </View>
      <TypeInformationModal
        {...typeModalMap[title]}
        isVisible={isTypeInformationModalVisible}
        onClose={() => setIsTypeInformationModalVisible(false)}
      />
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        {title}
      </Text>
      <View className="flex-1">
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
            className="flex-1 space-y-2"
          >
            <form.Field name="incomingMaterials">
              {(field) => (
                <MaterialSection
                  materials={materialsData}
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
            {title !== "Manufacturing" && (
              <form.Field name="outgoingMaterials">
                {(field) => (
                  <MaterialSection
                    materials={materialsData}
                    category="outgoing"
                    isModalVisible={isOutgoingMaterialsPickerVisible}
                    setModalVisible={setIsOutgoingMaterialsPickerVisible}
                    selectedMaterials={field.state.value as MaterialDetail[]}
                    setSelectedMaterials={field.handleChange}
                  />
                )}
              </form.Field>
            )}
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
                          value={field.state.value?.toString() || ""}
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
                          value={field.state.value?.toString() || ""}
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
              selector={(state) => [
                state.canSubmit,
                state.isSubmitting,
                state.values,
              ]}
            >
              {([canSubmit, isSubmitting, values]) => {
                const handleSubmitClick = () => {
                  const hasValidIncoming = validateMaterials(
                    typeof values === "object" &&
                      values !== null &&
                      "incomingMaterials" in values
                      ? values.incomingMaterials || []
                      : []
                  );
                  const hasValidOutgoing = validateMaterials(
                    typeof values === "object" &&
                      values !== null &&
                      "outgoingMaterials" in values
                      ? values.outgoingMaterials || []
                      : []
                  );

                  if (!hasValidIncoming && !hasValidOutgoing) {
                    setShowIncompleteModal(true);
                    setPendingSubmission(true);
                    return;
                  }

                  form.handleSubmit();
                };

                return (
                  <>
                    <Pressable
                      onPress={handleSubmitClick}
                      className={`flex-row items-center justify-center mt-4 p-3 rounded-full ${
                        !canSubmit || isSubmitting
                          ? "bg-blue-400"
                          : "bg-blue-ocean"
                      }`}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="white" className="mr-2" />
                      ) : null}
                      <Text className="text-base font-dm-medium text-slate-50 tracking-tight">
                        {isSubmitting ? "Saving..." : "Create Attestation"}
                      </Text>
                    </Pressable>
                    <IncompleteAttestationModal
                      isVisible={showIncompleteModal}
                      onClose={() => {
                        setShowIncompleteModal(false);
                        setPendingSubmission(false);
                      }}
                      onSubmitAnyway={() => {
                        setShowIncompleteModal(false);
                        if (pendingSubmission) {
                          form.handleSubmit();
                        }
                      }}
                    />
                  </>
                );
              }}
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
      {isSentToQueue && (
        <SentToQueueModal isVisible={isSentToQueue} onClose={() => {}} />
      )}
      <LeaveAttestationModal
        isVisible={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirmLeave={() => {
          setShowLeaveModal(false);
          router.back();
        }}
      />
    </SafeAreaContent>
  );
};

export default NewActionScreen;
