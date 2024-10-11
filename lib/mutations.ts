import { gql } from "urql";

export const CreateCountryMutation = gql`
  mutation ($Country: String!) {
    create_Country_item(data: { Country: $Country }) {
      id
      Country
    }
  }
`;
