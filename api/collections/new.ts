import { CREATE_EVENTS_MUTATION } from "@/api/events/new";
import { execute } from "@/api/graphql/execute";
import { type Create_Events_Input } from "@/api/graphql/graphql";
import { CollectionFormType } from "@/config/forms/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateEventsInput } from "../events-input/new";
import { useCreateEventsOutput } from "../events-output/new";

export const useCreateCollectionEvent = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: createEventInput } = useCreateEventsInput();
  const { mutateAsync: createEventOutput } = useCreateEventsOutput();

  const updateLocalEvents = (
    newEvent: Create_Events_Input,
    isNotSynced?: boolean
  ) => {
    queryClient.setQueryData<Create_Events_Input[]>(
      ["events", newEvent.action],
      (events) => {
        const updatedEvents = events ? [...events] : [];
        return [...updatedEvents, { ...newEvent, isNotSynced }];
      }
    );
  };

  const createMainEvent = async (data: CollectionFormType) => {
    const eventData: Create_Events_Input = {
      action: data.action,
      // collector: data.collectorId,
    };
    const result = await execute(CREATE_EVENTS_MUTATION, {
      data: eventData,
    });

    if (!result?.create_Events_item?.event_id) {
      throw new Error("Failed to create main event - no ID returned");
    }

    return result.create_Events_item.event_id;
  };

  const createCollectionEventInput = async (
    data: CollectionFormType,
    eventId: string
  ) => {
    return await createEventInput({
      input_code: data.collectorId,
      event_id: {
        event_id: eventId,
      },
    });
  };

  const createCollectionEventOutput = async (
    data: CollectionFormType,
    eventId: string
  ) => {
    return await createEventOutput({
      output_material: 8, // TODO: update this to use the materials
      output_weight: data.totalWeightInKilograms,
      output_code: data.collectionBatch,
      event_id: {
        event_id: eventId,
      },
    });
  };

  return useMutation({
    mutationKey: ["events"],
    mutationFn: async (formData: CollectionFormType) => {
      // First create the main event
      let eventId;
      try {
        eventId = await createMainEvent(formData);
      } catch (error) {
        console.error("Error creating main event:", error);
        throw new Error("Failed to create main event");
      }

      // Create input and output records in parallel
      try {
        const [inputResult, outputResult] = await Promise.all([
          createCollectionEventInput(formData, eventId),
          createCollectionEventOutput(formData, eventId),
        ]);

        console.log("inputResult", inputResult);
        console.log("outputResult", outputResult);

        return {
          eventId,
          inputItem: inputResult?.create_Events_Input_item || null,
          outputItem: outputResult?.create_Events_Output_item || null,
        };
      } catch (error) {
        console.error("Error creating input/output records:", error);
        // TODO: Add cleanup logic to delete the main event
        throw error;
      }
    },
    onMutate: async (newEvent: CollectionFormType) => {
      await queryClient.cancelQueries({
        queryKey: ["events", newEvent.action, newEvent.collectorId],
      });
      const previousEvents =
        queryClient.getQueryData<Create_Events_Input[]>([
          "events",
          newEvent.action,
          newEvent.collectorId,
        ]) || [];
      updateLocalEvents(newEvent, true);
      return { previousEvents };
    },
    onSuccess: (data, newEvent) => {
      updateLocalEvents(newEvent, false);
    },
    onError: async (error, variables, context) => {
      // Existing error handling...
      if (context?.previousEvents) {
        console.warn("Error creating event, please add cleanup logic", error);
        // await cleanup(
        //   context.previousEvents[0].event_input_id,
        //   context.previousEvents[0].event_output_id
        // );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", variables.action, variables.collectorId],
      });
    },
  });
};
