import { useQueryClient, useMutation } from "@tanstack/react-query";
import { graphql } from "@/api/graphql";
import { execute } from "@/api/graphql/execute";

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

  const updateCountriesCache = (newCountryName: string) => {
    queryClient.setQueryData<{ Country: { id: string; Country: string }[] }>(
      ["countries"],
      (old) => {
        const newCountry = { id: "temp", Country: newCountryName };
        return old
          ? { Country: [...old.Country, newCountry] }
          : { Country: [newCountry] };
      }
    );
  };

  const rollbackCountriesCache = (previousCountries: unknown) => {
    queryClient.setQueryData(["countries"], previousCountries);
  };

  return useMutation({
    mutationFn: (countryName: string) =>
      execute(CREATE_COUNTRY_MUTATION, { Country: countryName }),
    onMutate: async (newCountryName) => {
      await queryClient.cancelQueries({ queryKey: ["countries"] });
      const previousCountries = queryClient.getQueryData(["countries"]);
      updateCountriesCache(newCountryName);
      return { previousCountries };
    },
    onError: (_, __, context) => {
      if (context?.previousCountries) {
        rollbackCountriesCache(context.previousCountries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
};
