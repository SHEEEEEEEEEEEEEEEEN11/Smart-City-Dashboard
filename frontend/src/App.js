import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Grid, Alert, AlertTitle, CircularProgress, Container, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import TrafficActuations from './components/TrafficActuations';
import CombinedActuations from './components/CombinedActuations';
import './components/Dashboard.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState({
    avgPM25: 0,
    avgPM10: 0,
    maxPM25: 0,
    maxPM10: 0,
    minPM25: 0,
    avgNO2: 0,
    maxNO2: 0,
    avgO3: 0,
    maxO3: 0,
    avgAQI: 0,
    maxAQI: 0,
    avgDuration: 0,
    maxDuration: 0,
    avgDistance: 0,
    maxDistance: 0
  });
  const [actuations, setActuations] = useState([]);
  const [visibleData, setVisibleData] = useState([]);
  const [pageSize] = useState(100); // Show 100 data points at a time

  // Helper function to calculate average
  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  // Add the missing generateActuations function
  const generateActuations = useCallback((data) => {
    if (!data || data.length === 0) return [];
    
    const latestData = data[0];
    const actuations = [];

    // 1. PM2.5 Alert - Air Purifier Control
    if (latestData.pm2_5 > 35) {
      actuations.push({
        type: 'warning',
        title: 'PM2.5 Alert',
        message: `High PM2.5 levels (${latestData.pm2_5.toFixed(1)} µg/m³).`,
        system: 'air',
        actions: [
          { device: 'air_purifier', action: 'ON', speed: 'high' },
          { device: 'ventilation', action: 'ON', mode: 'filter' }
        ]
      });
    }

    // 2. PM10 Alert - Emergency Ventilation
    if (latestData.pm10 > 150) {
      actuations.push({
        type: 'error',
        title: 'PM10 Alert',
        message: `Dangerous PM10 levels (${latestData.pm10.toFixed(1)} µg/m³).`,
        system: 'air',
        actions: [
          { device: 'emergency_vent', action: 'ON', power: 'max' },
          { device: 'air_purifier', action: 'ON', speed: 'turbo' },
          { device: 'windows', action: 'CLOSE' }
        ]
      });
    }

    // 3. NO2 Alert - Gas Management
    if (latestData.no2 > 100) {
      actuations.push({
        type: 'warning',
        title: 'NO2 Alert',
        message: `Elevated NO2 levels (${latestData.no2.toFixed(1)} ppb).`,
        system: 'air',
        actions: [
          { device: 'gas_sensor', action: 'ACTIVATE' },
          { device: 'ventilation', action: 'ON', mode: 'exhaust' },
          { device: 'air_quality_monitor', action: 'HEIGHTENED' }
        ]
      });
    }

    // 4. O3 Alert - Ozone Management
    if (latestData.o3 > 70) {
      actuations.push({
        type: 'warning',
        title: 'Ozone Alert',
        message: `High ozone levels (${latestData.o3.toFixed(1)} ppb).`,
        system: 'air',
        actions: [
          { device: 'ozone_filter', action: 'ON' },
          { device: 'humidifier', action: 'ON', level: 'high' },
          { device: 'outdoor_warning', action: 'ACTIVATE' }
        ]
      });
    }

    // 5. AQI Alert - Complete Air Management
    if (latestData.aqi > 150) {
      actuations.push({
        type: 'error',
        title: 'Poor Air Quality',
        message: `Critical AQI level (${latestData.aqi.toFixed(0)}).`,
        system: 'air',
        actions: [
          { device: 'all_purifiers', action: 'ON', mode: 'emergency' },
          { device: 'ventilation', action: 'ON', mode: 'recirculate' },
          { device: 'humidifier', action: 'ON', level: 'optimal' },
          { device: 'public_display', action: 'WARN', message: 'Poor Air Quality' }
        ]
      });
    }

    // 6. Traffic Duration Alert - Traffic Management
    if (latestData.duration_in_traffic_min > 45) {
      actuations.push({
        type: 'warning',
        title: 'Traffic Delay',
        message: `Significant traffic delay (${latestData.duration_in_traffic_min.toFixed(0)} min).`,
        system: 'traffic',
        actions: [
          { device: 'traffic_lights', action: 'OPTIMIZE', mode: 'congestion' },
          { device: 'digital_signs', action: 'DISPLAY', message: 'Heavy Traffic Ahead' },
          { device: 'route_guidance', action: 'ACTIVATE', mode: 'alternate' }
        ]
      });
    }

    // 7. Combined Air Quality & Traffic Alert
    if (latestData.aqi > 100 && latestData.duration_in_traffic_min > 30) {
      actuations.push({
        type: 'error',
        title: 'Combined Alert',
        message: 'Poor air quality during heavy traffic.',
        system: 'combined',
        actions: [
          { device: 'road_ventilation', action: 'ON', power: 'max' },
          { device: 'traffic_lights', action: 'ADJUST', mode: 'dispersal' },
          { device: 'air_quality_monitor', action: 'HEIGHTENED' },
          { device: 'emergency_response', action: 'STANDBY' }
        ]
      });
    }

    // 8. Distance Alert - Route Management
    if (latestData.distance_km > 20) {
      actuations.push({
        type: 'info',
        title: 'Long Route Alert',
        message: `Long distance detected (${latestData.distance_km.toFixed(1)} km).`,
        system: 'traffic',
        actions: [
          { device: 'route_optimizer', action: 'ACTIVATE' },
          { device: 'traffic_prediction', action: 'ANALYZE' },
          { device: 'digital_signs', action: 'UPDATE', message: 'Consider Alt Routes' }
        ]
      });
    }

    // 9. Overall System Status
    const criticalIssues = actuations.filter(a => a.type === 'error').length;
    if (criticalIssues > 0) {
      actuations.push({
        type: 'error',
        title: 'System Status',
        message: `${criticalIssues} critical issues detected.`,
        system: 'system',
        actions: [
          { device: 'emergency_systems', action: 'ACTIVATE' },
          { device: 'notification_system', action: 'ALERT', priority: 'high' },
          { device: 'backup_power', action: 'STANDBY' }
        ]
      });
    } else if (actuations.length > 0) {
      actuations.push({
        type: 'warning',
        title: 'System Status',
        message: `${actuations.length} warnings active.`,
        system: 'system',
        actions: [
          { device: 'monitoring_system', action: 'HEIGHTENED' },
          { device: 'notification_system', action: 'WARN', priority: 'medium' }
        ]
      });
    } else {
      actuations.push({
        type: 'success',
        title: 'System Status',
        message: 'All systems operating normally.',
        system: 'system',
        actions: [
          { device: 'all_systems', action: 'NORMAL' },
          { device: 'monitoring_system', action: 'ROUTINE' }
        ]
      });
    }

    return actuations;
  }, []);

  // Add a function to handle actuation actions
  const handleActuation = useCallback((action) => {
    console.log('Executing actuation:', action);
    // Here you would implement the actual device control logic
    // For example, sending commands to IoT devices or traffic control systems
    switch (action.device) {
      case 'traffic_lights':
        console.log(`Adjusting traffic lights to ${action.mode} mode`);
        break;
      case 'air_purifier':
        console.log(`Setting air purifier to ${action.speed} speed`);
        break;
      case 'humidifier':
        console.log(`Setting humidifier to ${action.level}`);
        break;
      default:
        console.log(`Controlling device: ${action.device}, Action: ${action.action}`);
        break;
    }
  }, []);

  const ActuationCard = ({ title, actuations }) => (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {actuations.length > 0 ? (
        actuations.map((actuation, index) => (
          <Alert
            key={index}
            severity={actuation.type}
            sx={{ mb: 1 }}
          >
            <AlertTitle>{actuation.title}</AlertTitle>
            {actuation.message}
            {actuation.actions && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Actions:
                </Typography>
                {actuation.actions.map((action, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mt: 0.5 
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ flexGrow: 1 }}
                    >
                      - {action.device}: {action.action} ({action.mode || action.speed || action.level || 'N/A'})
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleActuation(action)}
                      sx={{ ml: 1 }}
                    >
                      Execute
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Alert>
        ))
      ) : (
        <Alert severity="info">No active actuations</Alert>
      )}
    </Paper>
  );

  const processData = useCallback((parsedData) => {
    console.log('Starting data processing...');
    console.log('Initial data length:', parsedData.length);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('No data available to process');
    }
    
    // Process the data and ensure it's sorted by date
    const processedData = parsedData
      .filter(row => row.timestamp && !isNaN(new Date(row.timestamp).getTime())) // Remove invalid timestamps
      .map(row => {
        const timestamp = new Date(row.timestamp);
        return {
          timestamp: timestamp.getTime(),
          pm2_5: parseFloat(row.pm2_5) || 0,
          pm10: parseFloat(row.pm10) || 0,
          no2: parseFloat(row.no2) || 0,
          o3: parseFloat(row.o3) || 0,
          aqi: parseFloat(row.aqi) || 0,
          distance_km: parseFloat(row.distance_km) || 0,
          duration_in_traffic_min: parseFloat(row.duration_in_traffic_min) || 0
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Processed data length:', processedData.length);
    
    if (processedData.length === 0) {
      throw new Error('No valid data points after processing');
    }
    
    // Calculate date range for filtering
    const startDate = new Date('2023-11-28').getTime();
    const endDate = new Date('2023-12-06').getTime();
    
    // Filter data to only include dates between Nov 28 and Dec 6
    const filteredData = processedData.filter(
      item => item.timestamp >= startDate && item.timestamp <= endDate
    );
    
    console.log('Filtered data length:', filteredData.length);
    
    if (filteredData.length === 0) {
      throw new Error('No data available for the specified date range');
    }
    
    return filteredData;
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    setData([]);
    setVisibleData([]);
    
    const csvUrl = '/Merged_Air_Quality_and_Traffic_Data.csv';
    console.log('Loading CSV from:', csvUrl);
    
    const fetchData = async () => {
      try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const csvData = await response.text();
        Papa.parse(csvData, {
          header: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const filteredData = results.data
                .filter(row => row.timestamp && new Date(row.timestamp) >= new Date('2023-11-28') && new Date(row.timestamp) <= new Date('2023-12-06'))
                .filter((_, index) => index % 10 === 0); // Take every 10th point for smoother graphs
              
              if (filteredData.length === 0) {
                setError('No data available for the selected date range');
                setLoading(false);
                return;
              }
              
              setData(filteredData);
            } else {
              setError('No data available');
            }
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError('Error parsing data');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (data.length > 0) {
      setVisibleData(data.slice(0, pageSize));
    }
  }, [data, pageSize]);

  const memoizedCharts = useMemo(() => (
    <>
      {/* Air Quality Chart */}
      <Box sx={{ height: 300, mb: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Air Quality Trends
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) => new Date(time).toLocaleDateString()}
              interval="preserveStartEnd"
            />
            <YAxis />
            <Tooltip
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Legend />
            <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#00BCD4" dot={false} />
            <Line type="monotone" dataKey="pm10" name="PM10" stroke="#2196F3" dot={false} />
            <Line type="monotone" dataKey="no2" name="NO2" stroke="#9C27B0" dot={false} />
            <Line type="monotone" dataKey="o3" name="O3" stroke="#4CAF50" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Traffic Chart */}
      <Box sx={{ height: 300, mb: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Traffic Density Trends
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(time) => {
                const date = new Date(time);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              labelFormatter={(label) => {
                const date = new Date(label);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
              }}
              formatter={(value) => value.toFixed(2)}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="duration_in_traffic_min" 
              name="Traffic Duration (min)" 
              stroke="#8884d8" 
              dot={false}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="distance_km" 
              name="Distance (km)" 
              stroke="#82ca9d" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </>
  ), [visibleData]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Smart City Dashboard</h1>
      </div>

      {loading && (
        <div className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading data...</Typography>
        </div>
      )}

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            margin: '20px auto',
            maxWidth: '600px'
          }}
        >
          <AlertTitle>Error</AlertTitle>
          {error}
          <Button 
            onClick={loadData} 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {!loading && !error && visibleData.length === 0 && (
        <Alert 
          severity="warning"
          sx={{ 
            margin: '20px auto',
            maxWidth: '600px'
          }}
        >
          <AlertTitle>No Data Available</AlertTitle>
          No data is available for the selected time period.
          <Button 
            onClick={loadData} 
            variant="outlined" 
            size="small" 
            sx={{ mt: 1 }}
          >
            Refresh
          </Button>
        </Alert>
      )}

      {!loading && !error && visibleData.length > 0 && (
        <>
          <div className="top-section">
            <div className="dashboard-section">
              <h2>Air Quality Actuations</h2>
              <ActuationCard 
                title="Air Quality Actuations" 
                actuations={actuations.filter(a => a.system === 'air')} 
              />
            </div>
            <div className="dashboard-section">
              <h2>Traffic Actuations</h2>
              <TrafficActuations trafficData={data} />
            </div>
            <div className="dashboard-section">
              <h2>Combined Actuations</h2>
              <CombinedActuations 
                airQualityData={data} 
                trafficData={data} 
              />
            </div>
          </div>

          <div className="graphs-container">
            <div className="dashboard-section">
              <h2>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 3v18m0-18c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
                </svg>
                Air Quality Monitoring
              </h2>
              <div className="chart-container">
                <LineChart 
                  width={600} 
                  height={300} 
                  data={visibleData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    ticks={visibleData.map(item => item.timestamp).filter((_, index, array) => 
                      index % Math.ceil(array.length / 10) === 0
                    )}
                    label={{ value: 'Date', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    yAxisId="pm"
                    label={{ 
                      value: 'Particulate Matter (µg/m³)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const date = new Date(label);
                        return (
                          <div className="chart-tooltip">
                            <p className="timestamp">
                              {`${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`}
                            </p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {`${entry.name}: ${entry.value.toFixed(2)} µg/m³`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      const labels = {
                        'pm2_5': 'PM2.5 (Fine particles)',
                        'pm10': 'PM10 (Coarse particles)'
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Line 
                    yAxisId="pm"
                    type="monotone" 
                    dataKey="pm2_5" 
                    name="pm2_5" 
                    stroke="#8884d8" 
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="pm"
                    type="monotone" 
                    dataKey="pm10" 
                    name="pm10" 
                    stroke="#82ca9d" 
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </div>
            </div>

            <div className="dashboard-section">
              <h2>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M18 4v16H6V4h12m1-2H5c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1h14c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 11H6v2h12v-2zm0-4H6v2h12V9zm0-4H6v2h12V5z"/>
                </svg>
                Traffic Monitoring
              </h2>
              <div className="chart-container">
                <LineChart 
                  width={600} 
                  height={300} 
                  data={visibleData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="timestamp" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                    ticks={visibleData.map(item => item.timestamp).filter((_, index, array) => 
                      index % Math.ceil(array.length / 10) === 0
                    )}
                    label={{ value: 'Date', position: 'bottom', offset: 0 }}
                  />
                  <YAxis 
                    yAxisId="duration"
                    orientation="left"
                    label={{ 
                      value: 'Duration (minutes)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <YAxis 
                    yAxisId="distance"
                    orientation="right"
                    label={{ 
                      value: 'Distance (km)', 
                      angle: 90, 
                      position: 'insideRight',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const date = new Date(label);
                        return (
                          <div className="chart-tooltip">
                            <p className="timestamp">
                              {`${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`}
                            </p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {`${entry.name}: ${entry.value.toFixed(2)} ${entry.name.includes('Duration') ? 'min' : 'km'}`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    formatter={(value) => {
                      const labels = {
                        'duration_in_traffic_min': 'Traffic Duration',
                        'distance_km': 'Travel Distance'
                      };
                      return labels[value] || value;
                    }}
                  />
                  <Line 
                    yAxisId="duration"
                    type="monotone" 
                    dataKey="duration_in_traffic_min" 
                    name="duration_in_traffic_min" 
                    stroke="#8884d8" 
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="distance"
                    type="monotone" 
                    dataKey="distance_km" 
                    name="distance_km" 
                    stroke="#82ca9d" 
                    dot={false}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Key Metrics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>Average PM2.5</h4>
                <div className="value">
                  {visibleData.length > 0 
                    ? (visibleData.reduce((acc, curr) => acc + curr.pm2_5, 0) / visibleData.length).toFixed(2)
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="metric-card">
                <h4>Average PM10</h4>
                <div className="value">
                  {visibleData.length > 0 
                    ? (visibleData.reduce((acc, curr) => acc + curr.pm10, 0) / visibleData.length).toFixed(2)
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="metric-card">
                <h4>Average Traffic Duration</h4>
                <div className="value">
                  {visibleData.length > 0 
                    ? (visibleData.reduce((acc, curr) => acc + curr.duration_in_traffic_min, 0) / visibleData.length).toFixed(0)
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="metric-card">
                <h4>Average Distance</h4>
                <div className="value">
                  {visibleData.length > 0 
                    ? (visibleData.reduce((acc, curr) => acc + curr.distance_km, 0) / visibleData.length).toFixed(1)
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
