/**
 * Common error messages for consistency across the application
 */

export const ERROR_MESSAGES = {
    // Authentication errors
    AUTH: {
      INVALID_CREDENTIALS: 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง',
      UNAUTHORIZED: 'ไม่ได้รับอนุญาตให้เข้าถึง กรุณาเข้าสู่ระบบ',
      FORBIDDEN: 'ไม่มีสิทธิ์เข้าถึงทรัพยากรนี้',
      TOKEN_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง',
      TOKEN_INVALID: 'โทเค็นไม่ถูกต้อง',
      ACCOUNT_NOT_APPROVED: 'บัญชีของคุณยังไม่ได้รับการอนุมัติ',
      ACCOUNT_DISABLED: 'บัญชีของคุณถูกระงับการใช้งาน',
      REGISTRATION_FAILED: 'การลงทะเบียนล้มเหลว'
    },
    
    // Input validation errors
    VALIDATION: {
      REQUIRED_FIELD: 'กรุณากรอกข้อมูลให้ครบทุกช่อง',
      INVALID_EMAIL: 'อีเมลไม่ถูกต้อง',
      INVALID_PHONE: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
      INVALID_DATE: 'วันที่ไม่ถูกต้อง',
      INVALID_COORDINATES: 'พิกัดไม่ถูกต้อง',
      INVALID_PAYMENT: 'ข้อมูลการชำระเงินไม่ถูกต้อง',
      WEAK_PASSWORD: 'รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่รัดกุมกว่านี้',
      PASSWORDS_DONT_MATCH: 'รหัสผ่านไม่ตรงกัน'
    },
    
    // Resource errors
    RESOURCE: {
      NOT_FOUND: 'ไม่พบทรัพยากรที่ต้องการ',
      ALREADY_EXISTS: 'ทรัพยากรนี้มีอยู่แล้ว',
      CREATION_FAILED: 'การสร้างทรัพยากรล้มเหลว',
      UPDATE_FAILED: 'การอัปเดตทรัพยากรล้มเหลว',
      DELETION_FAILED: 'การลบทรัพยากรล้มเหลว'
    },
    
    // Database errors
    DATABASE: {
      CONNECTION_ERROR: 'การเชื่อมต่อกับฐานข้อมูลล้มเหลว',
      QUERY_ERROR: 'เกิดข้อผิดพลาดในการสืบค้นข้อมูล',
      TRANSACTION_ERROR: 'เกิดข้อผิดพลาดในการทำธุรกรรมฐานข้อมูล'
    },
    
    // Request errors
    REQUEST: {
      INVALID_STATUS: 'สถานะคำขอไม่ถูกต้อง',
      ALREADY_ACCEPTED: 'คำขอนี้ได้รับการตอบรับแล้ว',
      ALREADY_COMPLETED: 'คำขอนี้เสร็จสิ้นแล้ว',
      ALREADY_CANCELLED: 'คำขอนี้ถูกยกเลิกแล้ว',
      CANNOT_CANCEL: 'ไม่สามารถยกเลิกคำขอนี้ได้',
      CANNOT_COMPLETE: 'ไม่สามารถทำเครื่องหมายว่าคำขอนี้เสร็จสิ้นได้'
    },
    
    // Payment errors
    PAYMENT: {
      FAILED: 'การชำระเงินล้มเหลว',
      INSUFFICIENT_FUNDS: 'ยอดเงินไม่เพียงพอ',
      INVALID_CARD: 'ข้อมูลบัตรเครดิตไม่ถูกต้อง',
      EXPIRED_CARD: 'บัตรเครดิตหมดอายุ',
      DECLINED: 'ธุรกรรมถูกปฏิเสธโดยธนาคาร'
    },
    
    // File upload errors
    FILE_UPLOAD: {
      INVALID_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',
      TOO_LARGE: 'ไฟล์มีขนาดใหญ่เกินไป',
      UPLOAD_FAILED: 'การอัปโหลดไฟล์ล้มเหลว'
    },
    
    // General errors
    GENERAL: {
      SERVER_ERROR: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
      BAD_REQUEST: 'คำขอไม่ถูกต้อง',
      NOT_IMPLEMENTED: 'ฟีเจอร์นี้ยังไม่พร้อมใช้งาน',
      SERVICE_UNAVAILABLE: 'บริการไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ในภายหลัง',
      TIMEOUT: 'การดำเนินการหมดเวลา กรุณาลองใหม่'
    }
  };
  
  /**
   * Get formatted resource not found message
   * @param {string} resourceName - Name of the resource
   * @returns {string} Formatted error message
   */
  export const getResourceNotFoundMessage = (resourceName) => {
    return `ไม่พบ${resourceName}`;
  };
  
  /**
   * Get formatted validation error message
   * @param {string} fieldName - Name of the field
   * @param {string} errorType - Type of validation error
   * @returns {string} Formatted error message
   */
  export const getValidationErrorMessage = (fieldName, errorType = 'required') => {
    switch (errorType) {
      case 'required':
        return `${fieldName} จำเป็นต้องระบุ`;
      case 'invalid':
        return `${fieldName} ไม่ถูกต้อง`;
      case 'min':
        return `${fieldName} น้อยเกินไป`;
      case 'max':
        return `${fieldName} มากเกินไป`;
      default:
        return `${fieldName} ไม่ถูกต้อง`;
    }
  };