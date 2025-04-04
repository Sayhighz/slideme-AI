// Status codes and states
export const STATUS = {
    // Request status
    REQUEST: {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    },
    
    // Offer status
    OFFER: {
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      REJECTED: 'rejected',
      EXPIRED: 'expired',
    },
    
    // Driver status
    DRIVER: {
      AVAILABLE: 'available',
      BUSY: 'busy',
      OFFLINE: 'offline',
    },
    
    // Service states
    SERVICE: {
      NOT_STARTED: 'not_started',
      GOING_TO_PICKUP: 'going_to_pickup',
      AT_PICKUP: 'at_pickup',
      GOING_TO_DROPOFF: 'going_to_dropoff',
      AT_DROPOFF: 'at_dropoff',
      COMPLETED: 'completed',
    },
    
    // Verification status
    VERIFICATION: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
    },
  };