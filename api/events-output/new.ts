// import { useMutation } from "@tanstack/react-query";
// import { graphql } from "@/api/graphql";
// import { Create_Events_Output_Input } from "@/api/graphql/graphql";
// import { execute } from "@/api/graphql/execute";

// const CREATE_EVENTS_OUTPUT_MUTATION = graphql(`
//   mutation CreateEventsOutput($data: create_Events_Output_input!) {
//     create_Events_Output_item(data: $data) {
//       event_output_id
//     }
//   }
// `);

// export const useCreateEventsOutput = () => {
//   const { mutateAsync } = useMutation({
//     mutationKey: ["createEventsOutput"],
//     mutationFn: (data: Create_Events_Output_Input) =>
//       execute(CREATE_EVENTS_OUTPUT_MUTATION, { data }),
//   });

//   return { mutateAsync };
// };
