import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LoadingComponent } from '@/ui/loading/loading.component';
import { SoundPlaylist } from '../../interfaces/sound-playlist.interface';

@Component({
  selector: 'app-audio-list',
  standalone: true,
  templateUrl: './audio-list.component.html',
  styleUrls: ['./audio-list.component.scss'],
  imports: [CommonModule, IonicModule, RouterLink, LoadingComponent]
})
export class AudioListComponent implements OnChanges {
  @Input() playlist: SoundPlaylist | null = null;
  @Input() loading = true;
  @Input() error: string | null = null;
  @Input() showAccessNotice = false;
  @Input() accessNoticeText = '';
  @Input() showLoginLink = false;
  @Output() closeAccessNotice = new EventEmitter<void>();

  imageLoaded: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['playlist']) {
      return;
    }

    const nextMap: Record<string, boolean> = {};
    this.playlist?.sounds?.forEach((sound, index) => {
      nextMap[this.itemKey(index)] = false;
    });
    this.imageLoaded = nextMap;
  }

  onImageLoaded(index: number): void {
    this.imageLoaded[this.itemKey(index)] = true;
  }

  isImageLoaded(index: number): boolean {
    return !!this.imageLoaded[this.itemKey(index)];
  }

  private itemKey(index: number): string {
    return `audio-${index}`;
  }
}
