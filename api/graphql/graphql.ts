/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** ISO8601 Date values */
  Date: { input: any; output: any; }
  /** A Float or a String */
  GraphQLStringOrFloat: { input: any; output: any; }
  /** Hashed string values */
  Hash: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type Actions = {
  __typename?: 'Actions';
  action_description?: Maybe<Scalars['String']['output']>;
  action_id: Scalars['ID']['output'];
  action_name?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  roles?: Maybe<Scalars['JSON']['output']>;
  roles_func?: Maybe<Count_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_role?: Maybe<Array<Maybe<Actions_Directus_Roles>>>;
  user_role_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Directus_Users>;
};


export type ActionsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActionsUser_RoleArgs = {
  filter?: InputMaybe<Actions_Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ActionsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Actions_Aggregated = {
  __typename?: 'Actions_aggregated';
  avg?: Maybe<Actions_Aggregated_Fields>;
  avgDistinct?: Maybe<Actions_Aggregated_Fields>;
  count?: Maybe<Actions_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Actions_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Actions_Aggregated_Fields>;
  min?: Maybe<Actions_Aggregated_Fields>;
  sum?: Maybe<Actions_Aggregated_Fields>;
  sumDistinct?: Maybe<Actions_Aggregated_Fields>;
};

export type Actions_Aggregated_Count = {
  __typename?: 'Actions_aggregated_count';
  action_description?: Maybe<Scalars['Int']['output']>;
  action_id?: Maybe<Scalars['Int']['output']>;
  action_name?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  roles?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_role?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Actions_Aggregated_Fields = {
  __typename?: 'Actions_aggregated_fields';
  action_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Actions_Directus_Roles = {
  __typename?: 'Actions_directus_roles';
  Actions_action_id?: Maybe<Actions>;
  directus_roles_id?: Maybe<Directus_Roles>;
  id: Scalars['ID']['output'];
};


export type Actions_Directus_RolesActions_Action_IdArgs = {
  filter?: InputMaybe<Actions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Actions_Directus_RolesDirectus_Roles_IdArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Actions_Directus_Roles_Aggregated = {
  __typename?: 'Actions_directus_roles_aggregated';
  avg?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
  avgDistinct?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
  count?: Maybe<Actions_Directus_Roles_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Actions_Directus_Roles_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
  min?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
  sum?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
  sumDistinct?: Maybe<Actions_Directus_Roles_Aggregated_Fields>;
};

export type Actions_Directus_Roles_Aggregated_Count = {
  __typename?: 'Actions_directus_roles_aggregated_count';
  Actions_action_id?: Maybe<Scalars['Int']['output']>;
  directus_roles_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Actions_Directus_Roles_Aggregated_Fields = {
  __typename?: 'Actions_directus_roles_aggregated_fields';
  Actions_action_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Actions_Directus_Roles_Filter = {
  Actions_action_id?: InputMaybe<Actions_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Actions_Directus_Roles_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Actions_Directus_Roles_Filter>>>;
  directus_roles_id?: InputMaybe<Directus_Roles_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Actions_Directus_Roles_Mutated = {
  __typename?: 'Actions_directus_roles_mutated';
  data?: Maybe<Actions_Directus_Roles>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Actions_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Actions_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Actions_Filter>>>;
  action_description?: InputMaybe<String_Filter_Operators>;
  action_id?: InputMaybe<Number_Filter_Operators>;
  action_name?: InputMaybe<String_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  roles?: InputMaybe<String_Filter_Operators>;
  roles_func?: InputMaybe<Count_Function_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_role?: InputMaybe<Actions_Directus_Roles_Filter>;
  user_role_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Actions_Mutated = {
  __typename?: 'Actions_mutated';
  data?: Maybe<Actions>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Aggregates = {
  __typename?: 'Aggregates';
  active_vessels?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  total_countries?: Maybe<Scalars['Int']['output']>;
  total_fishermen_actions?: Maybe<Scalars['Int']['output']>;
  total_materials_recycled?: Maybe<Scalars['Int']['output']>;
  total_ports?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Directus_Users>;
};


export type AggregatesUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Aggregates_Aggregated = {
  __typename?: 'Aggregates_aggregated';
  avg?: Maybe<Aggregates_Aggregated_Fields>;
  avgDistinct?: Maybe<Aggregates_Aggregated_Fields>;
  count?: Maybe<Aggregates_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Aggregates_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Aggregates_Aggregated_Fields>;
  min?: Maybe<Aggregates_Aggregated_Fields>;
  sum?: Maybe<Aggregates_Aggregated_Fields>;
  sumDistinct?: Maybe<Aggregates_Aggregated_Fields>;
};

export type Aggregates_Aggregated_Count = {
  __typename?: 'Aggregates_aggregated_count';
  active_vessels?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
  total_countries?: Maybe<Scalars['Int']['output']>;
  total_fishermen_actions?: Maybe<Scalars['Int']['output']>;
  total_materials_recycled?: Maybe<Scalars['Int']['output']>;
  total_ports?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Aggregates_Aggregated_Fields = {
  __typename?: 'Aggregates_aggregated_fields';
  active_vessels?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
  total_countries?: Maybe<Scalars['Float']['output']>;
  total_fishermen_actions?: Maybe<Scalars['Float']['output']>;
  total_materials_recycled?: Maybe<Scalars['Float']['output']>;
  total_ports?: Maybe<Scalars['Float']['output']>;
};

export type Aggregates_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Aggregates_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Aggregates_Filter>>>;
  active_vessels?: InputMaybe<Number_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<Number_Filter_Operators>;
  total_countries?: InputMaybe<Number_Filter_Operators>;
  total_fishermen_actions?: InputMaybe<Number_Filter_Operators>;
  total_materials_recycled?: InputMaybe<Number_Filter_Operators>;
  total_ports?: InputMaybe<Number_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Aggregates_Mutated = {
  __typename?: 'Aggregates_mutated';
  data?: Maybe<Aggregates>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Collectors = {
  __typename?: 'Collectors';
  collector_country?: Maybe<Scalars['String']['output']>;
  collector_id: Scalars['ID']['output'];
  /** This usually use for Vessel name, or Ad-hoc collector name */
  collector_name?: Maybe<Scalars['String']['output']>;
  /** If vessel is part of company, you can enter it here */
  company_name?: Maybe<Scalars['String']['output']>;
  contact_person?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  fishing_season?: Maybe<Scalars['JSON']['output']>;
  fishing_season_func?: Maybe<Count_Functions>;
  /** Is the collector active or not? */
  is_active?: Maybe<Scalars['Boolean']['output']>;
  place_origin_temp?: Maybe<Scalars['String']['output']>;
  place_vessel_temp?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
  vessel_type?: Maybe<Scalars['JSON']['output']>;
  vessel_type_func?: Maybe<Count_Functions>;
};


export type CollectorsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type CollectorsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Collectors_Aggregated = {
  __typename?: 'Collectors_aggregated';
  avg?: Maybe<Collectors_Aggregated_Fields>;
  avgDistinct?: Maybe<Collectors_Aggregated_Fields>;
  count?: Maybe<Collectors_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Collectors_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Collectors_Aggregated_Fields>;
  min?: Maybe<Collectors_Aggregated_Fields>;
  sum?: Maybe<Collectors_Aggregated_Fields>;
  sumDistinct?: Maybe<Collectors_Aggregated_Fields>;
};

export type Collectors_Aggregated_Count = {
  __typename?: 'Collectors_aggregated_count';
  collector_country?: Maybe<Scalars['Int']['output']>;
  collector_id?: Maybe<Scalars['Int']['output']>;
  /** This usually use for Vessel name, or Ad-hoc collector name */
  collector_name?: Maybe<Scalars['Int']['output']>;
  /** If vessel is part of company, you can enter it here */
  company_name?: Maybe<Scalars['Int']['output']>;
  contact_person?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  fishing_season?: Maybe<Scalars['Int']['output']>;
  /** Is the collector active or not? */
  is_active?: Maybe<Scalars['Int']['output']>;
  place_origin_temp?: Maybe<Scalars['Int']['output']>;
  place_vessel_temp?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
  vessel_type?: Maybe<Scalars['Int']['output']>;
};

export type Collectors_Aggregated_Fields = {
  __typename?: 'Collectors_aggregated_fields';
  collector_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Collectors_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Collectors_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Collectors_Filter>>>;
  collector_country?: InputMaybe<String_Filter_Operators>;
  collector_id?: InputMaybe<Number_Filter_Operators>;
  collector_name?: InputMaybe<String_Filter_Operators>;
  company_name?: InputMaybe<String_Filter_Operators>;
  contact_person?: InputMaybe<String_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  fishing_season?: InputMaybe<String_Filter_Operators>;
  fishing_season_func?: InputMaybe<Count_Function_Filter_Operators>;
  is_active?: InputMaybe<Boolean_Filter_Operators>;
  place_origin_temp?: InputMaybe<String_Filter_Operators>;
  place_vessel_temp?: InputMaybe<String_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
  vessel_type?: InputMaybe<String_Filter_Operators>;
  vessel_type_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Collectors_Mutated = {
  __typename?: 'Collectors_mutated';
  data?: Maybe<Collectors>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export enum EventEnum {
  Create = 'create',
  Delete = 'delete',
  Update = 'update'
}

export type Events = {
  __typename?: 'Events';
  EAS_UID?: Maybe<Scalars['String']['output']>;
  EAS_timestamp?: Maybe<Scalars['Date']['output']>;
  EAS_timestamp_func?: Maybe<Datetime_Functions>;
  action?: Maybe<Actions>;
  collector?: Maybe<Directus_Users>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  /** This should be system autogenerated */
  event_id: Scalars['ID']['output'];
  event_input_id?: Maybe<Array<Maybe<Events_Input>>>;
  event_input_id_func?: Maybe<Count_Functions>;
  /** This is WHERE the event happen. It should be feeded by the mobile app. */
  event_location?: Maybe<Scalars['String']['output']>;
  event_output_id?: Maybe<Array<Maybe<Events_Output>>>;
  event_output_id_func?: Maybe<Count_Functions>;
  /** This is to capture when the action is taken place. */
  event_timestamp?: Maybe<Scalars['Date']['output']>;
  event_timestamp_func?: Maybe<Datetime_Functions>;
  internal_tag?: Maybe<Scalars['JSON']['output']>;
  internal_tag_func?: Maybe<Count_Functions>;
  on_behalf_of?: Maybe<Directus_Users>;
  production_id?: Maybe<Array<Maybe<Production>>>;
  production_id_func?: Maybe<Count_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id?: Maybe<Sponsors>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type EventsActionArgs = {
  filter?: InputMaybe<Actions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsCollectorArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsEvent_Input_IdArgs = {
  filter?: InputMaybe<Events_Input_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsEvent_Output_IdArgs = {
  filter?: InputMaybe<Events_Output_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsOn_Behalf_OfArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsProduction_IdArgs = {
  filter?: InputMaybe<Production_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsSponsor_IdArgs = {
  filter?: InputMaybe<Sponsors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type EventsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Events_Input = {
  __typename?: 'Events_Input';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  event_id?: Maybe<Events>;
  event_input_id: Scalars['ID']['output'];
  input_Material?: Maybe<Materials>;
  input_code?: Maybe<Scalars['String']['output']>;
  input_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type Events_InputEvent_IdArgs = {
  filter?: InputMaybe<Events_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_InputInput_MaterialArgs = {
  filter?: InputMaybe<Materials_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_InputUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_InputUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Events_Input_Aggregated = {
  __typename?: 'Events_Input_aggregated';
  avg?: Maybe<Events_Input_Aggregated_Fields>;
  avgDistinct?: Maybe<Events_Input_Aggregated_Fields>;
  count?: Maybe<Events_Input_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Events_Input_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Events_Input_Aggregated_Fields>;
  min?: Maybe<Events_Input_Aggregated_Fields>;
  sum?: Maybe<Events_Input_Aggregated_Fields>;
  sumDistinct?: Maybe<Events_Input_Aggregated_Fields>;
};

export type Events_Input_Aggregated_Count = {
  __typename?: 'Events_Input_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  event_id?: Maybe<Scalars['Int']['output']>;
  event_input_id?: Maybe<Scalars['Int']['output']>;
  input_Material?: Maybe<Scalars['Int']['output']>;
  input_code?: Maybe<Scalars['Int']['output']>;
  input_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Events_Input_Aggregated_Fields = {
  __typename?: 'Events_Input_aggregated_fields';
  event_id?: Maybe<Scalars['Float']['output']>;
  event_input_id?: Maybe<Scalars['Float']['output']>;
  input_Material?: Maybe<Scalars['Float']['output']>;
  input_weight?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Events_Input_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Events_Input_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Events_Input_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  event_id?: InputMaybe<Events_Filter>;
  event_input_id?: InputMaybe<Number_Filter_Operators>;
  input_Material?: InputMaybe<Materials_Filter>;
  input_code?: InputMaybe<String_Filter_Operators>;
  input_weight?: InputMaybe<Number_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Events_Input_Mutated = {
  __typename?: 'Events_Input_mutated';
  data?: Maybe<Events_Input>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Events_Output = {
  __typename?: 'Events_Output';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  event_id?: Maybe<Events>;
  event_output_id: Scalars['ID']['output'];
  output_code?: Maybe<Scalars['String']['output']>;
  output_material?: Maybe<Materials>;
  output_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type Events_OutputEvent_IdArgs = {
  filter?: InputMaybe<Events_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_OutputOutput_MaterialArgs = {
  filter?: InputMaybe<Materials_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_OutputUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Events_OutputUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Events_Output_Aggregated = {
  __typename?: 'Events_Output_aggregated';
  avg?: Maybe<Events_Output_Aggregated_Fields>;
  avgDistinct?: Maybe<Events_Output_Aggregated_Fields>;
  count?: Maybe<Events_Output_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Events_Output_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Events_Output_Aggregated_Fields>;
  min?: Maybe<Events_Output_Aggregated_Fields>;
  sum?: Maybe<Events_Output_Aggregated_Fields>;
  sumDistinct?: Maybe<Events_Output_Aggregated_Fields>;
};

export type Events_Output_Aggregated_Count = {
  __typename?: 'Events_Output_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  event_id?: Maybe<Scalars['Int']['output']>;
  event_output_id?: Maybe<Scalars['Int']['output']>;
  output_code?: Maybe<Scalars['Int']['output']>;
  output_material?: Maybe<Scalars['Int']['output']>;
  output_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Events_Output_Aggregated_Fields = {
  __typename?: 'Events_Output_aggregated_fields';
  event_id?: Maybe<Scalars['Float']['output']>;
  event_output_id?: Maybe<Scalars['Float']['output']>;
  output_material?: Maybe<Scalars['Float']['output']>;
  output_weight?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Events_Output_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Events_Output_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Events_Output_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  event_id?: InputMaybe<Events_Filter>;
  event_output_id?: InputMaybe<Number_Filter_Operators>;
  output_code?: InputMaybe<String_Filter_Operators>;
  output_material?: InputMaybe<Materials_Filter>;
  output_weight?: InputMaybe<Number_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Events_Output_Mutated = {
  __typename?: 'Events_Output_mutated';
  data?: Maybe<Events_Output>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Events_Aggregated = {
  __typename?: 'Events_aggregated';
  avg?: Maybe<Events_Aggregated_Fields>;
  avgDistinct?: Maybe<Events_Aggregated_Fields>;
  count?: Maybe<Events_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Events_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Events_Aggregated_Fields>;
  min?: Maybe<Events_Aggregated_Fields>;
  sum?: Maybe<Events_Aggregated_Fields>;
  sumDistinct?: Maybe<Events_Aggregated_Fields>;
};

export type Events_Aggregated_Count = {
  __typename?: 'Events_aggregated_count';
  EAS_UID?: Maybe<Scalars['Int']['output']>;
  EAS_timestamp?: Maybe<Scalars['Int']['output']>;
  /** Select type of action, whether its fishing for litter...etc. */
  action?: Maybe<Scalars['Int']['output']>;
  /** This to give credit to WHO collect the waste. You can skip this if the action is for recycler. */
  collector?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  /** This should be system autogenerated */
  event_id?: Maybe<Scalars['Int']['output']>;
  /** This is capture how much weight and its code input to the event. */
  event_input_id?: Maybe<Scalars['Int']['output']>;
  /** This is WHERE the event happen. It should be feeded by the mobile app. */
  event_location?: Maybe<Scalars['Int']['output']>;
  /** This is capture how much weight and its code output to the event. */
  event_output_id?: Maybe<Scalars['Int']['output']>;
  /** This is to capture when the action is taken place. */
  event_timestamp?: Maybe<Scalars['Int']['output']>;
  internal_tag?: Maybe<Scalars['Int']['output']>;
  /** This field is reserved for Enaleia internal, when team need to enter data on behalf of port coordinator */
  on_behalf_of?: Maybe<Scalars['Int']['output']>;
  production_id?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Events_Aggregated_Fields = {
  __typename?: 'Events_aggregated_fields';
  /** Select type of action, whether its fishing for litter...etc. */
  action?: Maybe<Scalars['Float']['output']>;
  /** This should be system autogenerated */
  event_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
  sponsor_id?: Maybe<Scalars['Float']['output']>;
};

export type Events_Filter = {
  EAS_UID?: InputMaybe<String_Filter_Operators>;
  EAS_timestamp?: InputMaybe<Date_Filter_Operators>;
  EAS_timestamp_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Events_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Events_Filter>>>;
  action?: InputMaybe<Actions_Filter>;
  collector?: InputMaybe<Directus_Users_Filter>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  event_id?: InputMaybe<Number_Filter_Operators>;
  event_input_id?: InputMaybe<Events_Input_Filter>;
  event_input_id_func?: InputMaybe<Count_Function_Filter_Operators>;
  event_location?: InputMaybe<String_Filter_Operators>;
  event_output_id?: InputMaybe<Events_Output_Filter>;
  event_output_id_func?: InputMaybe<Count_Function_Filter_Operators>;
  event_timestamp?: InputMaybe<Date_Filter_Operators>;
  event_timestamp_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  internal_tag?: InputMaybe<String_Filter_Operators>;
  internal_tag_func?: InputMaybe<Count_Function_Filter_Operators>;
  on_behalf_of?: InputMaybe<Directus_Users_Filter>;
  production_id?: InputMaybe<Production_Filter>;
  production_id_func?: InputMaybe<Count_Function_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  sponsor_id?: InputMaybe<Sponsors_Filter>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Events_Mutated = {
  __typename?: 'Events_mutated';
  data?: Maybe<Events>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Materials = {
  __typename?: 'Materials';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  material_description?: Maybe<Scalars['String']['output']>;
  material_id: Scalars['ID']['output'];
  material_name?: Maybe<Scalars['String']['output']>;
  roles?: Maybe<Scalars['JSON']['output']>;
  roles_func?: Maybe<Count_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_role?: Maybe<Array<Maybe<Materials_Directus_Roles>>>;
  user_role_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Directus_Users>;
};


export type MaterialsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaterialsUser_RoleArgs = {
  filter?: InputMaybe<Materials_Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MaterialsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Materials_Aggregated = {
  __typename?: 'Materials_aggregated';
  avg?: Maybe<Materials_Aggregated_Fields>;
  avgDistinct?: Maybe<Materials_Aggregated_Fields>;
  count?: Maybe<Materials_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Materials_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Materials_Aggregated_Fields>;
  min?: Maybe<Materials_Aggregated_Fields>;
  sum?: Maybe<Materials_Aggregated_Fields>;
  sumDistinct?: Maybe<Materials_Aggregated_Fields>;
};

export type Materials_Aggregated_Count = {
  __typename?: 'Materials_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  material_description?: Maybe<Scalars['Int']['output']>;
  material_id?: Maybe<Scalars['Int']['output']>;
  material_name?: Maybe<Scalars['Int']['output']>;
  roles?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_role?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Materials_Aggregated_Fields = {
  __typename?: 'Materials_aggregated_fields';
  material_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Materials_Directus_Roles = {
  __typename?: 'Materials_directus_roles';
  Materials_material_id?: Maybe<Materials>;
  directus_roles_id?: Maybe<Directus_Roles>;
  id: Scalars['ID']['output'];
};


export type Materials_Directus_RolesMaterials_Material_IdArgs = {
  filter?: InputMaybe<Materials_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Materials_Directus_RolesDirectus_Roles_IdArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Materials_Directus_Roles_Aggregated = {
  __typename?: 'Materials_directus_roles_aggregated';
  avg?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
  avgDistinct?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
  count?: Maybe<Materials_Directus_Roles_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Materials_Directus_Roles_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
  min?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
  sum?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
  sumDistinct?: Maybe<Materials_Directus_Roles_Aggregated_Fields>;
};

export type Materials_Directus_Roles_Aggregated_Count = {
  __typename?: 'Materials_directus_roles_aggregated_count';
  Materials_material_id?: Maybe<Scalars['Int']['output']>;
  directus_roles_id?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

export type Materials_Directus_Roles_Aggregated_Fields = {
  __typename?: 'Materials_directus_roles_aggregated_fields';
  Materials_material_id?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['Float']['output']>;
};

export type Materials_Directus_Roles_Filter = {
  Materials_material_id?: InputMaybe<Materials_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Materials_Directus_Roles_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Materials_Directus_Roles_Filter>>>;
  directus_roles_id?: InputMaybe<Directus_Roles_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
};

export type Materials_Directus_Roles_Mutated = {
  __typename?: 'Materials_directus_roles_mutated';
  data?: Maybe<Materials_Directus_Roles>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Materials_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Materials_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Materials_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  material_description?: InputMaybe<String_Filter_Operators>;
  material_id?: InputMaybe<Number_Filter_Operators>;
  material_name?: InputMaybe<String_Filter_Operators>;
  roles?: InputMaybe<String_Filter_Operators>;
  roles_func?: InputMaybe<Count_Function_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_role?: InputMaybe<Materials_Directus_Roles_Filter>;
  user_role_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Materials_Mutated = {
  __typename?: 'Materials_mutated';
  data?: Maybe<Materials>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  create_Events_Input_item?: Maybe<Events_Input>;
  create_Events_Input_items: Array<Events_Input>;
  create_Events_Output_item?: Maybe<Events_Output>;
  create_Events_Output_items: Array<Events_Output>;
  create_Events_item?: Maybe<Events>;
  create_Events_items: Array<Events>;
};


export type MutationCreate_Events_Input_ItemArgs = {
  data: Create_Events_Input_Input;
};


export type MutationCreate_Events_Input_ItemsArgs = {
  data?: InputMaybe<Array<Create_Events_Input_Input>>;
  filter?: InputMaybe<Events_Input_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationCreate_Events_Output_ItemArgs = {
  data: Create_Events_Output_Input;
};


export type MutationCreate_Events_Output_ItemsArgs = {
  data?: InputMaybe<Array<Create_Events_Output_Input>>;
  filter?: InputMaybe<Events_Output_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type MutationCreate_Events_ItemArgs = {
  data: Create_Events_Input;
};


export type MutationCreate_Events_ItemsArgs = {
  data?: InputMaybe<Array<Create_Events_Input>>;
  filter?: InputMaybe<Events_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Production = {
  __typename?: 'Production';
  NFT_link?: Maybe<Scalars['String']['output']>;
  batch_identifier?: Maybe<Scalars['String']['output']>;
  batch_quantity?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  event_id?: Maybe<Events>;
  product_id?: Maybe<Products>;
  product_url?: Maybe<Scalars['String']['output']>;
  production_id: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type ProductionEvent_IdArgs = {
  filter?: InputMaybe<Events_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProductionProduct_IdArgs = {
  filter?: InputMaybe<Products_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProductionUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProductionUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Production_Aggregated = {
  __typename?: 'Production_aggregated';
  avg?: Maybe<Production_Aggregated_Fields>;
  avgDistinct?: Maybe<Production_Aggregated_Fields>;
  count?: Maybe<Production_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Production_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Production_Aggregated_Fields>;
  min?: Maybe<Production_Aggregated_Fields>;
  sum?: Maybe<Production_Aggregated_Fields>;
  sumDistinct?: Maybe<Production_Aggregated_Fields>;
};

export type Production_Aggregated_Count = {
  __typename?: 'Production_aggregated_count';
  NFT_link?: Maybe<Scalars['Int']['output']>;
  batch_identifier?: Maybe<Scalars['Int']['output']>;
  batch_quantity?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  event_id?: Maybe<Scalars['Int']['output']>;
  product_id?: Maybe<Scalars['Int']['output']>;
  product_url?: Maybe<Scalars['Int']['output']>;
  production_id?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Production_Aggregated_Fields = {
  __typename?: 'Production_aggregated_fields';
  batch_quantity?: Maybe<Scalars['Float']['output']>;
  event_id?: Maybe<Scalars['Float']['output']>;
  product_id?: Maybe<Scalars['Float']['output']>;
  production_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Production_Filter = {
  NFT_link?: InputMaybe<String_Filter_Operators>;
  _and?: InputMaybe<Array<InputMaybe<Production_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Production_Filter>>>;
  batch_identifier?: InputMaybe<String_Filter_Operators>;
  batch_quantity?: InputMaybe<Number_Filter_Operators>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  event_id?: InputMaybe<Events_Filter>;
  product_id?: InputMaybe<Products_Filter>;
  product_url?: InputMaybe<String_Filter_Operators>;
  production_id?: InputMaybe<Number_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Production_Mutated = {
  __typename?: 'Production_mutated';
  data?: Maybe<Production>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Products = {
  __typename?: 'Products';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  manufactured_by?: Maybe<Directus_Users>;
  product_id: Scalars['ID']['output'];
  product_name?: Maybe<Scalars['String']['output']>;
  product_type?: Maybe<Scalars['JSON']['output']>;
  product_type_func?: Maybe<Count_Functions>;
  section_title?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type ProductsManufactured_ByArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProductsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type ProductsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Products_Aggregated = {
  __typename?: 'Products_aggregated';
  avg?: Maybe<Products_Aggregated_Fields>;
  avgDistinct?: Maybe<Products_Aggregated_Fields>;
  count?: Maybe<Products_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Products_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Products_Aggregated_Fields>;
  min?: Maybe<Products_Aggregated_Fields>;
  sum?: Maybe<Products_Aggregated_Fields>;
  sumDistinct?: Maybe<Products_Aggregated_Fields>;
};

export type Products_Aggregated_Count = {
  __typename?: 'Products_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  manufactured_by?: Maybe<Scalars['Int']['output']>;
  product_id?: Maybe<Scalars['Int']['output']>;
  product_name?: Maybe<Scalars['Int']['output']>;
  product_type?: Maybe<Scalars['Int']['output']>;
  section_title?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Products_Aggregated_Fields = {
  __typename?: 'Products_aggregated_fields';
  product_id?: Maybe<Scalars['Float']['output']>;
  sort?: Maybe<Scalars['Float']['output']>;
};

export type Products_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Products_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Products_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  manufactured_by?: InputMaybe<Directus_Users_Filter>;
  product_id?: InputMaybe<Number_Filter_Operators>;
  product_name?: InputMaybe<String_Filter_Operators>;
  product_type?: InputMaybe<String_Filter_Operators>;
  product_type_func?: InputMaybe<Count_Function_Filter_Operators>;
  section_title?: InputMaybe<String_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Products_Mutated = {
  __typename?: 'Products_mutated';
  data?: Maybe<Products>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  Actions: Array<Actions>;
  Actions_aggregated: Array<Actions_Aggregated>;
  Actions_by_id?: Maybe<Actions>;
  Actions_by_version?: Maybe<Version_Actions>;
  Actions_directus_roles: Array<Actions_Directus_Roles>;
  Actions_directus_roles_aggregated: Array<Actions_Directus_Roles_Aggregated>;
  Actions_directus_roles_by_id?: Maybe<Actions_Directus_Roles>;
  Actions_directus_roles_by_version?: Maybe<Version_Actions_Directus_Roles>;
  Aggregates: Array<Aggregates>;
  Aggregates_aggregated: Array<Aggregates_Aggregated>;
  Aggregates_by_id?: Maybe<Aggregates>;
  Aggregates_by_version?: Maybe<Version_Aggregates>;
  Collectors: Array<Collectors>;
  Collectors_aggregated: Array<Collectors_Aggregated>;
  Collectors_by_id?: Maybe<Collectors>;
  Collectors_by_version?: Maybe<Version_Collectors>;
  Events: Array<Events>;
  Events_Input: Array<Events_Input>;
  Events_Input_aggregated: Array<Events_Input_Aggregated>;
  Events_Input_by_id?: Maybe<Events_Input>;
  Events_Input_by_version?: Maybe<Version_Events_Input>;
  Events_Output: Array<Events_Output>;
  Events_Output_aggregated: Array<Events_Output_Aggregated>;
  Events_Output_by_id?: Maybe<Events_Output>;
  Events_Output_by_version?: Maybe<Version_Events_Output>;
  Events_aggregated: Array<Events_Aggregated>;
  Events_by_id?: Maybe<Events>;
  Events_by_version?: Maybe<Version_Events>;
  Materials: Array<Materials>;
  Materials_aggregated: Array<Materials_Aggregated>;
  Materials_by_id?: Maybe<Materials>;
  Materials_by_version?: Maybe<Version_Materials>;
  Materials_directus_roles: Array<Materials_Directus_Roles>;
  Materials_directus_roles_aggregated: Array<Materials_Directus_Roles_Aggregated>;
  Materials_directus_roles_by_id?: Maybe<Materials_Directus_Roles>;
  Materials_directus_roles_by_version?: Maybe<Version_Materials_Directus_Roles>;
  Production: Array<Production>;
  Production_aggregated: Array<Production_Aggregated>;
  Production_by_id?: Maybe<Production>;
  Production_by_version?: Maybe<Version_Production>;
  Products: Array<Products>;
  Products_aggregated: Array<Products_Aggregated>;
  Products_by_id?: Maybe<Products>;
  Products_by_version?: Maybe<Version_Products>;
  Sponsors: Array<Sponsors>;
  Sponsors_aggregated: Array<Sponsors_Aggregated>;
  Sponsors_by_id?: Maybe<Sponsors>;
  Sponsors_by_version?: Maybe<Version_Sponsors>;
};


export type QueryActionsArgs = {
  filter?: InputMaybe<Actions_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryActions_AggregatedArgs = {
  filter?: InputMaybe<Actions_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryActions_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryActions_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryActions_Directus_RolesArgs = {
  filter?: InputMaybe<Actions_Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryActions_Directus_Roles_AggregatedArgs = {
  filter?: InputMaybe<Actions_Directus_Roles_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryActions_Directus_Roles_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryActions_Directus_Roles_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryAggregatesArgs = {
  filter?: InputMaybe<Aggregates_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAggregates_AggregatedArgs = {
  filter?: InputMaybe<Aggregates_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryAggregates_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryAggregates_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryCollectorsArgs = {
  filter?: InputMaybe<Collectors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCollectors_AggregatedArgs = {
  filter?: InputMaybe<Collectors_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryCollectors_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCollectors_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEventsArgs = {
  filter?: InputMaybe<Events_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_InputArgs = {
  filter?: InputMaybe<Events_Input_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_Input_AggregatedArgs = {
  filter?: InputMaybe<Events_Input_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_Input_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEvents_Input_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEvents_OutputArgs = {
  filter?: InputMaybe<Events_Output_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_Output_AggregatedArgs = {
  filter?: InputMaybe<Events_Output_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_Output_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEvents_Output_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryEvents_AggregatedArgs = {
  filter?: InputMaybe<Events_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryEvents_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryEvents_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryMaterialsArgs = {
  filter?: InputMaybe<Materials_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMaterials_AggregatedArgs = {
  filter?: InputMaybe<Materials_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMaterials_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMaterials_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryMaterials_Directus_RolesArgs = {
  filter?: InputMaybe<Materials_Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMaterials_Directus_Roles_AggregatedArgs = {
  filter?: InputMaybe<Materials_Directus_Roles_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryMaterials_Directus_Roles_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMaterials_Directus_Roles_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryProductionArgs = {
  filter?: InputMaybe<Production_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProduction_AggregatedArgs = {
  filter?: InputMaybe<Production_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProduction_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProduction_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QueryProductsArgs = {
  filter?: InputMaybe<Products_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProducts_AggregatedArgs = {
  filter?: InputMaybe<Products_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QueryProducts_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProducts_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};


export type QuerySponsorsArgs = {
  filter?: InputMaybe<Sponsors_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySponsors_AggregatedArgs = {
  filter?: InputMaybe<Sponsors_Filter>;
  groupBy?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type QuerySponsors_By_IdArgs = {
  id: Scalars['ID']['input'];
  version?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySponsors_By_VersionArgs = {
  id: Scalars['ID']['input'];
  version: Scalars['String']['input'];
};

export type Sponsors = {
  __typename?: 'Sponsors';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id: Scalars['ID']['output'];
  sponsor_name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Directus_Users>;
  user_updated?: Maybe<Directus_Users>;
};


export type SponsorsUser_CreatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type SponsorsUser_UpdatedArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Sponsors_Aggregated = {
  __typename?: 'Sponsors_aggregated';
  avg?: Maybe<Sponsors_Aggregated_Fields>;
  avgDistinct?: Maybe<Sponsors_Aggregated_Fields>;
  count?: Maybe<Sponsors_Aggregated_Count>;
  countAll?: Maybe<Scalars['Int']['output']>;
  countDistinct?: Maybe<Sponsors_Aggregated_Count>;
  group?: Maybe<Scalars['JSON']['output']>;
  max?: Maybe<Sponsors_Aggregated_Fields>;
  min?: Maybe<Sponsors_Aggregated_Fields>;
  sum?: Maybe<Sponsors_Aggregated_Fields>;
  sumDistinct?: Maybe<Sponsors_Aggregated_Fields>;
};

export type Sponsors_Aggregated_Count = {
  __typename?: 'Sponsors_aggregated_count';
  date_created?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id?: Maybe<Scalars['Int']['output']>;
  sponsor_name?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['Int']['output']>;
  user_created?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['Int']['output']>;
};

export type Sponsors_Aggregated_Fields = {
  __typename?: 'Sponsors_aggregated_fields';
  sort?: Maybe<Scalars['Float']['output']>;
  sponsor_id?: Maybe<Scalars['Float']['output']>;
};

export type Sponsors_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Sponsors_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Sponsors_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  date_updated?: InputMaybe<Date_Filter_Operators>;
  date_updated_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  sponsor_id?: InputMaybe<Number_Filter_Operators>;
  sponsor_name?: InputMaybe<String_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Sponsors_Mutated = {
  __typename?: 'Sponsors_mutated';
  data?: Maybe<Sponsors>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  Actions_directus_roles_mutated?: Maybe<Actions_Directus_Roles_Mutated>;
  Actions_mutated?: Maybe<Actions_Mutated>;
  Aggregates_mutated?: Maybe<Aggregates_Mutated>;
  Collectors_mutated?: Maybe<Collectors_Mutated>;
  Events_Input_mutated?: Maybe<Events_Input_Mutated>;
  Events_Output_mutated?: Maybe<Events_Output_Mutated>;
  Events_mutated?: Maybe<Events_Mutated>;
  Materials_directus_roles_mutated?: Maybe<Materials_Directus_Roles_Mutated>;
  Materials_mutated?: Maybe<Materials_Mutated>;
  Production_mutated?: Maybe<Production_Mutated>;
  Products_mutated?: Maybe<Products_Mutated>;
  Sponsors_mutated?: Maybe<Sponsors_Mutated>;
  directus_access_mutated?: Maybe<Directus_Access_Mutated>;
  directus_roles_mutated?: Maybe<Directus_Roles_Mutated>;
  directus_users_mutated?: Maybe<Directus_Users_Mutated>;
};


export type SubscriptionActions_Directus_Roles_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionActions_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionAggregates_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionCollectors_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEvents_Input_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEvents_Output_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionEvents_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionMaterials_Directus_Roles_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionMaterials_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionProduction_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionProducts_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionSponsors_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Access_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Roles_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};


export type SubscriptionDirectus_Users_MutatedArgs = {
  event?: InputMaybe<EventEnum>;
};

export type Boolean_Filter_Operators = {
  _eq?: InputMaybe<Scalars['Boolean']['input']>;
  _neq?: InputMaybe<Scalars['Boolean']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Count_Function_Filter_Operators = {
  count?: InputMaybe<Number_Filter_Operators>;
};

export type Count_Functions = {
  __typename?: 'count_functions';
  count?: Maybe<Scalars['Int']['output']>;
};

export type Create_Events_Input_Input = {
  date_created?: InputMaybe<Scalars['Date']['input']>;
  date_updated?: InputMaybe<Scalars['Date']['input']>;
  event_id?: InputMaybe<Create_Events_Input>;
  event_input_id?: InputMaybe<Scalars['ID']['input']>;
  input_Material?: InputMaybe<Scalars['Int']['input']>;
  input_code?: InputMaybe<Scalars['String']['input']>;
  input_weight?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  user_created?: InputMaybe<Scalars['String']['input']>;
  user_updated?: InputMaybe<Scalars['String']['input']>;
};

export type Create_Events_Output_Input = {
  date_created?: InputMaybe<Scalars['Date']['input']>;
  date_updated?: InputMaybe<Scalars['Date']['input']>;
  event_id?: InputMaybe<Create_Events_Input>;
  event_output_id?: InputMaybe<Scalars['ID']['input']>;
  output_code?: InputMaybe<Scalars['String']['input']>;
  output_material?: InputMaybe<Scalars['Int']['input']>;
  output_weight?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  user_created?: InputMaybe<Scalars['String']['input']>;
  user_updated?: InputMaybe<Scalars['String']['input']>;
};

export type Create_Events_Input = {
  EAS_UID?: InputMaybe<Scalars['String']['input']>;
  EAS_timestamp?: InputMaybe<Scalars['Date']['input']>;
  /** Select type of action, whether its fishing for litter...etc. */
  action?: InputMaybe<Scalars['Int']['input']>;
  /** This to give credit to WHO collect the waste. You can skip this if the action is for recycler. */
  collector?: InputMaybe<Scalars['String']['input']>;
  date_created?: InputMaybe<Scalars['Date']['input']>;
  date_updated?: InputMaybe<Scalars['Date']['input']>;
  /** This should be system autogenerated */
  event_id?: InputMaybe<Scalars['ID']['input']>;
  event_input_id?: InputMaybe<Array<InputMaybe<Create_Events_Input_Input>>>;
  /** This is WHERE the event happen. It should be feeded by the mobile app. */
  event_location?: InputMaybe<Scalars['String']['input']>;
  event_output_id?: InputMaybe<Array<InputMaybe<Create_Events_Output_Input>>>;
  /** This is to capture when the action is taken place. */
  event_timestamp?: InputMaybe<Scalars['Date']['input']>;
  internal_tag?: InputMaybe<Scalars['JSON']['input']>;
  /** This field is reserved for Enaleia internal, when team need to enter data on behalf of port coordinator */
  on_behalf_of?: InputMaybe<Scalars['String']['input']>;
  production_id?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Scalars['Int']['input']>;
  sponsor_id?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  user_created?: InputMaybe<Scalars['String']['input']>;
  user_updated?: InputMaybe<Scalars['String']['input']>;
};

export type Date_Filter_Operators = {
  _between?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _eq?: InputMaybe<Scalars['String']['input']>;
  _gt?: InputMaybe<Scalars['String']['input']>;
  _gte?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _lt?: InputMaybe<Scalars['String']['input']>;
  _lte?: InputMaybe<Scalars['String']['input']>;
  _nbetween?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Datetime_Function_Filter_Operators = {
  day?: InputMaybe<Number_Filter_Operators>;
  hour?: InputMaybe<Number_Filter_Operators>;
  minute?: InputMaybe<Number_Filter_Operators>;
  month?: InputMaybe<Number_Filter_Operators>;
  second?: InputMaybe<Number_Filter_Operators>;
  week?: InputMaybe<Number_Filter_Operators>;
  weekday?: InputMaybe<Number_Filter_Operators>;
  year?: InputMaybe<Number_Filter_Operators>;
};

export type Datetime_Functions = {
  __typename?: 'datetime_functions';
  day?: Maybe<Scalars['Int']['output']>;
  hour?: Maybe<Scalars['Int']['output']>;
  minute?: Maybe<Scalars['Int']['output']>;
  month?: Maybe<Scalars['Int']['output']>;
  second?: Maybe<Scalars['Int']['output']>;
  week?: Maybe<Scalars['Int']['output']>;
  weekday?: Maybe<Scalars['Int']['output']>;
  year?: Maybe<Scalars['Int']['output']>;
};

export type Directus_Access = {
  __typename?: 'directus_access';
  id: Scalars['ID']['output'];
  policy: Scalars['String']['output'];
  role?: Maybe<Directus_Roles>;
  sort?: Maybe<Scalars['Int']['output']>;
  user?: Maybe<Directus_Users>;
};


export type Directus_AccessRoleArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_AccessUserArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Access_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Access_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Access_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  policy?: InputMaybe<String_Filter_Operators>;
  role?: InputMaybe<Directus_Roles_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
  user?: InputMaybe<Directus_Users_Filter>;
};

export type Directus_Access_Mutated = {
  __typename?: 'directus_access_mutated';
  data?: Maybe<Directus_Access>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Roles = {
  __typename?: 'directus_roles';
  children?: Maybe<Array<Maybe<Directus_Roles>>>;
  children_func?: Maybe<Count_Functions>;
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parent?: Maybe<Directus_Roles>;
  policies?: Maybe<Array<Maybe<Directus_Access>>>;
  policies_func?: Maybe<Count_Functions>;
  test?: Maybe<Array<Maybe<Actions_Directus_Roles>>>;
  users?: Maybe<Array<Maybe<Directus_Users>>>;
  users_func?: Maybe<Count_Functions>;
};


export type Directus_RolesChildrenArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_RolesParentArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_RolesPoliciesArgs = {
  filter?: InputMaybe<Directus_Access_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_RolesTestArgs = {
  filter?: InputMaybe<Actions_Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_RolesUsersArgs = {
  filter?: InputMaybe<Directus_Users_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Roles_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Roles_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Roles_Filter>>>;
  children?: InputMaybe<Directus_Roles_Filter>;
  children_func?: InputMaybe<Count_Function_Filter_Operators>;
  description?: InputMaybe<String_Filter_Operators>;
  icon?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  name?: InputMaybe<String_Filter_Operators>;
  parent?: InputMaybe<Directus_Roles_Filter>;
  policies?: InputMaybe<Directus_Access_Filter>;
  policies_func?: InputMaybe<Count_Function_Filter_Operators>;
  test?: InputMaybe<Actions_Directus_Roles_Filter>;
  users?: InputMaybe<Directus_Users_Filter>;
  users_func?: InputMaybe<Count_Function_Filter_Operators>;
};

export type Directus_Roles_Mutated = {
  __typename?: 'directus_roles_mutated';
  data?: Maybe<Directus_Roles>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Directus_Users = {
  __typename?: 'directus_users';
  appearance?: Maybe<Scalars['String']['output']>;
  auth_data?: Maybe<Scalars['JSON']['output']>;
  auth_data_func?: Maybe<Count_Functions>;
  avatar?: Maybe<Scalars['String']['output']>;
  /** This can be the port name or company name */
  company_name?: Maybe<Scalars['String']['output']>;
  contact_person?: Maybe<Scalars['String']['output']>;
  coordinates?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  email_notifications?: Maybe<Scalars['Boolean']['output']>;
  external_identifier?: Maybe<Scalars['String']['output']>;
  first_name?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  language?: Maybe<Scalars['String']['output']>;
  last_access?: Maybe<Scalars['Date']['output']>;
  last_access_func?: Maybe<Datetime_Functions>;
  last_name?: Maybe<Scalars['String']['output']>;
  last_page?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  password?: Maybe<Scalars['Hash']['output']>;
  policies?: Maybe<Array<Maybe<Directus_Access>>>;
  policies_func?: Maybe<Count_Functions>;
  provider?: Maybe<Scalars['String']['output']>;
  registered_port?: Maybe<Scalars['String']['output']>;
  role?: Maybe<Directus_Roles>;
  status?: Maybe<Scalars['String']['output']>;
  tags?: Maybe<Scalars['JSON']['output']>;
  tags_func?: Maybe<Count_Functions>;
  /** this is a temp field to bring data from xsl to directus */
  temp_origin?: Maybe<Scalars['String']['output']>;
  /** This is a temp field to bring data from xsl to directus */
  temp_vessel?: Maybe<Scalars['String']['output']>;
  tfa_secret?: Maybe<Scalars['Hash']['output']>;
  theme_dark?: Maybe<Scalars['String']['output']>;
  theme_dark_overrides?: Maybe<Scalars['JSON']['output']>;
  theme_dark_overrides_func?: Maybe<Count_Functions>;
  theme_light?: Maybe<Scalars['String']['output']>;
  theme_light_overrides?: Maybe<Scalars['JSON']['output']>;
  theme_light_overrides_func?: Maybe<Count_Functions>;
  title?: Maybe<Scalars['String']['output']>;
  token?: Maybe<Scalars['Hash']['output']>;
  /** This should be manually enter, where this user's city */
  user_city?: Maybe<Scalars['String']['output']>;
  user_country?: Maybe<Scalars['String']['output']>;
  vessel_ID?: Maybe<Scalars['String']['output']>;
  vessel_identifier?: Maybe<Scalars['Int']['output']>;
  /** This is only if the user is fisherman */
  vessel_type?: Maybe<Scalars['String']['output']>;
  wallet_address?: Maybe<Scalars['String']['output']>;
};


export type Directus_UsersPoliciesArgs = {
  filter?: InputMaybe<Directus_Access_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};


export type Directus_UsersRoleArgs = {
  filter?: InputMaybe<Directus_Roles_Filter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sort?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

export type Directus_Users_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Users_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Users_Filter>>>;
  appearance?: InputMaybe<String_Filter_Operators>;
  auth_data?: InputMaybe<String_Filter_Operators>;
  auth_data_func?: InputMaybe<Count_Function_Filter_Operators>;
  avatar?: InputMaybe<String_Filter_Operators>;
  company_name?: InputMaybe<String_Filter_Operators>;
  contact_person?: InputMaybe<String_Filter_Operators>;
  coordinates?: InputMaybe<String_Filter_Operators>;
  description?: InputMaybe<String_Filter_Operators>;
  email?: InputMaybe<String_Filter_Operators>;
  email_notifications?: InputMaybe<Boolean_Filter_Operators>;
  external_identifier?: InputMaybe<String_Filter_Operators>;
  first_name?: InputMaybe<String_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  language?: InputMaybe<String_Filter_Operators>;
  last_access?: InputMaybe<Date_Filter_Operators>;
  last_access_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  last_name?: InputMaybe<String_Filter_Operators>;
  last_page?: InputMaybe<String_Filter_Operators>;
  location?: InputMaybe<String_Filter_Operators>;
  password?: InputMaybe<Hash_Filter_Operators>;
  policies?: InputMaybe<Directus_Access_Filter>;
  policies_func?: InputMaybe<Count_Function_Filter_Operators>;
  provider?: InputMaybe<String_Filter_Operators>;
  registered_port?: InputMaybe<String_Filter_Operators>;
  role?: InputMaybe<Directus_Roles_Filter>;
  status?: InputMaybe<String_Filter_Operators>;
  tags?: InputMaybe<String_Filter_Operators>;
  tags_func?: InputMaybe<Count_Function_Filter_Operators>;
  temp_origin?: InputMaybe<String_Filter_Operators>;
  temp_vessel?: InputMaybe<String_Filter_Operators>;
  tfa_secret?: InputMaybe<Hash_Filter_Operators>;
  theme_dark?: InputMaybe<String_Filter_Operators>;
  theme_dark_overrides?: InputMaybe<String_Filter_Operators>;
  theme_dark_overrides_func?: InputMaybe<Count_Function_Filter_Operators>;
  theme_light?: InputMaybe<String_Filter_Operators>;
  theme_light_overrides?: InputMaybe<String_Filter_Operators>;
  theme_light_overrides_func?: InputMaybe<Count_Function_Filter_Operators>;
  title?: InputMaybe<String_Filter_Operators>;
  token?: InputMaybe<Hash_Filter_Operators>;
  user_city?: InputMaybe<String_Filter_Operators>;
  user_country?: InputMaybe<String_Filter_Operators>;
  vessel_ID?: InputMaybe<String_Filter_Operators>;
  vessel_identifier?: InputMaybe<Number_Filter_Operators>;
  vessel_type?: InputMaybe<String_Filter_Operators>;
  wallet_address?: InputMaybe<String_Filter_Operators>;
};

export type Directus_Users_Mutated = {
  __typename?: 'directus_users_mutated';
  data?: Maybe<Directus_Users>;
  event?: Maybe<EventEnum>;
  key: Scalars['ID']['output'];
};

export type Hash_Filter_Operators = {
  _empty?: InputMaybe<Scalars['Boolean']['input']>;
  _nempty?: InputMaybe<Scalars['Boolean']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Number_Filter_Operators = {
  _between?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _eq?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _gt?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _gte?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _lt?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _lte?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _nbetween?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _neq?: InputMaybe<Scalars['GraphQLStringOrFloat']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['GraphQLStringOrFloat']['input']>>>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
};

export type String_Filter_Operators = {
  _contains?: InputMaybe<Scalars['String']['input']>;
  _empty?: InputMaybe<Scalars['Boolean']['input']>;
  _ends_with?: InputMaybe<Scalars['String']['input']>;
  _eq?: InputMaybe<Scalars['String']['input']>;
  _icontains?: InputMaybe<Scalars['String']['input']>;
  _iends_with?: InputMaybe<Scalars['String']['input']>;
  _in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _istarts_with?: InputMaybe<Scalars['String']['input']>;
  _ncontains?: InputMaybe<Scalars['String']['input']>;
  _nempty?: InputMaybe<Scalars['Boolean']['input']>;
  _nends_with?: InputMaybe<Scalars['String']['input']>;
  _neq?: InputMaybe<Scalars['String']['input']>;
  _niends_with?: InputMaybe<Scalars['String']['input']>;
  _nin?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  _nistarts_with?: InputMaybe<Scalars['String']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _nstarts_with?: InputMaybe<Scalars['String']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
  _starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type Version_Actions = {
  __typename?: 'version_Actions';
  action_description?: Maybe<Scalars['String']['output']>;
  action_id: Scalars['ID']['output'];
  action_name?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  roles?: Maybe<Scalars['JSON']['output']>;
  roles_func?: Maybe<Count_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_role?: Maybe<Scalars['JSON']['output']>;
  user_role_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Actions_Directus_Roles = {
  __typename?: 'version_Actions_directus_roles';
  Actions_action_id?: Maybe<Scalars['JSON']['output']>;
  directus_roles_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Aggregates = {
  __typename?: 'version_Aggregates';
  active_vessels?: Maybe<Scalars['Int']['output']>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  id: Scalars['ID']['output'];
  total_countries?: Maybe<Scalars['Int']['output']>;
  total_fishermen_actions?: Maybe<Scalars['Int']['output']>;
  total_materials_recycled?: Maybe<Scalars['Int']['output']>;
  total_ports?: Maybe<Scalars['Int']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Collectors = {
  __typename?: 'version_Collectors';
  collector_country?: Maybe<Scalars['String']['output']>;
  collector_id: Scalars['ID']['output'];
  /** This usually use for Vessel name, or Ad-hoc collector name */
  collector_name?: Maybe<Scalars['String']['output']>;
  /** If vessel is part of company, you can enter it here */
  company_name?: Maybe<Scalars['String']['output']>;
  contact_person?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  fishing_season?: Maybe<Scalars['JSON']['output']>;
  fishing_season_func?: Maybe<Count_Functions>;
  /** Is the collector active or not? */
  is_active?: Maybe<Scalars['Boolean']['output']>;
  place_origin_temp?: Maybe<Scalars['String']['output']>;
  place_vessel_temp?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
  vessel_type?: Maybe<Scalars['JSON']['output']>;
  vessel_type_func?: Maybe<Count_Functions>;
};

export type Version_Events = {
  __typename?: 'version_Events';
  EAS_UID?: Maybe<Scalars['String']['output']>;
  EAS_timestamp?: Maybe<Scalars['Date']['output']>;
  /** Select type of action, whether its fishing for litter...etc. */
  action?: Maybe<Scalars['Int']['output']>;
  /** This to give credit to WHO collect the waste. You can skip this if the action is for recycler. */
  collector?: Maybe<Scalars['String']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  /** This should be system autogenerated */
  event_id?: Maybe<Scalars['ID']['output']>;
  event_input_id?: Maybe<Scalars['JSON']['output']>;
  /** This is WHERE the event happen. It should be feeded by the mobile app. */
  event_location?: Maybe<Scalars['String']['output']>;
  event_output_id?: Maybe<Scalars['JSON']['output']>;
  /** This is to capture when the action is taken place. */
  event_timestamp?: Maybe<Scalars['Date']['output']>;
  internal_tag?: Maybe<Scalars['JSON']['output']>;
  /** This field is reserved for Enaleia internal, when team need to enter data on behalf of port coordinator */
  on_behalf_of?: Maybe<Scalars['String']['output']>;
  production_id?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['String']['output']>;
  user_updated?: Maybe<Scalars['String']['output']>;
};

export type Version_Events_Input = {
  __typename?: 'version_Events_Input';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  event_id?: Maybe<Scalars['JSON']['output']>;
  event_input_id?: Maybe<Scalars['ID']['output']>;
  input_Material?: Maybe<Scalars['Int']['output']>;
  input_code?: Maybe<Scalars['String']['output']>;
  input_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['String']['output']>;
  user_updated?: Maybe<Scalars['String']['output']>;
};

export type Version_Events_Output = {
  __typename?: 'version_Events_Output';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  event_id?: Maybe<Scalars['JSON']['output']>;
  event_output_id?: Maybe<Scalars['ID']['output']>;
  output_code?: Maybe<Scalars['String']['output']>;
  output_material?: Maybe<Scalars['Int']['output']>;
  output_weight?: Maybe<Scalars['Int']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['String']['output']>;
  user_updated?: Maybe<Scalars['String']['output']>;
};

export type Version_Materials = {
  __typename?: 'version_Materials';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  material_description?: Maybe<Scalars['String']['output']>;
  material_id: Scalars['ID']['output'];
  material_name?: Maybe<Scalars['String']['output']>;
  roles?: Maybe<Scalars['JSON']['output']>;
  roles_func?: Maybe<Count_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_role?: Maybe<Scalars['JSON']['output']>;
  user_role_func?: Maybe<Count_Functions>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Materials_Directus_Roles = {
  __typename?: 'version_Materials_directus_roles';
  Materials_material_id?: Maybe<Scalars['JSON']['output']>;
  directus_roles_id?: Maybe<Scalars['JSON']['output']>;
  id: Scalars['ID']['output'];
};

export type Version_Production = {
  __typename?: 'version_Production';
  NFT_link?: Maybe<Scalars['String']['output']>;
  batch_identifier?: Maybe<Scalars['String']['output']>;
  batch_quantity?: Maybe<Scalars['Int']['output']>;
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  event_id?: Maybe<Scalars['JSON']['output']>;
  product_id?: Maybe<Scalars['JSON']['output']>;
  product_url?: Maybe<Scalars['String']['output']>;
  production_id: Scalars['ID']['output'];
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Products = {
  __typename?: 'version_Products';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  manufactured_by?: Maybe<Scalars['JSON']['output']>;
  product_id: Scalars['ID']['output'];
  product_name?: Maybe<Scalars['String']['output']>;
  product_type?: Maybe<Scalars['JSON']['output']>;
  product_type_func?: Maybe<Count_Functions>;
  section_title?: Maybe<Scalars['String']['output']>;
  sort?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type Version_Sponsors = {
  __typename?: 'version_Sponsors';
  date_created?: Maybe<Scalars['Date']['output']>;
  date_created_func?: Maybe<Datetime_Functions>;
  date_updated?: Maybe<Scalars['Date']['output']>;
  date_updated_func?: Maybe<Datetime_Functions>;
  sort?: Maybe<Scalars['Int']['output']>;
  sponsor_id: Scalars['ID']['output'];
  sponsor_name?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  user_created?: Maybe<Scalars['JSON']['output']>;
  user_updated?: Maybe<Scalars['JSON']['output']>;
};

export type CreateEventsInputMutationVariables = Exact<{
  data: Create_Events_Input_Input;
}>;


export type CreateEventsInputMutation = { __typename?: 'Mutation', create_Events_Input_item?: { __typename?: 'Events_Input', event_input_id: string } | null };

export type CreateEventsMutationVariables = Exact<{
  data: Create_Events_Input;
}>;


export type CreateEventsMutation = { __typename?: 'Mutation', create_Events_item?: { __typename?: 'Events', event_id: string } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any> | undefined) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const CreateEventsInputDocument = new TypedDocumentString(`
    mutation CreateEventsInput($data: create_Events_Input_input!) {
  create_Events_Input_item(data: $data) {
    event_input_id
  }
}
    `) as unknown as TypedDocumentString<CreateEventsInputMutation, CreateEventsInputMutationVariables>;
export const CreateEventsDocument = new TypedDocumentString(`
    mutation CreateEvents($data: create_Events_input!) {
  create_Events_item(data: $data) {
    event_id
  }
}
    `) as unknown as TypedDocumentString<CreateEventsMutation, CreateEventsMutationVariables>;