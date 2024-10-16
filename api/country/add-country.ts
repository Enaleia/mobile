import { useQueryClient, useMutation } from "@tanstack/react-query";
import { graphql } from "@/api/graphql";
import { execute } from "../graphql/execute";

const CREATE_COUNTRY_MUTATION = graphql(`
  mutation CreateCountry($Country: String!) {
    create_Country_item(data: { Country: $Country }) {
      __typename
      id
      Country
    }
  }
`);

export const useAddCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (countryName: string) =>
      execute(CREATE_COUNTRY_MUTATION, { Country: countryName }),
    // onMutate: async (newCountryName) => {
    //   await queryClient.cancelQueries({ queryKey: ["countries"] });
    //   const previousCountries = queryClient.getQueryData(["countries"]);
    //   queryClient.setQueryData(["countries"], (old) =>
    //     old
    //       ? [...old, { id: "temp", Country: newCountryName }]
    //       : [{ id: "temp", Country: newCountryName }]
    //   );
    //   return { previousCountries };
    // },
    // onError: (_, __, context: unknown) => {
    //   const typedContext = context as {
    //     previousCountries: Country[] | undefined;
    //   };
    //   if (typedContext?.previousCountries) {
    //     queryClient.setQueryData(["countries"], typedContext.previousCountries);
    //   }
    // },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
};
