import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Alert, CircularProgress, Button, Container } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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
    avgDuration: 0,
    maxDuration: 0,
    avgDistance: 0
  });
  const [alert, setAlert] = useState(null);
  const [currentTrafficDuration, setCurrentTrafficDuration] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5000/api/air-traffic-data', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Data points received:', result.data?.timestamps?.length || 0);

        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.data || !result.data.timestamps) {
          throw new Error('Invalid data format received from API');
        }

        // Sample the data to reduce points if too many
        const sampleInterval = Math.ceil(result.data.timestamps.length / 1000); // Limit to 1000 points
        const sampledData = [];
        
        for (let i = 0; i < result.data.timestamps.length; i += sampleInterval) {
          const timestamp = new Date(result.data.timestamps[i]);
          if (!isNaN(timestamp.getTime())) {
            sampledData.push({
              timestamp,
              pm2_5: Number(result.data.pm25[i] || 0),
              pm10: Number(result.data.pm10[i] || 0),
              no2: Number(result.data.no2[i] || 0),
              o3: Number(result.data.o3[i] || 0),
              duration_in_traffic_min: Number(result.data.duration[i] || 0),
              distance_km: Number(result.data.distance[i] || 0)
            });
          }
        }

        if (sampledData.length === 0) {
          throw new Error('No valid data points available');
        }

        console.log('Sampled data points:', sampledData.length);
        console.log('First data point:', sampledData[0]);
        console.log('Last data point:', sampledData[sampledData.length - 1]);

        // Calculate statistics using the full dataset for accuracy
        const stats = {
          avgPM25: result.data.pm25.reduce((sum, val) => sum + Number(val || 0), 0) / result.data.pm25.length,
          avgPM10: result.data.pm10.reduce((sum, val) => sum + Number(val || 0), 0) / result.data.pm10.length,
          maxPM25: Math.max(...result.data.pm25.map(val => Number(val || 0))),
          maxPM10: Math.max(...result.data.pm10.map(val => Number(val || 0))),
          minPM25: Math.min(...result.data.pm25.map(val => Number(val || 0))),
          avgDuration: result.data.duration.reduce((sum, val) => sum + Number(val || 0), 0) / result.data.duration.length,
          maxDuration: Math.max(...result.data.duration.map(val => Number(val || 0))),
          avgDistance: result.data.distance.reduce((sum, val) => sum + Number(val || 0), 0) / result.data.distance.length
        };

        const currentDataPoint = sampledData[sampledData.length - 1];
        setCurrentTrafficDuration(currentDataPoint.duration_in_traffic_min);
        setCurrentDistance(currentDataPoint.distance_km);

        setData(sampledData);
        setStatistics(stats);
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Location Header */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Connaught Place, New Delhi
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                One of Delhi's major financial and commercial hubs, experiencing significant daily traffic and varying air quality levels.
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Latitude:</strong> 28.6289° N
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Longitude:</strong> 77.2065° E
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Elevation:</strong> 216m above sea level
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Air Quality Context Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
              <Typography variant="h6" gutterBottom>
                Delhi Air Quality Context
              </Typography>
              <Typography variant="body2" paragraph>
                Delhi's air quality is influenced by various factors including vehicle emissions, industrial activity, and seasonal changes. 
                The winter months typically see poorer air quality due to temperature inversions and agricultural burning in neighboring regions.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      PM2.5 & PM10 Context
                    </Typography>
                    <Typography variant="body2">
                      These particulate matter measurements are crucial for Delhi, often exceeding WHO guidelines during peak pollution periods.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      NO2 & O3 Impact
                    </Typography>
                    <Typography variant="body2">
                      Vehicle emissions in Connaught Place contribute significantly to NO2 levels, while O3 forms through chemical reactions in sunlight.
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Traffic Patterns
                    </Typography>
                    <Typography variant="body2">
                      As a major business district, CP experiences heavy traffic during peak hours (9-11 AM and 5-8 PM), affecting local air quality.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Smart City Controls */}
          <Grid item xs={12}>
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
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Air Quality Metrics
                </Typography>
                <Box sx={{ height: 450, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 80, left: 20, bottom: 65 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="timestamp"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickFormatter={timestamp => {
                          const date = new Date(timestamp);
                          return `${date.toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric'
                          })} at ${date.toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`;
                        }}
                        interval={Math.ceil(data.length / 12)}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        width={60}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                        labelStyle={{
                          color: '#374151',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: '#6b7280',
                          fontSize: '12px',
                          padding: '2px 0'
                        }}
                        labelFormatter={timestamp => {
                          const date = new Date(timestamp);
                          return `${date.toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric'
                          })} at ${date.toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`;
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        align="center"
                        wrapperStyle={{
                          bottom: -10,
                          fontSize: "12px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "24px"
                        }}
                      />
                      <Line 
                        type="basis" 
                        dataKey="pm2_5" 
                        name="PM2.5" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="basis" 
                        dataKey="pm10" 
                        name="PM10" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="basis" 
                        dataKey="no2" 
                        name="NO2" 
                        stroke="#f43f5e" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="basis" 
                        dataKey="o3" 
                        name="O3" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="basis" 
                        dataKey="aqi" 
                        name="AQI" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false} 
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffffff' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1f2937', mb: 2 }}>
                  Traffic Metrics
                </Typography>
                <Box sx={{ height: 450, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 80, left: 20, bottom: 65 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickFormatter={timestamp => {
                          const date = new Date(timestamp);
                          return date.toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          });
                        }}
                        interval={Math.ceil(data.length / 12)}
                      />
                      <YAxis
                        domain={[0, 20]}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        width={60}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                        labelStyle={{
                          color: '#374151',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: '#6b7280',
                          fontSize: '12px',
                          padding: '2px 0'
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        align="center"
                        wrapperStyle={{
                          bottom: -10,
                          fontSize: "12px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "24px"
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="duration_in_traffic_min"
                        name="Duration (min)"
                        stroke="rgb(99, 102, 241)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="distance_km"
                        name="Distance (km)"
                        stroke="rgb(34, 197, 94)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3, backgroundColor: '#ffffff' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#1f2937', mb: 2 }}>
                  PM10 & Traffic Correlation
                </Typography>
                <Box sx={{ height: 450, width: '100%', position: 'relative' }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 80, left: 20, bottom: 65 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="timestamp"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        tickFormatter={timestamp => {
                          const date = new Date(timestamp);
                          return `${date.toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric'
                          })} at ${date.toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`;
                        }}
                        interval={Math.ceil(data.length / 12)}
                      />
                      <YAxis
                        yAxisId="left"
                        domain={[0, 500]}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        width={60}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 20]}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        stroke="#d1d5db"
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                        labelStyle={{
                          color: '#374151',
                          fontWeight: 600,
                          marginBottom: '4px'
                        }}
                        itemStyle={{
                          color: '#6b7280',
                          fontSize: '12px',
                          padding: '2px 0'
                        }}
                        labelFormatter={timestamp => {
                          const date = new Date(timestamp);
                          return `${date.toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric'
                          })} at ${date.toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}`;
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        align="center"
                        wrapperStyle={{
                          bottom: -10,
                          fontSize: "12px",
                          display: "flex",
                          justifyContent: "center",
                          gap: "24px"
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotoneX"
                        dataKey="pm10"
                        name="PM10"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#6366f1' }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotoneX"
                        dataKey="duration_in_traffic_min"
                        name="Duration (min)"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6, fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Air Quality Statistics
                  </Typography>
                  <Typography>Average PM2.5: {statistics?.avgPM25?.toFixed(2) || '0.00'}</Typography>
                  <Typography>Max PM2.5: {statistics?.maxPM25?.toFixed(2) || '0.00'}</Typography>
                  <Typography>Min PM2.5: {statistics?.minPM25?.toFixed(2) || '0.00'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Traffic Statistics
                  </Typography>
                  <Typography>Average PM10: {statistics?.avgPM10?.toFixed(2) || '0.00'}</Typography>
                  <Typography>Max PM10: {statistics?.maxPM10?.toFixed(2) || '0.00'}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
