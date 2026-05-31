import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';
import { AudioListComponent } from '@/media/audio/components/list/audio-list.component';
import { SoundPlaylist } from '../../interfaces/sound-playlist.interface';
import { AudiobookService } from '../../services/audiobook.service';

@Component({
  selector: 'app-audio-page',
  standalone: true,
  templateUrl: './audio.page.html',
  styleUrls: ['./audio.page.scss'],
  imports: [CommonModule, IonicModule, AudioListComponent]
})
export class AudioPage implements OnInit {
  playlist: SoundPlaylist | null = null;
  loading = true;
  error: string | null = null;
  hasFullAccess = false;
  showAccessNotice = true;
  loggedIn = false;

  constructor(
    private audiobook: AudiobookService,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  get accessNoticeText(): string {
    if (!this.loggedIn) {
      return 'Du er ikke logget ind. Log ind for at se flere lydbøger og gemme dine favoritter.';
    }

    return 'Opgrader til PRO for at få adgang til alle lydbøger.';
  }

  get showLoginLink(): boolean {
    return !this.loggedIn;
  }

  closeAccessNotice(): void {
    localStorage.setItem('audiobook_pro_notice_closed', '1');
    this.showAccessNotice = false;
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      this.loggedIn = await this.auth.isLoggedin();
      if (this.loggedIn) {
        await this.auth.refreshUser();
      } else {
        await this.auth.getUser();
      }
      this.hasFullAccess = this.auth.hasPlan(1);
      this.showAccessNotice = !this.hasFullAccess
        && localStorage.getItem('audiobook_pro_notice_closed') !== '1';
      this.playlist = await this.audiobook.getAudioPlaylist(this.hasFullAccess);
    } catch (error) {
      console.error(error);
      this.error = 'Lydbøgerne kunne ikke hentes lige nu.';
    } finally {
      this.loading = false;
    }
  }
}
