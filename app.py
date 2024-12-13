from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import logging
import os
import traceback

app = Flask(__name__, 
    static_folder='frontend/build/static',
    static_url_path='/static')

# Configure CORS to allow requests from PythonAnywhere domain
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://*.pythonanywhere.com"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Define data file path
DATA_FILE = os.path.join(os.path.dirname(__file__), 'Merged_Air_Quality_and_Traffic_Data.csv')

# Global variables for data caching
data_cache = None
last_cache_update = None

def load_data():
    global data_cache, last_cache_update
    current_time = datetime.now()
    
    # Only reload data if cache is empty or older than 5 minutes
    if data_cache is None or last_cache_update is None or (current_time - last_cache_update).seconds > 300:
        try:
            logger.debug(f"Attempting to load data from: {DATA_FILE}")
            logger.debug(f"Current directory: {os.getcwd()}")
            logger.debug(f"Directory contents: {os.listdir(os.path.dirname(__file__))}")
            
            if not os.path.exists(DATA_FILE):
                logger.error(f"CSV file not found at {DATA_FILE}")
                raise FileNotFoundError(f"CSV file not found at {DATA_FILE}")
            
            # Read all necessary columns
            df = pd.read_csv(DATA_FILE, usecols=['timestamp', 'pm2_5', 'pm10', 'no2', 'o3', 'aqi', 'distance_km', 'duration_in_traffic_min'])
            logger.debug(f"Successfully loaded data. Shape: {df.shape}")
            
            # Convert timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')
            
            # Get last 7 days of data
            last_date = df['timestamp'].max()
            seven_days_ago = last_date - pd.Timedelta(days=7)
            df = df[df['timestamp'] >= seven_days_ago]
            
            data_cache = df
            last_cache_update = current_time
            logger.debug(f"Data cache updated. Final shape: {df.shape}")
            
            return df
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    
    return data_cache

@app.route('/api/dashboard')
def get_dashboard_data():
    try:
        logger.debug("Dashboard API called")
        df = load_data()
        if df is None or df.empty:
            logger.error("No data available")
            return jsonify({"error": "No data available"}), 500
            
        # Process data for the last 7 days
        result = {
            "pm2_5": df['pm2_5'].tolist(),
            "pm10": df['pm10'].tolist(),
            "traffic_duration": df['duration_in_traffic_min'].tolist(),
            "timestamps": df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist()
        }
        logger.debug("Successfully prepared dashboard data")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in dashboard API: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/api/smart-city-data')
