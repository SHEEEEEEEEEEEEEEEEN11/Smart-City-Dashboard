import { Observable } from '@nativescript/core';
import { CONFIG } from './config';
import moment from 'moment';

class MonitoringService extends Observable {
  constructor() {
    super();
    this._data = [];
    this._isLoading = false;
  }

  async fetchLocationData() {
    this._isLoading = true;
    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      this._data = CONFIG.LOCATIONS.map(location => ({
        ...location,
        timestamp: moment().format('HH:mm:ss'),
        aqi: Math.floor(Math.random() * (500 - 50) + 50),
        trafficDensity: Math.floor(Math.random() * 100),
        temperature: Math.floor(Math.random() * (45 - 20) + 20),
        humidity: Math.floor(Math.random() * (90 - 30) + 30),
        windSpeed: Math.floor(Math.random() * 30),
        prediction: null
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this._isLoading = false;
    }
    return this._data;
  }

  getAQICategory(aqi) {
    if (aqi <= 50) return { label: 'Good', color: '#00c853' };
    if (aqi <= 100) return { label: 'Moderate', color: '#ffd600' };
    if (aqi <= 200) return { label: 'Poor', color: '#ff9100' };
    if (aqi <= 300) return { label: 'Very Poor', color: '#ff3d00' };
    return { label: 'Severe', color: '#d50000' };
  }
}

export const monitoringService = new MonitoringService();