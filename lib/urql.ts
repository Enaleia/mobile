import { Client, fetchExchange, gql } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { AllCountriesQuery } from "./queries";

export const CreateCountryMutation = gql`
  mutation ($Country: String!) {
    create_Country_item(data: { Country: $Country }) {
      id
      Country
    }
  }
`;

const urqlClient = new Client({
  url: `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`,
  exchanges: [
    cacheExchange({
      updates: {
        Mutation: {
          create_Country_item: (result, args, cache, info) => {
            //@ts-ignore
            const newCountry: { Country: string; id: number } =
              result.create_Country_item;
            cache.updateQuery({ query: AllCountriesQuery }, (data) => {
              if (data && newCountry && Array.isArray(data.Country)) {
                console.log({ firstCountry: data.Country[0], newCountry });
                const exists = data.Country.some(
                  (country: { Country: string }) =>
                    country.Country === newCountry.Country
                );
                if (!exists) {
                  return {
                    ...data,
                    Country: [...data.Country, newCountry],
                  };
                }
              }
              return data;
            });
          },
        },
      },
    }),
    fetchExchange,
  ],
});

export default urqlClient;
