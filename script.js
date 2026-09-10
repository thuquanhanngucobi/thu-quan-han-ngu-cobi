const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

/* =========================================================
   CẤU HÌNH
========================================================= */
const TANGTHU_CONFIG = {
  spreadsheetId: '18gAWVFIUoHNjr9xYbuqNWXgTXkzsiDjug8r0yxgSCx8',
  apiUrl: 'https://script.google.com/macros/s/AKfycbzzHWX5KbhanlXDKIDpY3YLmQlhagNpx8MJ8sF-LiVCv1jIsZun1svZaqzRBuCu47KHYA/exec',
  duLacHien: 'https://thuquanhanngucobi.github.io/cobi-du-lac-hien/',
  khaoThiDuong: 'https://thuquanhanngucobi.github.io/cobi-khao-thi-duong/'
};

/* =========================================================
   TIỆN ÍCH
========================================================= */
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[char]));

function toast(message) {
  if (!toastEl) {
    alert(message);
    return;
  }
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

// Hàm đọc Audio tự động qua Web Speech API
function speak(text) {
  if (!('speechSynthesis' in window)) {
    toast('Trình duyệt không hỗ trợ đọc tiếng Trung.');
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text || ''));
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85; // Tốc độ đọc vừa phải, dễ nghe
  speechSynthesis.speak(utterance);
}

