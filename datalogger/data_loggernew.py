import time
import requests
import googlemaps
import csv
import os
from datetime import datetime

# API Keys
OPENWEATHER_API_KEY = "348bd3be118e3fe8e1a72b0e669ecdaa"
GOOGLE_MAPS_API_KEY = "AIzaSyADCTk8nmyKPlmI2wVeeTp1h7Q45zhpp00"

# Coordinates for Delhi
latitude = 28.7041
longitude = 77.1025

# Directory to save data
SAVE_DIRECTORY = "/home/bouchra/Shahee_IoT/data"

# Create the directory if it doesn't exist
if not os.path.exists(SAVE_DIRECTORY):
    os.makedirs(SAVE_DIRECTORY)

# Fetch air quality data from OpenWeather API
def fetch_air_quality(lat, lon):
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(data["list"][0]["dt"])),
            "pm2_5": data["list"][0]["components"]["pm2_5"],
            "pm10": data["list"][0]["components"]["pm10"],
            "no2": data["list"][0]["components"]["no2"],
            "o3": data["list"][0]["components"]["o3"],
            "aqi": data["list"][0]["main"]["aqi"]
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching air quality data: {e}")
        return None

# Fetch traffic congestion data from Google Maps API
def fetch_traffic_data(origin, destination):
    gmaps = googlemaps.Client(key=GOOGLE_MAPS_API_KEY)
    try:
        directions = gmaps.directions(
            origin=origin,
            destination=destination,
            mode="driving",
            departure_time="now",
            traffic_model="best_guess"
        )
        leg = directions[0]["legs"][0]
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "distance": leg["distance"]["text"],
            "duration": leg["duration"]["text"],
            "duration_in_traffic": leg.get("duration_in_traffic", {}).get("text", "N/A"),
            "start_address": leg["start_address"],
            "end_address": leg["end_address"]
        }
    except Exception as e:
        print(f"Error fetching traffic data: {e}")
        return None

# Save air quality data to CSV
def save_air_quality_to_csv(data):
    filepath = os.path.join(SAVE_DIRECTORY, "air_quality.csv")
    file_exists = os.path.isfile(filepath)
    with open(filepath, "a", newline="") as csvfile:
        fieldnames = ["timestamp", "pm2_5", "pm10", "no2", "o3", "aqi"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(data)

# Save traffic data to CSV
def save_traffic_data_to_csv(data):
    filepath = os.path.join(SAVE_DIRECTORY, "traffic_data.csv")
    file_exists = os.path.isfile(filepath)
    with open(filepath, "a", newline="") as csvfile:
        fieldnames = ["timestamp", "distance", "duration", "duration_in_traffic", "start_address", "end_address"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(data)

# Main function
def main():
    runtime = 7 * 24 * 60 * 60  # 7 days in seconds
    interval = 600      # Data collection every 5 minutes
    origin = "Connaught Place, New Delhi, Delhi"
    destination = "India Gate, New Delhi, Delhi"
    start_time = time.time()

    while time.time() - start_time < runtime:
        print("Fetching data...")

        # Air quality data
        air_quality_data = fetch_air_quality(latitude, longitude)
        if air_quality_data:
            print("Received air quality data")
            save_air_quality_to_csv(air_quality_data)

        # Traffic data
        traffic_data = fetch_traffic_data(origin, destination)
        if traffic_data:
            print("Received air traffic data")
            save_traffic_data_to_csv(traffic_data)

        print("Data collection complete. Sleeping for 5 minutes...")
        time.sleep(interval)

    print("Data collection completed for 15 hours.")

# Execute main function
if __name__ == "__main__":
    main()