export interface NotificationEnvironment {
  firebase: {
    projectId: string;
    messagingSenderId: string;
    androidAppId: string;
    iosAppId: string;
    androidPackageName: string;
    iosBundleId: string;
    keysDirectory: string;
    androidGoogleServicesFile: string;
    iosGoogleServiceInfoFile: string;
  };
  push: {
    defaultChannelId: string;
    defaultChannelName: string;
    defaultChannelDescription: string;
    tokenRegistrationEndpoint: string;
    tokenStorageKey: string;
    subscribedStorageKey: string;
    logTokenInDevelopment: boolean;
  };
}