/* =========================================================
   DEVICE ID (CƠ CHẾ BẢO MẬT)
========================================================= */
function getDeviceId() {
  let id = localStorage.getItem('cobi_device_id');
  if (!id) {
    const cryptoObj = window.crypto;
    id = cryptoObj?.randomUUID ? cryptoObj.randomUUID() : `cobi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('cobi_device_id', id);
  }
  return id;
}

/* =========================================================
   APPS SCRIPT (DÙNG CHO NGỮ PHÁP / BÀI ĐỌC CÓ PASS)
========================================================= */
async function api(action, code = '') {
  if (!TANGTHU_CONFIG.apiUrl || TANGTHU_CONFIG.apiUrl.includes('DÁN_')) {
    throw new Error('Chưa cấu hình Web App URL.');
  }
  let response;
  try {
    response = await fetch(TANGTHU_CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, code: code, deviceId: getDeviceId() })
    });
  } catch (error) {
    console.error('Lỗi kết nối Apps Script:', error);
    throw new Error('Không thể kết nối máy chủ Tàng Thư Các.');
  }
  if (!response.ok) throw new Error(`Máy chủ trả về lỗi ${response.status}.`);
  let result;
  try {
    result = await response.json();
  } catch (error) {
    throw new Error('Máy chủ trả về dữ liệu không hợp lệ.');
  }
  if (!result.success) throw new Error(result.message || 'Không có quyền truy cập.');
  return result;
}

/* =========================================================
   TẢI TỪ VỰNG BẰNG GOOGLE SHEETS JSONP (KHÔNG PASS)
========================================================= */
/* =========================================================
   TẢI TỪ VỰNG BẰNG APPS SCRIPT API (ỔN ĐỊNH HƠN)
========================================================= */
async function loadVocabFromGoogleSheet() {
  try {
    // Gọi thẳng vào nhánh doGet(action='getVocab') trong code.gs của bạn
    const url = TANGTHU_CONFIG.apiUrl + '?action=getVocab';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Lỗi kết nối máy chủ: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Lỗi tải dữ liệu từ vựng.');
    }
    
    return result.data; // Trả về mảng dữ liệu
  } catch (error) {
    console.error('Lỗi lấy Từ vựng:', error);
    throw new Error('Không thể tải dữ liệu TUVUNG. Bạn hãy kiểm tra lại kết nối mạng.');
  }
}
/* =========================================================
   TÀNG THƯ CÁC SYSTEM
========================================================= */
function normalizeKey(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeRow(row) {
  const out = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    out[normalizeKey(key)] = value ?? '';
  });
  return out;
}

function hskNumber(value) {
  const match = String(value ?? '').match(/HSK\s*([1-6])/i);
  return match ? match[1] : '';
}

function hskLabel(value) {
  const n = hskNumber(value);
  return n ? `HSK ${n}` : String(value ?? '').trim();
}

const HSK_FILTERS = ['all', '1', '2', '3', '4', '5', '6'];

function renderHskFilters(current) {
  return `
    <div class="tt-hsk-filters">
      ${HSK_FILTERS.map(value => `
        <button type="button" class="group-chip ${current === value ? 'active' : ''}" data-hsk-filter="${value}">
          ${value === 'all' ? 'Tất cả' : `HSK ${value}`}
        </button>
      `).join('')}
    </div>
  `;
}

const CoBiTangThu = (() => {
  const S = {
    tab: 'vocab',
    groups: [],
    groupId: '',
    words: [],
    filtered: [],
    visible: 50,
    current: 0,
    study: false,
    learned: {},
    grammar: null,
    reading: null,
    grammarFilter: 'all',
    readingFilter: 'all',
    grammarSearch: '', // Thêm trạng thái search cho ngữ pháp
    currentReading: null // Trạng thái lưu bài đọc đang xem chi tiết
  };

  function itemKey(group, index) { return `cobi_${group}_${index}`; }

  /* ===================== TẢI TỪ VỰNG ===================== */
  async function loadVocab() {
    const rows = await loadVocabFromGoogleSheet(); // ĐÃ FIX LỖI LỒNG HÀM TẠI ĐÂY
    const map = new Map();

    rows.forEach((rawRow, index) => {
      const row = normalizeRow(rawRow);
      const id = String(row.ID || '').trim();
      const hanzi = String(row.TUVUNG || '').trim();

      if (!id || !hanzi) return;
      if (!map.has(id)) {
        map.set(id, { id: id, title: hskLabel(id), items: [] });
      }

      map.get(id).items.push({
        id: itemKey(id, index),
        hanzi: hanzi,
        pinyin: String(row.PINYIN || '').trim(),
        meaning: String(row.NGHIA || '').trim(),
        example: String(row.VIDU || '').trim()
      });
    });

    S.groups = Array.from(map.values());
    S.groups.sort((a, b) => {
      const na = Number(hskNumber(a.id) || 99);
      const nb = Number(hskNumber(b.id) || 99);
      return na - nb || a.id.localeCompare(b.id);
    });

    if (!S.groupId || !S.groups.some(group => group.id === S.groupId)) {
      S.groupId = S.groups[0]?.id || '';
    }
    setGroup(S.groupId, false);
  }

  function setGroup(id, rerender = true) {
    S.groupId = id;
    const group = S.groups.find(item => item.id === id);
    S.words = group?.items || [];
    S.filtered = [...S.words];
    S.visible = 50;
    S.current = 0;
    S.study = false;
    if (rerender) renderContent();
  }

  /* ===================== GIAO DIỆN CHÍNH ===================== */
  function render() {
    app.innerHTML = `
      <section class="page tangthu-page">
        <div class="section-title">
          <span class="cn">藏书阁</span>
          <span class="vi">Tàng Thư Các</span>
        </div>
        <div class="tangthu-tabs">
          <button class="tangthu-tab ${S.tab === 'vocab' ? 'active' : ''}" data-tab="vocab">Từ vựng</button>
          <button class="tangthu-tab ${S.tab === 'grammar' ? 'active' : ''}" data-tab="grammar">Ngữ pháp</button>
          <button class="tangthu-tab ${S.tab === 'reading' ? 'active' : ''}" data-tab="reading">Bài đọc</button>
        </div>
        <div id="tangthu-content">
          <div class="card"><div class="notice">Đang tải Tàng Thư Các...</div></div>
        </div>
      </section>
    `;

    document.querySelectorAll('.tangthu-tab').forEach(button => {
      button.onclick = () => switchTab(button.dataset.tab);
    });
    renderContent();
  }

  function switchTab(tab) {
    S.tab = tab;
    render();
    if (tab === 'vocab') {
      if (!S.groups.length) {
        loadVocab().then(renderContent).catch(err => error(document.getElementById('tangthu-content'), err.message));
      }
      return;
    }
    unlock(tab);
  }

  function renderContent() {
    const box = document.getElementById('tangthu-content');
    if (!box) return;
    if (S.tab === 'vocab') { renderVocab(box); return; }
    if (S.tab === 'grammar') { 
      if (S.grammar) renderGrammar(box); else unlock('grammar');
      return; 
    }
    if (S.tab === 'reading') {
      if (S.reading) renderReading(box); else unlock('reading');
    }
  }

  /* ===================== TAB TỪ VỰNG ===================== */
  function renderVocab(box) {
    if (!S.groups.length) {
      box.innerHTML = `<div class="card"><div class="notice">Đang tải Từ vựng...</div></div>`;
      loadVocab().then(renderContent).catch(err => error(box, err.message));
      return;
    }
    if (S.study) {
      renderStudy(box);
      return;
    }

    const group = S.groups.find(item => item.id === S.groupId) || S.groups[0];

    box.innerHTML = `
      <div class="card">
        <div class="group-list">
          ${S.groups.map(item => `
            <button class="group-chip ${item.id === group.id ? 'active' : ''}" data-group="${esc(item.id)}">
              ${esc(item.title)} <small>${item.items.length}</small>
            </button>
          `).join('')}
        </div>
      </div>
      <div class="vocab-search-row">
        <input id="tt-search" class="vocab-search" placeholder="Tìm chữ Hán, pinyin hoặc nghĩa...">
        <span class="vocab-count">${S.words.length} từ</span>
      </div>
      <div class="vocab-table-wrap">
        <table class="vocab-table">
          <thead><tr><th>#</th><th>汉字</th><th>Pinyin</th><th>Nghĩa</th><th>Ví dụ</th><th>Hành động</th></tr></thead>
          <tbody id="tt-body"></tbody>
        </table>
      </div>
      <div class="tangthu-more">
        <button class="btn secondary" id="tt-more">XEM THÊM</button>
      </div>
    `;

    document.querySelectorAll('[data-group]').forEach(btn => {
      btn.onclick = () => setGroup(btn.dataset.group);
    });

    const search = document.getElementById('tt-search');
    if (search) {
      search.oninput = e => {
        const query = e.target.value.trim().toLowerCase();
        S.filtered = S.words.filter(word => 
          [word.hanzi, word.pinyin, word.meaning, word.example].join(' ').toLowerCase().includes(query)
        );
        S.visible = 50;
        fillVocab();
      };
    }

    const more = document.getElementById('tt-more');
    if (more) {
      more.onclick = () => { S.visible += 50; fillVocab(); };
    }
    fillVocab();
  }

  function fillVocab() {
    const body = document.getElementById('tt-body');
    const more = document.getElementById('tt-more');
    if (!body) return;

    body.innerHTML = S.filtered.slice(0, S.visible).map((word, index) => `
      <tr class="${S.learned[word.id] ? 'learned' : ''}">
        <td>${index + 1}</td>
        <td class="hanzi-cell">${esc(word.hanzi)}</td>
        <td>${esc(word.pinyin)}</td>
        <td>${esc(word.meaning)}</td>
        <td>${esc(word.example)}</td>
        <td>
          <button class="icon-btn" data-speak="${esc(word.hanzi)}" title="Nghe">🔊</button>
          <button class="icon-btn" data-study="${esc(word.id)}" title="Học thẻ">Thẻ lật</button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-speak]').forEach(btn => {
      btn.onclick = () => speak(btn.dataset.speak);
    });

    document.querySelectorAll('[data-study]').forEach(btn => {
      btn.onclick = () => {
        const index = S.words.findIndex(w => w.id === btn.dataset.study);
        if (index >= 0) {
          S.current = index;
          S.study = true;
          renderContent();
        }
      };
    });

    if (more) more.style.display = S.visible < S.filtered.length ? 'inline-flex' : 'none';
  }

  /* ===================== FLASHCARD (HỌC TỪ) ===================== */
  function renderStudy(box) {
    const word = S.words[S.current];
    if (!word) { S.study = false; renderVocab(box); return; }

    box.innerHTML = `
      <div class="study-wrap">
        <div class="study-index">${S.current + 1} / ${S.words.length}</div>
        <div id="tt-flip" class="flip-card">
          <div class="flip-inner">
            <!-- MẶT TRƯỚC: HÁN TỰ + NGHĨA + NÚT NGHE -->
            <div class="flip-face flip-front">
              <div class="front-label">NHÌN CHỮ HÁN</div>
              <div class="study-hanzi">${esc(word.hanzi)}</div>
              <div class="study-meaning" style="background: none; margin: 10px 0; padding: 0;">${esc(word.meaning)}</div>
              <button class="speak-btn" id="tt-speak">🔊 Nghe phát âm</button>
              <div class="flip-hint">Chạm vào thẻ để lật mặt sau</div>
            </div>
            
            <!-- MẶT SAU: HÁN TỰ NHỎ + PINYIN + NGHĨA + VÍ DỤ -->
            <div class="flip-face flip-back">
              <div class="front-label">MẶT SAU</div>
              <div class="study-hanzi small">${esc(word.hanzi)}</div>
              <div class="study-pinyin">${esc(word.pinyin)}</div>
              <div class="study-meaning">${esc(word.meaning)}</div>
              ${word.example ? `
                <div class="example-box">
                  <div class="example-label">CÂU VÍ DỤ</div>
                  <div class="example-cn">${esc(word.example)}</div>
                  <button class="speak-example" id="tt-example">🔊 Nghe câu ví dụ</button>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <button class="flip-button" id="tt-flip-btn">↻ Lật thẻ</button>
        <div class="study-actions">
          <button class="btn secondary" id="tt-prev" ${S.current === 0 ? 'disabled' : ''}>← Từ trước</button>
          <button class="btn red" id="tt-learn">${S.learned[word.id] ? '✓ Đã học' : 'Đánh dấu đã học'}</button>
          <button class="btn secondary" id="tt-next">Từ tiếp →</button>
        </div>
        <div class="back-row">
          <button class="btn secondary" id="tt-list">← Trở về danh sách</button>
        </div>
      </div>
    `;

    const flip = () => document.getElementById('tt-flip')?.classList.toggle('flipped');
    document.getElementById('tt-flip')?.addEventListener('click', flip);
    document.getElementById('tt-flip-btn')?.addEventListener('click', flip);
    
    document.getElementById('tt-speak')?.addEventListener('click', e => { e.stopPropagation(); speak(word.hanzi); });
    if(word.example) {
       document.getElementById('tt-example')?.addEventListener('click', e => { e.stopPropagation(); speak(word.example); });
    }

    document.getElementById('tt-prev')?.addEventListener('click', () => { if (S.current > 0) { S.current--; renderContent(); } });
    document.getElementById('tt-next')?.addEventListener('click', () => { S.current = (S.current + 1) % S.words.length; renderContent(); });
    
    document.getElementById('tt-learn')?.addEventListener('click', () => {
      S.learned[word.id] = true;
      localStorage.setItem('cobi_tangthu_learned', JSON.stringify(S.learned));
      renderContent();
    });
    
    document.getElementById('tt-list')?.addEventListener('click', () => { S.study = false; renderContent(); });
  }

  /* ===================== KHÓA NGỮ PHÁP / BÀI ĐỌC ===================== */
  async function unlock(type) {
    const box = document.getElementById('tangthu-content');
    if (!box) return;
    const title = type === 'grammar' ? 'Ngữ pháp' : 'Bài đọc';

    box.innerHTML = `
      <div class="card">
        <div class="notice">Nội dung ${title} được bảo vệ.</div>
        <button class="btn red" id="tt-unlock">Nhập mã truy cập</button>
      </div>
    `;

    document.getElementById('tt-unlock')?.addEventListener('click', async () => {
      const code = prompt(`Nhập mã truy cập ${title}:`);
      if (!code) return;

      box.innerHTML = `<div class="card"><div class="notice">Đang xác thực mã...</div></div>`;
      try {
        await api('login', code.trim());
        const result = await api(type === 'grammar' ? 'getGrammar' : 'getReading', code.trim());
        
        if (type === 'grammar') {
          S.grammar = (result.data || []).map(normalizeRow);
        } else {
          S.reading = (result.data || []).map(normalizeRow);
        }
        renderContent();
      } catch (err) {
        box.innerHTML = `
          <div class="card">
            <div class="notice">${esc(err.message)}</div>
            <button class="btn secondary" id="tt-retry">Thử lại</button>
          </div>
        `;
        document.getElementById('tt-retry')?.addEventListener('click', () => unlock(type));
      }
    });
  }

  /* ===================== TAB NGỮ PHÁP (CÓ THANH TÌM KIẾM) ===================== */
  function renderGrammar(box) {
    if (!S.grammar?.length) {
      box.innerHTML = `<div class="card"><div class="notice">Chưa có dữ liệu ngữ pháp.</div></div>`;
      return;
    }

    box.innerHTML = `
      <div class="card">${renderHskFilters(S.grammarFilter)}</div>
      <div class="vocab-search-row" style="margin: 15px 0;">
        <input id="tt-grammar-search" class="vocab-search" placeholder="Tìm kiếm điểm ngữ pháp, cấu trúc..." value="${esc(S.grammarSearch)}">
      </div>
      <div id="grammar-container"></div>
    `;

    document.querySelectorAll('[data-hsk-filter]').forEach(btn => {
      btn.onclick = () => { S.grammarFilter = btn.dataset.hskFilter; S.grammarSearch = ''; renderContent(); };
    });

    const searchInp = document.getElementById('tt-grammar-search');
    if (searchInp) {
      searchInp.oninput = e => { S.grammarSearch = e.target.value.trim(); fillGrammar(); };
    }
    fillGrammar();
  }

  function fillGrammar() {
    const container = document.getElementById('grammar-container');
    if (!container) return;

    const rows = S.grammar.map(normalizeRow);
    let filtered = S.grammarFilter === 'all' ? rows : rows.filter(item => hskNumber(item.ID) === S.grammarFilter);
    
    if (S.grammarSearch) {
      const q = S.grammarSearch.toLowerCase();
      filtered = filtered.filter(item => 
        (item.TIEUDE || '').toLowerCase().includes(q) || 
        (item.CAUTRUC || '').toLowerCase().includes(q) || 
        (item.GIAITHICH || '').toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      container.innerHTML = `<div class="card"><div class="notice">Không tìm thấy dữ liệu ngữ pháp phù hợp.</div></div>`;
      return;
    }

    container.innerHTML = `
      <div class="grammar-grid">
        ${filtered.map(item => `
          <article class="card grammar-card">
            <div class="reading-head">
              <span>${esc(hskLabel(item.ID))}</span>
              <h3>${esc(item.TIEUDE)}</h3>
            </div>
            <div class="grammar-structure">${esc(item.CAUTRUC)}</div>
            <p>${esc(item.GIAITHICH)}</p>
            ${item.VIDU ? `
              <div class="example-box">
                <b>例：</b> ${esc(item.VIDU)}
                <button class="icon-btn" onclick="speak('${esc(item.VIDU)}')">🔊</button>
              </div>
            ` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  /* ===================== TAB BÀI ĐỌC (LIST TIÊU ĐỀ -> CHI TIẾT) ===================== */
  function renderReading(box) {
    if (!S.reading?.length) {
      box.innerHTML = `<div class="card"><div class="notice">Chưa có dữ liệu bài đọc.</div></div>`;
      return;
    }

    // Nếu đang chọn 1 bài đọc cụ thể
    if (S.currentReading) {
      renderReadingDetail(box);
      return;
    }

    // Hiển thị danh sách Tiêu đề
    const rows = S.reading.map(normalizeRow);
    const filtered = S.readingFilter === 'all' ? rows : rows.filter(item => hskNumber(item.LEVEL) === S.readingFilter);

    box.innerHTML = `
      <div class="card">${renderHskFilters(S.readingFilter)}</div>
      ${filtered.length ? `
        <div class="reading-grid">
          ${filtered.map((item, index) => `
            <article class="card reading-card" style="cursor:pointer; transition: transform 0.2s;" data-idx="${index}">
              <div class="reading-head">
                <span>${esc(hskLabel(item.LEVEL))}</span>
                <h3>${esc(item.TIEUDE || `Bài đọc ${index + 1}`)}</h3>
              </div>
              <div class="drag-hint">Bấm vào để đọc bài →</div>
            </article>
          `).join('')}
        </div>
      ` : `<div class="card"><div class="notice">Chưa có bài đọc HSK ${esc(S.readingFilter)}.</div></div>`}
    `;

    document.querySelectorAll('[data-hsk-filter]').forEach(btn => {
      btn.onclick = () => { S.readingFilter = btn.dataset.hskFilter; renderContent(); };
    });

    document.querySelectorAll('.reading-card').forEach(card => {
      card.onclick = () => { S.currentReading = filtered[card.dataset.idx]; renderContent(); };
    });
  }

  function renderReadingDetail(box) {
    const item = S.currentReading;
    box.innerHTML = `
      <div class="back-row" style="margin-top: 0;">
        <button class="btn secondary" id="tt-read-back">← Quay lại danh sách bài đọc</button>
      </div>
      <article class="card reading-card">
        <div class="reading-head">
          <span>${esc(hskLabel(item.LEVEL))}</span>
          <h3>${esc(item.TIEUDE || 'Bài đọc')}</h3>
        </div>
        <div class="reading-text" style="font-size: 22px; line-height: 2.2; margin: 25px 0;">
          ${esc(item.TEXT)}
        </div>
        <button class="speak-btn" id="tt-read-speak" style="margin-bottom: 25px;">🔊 Nghe Audio tự động</button>
        
        <div style="display:flex; gap:15px; margin-bottom:20px; border-top: 1px solid var(--line); padding-top: 20px;">
          <button class="btn secondary" id="tt-read-pinyin-btn">Hiện Pinyin</button>
          <button class="btn secondary" id="tt-read-mean-btn">Hiện Nghĩa</button>
        </div>

        <div id="tt-read-pinyin" hidden style="background:#fffdf7; border: 1px dashed #ddd0bb; padding: 15px; font-size: 18px; color: var(--brown-dark); line-height: 1.8; margin-bottom:15px;">
          <strong>Pinyin:</strong><br> ${esc(item.PINYIN)}
        </div>
        
        <div id="tt-read-mean" hidden style="background:#f1e7d5; padding: 15px; font-size: 17px; line-height: 1.8;">
          <strong>Nghĩa tiếng Việt:</strong><br> ${esc(item.NGHIA)}
        </div>
      </article>
    `;

    document.getElementById('tt-read-back').onclick = () => { S.currentReading = null; renderContent(); };
    document.getElementById('tt-read-speak').onclick = () => speak(item.TEXT);
    
    const pBtn = document.getElementById('tt-read-pinyin-btn');
    const pDiv = document.getElementById('tt-read-pinyin');
    pBtn.onclick = () => { pDiv.hidden = !pDiv.hidden; pBtn.textContent = pDiv.hidden ? 'Hiện Pinyin' : 'Ẩn Pinyin'; };
    
    const mBtn = document.getElementById('tt-read-mean-btn');
    const mDiv = document.getElementById('tt-read-mean');
    mBtn.onclick = () => { mDiv.hidden = !mDiv.hidden; mBtn.textContent = mDiv.hidden ? 'Hiện Nghĩa' : 'Ẩn Nghĩa'; };
  }

  /* ===================== HIỂN THỊ LỖI ===================== */
  function error(box, message) {
    if (!box) return;
    box.innerHTML = `
      <div class="card">
        <div class="notice">${esc(message)}</div>
        <button class="btn secondary" id="tt-reload-vocab">Thử tải lại</button>
      </div>
    `;
    document.getElementById('tt-reload-vocab')?.addEventListener('click', () => {
      S.groups = []; S.groupId = ''; S.words = []; S.filtered = []; renderContent();
    });
  }

  async function init() {
    try { S.learned = JSON.parse(localStorage.getItem('cobi_tangthu_learned') || '{}'); } 
    catch (err) { S.learned = {}; }
    render();
    try { await loadVocab(); renderContent(); } 
    catch (err) { error(document.getElementById('tangthu-content'), err.message); }
  }

  return { render: init };
})();

/* =========================================================
   TRANG CHỦ
========================================================= */
function renderHome() {
  app.innerHTML = `
    <section class="page home-page">
      <div class="hero">
        <div class="hero-kicker">漢 · 書 · 語 · 學</div>
        <h1><span class="hero-vn">Thư Quán Hán Ngữ</span><span class="hero-cobi"> CoBi</span></h1>
        <h2>一朝入书馆，一生伴汉语</h2>
        <p>Một ngày nhập Thư Quán, trọn đời hành Hán Ngữ.</p>
        <div class="hero-ornament">— ❖ —</div>
      </div>
      <div class="home-main-grid">
        <a class="home-main-card" href="#knowledge">
          <div class="home-card-symbol">藏</div>
          <div class="home-card-content">
            <h3>Tàng Thư Các</h3>
            <p>Kho tàng kiến thức – Nền tảng vững bền.</p>
            <div class="home-card-cn">知识宝库，坚实基础</div>
          </div>
          <span class="home-card-arrow">进入 →</span>
        </a>
        <a class="home-main-card" href="${TANGTHU_CONFIG.duLacHien}">
          <div class="home-card-symbol">游</div>
          <div class="home-card-content">
            <h3>Du Lạc Hiên</h3>
            <p>Ôn tập – Luyện tập – Học mà vui.</p>
            <div class="home-card-cn">温故练习，学而有乐</div>
          </div>
          <span class="home-card-arrow">进入 →</span>
        </a>
        <a class="home-main-card" href="${TANGTHU_CONFIG.khaoThiDuong}">
          <div class="home-card-symbol">考</div>
          <div class="home-card-content">
            <h3>Khảo Thí Đường</h3>
            <p>Luyện đề – Kiểm tra – Chinh phục HSK.</p>
            <div class="home-card-cn">模拟考试，检验实力</div>
          </div>
          <span class="home-card-arrow">进入 →</span>
        </a>
      </div>
    </section>
  `;
}

/* =========================================================
   ĐIỀU HƯỚNG
========================================================= */
function route() {
  const hash = location.hash.slice(1) || 'home';
  if (hash === 'home' || hash === '') renderHome();
  else if (hash === 'knowledge') CoBiTangThu.render();
  else if (hash.startsWith('review')) window.location.href = TANGTHU_CONFIG.duLacHien;
  else if (hash === 'practice' || hash === 'hsk4') window.location.href = TANGTHU_CONFIG.khaoThiDuong;
  else renderHome();

  document.querySelectorAll('.main-nav a').forEach(link => {
    const routeName = link.dataset.route;
    link.classList.toggle('active', routeName === hash || (routeName === 'review' && hash.startsWith('review')));
  });
}

window.addEventListener('hashchange', route);
route();
