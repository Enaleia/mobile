import { useMutation } from "@tanstack/react-query";
import { graphql } from "@/api/graphql";
import { type Create_Events_Input_Input } from "@/api/graphql/graphql";
import { execute } from "@/api/graphql/execute";

const CREATE_EVENTS_INPUT_MUTATION = graphql(`
  mutation CreateEventsInput($data: create_Events_Input_input!) {
    create_Events_Input_item(data: $data) {
      event_id {
        event_id
      }
    }
  }
`);

export const useCreateEventsInput = () => {
  const { mutateAsync } = useMutation({
    mutationKey: ["createEventsInput"],
    mutationFn: (data: Create_Events_Input_Input) =>
      execute(CREATE_EVENTS_INPUT_MUTATION, { data }),
  });

  return { mutateAsync };
};
