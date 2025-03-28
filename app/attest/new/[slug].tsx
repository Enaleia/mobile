import { IncompleteAttestationModal } from "@/components/features/attest/IncompleteAttestationModal";
import { LeaveAttestationModal } from "@/components/features/attest/LeaveAttestationModal";
import MaterialSection from "@/components/features/attest/MaterialSection";
import { SentToQueueModal } from "@/components/features/attest/SentToQueueModal";
import { SubmitConfirmationModal } from "@/components/features/attest/SubmitConfirmationModal";

import { BatchHelpModal } from "@/components/features/help/BatchHelpModal";
import { CollectionHelpModal } from "@/components/features/help/CollectionHelpModal";
import { ManufacturingHelpModal } from "@/components/features/help/ManufacturingHelpModal";
import { PelletizingHelpModal } from "@/components/features/help/PelletizingHelpModal";
import { ShreddingHelpModal } from "@/components/features/help/ShreddingHelpModal";
import { SortingHelpModal } from "@/components/features/help/SortingHelpModal";
import { WashingHelpModal } from "@/components/features/help/WashingHelpModal";

import { LocationPermissionHandler } from "@/components/features/location/LocationPermissionHandler";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import DecimalInput from "@/components/shared/DecimalInput";

import SafeAreaContent from "@/components/shared/SafeAreaContent";
import SelectField from "@/components/shared/SelectField";
import { ACTION_SLUGS } from "@/constants/action";
import { useQueue } from "@/contexts/QueueContext";
import { useBatchData } from "@/hooks/data/useBatchData";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

import { LocationSchema } from "@/services/locationService";
import { ActionTitle } from "@/types/action";
import { MaterialDetail, processMaterials } from "@/types/material";
import { QueueItem, QueueItemStatus, ServiceStatus } from "@/types/queue";
import { getActiveQueue, getCompletedQueue } from "@/utils/queueStorage";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  GestureResponderEvent,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { z } from "zod";

