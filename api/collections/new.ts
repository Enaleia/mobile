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

  const createCollectionEventInput = async (data: CollectionFormType) => {
    return await createEventInput({
      input_code: data.collectorId,
    });
  };

  const createCollectionEventOutput = async (data: CollectionFormType) => {
    return await createEventOutput({
      output_material: 23, // TODO: update this to use the materials
      output_weight: Number(data.totalWeightInKilograms),
    });
  };

  const cleanup = async (inputId?: string, outputId?: string) => {
    // Add logic to delete created records in case of failure
    // This would require additional delete mutations
  };

  return useMutation({
    mutationKey: ["events"],
    mutationFn: async (formData: CollectionFormType) => {
      // First create the input record
      const inputResult = await createCollectionEventInput(formData);

      // Then create the output record
      const outputResult = await createCollectionEventOutput(formData);

      // Finally create the event with the input and output IDs
      return execute(CREATE_EVENTS_MUTATION, {
        data: {
          ...formData, // TODO: Pick the form data that we need
          event_input_id: [
            {
              event_input_id:
                inputResult.create_Events_Input_item?.event_input_id,
            },
          ],
          event_output_id: [
            {
              event_output_id:
                outputResult.create_Events_Output_item?.event_output_id,
            },
          ],
        },
      });
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
