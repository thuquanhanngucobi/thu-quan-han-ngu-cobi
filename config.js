/* ============================================================
   CẤU HÌNH CHUNG - Thư Quán Hán Ngữ CoBi
   Link API chỉ cần sửa Ở ĐÂY, các trang con tự đọc lại.
   ============================================================ */

// Link triển khai (Deploy) Google Apps Script - KHÔNG kèm "?action=..."
window.COBI_API_URL = 'https://script.google.com/macros/s/AKfycby1TyfXxZVmt2aoSIwOaNXxrrSmOXIHv-CVAU-B_9Xiv-Dxt4LyW2Yd1DSaJIOg4pfUIw/exec';

// Chuẩn hóa tên cột: bỏ dấu, bỏ khoảng trắng, không phân biệt hoa/thường.
// "Hán tự", "HAN TU", "hántự " ... đều thành "hantu".
window.cobiNorm = function (s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Lấy giá trị của một dòng dữ liệu theo danh sách tên cột có thể có.
window.cobiPick = function (row, aliases) {
  const want = aliases.map(window.cobiNorm);
  for (const key of Object.keys(row)) {
    if (want.indexOf(window.cobiNorm(key)) !== -1) {
      const v = row[key];
      if (v !== null && v !== undefined && String(v).trim() !== '') return String(v).trim();
    }
  }
  return '';
};

// Gọi API và trả về mảng dữ liệu. Lỗi sẽ được ném ra kèm thông báo dễ hiểu.
window.cobiFetchSheet = async function (action) {
  const url = window.COBI_API_URL + '?action=' + encodeURIComponent(action) + '&t=' + Date.now();
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error('Không kết nối được máy chủ dữ liệu. Hãy kiểm tra mạng rồi tải lại trang.');
  }
  let json;
  try {
    json = await res.json();
  } catch (e) {
    throw new Error('Link API không trả về dữ liệu đúng. Kiểm tra lại quyền "Anyone" và link /exec trong config.js.');
  }
  if (!json.success) throw new Error(json.message || 'API báo lỗi.');
  return json.data || [];
};

// ============================================================
// CẤU TRÚC MENU
// ============================================================
const COBI_DATA = {
  "tang-thu-cac": {
    title: "Tàng Thư Các",
    modules: [
      { id: "ttc-intro", name: "Giới thiệu Tàng Thư Các", path: "./tang-thu-cac/intro.html" },
      {
        id: "ttc-vocab",
        name: "Hệ thống Từ Vựng",
        subModules: [
          { id: "ttc-v1", name: "1. Thẻ lật Flashcard", path: "./tang-thu-cac/tu-vung/flashcard.html" },
          { id: "ttc-v2", name: "2. Danh sách từ vựng", path: "./tang-thu-cac/tu-vung/danh-sach.html" }
        ]
      },
      {
        id: "ttc-lec",
        name: "Hệ Thống Bài Giảng",
        subModules: [
          { id: "ttc-l1", name: "Quyển 1", path: "./tang-thu-cac/bai-giang/quyen-1/index.html" },
          { id: "lec-b1", name: "Bài 8: Dòng chảy thời gian", path: "./tang-thu-cac/bai-giang/quyen-1/bai8-time.html" },
         { id: "lec-b2", name: "Bài 9: Phương tiện giao thông", path: "./tang-thu-cac/bai-giang/quyen-1/bai9-ptgt.html" },
          { id: "ttc-l2", name: "Quyển 2", path: "./tang-thu-cac/bai-giang/quyen-2/index.html" },
          
        ]
      },
      { id: "ttc-grammar", name: "Hệ thống Ngữ Pháp", path: "./tang-thu-cac/ngu-phap/index.html" }
    ]
  },
  "du-lac-hien": {
    title: "Du Lạc Hiên",
    modules: [
      { id: "dlh-1", name: "Trang chủ Du Lạc Hiên", path: "./cobi-du-lac-hien/index.html" }
    ]
  },
  "khao-thi-duong": {
    title: "Khảo Thí Đường",
    modules: [
      { id: "ktd-1", name: "Trang chủ Khảo Thí Đường", path: "./cobi-khao-thi-duong/index.html" }
    ]
  }
};