import { Observable } from '@nativescript/core';
import moment from 'moment';

class HistoryService extends Observable {
    constructor() {
        super();
        this._historicalData = [];
        this._weeklyData = [];
        this._monthlyData = [];
        this.initializeHistoricalData();
    }

    initializeHistoricalData() {
        // Initialize 24-hour data
        const now = moment();
        this._historicalData = Array.from({ length: 24 }, (_, i) => ({
            timestamp: moment(now).subtract(i, 'hours').format('HH:mm'),
            aqi: Math.floor(Math.random() * (400 - 50) + 50),
            trafficDensity: Math.floor(Math.random() * 100),
            temperature: Math.floor(Math.random() * (45 - 20) + 20),
            humidity: Math.floor(Math.random() * (90 - 30) + 30)
        })).reverse();

        // Initialize weekly data
        this._weeklyData = Array.from({ length: 7 }, (_, i) => ({
            timestamp: moment(now).subtract(i, 'days').format('MM/DD'),
            aqi: this.calculateDailyAverage('aqi'),
            trafficDensity: this.calculateDailyAverage('trafficDensity'),
            temperature: this.calculateDailyAverage('temperature'),
            humidity: this.calculateDailyAverage('humidity')
        })).reverse();

        // Initialize monthly data
        this._monthlyData = Array.from({ length: 30 }, (_, i) => ({
            timestamp: moment(now).subtract(i, 'days').format('MM/DD'),
            aqi: this.calculateDailyAverage('aqi'),
            trafficDensity: this.calculateDailyAverage('trafficDensity'),
            temperature: this.calculateDailyAverage('temperature'),
            humidity: this.calculateDailyAverage('humidity')
        })).reverse();
    }

    calculateDailyAverage(metric) {
        const values = this._historicalData.map(data => data[metric]);
        return Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
    }

    getHistoricalData(timeRange = '24h') {
        switch(timeRange) {
            case 'week':
                return this._weeklyData;
            case 'month':
                return this._monthlyData;
            default:
                return this._historicalData;
        }
    }

    getStatistics(metric, timeRange = '24h') {
        const data = this.getHistoricalData(timeRange).map(d => d[metric]);
        return {
            average: this.calculateAverage(data),
            max: Math.max(...data),
            min: Math.min(...data),
            trend: this.calculateTrend(data)
        };
    }

    calculateAverage(data) {
        return Math.floor(data.reduce((a, b) => a + b, 0) / data.length);
    }

    calculateTrend(data) {
        const firstHalf = data.slice(0, Math.floor(data.length / 2));
        const secondHalf = data.slice(Math.floor(data.length / 2));
        const firstAvg = this.calculateAverage(firstHalf);
        const secondAvg = this.calculateAverage(secondHalf);
        
        if (secondAvg > firstAvg * 1.1) return 'increasing';
        if (secondAvg < firstAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    addDataPoint(dataPoint) {
        const timestamp = moment().format('HH:mm');
        this._historicalData.push({ timestamp, ...dataPoint });
        
        // Keep only last 24 hours
        if (this._historicalData.length > 24) {
            this._historicalData.shift();
        }

        // Update weekly and monthly data if needed
        this.updateAggregatedData();
    }

    updateAggregatedData() {
        // Update weekly and monthly data based on new measurements
        const dailyAvg = {
            timestamp: moment().format('MM/DD'),
            aqi: this.calculateDailyAverage('aqi'),
            trafficDensity: this.calculateDailyAverage('trafficDensity'),
            temperature: this.calculateDailyAverage('temperature'),
            humidity: this.calculateDailyAverage('humidity')
        };

        // Update weekly data
        if (this._weeklyData.length >= 7) this._weeklyData.shift();
        this._weeklyData.push(dailyAvg);

        // Update monthly data
        if (this._monthlyData.length >= 30) this._monthlyData.shift();
        this._monthlyData.push(dailyAvg);
    }

    exportData() {
        return {
            hourly: this._historicalData,
            weekly: this._weeklyData,
            monthly: this._monthlyData
        };
    }
}

export const historyService = new HistoryService();