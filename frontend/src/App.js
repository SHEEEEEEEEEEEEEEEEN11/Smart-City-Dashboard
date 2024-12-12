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
        console.log('Attempting to fetch CSV...');
        // Use relative path instead of process.env.PUBLIC_URL
        const csvUrl = './Merged_Air_Quality_and_Traffic_Data.csv';
        console.log('CSV URL:', csvUrl);
        console.log('Current location:', window.location.href);
        
        const response = await fetch(csvUrl);
        console.log('CSV Response:', response);
        console.log('Response headers:', Object.fromEntries([...response.headers]));
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV Text length:', csvText.length);
        console.log('First 100 chars:', csvText.substring(0, 100));
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            console.log('Parse complete, rows:', results.data.length);
            if (results.errors.length > 0) {
              console.error('Parse errors:', results.errors);
            }
            // Process the last 7 days of data
            const parsedData = results.data
              .filter(row => row.timestamp) // Remove any rows without timestamp
              .map(row => ({
                timestamp: new Date(row.timestamp),
                pm2_5: parseFloat(row.pm2_5),
                pm10: parseFloat(row.pm10),
                no2: parseFloat(row.no2),
                o3: parseFloat(row.o3),
                aqi: parseFloat(row.aqi),
                distance_km: parseFloat(row.distance_km),
                duration_in_traffic_min: parseFloat(row.duration_in_traffic_min)
              }))
              .sort((a, b) => b.timestamp - a.timestamp);

            // Get last 7 days of data
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const filteredData = parsedData.filter(row => row.timestamp >= sevenDaysAgo);

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
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setError('Failed to parse CSV data');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setError('Failed to load CSV data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to calculate average
  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

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
                      tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="duration_in_traffic_min" name="Traffic Density (minutes in traffic)" stroke="#8884d8" />
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
