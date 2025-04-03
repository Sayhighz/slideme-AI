/**
 * Address formatting utilities
 */

/**
 * Format full address from components
 * @param {Object} addressData - Address data object
 * @returns {string} Formatted address string
 */
export const formatFullAddress = (addressData) => {
    if (!addressData) return '';
    
    const {
      address,
      road,
      subdistrict,
      district,
      province,
      postal_code
    } = addressData;
    
    const parts = [];
    
    if (address) parts.push(address);
    if (road) parts.push(road);
    if (subdistrict) parts.push(`แขวง/ตำบล ${subdistrict}`);
    if (district) parts.push(`เขต/อำเภอ ${district}`);
    if (province) parts.push(`จังหวัด ${province}`);
    if (postal_code) parts.push(postal_code);
    
    return parts.join(' ');
  };
  
  /**
   * Format short address for display
   * @param {Object} addressData - Address data object
   * @returns {string} Short formatted address
   */
  export const formatShortAddress = (addressData) => {
    if (!addressData) return '';
    
    const {
      address,
      district,
      province
    } = addressData;
    
    const parts = [];
    
    if (address) parts.push(address);
    if (district) parts.push(district);
    if (province) parts.push(province);
    
    return parts.join(', ');
  };