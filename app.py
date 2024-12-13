from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import logging
import os
import traceback
from flask import Flask, render_template, jsonify

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Constants
DATA_FILE = os.path.join(os.path.dirname(__file__), 'Merged_Air_Quality_and_Traffic_Data.csv')

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Location-specific constants
LOCATION_NAME = "Connaught Place"
LOCATION_DETAILS = {
    "description": "One of Delhi's major financial and commercial hubs",
    "coordinates": {"lat": 28.6289, "lng": 77.2065},
    "peak_hours": ["9:00 AM - 11:00 AM", "5:00 PM - 8:00 PM"]
}

# Smart city features and thresholds
SMART_FEATURES = {
    "air_quality": {
        "good": 50,
        "moderate": 100,
        "unhealthy": 150,
        "very_unhealthy": 200,
        "hazardous": 300
    },
    "crowd_density": {
        "low": 0.3,
        "moderate": 0.6,
        "high": 0.8
    },
    "traffic_congestion": {
        "low": 0.3,
        "moderate": 0.6,
        "high": 0.8
    }
}

class SmartCityActuator:
    """Administrative control system for Delhi's air quality and traffic management."""
    def __init__(self):
        self.traffic_signals = {}        # Traffic signal states across districts
        self.alert_systems = {}          # Public alert system states
        self.monitoring_stations = {}     # Air quality monitoring station data
        self.emergency_protocols = {      # Emergency response protocols
            'severe_pollution': False,
            'traffic_emergency': False,
            'public_health_alert': False
        }

    def manage_traffic_signals(self, district, action):
        """
        Manages traffic signal timing across districts.
        Actions: 'optimize_flow', 'emergency_protocol', 'normal_operation'
        """
        valid_actions = ['optimize_flow', 'emergency_protocol', 'normal_operation']
        if action in valid_actions:
            self.traffic_signals[district] = action
            return {'status': 'success', 'message': f'Traffic signal protocol {action} activated in {district}'}
        return {'status': 'error', 'message': 'Invalid action specified'}

    def issue_public_alert(self, district, alert_type, severity):
        """
        Issues public health and safety alerts.
        Types: 'air_quality', 'traffic_congestion', 'weather_emergency'
        """
        alert_data = {
            'type': alert_type,
            'severity': severity,
            'timestamp': datetime.now().isoformat(),
            'district': district
        }
        self.alert_systems[district] = alert_data
        return {'status': 'success', 'message': f'Alert issued for {district}: {alert_type} - {severity}'}

    def update_monitoring_status(self, station_id, data):
        """
        Updates air quality monitoring station data.
        """
        self.monitoring_stations[station_id] = {
            'data': data,
            'last_updated': datetime.now().isoformat()
        }
        return {'status': 'success', 'message': f'Station {station_id} data updated'}

    def activate_emergency_protocol(self, protocol_type, activate=True):
        """
        Activates or deactivates emergency protocols.
        """
        if protocol_type in self.emergency_protocols:
            self.emergency_protocols[protocol_type] = activate
            status = 'activated' if activate else 'deactivated'
            return {'status': 'success', 'message': f'Emergency protocol {protocol_type} {status}'}
        return {'status': 'error', 'message': 'Invalid protocol type'}

# Initialize the actuator
city_actuator = SmartCityActuator()

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

def load_data():
    try:
        logger.info(f"Loading data from CSV at path: {DATA_FILE}")
        if not os.path.exists(DATA_FILE):
            logger.error(f"CSV file not found at path: {DATA_FILE}")
            return None
            
        df = pd.read_csv(DATA_FILE)
        
        # Validate required columns
        required_columns = ['timestamp', 'pm2_5', 'pm10', 'no2', 'o3', 'aqi', 'duration_in_traffic_min', 'distance_km']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Missing required columns in CSV: {missing_columns}")
            return None
            
        # Convert timestamp and handle potential errors
        try:
            df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
        except Exception as e:
            logger.error(f"Error converting timestamps: {e}")
            return None
            
        # Basic data validation
        if df.empty:
            logger.error("CSV file is empty")
            return None

        # Drop duplicates
        logger.info(f"Total rows before dropping duplicates: {len(df)}")
        df = df.drop_duplicates()
        logger.info(f"Total rows after dropping duplicates: {len(df)}")

        # Resample data to 10-minute intervals
        df.set_index('timestamp', inplace=True)
        df = df.resample('10T').mean().reset_index()
        logger.info(f"Total rows after resampling: {len(df)}")

        # Fill missing values
        df['pm2_5'] = df['pm2_5'].fillna(df['pm2_5'].mean())
        df['pm10'] = df['pm10'].fillna(df['pm10'].mean())
        df['no2'] = df['no2'].fillna(df['no2'].mean())
        df['o3'] = df['o3'].fillna(df['o3'].mean())
        df['aqi'] = df['aqi'].fillna(df['aqi'].mean())
        
        # For traffic data, use forward fill for missing values
        df['duration_in_traffic_min'] = df['duration_in_traffic_min'].fillna(method='ffill')
        df['distance_km'] = df['distance_km'].fillna(method='ffill')
        
        logger.info(f"Data loaded and cleaned successfully. Shape: {df.shape}")
        return df
        
    except pd.errors.EmptyDataError:
        logger.error("CSV file is empty")
        return None
    except pd.errors.ParserError as e:
        logger.error(f"Error parsing CSV file: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading CSV file: {e}")
        return None

