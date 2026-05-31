import { MediaImage } from './media-image.interface';

export interface SoundItem {
  id: number | string;
  name: string;
  description?: string;
  artist?: string;
  url: string;
  image?: MediaImage;
}
