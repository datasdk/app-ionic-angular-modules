import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';

@Component({
  selector: 'app-settings-membership-page',
  standalone: true,
  templateUrl: './settings-membership.page.html',
  styleUrls: ['../../settings-page.shared.scss', './settings-membership.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class SettingsMembershipPage {
  constructor(public auth: AuthService) {}

  get isPro(): boolean {
    return this.auth.hasPlan(1);
  }
}
