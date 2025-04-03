/**
 * Date formatting utilities for the application
 */

/**
 * Formats a date to Thai locale format
 * @param {Date|string} date - Date to format
 * @param {Object} options - Format options
 * @returns {string} Formatted date string
 */
export const formatThaiDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    });
  };
  
  /**
   * Formats a date to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
   * @param {Date|string} date - Date to format
   * @returns {string} MySQL formatted date string
   */
  export const formatMySQLDate = (date) => {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  /**
   * Formats a date to display format (DD/MM/YYYY)
   * @param {Date|string} date - Date to format
   * @returns {string} Display formatted date
   */
  export const formatDisplayDate = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  /**
   * Formats a date to time string (HH:MM)
   * @param {Date|string} date - Date to format
   * @returns {string} Time string
   */
  export const formatTimeString = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };