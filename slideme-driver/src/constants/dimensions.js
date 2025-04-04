import { Dimensions, StatusBar, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device dimensions and common spacing
export const DIMENSIONS = {
  // Screen dimensions
  SCREEN_WIDTH: width,
  SCREEN_HEIGHT: height,
  
  // Responsive scales
  SCALE: width / 375, // Based on iPhone 6/7/8 width
  VERTICAL_SCALE: height / 667, // Based on iPhone 6/7/8 height
  
  // Status bar height
  STATUS_BAR_HEIGHT: Platform.OS === 'ios' 
    ? 20 
    : StatusBar.currentHeight,
  
  // Common spacing
  SPACING: {
    XS: 4,
    S: 8,
    M: 16,
    L: 24,
    XL: 32,
    XXL: 40,
  },
  
  // Common sizes
  ICON_SIZE: {
    SMALL: 16,
    MEDIUM: 24,
    LARGE: 32,
  },
  
  // Common border radius
  BORDER_RADIUS: {
    SMALL: 4,
    MEDIUM: 8,
    LARGE: 12,
    ROUNDED: 24,
    CIRCLE: 9999,
  },
};