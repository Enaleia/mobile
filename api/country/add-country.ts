import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Country } from "./types";

const CREATE_COUNTRY_MUTATION = `
  mutation ($Country: String!) {
    create_Country_item(data: { Country: $Country }) {
      __typename
      id
      Country
    }
  }
`;

const addCountry = async (countryName: string): Promise<Country> => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CREATE_COUNTRY_MUTATION,
        variables: { Country: countryName },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors[0].message);
  }

  return data.create_Country_item;
};

export const useAddCountry = () => {
  const queryClient = useQueryClient();

  return useMutation<Country, Error, string>({
    mutationFn: addCountry,
    onMutate: async (newCountryName) => {
      await queryClient.cancelQueries({ queryKey: ["countries"] });
      const previousCountries = queryClient.getQueryData(["countries"]);
      queryClient.setQueryData(["countries"], (old: Country[] | undefined) =>
        old
          ? [...old, { id: "temp", Country: newCountryName }]
          : [{ id: "temp", Country: newCountryName }]
      );
      return { previousCountries };
    },
    onError: (_, __, context: unknown) => {
      const typedContext = context as {
        previousCountries: Country[] | undefined;
      };
      if (typedContext?.previousCountries) {
        queryClient.setQueryData(["countries"], typedContext.previousCountries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
};
