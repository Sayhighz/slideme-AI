// API endpoints
export const API_ENDPOINTS = {
    // ===== Auth =====
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register_driver',
      CHECK_PHONE: '/auth/check_user_phone',
    },
    
    // ===== Driver =====
    DRIVER: {
      PROFILE: '/driver/getinfo',
      UPDATE_PROFILE: '/driver/edit_profile',
      UPDATE_LOCATION: '/driver/update_location',
      SCORE: '/driver/score',
      PROFIT_TODAY: '/driver/profitToday',
      NOTIFICATIONS: '/driver/notifications',
    },
    
    // ===== Jobs =====
    JOBS: {
      GET_OFFERS: '/driver/getOffersFromDriver',
      GET_AVAILABLE: '/request/getRequests',
      GET_DETAIL: '/auth/getRequestDetailForDriver',
      REJECT_ALL_OFFERS: '/driver/reject_all_offers',
      OFFER_PRICE: '/driver/offer_price',
      CANCEL_OFFER: '/driver/cancel_offer',
      COMPLETE_REQUEST: '/auth/complete_request',
    },
    
    // ===== History =====
    HISTORY: {
      GET_HISTORY: '/driver/getHistory',
    },
    
    // ===== Upload =====
    UPLOAD: {
      FETCH_IMAGE: '/upload/fetch_image',
      UPLOAD_BEFORE: '/auth/upload_before_service',
      UPLOAD_AFTER: '/auth/upload_after_service',
    },
  };