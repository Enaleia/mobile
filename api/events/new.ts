import { graphql } from "@/api/graphql";
import { EventFormType } from "@/app/attest/new/[type]";
import {
  useMutation,
  useQueryClient,
  onlineManager,
  QueryClient,
} from "@tanstack/react-query";
import { execute } from "../graphql/execute";
import { Create_Events_Input } from "../graphql/graphql";
import {
  CREATE_EVENTS_INPUT_MUTATION,
  useCreateEventsInput,
} from "../events-input/new";
import { useCreateEventsOutput } from "../events-output/new";

export const CREATE_EVENTS_MUTATION = graphql(`
  mutation CreateEvents($data: create_Events_input!) {
    create_Events_item(data: $data) {
      event_id
    }
  }
`);

export type IEvent = EventFormType & {
  localId: string;
  isNotSynced: boolean;
};

const createEventWithIO = async (data: IEvent) => {
  // First create the main event
  // TODO: We need data transformations here to match API but I cant see the fields as of writing this
  const eventResponse = await execute(CREATE_EVENTS_MUTATION, {
    data: {
      action: 1, // TODO: get action from data
      // event_location: data.event_location, // TODO: get event_location from data
    },
  });

  const eventId = eventResponse.create_Events_item?.event_id;

  // Process incoming materials (inputs)
  if (data.incomingMaterials?.length) {
    for (const material of data.incomingMaterials) {
      await execute(CREATE_EVENTS_INPUT_MUTATION, {
        data: {
          ...material,
          event_id: eventId,
          date: data.date,
          // Add other necessary fields
        },
      });
    }
  }

  // Process outgoing materials (outputs)
  if (data.outgoingMaterials?.length) {
    for (const material of data.outgoingMaterials) {
      await execute(CREATE_EVENTS_OUTPUT_MUTATION, {
        data: {
          ...material,
          event_id: eventId,
          date: data.date,
          // Add other necessary fields
        },
      });
    }
  }

  return eventResponse;
};

const addEvent = async (data: IEvent): Promise<IEvent> => {
  if (!onlineManager.isOnline()) {
    return { ...data, isNotSynced: true };
  }

  try {
    await createEventWithIO(data);
    return { ...data, isNotSynced: false };
  } catch (error) {
    console.error("Failed to create event:", error);
    return { ...data, isNotSynced: true };
  }
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addEvent,
    onMutate: async (newEvent) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const previousEvents = queryClient.getQueryData<IEvent[]>(["events"]);
      queryClient.setQueryData<IEvent[]>(["events"], (old) => [
        ...(old || []),
        newEvent,
      ]);
      return { previousEvents };
    },
    onError: (err, newEvent, context) => {
      queryClient.setQueryData(["events"], context?.previousEvents);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

// Function to process queued events
export const processQueue = async () => {
  if (!onlineManager.isOnline()) return;

  const queryClient = new QueryClient();
  const events = queryClient.getQueryData<IEvent[]>(["events"]) || [];
  const queuedEvents = events.filter((event) => event.isNotSynced);

  for (const event of queuedEvents) {
    try {
      // Use the same addEvent function for consistency
      const processedEvent = await addEvent(event);

      if (!processedEvent.isNotSynced) {
        // Update the event's sync status only if successful
        queryClient.setQueryData<IEvent[]>(["events"], (old) =>
          (old || []).map((e) =>
            e.localId === event.localId ? processedEvent : e
          )
        );
      }
    } catch (error) {
      console.error("Failed to process queued event:", error);
    }
  }

  queryClient.invalidateQueries({ queryKey: ["events"] });
};
