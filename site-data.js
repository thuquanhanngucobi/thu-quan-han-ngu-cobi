/* =====================================================================
   THÔNG TIN THƯ QUÁN  -  CHỈ SỬA TRONG TỆP NÀY
   ---------------------------------------------------------------------
   Trang chủ tự đọc tệp này để hiện: giới thiệu, khóa học, Thư Chủ,
   phản hồi học viên và liên hệ. Không cần đụng vào home.html.

   - Để trống '' hoặc [] = mục đó tự ẩn / hiện dòng "đang cập nhật".
   - Ảnh: tải ảnh vào thư mục  images  trên GitHub rồi ghi đường dẫn,
     ví dụ  './images/thu-chu.jpg'
   ===================================================================== */

/* ---------------------------------------------------------------------
   PHẦN A. AI ĐƯỢC VÀO PHẦN NÀO (không cần đăng nhập)
   Chỉ những "id" trong danh sách này là MỞ CHO MỌI NGƯỜI.
   Tất cả mục còn lại trong menu chỉ dành cho học viên có mã.
   (id lấy từ config.js, ví dụ id: "ttc-vocab")
   --------------------------------------------------------------------- */
const COBI_ACCESS = {
  publicIds: ['ttc-vocab', 'ttc-v1', 'ttc-v2']   // Biển Từ Mênh Mông + 2 mục con
};

/* ---------------------------------------------------------------------
   PHẦN B. THÔNG TIN HIỂN THỊ
   --------------------------------------------------------------------- */
