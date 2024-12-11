import { deviceService } from './device-service';
import { monitoringService } from './monitoring-service';
import { predictionService } from './prediction-service';
import { historyService } from './history-service';
import { notificationService } from './notification-service';
import { recommendationService } from './recommendation-service';

export const services = {
  device: deviceService,
  monitoring: monitoringService,
  prediction: predictionService,
  history: historyService,
  notification: notificationService,
  recommendation: recommendationService
};

export function initializeServices() {
  // Initialize services in the correct order
  return Promise.all([
    deviceService,
    monitoringService,
    predictionService.initModel(),
    notificationService.init(),
    historyService.initializeHistoricalData()
  ]);
}