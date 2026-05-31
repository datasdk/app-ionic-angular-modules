import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings-menu-page',
  standalone: true,
  templateUrl: './settings-menu.page.html',
  styleUrls: ['./settings-menu.page.scss'],
  imports: [CommonModule, IonicModule, RouterLink]
})
export class SettingsMenuPage {
  readonly items: Array<{ label: string; path: string }> = [
    { label: 'Profil', path: '/home/settings/profile' },
    { label: 'Skift password', path: '/home/settings/password' },
    { label: 'Mit medlemskab', path: '/home/settings/membership' },
    { label: 'Notifikationer', path: '/home/settings/notifications' },
    { label: 'Mit forløb', path: '/home/settings/course' },
    { label: 'Slet bruger', path: '/home/settings/delete-account' }
  ];
}
