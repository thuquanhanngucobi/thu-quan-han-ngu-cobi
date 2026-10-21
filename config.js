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
               {id: "lec-b1", name: "Bài 1: Dòng chảy thời gian", path: "./tang-thu-cac/bai-giang/quyen-1/bai8-time.html" },
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
