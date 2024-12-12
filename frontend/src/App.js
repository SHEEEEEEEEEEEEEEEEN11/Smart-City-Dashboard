import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Alert, CircularProgress, Container } from '@mui/material';
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading CSV data...');
        
        const csvUrl = process.env.NODE_ENV === 'development' 
          ? '/Merged_Air_Quality_and_Traffic_Data.csv'
          : './Merged_Air_Quality_and_Traffic_Data.csv';
          
        console.log('Fetching CSV from:', csvUrl);
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            console.log('Parsed data:', results);
            if (results.data && results.data.length > 0) {
              processData(results.data);
            } else {
              setError('No data found in CSV');
            }
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError('Failed to parse CSV data');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data: ' + error.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to calculate average
  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const processData = (parsedData) => {
    // Process the last 7 days of data
    const processedData = parsedData
      .filter(row => row.timestamp) // Remove any rows without timestamp
      .map(row => ({
        timestamp: new Date(row.timestamp).getTime(), // Convert to timestamp
        pm2_5: parseFloat(row.pm2_5) || 0,
        pm10: parseFloat(row.pm10) || 0,
        no2: parseFloat(row.no2) || 0,
        o3: parseFloat(row.o3) || 0,
        aqi: parseFloat(row.aqi) || 0,
        distance_km: parseFloat(row.distance_km) || 0,
        duration_in_traffic_min: parseFloat(row.duration_in_traffic_min) || 0
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Get last 7 days of data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const filteredData = processedData.filter(row => row.timestamp >= sevenDaysAgo.getTime());

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

    setData(filteredData);
    setStatistics(stats);
  };

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
          {/* Air Quality Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" component="h2" sx={{ mb: 2, bgcolor: '#0D47A1', color: 'white', p: 1 }}>
                Air Quality Monitoring
              </Typography>

              <Box sx={{ height: 300, mb: 4 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Air Quality Trends (Last 7 Days)
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="pm2_5" name="PM2.5" stroke="#00BCD4" />
                    <Line type="monotone" dataKey="pm10" name="PM10" stroke="#2196F3" />
                    <Line type="monotone" dataKey="no2" name="NO2" stroke="#9C27B0" />
                    <Line type="monotone" dataKey="o3" name="O3" stroke="#4CAF50" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

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

              <Box sx={{ height: 300, mb: 4 }}>
                <Typography variant="h6" align="center" gutterBottom>
                  Traffic Density Trends (Last 7 Days)
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(time) => {
                        const date = new Date(time);
                        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleString();
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="duration_in_traffic_min" 
                      name="Traffic Duration (min)" 
                      stroke="#8884d8" 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>

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
        </Grid>
      </Box>
    </Container>
  );
}

export default App;
