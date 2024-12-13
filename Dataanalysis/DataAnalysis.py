#!/usr/bin/env python
# coding: utf-8

# In[43]:


import pandas as pd


# In[44]:


data = pd.read_csv(r"C:\Users\HP\Downloads\project\Merged_Air_Quality_and_Traffic_Data.csv")
print(data.columns)


# In[45]:


import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import pearsonr
import statsmodels.api as sm


# Preprocessing
data['timestamp'] = pd.to_datetime(data['timestamp'], errors='coerce')
data = data.dropna(subset=['distance_km', 'duration_min', 'duration_in_traffic_min'])

# Set timestamp as index for time-series analysis
data.set_index('timestamp', inplace=True)

# EDA: Plot trends over time
plt.figure(figsize=(12, 6))
data[['pm2_5', 'pm10', 'no2', 'o3']].resample('D').mean().plot(ax=plt.gca())
plt.title('Daily Average Air Quality Metrics Over Time')
plt.xlabel('Date')
plt.ylabel('Concentration (µg/m³)')
plt.grid()
plt.show()

plt.figure(figsize=(12, 6))
data[['duration_min', 'duration_in_traffic_min']].resample('D').mean().plot(ax=plt.gca())
plt.title('Daily Traffic Metrics Over Time')
plt.xlabel('Date')
plt.ylabel('Time (minutes)')
plt.grid()
plt.show()

# Correlation Analysis
corr_matrix = data[['pm2_5', 'pm10', 'no2', 'o3', 'aqi', 'distance_km', 'duration_min', 'duration_in_traffic_min']].corr()
plt.figure(figsize=(8, 6))
sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', fmt='.2f')
plt.title('Correlation Heatmap')
plt.show()

# Regression Analysis for PM10 and traffic metrics
X = data[['duration_min', 'duration_in_traffic_min']]
y = data['pm10']
X = sm.add_constant(X)  # Add constant for intercept
model = sm.OLS(y, X).fit()
print(model.summary())


# In[46]:


import statsmodels.api as sm

# Extract relevant columns
X_o3 = data['duration_in_traffic_min']  # Independent variable: Duration in traffic
y_o3 = data['o3']  # Dependent variable: Ozone levels

# Add a constant to the independent variable for the intercept
X_o3 = sm.add_constant(X_o3)

# Fit the OLS model
ols_model_o3 = sm.OLS(y_o3, X_o3).fit()

# Print the summary
print("OLS Regression Results for O3 and Traffic Duration:")
print(ols_model_o3.summary())


# In[37]:


# Extract relevant columns for PM10 analysis
X_pm10 = data[['duration_min', 'duration_in_traffic_min']]  # Independent variables
y_pm10 = data['pm10']  # Dependent variable: PM10 levels

# Add a constant to the independent variables for the intercept
X_pm10 = sm.add_constant(X_pm10)

# Fit the OLS model
ols_model_pm10 = sm.OLS(y_pm10, X_pm10).fit()

# Print the summary
print("OLS Regression Results for PM10 and Traffic Metrics:")
print(ols_model_pm10.summary())


# In[38]:


import statsmodels.api as sm

# Define dependent and independent variables
X = data[['duration_min', 'duration_in_traffic_min']]  # Traffic metrics as independent variables
y = data['pm10']  # PM10 as dependent variable

# Add a constant to account for the intercept
X = sm.add_constant(X)

# Fit the OLS regression model
ols_model = sm.OLS(y, X).fit()

# Display the regression summary
print(ols_model.summary())


# In[ ]:





# In[40]:


print(data.columns)


# In[ ]:





# In[ ]:





# In[ ]:




