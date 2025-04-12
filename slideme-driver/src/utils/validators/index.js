// ฟังก์ชั่นสำหรับตรวจสอบความถูกต้องของข้อมูล

/**
 * ตรวจสอบรูปแบบอีเมลว่าถูกต้องหรือไม่
 * @param {string} email - อีเมลที่ต้องการตรวจสอบ
 * @returns {boolean} - ผลการตรวจสอบ true หากถูกต้อง
 */
export const isValidEmail = (email) => {
    if (!email) return true; // อีเมลไม่จำเป็นต้องมี
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * ตรวจสอบรูปแบบเบอร์โทรศัพท์ว่าถูกต้องหรือไม่
   * @param {string} phone - เบอร์โทรศัพท์ที่ต้องการตรวจสอบ
   * @returns {boolean} - ผลการตรวจสอบ true หากถูกต้อง
   */
  export const isValidPhone = (phone) => {
    if (!phone) return false;
    // รองรับเบอร์โทรฯ ของไทย (10 หลัก)
    const phoneRegex = /^0\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };
  
  /**
   * ตรวจสอบรูปแบบวันที่ว่าถูกต้องหรือไม่ (YYYY-MM-DD)
   * @param {string} date - วันที่ที่ต้องการตรวจสอบ
   * @returns {boolean} - ผลการตรวจสอบ true หากถูกต้อง
   */
  export const isValidDate = (date) => {
    if (!date) return true; // วันที่ไม่จำเป็นต้องมี
    
    // ตรวจสอบรูปแบบ YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    // แยกวันที่และตรวจสอบความถูกต้อง
    const [year, month, day] = date.split('-').map(Number);
    
    // ตรวจสอบเดือนว่าอยู่ในช่วง 1-12
    if (month < 1 || month > 12) return false;
    
    // ตรวจสอบวันที่ว่าถูกต้องหรือไม่
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;
    
    return true;
  };
  
  /**
   * ตรวจสอบว่าวันที่ที่กำหนดเป็นวันที่ในอนาคตหรือไม่
   * @param {string} date - วันที่ที่ต้องการตรวจสอบ (YYYY-MM-DD)
   * @returns {boolean} - ผลการตรวจสอบ true หากเป็นวันที่ในอนาคต
   */
  export const isFutureDate = (date) => {
    if (!date || !isValidDate(date)) return false;
    
    const inputDate = new Date(date);
    const today = new Date();
    
    // เคลียร์เวลาออกเพื่อเปรียบเทียบเฉพาะวันที่
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    
    return inputDate > today;
  };
  
  /**
   * ตรวจสอบรูปแบบทะเบียนรถว่าถูกต้องหรือไม่
   * @param {string} licensePlate - ทะเบียนรถที่ต้องการตรวจสอบ
   * @returns {boolean} - ผลการตรวจสอบ true หากถูกต้อง
   */
  export const isValidLicensePlate = (licensePlate) => {
    if (!licensePlate) return false;
    
    // ทะเบียนรถควรมีความยาวระหว่าง 5-9 ตัวอักษร
    const cleaned = licensePlate.trim();
    if (cleaned.length < 5 || cleaned.length > 9) return false;
    
    return true;
  };
  
  /**
   * ตรวจสอบว่าข้อมูลในฟอร์มครบถ้วนและถูกต้องหรือไม่
   * @param {Object} formData - ข้อมูลฟอร์มที่ต้องการตรวจสอบ
   * @param {Array} requiredFields - รายการฟิลด์ที่จำเป็นต้องกรอก
   * @returns {Object} - ผลการตรวจสอบ {isValid, errors}
   */
  export const validateForm = (formData, requiredFields = []) => {
    const errors = {};
    
    // ตรวจสอบฟิลด์ที่จำเป็น
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'จำเป็นต้องกรอกข้อมูลนี้';
      }
    });
    
    // ตรวจสอบอีเมล (ถ้ามี)
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    // ตรวจสอบเบอร์โทรศัพท์ (ถ้ามี)
    if ('phone_number' in formData && !isValidPhone(formData.phone_number)) {
      errors.phone_number = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
    }
    
    // ตรวจสอบวันที่หมดอายุใบขับขี่ (ถ้ามี)
    if (formData.id_expiry_date) {
      if (!isValidDate(formData.id_expiry_date)) {
        errors.id_expiry_date = 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)';
      } else if (!isFutureDate(formData.id_expiry_date)) {
        errors.id_expiry_date = 'วันที่หมดอายุต้องเป็นวันที่ในอนาคต';
      }
    }
    
    // ตรวจสอบทะเบียนรถ (ถ้ามี)
    if ('license_plate' in formData && !isValidLicensePlate(formData.license_plate)) {
      errors.license_plate = 'ทะเบียนรถไม่ถูกต้อง';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };