import type { TypedDocumentString } from "./graphql";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function fetchGraphQL<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<TResult> {
  const url = `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`;
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/graphql-response+json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  };

  const response = await fetchGraphQL<GraphQLResponse<TResult>>(url, options);

  if (response.errors) {
    throw new Error(response.errors[0].message);
  }

  if (!response.data) {
    throw new Error("No data returned from GraphQL query");
  }

  return response.data;
}
