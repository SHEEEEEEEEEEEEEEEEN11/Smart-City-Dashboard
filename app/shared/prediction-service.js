import * as tf from '@tensorflow/tfjs';
import { Observable } from '@nativescript/core';

class PredictionService extends Observable {
  constructor() {
    super();
    this.model = null;
    this.initModel();
  }

  async initModel() {
    // Simple linear regression model for demonstration
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ units: 1, inputShape: [4] })
      ]
    });
    
    this.model.compile({
      optimizer: tf.train.adam(0.1),
      loss: 'meanSquaredError'
    });
  }

  async predictAQI(trafficDensity, temperature, humidity, windSpeed) {
    if (!this.model) return null;

    try {
      const input = tf.tensor2d([[trafficDensity, temperature, humidity, windSpeed]]);
      const prediction = await this.model.predict(input);
      return prediction.dataSync()[0];
    } catch (error) {
      console.error('Prediction error:', error);
      return null;
    }
  }
}

export const predictionService = new PredictionService();