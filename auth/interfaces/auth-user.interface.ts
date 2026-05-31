export interface AuthUser {
  id?: number | string;
  firstname?: string;
  lastname?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  plan_id?: number | string | null;
  memberships?: Array<{ plan_id?: number | string | null }>;
}