const ATTEST_FORM_KEY = "attest_form_state";
// Save state to AsyncStorage
const saveFormState = async (state: EventFormType) => {
  try {
    await AsyncStorage.setItem(ATTEST_FORM_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving form state:", error);
  }
};

// Load state from AsyncStorage
const loadFormState = async () => {
  try {
    const savedState = await AsyncStorage.getItem(ATTEST_FORM_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error("Error loading form state:", error);
    return null;
  }
};

// Delete state from AsyncStorage
const deleteFormState = async () => {
  try {
    await AsyncStorage.removeItem(ATTEST_FORM_KEY);
  } catch (error) {
    console.error("Error deleting form state:", error);
  }
};

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
          weight: z
            .number()
            .nullable()
            .refine((value) => value === null || value >= 0, {
              message: "Weight must be greater than or equal to 0",
            }),
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
          weight: z
            .number()
            .nullable()
            .refine((value) => value === null || value >= 0, {
              message: "Weight must be greater than or equal to 0",
            }),
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
  const { data: userData } = useUserInfo();
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation();
  const { updateQueueItems } = useQueue();
  const { data: locationData, isLoading: locationLoading } =
    useCurrentLocation();

  const [isSentToQueue, setIsSentToQueue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isTypeInformationModalVisible, setIsTypeInformationModalVisible] =
    useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [
    isIncomingMaterialsPickerVisible,
    setIsIncomingMaterialsPickerVisible,
  ] = useState(false);
  const [
    isOutgoingMaterialsPickerVisible,
    setIsOutgoingMaterialsPickerVisible,
  ] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [pendingValidation, setPendingValidation] = useState(false);

  const {
    materials: materialsData,
    materialOptions,
    products: productsData,
    actions: actionsData,
  } = useBatchData();

  const processedMaterials = useMemo(() => {
    if (!materialsData) return undefined;
    return processMaterials(materialsData);
  }, [materialsData]);

  const currentAction = useMemo(() => {
    if (!actionsData?.length || !slug) return undefined;

    const matchingAction = actionsData.find((action) => action.slug === slug);

    if (!matchingAction) {
      console.warn(`No action found for slug: ${slug}`);
    }
    return matchingAction;
  }, [actionsData, slug]);

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
        // Add runtime validation for collectorId
        // NOTE: Comment out this section because we are not forcing the user to scan a collector ID card for collection actions
        const runtimeSchema = eventFormSchema.refine(
          (data) => {
            // Remove collector ID validation
            return true;
          },
          {
            message: "Collector ID is required for Collection actions",
            path: ["collectorId"], // Specify the field to attach the error to
          }
        );

        const { success: isValid, error: validationError } =
          runtimeSchema.safeParse(value);
        if (!isValid) {
          // Set field-specific errors
          validationError.errors.forEach((error) => {
            const fieldPath = error.path.join(".") as keyof typeof value;
            form.setFieldMeta(fieldPath, (old) => ({
              ...old,
              errors: [...(old?.errors || []), error.message],
            }));
          });

          // Set general submit error
          setSubmitError("Please fill in all required fields");
          console.error("Form validation errors:", validationError);

          // Scroll to the first error if possible
          if (scrollViewRef.current && validationError.errors[0]?.path[0]) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
          }
          return;
        }

        const actionId = currentAction?.id;

        if (!actionId) {
          throw new Error("Could not find matching action ID");
        }

        const queueItem: QueueItem = {
          ...value,
          actionId,
          actionName: currentAction.name,
          localId: uuid.v4() as string,
          date: new Date().toISOString(),
          status: QueueItemStatus.PENDING,
          retryCount: 0,
          directus: {
            status: ServiceStatus.PENDING,
          },
          eas: {
            status: ServiceStatus.PENDING,
            txHash: undefined,
            verified: false,
          },
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
        await deleteFormState();
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: eventFormSchema,
    },
  });

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
        if (Platform.OS === "ios") {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 100, animated: true });
          }, 100);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
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

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      navigation.setOptions({
        gestureEnabled: false,
      });
    });

    return unsubscribe;
  }, [navigation]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const loadState = async () => {
      const savedState = await loadFormState();
      if (savedState) {
        const formFields: Array<keyof EventFormType> = [
          "type",
          "date",
          "location",
          "collectorId",
          "incomingMaterials",
          "outgoingMaterials",
          "manufacturing",
        ];
        formFields.forEach((key) => {
          if (key in savedState) {
            form.setFieldValue(key, savedState[key]);
          }
        });
      }
    };
    loadState();

    const saveState = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const formValues = form.store.state.values;
        saveFormState(formValues);
      }, 500);
    };

    const unsubscribe = form.store.subscribe(saveState);

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        loadState();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (saveTimeoutRef?.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      unsubscribe();
      deleteFormState();
      subscription.remove();
    };
  }, []);

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
      console.log("Adding queue item:", JSON.stringify(queueItem, null, 2));

      // Get current items, defaulting to empty array if none exist
      const activeItems = (await getActiveQueue()) || [];
      const updatedItems = [...activeItems, queueItem];

      // Use QueueContext to handle both storage and processing
      await updateQueueItems(updatedItems);

      // Verify the item was saved by checking both active and completed queues
      const [savedActiveItems, savedCompletedItems] = await Promise.all([
        getActiveQueue(),
        getCompletedQueue(),
      ]);

      const isInActiveQueue = savedActiveItems?.find(
        (item) => item.localId === queueItem.localId
      );
      const isInCompletedQueue = savedCompletedItems?.find(
        (item) => item.localId === queueItem.localId
      );

      if (!isInActiveQueue && !isInCompletedQueue) {
        console.error(
          "Failed to verify queue item was saved. Active items:",
          savedActiveItems,
          "Completed items:",
          savedCompletedItems
        );
        throw new Error("Failed to verify queue item was saved");
      }
      console.log("save data verified");
      // console.log("Verified saved data:", {
      //   active: savedActiveItems,
      //   completed: savedCompletedItems,
      // });
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

  const hasAnyMaterials = (values: EventFormType | boolean | null | undefined) => {
    if (!values || typeof values === 'boolean') return false;

    const incomingMaterials = values.incomingMaterials || [];
    const outgoingMaterials = values.outgoingMaterials || [];

    // For manufacturing, we need both materials and a product selected
    if (currentAction?.name === "Manufacturing") {
      const hasValidMaterials = incomingMaterials.length > 0 || outgoingMaterials.length > 0;
      const hasProductSelected = values.manufacturing?.product !== undefined;
      return hasValidMaterials && hasProductSelected;
    }

    return incomingMaterials.length > 0 || outgoingMaterials.length > 0;
  };

  return (
    <SafeAreaContent>
      <View className="absolute top-20 right-[-30px] bg-white-sand opacity-60">
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
                  if (saveTimeoutRef?.current) {
                    clearTimeout(saveTimeoutRef.current);
                  }
                  deleteFormState();
                  router.back();
                }
              }}
              className="flex-row items-center space-x-1"
            >
              <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
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
      {currentAction?.name === "Batch" ? (
        <BatchHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Fishing for litter" ||
        currentAction?.name === "Prevention" ||
        currentAction?.name === "Beach cleanup" ||
        currentAction?.name === "Ad-hoc" ? (
        <CollectionHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Manufacturing" ? (
        <ManufacturingHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Pelletizing" ? (
        <PelletizingHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Shredding" ? (
        <ShreddingHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Sorting" ? (
        <SortingHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : currentAction?.name === "Washing" ? (
        <WashingHelpModal
          isVisible={isTypeInformationModalVisible}
          onClose={() => setIsTypeInformationModalVisible(false)}
        />
      ) : null}

      <View className="flex-1">
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            flexGrow: 0,
            paddingBottom: 100,
          }}
        >
          <Text className="text-3xl font-dm-bold text-enaleia-black tracking-[-1px] mb-2">
            {currentAction?.name}
          </Text>
          <View className="flex-1">
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <View className="mb-2 mt-4">
                  <LocationPermissionHandler
                    onPermissionGranted={() => {
                      // Location will be automatically updated via the effect
                    }}
                    onPermissionDenied={() => {
                      // Alert.alert(
                      //   "Location Access",
                      //   "Location helps verify where events take place. You can still use saved locations or change this later in settings."
                      // );
                    }}
                  />
                </View>
              )}
            </form.Subscribe>

            {currentAction?.category === "Collection" && (
              <View className="mb-12">
                <Text className="text-[18px] font-dm-regular text-enaleia-black tracking-tighter mb-2">
                  Collector
                </Text>
                <form.Field name="collectorId">
                  {(field) => (
                    <>
                      <QRTextInput
                        value={field.state.value || ""}
                        onChangeText={field.handleChange}
                        variant="standalone"
                        label="Collector ID Card"
                        error={field.state.meta.errors?.[0] || undefined}
                      />
                    </>
                  )}
                </form.Field>
              </View>
            )}
            <form.Field name="incomingMaterials">
              {(field) => (
                <View className="mb-8">
                  <MaterialSection
                    materials={processedMaterials}
                    category="incoming"
                    isModalVisible={isIncomingMaterialsPickerVisible}
                    setModalVisible={setIsIncomingMaterialsPickerVisible}
                    selectedMaterials={field.state.value as MaterialDetail[]}
                    setSelectedMaterials={(materials: MaterialDetail[]) =>
                      field.handleChange(materials)
                    }
                    hideCodeInput={currentAction?.category === "Collection"}
                  />
                </View>
              )}
            </form.Field>
            {currentAction?.name !== "Manufacturing" && (
              <form.Field name="outgoingMaterials">
                {(field) => (
                  <View className="mb-8 mt-8">
                    <MaterialSection
                      materials={processedMaterials}
                      category="outgoing"
                      isModalVisible={isOutgoingMaterialsPickerVisible}
                      setModalVisible={setIsOutgoingMaterialsPickerVisible}
                      selectedMaterials={field.state.value as MaterialDetail[]}
                      setSelectedMaterials={(materials: MaterialDetail[]) =>
                        field.handleChange(materials)
                      }
                      hideCodeInput={false}
                    />
                  </View>
                )}
              </form.Field>
            )}

            {currentAction?.name === "Manufacturing" && (
              <View className="mt-4">
                <View className="flex-row items-center mb-4">
                  <Text className="text-xl font-dm-regular text-enaleia-black tracking-tighter">
                    Manufacturing information
                  </Text>
                  <View className="ml-2">
                    <Ionicons name="cube-outline" size={24} color="#0D0D0D" />
                  </View>
                </View>

                <View className="space-y-2">
                  <form.Field name="manufacturing.product">
                    {(field) => {
                      const ProductField = () => (
                        <SelectField
                          value={field.state.value}
                          onChange={(value) => field.handleChange(value)}
                          options={
                            productsData?.map((product) => ({
                              label: product.product_name || "Unknown Product",
                              value: product.product_id,
                              type: product.manufactured_by?.name || "Other"
                            })) || []
                          }
                          placeholder="Product"
                          isLoading={!productsData}
                          disabled={!productsData}
                        />
                      );
                      return <ProductField />;
                    }}
                  </form.Field>

                  <View className="flex-row gap-2 mb-4">
                    <View className="flex-1 ">
                      <form.Field name="manufacturing.quantity">
                        {(field) => {
                          const QuantityField = () => (
                            <DecimalInput
                              field={field}
                              label="Batch Quantity"
                              placeholder=""
                              allowDecimals={false}
                              suffix="Unit"
                            />
                          );
                          return <QuantityField />;
                        }}
                      </form.Field>
                    </View>

                    <View className="flex-1">
                      <form.Field name="manufacturing.weightInKg">
                        {(field) => {
                          const WeightField = () => (
                            <DecimalInput
                              field={field}
                              label="Weight per item"
                              placeholder=""
                              suffix="kg"
                            />
                          );
                          return <WeightField />;
                        }}
                      </form.Field>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
          <View className="pt-3">
            <form.Subscribe
              selector={(state) => [
                state.canSubmit,
                state.isSubmitting,
                state.values as EventFormType,
              ]}
            >
              {([canSubmit, isSubmitting, values]) => {
                const handleSubmitClick = (e: GestureResponderEvent) => {
                  setSubmitError(null);
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // First validate the form
                  const hasValidIncoming = validateMaterials(
                    values.incomingMaterials || []
                  );
                  const hasValidOutgoing = validateMaterials(
                    values.outgoingMaterials || []
                  );

                  if (!hasValidIncoming && !hasValidOutgoing) {
                    setShowIncompleteModal(true);
                    return;
                  }

                  // If validation passes, show the confirmation modal
                  setShowSubmitConfirmation(true);
                };

                const handleProceedWithSubmission = () => {
                  setShowSubmitConfirmation(false);
                  form.handleSubmit();
                };

                return (
                  <>
                    <Pressable
                      onPress={handleSubmitClick}
                      disabled={!canSubmit || isSubmitting || !hasAnyMaterials(values)}
                      className={`w-full flex-row items-center justify-center p-3 h-[60px] rounded-full ${
                        !canSubmit || isSubmitting || !hasAnyMaterials(values)
                          ? "bg-primary-dark-blue opacity-50"
                          : "bg-blue-ocean"
                      }`}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="white" className="mr-2" />
                      ) : null}
                      <Text className="text-lg font-dm-medium text-slate-50 tracking-tight">
                        {isSubmitting ? "Preparing..." : "Submit Attestation"}
                      </Text>
                    </Pressable>

                    <SubmitConfirmationModal
                      isVisible={showSubmitConfirmation}
                      onClose={() => setShowSubmitConfirmation(false)}
                      onProceed={handleProceedWithSubmission}
                    />

                    <IncompleteAttestationModal
                      isVisible={showIncompleteModal}
                      onClose={() => setShowIncompleteModal(false)}
                      onSubmitAnyway={() => {
                        setShowIncompleteModal(false);
                        form.handleSubmit();
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
          // Clean up timeout, remove state from storage
          if (saveTimeoutRef?.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          deleteFormState();
          setShowLeaveModal(false);
          router.back();
        }}
      />
    </SafeAreaContent>
  );
};

export default NewActionScreen;
