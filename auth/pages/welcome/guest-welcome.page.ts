import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';

@Component({
  selector: 'app-guest-welcome',
  standalone: true,
  templateUrl: './guest-welcome.page.html',
  styleUrls: ['./guest-welcome.page.scss'],
  imports: [CommonModule, IonicModule, RouterLink]
})
export class GuestWelcomePage {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  continueAsGuest(): void {
    this.auth.continueAsGuest();
    void this.router.navigateByUrl('/home/dashboard');
  }
}
