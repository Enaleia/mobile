import type { TypedDocumentString } from "./graphql";

export async function execute<TResult, TVariables>(
  query: TypedDocumentString<TResult, TVariables>,
  ...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
) {
  const url = `${process.env.EXPO_PUBLIC_DEV_API_URL}/graphql`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(", "));
    }

    return result.data as TResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GraphQL query failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred");
  }
}
