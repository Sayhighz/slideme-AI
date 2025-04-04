// Export all services
import { getRequest, postRequest, putRequest, deleteRequest, uploadFile } from './api';
import { login, register, checkAuth, logout } from './auth';
import { 
  requestLocationPermission, 
  getCurrentLocation, 
  updateDriverLocation, 
  startLocationTracking 
} from './location';
import ChatService from './ChatService';

export {
  // API service
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
  uploadFile,
  
  // Auth service
  login,
  register,
  checkAuth,
  logout,
  
  // Location service
  requestLocationPermission,
  getCurrentLocation,
  updateDriverLocation,
  startLocationTracking,
  
  // Chat service
  ChatService
};