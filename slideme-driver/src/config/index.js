// แยกการ config ออกมา และรวบรวมไว้ที่นี่

// URL ของ API
export const API_URL = "http://xxx.xxx.xxx.xxx:4000"; // แทนที่ด้วย IP address จริง

// URL ของ Socket
export const SOCKET_URL = API_URL;

// ค่า config อื่นๆ ที่ใช้ทั่วไป
export const DEFAULT_TIMEOUT = 30000; // 30 วินาที

// URL สำหรับดึงรูปภาพ
export const IMAGE_URL = `${API_URL}/upload/fetch_image?filename=`;

// ค่าเริ่มต้น
export const DEFAULT_LOCATION = {
  latitude: 13.736717,
  longitude: 100.523186,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421
};

// ประเภทของรถ
export const VEHICLE_TYPES = [
  { label: "รถสไลด์มาตรฐาน", value: "standard_slide" },
  { label: "รถสไลด์ขนาดใหญ่", value: "heavy_duty_slide" },
  { label: "รถสไลด์สำหรับรถหรู", value: "luxury_slide" },
  { label: "รถสไลด์ฉุกเฉิน", value: "emergency_slide" }
];

// ประเภทของจังหวัด
export const PROVINCES = [
  { label: "กรุงเทพมหานคร", value: "bangkok" },
  { label: "เชียงใหม่", value: "chiangmai" },
  { label: "ภูเก็ต", value: "phuket" },
  { label: "ชลบุรี", value: "chonburi" },
  { label: "นครราชสีมา", value: "korat" }
];