// import { graphql } from "@/api/graphql";
// import { EventFormType } from "@/app/attest/new/[type]";
// import { useMutation, useQueryClient } from "@tanstack/react-query";

// export const CREATE_EVENTS_MUTATION = graphql(`
//   mutation CreateEvents($data: create_Events_input!) {
//     create_Events_item(data: $data) {
//       event_id
//     }
//   }
// `);

// export type IEvent = EventFormType & {
//   localId: string;
//   isNotSynced: boolean;
// };

// const addEvent = async (data: IEvent): Promise<IEvent> => {
//   console.log({ data }, "add event");
//   // const response = await execute(CREATE_EVENTS_MUTATION, { data: mutationData });
//   return data; // Return the event data
// };

// export const useCreateEvent = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: addEvent,
//     // Use the context pattern for better type safety
//     onMutate: async (newEvent) => {
//       // Save previous state for rollback
//       const previousEvents = queryClient.getQueryData<IEvent[]>(["events"]);

//       // Optimistic update
//       queryClient.setQueryData<IEvent[]>(["events"], (old) => [
//         ...(old || []),
//         newEvent,
//       ]);

//       // Return context for potential rollback
//       return { previousEvents };
//     },
//     onError: (err, newEvent, context) => {
//       // Rollback on error
//       queryClient.setQueryData<IEvent[]>(["events"], context?.previousEvents);
//     },
//     onSettled: () => {
//       // Always refetch after error or success
//       queryClient.invalidateQueries({ queryKey: ["events"] });
//     },
//   });
// };
