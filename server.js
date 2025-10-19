const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// In-memory cache
const cache = new Map();
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// In-memory search history
let searchHistory = [];

// Weather endpoint
app.get('/api/weather/:city', async (req, res) => {
  const city = req.params.city;
  
  // Check cache first
  if (cache.has(city)) {
    const cached = cache.get(city);
    if (Date.now() - cached.timestamp < CACHE_TIME) {
      console.log(`✅ Serving ${city} from cache`);
      return res.json({ ...cached.data, cached: true });
    }
  }

  try {
    const API_KEY = process.env.WEATHER_API_KEY || 'f9e1a4d8c2b3e5f7a9d1c3e5b7f9a1d3'; // Demo key
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    
    const data = response.data;
    
    // Store in cache
    cache.set(city, { data, timestamp: Date.now() });
    console.log(`🌍 Fetched fresh data for ${city}`);
    
    res.json(data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'City not found or API error' });
  }
});

// Save search history
app.post('/api/history', (req, res) => {
  const { city } = req.body;
  
  // Remove duplicates and add to front
  searchHistory = searchHistory.filter(item => item.city !== city);
  searchHistory.unshift({ city, timestamp: new Date() });
  
  // Keep only last 10
  if (searchHistory.length > 10) {
    searchHistory = searchHistory.slice(0, 10);
  }
  
  res.json({ success: true });
});

// Get search history
app.get('/api/history', (req, res) => {
  res.json(searchHistory);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💾 Cache enabled (10 min expiry)`);
});