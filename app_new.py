from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import os
import logging

app = Flask(__name__, template_folder='templates')
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Update the data file path to be relative
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Merged_Air_Quality_and_Traffic_Data.csv')

def get_traffic_status(congestion):
    if congestion < 10:
        return "Low"
    elif congestion < 20:
        return "Moderate"
    else:
        return "High"

def get_air_quality_level(pm25):
    if pm25 < 12:
        return "Good"
    elif pm25 < 35.4:
        return "Moderate"
    else:
        return "Poor"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dashboard')
def get_dashboard_data():
    try:
        # Load the data from CSV
        df = pd.read_csv(DATA_FILE)
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Get last 7 days of data
        last_date = df['timestamp'].max()
        seven_days_ago = last_date - pd.Timedelta(days=7)
        df = df[df['timestamp'] >= seven_days_ago]
        
        # Format timestamp for display
        formatted_df = df.copy()
        formatted_df['timestamp'] = formatted_df['timestamp'].dt.strftime('%m/%d %I:%M %p')
        
        # Create response data
        data_points = []
        for _, row in formatted_df.iterrows():
            data_points.append({
                'timestamp': row['timestamp'],
                'indoor_pm25': float(row['pm2_5']),
                'outdoor_pm25': float(row['pm2_5']),
                'pm10': float(row['pm10']),
                'traffic_density': float(row['duration_in_traffic_min'])
            })
        
        # Calculate statistics from the latest data point
        latest_data = df.iloc[-1]
        stats = {
            'indoor_range': f"{float(latest_data['pm2_5']):.2f} µg/m³",
            'outdoor_pm25': f"{float(latest_data['pm2_5']):.2f} µg/m³",
            'traffic_congestion': {
                'level': get_traffic_status(float(latest_data['duration_in_traffic_min'])),
                'current_density': f"{float(latest_data['duration_in_traffic_min']):.1f}"
            },
            'air_quality': {
                'status': get_air_quality_level(float(latest_data['pm2_5'])),
                'pm10_level': f"{float(latest_data['pm10']):.1f} µg/m³"
            }
        }
        
        return jsonify({
            'data_points': data_points,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error in dashboard route: {str(e)}")
        return jsonify({'error': str(e)}), 500
