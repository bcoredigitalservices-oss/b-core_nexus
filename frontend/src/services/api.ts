import axios from 'axios';

// Create Axios client targeting your backend core routes
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
});

// Flag to trace if we are currently refreshing token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

// Helper to process queued requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bcore_token') || sessionStorage.getItem('bcore_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to catch 401s and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request has not already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the request was actually trying to refresh the token, don't retry again to avoid infinite loop
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('bcore_refresh_token') || sessionStorage.getItem('bcore_refresh_token');
      
      try {
        // Safe base URL target resolution to handle missing or blank VITE_API_URL variables gracefully
        const baseEndpoint = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';
        
        // Call the refresh endpoint using a fresh axios call (so it doesn't trigger the interceptor itself)
        const response = await axios.post(`${baseEndpoint}/auth/refresh`, {
          refresh_token: refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        });
        
        const { access_token, refresh_token } = response.data;
        
        // Save new access token and refresh token
        const isLocalStorage = !!localStorage.getItem('bcore_token');
        if (isLocalStorage) {
          localStorage.setItem('bcore_token', access_token);
          if (refresh_token) {
            localStorage.setItem('bcore_refresh_token', refresh_token);
          }
        } else {
          sessionStorage.setItem('bcore_token', access_token);
          if (refresh_token) {
            sessionStorage.setItem('bcore_refresh_token', refresh_token);
          }
        }
        
        // Dispatch storage event to notify context if listening
        window.dispatchEvent(new Event('storage'));
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        
        processQueue(null, access_token);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear local storage and tokens instantly to maintain app safety parameters
        localStorage.removeItem('bcore_token');
        localStorage.removeItem('bcore_refresh_token');
        sessionStorage.removeItem('bcore_token');
        sessionStorage.removeItem('bcore_refresh_token');
        
        // Mark session logged out in local storage to prevent boot loop
        localStorage.setItem('bcore_logged_out', '1');
        
        // Force redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
