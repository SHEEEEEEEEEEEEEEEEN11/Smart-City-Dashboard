import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Alert, CircularProgress, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      setError(null);

      // Load the CSV file directly
      fetch('/Merged_Air_Quality_and_Traffic_Data.csv')
        .then(response => response.text())
        .then(csvText => {
          Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            transformHeader: header => header.trim(),
            transform: value => value.trim(),
            error: (error) => {
              console.error('Parsing error:', error);
              setError('Error parsing CSV data: ' + error.message);
              setLoading(false);
            },
            complete: (results) => {
              console.log('CSV Parse Results:', {
                data: results.data.slice(0, 2),
                errors: results.errors,
                meta: results.meta
              });

              if (results.errors.length) {
                console.error('CSV parsing errors:', results.errors);
                setError('Error parsing CSV data');
                setLoading(false);
                return;
              }

              try {
                // Transform the data
                const chartData = results.data
                  .filter(row => row && row.timestamp) // Filter out invalid rows
                  .map(row => {
                    const timestamp = new Date(row.timestamp);
                    if (isNaN(timestamp.getTime())) {
                      console.warn('Invalid timestamp:', row.timestamp);
                      return null;
                    }
                    return {
                      timestamp,
                      pm2_5: parseFloat(row.pm2_5) || 0,
                      pm10: parseFloat(row.pm10) || 0,
                      no2: parseFloat(row.no2) || 0,
                      o3: parseFloat(row.o3) || 0,
                      aqi: parseFloat(row.aqi) || 0,
                      duration: parseFloat(row.duration_in_traffic_min) || 0,
                      distance: parseFloat(row.distance_km) || 0
                    };
                  })
                  .filter(row => row !== null); // Remove invalid rows

                // Sort by timestamp
                chartData.sort((a, b) => a.timestamp - b.timestamp);

                if (chartData.length === 0) {
                  throw new Error('No valid data points found');
                }

                console.log('Processed data:', chartData.slice(0, 2));

                // Calculate statistics
                const stats = {
                  average_aqi: average(chartData.map(d => d.aqi)),
                  max_aqi: Math.max(...chartData.map(d => d.aqi)),
                  min_aqi: Math.min(...chartData.map(d => d.aqi)),
                  average_traffic_duration: average(chartData.map(d => d.duration)),
                  max_traffic_duration: Math.max(...chartData.map(d => d.duration))
                };

                setData(chartData);
                setStatistics(stats);
                setLoading(false);
              } catch (err) {
                console.error('Error processing data:', err);
                setError('Error processing data: ' + err.message);
                setLoading(false);
              }
            }
          });
        })
        .catch(err => {
          console.error('Error loading CSV:', err);
          setError('Failed to load data file: ' + err.message);
          setLoading(false);
        });
    };

    // Helper function to calculate average
    const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;

    loadData();
  }, []);

  const handleTrafficLightControl = async (intersection, action) => {
    try {
      const response = await fetch('/api/actuate/traffic-lights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: intersection,
          action: action
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to control traffic lights');
      }
      
      const result = await response.json();
      console.log('Traffic light control result:', result);
      
      // Show success message
      setAlert({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Error controlling traffic lights:', error);
      setAlert({
        type: 'error',
        message: 'Failed to control traffic lights: ' + error.message
      });
    }
  };

  const handleUpdateSigns = async (road, message) => {
    try {
      const response = await fetch('/api/actuate/signs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: road,
          message: message
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update digital signs');
      }
      
      const result = await response.json();
      console.log('Digital signs update result:', result);
      
      // Show success message
      setAlert({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Error updating digital signs:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update digital signs: ' + error.message
      });
    }
  };

  const handleVentilationControl = async (location, action) => {
    try {
      const response = await fetch('/api/actuate/ventilation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: location,
          action: action
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to control ventilation');
      }
      
      const result = await response.json();
      console.log('Ventilation control result:', result);
      
      // Show success message
      setAlert({
        type: 'success',
        message: result.message
      });
    } catch (error) {
      console.error('Error controlling ventilation:', error);
      setAlert({
        type: 'error',
        message: 'Failed to control ventilation: ' + error.message
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography>Loading data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
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
    <Box sx={{ p: 3 }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center',
          mb: 4,
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          letterSpacing: '0.02em',
          '&::after': {
            content: '""',
            display: 'block',
            width: '60px',
            height: '4px',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            margin: '15px auto',
            borderRadius: '2px'
          }
        }}
      >
        Smart City Command Center
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Debug Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Data points: {data.length}
            </Typography>
          </Box>

          {/* Smart City Controls */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Smart City Controls
            </Typography>
            <Grid container spacing={2}>
              {/* Traffic Light Controls */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }} elevation={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Traffic Light Control
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={() => handleTrafficLightControl('main_intersection', 'extend_green')}
                    >
                      Extend Green Phase
                    </Button>
                    <Button 
                      variant="contained" 
                      color="warning"
                      onClick={() => handleTrafficLightControl('main_intersection', 'reduce_cycle')}
                    >
                      Reduce Cycle Time
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => handleTrafficLightControl('main_intersection', 'normal')}
                    >
                      Normal Operation
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Digital Signs */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }} elevation={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Digital Road Signs
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="error"
                      onClick={() => handleUpdateSigns('main_road', 'HEAVY TRAFFIC AHEAD')}
                    >
                      Traffic Warning
                    </Button>
                    <Button 
                      variant="contained" 
                      color="warning"
                      onClick={() => handleUpdateSigns('main_road', 'POOR AIR QUALITY')}
                    >
                      Air Quality Alert
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => handleUpdateSigns('main_road', 'DRIVE SAFELY')}
                    >
                      Clear Alerts
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Ventilation Systems */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }} elevation={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Ventilation Control
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleVentilationControl('city_center', 'increase')}
                    >
                      Increase Ventilation
                    </Button>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      onClick={() => handleVentilationControl('city_center', 'decrease')}
                    >
                      Decrease Ventilation
                    </Button>
                    <Button 
                      variant="outlined"
                      onClick={() => handleVentilationControl('city_center', 'normal')}
                    >
                      Normal Operation
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Air Quality Metrics
                </Typography>
                <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tickFormatter={timestamp => timestamp.toLocaleString()}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={timestamp => timestamp.toLocaleString()} />
                      <Legend />
                      <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#8884d8" dot={false} />
                      <Line type="monotone" dataKey="pm10" name="PM10" stroke="#82ca9d" dot={false} />
                      <Line type="monotone" dataKey="no2" name="NO2" stroke="#ffc658" dot={false} />
                      <Line type="monotone" dataKey="o3" name="O3" stroke="#ff7300" dot={false} />
                      <Line type="monotone" dataKey="aqi" name="AQI" stroke="#ff0000" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Traffic Metrics
                </Typography>
                <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        tickFormatter={timestamp => timestamp.toLocaleString()}
                      />
                      <YAxis />
                      <Tooltip labelFormatter={timestamp => timestamp.toLocaleString()} />
                      <Legend />
                      <Line type="monotone" dataKey="duration" name="Duration (min)" stroke="#8884d8" dot={false} />
                      <Line type="monotone" dataKey="distance" name="Distance (km)" stroke="#82ca9d" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Statistics */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Air Quality Statistics
                </Typography>
                <Typography>Average AQI: {statistics.average_aqi.toFixed(2)}</Typography>
                <Typography>Max AQI: {statistics.max_aqi.toFixed(2)}</Typography>
                <Typography>Min AQI: {statistics.min_aqi.toFixed(2)}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Traffic Statistics
                </Typography>
                <Typography>Average Duration: {statistics.average_traffic_duration.toFixed(2)} min</Typography>
                <Typography>Max Duration: {statistics.max_traffic_duration.toFixed(2)} min</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default App;
