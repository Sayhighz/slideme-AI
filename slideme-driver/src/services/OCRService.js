// src/services/OCRService.js
import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { OCR_API_KEY } from '../config';

// OCR Service สำหรับการอ่านข้อมูลจากรูปภาพด้วย API
class OCRService {
  constructor() {
    this.API_BASE_URL = 'https://api.iapp.co.th';
    this.API_KEY = OCR_API_KEY; // ในการใช้งานจริงควรเก็บใน environment variables หรือ config
  }

  // แปลงไฟล์เป็น FormData
  async createFormData(uri, apiEndpoint) {
    // สำหรับ Android จำเป็นต้องทำการอ่านไฟล์เป็น base64 เพื่อไม่ให้เกิดปัญหา
    if (Platform.OS === 'android') {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return this._createFormDataFromBase64(base64, apiEndpoint);
    }

    // สำหรับ iOS สามารถส่ง URI ได้โดยตรง
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : 'jpg';

    formData.append('file', {
      uri,
      name: `photo.${ext}`,
      type: `image/${ext}`,
    });

    return formData;
  }

  // แปลงข้อมูล base64 เป็น FormData (สำหรับ Android)
  _createFormDataFromBase64(base64Data, apiEndpoint) {
    const formData = new FormData();
    formData.append('file', {
      uri: `data:image/jpeg;base64,${base64Data}`,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });
    return formData;
  }

  // ใช้ API OCR เพื่ออ่านข้อมูลจากบัตรประชาชนไทย
  async readThaiIDCard(uri) {
    try {
      const formData = await this.createFormData(uri, 'thai-national-id-card/v3.5/front');
      const response = await axios.post(
        `${this.API_BASE_URL}/thai-national-id-card/v3.5/front`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'apikey': this.API_KEY,
          },
        }
      );

