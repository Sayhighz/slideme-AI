// src/services/OCRService.js - Updated with better error handling
import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { OCR_API_KEY } from '../config';

// OCR Service สำหรับการอ่านข้อมูลจากรูปภาพด้วย API
class OCRService {
  constructor() {
    this.API_BASE_URL = 'https://api.iapp.co.th';
    this.API_KEY = OCR_API_KEY; // ในการใช้งานจริงควรเก็บใน environment variables หรือ config
    this.TIMEOUT = 30000; // 30 วินาที
  }

  // แปลงไฟล์เป็น FormData
  async createFormData(uri, apiEndpoint) {
    // ตรวจสอบว่า uri ถูกต้องหรือไม่
    if (!uri) {
      throw new Error('URI ของรูปภาพไม่ถูกต้อง');
    }

    try {
      // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('ไม่พบไฟล์รูปภาพ');
      }

      // สำหรับ Android จำเป็นต้องทำการอ่านไฟล์เป็น base64 เพื่อไม่ให้เกิดปัญหา
      if (Platform.OS === 'android') {
        try {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return this._createFormDataFromBase64(base64, apiEndpoint);
        } catch (readError) {
          console.error('Error reading file as base64:', readError);
          // ถ้าเกิดข้อผิดพลาดในการอ่านเป็น base64 ให้ลองส่ง URI โดยตรง
          return this._createFormDataFromUri(uri, apiEndpoint);
        }
      }

      // สำหรับ iOS สามารถส่ง URI ได้โดยตรง
      return this._createFormDataFromUri(uri, apiEndpoint);
    } catch (error) {
      console.error('Error creating form data:', error);
      throw new Error(`ไม่สามารถเตรียมข้อมูลรูปภาพได้: ${error.message}`);
    }
  }

  // แปลงข้อมูล URI เป็น FormData
  _createFormDataFromUri(uri, apiEndpoint) {
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
          timeout: this.TIMEOUT,
        }
      );

      console.log('Thai ID Card OCR Response:', JSON.stringify(response.data, null, 2));

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
            issueDate: this._formatDateForInput(response.data.th_issue),
            address: response.data.address || '',
            province: response.data.province || '',
            district: response.data.district || '',
            subDistrict: response.data.sub_district || '',
            postalCode: response.data.postal_code || '',
            houseNo: response.data.house_no || '',
            villageNo: response.data.village_no || '',
            formattedAddress: thaiAddress,
            faceImage: response.data.face || null,
            documentType: 'thai_id_card',
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
        error: this._formatErrorMessage(error),
      };
    }
  }

  // ใช้ API OCR เพื่ออ่านข้อมูลจากใบขับขี่ไทย
  async readThaiDriverLicense(uri) {
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
          timeout: this.TIMEOUT,
        }
      );

      console.log('Driver License OCR Response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.status_code === 200) {
        // แยกชื่อและนามสกุลจากชื่อเต็ม
        const nameParts = this._extractNameParts(response.data.th_name);
        
        return {
          success: true,
          data: {
            idNumber: response.data.id_no || '',
            firstName: nameParts.firstName,
            lastName: nameParts.lastName,
            title: nameParts.title,
            fullName: response.data.th_name || '',
            birthDate: this._formatDateForInput(response.data.th_dob),
            expireDate: this._formatDateForInput(response.data.th_expiry),
            issueDate: this._formatDateForInput(response.data.th_issue),
            licenseNumber: response.data.th_license_no || '',
            licenseType: response.data.th_type || '',
            registrar: response.data.registrar || '',
            documentType: 'thai_driver_license',
            fullData: response.data
          }
        };
      } else {
        console.error('ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้:', response.data.message || 'ไม่ทราบสาเหตุ');
        return {
          success: false,
          error: response.data.message || 'ไม่สามารถอ่านข้อมูลจากใบขับขี่ได้',
        };
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอ่านใบขับขี่:', error);
      return {
        success: false,
        error: this._formatErrorMessage(error),
      };
    }
  }

  // ใช้ API เพื่ออ่านข้อมูลจากป้ายทะเบียนรถ
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
          timeout: this.TIMEOUT,
        }
      );

      console.log('License Plate OCR Response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.status === 200) {
        // ดึงชื่อจังหวัดจากข้อมูล province
        let provinceName = '';
        if (response.data.province) {
          const provinceMatch = response.data.province.match(/\((.*?)\)/);
          provinceName = provinceMatch ? provinceMatch[1] : '';
        }
        
        return {
          success: true,
          data: {
            licensePlate: response.data.lp_number || '',
            province: provinceName,
            vehicleType: response.data.vehicle_body_type || '',
            vehicleColor: response.data.vehicle_color || '',
            vehicleBrand: response.data.vehicle_brand || '',
            vehicleModel: response.data.vehicle_model || '',
            documentType: 'license_plate',
            fullData: response.data
          }
        };
      } else {
        console.error('ไม่สามารถอ่านข้อมูลจากป้ายทะเบียนได้:', response.data.message || 'ไม่ทราบสาเหตุ');
        return {
          success: false,
          error: response.data.message || 'ไม่สามารถอ่านข้อมูลจากป้ายทะเบียนได้',
        };
      }
    } catch (error) {
      console.error('เกิดข้อผิดพลาดในการอ่านป้ายทะเบียน:', error);
      return {
        success: false,
        error: this._formatErrorMessage(error),
      };
    }
  }

  // ฟอร์แมตข้อความข้อผิดพลาด
  _formatErrorMessage(error) {
    if (error.response) {
      // ข้อผิดพลาดจาก API response
      return error.response.data?.message || error.response.data?.error || 'เกิดข้อผิดพลาดจาก API';
    } else if (error.request) {
      // ข้อผิดพลาดจากการเชื่อมต่อ
      if (error.code === 'ECONNABORTED') {
        return 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองอีกครั้ง';
      }
      return 'ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    } else {
      // ข้อผิดพลาดอื่นๆ
      return error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }
  }

  // แปลงวันที่ไทยเป็นรูปแบบ YYYY-MM-DD
  _formatDateForInput(thaiDate) {
    if (!thaiDate) return '';
    
    const thaiMonths = {
      'ม.ค.': '01', 'มกราคม': '01',
      'ก.พ.': '02', 'กุมภาพันธ์': '02',
      'มี.ค.': '03', 'มีนาคม': '03',
      'เม.ย.': '04', 'เมษายน': '04',
      'พ.ค.': '05', 'พฤษภาคม': '05',
      'มิ.ย.': '06', 'มิถุนายน': '06',
      'ก.ค.': '07', 'กรกฎาคม': '07',
      'ส.ค.': '08', 'สิงหาคม': '08',
      'ก.ย.': '09', 'กันยายน': '09',
      'ต.ค.': '10', 'ตุลาคม': '10',
      'พ.ย.': '11', 'พฤศจิกายน': '11',
      'ธ.ค.': '12', 'ธันวาคม': '12'
    };

    try {
      // รูปแบบ: '15 ม.ค. 2540' หรือ '1 มีนาคม 2530'
      const parts = thaiDate.split(' ');
      if (parts.length < 3) return '';

      const day = parts[0].padStart(2, '0');
      
      // หาค่าเดือนจากชื่อเดือนภาษาไทย
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

  // แยกชื่อ นามสกุล และคำนำหน้าจากชื่อเต็ม
  _extractNameParts(fullName) {
    if (!fullName) {
      return { title: '', firstName: '', lastName: '' };
    }
    
    // รูปแบบปกติ: "นาย ไอแอพพ์ เทคโนโลยี"
    const parts = fullName.split(' ');
    
    // คำนำหน้า
    const title = parts.length > 0 ? parts[0] : '';
    
    // ชื่อจริง
    const firstName = parts.length > 1 ? parts[1] : '';
    
    // นามสกุล - รวมทุกส่วนที่เหลือหลังจากชื่อจริง (กรณีที่นามสกุลมีช่องว่าง)
    const lastName = parts.length > 2 ? parts.slice(2).join(' ') : '';
    
    return { title, firstName, lastName };
  }

  // ตรวจสอบว่า API พร้อมใช้งานหรือไม่
  async checkAPIStatus() {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/health`, {
        timeout: 5000,
        headers: {
          'apikey': this.API_KEY
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('API status check failed:', error.message);
      return false;
    }
  }
}

export default new OCRService();