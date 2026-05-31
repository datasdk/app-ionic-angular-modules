export interface SoundAttributes {
  type: 'sound';
  id: number;
  provider?: string;
  name: string;
  slug?: string;
  description?: string;
  url?: string;
  autostart?: boolean;
  active?: boolean;
  sorting?: number;
  created_at?: string;
  updated_at?: string;
}
