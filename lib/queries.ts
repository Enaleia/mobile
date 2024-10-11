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

export const AllMaterialsQuery = gql`
  query {
    Materials {
      _id
      material_id
      Material
    }
  }
`;

export const AllCountriesQuery = gql`
  query {
    Country {
      id
      Country
    }
  }
`;