      if (response.data && !response.data.error_message) {
        const thaiAddress = this._parseThaiAddress(response.data);
        
        return {
          success: true,
          data: {
            idNumber: response.data.id_number,
            title: response.data.th_init || '',
            firstName: response.data.th_fname || '',
            lastName: response.data.th_lname || '',
            fullName: response.data.th_name || '',
            birthDate: this._formatDateForInput(response.data.th_dob),
            expireDate: this._formatDateForInput(response.data.th_expire),
            address: response.data.address || '',
            province: response.data.province || '',
            district: response.data.district || '',
            subDistrict: response.data.sub_district || '',
            postalCode: response.data.postal_code || '',
            houseNo: response.data.house_no || '',
            formattedAddress: thaiAddress,
            faceImage: response.data.face || null,
            fullData: response.data
          }
        };
      } else {
        console.error('ไม่สามารถอ่านข้อมูลจากบัตรประชาชนได้:', response.data.error_message || 'ไม่ทราบสาเหตุ');
        return {
          success: false,
          error: response.data.error_message || 'ไม่สามารถอ่านข้อมูลจากบัตรประชาชนได้',
        };
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอ่านบัตรประชาชน:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ API',
      };
    }
  }

  // แปลงวันที่ไทยเป็นรูปแบบ YYYY-MM-DD
  _formatDateForInput(thaiDate) {
    if (!thaiDate) return '';
    
    const thaiMonths = {
      'ม.ค.': '01', 'ก.พ.': '02', 'มี.ค.': '03', 'เม.ย.': '04',
      'พ.ค.': '05', 'มิ.ย.': '06', 'ก.ค.': '07', 'ส.ค.': '08',
      'ก.ย.': '09', 'ต.ค.': '10', 'พ.ย.': '11', 'ธ.ค.': '12'
    };

    try {
      // รูปแบบ: '15 ม.ค. 2540'
      const parts = thaiDate.split(' ');
      if (parts.length !== 3) return '';

      const day = parts[0].padStart(2, '0');
      const month = thaiMonths[parts[1]] || '01';
      
      // แปลงปีพุทธเป็นคริสตศักราช โดยลบ 543
      const yearBE = parseInt(parts[2]);
      const yearCE = yearBE - 543;
      
      return `${yearCE}-${month}-${day}`;
    } catch (e) {
      console.error('เกิดข้อผิดพลาดในการแปลงวันที่:', e);
      return '';
    }
  }

  // จัดรูปแบบที่อยู่ที่อ่านได้จากบัตรประชาชน
  _parseThaiAddress(data) {
    const parts = [];
    
    if (data.house_no) parts.push(`บ้านเลขที่ ${data.house_no}`);
    if (data.village_no) parts.push(`หมู่ ${data.village_no}`);
    if (data.village) parts.push(data.village);
    if (data.lane) parts.push(`ซอย${data.lane}`);
    if (data.alley) parts.push(`ตรอก${data.alley}`);
    if (data.road) parts.push(`ถนน${data.road}`);
    if (data.sub_district) parts.push(`ตำบล/แขวง ${data.sub_district}`);
    if (data.district) parts.push(`อำเภอ/เขต ${data.district}`);
    if (data.province) parts.push(`จังหวัด ${data.province}`);
    if (data.postal_code) parts.push(`รหัสไปรษณีย์ ${data.postal_code}`);
    
    return parts.join(' ');
  }

  // ใช้ API OCR เพื่ออ่านข้อมูลจากใบขับขี่
  async readDriverLicense(uri) {
    try {
      const formData = await this.createFormData(uri, 'thai-driver-license-ocr');
      const response = await axios.post(
        `${this.API_BASE_URL}/thai-driver-license-ocr`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'apikey': this.API_KEY,
          },
        }
      );

      if (response.data && response.data.status_code === 200) {
        return {
          success: true,
          data: {
            firstName: this._extractFirstName(response.data.th_name),
            lastName: this._extractLastName(response.data.th_name),
            idNumber: response.data.id_no,
            licenseNumber: response.data.th_license_no,
            expiryDate: this._formatDateForInput(response.data.th_expiry),
            birthDate: this._formatDateForInput(response.data.th_dob),
            fullData: response.data
          }
        };
      } else {
        console.error('ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้:', response.data);
        return {
          success: false,
          error: 'ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้',
        };
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอ่านใบขับขี่:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ API',
      };
    }
  }

  // ใช้ API OCR เพื่ออ่านข้อมูลจากป้ายทะเบียนรถ
  async readLicensePlate(uri) {
    try {
      const formData = await this.createFormData(uri, 'license-plate-recognition/file');
      const response = await axios.post(
        `${this.API_BASE_URL}/license-plate-recognition/file`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'apikey': this.API_KEY,
          },
        }
      );

      if (response.data && response.data.status === 200) {
        const provinceMatch = response.data.province?.match(/\((.*?)\)/);
        const provinceThai = provinceMatch ? provinceMatch[1] : '';
        
        return {
          success: true,
          data: {
            licensePlate: response.data.lp_number,
            province: provinceThai,
            vehicleType: this._mapVehicleType(response.data.vehicle_body_type),
            vehicleColor: this._mapVehicleColor(response.data.vehicle_color),
            vehicleBrand: response.data.vehicle_brand,
            vehicleModel: response.data.vehicle_model,
            fullData: response.data
          }
        };
      } else {
        console.error('ไม่สามารถอ่านข้อมูลจากป้ายทะเบียนได้:', response.data);
        return {
          success: false,
          error: 'ไม่สามารถอ่านข้อมูลจากป้ายทะเบียนได้',
        };
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอ่านป้ายทะเบียน:', error);
      return {
        success: false,
        error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ API',
      };
    }
  }

  // แยกชื่อจริงจากชื่อเต็ม
  _extractFirstName(fullName) {
    if (!fullName) return '';
    
    // แบ่งชื่อด้วยช่องว่าง หลังจากคำนำหน้า
    const parts = fullName.split(' ');
    if (parts.length < 2) return fullName;
    
    // สำหรับชื่อที่มีคำนำหน้า (นาย/นาง/นางสาว)
    return parts[1] || '';
  }

  // แยกนามสกุลจากชื่อเต็ม
  _extractLastName(fullName) {
    if (!fullName) return '';
    
    const parts = fullName.split(' ');
    if (parts.length < 3) return '';
    
    // นามสกุลคือส่วนสุดท้ายหลังชื่อจริง
    return parts[2] || '';
  }

  // แปลงประเภทรถจาก API ให้ตรงกับประเภทในแอพ
  _mapVehicleType(apiVehicleType) {
    const typeMapping = {
      'sedan': 'standard_slide',
      'pickup': 'heavy_duty_slide',
      'suv': 'standard_slide',
      'van': 'heavy_duty_slide',
      'hatchback': 'standard_slide',
      'tractor-trailer': 'heavy_duty_slide',
      'truck': 'heavy_duty_slide',
      'sports-car': 'luxury_slide',
      'minivan': 'standard_slide',
      'bus': 'heavy_duty_slide'
    };
    
    return typeMapping[apiVehicleType] || 'standard_slide';
  }

  // แปลงสีรถจาก API เป็นภาษาไทย
  _mapVehicleColor(apiColor) {
    const colorMapping = {
      'white': 'ขาว',
      'black': 'ดำ',
      'silver': 'เงิน',
      'gray': 'เทา',
      'red': 'แดง',
      'blue': 'น้ำเงิน',
      'green': 'เขียว',
      'yellow': 'เหลือง',
      'brown': 'น้ำตาล',
      'orange': 'ส้ม',
      'purple': 'ม่วง',
      'gold': 'ทอง'
    };
    
    return colorMapping[apiColor] || apiColor;
  }
}

export default new OCRService();