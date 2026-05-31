import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LoadingComponent } from '@/ui/loading/loading.component';
import { SoundItem } from '../../interfaces/sound-item.interface';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  templateUrl: './audio-player.component.html',
  styleUrls: ['./audio-player.component.scss'],
  imports: [CommonModule, IonicModule, LoadingComponent]
})
export class AudioPlayerComponent implements OnChanges, OnDestroy {
  @Input() sounds: SoundItem[] = [];
  @Input() initialIndex = 0;
  @Input() loading = true;
  @Input() error: string | null = null;
  @Input() autoplay = false;

  current = 0;
  playing = false;
  currentTime = 0;
  duration = 0;
  progress = 0;
  private audio?: HTMLAudioElement;
  private timer?: ReturnType<typeof setInterval>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sounds'] || changes['initialIndex']) {
      this.current = Math.max(0, Math.min(this.initialIndex, this.sounds.length - 1));
      this.changeSong(this.current, this.autoplay);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.audio?.pause();
  }

  get currentSound(): SoundItem | null {
    return this.sounds[this.current] ?? null;
  }

  toggle(): void {
    if (!this.audio) {
      this.changeSong(this.current, false);
    }

    if (!this.audio) {
      return;
    }

    if (this.playing) {
      this.audio.pause();
      this.playing = false;
      this.stopTimer();
      return;
    }

    void this.playCurrent();
  }

  next(): void {
    if (this.current < this.sounds.length - 1) {
      this.changeSong(this.current + 1, true);
    }
  }

  previous(): void {
    if (this.current > 0) {
      this.changeSong(this.current - 1, true);
    }
  }

  seek(value: unknown): void {
    if (!this.audio || !this.duration) {
      return;
    }

    const next = typeof value === 'number' || typeof value === 'string' ? Number(value) : 0;
    this.audio.currentTime = (this.duration / 100) * next;
    this.updateProgress();
  }

  format(seconds: number): string {
    const whole = Math.round(seconds || 0);
    const minutes = Math.floor(whole / 60);
    const rest = String(whole % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
  }

  private changeSong(index: number, autoplay: boolean): void {
    const sound = this.sounds[index];

    if (!sound) {
      return;
    }

    this.audio?.pause();
    this.stopTimer();
    this.current = index;
    this.audio = new Audio(sound.url);
    this.playing = false;
    this.currentTime = 0;
    this.duration = 0;
    this.progress = 0;

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio?.duration ?? 0;
    });

    this.audio.addEventListener('ended', () => {
      if (this.current < this.sounds.length - 1) {
        this.changeSong(this.current + 1, true);
      } else {
        this.playing = false;
        this.stopTimer();
      }
    });

    if (autoplay) {
      void this.playCurrent();
    }
  }

  private async playCurrent(): Promise<void> {
    if (!this.audio) {
      return;
    }

    try {
      await this.audio.play();
      this.playing = true;
      this.startTimer();
    } catch (error) {
      console.warn('Audio autoplay/play failed', error);
      this.playing = false;
      this.stopTimer();
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => this.updateProgress(), 500);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private updateProgress(): void {
    if (!this.audio) {
      return;
    }

    this.currentTime = this.audio.currentTime;
    this.duration = this.audio.duration || this.duration;
    this.progress = this.duration ? Math.round((this.currentTime / this.duration) * 100) : 0;
  }
}
