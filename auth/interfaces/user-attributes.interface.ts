import { Address } from './address.interface';

export interface UserAttributes {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  email_verified: boolean;
  username: string;
  uid: string;
  active: number;
  type: string;
  phone?: string;
  image?: string;
  online?: unknown;
  lastLogin?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  address: Address;
}
