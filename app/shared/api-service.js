import { CONFIG } from './config';

class ApiService {
  async get(endpoint) {
    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 500));
      return this._getMockData(endpoint);
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  _getMockData(endpoint) {
    switch (endpoint) {
      case 'locations':
        return CONFIG.LOCATIONS.map(location => ({
          ...location,
          aqi: Math.floor(Math.random() * (500 - 50) + 50),
          trafficDensity: Math.floor(Math.random() * 100),
          temperature: Math.floor(Math.random() * (45 - 20) + 20),
          humidity: Math.floor(Math.random() * (90 - 30) + 30),
          windSpeed: Math.floor(Math.random() * 30)
        }));
      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
  }
}

export const apiService = new ApiService();