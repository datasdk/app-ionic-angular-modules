import { VideoItem } from './video-item.interface';

export interface VideoPlaylist {
  id?: number | string;
  name?: string;
  videos: VideoItem[];
}
