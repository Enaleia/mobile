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
import {
  getActiveQueue,
  updateActiveQueue,
  getCompletedQueue,
} from "@/utils/queueStorage";
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
  AppState,
} from "react-native";
import uuid from "react-native-uuid";
import { z } from "zod";
import { LocationPermissionHandler } from "@/components/features/location/LocationPermissionHandler";
import { LocationSchema } from "@/services/locationService";
import QRTextInput from "@/components/features/scanning/QRTextInput";
import { useUserInfo } from "@/hooks/data/useUserInfo";
import SelectField from "@/components/shared/SelectField";
import { useProducts } from "@/hooks/data/useProducts";
import DecimalInput from "@/components/shared/DecimalInput";
import { processQueueItems } from "@/services/queueProcessor";
import { BackgroundTaskManager } from "@/services/backgroundTaskManager";
import { useNavigation } from "@react-navigation/native";

const ATTEST_FORM_KEY = 'attest_form_state'
// Save state to AsyncStorage
const saveFormState = async (state) => {
  try {
    await AsyncStorage.setItem(ATTEST_FORM_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving form state:', error);
  }
};

// Load state from AsyncStorage
const loadFormState = async () => {
  try {
    const savedState = await AsyncStorage.getItem(ATTEST_FORM_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error('Error loading form state:', error);
    return null;
  }
};

// Delete state from AsyncStorage
const deleteFormState = async () => {
  try {
    await AsyncStorage.removeItem(ATTEST_FORM_KEY);
  } catch (error) {
    console.error('Error deleting form state:', error);
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
  const navigation = useNavigation();

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

      console.log("Verified saved data:", {
        active: savedActiveItems,
        completed: savedCompletedItems,
      });
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
            const fieldPath = error.path.join('.') as keyof typeof value;
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
        await deleteFormState()
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


  useEffect(() => {
    // Disable swipe back gesture
    const unsubscribe = navigation.addListener('focus', () => {
      navigation.setOptions({
        gestureEnabled: false,
      });
    });

    return unsubscribe; // Clean up the listener on unmount
  }, [navigation]);

  /** for issue #32 **/
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {

    const loadState = async () => {
      const savedState = await loadFormState();
      if (savedState) {
          // Restore state on resume
        form.update({ values: savedState });
      }
    };
    loadState();
    // Save state with debouncing
    const saveState = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current); // Clear the previous timeout
      }

      // Set a new timeout to save the state after 500ms of inactivity
      saveTimeoutRef.current = setTimeout(() => {
        const formValues = form.store.state.values;
        saveFormState(formValues);
        console.log('Form state saved:', formValues);
      }, 500); // Adjust the delay as needed
    };

    // Manually track changes to the form state
    const unsubscribe = form.store.subscribe(saveState);

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Reload state when app comes back to foreground
        loadState();
      } else{
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      // Clean up timeout
      if (saveTimeoutRef?.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      unsubscribe();
      // Delete state when component unmounts (longer needed at the moment)
      deleteFormState();
      // Clean up the AppState subscription
      subscription.remove();
    };
  }, []);


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
              <Ionicons
                name="chevron-back"
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
                </View>
              )}
            </form.Field>
            {currentAction?.name !== "Manufacturing" && (
              <form.Field name="outgoingMaterials">
                {(field) => (
                  <View className="mb-8 mt-8">
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
                    <Ionicons name="gift-outline" size={24} color="#0D0D0D" />
                  </View>
                </View>

                <View className="space-y-2">
                  <form.Field name="manufacturing.product">
                    {(field) => {
                      const ProductField = () => (
                        <SelectField
                          value={field.state.value}
                          onChange={(value) => field.handleChange(value)}
                          options={productsData?.map((product) => ({
                            label: `${product.product_name || "Unknown Product"}`,
                            value: product.product_id,
                          })) || []}
                          placeholder="Product"
                          isLoading={productsLoading}
                          error={productsError?.toString()}
                          disabled={productsLoading || !!productsError}
                        />
                      );
                      return <ProductField />;
                    }}
                  </form.Field>

                  <View className="flex-row gap-2">
                  <View className="flex-1 ">
                       <form.Field name="manufacturing.quantity">
                         {(field) => {
                           const QuantityField = () => (
                             <DecimalInput
                               field={field}
                               label="Batch Quantity"
                               placeholder="0"
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
                               placeholder="0"
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
                    <View className="mb-2">
                      <ErrorMessage message={submitError} />
                    </View>
                  )}

                  <Pressable
                    onPress={handleSubmitClick}
                    className={`w-full flex-row items-center justify-center p-3 rounded-full ${
                      !canSubmit || isSubmitting
                        ? "bg-primary-dark-blue"
                        : "bg-blue-ocean"
                    }`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" className="mr-2" />
                    ) : null}
                    <Text className="text-base font-dm-medium text-slate-50 tracking-tight">
                      {isSubmitting ? "Preparing..." : "Submit Attestation"}
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

        {/* Fixed Submit Button */}

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
