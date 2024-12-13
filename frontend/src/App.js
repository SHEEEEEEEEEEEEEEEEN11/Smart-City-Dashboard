import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Grid, Alert, AlertTitle, CircularProgress, Container } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

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
      // Add more device handlers as needed
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
                  <Typography key={index} variant="body2" color="text.secondary">
                    - {action.device}: {action.action} ({action.mode || action.speed || action.level})
                  </Typography>
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
    
    // Process the data
    const processedData = parsedData
      .filter(row => row.timestamp) // Remove any rows without timestamp
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
      });
    
    console.log('Processed data length:', processedData.length);
    
    if (processedData.length === 0) {
      setError('No valid data found after processing');
      return;
    }

    // Sort data by timestamp (newest first)
    const sortedData = processedData.sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate statistics
    const stats = {
      avgPM25: average(sortedData.map(d => d.pm2_5)),
      avgPM10: average(sortedData.map(d => d.pm10)),
      maxPM25: Math.max(...sortedData.map(d => d.pm2_5)),
      maxPM10: Math.max(...sortedData.map(d => d.pm10)),
      minPM25: Math.min(...sortedData.map(d => d.pm2_5)),
      avgNO2: average(sortedData.map(d => d.no2)),
      maxNO2: Math.max(...sortedData.map(d => d.no2)),
      avgO3: average(sortedData.map(d => d.o3)),
      maxO3: Math.max(...sortedData.map(d => d.o3)),
      avgAQI: average(sortedData.map(d => d.aqi)),
      maxAQI: Math.max(...sortedData.map(d => d.aqi)),
      avgDuration: average(sortedData.map(d => d.duration_in_traffic_min)),
      maxDuration: Math.max(...sortedData.map(d => d.duration_in_traffic_min)),
      avgDistance: average(sortedData.map(d => d.distance_km)),
      maxDistance: Math.max(...sortedData.map(d => d.distance_km))
    };

    setData(sortedData);
    setStatistics(stats);
    
    // Generate actuations based on the latest data
    const actuations = generateActuations(sortedData);
    setActuations(actuations);
    
    console.log('Data processing complete:', {
      dataPoints: sortedData.length,
      firstPoint: sortedData[0],
      lastPoint: sortedData[sortedData.length - 1],
      actuations: actuations.length
    });
  }, [generateActuations]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    const csvUrl = '/Merged_Air_Quality_and_Traffic_Data.csv';
    console.log('Loading CSV from:', csvUrl);
    
    fetch(csvUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(csvText => {
        if (!csvText.trim()) {
          throw new Error('CSV file is empty');
        }
        
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('CSV parsing complete:', {
              rows: results.data.length,
              fields: results.meta.fields
            });
            
            if (results.data && results.data.length > 0) {
              processData(results.data);
            } else {
              setError('No data found in CSV');
            }
            setLoading(false);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setError('Failed to parse CSV data: ' + error.message);
            setLoading(false);
          }
        });
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load data');
        setLoading(false);
      });
  }, [processData]);

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          gap: 2 
        }}>
          <CircularProgress size={60} />
          <Typography variant="h6">Loading Smart City Dashboard Data...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          gap: 2 
        }}>
          <Alert severity="error" sx={{ width: '100%', maxWidth: 600 }}>
            {error}
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Please try refreshing the page or contact support if the problem persists.
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!data?.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="warning">
          No data available
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Smart City Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Actuations Section */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ActuationCard 
                  title="Air Quality Actuations" 
                  actuations={actuations.filter(a => a.system === 'air')} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ActuationCard 
                  title="Traffic Actuations" 
                  actuations={actuations.filter(a => a.system === 'traffic')} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <ActuationCard 
                  title="Combined Actuations" 
                  actuations={actuations.filter(a => a.system === 'combined')} 
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Statistics Cards */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 2, bgcolor: '#0D47A1', color: 'white', p: 1 }}>
                Air Quality Monitoring
              </Typography>

              {memoizedCharts}

              <Typography variant="h6" component="h3" gutterBottom>
                Current Readings:
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography>PM2.5: {statistics.avgPM25.toFixed(2)} µg/m³</Typography>
                  <Typography>PM10: {statistics.avgPM10.toFixed(2)} µg/m³</Typography>
                  <Typography>NO2: {statistics.avgNO2.toFixed(2)} ppb</Typography>
                  <Typography>O3: {statistics.avgO3.toFixed(2)} ppb</Typography>
                  <Typography>AQI: {statistics.avgAQI.toFixed(0)}</Typography>
                </>
              )}
            </Paper>
          </Grid>

          {/* Traffic Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 2, bgcolor: '#0D47A1', color: 'white', p: 1 }}>
                Traffic Monitoring
              </Typography>

              <Typography variant="h6" component="h3" gutterBottom>
                Traffic Status:
              </Typography>
              {loading ? (
                <CircularProgress />
              ) : (
                <>
                  <Typography>Current Density: {statistics.avgDuration.toFixed(2)} minutes</Typography>
                  <Typography>Average Distance: {statistics.avgDistance.toFixed(2)} km</Typography>
                  <Typography>Max Duration: {statistics.maxDuration.toFixed(2)} minutes</Typography>
                </>
              )}
            </Paper>
          </Grid>

          {/* Air Quality vs Traffic Correlation Section */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 2, bgcolor: '#0D47A1', color: 'white', p: 1 }}>
                Air Quality vs Traffic Correlation
              </Typography>

              <Box sx={{ height: 400, mb: 4 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Air Quality and Traffic Correlation with Automated Response
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Automated Responses:
                  </Typography>
                  {actuations.map((actuation, index) => (
                    <Alert 
                      key={index} 
                      severity={actuation.type} 
                      sx={{ mb: 1 }}
                    >
                      <AlertTitle>{actuation.title}</AlertTitle>
                      {actuation.message}
                    </Alert>
                  ))}
                </Box>
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
                    <YAxis 
                      yAxisId="air" 
                      label={{ value: 'Air Quality (µg/m³)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="traffic" 
                      orientation="right"
                      label={{ value: 'Traffic Duration (min)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                      }}
                      formatter={(value) => value.toFixed(2)}
                    />
                    <Legend />
                    <Line 
                      yAxisId="air"
                      type="monotone" 
                      dataKey="pm2_5" 
                      name="PM2.5" 
                      stroke="#00BCD4" 
                      dot={false}
                    />
                    <Line 
                      yAxisId="air"
                      type="monotone" 
                      dataKey="pm10" 
                      name="PM10" 
                      stroke="#2196F3" 
                      dot={false}
                    />
                    <Line 
                      yAxisId="traffic"
                      type="monotone" 
                      dataKey="duration_in_traffic_min" 
                      name="Traffic Duration" 
                      stroke="#FF5722" 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default App;
