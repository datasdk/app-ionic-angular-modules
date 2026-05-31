import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '@/auth/services/auth.service';
import { ApiService } from '@services/api.service';
import { ToastService } from '@services/toast.service';

type PasswordForm = {
  password: FormControl<string>;
};

@Component({
  selector: 'app-settings-password-page',
  standalone: true,
  templateUrl: './settings-password.page.html',
  styleUrls: ['../../settings-page.shared.scss', './settings-password.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class SettingsPasswordPage {
  form = new FormGroup<PasswordForm>({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  loading = false;
  errors: Record<string, string> = {};

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toast: ToastService
  ) {}

  async save(): Promise<void> {
    this.errors = {};
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const user = await this.auth.getUser();
    if (!user?.id) {
      this.errors['form'] = 'Du skal være logget ind for at skifte password.';
      return;
    }

    const { password } = this.form.getRawValue();
    this.loading = true;

    try {
      await this.api.patch(`users/${user.id}`, { password: password.trim() });
      this.form.reset({ password: '' });
      await this.toast.success('Password er opdateret.');
    } catch (error: any) {
      this.errors = this.extractErrors(error);
    } finally {
      this.loading = false;
    }
  }

  fieldError(): string | null {
    const control = this.form.controls.password;

    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Password skal udfyldes.';
    }

    if (control.hasError('minlength') && (control.touched || control.dirty)) {
      return 'Passwordet skal være mindst 8 tegn.';
    }

    return this.errors['password'] ?? this.errors['form'] ?? null;
  }

  private extractErrors(error: any): Record<string, string> {
    const source = error?.error?.errors ?? {};
    const value = source['password'];
    const errors: Record<string, string> = {};

    if (Array.isArray(value)) {
      errors['password'] = String(value[0]);
    } else if (value) {
      errors['password'] = String(value);
    }

    errors['form'] = error?.error?.message ?? 'Passwordet kunne ikke opdateres.';
    return errors;
  }
}
