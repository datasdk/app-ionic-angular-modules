import { SoundItem } from './sound-item.interface';

export interface SoundPlaylist {
  id: number | string;
  name: string;
  sounds: SoundItem[];
}
