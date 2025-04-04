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
    default:
      return {
        text: status,
        color: 'text-gray-500'
      };
  }
};

// Format job details for display
export const formatJobDetails = (job) => ({
  ...job,
  formattedOrigin: truncateText(job.location_from, 20),
  formattedDestination: truncateText(job.location_to, 20),
  formattedPrice: formatNumberWithCommas(job.profit),
  statusInfo: formatJobStatus(job.status)
});