import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import MaterialSection from "@/components/features/attest/MaterialSection";
import { SentToQueueModal } from "@/components/features/attest/SentToQueueModal";
import TypeInformationModal from "@/components/features/attest/TypeInformationModal";
import ErrorMessage from "@/components/shared/ErrorMessage";
import FormSection from "@/components/shared/FormSection";
import SafeAreaContent from "@/components/shared/SafeAreaContent";
import { ACTION_SLUGS } from "@/constants/action";
import { useQueue } from "@/contexts/QueueContext";
import { useActions } from "@/hooks/data/useActions";
import { useMaterials } from "@/hooks/data/useMaterials";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { ActionTitle, typeModalMap } from "@/types/action";
import { MaterialDetail } from "@/types/material";
import { QueueItem, QueueItemStatus } from "@/types/queue";
import { getQueueCacheKey } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { z } from "zod";
import { LocationPermissionRequest } from "@/components/features/location/LocationPermissionRequest";
import { LocationSchema } from "@/services/locationService";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import SelectField from "@/components/shared/SelectField";
import { useProducts } from "@/hooks/data/useProducts";
import DecimalInput from "@/components/shared/DecimalInput";

const eventFormSchema = z.object({
  type: z
    .string()
    .refine((value) => Object.keys(ACTION_SLUGS).includes(value), {
      message: "Please select an action that exists",
    }) as z.ZodType<ActionTitle>,
  date: z.string().min(1),
  location: LocationSchema.optional(),
  collectorId: z.string().optional(),
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
      product: z.number().min(0).optional(),
    })
    .optional(),
});

export type EventFormType = z.infer<typeof eventFormSchema>;

