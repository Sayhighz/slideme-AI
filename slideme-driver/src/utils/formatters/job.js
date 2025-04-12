import { formatNumberWithCommas, truncateText } from './index';

// Format job status with color
export const formatJobStatus = (status) => {
  switch (status) {
    case 'pending':
      return {
        text: 'รออนุมัติ',
        color: 'text-yellow-500'
      };
    case 'accepted':
      return {
        text: 'อยู่ระหว่างการทำงาน',
        color: 'text-green-500'
      };
    case 'completed':
      return {
        text: 'เสร็จสิ้น',
        color: 'text-blue-500'
      };
    case 'cancelled':
      return {
        text: 'ยกเลิก',
        color: 'text-red-500'
      };
    default:
      return {
        text: status || 'ไม่ระบุ',
        color: 'text-gray-500'
      };
  }
};

// Format job details for display
export const formatJobDetails = (job) => {
  // Max length for location display
  const MAX_LOCATION_LENGTH = 40;

  // Return formatted job details
  return {
    ...job,
    // Format origin with proper truncation
    formattedOrigin: job.location_from 
      ? truncateText(job.location_from, MAX_LOCATION_LENGTH) 
      : 'ไม่ระบุ',
    
    // Format destination with proper truncation
    formattedDestination: job.location_to 
      ? truncateText(job.location_to, MAX_LOCATION_LENGTH) 
      : 'ไม่ระบุ',
    
    // Format price if available
    formattedPrice: job.profit 
      ? formatNumberWithCommas(job.profit) 
      : (job.offered_price 
          ? formatNumberWithCommas(job.offered_price) 
          : null),
    
    // Get status info
    statusInfo: formatJobStatus(job.status),
    
    // Format distance if not already formatted
    formattedDistance: job.distance_text || 
      (typeof job.distance === 'number' 
        ? `${job.distance.toFixed(1)} กม.` 
        : 'ไม่ระบุ')
  };
};