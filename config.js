/* =====================================================================
   CẤU HÌNH TRUNG TÂM - THƯ QUÁN HÁN NGỮ COBI
   ---------------------------------------------------------------------
   PHẦN 1. COBI_API_URL  : link API Google Apps Script (chỉ sửa ở đây)
   PHẦN 2. COBI_IMAGES   : *** NƠI GẮN LINK ẢNH CỦA BẠN ***
   PHẦN 3. COBI_DATA     : tên menu, mô tả và đường dẫn các trang
   ===================================================================== */


/* ---------------------------------------------------------------------
   PHẦN 1. LINK API (duy nhất)
   --------------------------------------------------------------------- */
const COBI_API_URL = 'https://script.google.com/macros/s/AKfycby1TyfXxZVmt2aoSIwOaNXxrrSmOXIHv-CVAU-B_9Xiv-Dxt4LyW2Yd1DSaJIOg4pfUIw/exec';

async function cobiFetchData(action) {
  const url = COBI_API_URL + '?action=' + encodeURIComponent(action) + '&t=' + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'API báo lỗi');
  return json.data || [];
}


/* ---------------------------------------------------------------------
   PHẦN 2. GẮN ẢNH TẠI ĐÂY
   ---------------------------------------------------------------------
   Cách làm: tạo thư mục  images  ở thư mục gốc GitHub, tải ảnh lên đó,
   rồi dán đường dẫn vào giữa 2 dấu nháy ' ' bên dưới.
   Ví dụ:   background: './images/nen-thuy-mac.jpg',

   Để trống '' = dùng hình vẽ thủy mặc có sẵn của web (không bị lỗi).

   KÍCH THƯỚC ẢNH GỢI Ý:
   - background  : ảnh nền toàn trang, ngang, khoảng 1920 x 1080
   - logo        : logo tròn, vuông, khoảng 256 x 256
   - cards       : ảnh đầu mỗi thẻ, ngang tỉ lệ 3:2, khoảng 900 x 600
   --------------------------------------------------------------------- */
const COBI_IMAGES = {
  background: './img/giaodien/nen.jpg',   // <-- ẢNH NỀN TOÀN TRANG
  logo: '',         // <-- LOGO TRÒN (góc trên bên trái)
  cards: {
    'tang-thu-cac':   './img/giaodien/tangthucac.png',   // <-- ẢNH THẺ 1: Tàng Thư Các (phòng sách)
    'du-lac-hien':    './img/giaodien/dulachien.png',   // <-- ẢNH THẺ 2: Du Lạc Trang Viên (đình, hồ)
    'khao-thi-duong': './img/giaodien/khaothiduong.jpg'    // <-- ẢNH THẺ 3: Khảo Thí Đường (phòng thi)
  }
};


/* ---------------------------------------------------------------------
   PHẦN 3. MENU
   - title / hanzi : tên tiếng Việt và chữ Hán của phân khu
   - modules       : các mục trong phân khu
       name, desc, icon (1 chữ Hán trong vòng tròn), path (trang sẽ mở)
       subModules : danh sách xổ xuống (nếu có)
   - Mục KHÔNG có "desc" (như Giới thiệu) chỉ hiện ở thanh bên, không hiện ở thẻ trang chủ.
   - Trang chưa làm xong: dùng ./coming-soon.html?name=Tên%20Trang
   --------------------------------------------------------------------- */
const COBI_DATA = {
  "tang-thu-cac": {
    title: "Tàng Thư Các",
    hanzi: "藏书阁",
    modules: [
      { id: "ttc-intro", name: "Giới thiệu Tàng Thư Các", path: "./tang-thu-cac/intro.html" },
      {
        id: "ttc-vocab", name: "Biển Từ Mênh Mông", desc: "Từ vựng · Chủ đề · Ví dụ", icon: "词",
        subModules: [
          { id: "ttc-v1", name: "1. Thẻ lật Flashcard", path: "./tang-thu-cac/tu-vung/flashcard.html" },
          { id: "ttc-v2", name: "2. Danh sách từ vựng", path: "./tang-thu-cac/tu-vung/danh-sach.html" }
        ]
      },
      {
        id: "ttc-grammar", name: "Mê Trận Ngự Pháp", desc: "Ngữ pháp · Cấu trúc · Cách dùng", icon: "法",
        path: "./tang-thu-cac/ngu-phap/index.html"
      },
      {
        id: "ttc-skill", name: "Bí Kíp Luyện Công", desc: "Bài giảng · Hán tự · Kỹ năng nền tảng", icon: "功",
        subModules: [
          { id: "ttc-l1", name: "Quyển 1", path: "./tang-thu-cac/bai-giang/quyen-1/index.html" },
          { id: "lec-b1", name: "Bài 8: Dòng chảy thời gian", path: "./tang-thu-cac/bai-giang/quyen-1/bai8-time.html" },
           { id: "lec-b2", name: "Bài 9: Phương tiện giao thông", path: "./tang-thu-cac/bai-giang/quyen-1/bai9-ptgt.html" },
           { id: "lec-b3", name: "Bài 10: Gia đình", path: "./tang-thu-cac/bai-giang/quyen-1/bai10-family.html" },
          { id: "ttc-l2", name: "Quyển 2", path: "./tang-thu-cac/bai-giang/quyen-2/index.html" },
          { id: "ttc-l3", name: "HSK 3", path: "./tang-thu-cac/bai-giang/hsk-3/index.html" }
        ]
      }
    ]
  },
  "du-lac-hien": {
    title: "Du Lạc Trang Viên",
    hanzi: "游乐园",
    modules: [
      { id: "dlh-1", name: "Độc Tu Thất", desc: "Game cá nhân · Tự luyện", icon: "独", path: "./cobi-du-lac-hien/index.html" },
      { id: "dlh-2", name: "Tỉ Thí Đài", desc: "Game thi đua · Cùng lớp", icon: "擂", path: "./coming-soon.html?name=Tỉ%20Thí%20Đài" }
    ]
  },
  "khao-thi-duong": {
    title: "Khảo Thí Đường",
    hanzi: "考试堂",
    modules: [
      { id: "ktd-1", name: "Luyện Khảo Viện", desc: "Luyện dạng bài · Củng cố kỹ năng", icon: "练", path: "./cobi-khao-thi-duong/index.html" },
      { id: "ktd-2", name: "Mô Khảo Viện", desc: "Thi thử toàn đề · Đánh giá năng lực", icon: "模", path: "./coming-soon.html?name=Mô%20Khảo%20Viện" }
    ]
  }
};
