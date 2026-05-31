import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import {
  ActionPerformed,
  PermissionStatus,
  PushNotificationSchema,
  PushNotifications,
  RegistrationError,
  Token
} from '@capacitor/push-notifications';
import { ApiService } from '@services/api.service';
import { NativeStorageService } from '@services/native-storage.service';
import { notificationEnv } from '../notification-env';
import { DeviceRegistrationPayload } from '../interfaces/device-registration-payload.interface';

@Injectable({
  providedIn: 'root'
})
export class FirebasePushService {
  private listenersReady = false;
  private registrationWaiter?: {
    resolve: (success: boolean) => void;
    timeout: ReturnType<typeof setTimeout>;
  };

  constructor(
    private api: ApiService,
    private storage: NativeStorageService,
    private router: Router,
    private zone: NgZone
  ) {}

  async initialize(): Promise<void> {
    if (this.listenersReady || !Capacitor.isNativePlatform()) {
      return;
    }

    this.listenersReady = true;

    await Promise.all([
      PushNotifications.addListener('registration', (token: Token) => {
        void this.handleRegistration(token).then((success) => {
          this.resolveRegistration(success);
        });
      }),
      PushNotifications.addListener('registrationError', (error: RegistrationError) => {
        this.logRegistrationError(error);
        this.resolveRegistration(false);
      }),
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        void this.handleForegroundNotification(notification);
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        this.handleNotificationAction(notification);
      })
    ]);
  }

  async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { receive: 'denied' };
    }

    return PushNotifications.checkPermissions();
  }

  async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      return { receive: 'denied' };
    }

    return PushNotifications.requestPermissions();
  }

  async register(): Promise<void> {
    await this.initialize();

    let permission = await this.checkPermissions();

    if (permission.receive === 'prompt') {
      permission = await this.requestPermissions();
    }

    if (permission.receive !== 'granted') {
      throw new Error(`Push notification permission is ${permission.receive}.`);
    }

    await this.createDefaultChannel();
    await PushNotifications.register();
  }

  async registerForPush(): Promise<{ success: boolean; msg: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, msg: 'Push-notifikationer kræver en native app-build.' };
    }

    try {
      await this.initialize();

      let permission = await this.checkPermissions();

      if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
        permission = await this.requestPermissions();
      }

      if (permission.receive !== 'granted') {
        await this.storage.setString(notificationEnv.push.subscribedStorageKey, 'false');
        return { success: false, msg: 'Tilladelse til push-notifikationer blev ikke givet.' };
      }

      const storedToken = await this.getStoredToken();

      if (storedToken && await this.isSubscribed()) {
        return { success: true, msg: 'Notifikationer er aktiveret.' };
      }

      await this.createDefaultChannel();
      const registration = this.waitForRegistrationResult();
      await PushNotifications.register();

      const success = await registration;
      return success
        ? { success: true, msg: 'Notifikationer er aktiveret.' }
        : { success: false, msg: 'Device kunne ikke registreres til push-notifikationer lige nu.' };
    } catch (error) {
      console.error('Push registration failed', error);
      return { success: false, msg: 'Tilladelse til push-notifikationer blev ikke givet.' };
    }
  }

  async unregisterForPush(): Promise<{ success: boolean; msg: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, msg: 'Push-notifikationer kan kun ændres i Android/iOS-buildet.' };
    }

    try {
      await PushNotifications.unregister();
      await this.storage.remove(notificationEnv.push.tokenStorageKey);
      await this.storage.setString(notificationEnv.push.subscribedStorageKey, 'false');
      return { success: true, msg: 'Notifikationer er slået fra.' };
    } catch (error) {
      console.error('Push unregister failed', error);
      return { success: false, msg: 'Notifikationer kunne ikke slås fra lige nu.' };
    }
  }

  async isSubscribed(): Promise<boolean> {
    return (await this.storage.getString(notificationEnv.push.subscribedStorageKey)) === 'true';
  }

  async getStoredToken(): Promise<string | null> {
    return this.storage.getString(notificationEnv.push.tokenStorageKey);
  }

  private async handleRegistration(token: Token): Promise<boolean> {
    await this.storage.setString(notificationEnv.push.tokenStorageKey, token.value);

    if (notificationEnv.push.logTokenInDevelopment) {
      console.info('Push registration token', token.value);
    }

    try {
      await this.registerDevice(token.value);
      await this.storage.setString(notificationEnv.push.subscribedStorageKey, 'true');
      return true;
    } catch (error) {
      await this.storage.setString(notificationEnv.push.subscribedStorageKey, 'false');
      console.error('Push token received, but backend registration failed', error);
      return false;
    }
  }

  private logRegistrationError(error: RegistrationError): void {
    console.error('Push registration error', error.error);
  }

  private async handleForegroundNotification(notification: PushNotificationSchema): Promise<void> {
    await this.storage.setObject('last_push_foreground', {
      notification,
      receivedAt: new Date().toISOString()
    });
    console.info('Push notification received in foreground', notification);
  }

  private handleNotificationAction(action: ActionPerformed): void {
    console.info('Push notification action performed', action);

    const route = this.routeFromNotification(action.notification);

    if (!route) {
      return;
    }

    this.zone.run(() => {
      this.router.navigateByUrl(route).catch((error) => {
        console.error('Push notification route navigation failed', error);
      });
    });
  }

  private async createDefaultChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      await PushNotifications.createChannel({
        id: notificationEnv.push.defaultChannelId,
        name: notificationEnv.push.defaultChannelName,
        description: notificationEnv.push.defaultChannelDescription,
        importance: 4,
        visibility: 1,
        lights: true,
        lightColor: '#4f73b8',
        vibration: true
      });
    } catch (error) {
      console.warn('Could not create default push notification channel', error);
    }
  }

  private async registerDevice(token: string): Promise<void> {
    const payload = await this.devicePayload(token);
    await this.api.post(notificationEnv.push.tokenRegistrationEndpoint, payload);
  }

  private waitForRegistrationResult(): Promise<boolean> {
    this.clearRegistrationWaiter();

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.registrationWaiter = undefined;
        resolve(false);
      }, 15000);

      this.registrationWaiter = { resolve, timeout };
    });
  }

  private resolveRegistration(success: boolean): void {
    if (!this.registrationWaiter) {
      return;
    }

    const waiter = this.registrationWaiter;
    this.registrationWaiter = undefined;
    clearTimeout(waiter.timeout);
    waiter.resolve(success);
  }

  private clearRegistrationWaiter(): void {
    if (!this.registrationWaiter) {
      return;
    }

    clearTimeout(this.registrationWaiter.timeout);
    this.registrationWaiter = undefined;
  }

  private async devicePayload(token: string): Promise<DeviceRegistrationPayload> {
    if (!Capacitor.isNativePlatform()) {
      return {
        token,
        device_id: 'web',
        device_type: 'web'
      };
    }

    const [info, id] = await Promise.all([
      Device.getInfo(),
      Device.getId().catch(() => ({ identifier: 'unknown' }))
    ]);

    return {
      token,
      device_id: id.identifier,
      device_type: info.platform
    };
  }

  private routeFromNotification(notification: PushNotificationSchema): string | null {
    const data = notification.data as Record<string, unknown> | undefined;
    const rawRoute = notification.link
      ?? this.asString(data?.['url'])
      ?? this.asString(data?.['deep_link'])
      ?? this.asString(data?.['route']);

    if (!rawRoute) {
      return null;
    }

    if (rawRoute.startsWith('/')) {
      return rawRoute;
    }

    try {
      const url = new URL(rawRoute);

      if (url.protocol === 'kunstenat:') {
        return `/${url.host}${url.pathname}${url.search}`;
      }

      if (url.host === 'app.kunsten-at.dk') {
        return `${url.pathname}${url.search}`;
      }
    } catch {
      return null;
    }

    return null;
  }

  private asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
  }
}
