import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import numpy as np

# Read the data
df = pd.read_csv('air_quality_data.csv')

# Convert timestamp to datetime
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Calculate basic statistics
stats = df.describe()
print("\nBasic Statistics:")
print(stats)

# Create a figure with multiple subplots
plt.figure(figsize=(15, 10))

# 1. Time series plot for all pollutants
plt.subplot(2, 2, 1)
x = np.arange(len(df['timestamp']))
plt.plot(x, df['pm2_5'].to_numpy(), label='PM2.5')
plt.plot(x, df['pm10'].to_numpy(), label='PM10')
plt.plot(x, df['no2'].to_numpy(), label='NO2')
plt.plot(x, df['o3'].to_numpy(), label='O3')
plt.title('Air Pollutants Over Time')
plt.xlabel('Time Points')
plt.ylabel('Concentration')
plt.legend()

# 2. Box plot for all pollutants
plt.subplot(2, 2, 2)
data_to_plot = [df[col].to_numpy() for col in ['pm2_5', 'pm10', 'no2', 'o3']]
plt.boxplot(data_to_plot, labels=['PM2.5', 'PM10', 'NO2', 'O3'])
plt.title('Distribution of Pollutant Levels')
plt.ylabel('Concentration')

# 3. AQI distribution
plt.subplot(2, 2, 3)
plt.hist(df['aqi'].to_numpy(), bins=20, color='skyblue')
plt.title('AQI Distribution')
plt.xlabel('AQI Value')
plt.ylabel('Frequency')

# 4. Correlation heatmap
plt.subplot(2, 2, 4)
correlation = df[['pm2_5', 'pm10', 'no2', 'o3', 'aqi']].corr()
sns.heatmap(correlation, annot=True, cmap='coolwarm', vmin=-1, vmax=1)
plt.title('Correlation Between Parameters')

# Adjust layout and display
plt.tight_layout()
plt.savefig('air_quality_analysis.png')
plt.close()

# Print additional insights
print("\nKey Insights:")
print(f"Average PM2.5: {df['pm2_5'].mean():.2f} µg/m³")
print(f"Average PM10: {df['pm10'].mean():.2f} µg/m³")
print(f"Average NO2: {df['no2'].mean():.2f} ppb")
print(f"Average O3: {df['o3'].mean():.2f} ppb")
print(f"Average AQI: {df['aqi'].mean():.2f}")

# Check for any concerning levels
pm25_threshold = 35  # WHO 24-hour guideline
pm10_threshold = 50  # WHO 24-hour guideline
no2_threshold = 25   # WHO 24-hour guideline
o3_threshold = 100   # WHO 8-hour guideline

print("\nAir Quality Alerts:")
if df['pm2_5'].mean() > pm25_threshold:
    print(f"WARNING: Average PM2.5 ({df['pm2_5'].mean():.2f}) exceeds WHO guideline of {pm25_threshold} µg/m³")
if df['pm10'].mean() > pm10_threshold:
    print(f"WARNING: Average PM10 ({df['pm10'].mean():.2f}) exceeds WHO guideline of {pm10_threshold} µg/m³")
if df['no2'].mean() > no2_threshold:
    print(f"WARNING: Average NO2 ({df['no2'].mean():.2f}) exceeds WHO guideline of {no2_threshold} ppb")
if df['o3'].mean() > o3_threshold:
    print(f"WARNING: Average O3 ({df['o3'].mean():.2f}) exceeds WHO guideline of {o3_threshold} ppb")
