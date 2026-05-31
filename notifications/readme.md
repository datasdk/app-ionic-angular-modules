# Notifications

Handles Capacitor Push Notifications registration, native listener setup, token storage, and backend syncing.

Official docs: https://capacitorjs.com/docs/apis/push-notifications

## Structure

- `components/` contains the user-facing notification opt-in UI.
- `services/firebase-push.service.ts` wraps Capacitor Push Notifications.
- `notification-env.ts` exposes notification configuration from Angular ENV files.
- `firebase-keys/` contains sanitized test key files and documents where real Firebase files belong.

## Firebase Setup

1. Create or open the Firebase project for the app.
2. Add Android app `dk.kunstenat.app`.
3. Download `google-services.json`.
4. Add iOS app `dk.kunstenat.app`.
5. Download `GoogleService-Info.plist` if the iOS Firebase config is needed.
6. Configure APNs in Firebase Cloud Messaging for iOS delivery.

Do not hardcode Firebase credentials in Angular components. Keep real key files local, in CI secrets, or in native project files that are managed outside component code.

## Key Files

Local source folder:

```text
src/app/notifications/firebase-keys/
```

Native app targets:

```text
android/app/google-services.json
ios/App/App/GoogleService-Info.plist
```

Checked-in test examples:

```text
src/app/notifications/firebase-keys/google-services.test.json
src/app/notifications/firebase-keys/GoogleService-Info.test.plist
src/app/notifications/firebase-keys/firebase-service-account.test.json
```

Example `google-services.json`:

```json
{
  "project_info": {
    "project_number": "000000000000",
    "project_id": "kunsten-at-dev",
    "storage_bucket": "kunsten-at-dev.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:000000000000:android:0000000000000000000000",
        "android_client_info": {
          "package_name": "dk.kunstenat.app"
        }
      },
      "api_key": [
        {
          "current_key": "AIzaSyD-REPLACE_WITH_FIREBASE_WEB_API_KEY"
        }
      ]
    }
  ],
  "configuration_version": "1"
}
```

Example `GoogleService-Info.plist`:

```xml
<plist version="1.0">
<dict>
  <key>API_KEY</key>
  <string>AIzaSyD-REPLACE_WITH_FIREBASE_WEB_API_KEY</string>
  <key>GCM_SENDER_ID</key>
  <string>000000000000</string>
  <key>BUNDLE_ID</key>
  <string>dk.kunstenat.app</string>
  <key>PROJECT_ID</key>
  <string>kunsten-at-dev</string>
  <key>GOOGLE_APP_ID</key>
  <string>1:000000000000:ios:0000000000000000000000</string>
</dict>
</plist>
```

## ENV Configuration

Notification settings live in:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

They are exposed in this module through:

```ts
import { notificationEnv } from './notification-env';
```

Example ENV values:

```ts
notifications: {
  firebase: {
    projectId: 'kunsten-at',
    messagingSenderId: '000000000000',
    androidAppId: '1:000000000000:android:...',
    iosAppId: '1:000000000000:ios:...',
    androidPackageName: 'dk.kunstenat.app',
    iosBundleId: 'dk.kunstenat.app',
    keysDirectory: 'src/app/notifications/firebase-keys',
    androidGoogleServicesFile: 'android/app/google-services.json',
    iosGoogleServiceInfoFile: 'ios/App/App/GoogleService-Info.plist'
  },
  push: {
    defaultChannelId: 'kunsten_at_default',
    defaultChannelName: 'Kunsten At',
    defaultChannelDescription: 'Påmindelser og beskeder fra Kunsten At',
    tokenRegistrationEndpoint: 'firebase/devices',
    tokenStorageKey: 'push_token',
    subscribedStorageKey: 'subscribedToNotifications',
    logTokenInDevelopment: true
  }
}
```

## Android

Required files and settings:

- `android/app/google-services.json` must match package name `dk.kunstenat.app`.
- `android/app/src/main/AndroidManifest.xml` contains `POST_NOTIFICATIONS` for Android 13+.
- `AndroidManifest.xml` defines the default push icon and notification channel id.
- `android/app/src/main/res/drawable/ic_stat_push.xml` is the white transparent notification icon.
- `android/app/src/main/res/values/strings.xml` contains `default_notification_channel_id`.
- `android/variables.gradle` sets `firebaseMessagingVersion`.

The app creates the default channel in `FirebasePushService.register()` before calling `PushNotifications.register()`.

## iOS

Required files and settings:

- Enable Push Notifications capability in Xcode for the App target.
- `ios/App/App/App.entitlements` contains `aps-environment`.
- `ios/App/App/AppDelegate.swift` forwards registration and registration errors to Capacitor.
- `ios/App/App/GoogleService-Info.plist` is included as a resource when Firebase iOS config is used.
- APNs key/certificate must be configured in Firebase Cloud Messaging.

Use `development` entitlements for development builds and confirm production signing/capability setup before App Store/TestFlight release.

## Token Registration

`FirebasePushService.register()` performs:

1. `checkPermissions()`
2. `requestPermissions()` when status is `prompt`
3. Android notification channel creation
4. `PushNotifications.register()`

Listeners handle:

- `registration`: stores the token and posts it to `notificationEnv.push.tokenRegistrationEndpoint`.
- `registrationError`: logs clear registration errors.
- `pushNotificationReceived`: stores and logs foreground notifications.
- `pushNotificationActionPerformed`: logs the action and navigates app deep links from `link`, `data.url`, `data.deep_link`, or `data.route`.

Development builds log the push token when `logTokenInDevelopment` is `true`.

## Build After Changes

```bash
npm install @capacitor/push-notifications
npx cap sync
npx cap open android
npx cap open ios
```

## Testing

1. Replace the test Firebase files with real Firebase files.
2. Build and run on a physical Android or iOS device.
3. Tap the notification opt-in UI and allow permission.
4. Confirm a token appears in development logs.
5. Confirm the token is stored under `push_token` and sent to `firebase/devices`.
6. Send a test push from Firebase Cloud Messaging.
7. Verify foreground delivery through the `pushNotificationReceived` log.
8. Put the app in background and verify notification delivery.
9. Tap a notification with a `link`, `url`, `deep_link`, or `route` payload and verify the app opens the correct route.
10. Deny permission once and verify `registrationError`/permission errors are readable in logs.
