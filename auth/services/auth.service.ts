import { Injectable, signal } from '@angular/core';
import { Orion } from '@tailflow/laravel-orion/lib/orion';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from '../interfaces/auth-user.interface';
import { RegisterData } from '../interfaces/register-data.interface';

export type { AuthUser } from '../interfaces/auth-user.interface';


@Injectable({
  providedIn: 'root',
})


export class AuthService {
  private readonly planIdKey = 'plan_id';


  token = signal<string | null>(null);

  user = signal<AuthUser | null>(null);

  guestMode = signal<boolean>(localStorage.getItem('guest_mode') === '1');


  constructor(private http: HttpClient) {

    void this.init().catch((error) => {
      console.warn('[app] Auth initialization failed', error);
    });

  }


  async init(): Promise<void> {


    if (await this.isLoggedin()) {


      const token = await this.getToken();


      if (token) {

        this.setAuthToken(token);

        this.token.set(token)

        await this.refreshUser();

      }

    }

  }


  getBaseApiUrl(): string {

    return `${environment.domain.replace(/\/+$/, '')}/api`;

  }


  async login(email: string, password: string, rememberMe: boolean = false): Promise<{ token?: string; user?: AuthUser }> {


    const url = this.getBaseApiUrl() + "/auth/login"


    try {


      const response = await firstValueFrom(this.http.post<{ token?: string; user?: AuthUser }>(url, {
        email,
        password,
        rememberMe,
        include: 'memberships'
      }));
      const user = this.withPlanId(response.user ?? null);


      if (response.token) {

        await this.persistUser(user);

        await Preferences.set({ key: 'auth_token', value: response.token });
        localStorage.removeItem('guest_mode');


        this.token.set(response.token);
        this.setAuthToken(response.token);
          
        this.user.set(user);
        this.guestMode.set(false);

      }


      return { ...response, user: user ?? response.user };


    } catch (err) {

      console.error('Login failed', err);

      throw err;

    }

  }


  async register(data: RegisterData): Promise<unknown> {

    const url = this.getBaseApiUrl() + "/users";

    try {

      const response = await firstValueFrom(this.http.post(url, data));
      return response;

    } catch (err) {

      console.error('Register failed', err);
      throw err;

    }
  }


  async forgotPassword(email: string, returnUrl?: string): Promise<unknown> {

    const url = this.getBaseApiUrl() + "/auth/forgot-password";

    try {

      const body: any = { email };

      if (returnUrl) {
        body.return = returnUrl;
      }

      const response = await firstValueFrom(this.http.post(url, body));

      return response;

    } catch (err) {

      console.error('Forgot password failed', err);
      throw err;

    }

  }


  async logout(): Promise<boolean> {


    const url = this.getBaseApiUrl() + "/auth/logout"


    try {
      await firstValueFrom(this.http.post(url, { }));
    } catch (err) {
      console.warn('Remote logout failed, clearing local session', err);
    } finally {
      await Preferences.remove({ key: 'auth_user' });

      await Preferences.remove({ key: 'auth_token'});
      await Preferences.remove({ key: this.planIdKey });
      this.clearCookie(this.planIdKey);
      localStorage.removeItem('guest_mode');

      this.token.set(null);
          
      this.user.set(null);
      this.guestMode.set(false);


      return true

    }

  }



  async getToken(): Promise<string | null> {

    if(this.token()){ return this.token() }

    const { value } = await Preferences.get({ key: 'auth_token' });

    this.token.set(value)

    return value;

  }


  async getUser(): Promise<AuthUser | null> {
    

    if(this.user()){ return this.user() }

    const { value } = await Preferences.get({ key: 'auth_user' });

    if (!value) return null;

    const parsed = this.withPlanId(JSON.parse(value));

    this.user.set(parsed)
    await this.persistPlanId(parsed?.plan_id ?? null);

    return parsed;

  }


  async refreshUser(): Promise<AuthUser | null> {

    const token = await this.getToken();

    const url = this.getBaseApiUrl() + "/user/me";


    try {

      const response = await firstValueFrom(this.http.get<{ data?: AuthUser; user?: AuthUser }>(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          include: 'memberships'
        }
      }));

      const user = this.withPlanId(response.data ?? response.user ?? null);

      this.user.set(user);

      if (user) {
        await this.persistUser(user);
      } else {
        await this.persistPlanId(null);
      }

      return user;


    } catch (err) {

      console.error(err);

      return null;

    }

  }


  /**
   * Sætter Bearer token til alle fremtidige requests
   * @param token - token fra backend login
   */
  setAuthToken(token: string) {

    Orion.setToken(token);

  }


  async isLoggedin(): Promise<boolean> {

    const token = await this.getToken()

    return !!token;
  }

  continueAsGuest(): void {
    localStorage.setItem('guest_mode', '1');
    this.guestMode.set(true);
  }

  hasGuestAccess(): boolean {
    return this.guestMode();
  }

  async hasAppAccess(): Promise<boolean> {
    return (await this.isLoggedin()) || this.hasGuestAccess();
  }

  hasPlan(planId: number): boolean {
    const user = this.user();
    return Number(user?.plan_id) === planId
      || !!user?.memberships?.some((membership) => Number(membership.plan_id) === planId);

  }

  private withPlanId(user: AuthUser | null): AuthUser | null {
    if (!user) {
      return null;
    }

    const membershipPlanId = user.memberships
      ?.map((membership) => membership.plan_id)
      .find((planId) => planId !== null && planId !== undefined);

    return {
      ...user,
      plan_id: user.plan_id ?? membershipPlanId ?? null
    };
  }

  private async persistUser(user: AuthUser | null): Promise<void> {
    await Preferences.set({ key: 'auth_user', value: JSON.stringify(user) });
    await this.persistPlanId(user?.plan_id ?? null);
  }

  private async persistPlanId(planId: number | string | null | undefined): Promise<void> {
    if (planId === null || planId === undefined || planId === '') {
      await Preferences.remove({ key: this.planIdKey });
      this.clearCookie(this.planIdKey);
      return;
    }

    const value = String(planId);
    await Preferences.set({ key: this.planIdKey, value });
    this.setCookie(this.planIdKey, value);
  }

  private setCookie(key: string, value: string): void {
    document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }

  private clearCookie(key: string): void {
    document.cookie = `${key}=; Max-Age=0; Path=/; SameSite=Lax`;
  }


}
