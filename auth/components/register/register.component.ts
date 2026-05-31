import { Component } from '@angular/core';
import { AuthService } from '@/auth/services/auth.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'auth-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ]
})

export class RegisterComponent {

  registerForm = new FormGroup({
    firstname: new FormControl('', { nonNullable: true }),
    lastname: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });

  loading = false;

  errors: any = {};

  redirectSuccess = '/auth/login';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async submit() {

    this.loading = true;
    this.errors = {};

    try {

      const { firstname, lastname, email, password } = this.registerForm.getRawValue();

      await this.auth.register({
        firstname,
        lastname,
        email,
        password
      });

      this.router.navigateByUrl(this.redirectSuccess);

    } catch (err: any) {

      this.errors = err?.error?.errors || {};

    } finally {
      this.loading = false;
    }
  }
}