def smart_city_data():
    logger.info("API call: /api/smart-city-data")
    df = load_data()
    if df is None:
        logger.error("Failed to load data")
        return jsonify({"error": "Failed to load data"}), 500
    
    regions_data = []
    
    for region in ["Anand Vihar", "ITO", "Dwarka", "Rohini", "Punjabi Bagh",
                    "RK Puram", "Mandir Marg", "Shadipur", "Siri Fort", "Ashok Vihar"]:
        aqi = df['aqi'].iloc[0]
        traffic_density = df['duration_in_traffic_min'].iloc[0]
        events = np.random.sample(["Diwali", "Republic Day", "Independence Day", "Durga Puja",
                                "Christmas", "New Year"], np.random.randint(0, 2))
        
        regions_data.append({
            "name": region,
            "aqi": aqi,
            "traffic_density": traffic_density,
            "crowd_density": round(np.random.uniform(0.3, 0.9), 2),
            "events_nearby": events,
            "weather": get_weather_data()
        })
    
    # Generate recommendations based on data
    high_pollution_regions = [r["name"] for r in regions_data if r["aqi"] > 300]
    high_traffic_regions = [r["name"] for r in regions_data if r["traffic_density"] > 0.7]
    
    immediate_actions = []
    citizen_advisory = []
    
    if high_pollution_regions:
        immediate_actions.extend([
            f"Deploy water sprinklers in {region}" for region in high_pollution_regions
        ])
        citizen_advisory.append("Use N95 masks when outdoors")
        citizen_advisory.append("Avoid outdoor activities in early morning")
    
    if high_traffic_regions:
        immediate_actions.extend([
            f"Divert traffic from {region}" for region in high_traffic_regions
        ])
        citizen_advisory.append("Use metro or carpool for commute")
    
    logger.debug("Successfully prepared smart city data")
    return jsonify({
        "regions": regions_data,
        "recommendations": {
            "immediate_actions": immediate_actions,
            "citizen_advisory": citizen_advisory
        },
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

@app.route('/api/location-data')
def get_location_data():
    logger.info("API call: /api/location-data")
    df = load_data()
    if df is None:
        logger.error("Failed to load data from CSV")
        return jsonify({"error": "Failed to load data"}), 500
    
    logger.info(f"Data loaded successfully. Shape: {df.shape}")
    logger.info(f"Columns: {df.columns.tolist()}")
    logger.info(f"First row: {df.iloc[0].to_dict()}")
    
    # Convert timestamps to ISO format for better compatibility
    timestamps = df['timestamp'].dt.strftime('%Y-%m-%dT%H:%M:%S').tolist()
    
    # Use actual data from CSV
    data = {
        "location": LOCATION_NAME,
        "details": LOCATION_DETAILS,
        "data": {
            "timestamps": timestamps,
            "air_quality": {
                "pm2_5": df['pm2_5'].fillna(0).tolist(),
                "pm10": df['pm10'].fillna(0).tolist(),
                "no2": df['no2'].fillna(0).tolist(),
                "o3": df['o3'].fillna(0).tolist(),
                "aqi": df['aqi'].fillna(0).tolist()
            },
            "traffic": {
                "duration": df['duration_in_traffic_min'].fillna(0).tolist(),
                "distance": df['distance_km'].fillna(0).tolist()
            }
        },
        "statistics": {
            "average_aqi": float(df['aqi'].mean()),
            "max_aqi": float(df['aqi'].max()),
            "min_aqi": float(df['aqi'].min()),
            "average_traffic_duration": float(df['duration_in_traffic_min'].mean()),
            "max_traffic_duration": float(df['duration_in_traffic_min'].max()),
            "correlations": {
                "pm25_traffic": float(df['pm2_5'].corr(df['duration_in_traffic_min'])),
                "pm10_traffic": float(df['pm10'].corr(df['duration_in_traffic_min'])),
                "no2_traffic": float(df['no2'].corr(df['duration_in_traffic_min']))
            }
        }
    }
    
    logger.info("Successfully prepared response data")
    return jsonify(data)

@app.route('/api/air-traffic-data')
def get_air_traffic_data():
    try:
        logger.info("API call: /api/air-traffic-data")
        logger.info(f"Attempting to load data from: {DATA_FILE}")
        
        if not os.path.exists(DATA_FILE):
            logger.error(f"CSV file not found at {DATA_FILE}")
            return jsonify({"error": "Data file not found"}), 404
            
        df = load_data()  # Use the cached data loading function
        
        if df is None or df.empty:
            logger.error("No data available")
            return jsonify({"error": "No data available"}), 500
            
        logger.info(f"Data loaded successfully. Shape: {df.shape}")
        
        # Process the data into the expected format
        data = {
            "data": {
                "timestamps": df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
                "pm25": df['pm2_5'].tolist(),
                "pm10": df['pm10'].tolist(),
                "no2": df['no2'].tolist(),
                "o3": df['o3'].tolist(),
                "aqi": df['aqi'].tolist(),
                "distance": df['distance_km'].tolist(),
                "duration": df['duration_in_traffic_min'].tolist()
            },
            "status": "success"
        }
        
        logger.info(f"Returning {len(data['data']['timestamps'])} records")
        return jsonify(data)
        
    except Exception as e:
        logger.error(f"Error in get_air_traffic_data: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

def generate_insights(df):
    """
    Generate insights by analyzing correlations between air quality and traffic data.
    This function demonstrates data fusion and cross-correlation analysis.
    """
    insights = []
    
    # Calculate correlations between air quality and traffic metrics
    correlations = {
        'pm25_traffic': df['pm2_5'].corr(df['duration_in_traffic_min']),
        'pm10_traffic': df['pm10'].corr(df['duration_in_traffic_min']),
        'no2_traffic': df['no2'].corr(df['duration_in_traffic_min']),
        'o3_traffic': df['o3'].corr(df['duration_in_traffic_min'])
    }
    
    # Generate insights based on correlations
    for metric, corr in correlations.items():
        if abs(corr) > 0.7:
            insights.append(f"Strong correlation ({corr:.2f}) found between {metric.split('_')[0]} and traffic congestion")
        elif abs(corr) > 0.4:
            insights.append(f"Moderate correlation ({corr:.2f}) found between {metric.split('_')[0]} and traffic congestion")
    
    # Analyze peak hours
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    peak_pollution_hours = df.groupby('hour')['aqi'].mean().nlargest(3).index.tolist()
    peak_traffic_hours = df.groupby('hour')['duration_in_traffic_min'].mean().nlargest(3).index.tolist()
    
    # Cross-reference peak hours
    common_peaks = set(peak_pollution_hours).intersection(peak_traffic_hours)
    if common_peaks:
        insights.append(f"Critical hours with both high pollution and traffic: {sorted(common_peaks)}")
    
    return insights

def generate_smart_recommendations(current_data):
    """
    Generate smart recommendations and automatic actuation responses based on conditions.
    """
    recommendations = []
    actuations = []
    
    # Air Quality based recommendations and actuations
    aqi_level = current_data['aqi']
    if aqi_level > 150:
        recommendations.append({
            'type': 'health',
            'priority': 'high',
            'message': 'Air quality is unhealthy. Consider using air purifiers and limiting outdoor activities.'
        })
        # Trigger ventilation systems
        actuations.append(
            city_actuator.control_ventilation('city_center', 'increase')
        )
        # Update digital signs
        actuations.append(
            city_actuator.update_digital_signs(
                'main_street',
                'POOR AIR QUALITY - USE ALTERNATE ROUTES'
            )
        )
    
    # Traffic based recommendations and actuations
    traffic_duration = current_data['duration_in_traffic_min']
    avg_duration = current_data['avg_duration']
    if traffic_duration > avg_duration * 1.5:
        recommendations.append({
            'type': 'traffic',
            'priority': 'high',
            'message': 'Severe traffic congestion. Consider alternative routes or delay travel.'
        })
        # Adjust traffic light timing
        actuations.append(
            city_actuator.control_traffic_lights('congested_intersection', 'extend_green')
        )
        # Update digital signs
        actuations.append(
            city_actuator.update_digital_signs(
                'highway_entrance',
                'HEAVY TRAFFIC - USE ALTERNATE ROUTES'
            )
        )
    
    # Combined conditions
    if aqi_level > 100 and traffic_duration > avg_duration * 1.2:
        recommendations.append({
            'type': 'combined',
            'priority': 'high',
            'message': 'High pollution and traffic levels. Consider working remotely or using public transportation.'
        })
        # Implement combined response
        actuations.append(
            city_actuator.update_digital_signs(
                'city_entrance',
                'HIGH POLLUTION & TRAFFIC - CONSIDER PUBLIC TRANSPORT'
            )
        )
    
    return {
        'recommendations': recommendations,
        'actuations': actuations
    }

@app.route('/api/actuate/traffic-lights', methods=['POST'])
def control_traffic():
    try:
        data = request.json
        result = city_actuator.manage_traffic_signals(
            data['district'],
            data['action']
        )
        logger.debug(f"Traffic signal control result: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in traffic control API: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/signs', methods=['POST'])
def update_signs():
    try:
        data = request.json
        result = city_actuator.issue_public_alert(
            data['district'],
            data['alert_type'],
            data['severity']
        )
        logger.debug(f"Public alert result: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in public alert API: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/ventilation', methods=['POST'])
def control_ventilation():
    try:
        data = request.json
        result = city_actuator.control_ventilation(
            data['area'],
            data['action']
        )
        logger.debug(f"Ventilation control result: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in ventilation control API: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/emergency-protocol', methods=['POST'])
def activate_emergency_protocol():
    try:
        data = request.json
        result = city_actuator.activate_emergency_protocol(
            data['protocol_type'],
            data['activate']
        )
        logger.debug(f"Emergency protocol result: {result}")
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in emergency protocol API: {str(e)}")
        return jsonify({'error': str(e)}), 400

def generate_current_status(current_data):
    return {
        "overall_status": calculate_overall_status(current_data),
        "air_quality_index": current_data["aqi"],
        "crowd_level": get_crowd_level(current_data["crowd_density"]),
        "traffic_status": get_traffic_status(current_data["traffic_congestion"]),
        "environmental_conditions": {
            "temperature": current_data["temperature"],
            "humidity": current_data["humidity"]
        }
    }

def calculate_overall_status(data):
    # Calculate a weighted score based on multiple factors
    aqi_score = 1 - (min(data["aqi"], 500) / 500)
    crowd_score = 1 - data["crowd_density"]
    traffic_score = 1 - data["traffic_congestion"]
    
    weighted_score = (aqi_score * 0.4 + crowd_score * 0.3 + traffic_score * 0.3)
    
    if weighted_score >= 0.7:
        return "Optimal"
    elif weighted_score >= 0.4:
        return "Moderate"
    else:
        return "Critical"

def get_crowd_level(density):
    if density <= SMART_FEATURES["crowd_density"]["low"]:
        return "Low"
    elif density <= SMART_FEATURES["crowd_density"]["moderate"]:
        return "Moderate"
    else:
        return "High"

def get_traffic_status(congestion):
    if congestion <= SMART_FEATURES["traffic_congestion"]["low"]:
        return "Smooth"
    elif congestion <= SMART_FEATURES["traffic_congestion"]["moderate"]:
        return "Moderate"
    else:
        return "Congested"

def get_air_quality_level(pm25):
    if pm25 <= SMART_FEATURES["air_quality"]["good"]:
        return "Good"
    elif pm25 <= SMART_FEATURES["air_quality"]["moderate"]:
        return "Moderate"
    elif pm25 <= SMART_FEATURES["air_quality"]["unhealthy"]:
        return "Unhealthy"
    elif pm25 <= SMART_FEATURES["air_quality"]["very_unhealthy"]:
        return "Very Unhealthy"
    else:
        return "Hazardous"

# Configure logging for PythonAnywhere
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Serve React App
@app.route('/')
def serve_react():
    return send_from_directory('frontend/build', 'index.html')

# Serve other static files from React build
@app.route('/<path:path>')
def serve_build(path):
    return send_from_directory('frontend/build', path)

if __name__ == '__main__':
    # Only run this in development
    pass
