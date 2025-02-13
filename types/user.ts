import { Company } from "./company";

interface DirectusUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  token?: string | null;
}

type EnaleiaUser = DirectusUser & {
  Company?: number | Pick<Company, "id" | "name">;
};

export { EnaleiaUser, DirectusUser };
