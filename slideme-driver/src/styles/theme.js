// กำหนดสีที่ใช้ทั่วไปในแอพ
export const colors = {
    primary: '#60B876',
    secondary: '#4682B4',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    black: '#000000',
    gray: {
      100: '#f8f9fa',
      200: '#e9ecef',
      300: '#dee2e6',
      400: '#ced4da',
      500: '#adb5bd',
      600: '#6c757d',
      700: '#495057',
      800: '#343a40',
      900: '#212529'
    }
  };
  
  // กำหนดฟอนต์ที่ใช้ทั่วไปในแอพ
  export const fonts = {
    regular: 'Mitr-Regular',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32
    }
  };
  
  // กำหนดขนาดที่ใช้ทั่วไปในแอพ
  export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40
  };
  
  // กำหนดเงาที่ใช้ทั่วไปในแอพ
  export const shadows = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8
    }
  };
  
  // รวม theme ทั้งหมด
  export const theme = {
    colors,
    fonts,
    spacing,
    shadows
  };