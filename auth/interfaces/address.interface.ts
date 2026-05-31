export interface Address {
  street: string;
  city: string;
  post_code: string | null;
  country_id: number | null;
  state: string | null;
  is_billing: number;
  is_primary: number;
  is_public: number;
  is_shipping: number;
  lat: number | null;
  lng: number | null;
}
