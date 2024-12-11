import { Observable } from '@nativescript/core';
import { monitoringService } from './monitoring-service';

class RecommendationService extends Observable {
  getLifestyleRecommendations(aqi, trafficDensity) {
    const recommendations = [];
    const aqiCategory = monitoringService.getAQICategory(aqi);

    // Outdoor Activities
    if (aqi <= 50) {
      recommendations.push({
        type: 'outdoor',
        title: 'Perfect for Outdoor Activities!',
        description: 'Great air quality for jogging, cycling, or a picnic.',
        icon: '🏃‍♂️',
        image: '~/images/outdoor-activity.png'
      });
    } else if (aqi <= 100) {
      recommendations.push({
        type: 'moderate',
        title: 'Moderate Activity Recommended',
        description: 'Light outdoor activities are fine. Consider wearing a mask.',
        icon: '🚶‍♂️',
        image: '~/images/moderate-activity.png'
      });
    } else {
      recommendations.push({
        type: 'indoor',
        title: 'Stay Indoors',
        description: 'Air quality is poor. Indoor activities recommended.',
        icon: '🏠',
        image: '~/images/indoor-activity.png'
      });
    }

    // Traffic-based recommendations
    if (trafficDensity < 30) {
      recommendations.push({
        type: 'traffic',
        title: 'Good Time for a Drive',
        description: 'Traffic is light. Perfect for your commute.',
        icon: '🚗',
        image: '~/images/light-traffic.png'
      });
    } else if (trafficDensity < 70) {
      recommendations.push({
        type: 'traffic',
        title: 'Moderate Traffic',
        description: 'Consider alternative routes or public transport.',
        icon: '🚌',
        image: '~/images/moderate-traffic.png'
      });
    } else {
      recommendations.push({
        type: 'traffic',
        title: 'Heavy Traffic Alert',
        description: 'Work from home if possible or delay travel.',
        icon: '🏢',
        image: '~/images/heavy-traffic.png'
      });
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();