def generate_hourly_data():
    df = load_data()
    if df is None:
        return []
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sort by timestamp
    df = df.sort_values('timestamp')
    
    # Take every 3rd point to reduce density
    df = df.iloc[::3].copy()
    
    data_points = []
    for _, row in df.iterrows():
        # Format timestamp exactly like the top graph: "11/26 9:30 PM"
        # Remove leading zeros and ensure spacing matches
        timestamp = row['timestamp']
        month = str(timestamp.month)
        day = str(timestamp.day)
        hour = str(timestamp.hour % 12 or 12)  # Convert 0 to 12
        minute = str(timestamp.minute).zfill(2)  # Keep minutes as 2 digits
        ampm = "AM" if timestamp.hour < 12 else "PM"
        formatted_time = f"{month}/{day} {hour}:{minute} {ampm}"
        
        data_points.append({
            "timestamp": formatted_time,
            "indoor_pm25": row['pm2_5'],
            "outdoor_pm25": row['pm2_5'],
            "pm10": row['pm10'],
            "traffic_density": row['duration_in_traffic_min']
        })
    
    return data_points

def get_weather_data():
    return {
        "temperature": round(np.random.uniform(15, 45), 1),
        "humidity": round(np.random.uniform(30, 90), 1),
        "wind_speed": round(np.random.uniform(0, 15), 1),
        "season": np.random.choice(["winter", "summer", "monsoon", "autumn"])
    }

@app.route('/api/dashboard')
def dashboard():
    logger.info("API call: /api/dashboard")
    current_data = generate_hourly_data()[-1]  # Get latest data point
    
    return jsonify({
        "data_points": generate_hourly_data(),
        "stats": {
            "indoor_range": f"{current_data['indoor_pm25']} µg/m³",
            "outdoor_pm25": f"{current_data['outdoor_pm25']} µg/m³",
            "traffic_congestion": {
                "level": "High" if current_data['traffic_density'] > 0.7 else 
                         "Medium" if current_data['traffic_density'] > 0.4 else "Low",
                "percentage": round(current_data['traffic_density'] * 100),
                "trend": np.random.choice(["increasing", "decreasing"])
            }
        }
    })



@app.route('/api/smart-city-data')
def smart_city_data():
    logger.info("API call: /api/smart-city-data")
    df = load_data()
    if df is None:
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
        logger.info("Loading data from CSV...")
        df = pd.read_csv(DATA_FILE)
        
        if df.empty:
            logger.error("CSV file is empty")
            return jsonify({"error": "CSV file is empty"}), 500
            
        logger.info(f"Data loaded successfully. Shape: {df.shape}")
        
        # Drop the unnamed index column if it exists
        if 'Unnamed: 0' in df.columns:
            df = df.drop('Unnamed: 0', axis=1)
        
        # Convert timestamp column
        df['timestamp'] = pd.to_datetime(df['timestamp'], format='%m/%d/%Y %H:%M')
        df = df.sort_values('timestamp')
        
        # Fill NaN values with appropriate defaults
        df['pm2_5'] = df['pm2_5'].fillna(df['pm2_5'].mean())
        df['pm10'] = df['pm10'].fillna(df['pm10'].mean())
        df['no2'] = df['no2'].fillna(df['no2'].mean())
        df['o3'] = df['o3'].fillna(df['o3'].mean())
        df['aqi'] = df['aqi'].fillna(df['aqi'].mean())
        df['duration_in_traffic_min'] = df['duration_in_traffic_min'].fillna(0)
        df['distance_km'] = df['distance_km'].fillna(0)
        
        # Round numeric columns to 2 decimal places to reduce payload size
        numeric_columns = ['pm2_5', 'pm10', 'no2', 'o3', 'aqi', 'duration_in_traffic_min', 'distance_km']
        df[numeric_columns] = df[numeric_columns].round(2)
        
        # Process the data
        data = {
            "timestamps": df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
            "pm25": df['pm2_5'].tolist(),
            "pm10": df['pm10'].tolist(),
            "no2": df['no2'].tolist(),
            "o3": df['o3'].tolist(),
            "aqi": df['aqi'].tolist(),
            "duration": df['duration_in_traffic_min'].tolist(),
            "distance": df['distance_km'].tolist()
        }
        
        response_data = {
            "status": "success",
            "data": data
        }
        
        logger.info(f"Sending response with {len(data['timestamps'])} data points")
        return jsonify(response_data)
        
    except Exception as e:
        error_msg = f"Error in get_air_traffic_data: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

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
        return jsonify(result)
    except Exception as e:
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
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/ventilation', methods=['POST'])
def control_ventilation():
    try:
        data = request.json
        result = city_actuator.control_ventilation(
            data['area'],
            data['action']
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/emergency-protocol', methods=['POST'])
def activate_emergency_protocol():
    try:
        data = request.json
        result = city_actuator.activate_emergency_protocol(
            data['protocol_type'],
            data['activate']
        )
        return jsonify(result)
    except Exception as e:
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

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
