import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { IonicModule } from '@ionic/angular';
import { AlertService } from '@services/alert.service';
import { FirebasePushService } from '@/notifications/services/firebase-push.service';

@Component({
  selector: 'app-settings-notifications-page',
  standalone: true,
  templateUrl: './settings-notifications.page.html',
  styleUrls: ['../../settings-page.shared.scss', './settings-notifications.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class SettingsNotificationsPage implements OnInit {
  loading = false;
  enabled = false;
  readonly isNative = Capacitor.isNativePlatform();

  constructor(
    private push: FirebasePushService,
    private alerts: AlertService
  ) {}

  async ngOnInit(): Promise<void> {
    this.enabled = await this.push.isSubscribed();
  }

  get statusText(): string {
    return this.enabled
      ? 'Notifikationer er aktiveret'
      : 'Notifikationer er ikke aktiveret';
  }

  async activate(): Promise<void> {
    if (!this.isNative) {
      await this.alerts.alert('Notifikationer', 'Push-notifikationer kan først aktiveres i Android/iOS-buildet.');
      return;
    }

    this.loading = true;
    try {
      const result = await this.push.registerForPush();
      this.enabled = result.success ? true : await this.push.isSubscribed();

      if (!result.success) {
        await this.alerts.alert('Notifikationer', result.msg);
      }
    } finally {
      this.loading = false;
    }
  }
}
