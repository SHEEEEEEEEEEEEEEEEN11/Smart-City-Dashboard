import { LocalNotifications } from '@nativescript/local-notifications';
import { Observable } from '@nativescript/core';

class NotificationService extends Observable {
  constructor() {
    super();
    this.init();
  }

  async init() {
    try {
      const hasPermission = await LocalNotifications.hasPermission();
      if (!hasPermission) {
        await LocalNotifications.requestPermission();
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  }

  async sendNotification(title, body, id = Date.now()) {
    try {
      await LocalNotifications.schedule([{
        id,
        title,
        body,
        badge: 1,
        at: new Date()
      }]);
    } catch (error) {
      console.error('Notification error:', error);
    }
  }

  async sendAQIAlert(aqi, location) {
    if (aqi > 200) {
      await this.sendNotification(
        'High Air Pollution Alert',
        `AQI at ${location} is ${aqi}. Consider staying indoors.`
      );
    }
  }
}

export const notificationService = new NotificationService();