const NewActionScreen = () => {
  const { slug } = useLocalSearchParams(); // slug format
  const location = useCurrentLocation();
  const { userData } = useUserInfo();
  const scrollViewRef = useRef<ScrollView>(null);

  const [isSentToQueue, setIsSentToQueue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isTypeInformationModalVisible, setIsTypeInformationModalVisible] =
    useState(false);

  const { materialsData, isLoading: materialsLoading } = useMaterials();
  const {
    productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const { updateQueueItems } = useQueue();

  const { actionsData } = useActions();

  const currentAction = useMemo(() => {
    if (!actionsData?.length || !slug) return undefined;

    const matchingAction = actionsData.find((action) => action.slug === slug);

    if (!matchingAction) {
      console.warn(`No action found for slug: ${slug}`);
    }
    return matchingAction;
  }, [actionsData, slug]);

  if (!actionsData?.length) return null;
  if (!currentAction) {
    console.warn("No matching action found for:", slug);
    return null;
  }

  const validateMaterials = (materials: MaterialDetail[]) => {
    if (materials.length === 0) return false;
    return materials.some(
      (material) =>
        (material.code && material.code.trim() !== "") ||
        (material.weight && material.weight > 0)
    );
  };

  const addItemToQueue = async (queueItem: QueueItem) => {
    try {
      const queueCacheKey = getQueueCacheKey();

      console.log("Adding queue item:", JSON.stringify(queueItem, null, 2));

      const existingData = await AsyncStorage.getItem(queueCacheKey);

      let existingItems: QueueItem[] = [];
      if (existingData) {
        try {
          existingItems = JSON.parse(existingData);
          if (!Array.isArray(existingItems)) {
            console.warn("Stored data is not an array, resetting");
            existingItems = [];
          }
        } catch (parseError) {
          console.error("Error parsing stored data:", parseError);
          throw new Error("Failed to parse existing queue data");
        }
      }

      const updatedItems = [...existingItems, queueItem];

      await updateQueueItems(updatedItems);

      const savedData = await AsyncStorage.getItem(queueCacheKey);
      if (!savedData) {
        throw new Error("Failed to verify queue item was saved");
      }
      console.log("Verified saved data:", savedData);
    } catch (error) {
      console.error("Error in addItemToQueue:", error);

      const errorMessage =
        error instanceof Error && error.message.includes("Cache key")
          ? "Queue functionality is not properly configured. Please contact support."
          : "Failed to add item to queue. Please try again.";

      setSubmitError(errorMessage);
      throw error;
    }
  };

  const form = useForm({
    defaultValues: {
      type: currentAction?.name as ActionTitle,
      date: new Date().toISOString(),
      location: undefined,
      collectorId: "",
      incomingMaterials: [] as MaterialDetail[],
      outgoingMaterials: [] as MaterialDetail[],
      manufacturing: {
        product: undefined,
        quantity: undefined,
        weightInKg: undefined,
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

        const actionId = currentAction?.id;

        if (!actionId) {
          throw new Error("Could not find matching action ID");
        }

        const queueItem: QueueItem = {
          ...value,
          actionId,
          localId: uuid.v4() as string,
          date: new Date().toISOString(),
          status: QueueItemStatus.PENDING,
          retryCount: 0,
          incomingMaterials: value.incomingMaterials || [],
          outgoingMaterials: value.outgoingMaterials || [],
          location: value.location,
          company:
            typeof userData?.Company === "number"
              ? undefined
              : userData?.Company?.id,
        };

        await addItemToQueue(queueItem);
        setSubmitError(null);
        setIsSentToQueue(true);
      } catch (error) {
        setIsSentToQueue(false);
        const errorMsg =
          error instanceof Error && error.message.includes("Cache key")
            ? "Unable to access queue storage. Please try again or contact support"
            : "Failed to add action to queue. Please try again or contact support";
        setSubmitError(errorMsg);
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

  const { data: locationData, isLoading: locationLoading } =
    useCurrentLocation();

  useEffect(() => {
    if (locationData) {
      form.setFieldValue("location", locationData);
    }
  }, [locationData]);

  // Add keyboard handling effect
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        // Only needed for iOS
        if (Platform.OS === "ios") {
          // Add a small delay to ensure the input is focused
          setTimeout(() => {
            // Scroll down a bit to ensure the focused input is visible
            scrollViewRef.current?.scrollTo({ y: 100, animated: true });
          }, 100);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // Optional: Reset scroll position when keyboard hides
        if (Platform.OS === "ios") {
          scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
        {...typeModalMap[currentAction.name]}
        isVisible={isTypeInformationModalVisible}
        onClose={() => setIsTypeInformationModalVisible(false)}
      />
      <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
        {currentAction?.name}
      </Text>
      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            flexGrow: 0,
            paddingBottom: Platform.OS === "ios" ? 120 : 20,
          }}
        >
          <View className="flex-1">
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <View className="mb-2 mt-4">
                  <LocationPermissionRequest
                    onPermissionGranted={() => {
                      // Location will be automatically updated via the effect
                    }}
                    onPermissionDenied={() => {
                      Alert.alert(
                        "Location Access",
                        "Location helps verify where events take place. You can still use saved locations or change this later in settings."
                      );
                    }}
                    onLocationSelected={(location) => {
                      form.setFieldValue("location", location);
                    }}
                    currentLocation={values.location}
                  />
                </View>
              )}
            </form.Subscribe>

            {currentAction?.category === "Collection" && (
              <View className="mt-4 mb-2">
                <Text className="text-[20px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                  Collector ID
                </Text>
                <form.Field name="collectorId">
                  {(field) => (
                    <QRTextInput
                      value={field.state.value || ""}
                      onChangeText={field.handleChange}
                      placeholder="Scan or enter collector ID"
                      variant="standalone"
                    />
                  )}
                </form.Field>
              </View>
            )}
            <View className="h-[1.5px] bg-slate-200 my-5" />
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
                  hideCodeInput={currentAction?.category === "Collection"}
                />
              )}
            </form.Field>
            {currentAction?.name !== "Manufacturing" && (
              <form.Field name="outgoingMaterials">
                {(field) => (
                  <>
                    <View className="h-[1.5px] bg-slate-200 my-5" />
                    <MaterialSection
                      materials={materialsData}
                      category="outgoing"
                      isModalVisible={isOutgoingMaterialsPickerVisible}
                      setModalVisible={setIsOutgoingMaterialsPickerVisible}
                      selectedMaterials={field.state.value as MaterialDetail[]}
                      setSelectedMaterials={(materials: MaterialDetail[]) =>
                        field.handleChange(materials)
                      }
                      hideCodeInput={currentAction?.category === "Collection"}
                    />
                  </>
                )}
              </form.Field>
            )}

            {currentAction?.name === "Manufacturing" && (
              <View className="mt-10 rounded-lg p-2 border-[1.5px] border-slate-200 bg-white">
                <View className="flex-row items-center space-x-0.5 mb-4">
                  <Text className="text-xl font-dm-regular text-enaleia-black tracking-tighter">
                    Manufacturing information
                  </Text>
                </View>

                <FormSection>
                  <View className="space-y-0.5">
                    <Text className="text-base font-dm-medium text-enaleia-black tracking-tighter mb-2">
                      Choose product
                    </Text>
                    <form.Field name="manufacturing.product">
                      {(field) => {
                        const options =
                          productsData?.map((product) => ({
                            label: `${
                              product.product_name || "Unknown Product"
                            }`,
                            value: product.product_id,
                          })) || [];

                        return (
                          <>
                            {productsError && (
                              <Text className="text-sm text-red-500 mb-2">
                                Failed to load products
                              </Text>
                            )}
                            <SelectField
                              value={field.state.value}
                              onChange={(value) => field.handleChange(value)}
                              options={options}
                              placeholder="Choose a product"
                              isLoading={productsLoading}
                              error={productsError?.toString()}
                              disabled={productsLoading || !!productsError}
                            />
                          </>
                        );
                      }}
                    </form.Field>
                  </View>
                  <View className="flex-row space-x-2">
                    <form.Field name="manufacturing.quantity">
                      {(field) => (
                        <View className="flex-1">
                          <Text className="text-base font-dm-medium text-enaleia-black tracking-tighter mb-2">
                            Quantity
                          </Text>
                          <TextInput
                            value={field.state.value?.toString() || ""}
                            onChangeText={(text) => {
                              field.handleChange(Number(text));
                            }}
                            className="rounded-md px-3 py-3 h-12 bg-white border-[1.5px] border-slate-200 focus:border-primary-dark-blue"
                            placeholder="Quantity"
                            inputMode="numeric"
                          />
                        </View>
                      )}
                    </form.Field>
                    <View className="h-[1.5px] bg-slate-200 mx-1" />
                    <form.Field
                      name="manufacturing.weightInKg"
                      children={(field) => (
                        <DecimalInput
                          field={field}
                          label="Weight in kg"
                          placeholder="Weight in kg"
                        />
                      )}
                    />
                  </View>
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
                const handleSubmitClick = (e: GestureResponderEvent) => {
                  setSubmitError(null);
                  e.preventDefault();
                  e.stopPropagation();

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
                    {/* Error message */}
                    {submitError && (
                      <View className="mt-2">
                        <ErrorMessage message={submitError} />
                      </View>
                    )}

                    <Pressable
                      onPress={handleSubmitClick}
                      className={`flex-row items-center justify-center ${
                        submitError ? "mt-2" : "mt-3"
                      } p-3 rounded-full ${
                        !canSubmit || isSubmitting
                          ? "bg-primary-dark-blue"
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
