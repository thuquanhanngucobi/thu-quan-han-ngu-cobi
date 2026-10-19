const API_URL = 'https://script.google.com/macros/s/AKfycbw5DDJZeAggOvtvksdO4ioPNJrz5oTXCEGaX-Buvwg8XJLBVlk-S-Fhm0OxdrEWUqEjVQ/exec?action=getVocab';

let allVocab = [];
let filteredVocab = [];
let currentIndex = 0;

const tbody = document.getElementById('vocab-tbody');
const searchInput = document.getElementById('search-input');
const hskFilters = document.getElementById('hsk-filters');
const btnList = document.getElementById('btn-list');
const btnFlashcard = document.getElementById('btn-flashcard');
const viewList = document.getElementById('view-list');
const viewFlashcard = document.getElementById('view-flashcard');

// Nạp dữ liệu từ Google Sheet API
async function fetchVocab() {
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Đang tải dữ liệu từ Thư Quán...</td></tr>';
  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    
    if (result.success && result.data) {
      allVocab = result.data.map(row => ({
        // Tự động nhận diện tên cột theo tiếng Việt có dấu hoặc không dấu
        level: row['Bài học'] || row['ID'] || 'Khác',
        hanzi: row['Hán Tự'] || row['TUVUNG'] || '',
        pinyin: row['Pinyin'] || row['PINYIN'] || '',
        meaning: row['Nghĩa'] || row['NGHIA'] || '',
        example: row['Ví dụ'] || row['VIDU'] || '',
        image: row['Hình ảnh'] || row['HINHANH'] || 'https://images.unsplash.com/photo-1558862107-d49ef2a04d72?q=80&w=600'
      })).filter(item => item.hanzi !== '');

      applyFilters();
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Lỗi tải dữ liệu. Hãy kiểm tra lại API.</td></tr>';
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Lỗi kết nối. Vui lòng tải lại trang.</td></tr>';
  }
}

// Xử lý bộ lọc và tìm kiếm
function applyFilters() {
  const activeChip = hskFilters.querySelector('.chip.active');
  const filterVal = activeChip ? activeChip.textContent.trim().toLowerCase() : '';
  const searchVal = searchInput.value.toLowerCase().trim();

  filteredVocab = allVocab.filter(item => {
    const matchLevel = item.level.toLowerCase().includes(filterVal.replace('hsk ', 'hsk')); // Xử lý khoảng trắng
    const matchSearch = item.hanzi.toLowerCase().includes(searchVal) || 
                        item.pinyin.toLowerCase().includes(searchVal) || 
                        item.meaning.toLowerCase().includes(searchVal);
    
    // Nếu chọn chip HSK nhưng trong sheet ghi "Quyển 1 - BÀI 1", sẽ mặc định hiển thị tất cả nếu không khớp hệ thống HSK
    const finalMatchLevel = filterVal.includes('hsk') && !item.level.toLowerCase().includes('hsk') ? true : matchLevel;

    return finalMatchLevel && matchSearch;
  });

  currentIndex = 0;
  renderTable();
  renderFlashcard();
}

// Cập nhật giao diện Bảng danh sách
function renderTable() {
  if (filteredVocab.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Không tìm thấy từ vựng phù hợp.</td></tr>';
    return;
  }

  tbody.innerHTML = filteredVocab.map((item, index) => `
    <tr>
      <td class="hanzi-col">${item.hanzi}</td>
      <td>${item.pinyin}</td>
      <td>${item.meaning}</td>
      <td>
        <button class="audio-btn small" onclick="playAudio('${item.hanzi}')" style="margin-right: 8px;">🔊</button>
        <button class="audio-btn small" onclick="openFlashcardAt(${index})">Thẻ Lật</button>
      </td>
    </tr>
  `).join('');
}

// Cập nhật giao diện Thẻ lật
function renderFlashcard() {
  if (filteredVocab.length === 0) return;
  const item = filteredVocab[currentIndex];

  document.querySelector('.study-progress').textContent = `Từ ${currentIndex + 1} / ${filteredVocab.length}`;
  
  // Mặt trước
  document.getElementById('card-img').style.backgroundImage = `url('${item.image}')`;
  document.querySelector('.flip-front .hanzi-large').textContent = item.hanzi;
  document.querySelector('.flip-front .pinyin-medium').textContent = item.pinyin;
  document.querySelector('.flip-front .meaning-medium').textContent = item.meaning;
  
  // Mặt sau
  document.querySelector('.flip-back .hanzi-small').textContent = item.hanzi;
  document.querySelector('.example-cn').textContent = item.example || 'Chưa có ví dụ';
  document.querySelector('.example-vi').textContent = ''; // Bổ sung cột dịch ví dụ vào Sheet sau nếu cần
  
  // Gắn sự kiện âm thanh mới
  const btnFrontAudio = document.querySelector('.flip-front .audio-btn');
  const btnBackAudio = document.querySelector('.flip-back .audio-btn');
  
  btnFrontAudio.onclick = (e) => { e.stopPropagation(); playAudio(item.hanzi); };
  btnBackAudio.onclick = (e) => { e.stopPropagation(); playAudio(item.example); };

  // Khôi phục trạng thái chưa lật
  document.getElementById('flashcard').classList.remove('flipped');
}

function openFlashcardAt(index) {
  currentIndex = index;
  renderFlashcard();
  btnFlashcard.click();
}

function playAudio(text) {
  if (!text || text === 'Chưa có ví dụ') return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }
}

// Đăng ký sự kiện (Event Listeners)
searchInput.addEventListener('input', applyFilters);

hskFilters.addEventListener('click', (e) => {
  if (e.target.classList.contains('chip')) {
    hskFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    applyFilters();
  }
});

btnList.addEventListener('click', () => {
  btnList.classList.add('active');
  btnFlashcard.classList.remove('active');
  viewList.style.display = 'block';
  viewFlashcard.style.display = 'none';
});

btnFlashcard.addEventListener('click', () => {
  btnFlashcard.classList.add('active');
  btnList.classList.remove('active');
  viewFlashcard.style.display = 'block';
  viewList.style.display = 'none';
  renderFlashcard();
});

document.getElementById('flashcard').addEventListener('click', function() {
  this.classList.toggle('flipped');
});

document.getElementById('btn-flip').addEventListener('click', () => {
  document.getElementById('flashcard').classList.toggle('flipped');
});

document.getElementById('btn-prev').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderFlashcard();
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  if (currentIndex < filteredVocab.length - 1) {
    currentIndex++;
    renderFlashcard();
  }
});

// Khởi chạy
fetchVocab();