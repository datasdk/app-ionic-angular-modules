import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@/auth/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonicModule,
    RouterModule,
    CommonModule
  ]
})
export class ForgotPasswordComponent implements OnInit {

  form = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ])
  });

  loading = false;
  success = false;

  errors: any = {
    email: null
  };

  constructor(private auth: AuthService) {}

  ngOnInit() {}

  async submit() {

    this.loading = true;
    this.errors = null;
    this.success = false;

    try {

      const { email } = this.form.getRawValue();

      await this.auth.forgotPassword(
        email!,
        window.location.origin + '/auth/forgot'
      );

      this.success = true;

    } catch (err: any) {

      this.errors = err?.error?.errors || {};

    } finally {

      this.loading = false;

    }

  }

}
