(function () {
  const CONFIG = {
    spreadsheetId: '18gAWVFIUoHNjr9xYbuqNWXgTXkzsiDjug8r0yxgSCx8',
    apiUrl: 'https://script.google.com/macros/s/AKfycbzzHWX5KbhanlXDKIDpY3YLmQlhagNpx8MJ8sF-LiVCv1jIsZun1svZaqzRBuCu47KHYA/exec',
    vocabSheet: 'TUVUNG'
  };

  const state = {
    vocab: [],
    groups: [],
    currentGroup: null,
    currentIndex: 0,
    learned: {},
    listLimit: 50,
    search: ''
  };

  const esc = v =>
    String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));

  function sheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(CONFIG.vocabSheet)}`;
  }

  async function loadVocab() {
    if (!CONFIG.spreadsheetId || CONFIG.spreadsheetId.includes('DÁN_')) {
      throw new Error('Chưa nhập Spreadsheet ID trong tangthucac.js');
    }

    const res = await fetch(sheetUrl(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Không đọc được sheet TUVUNG.');

    const text = await res.text();
    const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);

    if (!match) throw new Error('Dữ liệu Google Sheets không đúng định dạng.');

    const json = JSON.parse(match[1]);

    if (json.status !== 'ok') {
      throw new Error('Google Sheets trả về lỗi.');
    }

    const cols = (json.table?.cols || []).map(c => c.label || c.id);

    state.vocab = (json.table?.rows || []).map(row => {
      const obj = {};
      cols.forEach((col, i) => {
        obj[col] = row.c?.[i]?.v ?? '';
      });

      return {
        id: String(obj.ID || '').trim(),
        word: String(obj['TU VUNG'] || '').trim(),
        pinyin: String(obj.PINYIN || '').trim(),
        meaning: String(obj.NGHIA || '').trim(),
        example: String(obj.VIDU || '').trim()
      };
    }).filter(x => x.id && x.word);

    buildGroups();
  }

  function buildGroups() {
    const map = {};

    state.vocab.forEach(item => {
      if (!map[item.id]) {
        map[item.id] = {
          id: item.id,
          title: item.id.toUpperCase(),
          items: []
        };
      }

      map[item.id].items.push(item);
    });

    state.groups = Object.values(map);
  }

  function groupTitle(id) {
    const names = {
      hsk1: 'HSK1 词汇',
      hsk2: 'HSK2 词汇',
      hsk3: 'HSK3 词汇',
      hsk4: 'HSK4 词汇',
      hsk5: 'HSK5 词汇',
      hsk6: 'HSK6 词汇',
      dulich: 'Từ vựng Du lịch',
      kientruc: 'Từ vựng Kiến trúc'
    };

    return names[id.toLowerCase()] || id.toUpperCase();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      toast('Thiết bị này không hỗ trợ đọc tiếng Trung.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.82;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function learnedKey(groupId, index) {
    return `cobi_tangthu_${groupId}_${index}`;
  }

  function isLearned(groupId, index) {
    return !!state.learned[learnedKey(groupId, index)];
  }

  function loadLearned() {
    try {
      state.learned = JSON.parse(
        localStorage.getItem('cobi_tangthu_learned') || '{}'
      );
    } catch {
      state.learned = {};
    }
  }

  function saveLearned() {
    localStorage.setItem(
      'cobi_tangthu_learned',
      JSON.stringify(state.learned)
    );
  }

  function toggleLearned() {
    const group = state.currentGroup;
    const index = state.currentIndex;
    const key = learnedKey(group.id, index);

    if (state.learned[key]) {
      delete state.learned[key];
    } else {
      state.learned[key] = true;
    }

    saveLearned();
    renderStudy();
  }

  function totalLearned(group) {
    return group.items.filter((_, i) => isLearned(group.id, i)).length;
  }

  function render(root) {
    loadLearned();

    root.innerHTML = `
      <section class="page tangthu-page">
        <div class="section-title">
          <span class="cn">藏书阁</span>
          <span class="vi">Tàng Thư Các</span>
        </div>

        <p class="review-intro">
          Kho học liệu Hán Ngữ · dữ liệu được cập nhật từ Google Sheets.
        </p>

        <div id="tangthu-root">
          <div class="card">
            <div class="notice">Đang mở Tàng Thư Các…</div>
          </div>
        </div>
      </section>
    `;

    const box = document.getElementById('tangthu-root');

    loadVocab()
      .then(() => renderGroups(box))
      .catch(error => {
        box.innerHTML = `
          <div class="card">
            <div class="notice">${esc(error.message)}</div>
            <p>Kiểm tra Spreadsheet ID và tên sheet TUVUNG.</p>
          </div>
        `;
      });
  }

  function renderGroups(root) {
    root.innerHTML = `
      <div class="tangthu-group-grid">
        ${state.groups.map(group => `
          <button class="card tangthu-group-card"
                  data-group="${esc(group.id)}">
            <div class="tangthu-symbol">词</div>
            <h3>${esc(groupTitle(group.id))}</h3>
            <p>${group.items.length} từ</p>
            <span class="tangthu-progress">
              Đã học ${totalLearned(group)}/${group.items.length}
            </span>
          </button>
        `).join('')}
      </div>

      <div id="tangthu-content"></div>
    `;

    root.querySelectorAll('[data-group]').forEach(button => {
      button.onclick = () => {
        const group = state.groups.find(
          x => x.id === button.dataset.group
        );

        if (group) {
          state.currentGroup = group;
          state.currentIndex = 0;
          state.listLimit = 50;
          state.search = '';
          renderGroupContent();
        }
      };
    });
  }

  function renderGroupContent() {
    const box = document.getElementById('tangthu-content');
    if (!box || !state.currentGroup) return;

    const group = state.currentGroup;

    box.innerHTML = `
      <div class="tangthu-group-header">
        <div>
          <h2>${esc(groupTitle(group.id))}</h2>
          <p>${group.items.length} từ · Đã học ${totalLearned(group)}/${group.items.length}</p>
        </div>

        <button class="btn secondary" id="tangthu-back">
          ← Danh sách bộ từ
        </button>
      </div>

      <div class="tangthu-toolbar">
        <input
          id="tangthu-search"
          type="search"
          placeholder="Tìm chữ Hán, pinyin hoặc nghĩa…"
        >

        <button class="btn red" id="start-study">
          Học bằng thẻ lật
        </button>
      </div>

      <div id="tangthu-list"></div>
    `;

    document.getElementById('tangthu-back').onclick = () => {
      renderGroups(document.getElementById('tangthu-root'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    document.getElementById('start-study').onclick = () => {
      state.currentIndex = 0;
      renderStudy();
    };

    const search = document.getElementById('tangthu-search');

    search.oninput = () => {
      state.search = search.value.trim().toLowerCase();
      state.listLimit = 50;
      renderList();
    };

    renderList();
  }

  function filteredItems() {
    const q = state.search;

    if (!q) return state.currentGroup.items;

    return state.currentGroup.items.filter(item =>
      [
        item.word,
        item.pinyin,
        item.meaning,
        item.example
      ].join(' ').toLowerCase().includes(q)
    );
  }

  function renderList() {
    const box = document.getElementById('tangthu-list');
    if (!box) return;

    const items = filteredItems();
    const visible = items.slice(0, state.listLimit);

    box.innerHTML = `
      <div class="tangthu-word-list">
        ${visible.map((item, i) => {
          const realIndex = state.currentGroup.items.indexOf(item);

          return `
            <article class="card tangthu-word-row"
                     data-study-index="${realIndex}">

              <div class="tangthu-word-main">
                <div class="tangthu-hanzi">${esc(item.word)}</div>

                <div class="tangthu-pinyin">
                  ${esc(item.pinyin)}
                </div>

                <div class="tangthu-meaning">
                  ${esc(item.meaning)}
                </div>

                ${item.example ? `
                  <div class="tangthu-example">
                    ${esc(item.example)}
                  </div>
                ` : ''}
              </div>

              <button
                class="icon-btn tangthu-speak"
                data-text="${esc(item.word)}"
                title="Nghe">
                🔊
              </button>
            </article>
          `;
        }).join('')}
      </div>

      ${
        visible.length < items.length
          ? `
            <div class="tangthu-more">
              <button class="btn secondary" id="tangthu-more">
                XEM THÊM
              </button>
              <p>Đang hiển thị ${visible.length}/${items.length} từ</p>
            </div>
          `
          : `
            <div class="tangthu-more">
              <p>Đã hiển thị ${items.length}/${items.length} từ</p>
            </div>
          `
      }
    `;

    box.querySelectorAll('[data-study-index]').forEach(row => {
      row.onclick = event => {
        if (event.target.closest('.tangthu-speak')) return;

        state.currentIndex = Number(row.dataset.studyIndex);
        renderStudy();
      };
    });

    box.querySelectorAll('.tangthu-speak').forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        speak(button.dataset.text);
      };
    });

    const more = document.getElementById('tangthu-more');

    if (more) {
      more.onclick = () => {
        state.listLimit += 50;
        renderList();
      };
    }
  }

  function renderStudy() {
    const box = document.getElementById('tangthu-content');
    if (!box || !state.currentGroup) return;

    const group = state.currentGroup;
    const item = group.items[state.currentIndex];

    if (!item) return;

    box.innerHTML = `
      <div class="study-header">
        <button class="btn secondary" id="study-back">
          ← Danh sách từ
        </button>

        <div>
          ${state.currentIndex + 1}/${group.items.length}
        </div>
      </div>

      <div class="tangthu-flashcard-wrap">

        <div class="tangthu-flashcard" id="flashcard">

          <div class="flashcard-face flashcard-front">
            <div class="flashcard-hanzi">
              ${esc(item.word)}
            </div>

            <button
              class="flashcard-audio"
              id="flash-audio"
              title="Nghe">
              🔊
            </button>

            <div class="flashcard-hint">
              Bấm vào thẻ để lật
            </div>
          </div>

          <div class="flashcard-face flashcard-back">

            <div class="flashcard-hanzi small">
              ${esc(item.word)}
            </div>

            <div class="flashcard-pinyin">
              ${esc(item.pinyin)}
            </div>

            <div class="flashcard-meaning">
              ${esc(item.meaning)}
            </div>

            ${
              item.example
                ? `
                  <div class="flashcard-example">
                    ${esc(item.example)}
                  </div>
                `
                : ''
            }

          </div>

        </div>

        <div class="study-actions">
          <button class="btn secondary" id="study-prev">
            ← Trước
          </button>

          <button
            class="btn ${
              isLearned(group.id, state.currentIndex)
                ? 'learned-btn'
                : 'red'
            }"
            id="mark-learned">

            ${
              isLearned(group.id, state.currentIndex)
                ? '✓ Đã học'
                : 'Đánh dấu đã học'
            }

          </button>

          <button class="btn secondary" id="study-next">
            Sau →
          </button>
        </div>

        <div class="study-progress">
          Đã học ${totalLearned(group)}/${group.items.length}
        </div>

      </div>
    `;

    document.getElementById('study-back').onclick =
      renderGroupContent;

    document.getElementById('flashcard').onclick = () => {
      document.getElementById('flashcard').classList.toggle('flipped');
    };

    document.getElementById('flash-audio').onclick = event => {
      event.stopPropagation();
      speak(item.word);
    };

    document.getElementById('mark-learned').onclick =
      toggleLearned;

    document.getElementById('study-prev').onclick = () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        renderStudy();
      }
    };

    document.getElementById('study-next').onclick = () => {
      if (state.currentIndex < group.items.length - 1) {
        state.currentIndex++;
        renderStudy();
      }
    };
  }

  window.CoBiTangThu = {
    CONFIG,
    render
  };
})();
