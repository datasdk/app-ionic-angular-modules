import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { VideoItem } from '../interfaces/video-item.interface';
import { VideoPlaylist } from '../interfaces/video-playlist.interface';

export type { VideoItem } from '../interfaces/video-item.interface';
export type { VideoPlaylist } from '../interfaces/video-playlist.interface';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  constructor(private api: ApiService) {}

  async getVideos(categoryId: string | number | null, fullAccess: boolean): Promise<VideoItem[]> {
    if (!categoryId) {
      return [];
    }

    const limit = fullAccess ? undefined : 1;
    const response = await this.api.get<ApiResponse<VideoPlaylist>>(`videos/playlists/${categoryId}`, {
      'includes[0][relation]': 'videos',
      'includes[0][limit]': limit
    });

    return response.data.videos ?? [];
  }
}
