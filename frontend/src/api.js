import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',  // Your backend base URL
  headers: {
    'Content-Type': 'application/json', // We will send JSON data
  },
});

export default api;
