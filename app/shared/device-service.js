import { Observable } from '@nativescript/core';

class DeviceService extends Observable {
  constructor() {
    super();
    this._devices = [];
    this._isLoading = false;
  }

  async fetchDevices() {
    this._isLoading = true;
    try {
      // Simulate API call - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      this._devices = [
        { id: 1, name: 'Temperature Sensor', value: '24°C', status: 'online' },
        { id: 2, name: 'Humidity Sensor', value: '45%', status: 'online' },
        { id: 3, name: 'Light Sensor', value: '800 lux', status: 'offline' }
      ];
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      this._isLoading = false;
    }
    return this._devices;
  }

  async toggleDevice(deviceId) {
    const device = this._devices.find(d => d.id === deviceId);
    if (device) {
      device.status = device.status === 'online' ? 'offline' : 'online';
      // Implement actual device control logic here
    }
  }
}

export const deviceService = new DeviceService();