from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import logging
import os

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Location-specific constants
LOCATION_NAME = "Connaught Place"
LOCATION_DETAILS = {
    "description": "One of Delhi's major financial and commercial hubs",
    "coordinates": {"lat": 28.6289, "lng": 77.2065},
    "peak_hours": ["9:00 AM - 11:00 AM", "5:00 PM - 8:00 PM"]
}

# Add this near the top with other constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'Merged_Air_Quality_and_Traffic_Data.csv')

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
    """
    Simulates control over various smart city infrastructure components.
    In a real system, this would interface with actual hardware controllers.
    """
    def __init__(self):
        self.traffic_light_states = {}  # Stores states of traffic lights
        self.digital_signs = {}         # Stores messages on digital signs
        self.ventilation_systems = {}   # Stores states of ventilation systems
        
    def control_traffic_lights(self, location, action):
        """
        Controls traffic light timing based on congestion levels.
        Actions: 'extend_green', 'reduce_cycle', 'normal'
        """
        self.traffic_light_states[location] = action
        return {
            'status': 'success',
            'location': location,
            'action': action,
            'message': f'Traffic light timing at {location} adjusted to {action}'
        }
    
    def update_digital_signs(self, location, message):
        """
        Updates digital road signs with traffic and air quality information.
        """
        self.digital_signs[location] = message
        return {
            'status': 'success',
            'location': location,
            'message': message
        }
    
    def control_ventilation(self, area, action):
        """
        Controls urban ventilation systems based on air quality.
        Actions: 'increase', 'decrease', 'normal'
        """
        self.ventilation_systems[area] = action
        return {
            'status': 'success',
            'area': area,
            'action': action,
            'message': f'Ventilation in {area} set to {action}'
        }

# Initialize the actuator
city_actuator = SmartCityActuator()

def load_data():
    try:
        logging.debug(f"Loading data from CSV at path: {DATA_FILE}")
        if not os.path.exists(DATA_FILE):
            logging.error(f"CSV file not found at path: {DATA_FILE}")
            return None
            
        df = pd.read_csv(DATA_FILE)
        
        # Validate required columns
        required_columns = ['timestamp', 'pm2_5', 'pm10', 'no2', 'o3', 'aqi', 'duration_in_traffic_min', 'distance_km']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logging.error(f"Missing required columns in CSV: {missing_columns}")
            return None
            
        # Convert timestamp and handle potential errors
        try:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        except Exception as e:
            logging.error(f"Error converting timestamps: {e}")
            return None
            
        # Basic data validation
        if df.empty:
            logging.error("CSV file is empty")
            return None
            
        # Fill NaN values with appropriate defaults
        df['duration_in_traffic_min'] = df['duration_in_traffic_min'].fillna(0)
        df['distance_km'] = df['distance_km'].fillna(0)
        df['pm2_5'] = df['pm2_5'].fillna(df['pm2_5'].mean())
        df['pm10'] = df['pm10'].fillna(df['pm10'].mean())
        df['no2'] = df['no2'].fillna(df['no2'].mean())
        df['o3'] = df['o3'].fillna(df['o3'].mean())
        df['aqi'] = df['aqi'].fillna(df['aqi'].mean())
        
        logging.debug(f"Data loaded successfully. Shape: {df.shape}")
        return df
        
    except pd.errors.EmptyDataError:
        logging.error("CSV file is empty")
        return None
    except pd.errors.ParserError as e:
        logging.error(f"Error parsing CSV file: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error loading CSV file: {e}")
        return None

def generate_hourly_data():
    df = load_data()
    if df is None:
        return []
    
    data_points = []
    current_time = datetime.now()
    
    for i in range(24):
        hour = (current_time - timedelta(hours=24-i)).strftime('%H:00')
        data_points.append({
            "hour": hour,
            "indoor_pm25": df['pm2_5'].iloc[i],
            "outdoor_pm25": df['pm10'].iloc[i],
            "traffic_density": df['duration_in_traffic_min'].iloc[i]
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
    logging.debug("API call: /api/dashboard")
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
    logging.debug("API call: /api/smart-city-data")
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
    logging.debug("API call: /api/location-data")
    df = load_data()
    if df is None:
        logging.error("Failed to load data from CSV")
        return jsonify({"error": "Failed to load data"}), 500
    
    logging.debug(f"Data loaded successfully. Shape: {df.shape}")
    logging.debug(f"Columns: {df.columns.tolist()}")
    logging.debug(f"First row: {df.iloc[0].to_dict()}")
    
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
    
    logging.debug("Successfully prepared response data")
    return jsonify(data)

@app.route('/api/air-traffic-data')
def get_air_traffic_data():
    try:
        logging.debug("API call: /api/air-traffic-data")
        logging.debug("Loading data from CSV...")
        df = load_data()
        if df is None or df.empty:
            logging.error("Failed to load data from CSV")
            return jsonify({"error": "Failed to load data"}), 500
            
        logging.debug("Processing data...")
        # Process the data
        data = {
            "timestamps": df['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S').tolist(),
            "pm25": df['pm2_5'].tolist(),
            "pm10": df['pm10'].tolist(),
            "no2": df['no2'].tolist(),
            "o3": df['o3'].tolist(),
            "aqi": df['aqi'].tolist(),
            "traffic_duration": df['duration_in_traffic_min'].tolist(),
            "distance": df['distance_km'].tolist()
        }
        
        logging.debug("Calculating correlations...")
        # Calculate correlations
        correlations = {
            "pm25_traffic": float(df['pm2_5'].corr(df['duration_in_traffic_min'])),
            "pm10_traffic": float(df['pm10'].corr(df['duration_in_traffic_min'])),
            "no2_traffic": float(df['no2'].corr(df['duration_in_traffic_min']))
        }
        
        logging.debug("Generating insights...")
        insights = generate_insights(df)
        
        logging.debug("Sending response...")
        return jsonify({
            "status": "success",
            "data": data,
            "correlations": correlations,
            "insights": insights
        })
        
    except Exception as e:
        logging.error(f"Error in get_air_traffic_data: {str(e)}")
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
        result = city_actuator.control_traffic_lights(
            data['location'],
            data['action']
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/actuate/signs', methods=['POST'])
def update_signs():
    try:
        data = request.json
        result = city_actuator.update_digital_signs(
            data['location'],
            data['message']
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
    app.run(debug=True, port=5000)