const COBI_SITE = {

  /* Slogan ngay dưới tên Thư Quán */
  slogan: 'Một ngày nhập Thư Quán, Trọn đời hành Hán Ngữ',

  /* Lời chào ở đầu trang. Mỗi dòng trong [ ] là một đoạn. Dòng đầu tiên được in to hơn. */
  welcome: [
    'Hoan nghênh Lữ Khách dừng chân Thư Quán.',
    'Bước qua cánh cửa CoBi Thư Quán, đặt chân vào chốn giang hồ chữ nghĩa.',
    'Ở đây không có gươm đao, chỉ có bút mực; không tranh bá đồ vương, chỉ một lòng truy cầu tri thức.',
    'Con đường Hán Ngữ vốn chẳng dễ dàng, nhưng từng trang sách, từng âm ngữ sẽ mở ra một cảnh giới mới, cho ai đủ kiên tâm theo đuổi.',
    'Lữ khách đã sẵn sàng nhập môn, bắt đầu hành trình tu luyện Hán ngữ, xin mời chọn cảnh giới phù hợp.'
  ],

  /* Liên hệ. Để '' nếu chưa có, mục đó sẽ tự ẩn. */
  contact: {
    phone:    '0905 655 413',
    zalo:     '',                                    // <-- dán link Zalo, ví dụ 'https://zalo.me/0905655413'
    facebook: 'https://www.facebook.com/han.ngu.cobi',
    youtube:  'https://www.youtube.com/@TiếngTrungCoBi',
    address:  'K814 H83B/37 Trần Cao Vân, Thanh Khê, Đà Nẵng'
  },

  /* KHÓA HỌC: mỗi khóa là một khối. Sửa / thêm / xóa tùy ý. */
  courses: [
    {
      name: 'Khối Tân Sinh', hanzi: '新', level: 'Sơ cấp → HSK2',
      short: 'Nhập môn từ con số 0',
      price: '1.999.000đ',
      lessons: '25–32 buổi · 2 buổi/tuần (3–4 tháng)',
      details: [
        ['Giáo trình', 'Msutong Sơ cấp (2 quyển nhập môn), 20 bài'],
        ['Mục tiêu', 'Nắm vững căn cơ, đạt HSK2, giao tiếp thường nhật'],
        ['Học phí', '2.199.000đ; còn 1.999.000đ nếu đăng ký/đặt cọc trước khai giảng'],
        ['Đóng theo tháng', '599.000đ/tháng (8 buổi), không kèm quà tặng'],
        ['Quà tặng', 'Giáo trình, vở tập viết, sổ tay bộ thủ, tài liệu']
      ]
    },
    {
      name: 'Khối Thư Sinh', hanzi: '书', level: 'Từng học HSK1 → HSK2',
      short: 'Lấy lại nền tảng đã quên',
      price: '1.199.000đ',
      lessons: '10–14 buổi · 2 buổi/tuần (1–1,5 tháng)',
      details: [
        ['Đối tượng', 'Người từng chạm Hán ngữ, đạt HSK1 nhưng quên nhiều'],
        ['Giáo trình', 'Msutong Sơ cấp quyển 2, khoảng 10 bài'],
        ['Học phí', '1.199.000đ/khóa'],
        ['Quà tặng', 'Giáo trình, vở tập viết, sổ tay bộ thủ, tài liệu']
      ]
    },
    {
      name: 'Khối Học Sĩ', hanzi: '士', level: 'Đầu vào HSK2 → HSK3',
      short: 'Tiến lên HSK3',
      price: '2.799.000đ',
      lessons: '35–40 buổi · 2 buổi/tuần (4,5–5 tháng)',
      details: [
        ['Giáo trình', 'HSK Chuẩn 3.0'],
        ['Học phí', '2.799.000đ/khóa'],
        ['Đóng theo tháng', '699.000đ/tháng (8 buổi), không kèm quà tặng'],
        ['Quà tặng', 'Giáo trình, vở tập viết, sổ tay bộ thủ, tài liệu (khi đóng trọn khóa)']
      ]
    },
    {
      name: 'Khối Học Tôn', hanzi: '尊', level: 'Hướng tới HSK4',
      short: '3000+ từ, đọc hiểu văn bản dài',
      price: '4.499.000đ',
      lessons: '40–50 buổi · tuần 2 buổi',
      details: [
        ['Giáo trình', 'Hết 2 quyển giáo trình chuẩn 3.0, kèm sách bài tập, luyện HSKK và đề thi'],
        ['Mục tiêu', 'Nắm hơn 3000 từ vựng, đọc hiểu văn bản dài'],
        ['Học phí', '4.499.000đ/khóa'],
        ['Đóng theo tháng', '799.000đ/tháng (8 buổi), không ưu đãi'],
        ['Quà tặng', 'Giáo trình, vở tập viết, sổ tay bộ thủ, tài liệu']
      ]
    },
    {
      name: 'Khối Hiệp Khách', hanzi: '侠', level: 'Giao tiếp cơ bản',
      short: 'Nói lưu loát, không học để thi',
      price: '1.499.000đ',
      lessons: '16 buổi',
      details: [
        ['Nội dung', 'Luyện nói theo tình huống: chào hỏi, mua bán, đi lại, kết bạn, làm việc'],
        ['Điểm nổi bật', 'Câu thoại dùng được ngay, rèn phản xạ nói tự nhiên'],
        ['Học phí', '1.499.000đ/khóa'],
        ['Quà tặng', 'Giáo trình và tài liệu']
      ]
    },
    {
      name: 'Khối Thương Hội', hanzi: '商', level: 'Công sở · Văn phòng · Mua bán',
      short: 'Hán ngữ cho công việc',
      price: 'Liên hệ',
      lessons: 'Liên hệ để biết lịch',
      details: [
        ['Đối tượng', 'Người hướng tới công sở, văn phòng và mua bán'],
        ['Học phí & lịch', 'Vui lòng liên hệ Thư Chủ']
      ]
    },
    {
      name: 'Độc Hành Hán Ngữ', hanzi: '独', level: 'Kèm riêng 1:1 hoặc 1:2',
      short: 'Lộ trình may đo riêng',
      price: 'Liên hệ',
      lessons: 'Gói 10 · 20 · 30 buổi, tự chọn giờ',
      details: [
        ['Hình thức', 'Kèm 1:1, online hoặc học tại Thư Quán'],
        ['Nội dung', 'Thiết kế theo nhu cầu: HSK, giao tiếp, phát âm, viết, thi học bổng, phỏng vấn'],
        ['Cách học', 'Giáo trình, lộ trình chỉnh theo năng lực; mỗi buổi có tài liệu, bài tập và phản hồi riêng'],
        ['Lịch học', 'Tự chọn theo lịch cá nhân'],
        ['Học phí', 'Vui lòng liên hệ Thư Chủ']
      ]
    }
  ],

  /* THƯ CHỦ */
  teacher: {
    title: 'Thư Chủ Hán Ngữ CoBi',
    photo: '',                                   // <-- ảnh chân dung, ví dụ './images/thu-chu.jpg'
    quote: 'Một ngày nhập Thư Quán, trọn đời hành Hán Ngữ.',
    highlights: [
      ['🎓', 'Học bổng toàn phần Đại học Ôn Châu (Chiết Giang, Trung Quốc), nghiên cứu Hán ngữ'],
      ['🏆', 'Giải Ba cuộc thi tiếng Trung do Liên Hợp Quốc tổ chức'],
      ['📜', 'Chứng chỉ nghiệp vụ sư phạm · Học viên ưu tú Đại học Ngôn ngữ Bắc Kinh'],
      ['🏛', 'Cử nhân Du lịch, Đại học Duy Tân (Đà Nẵng)']
    ],
    more: [
      'Trại đông và Nhịp cầu Hán Ngữ tại Đại học Ngôn ngữ Bắc Kinh; Nhịp cầu Hán Ngữ tại Đại học Tài chính Tây Nam',
      'Khóa Văn hóa Trung Quốc tại Đại học Y Dược Chiết Giang; trại hè Học viện Hoa Kiều; khóa ChineseRd',
      'Tình nguyện viên phiên dịch Asiad 19 tại Ôn Châu; xuất hiện trên báo Chinanews',
      'Đại diện quay chương trình văn hóa Trung – Việt'
    ]
  },

  /* PHẢN HỒI HỌC VIÊN
     Mỗi phản hồi: { img: './images/fb1.jpg', name: 'Tên (tùy chọn)', text: 'Lời nhận xét (tùy chọn)' }
     Có thể chỉ dùng ảnh chụp tin nhắn (img), hoặc chỉ dùng text. */
  feedback: [
    // { img: './images/fb1.jpg' },
    // { name: 'Học viên A', text: 'Cô dạy dễ hiểu, mình tiến bộ rõ rệt sau 2 tháng.' }
  ]
};
