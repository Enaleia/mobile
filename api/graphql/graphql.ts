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
  /** GeoJSON value */
  GraphQLGeoJSON: { input: any; output: any; }
  /** A Float or a String */
  GraphQLStringOrFloat: { input: any; output: any; }
  /** Hashed string values */
  Hash: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
};

export type Actions_Directus_Roles_Filter = {
  Actions_action_id?: InputMaybe<Actions_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Actions_Directus_Roles_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Actions_Directus_Roles_Filter>>>;
  directus_roles_id?: InputMaybe<Directus_Roles_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
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

export enum EventEnum {
  Create = 'create',
  Delete = 'delete',
  Update = 'update'
}

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
  production_id?: InputMaybe<String_Filter_Operators>;
  production_id_func?: InputMaybe<Count_Function_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  sponsor_id?: InputMaybe<Sponsors_Filter>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
};

export type Materials_Directus_Roles_Filter = {
  Materials_material_id?: InputMaybe<Materials_Filter>;
  _and?: InputMaybe<Array<InputMaybe<Materials_Directus_Roles_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Materials_Directus_Roles_Filter>>>;
  directus_roles_id?: InputMaybe<Directus_Roles_Filter>;
  id?: InputMaybe<Number_Filter_Operators>;
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
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_role?: InputMaybe<Materials_Directus_Roles_Filter>;
  user_role_func?: InputMaybe<Count_Function_Filter_Operators>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
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
  production_id?: InputMaybe<Number_Filter_Operators>;
  production_url?: InputMaybe<String_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
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
  product_weight?: InputMaybe<Number_Filter_Operators>;
  section_title?: InputMaybe<String_Filter_Operators>;
  sort?: InputMaybe<Number_Filter_Operators>;
  status?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
  user_updated?: InputMaybe<Directus_Users_Filter>;
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

export type Activity_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Activity_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Activity_Filter>>>;
  date_created?: InputMaybe<Date_Filter_Operators>;
  date_created_func?: InputMaybe<Datetime_Function_Filter_Operators>;
  id?: InputMaybe<String_Filter_Operators>;
  location?: InputMaybe<Geometry_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  user_created?: InputMaybe<Directus_Users_Filter>;
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

export type Create_Activity_Input = {
  date_created?: InputMaybe<Scalars['Date']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  location?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user_created?: InputMaybe<Scalars['String']['input']>;
};

export type Create_Resource_Input = {
  id?: InputMaybe<Scalars['ID']['input']>;
  identifier?: InputMaybe<Scalars['String']['input']>;
  materials?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  weight_kg?: InputMaybe<Scalars['Float']['input']>;
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

export type Directus_Access_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Directus_Access_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Directus_Access_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  policy?: InputMaybe<String_Filter_Operators>;
  role?: InputMaybe<Directus_Roles_Filter>;
  sort?: InputMaybe<Number_Filter_Operators>;
  user?: InputMaybe<Directus_Users_Filter>;
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

export type Directus_Users_Filter = {
  Country?: InputMaybe<String_Filter_Operators>;
  Country_func?: InputMaybe<Count_Function_Filter_Operators>;
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

export type Geometry_Filter_Operators = {
  _eq?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _intersects?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _intersects_bbox?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _neq?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _nintersects?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _nintersects_bbox?: InputMaybe<Scalars['GraphQLGeoJSON']['input']>;
  _nnull?: InputMaybe<Scalars['Boolean']['input']>;
  _null?: InputMaybe<Scalars['Boolean']['input']>;
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

export type Resource_Filter = {
  _and?: InputMaybe<Array<InputMaybe<Resource_Filter>>>;
  _or?: InputMaybe<Array<InputMaybe<Resource_Filter>>>;
  id?: InputMaybe<String_Filter_Operators>;
  identifier?: InputMaybe<String_Filter_Operators>;
  materials?: InputMaybe<String_Filter_Operators>;
  materials_func?: InputMaybe<Count_Function_Filter_Operators>;
  type?: InputMaybe<String_Filter_Operators>;
  weight_kg?: InputMaybe<Number_Filter_Operators>;
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

export type CreateEventsInputMutationVariables = Exact<{
  data: Create_Events_Input_Input;
}>;


export type CreateEventsInputMutation = { __typename?: 'Mutation', create_Events_Input_item?: { __typename?: 'Events_Input', event_input_id: string } | null };

export type CreateEventsOutputMutationVariables = Exact<{
  data: Create_Events_Output_Input;
}>;


export type CreateEventsOutputMutation = { __typename?: 'Mutation', create_Events_Output_item?: { __typename?: 'Events_Output', event_output_id: string } | null };

export type CreateEventsMutationVariables = Exact<{
  data: Create_Events_Input;
}>;


export type CreateEventsMutation = { __typename?: 'Mutation', create_Events_item?: { __typename?: 'Events', event_id: string } | null };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any>) {
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
export const CreateEventsOutputDocument = new TypedDocumentString(`
    mutation CreateEventsOutput($data: create_Events_Output_input!) {
  create_Events_Output_item(data: $data) {
    event_output_id
  }
}
    `) as unknown as TypedDocumentString<CreateEventsOutputMutation, CreateEventsOutputMutationVariables>;
export const CreateEventsDocument = new TypedDocumentString(`
    mutation CreateEvents($data: create_Events_input!) {
  create_Events_item(data: $data) {
    event_id
  }
}
    `) as unknown as TypedDocumentString<CreateEventsMutation, CreateEventsMutationVariables>;