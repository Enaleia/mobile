import { useQuery } from "@tanstack/react-query";
import { Country } from "./types";

const ALL_COUNTRIES_QUERY = `
  query {
    Country {
      __typename
      id
      Country
    }
  }
`;

const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: ALL_COUNTRIES_QUERY,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch countries");
  }

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors[0].message);
  }

  return data.Country;
};

export const useCountries = () => {
  return useQuery<Country[], Error>({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
};
