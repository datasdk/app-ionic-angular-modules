import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';
import { ApiService } from '@services/api.service';
import { AlertService } from '@services/alert.service';

@Component({
  selector: 'app-settings-delete-account-page',
  standalone: true,
  templateUrl: './settings-delete-account.page.html',
  styleUrls: ['../../settings-page.shared.scss', './settings-delete-account.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class SettingsDeleteAccountPage {
  loading = false;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private alerts: AlertService,
    private alertController: AlertController,
    private router: Router
  ) {}

  async deleteUser(): Promise<void> {
    const user = await this.auth.getUser();
    if (!user?.id) {
      await this.alerts.alert('Slet bruger', 'Du skal være logget ind for at slette kontoen.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Slet bruger',
      message: 'Din konto slettes permanent. Eventuelle spørgsmål skal ske via hjemmesiden.',
      buttons: [
        { text: 'Annuller', role: 'cancel' },
        { text: 'Slet bruger', role: 'confirm', cssClass: 'danger-alert-button' }
      ]
    });

    await alert.present();
    const result = await alert.onDidDismiss();

    if (result.role !== 'confirm') {
      return;
    }

    this.loading = true;
    try {
      await this.api.delete(`users/${user.id}`);
      await this.auth.logout();
      await this.router.navigateByUrl('/welcome');
    } catch (error) {
      await this.alerts.alert('Slet bruger', 'Kontoen kunne ikke slettes lige nu. Prøv igen senere.');
    } finally {
      this.loading = false;
    }
  }
}
