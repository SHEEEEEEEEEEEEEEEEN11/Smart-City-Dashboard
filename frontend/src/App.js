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

    // Air Quality Actuations
    if (latestData.pm2_5 > 35) {
      actuations.push({
        type: 'warning',
        title: 'Air Purification',
        message: `High PM2.5 levels (${latestData.pm2_5.toFixed(1)} µg/m³) detected. Activating air purification systems.`,
        system: 'air'
      });
    }

    if (latestData.pm10 > 150) {
      actuations.push({
        type: 'warning',
        title: 'Ventilation',
        message: `High PM10 levels (${latestData.pm10.toFixed(1)} µg/m³) detected. Increasing ventilation rate.`,
        system: 'air'
      });
    }

    if (latestData.aqi > 100) {
      actuations.push({
        type: 'error',
        title: 'Poor Air Quality',
        message: `AQI of ${latestData.aqi.toFixed(0)} detected. Activating emergency ventilation protocols.`,
        system: 'air'
      });
    }

    // Traffic Actuations
    if (latestData.duration_in_traffic_min > 30) {
      actuations.push({
        type: 'warning',
        title: 'Traffic Management',
        message: `Heavy traffic detected (${latestData.duration_in_traffic_min.toFixed(0)} min delay). Adjusting traffic signals.`,
        system: 'traffic'
      });
    }

    if (latestData.duration_in_traffic_min > 45) {
      actuations.push({
        type: 'error',
        title: 'Severe Congestion',
        message: `Severe traffic delay (${latestData.duration_in_traffic_min.toFixed(0)} min). Activating emergency traffic protocols.`,
        system: 'traffic'
      });
    }

    // Combined Actuations
    if (latestData.pm2_5 > 35 && latestData.duration_in_traffic_min > 30) {
      actuations.push({
        type: 'error',
        title: 'Combined Alert',
        message: 'High pollution and traffic levels detected. Implementing combined mitigation strategies.',
        system: 'combined'
      });
    }

    return actuations;
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
    
    // Process the last 7 days of data
    const processedData = parsedData
      .filter(row => row.timestamp) // Remove any rows without timestamp
      .map(row => {
        // Parse the timestamp and keep it in 2024
        const timestamp = new Date(row.timestamp);
        console.log('Original timestamp:', row.timestamp, 'Parsed date:', timestamp);
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
      .filter(row => {
        const rowDate = new Date(row.timestamp);
        const valid = rowDate >= new Date('2024-11-28') && rowDate <= new Date('2024-12-06');
        if (!valid) {
          console.warn('Invalid timestamp:', rowDate);
        }
        return valid;
      });
    
    console.log('After parsing timestamps:', processedData.length);
    console.log('Sample processed row:', processedData[0]);

    // Get data from 26/11/2024 21:48 to 6/12/2024
    const endDate = new Date('2024-12-06');
    const startDate = new Date('2024-11-26T21:48:00');
    startDate.setHours(21, 48, 0, 0);
    
    console.log('Filtering for date range:', {
      from: startDate.toISOString(),
      to: endDate.toISOString()
    });

    const filteredData = processedData.filter(row => {
      const rowDate = new Date(row.timestamp);
      console.log('Row date:', rowDate);
      return rowDate >= startDate && rowDate <= endDate;
    });

    console.log('After date filtering:', filteredData.length);
    if (filteredData.length > 0) {
      console.log('First filtered row:', {
        date: new Date(filteredData[0].timestamp).toISOString(),
        pm2_5: filteredData[0].pm2_5,
        pm10: filteredData[0].pm10,
        duration: filteredData[0].duration_in_traffic_min
      });
      console.log('Last filtered row:', {
        date: new Date(filteredData[filteredData.length - 1].timestamp).toISOString(),
        pm2_5: filteredData[filteredData.length - 1].pm2_5,
        pm10: filteredData[filteredData.length - 1].pm10,
        duration: filteredData[filteredData.length - 1].duration_in_traffic_min
      });
    }

    // Calculate statistics
    const stats = {
      avgPM25: average(filteredData.map(d => d.pm2_5)),
      avgPM10: average(filteredData.map(d => d.pm10)),
      maxPM25: Math.max(...filteredData.map(d => d.pm2_5)),
      maxPM10: Math.max(...filteredData.map(d => d.pm10)),
      minPM25: Math.min(...filteredData.map(d => d.pm2_5)),
      avgNO2: average(filteredData.map(d => d.no2)),
      maxNO2: Math.max(...filteredData.map(d => d.no2)),
      avgO3: average(filteredData.map(d => d.o3)),
      maxO3: Math.max(...filteredData.map(d => d.o3)),
      avgAQI: average(filteredData.map(d => d.aqi)),
      maxAQI: Math.max(...filteredData.map(d => d.aqi)),
      avgDuration: average(filteredData.map(d => d.duration_in_traffic_min)),
      maxDuration: Math.max(...filteredData.map(d => d.duration_in_traffic_min)),
      avgDistance: average(filteredData.map(d => d.distance_km)),
      maxDistance: Math.max(...filteredData.map(d => d.distance_km))
    };

    const sortedData = filteredData.sort((a, b) => b.timestamp - a.timestamp);
    setData(sortedData);

    console.log('Data sorted by timestamp:', sortedData);

    // Generate actuations based on the latest data
    const actuations = generateActuations(sortedData);
    setActuations(actuations);

    setStatistics(stats);
  }, [generateActuations]);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    
    const csvUrl = process.env.PUBLIC_URL + '/Merged_Air_Quality_and_Traffic_Data.csv';
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
            if (results.data && results.data.length > 0) {
              // Filter out invalid rows
              const validData = results.data.filter(row => 
                row.timestamp && 
                !isNaN(parseFloat(row.pm2_5)) && 
                !isNaN(parseFloat(row.pm10))
              );
              
              if (validData.length > 0) {
                console.log('Processing', validData.length, 'valid rows');
                processData(validData);
              } else {
                setError('No valid data found in CSV');
              }
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
