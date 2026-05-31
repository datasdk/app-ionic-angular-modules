import { Component } from '@angular/core';
import { AuthService } from '@/auth/services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'auth-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatCardModule,
    RouterModule
  ]
})


export class LoginComponent {


  loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    rememberMe: new FormControl(false, { nonNullable: true })
  });


  user: any = null;
  redirectSuccess: string = '/home/dashboard';
  loading = false;

  
  errors: any = {
    email: null,
    password: null
  };


  constructor(
    private auth: AuthService,
    private router: Router
  ) {}


  async submit() {

    
    this.loading = true;

    this.errors = null;


    try {


      const { email, password, rememberMe } = this.loginForm.getRawValue();

      const login = await this.auth.login(email, password, rememberMe);

      this.user = login.user;
      localStorage.setItem('show_dashboard_welcome', '1');

      this.router.navigateByUrl(this.redirectSuccess);


    } catch (err: any) {


      this.errors = err?.error?.errors || {};

      console.log('Login error:', this.errors);


    } finally {

      this.loading = false;

    }


  }


}
