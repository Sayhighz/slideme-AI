// API endpoints
export const API_ENDPOINTS = {
    // ===== Auth =====
    AUTH: {
      LOGIN: '/driver/auth/login',
      REGISTER: '/driver/auth/register_driver',
      CHECK_PHONE: '/driver/auth/check_user_phone',
      CHECK_STATUS: '/driver/auth/check-status',
      RESET_PASSWORD: '/driver/auth/reset-password',
    },
    
    // ===== Driver =====
    DRIVER: {
      PROFILE: {
        GET: '/driver/profile',  // + /{driver_id}
        UPDATE: '/driver/profile/update',
        UPDATE_EXPIRY: '/driver/profile/update-expiry-date',
        GET_VEHICLE_TYPES: '/driver/profile/vehicle-types',
        GET_STATS: '/driver/profile/stats', // + /{driver_id}
        GET_REVIEWS: '/driver/profile/reviews', // + /{driver_id}
        CHECK_APPROVAL: '/driver/profile/approval-status', // + /{driver_id}
      },
      LOCATION: {
        UPDATE: '/driver/location/update',
        GET: '/driver/location', // + /{driver_id}
        NEARBY: '/driver/location/nearby/drivers',
        CALCULATE_DISTANCE: '/driver/location/calculate/distance',
        GET_TRACKING: '/driver/location/tracking', // + /{request_id}/{customer_id}
      },
      EARNINGS: {
        TOTAL: '/driver/earning/total',
        HISTORY: '/driver/earning/history',
        BREAKDOWN: '/driver/earning/breakdown',
        TODAY: '/driver/earning/today',
      },
    },
    
    // ===== Jobs =====
    JOBS: {
      GET_OFFERS: '/driver/offer/list',
      GET_OFFER_DETAILS: '/driver/offer/details',
      GET_OFFER_HISTORY: '/driver/offer/history',
      CREATE_OFFER: '/driver/offer/create',
      CANCEL_OFFER: '/driver/offer/cancel',
      REJECT_ALL_OFFERS: '/driver/offer/reject-all',
      
      GET_AVAILABLE: '/driver/request/available',
      GET_DETAIL: '/driver/request/details',
      GET_ACTIVE: '/driver/request/active', // + /{driver_id}
      COMPLETE_REQUEST: '/driver/request/complete',
      NOTIFY_ARRIVAL: '/driver/request/notify-arrival',
      GET_REQUEST_HISTORY: '/driver/request/history', // + /{driver_id}
      GET_CUSTOMER_INFO: '/driver/request/customer-info',
    },
    
    // ===== Upload =====
    UPLOAD: {
      FETCH_IMAGE: '/upload/fetch_image',
      UPLOAD_BEFORE: '/upload/upload_before_service',
      UPLOAD_AFTER: '/upload/upload_after_service',
    },
    
    // ===== Notification =====
    NOTIFICATION: {
      GET_ALL: '/notification/getAllNotifications',
    },
  };