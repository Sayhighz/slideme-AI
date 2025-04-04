// ฟังก์ชันสำหรับจัดรูปแบบข้อมูล (ดึงมาจาก components เดิม)

// จัดรูปแบบตัวเลขให้มี comma คั่น
export const formatNumberWithCommas = (number) => {
    if (isNaN(number)) return number;
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // จัดรูปแบบตัวเลขให้เป็นค่าเงิน
  export const formatCurrency = (number) => {
    if (number == null || isNaN(number)) return "฿0.00";
    return `฿${Number(number)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };
  
  // ตัดข้อความยาวให้สั้นลง
  export const truncateText = (text, maxLength = 8) => {
    if (!text) return "";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };
  
  // จัดรูปแบบวันที่
  export const formatDate = (date) => {
    if (!date) return "ไม่พบข้อมูล";
    return new Date(date).toISOString().split("T")[0];
  };