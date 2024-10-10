import { createDirectus, graphql } from "@directus/sdk";
const directus = createDirectus("https://enaleia-dev.directus.app/").with(
  graphql()
);

export default directus;
