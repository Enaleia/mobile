// import { graphql } from "@/api/graphql";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { execute } from "@/api/graphql/execute";
// import { Create_Activity_Input } from "../graphql/graphql";

// export const CREATE_ACTIVITY_MUTATION = graphql(`
//   mutation CreateActivity($data: create_activity_input!) {
//     create_activity_item(data: $data) {
//       id
//     }
//   }
// `);

// export const useCreateActivity = () => {
//   const queryClient = useQueryClient();

//   const updateLocalActivities = (
//     newActivity: Create_Activity_Input,
//     isNotSynced?: boolean
//   ) => {
//     queryClient.setQueryData<Create_Activity_Input[]>(
//       ["activities"],
//       (activities) => {
//         const updatedActivities = activities ? [...activities] : [];
//         return [...updatedActivities, { ...newActivity, isNotSynced }];
//       }
//     );
//   };

//   return useMutation({
//     mutationKey: ["activities"],
//     mutationFn: async (data: Create_Activity_Input) => {
//       return execute(CREATE_ACTIVITY_MUTATION, { data });
//     },
//     onMutate: async (newActivity: Create_Activity_Input) => {
//       await queryClient.cancelQueries({
//         queryKey: ["activities", newActivity.type],
//       });
//       const previousActivities =
//         queryClient.getQueryData<Create_Activity_Input[]>(["activities"]) || [];
//       updateLocalActivities(newActivity, true);
//       return { previousActivities };
//     },
//     onSuccess: (data, newActivity) => {
//       updateLocalActivities(newActivity, false);
//     },
//     onError: async (error, variables, context) => {
//       if (context?.previousActivities) {
//         console.warn("Error creating activity:", error);
//       }
//     },
//     onSettled: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["activities"],
//       });
//     },
//   });
// };
