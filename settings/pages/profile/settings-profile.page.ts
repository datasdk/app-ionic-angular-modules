import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService, AuthUser } from '@/auth/services/auth.service';
import { ApiService } from '@services/api.service';
import { ToastService } from '@services/toast.service';

type ProfileForm = {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
};

type UserResponse = AuthUser | { data?: AuthUser; user?: AuthUser };

@Component({
  selector: 'app-settings-profile-page',
  standalone: true,
  templateUrl: './settings-profile.page.html',
  styleUrls: ['../../settings-page.shared.scss', './settings-profile.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class SettingsProfilePage implements OnInit {
  form = new FormGroup<ProfileForm>({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] })
  });

  user: AuthUser | null = null;
  loading = false;
  errors: Record<string, string> = {};

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = await this.auth.refreshUser() ?? await this.auth.getUser();
    this.form.patchValue({
      firstName: this.user?.first_name ?? this.user?.firstname ?? '',
      lastName: this.user?.last_name ?? this.user?.lastname ?? '',
      email: this.user?.email ?? ''
    });
  }

  async save(): Promise<void> {
    this.errors = {};
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const user = this.user ?? await this.auth.getUser();
    if (!user?.id) {
      this.errors['form'] = 'Du skal være logget ind for at gemme brugeroplysninger.';
      return;
    }

    const { firstName, lastName, email } = this.form.getRawValue();
    this.loading = true;

    try {
      const response = await this.api.patch<UserResponse>(`users/${user.id}`, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim()
      });

      const updatedUser = this.extractUser(response);
      this.user = await this.auth.refreshUser() ?? updatedUser ?? user;
      await this.toast.success('Brugeroplysninger er opdateret.');
    } catch (error: any) {
      this.errors = this.extractErrors(error);
    } finally {
      this.loading = false;
    }
  }

  fieldError(field: keyof ProfileForm): string | null {
    const control = this.form.controls[field];

    if (control.hasError('required') && (control.touched || control.dirty)) {
      return 'Feltet skal udfyldes.';
    }

    if (control.hasError('email') && (control.touched || control.dirty)) {
      return 'Indtast en gyldig e-mailadresse.';
    }

    return this.errors[field] ?? null;
  }

  private extractUser(response: UserResponse | null | undefined): AuthUser | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const wrapped = response as { data?: AuthUser; user?: AuthUser };

    if (wrapped.data || wrapped.user) {
      return wrapped.data ?? wrapped.user ?? null;
    }

    return response as AuthUser;
  }

  private extractErrors(error: any): Record<string, string> {
    const source = error?.error?.errors ?? {};
    const errors: Record<string, string> = {};

    const set = (target: string, keys: string[]) => {
      const value = keys.map((key) => source[key]).find(Boolean);
      if (Array.isArray(value)) {
        errors[target] = String(value[0]);
      } else if (value) {
        errors[target] = String(value);
      }
    };

    set('firstName', ['first_name', 'firstname']);
    set('lastName', ['last_name', 'lastname']);
    set('email', ['email']);
    errors['form'] = error?.error?.message ?? 'Brugeroplysningerne kunne ikke gemmes.';

    return errors;
  }
}
