import type { CodegenConfig } from "@graphql-codegen/cli";
import dotenv from "dotenv";
dotenv.config();

const config: CodegenConfig = {
  schema: `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`,
  documents: ["app/**/*.tsx", "api/**/*.ts"],
  ignoreNoDocuments: true,
  generates: {
    "./api/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
      },
    },
    "./schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
