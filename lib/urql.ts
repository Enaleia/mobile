import { Client, fetchExchange } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";

const urqlClient = new Client({
  url: `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`,
  exchanges: [cacheExchange({}), fetchExchange],
});

export default urqlClient;
