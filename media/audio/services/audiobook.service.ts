import { Injectable } from '@angular/core';
import { ApiService } from '@services/api.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { SoundItem } from '../interfaces/sound-item.interface';
import { SoundPlaylist } from '../interfaces/sound-playlist.interface';

export type { SoundItem } from '../interfaces/sound-item.interface';
export type { SoundPlaylist } from '../interfaces/sound-playlist.interface';

@Injectable({
  providedIn: 'root'
})
export class AudiobookService {
  constructor(private api: ApiService) {}

  async getAudioPlaylist(fullAccess: boolean): Promise<SoundPlaylist | null> {
    const slug = fullAccess ? 'lydbog' : 'lydbog-ikke-medlem';
    const response = await this.api.get<ApiResponse<SoundPlaylist>>(`sounds/playlists/${slug}`);
    return response.data ?? null;
  }

  async getSounds(playlistId: string | number | null, fullAccess: boolean): Promise<SoundItem[]> {
    if (!playlistId) {
      return [];
    }

    const response = await this.api.post<ApiResponse<SoundItem[]>>(
      'sounds/sounds/search',
      {
        scopes: [
          {
            name: 'category',
            parameters: [playlistId]
          }
        ]
      },
      {
        include: 'images,data',
        limit: fullAccess ? undefined : 1
      }
    );

    return response.data ?? [];
  }
}
