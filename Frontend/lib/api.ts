import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

const getApiUrl = () => {
  if (__DEV__) {
    // If testing in a Web Browser
    if (Platform.OS === 'web') {
      return 'http://localhost:4000/mobile-api';
    }
    
    // Attempt to automatically detect your computer's IP address from Expo
    const debuggerHost = Constants.expoConfig?.hostUri || '';
    const localhost = debuggerHost.split(':').shift();
    
    if (localhost) {
      return `http://${localhost}:4000/mobile-api`;
    }

    // Fallback to the current detected IP: 192.168.0.199
    return 'http://192.168.0.199:4000/mobile-api';
  }
  return 'https://your-production-url.com/mobile-api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Intercept requests to automatically add the auth token (JWT)
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
