import { graphql } from "@/api/graphql";
import { useQuery } from "@tanstack/react-query";
import { execute } from "../graphql/execute";

const ALL_COUNTRIES_QUERY = graphql(`
  query AllCountries {
    Country {
      id
      Country
    }
  }
`);

export const useCountries = () => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: () => execute(ALL_COUNTRIES_QUERY),
    retry: 3,
  });
};
