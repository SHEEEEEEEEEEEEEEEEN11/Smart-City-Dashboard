// API configuration
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : `https://${window.location.hostname}`;
