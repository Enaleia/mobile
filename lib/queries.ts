import { gql } from "urql";

export const TaskActionQuery = gql`
  query {
    task_action {
      id
      Task_name
      Task_type
      task_role
    }
  }
`;
