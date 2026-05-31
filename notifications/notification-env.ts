import { environment } from '@environments/environment';
import { NotificationEnvironment } from './interfaces/notification-environment.interface';

export const notificationEnv = environment.notifications satisfies NotificationEnvironment;
