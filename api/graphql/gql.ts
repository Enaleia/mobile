/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
const documents = {
    "\n  mutation CreateEventsInput($data: create_Events_Input_input!) {\n    create_Events_Input_item(data: $data) {\n      event_input_id\n    }\n  }\n": types.CreateEventsInputDocument,
    "\n  mutation CreateEvents($data: create_Events_input!) {\n    create_Events_item(data: $data) {\n      event_id\n    }\n  }\n": types.CreateEventsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEventsInput($data: create_Events_Input_input!) {\n    create_Events_Input_item(data: $data) {\n      event_input_id\n    }\n  }\n"): typeof import('./graphql').CreateEventsInputDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateEvents($data: create_Events_input!) {\n    create_Events_item(data: $data) {\n      event_id\n    }\n  }\n"): typeof import('./graphql').CreateEventsDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
