import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { VimeoService } from '../../services/vimeo.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  imports: [CommonModule, IonicModule]
})
export class VideoPlayerComponent implements OnChanges {
  @Input({ required: true }) url = '';
  @Input() active = false;
  @Input() autoplay = false;
  @ViewChild('player') player?: ElementRef<HTMLIFrameElement>;

  safeUrl: SafeResourceUrl | null = null;
  loading = true;
  isReady = false;
  isPlaying = false;
  isMuted = false;
  private userInteracted = false;

  constructor(
    private sanitizer: DomSanitizer,
    private vimeo: VimeoService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url']) {
      this.loading = true;
      this.isReady = false;
      this.isPlaying = false;
      this.isMuted = this.autoplay && this.active;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.vimeo.buildEmbedUrl(this.url, {
        autoplay: this.autoplay && this.active,
        muted: this.autoplay && this.active
      }));
    }

    if (changes['active'] && !this.active) {
      this.stop();
    }

    if ((changes['active'] || changes['autoplay']) && this.active && this.autoplay && this.isReady) {
      this.startMutedAutoplay();
    }
  }

  onLoad(): void {
    this.isReady = true;
    if (this.active && this.autoplay) {
      this.startMutedAutoplay();
    }
    window.setTimeout(() => {
      this.loading = false;
    }, 350);
  }

  togglePlay(): void {
    if (this.loading) {
      return;
    }

    this.userInteracted = true;

    if (this.isPlaying && !this.isMuted) {
      this.pause();
      return;
    }

    if (this.isMuted) {
      this.unmute();
    }

    this.play();
  }

  play(): void {
    this.vimeo.post(this.player?.nativeElement, { method: 'play' });
    this.isPlaying = true;
  }

  pause(): void {
    this.vimeo.post(this.player?.nativeElement, { method: 'pause' });
    this.isPlaying = false;
  }

  stop(): void {
    this.vimeo.post(this.player?.nativeElement, { method: 'pause' });
    this.vimeo.post(this.player?.nativeElement, { method: 'setCurrentTime', value: 0 });
    this.isPlaying = false;
  }

  private mute(): void {
    this.vimeo.post(this.player?.nativeElement, { method: 'setVolume', value: 0 });
    this.isMuted = true;
  }

  private unmute(): void {
    this.vimeo.post(this.player?.nativeElement, { method: 'setVolume', value: 1 });
    this.isMuted = false;
  }

  private startMutedAutoplay(): void {
    if (this.userInteracted || !this.active || !this.autoplay) {
      return;
    }

    // Native WKWebView/Android WebView still follow autoplay policy; muted inline playback is allowed and audio is restored only after a tap.
    this.mute();
    this.play();
  }
}
