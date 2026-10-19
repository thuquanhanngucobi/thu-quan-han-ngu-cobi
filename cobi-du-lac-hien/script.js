// ====== CẬP NHẬT WEB APP URL CỦA BẠN VÀO ĐÂY ======
const API_URL = "https://script.google.com/macros/s/AKfycbxgJhPz7nwNVwkgh5AqLJaUN9TZKAuAaSUvZk3jpYR0gR8y6XX9YLTWIMIspGYYAZVy/exec"; 

function getDeviceId() {
  let deviceId = localStorage.getItem('cobi_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('cobi_device_id', deviceId);
  }
  return deviceId;
}

window.onload = async function() {
  if(localStorage.getItem('cobi_auth') === 'true') {
    document.getElementById('login-screen').classList.add('hidden');
    await loadGameData();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
  }
};

async function checkLogin() {
  const pass = document.getElementById('pass-input').value.trim();
  const errorText = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');
  if(!pass) return;
  btn.innerText = "Đang kiểm tra..."; btn.disabled = true; errorText.classList.add('hidden');

  try {
    const deviceId = getDeviceId();
    const response = await fetch(API_URL + "?action=login&pass=" + encodeURIComponent(pass) + "&deviceId=" + encodeURIComponent(deviceId));
    const data = await response.json();
    if(data.status === "ok") {
      localStorage.setItem('cobi_auth', 'true');
      localStorage.setItem('cobi_student_name', data.name);
      document.getElementById('login-screen').classList.add('hidden');
      await loadGameData(); 
    } else if (data.status === "wrong_device") {
      errorText.innerText = "Lệnh bài đã dùng trên thiết bị khác."; errorText.classList.remove('hidden');
    } else if (data.status === "locked") {
      errorText.innerText = "Lệnh bài đã bị khóa."; errorText.classList.remove('hidden');
    } else {
      errorText.innerText = "Lệnh bài không chính xác."; errorText.classList.remove('hidden');
    }
  } catch (e) {
    errorText.innerText = "Mất kết nối API."; errorText.classList.remove('hidden');
  }
  btn.innerText = "Xác Nhận"; btn.disabled = false;
}

let gameData = { lessons: [] };
let currentAppMode = ''; 

async function loadGameData() {
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.remove('hidden');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); 

  try {
    const deviceId = getDeviceId();
    const response = await fetch(API_URL + "?action=getData&deviceId=" + encodeURIComponent(deviceId), { signal: controller.signal });
    clearTimeout(timeoutId);
    const res = await response.json();
    
    if(res.status === "ok") {
      gameData.lessons = res.data;
      loadingScreen.classList.add('hidden');
      document.getElementById('mode-select-screen').classList.remove('hidden');
    } 
    else if (res.status === "unauthorized") {
      localStorage.removeItem('cobi_auth');
      localStorage.removeItem('cobi_student_name');
      alert("Lệnh bài của bạn đã bị thu hồi hoặc hết hạn. Vui lòng đăng nhập lại!");
      window.location.reload(); 
    } 
    else {
      alert("Lỗi từ Google Sheets: " + res.message); loadingScreen.classList.add('hidden');
    }
  } catch (e) {
    loadingScreen.classList.add('hidden');
    if (e.name === 'AbortError') alert("Kết nối quá hạn! Vui lòng F5.");
    else alert("Lỗi kết nối.");
  }
}

function showScreen(screenId) {
  const screens = ['mode-select-screen', 'level-select-screen', 'tichtu-game-select', 'game-play-screen', 'nguphap-select-screen', 'np-theory-screen', 'np-practice-screen', 'onco-practice-screen', 'win-message'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  const target = document.getElementById(screenId);
  if(target) target.classList.remove('hidden');
}

function selectMode(mode) {
  currentAppMode = mode;
  if (mode === 'tich_tu') {
    document.getElementById('level-title').innerText = "Tích Từ Tĩnh Thất - Chọn Giáo Trình";
    renderAccordionMenu('tich_tu'); showScreen('level-select-screen');
  } else if (mode === 'ngu_phap') {
    document.getElementById('level-title').innerText = "Ngự Pháp Tĩnh Thất - Chọn Giáo Trình";
    renderAccordionMenu('ngu_phap'); showScreen('level-select-screen');
  } else if (mode === 'on_co') {
    document.getElementById('level-title').innerText = "Ôn Cố Hiên - Chọn Bài Tập";
    renderAccordionMenu('on_co'); showScreen('level-select-screen');
  }
}

function renderAccordionMenu(appMode) {
  const levelList = document.getElementById('level-list'); levelList.innerHTML = ''; let groups = {};

  gameData.lessons.forEach((item, index) => {
    let hasData = false;
    const wCount = item.words ? item.words.length : 0; const sCount = item.sentences ? item.sentences.length : 0;
    const gtCount = item.grammarTheory ? item.grammarTheory.length : 0; const gpCount = item.grammarPractice ? item.grammarPractice.length : 0;
    const ocCount = item.onCoPractice ? item.onCoPractice.length : 0;

    if (appMode === 'tich_tu' && (wCount > 0 || sCount > 0)) hasData = true;
    if (appMode === 'ngu_phap' && (gtCount > 0 || gpCount > 0)) hasData = true;
    if (appMode === 'on_co' && (ocCount > 0)) hasData = true;
    
    if (hasData) {
      const titleUpper = item.title.toUpperCase(); let groupName = "Các bài học khác"; 
      if (titleUpper.includes("Q1") || titleUpper.includes("QUYỂN 1") || titleUpper.includes("MSUTONG 1")) groupName = "Msutong Quyển 1";
      else if (titleUpper.includes("Q2") || titleUpper.includes("QUYỂN 2") || titleUpper.includes("MSUTONG 2")) groupName = "Msutong Quyển 2";
      else if (titleUpper.includes("HSK 1") || titleUpper.includes("HSK1")) groupName = "HSK 1";
      else if (titleUpper.includes("HSK 2") || titleUpper.includes("HSK2")) groupName = "HSK 2";
      else if (titleUpper.includes("HSK 3") || titleUpper.includes("HSK3")) groupName = "HSK 3";

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push({ item, index, wCount, sCount, gtCount, gpCount, ocCount });
    }
  });

  const order = ["Msutong Quyển 1", "Msutong Quyển 2", "HSK 1", "HSK 2", "HSK 3", "Các bài học khác"];

  order.forEach((groupName, i) => {
    if (groups[groupName] && groups[groupName].length > 0) {
      const groupHeader = document.createElement('button');
      groupHeader.className = "w-full scroll-container p-5 mb-3 text-left flex justify-between items-center hover:bg-[#e0ac69] hover:text-white transition font-bold text-xl text-[#5c3d2e]";
      groupHeader.innerHTML = `<span>📚 ${groupName} <span class="text-sm font-normal opacity-80 ml-2">(${groups[groupName].length} bài)</span></span><span id="icon-group-${i}" class="text-2xl transition-transform duration-300">▼</span>`;

      const groupContent = document.createElement('div');
      groupContent.id = `content-group-${i}`;
      groupContent.className = "hidden grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 pl-2 md:pl-6 border-l-4 border-[#b7906c] ml-2";

      groups[groupName].forEach(g => {
        const btn = document.createElement('button');
        btn.className = "p-3 bg-[#fefae0] border-2 border-[#b7906c] rounded text-left hover:bg-[#e0ac69] hover:text-white transition flex justify-between items-center shadow-sm text-[#5c3d2e]";
        btn.onclick = () => selectLevel(g.index);
        let subText = "";
        if (appMode === 'tich_tu') subText = `${g.wCount} từ | ${g.sCount} câu`;
        if (appMode === 'ngu_phap') subText = `${g.gtCount} bí kíp | ${g.gpCount} thực hành`;
        if (appMode === 'on_co') subText = `${g.ocCount} bài tập`;

        btn.innerHTML = `<div><div class="font-bold">${g.item.title}</div><div class="text-xs opacity-75 mt-1">${subText}</div></div><span class="font-bold text-xl ml-2">→</span>`;
        groupContent.appendChild(btn);
      });

      groupHeader.onclick = () => {
        const isHidden = groupContent.classList.contains('hidden');
        if (isHidden) { groupContent.classList.remove('hidden'); document.getElementById(`icon-group-${i}`).style.transform = "rotate(180deg)"; } 
        else { groupContent.classList.add('hidden'); document.getElementById(`icon-group-${i}`).style.transform = "rotate(0deg)"; }
      };
      levelList.appendChild(groupHeader); levelList.appendChild(groupContent);
    }
  });
}

let currentLevel = null;
function selectLevel(index) {
  currentLevel = gameData.lessons[index];
  if (currentAppMode === 'tich_tu') {
    document.getElementById('tt-selected-name').innerText = currentLevel.title;
    const hasSentences = currentLevel.sentences && currentLevel.sentences.length > 0;
    ['btn-game-2', 'btn-game-3'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        if (hasSentences) btn.classList.remove('opacity-50', 'pointer-events-none');
        else btn.classList.add('opacity-50', 'pointer-events-none');
      }
    });
    showScreen('tichtu-game-select');
  } else if (currentAppMode === 'ngu_phap') {
    document.getElementById('np-selected-name').innerText = currentLevel.title;
    const hasTheory = currentLevel.grammarTheory && currentLevel.grammarTheory.length > 0;
    const hasPractice = currentLevel.grammarPractice && currentLevel.grammarPractice.length > 0;
    document.getElementById('btn-np-lythuyet').classList.toggle('opacity-50', !hasTheory);
    document.getElementById('btn-np-lythuyet').classList.toggle('pointer-events-none', !hasTheory);
    document.getElementById('btn-np-thuchanh').classList.toggle('opacity-50', !hasPractice);
    document.getElementById('btn-np-thuchanh').classList.toggle('pointer-events-none', !hasPractice);
    showScreen('nguphap-select-screen');
  } else if (currentAppMode === 'on_co') {
    startOnCoPractice();
  }
}

function speakChinese(text) {
  if (!text) return;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const chineseMatches = text.match(/[\u4e00-\u9fa5，。！？、0-9]+/g);
    const speakText = chineseMatches ? chineseMatches.join('，') : text;
    if (speakText.trim() !== '') {
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.lang = 'zh-CN'; utterance.rate = 0.8; window.speechSynthesis.speak(utterance);
    }
  }
}

function startGame(gameNumber) {
  showScreen('game-play-screen');
  document.getElementById('win-message').classList.add('hidden');
  document.getElementById('win-score-text').innerText = "";
  ['game1-area', 'game2-area', 'game3-area'].forEach(id => document.getElementById(id).classList.add('hidden'));
  matchedCount = 0; 
  if (gameNumber === 1) initGame1(); else if (gameNumber === 2) initGame2(); else if (gameNumber === 3) initGame3();
}

// ================= GAME TÍCH TỪ =================
let selectedG1 = null; let matchedCount = 0; let totalPairs = 0;
function initGame1() {
  document.getElementById('game1-area').classList.remove('hidden'); document.getElementById('game-status').innerText = "1. Ghép Hán tự & Nghĩa";
  const colHanzi = document.getElementById('g1-col-hanzi'); const colMeaning = document.getElementById('g1-col-meaning');
  colHanzi.innerHTML = ''; colMeaning.innerHTML = ''; selectedG1 = null; matchedCount = 0;
  let hanziCards = []; let meaningCards = [];
  currentLevel.words.forEach((w, idx) => {
    hanziCards.push({ id: idx, type: 'hanzi', content: w.hanzi, word: w }); meaningCards.push({ id: idx, type: 'meaning', content: w.meaning, word: w });
  });
  hanziCards.sort(() => Math.random() - 0.5); meaningCards.sort(() => Math.random() - 0.5); totalPairs = currentLevel.words.length;
  hanziCards.forEach(card => colHanzi.appendChild(createG1Btn(card)));
  meaningCards.forEach(card => colMeaning.appendChild(createG1Btn(card)));
}
function createG1Btn(card) {
  const btn = document.createElement('button');
  btn.className = "w-full scroll-container p-4 text-xl md:text-2xl font-bold flex items-center justify-center min-h-[90px] text-center hover:scale-[1.02] hover:border-[#8b5e34] transition";
  btn.innerText = card.content;
  btn.onclick = () => {
    if (card.type === 'hanzi') speakChinese(card.word.hanzi);
    if (!selectedG1) { selectedG1 = { btn, card }; btn.classList.add('selected'); } 
    else {
      if (selectedG1.btn === btn) { btn.classList.remove('selected'); selectedG1 = null; return; }
      if (selectedG1.card.id === card.id && selectedG1.card.type !== card.type) {
        btn.classList.add('matched'); selectedG1.btn.classList.add('matched'); matchedCount++;
        if (matchedCount === totalPairs) { setTimeout(() => { showScreen('win-message'); }, 500); }
      } else { selectedG1.btn.classList.remove('selected'); }
      selectedG1 = null; 
    }
  };
  return btn;
}

let selectedG2 = { audio: null, hanzi: null };
function initGame2() {
  document.getElementById('game2-area').classList.remove('hidden'); document.getElementById('game-status').innerText = "2. Nghe & Chọn Hán tự";
  selectedG2 = { audio: null, hanzi: null }; matchedCount = 0; const sentences = currentLevel.sentences || []; totalPairs = sentences.length;
  const colAudio = document.getElementById('g2-col-audio'); const colHanzi = document.getElementById('g2-col-hanzi');
  colAudio.innerHTML = '<h4 class="font-bold text-lg md:text-xl mb-4 border-b-2 border-[#b7906c] pb-2 text-[#5c3d2e]">Nghe Câu</h4>';
  colHanzi.innerHTML = '<h4 class="font-bold text-lg md:text-xl mb-4 border-b-2 border-[#b7906c] pb-2 text-[#5c3d2e]">Chọn Hán Tự</h4>';
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  shuffle(sentences).forEach((s, idx) => {
    const btn = document.createElement('button');
    btn.className = "w-full scroll-container p-6 text-center text-xl font-bold flex items-center justify-center hover:border-[#8b5e34] transition mb-3";
    btn.innerHTML = `<span class="mr-2 text-2xl">🔊</span> Câu ${idx + 1}`; 
    btn.onclick = () => { speakChinese(s.hanzi); if (selectedG2.audio) selectedG2.audio.btn.classList.remove('selected'); selectedG2.audio = { btn, sentence: s }; btn.classList.add('selected'); checkG2Match(); };
    colAudio.appendChild(btn);
  });
  shuffle(sentences).forEach(s => {
    const btn = document.createElement('button');
    btn.className = "w-full scroll-container p-5 text-center text-xl font-semibold hover:border-[#8b5e34] transition mb-3";
    btn.innerText = s.hanzi; 
    btn.onclick = () => { if (selectedG2.hanzi) selectedG2.hanzi.btn.classList.remove('selected'); selectedG2.hanzi = { btn, sentence: s }; btn.classList.add('selected'); checkG2Match(); };
    colHanzi.appendChild(btn);
  });
}
function checkG2Match() {
  if (selectedG2.audio && selectedG2.hanzi) {
    if (selectedG2.audio.sentence.hanzi === selectedG2.hanzi.sentence.hanzi) {
      selectedG2.audio.btn.classList.add('matched'); selectedG2.hanzi.btn.classList.add('matched'); matchedCount++;
      if (matchedCount === totalPairs) { setTimeout(() => { showScreen('win-message'); }, 500); }
    } else { selectedG2.audio.btn.classList.remove('selected'); selectedG2.hanzi.btn.classList.remove('selected'); }
    selectedG2 = { audio: null, hanzi: null };
  }
}

let g3Sentences = []; let g3CurrentIndex = 0; let g3Score = 0; let g3CurrentIsAnswered = false;
function initGame3() {
  document.getElementById('game3-area').classList.remove('hidden'); document.getElementById('game-status').innerText = "3. Khảo Thí Đánh Máy";
  g3Sentences = [...currentLevel.sentences].sort(() => Math.random() - 0.5); g3CurrentIndex = 0; g3Score = 0; renderG3Question();
}
function renderG3Question() {
  g3CurrentIsAnswered = false; document.getElementById('g3-input').value = ""; document.getElementById('g3-input').disabled = false;
  document.getElementById('g3-feedback').innerHTML = ""; document.getElementById('g3-btn-check').classList.remove('hidden');
  document.getElementById('g3-btn-help').classList.remove('hidden'); document.getElementById('g3-btn-next').classList.add('hidden');
  document.getElementById('g3-progress').innerText = `Câu ${g3CurrentIndex + 1}/${g3Sentences.length} | Điểm: ${g3Score}`;
  playG3Audio();
}
function playG3Audio() { speakChinese(g3Sentences[g3CurrentIndex].hanzi); }
function checkG3Answer() {
  if (g3CurrentIsAnswered) return;
  const inputVal = document.getElementById('g3-input').value.trim();
  const formatText = (text) => text.replace(/[\s，。！？、,.\?\!]/g, ''); 
  if (formatText(inputVal) === formatText(g3Sentences[g3CurrentIndex].hanzi) && inputVal !== "") {
    document.getElementById('g3-feedback').innerHTML = `<span class="text-green-600">Tuyệt vời! Bạn đã đánh máy chính xác.</span>`;
    g3Score++; g3CurrentIsAnswered = true; document.getElementById('g3-input').disabled = true;
    document.getElementById('g3-btn-check').classList.add('hidden'); document.getElementById('g3-btn-help').classList.add('hidden');
    document.getElementById('g3-btn-next').classList.remove('hidden');
    document.getElementById('g3-progress').innerText = `Câu ${g3CurrentIndex + 1}/${g3Sentences.length} | Điểm: ${g3Score}`;
  } else { document.getElementById('g3-feedback').innerHTML = `<span class="text-red-600">Chưa chính xác, hãy thử lại!</span>`; playG3Audio(); }
}
function showG3Help() {
  if (g3CurrentIsAnswered) return;
  document.getElementById('g3-input').value = g3Sentences[g3CurrentIndex].hanzi; document.getElementById('g3-input').disabled = true;
  document.getElementById('g3-feedback').innerHTML = `<span class="text-[#8b5e34]">Trợ giúp: Bạn không được cộng điểm câu này.</span>`;
  g3CurrentIsAnswered = true; document.getElementById('g3-btn-check').classList.add('hidden');
  document.getElementById('g3-btn-help').classList.add('hidden'); document.getElementById('g3-btn-next').classList.remove('hidden');
}
function nextG3Question() { g3CurrentIndex++; if (g3CurrentIndex < g3Sentences.length) renderG3Question(); else finishGame3(); }
function finishGame3() {
  showScreen('win-message');
  document.getElementById('win-score-text').innerText = `Thành tích Khảo Thí: ${g3Score}/${g3Sentences.length} câu`;
  const name = localStorage.getItem('cobi_student_name') || "Ẩn danh"; const testName = currentLevel.title + " (Đánh Máy)";
  try { fetch(API_URL + `?action=saveScore&name=${encodeURIComponent(name)}&testName=${encodeURIComponent(testName)}&score=${g3Score}/${g3Sentences.length}`, { mode: 'no-cors' }); } catch (e) {}
}


// ================= NGỰ PHÁP TÂM QUYẾT =================
function startNguPhapTheory() {
  showScreen('np-theory-screen');
  const container = document.getElementById('np-theory-content'); 
  container.innerHTML = '';
  
  const theoryData = currentLevel.grammarTheory || [];
  theoryData.forEach((item, idx) => {
    let detailsHtml = '';
    
    if (item.details && item.details.length > 0) {
      item.details.forEach((detail, dIdx) => {
        const formulaHtml = detail.formula ? detail.formula.replace(/\n/g, '<br>') : '';
        const usageHtml = detail.usage ? detail.usage.replace(/\n/g, '<br>') : '';
        let exampleHtml = '';
        
        if (detail.example) {
          const exLines = detail.example.split('\n');
          exLines.forEach(line => {
            if(line.trim() !== '') {
              const splitIndex = line.indexOf('-');
              let hz = line; let vi = '';
              if(splitIndex > -1) { 
                hz = line.substring(0, splitIndex).trim(); 
                vi = line.substring(splitIndex + 1).trim(); 
              }
              exampleHtml += `
                <div class="mb-3 bg-[#fefae0] p-4 rounded border border-[#b7906c]/30 text-[#5c3d2e] shadow-sm">
                  <p class="text-xl font-bold mb-1 cursor-pointer hover:text-[#8b5e34] transition" onclick="speakChinese('${hz.replace(/'/g, "\\'")}')">🔊 ${hz}</p>
                  <p class="italic text-[#7f5539]">${vi}</p>
                </div>
              `;
            }
          });
        }
        
        detailsHtml += `<div class="mb-8 pb-8 ${dIdx < item.details.length - 1 ? 'border-b-2 border-dashed border-[#b7906c]/40' : ''}">`;
        
        if (formulaHtml) {
          detailsHtml += `
            <div class="mb-5">
              <p class="text-[#8b5e34] font-bold mb-2 text-lg">📌 Cấu trúc:</p>
              <p class="bg-[#fefae0] p-4 rounded-lg border-2 border-[#b7906c]/30 text-xl font-mono text-[#5c3d2e] font-bold tracking-wide leading-relaxed shadow-inner">${formulaHtml}</p>
            </div>
          `;
        }
        
        if (usageHtml) {
          detailsHtml += `
            <div class="mb-5">
              <p class="text-[#8b5e34] font-bold mb-2">Cách dùng ${item.details.length > 1 && !formulaHtml ? dIdx + 1 : ''}:</p>
              <p class="text-[#7f5539] leading-relaxed text-lg">${usageHtml}</p>
            </div>
          `;
        }
        
        if (exampleHtml) {
          detailsHtml += `
            <div>
              <p class="text-[#8b5e34] font-bold mb-2">Ví dụ:</p>
              ${exampleHtml}
            </div>
          `;
        }
        
        detailsHtml += `</div>`;
      });
    }
    
    const card = document.createElement('div');
    card.className = "bg-[#fcf6e8] border-2 border-[#b7906c] rounded-xl p-6 md:p-10 mb-10 shadow-lg";
    card.innerHTML = `
      <h3 class="text-2xl md:text-3xl font-black text-[#5c3d2e] mb-8 pb-4 border-b-4 border-[#b7906c]/50 text-center uppercase tracking-widest drop-shadow-sm">♦ ${item.name} ♦</h3>
      <div>${detailsHtml}</div>
    `;
    container.appendChild(card);
  });
}


// ================= PHÁ TRẬN ĐÀI =================
let npQuestions = []; let npCurrentIndex = 0; let npScore = 0; let npSelectedWords = []; 
function startNguPhapPractice() {
  showScreen('np-practice-screen');
  npQuestions = [...(currentLevel.grammarPractice || [])].sort(() => Math.random() - 0.5);
  npCurrentIndex = 0; npScore = 0;
  if(npQuestions.length === 0) { document.getElementById('npp-instruction').innerText = "Chưa có trận đồ nào được thiết lập."; document.getElementById('npp-dientu-area').classList.add('hidden'); document.getElementById('npp-sapxep-area').classList.add('hidden'); return; }
  renderNpQuestion();
}

function renderNpQuestion() {
  const q = npQuestions[npCurrentIndex];
  document.getElementById('npp-progress').innerText = `Trận ${npCurrentIndex + 1}/${npQuestions.length} | Điểm: ${npScore}`;
  document.getElementById('npp-feedback').innerHTML = '';
  document.getElementById('npp-btn-check').classList.remove('hidden'); document.getElementById('npp-btn-help').classList.remove('hidden'); 
  document.getElementById('npp-btn-next').classList.add('hidden');

  if (q.type.toLowerCase() === "điền từ") {
    document.getElementById('npp-instruction').innerText = "Hãy nhấp chọn pháp khí (từ) thích hợp để điền vào chỗ trống:";
    document.getElementById('npp-sapxep-area').classList.add('hidden'); document.getElementById('npp-dientu-area').classList.remove('hidden');
    document.getElementById('npp-sentence').innerHTML = q.content.replace('___', '<span id="npp-blank" class="inline-block min-w-[60px] border-b-4 border-[#b7906c] text-[#5c3d2e] font-bold px-2 text-center">...</span>');
    const optionsDiv = document.getElementById('npp-options'); optionsDiv.innerHTML = '';
    const opts = q.options.split('/').map(o => o.trim());
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = "m-2 bg-[#fcf6e8] border-2 border-[#b7906c] text-[#5c3d2e] font-bold text-2xl py-3 px-6 rounded hover:bg-[#e0ac69] hover:text-white transition shadow-sm";
      btn.innerText = opt;
      btn.onclick = () => { speakChinese(opt); document.getElementById('npp-blank').innerText = opt; document.getElementById('npp-blank').classList.add('text-green-700'); };
      optionsDiv.appendChild(btn);
    });
  } else if (q.type.toLowerCase() === "sắp xếp câu") {
    document.getElementById('npp-instruction').innerText = "Hãy nhấp (click) vào các từ bên dưới để di chuyển và sắp xếp thành câu hoàn chỉnh:";
    document.getElementById('npp-dientu-area').classList.add('hidden'); document.getElementById('npp-sapxep-area').classList.remove('hidden');
    npSelectedWords = [];
    const answerBox = document.getElementById('npp-answer-box'); const poolBox = document.getElementById('npp-words-pool');
    answerBox.innerHTML = ''; poolBox.innerHTML = '';
    let words = q.content.split(/[,，]/).map(w => w.trim()).filter(w => w !== "");
    words.sort(() => Math.random() - 0.5); 
    words.forEach((word) => {
      const btn = document.createElement('button');
      btn.className = "m-2 word-tile bg-[#fcf6e8] border-2 border-[#b7906c] text-[#5c3d2e] font-bold text-2xl py-3 px-5 rounded shadow-sm";
      btn.innerText = word;
      btn.onclick = () => toggleNpWord(btn, word);
      poolBox.appendChild(btn);
    });
  }
}

function toggleNpWord(btn, word) {
  speakChinese(word); 
  const answerBox = document.getElementById('npp-answer-box'); const poolBox = document.getElementById('npp-words-pool');
  if (btn.parentElement === poolBox) { answerBox.appendChild(btn); npSelectedWords.push(word); } 
  else { poolBox.appendChild(btn); const idx = npSelectedWords.indexOf(word); if(idx > -1) npSelectedWords.splice(idx, 1); }
}

function checkNpPractice() {
  const q = npQuestions[npCurrentIndex]; const feedback = document.getElementById('npp-feedback'); let isCorrect = false;
  if (q.type.toLowerCase() === "điền từ") {
    const userAnswer = document.getElementById('npp-blank').innerText; if (userAnswer === q.answer) isCorrect = true;
  } else if (q.type.toLowerCase() === "sắp xếp câu") {
    const userAnswer = npSelectedWords.join(''); const formatText = (text) => text.replace(/[\s，。！？、]/g, ''); 
    if (formatText(userAnswer) === formatText(q.answer)) isCorrect = true;
  }
  if (isCorrect) {
    feedback.innerHTML = `<span class="text-green-600">Phá trận thành công!</span>`; speakChinese(q.answer); npScore++;
    document.getElementById('npp-btn-check').classList.add('hidden'); document.getElementById('npp-btn-help').classList.add('hidden'); document.getElementById('npp-btn-next').classList.remove('hidden');
    document.getElementById('npp-progress').innerText = `Trận ${npCurrentIndex + 1}/${npQuestions.length} | Điểm: ${npScore}`;
  } else { feedback.innerHTML = `<span class="text-red-600">Trận pháp sai lệch, hãy thử lại!</span>`; }
}

function showNpHelp() {
  const q = npQuestions[npCurrentIndex]; const feedback = document.getElementById('npp-feedback');
  feedback.innerHTML = `<span class="text-[#8b5e34]">Đáp án: ${q.answer}</span>`; speakChinese(q.answer); 
  document.getElementById('npp-btn-check').classList.add('hidden'); document.getElementById('npp-btn-help').classList.add('hidden'); document.getElementById('npp-btn-next').classList.remove('hidden');
}

function nextNpPractice() { npCurrentIndex++; if (npCurrentIndex < npQuestions.length) renderNpQuestion(); else finishNpPractice(); }

function finishNpPractice() {
  showScreen('win-message');
  document.getElementById('win-score-text').innerText = `Thành tích Phá Trận: ${npScore}/${npQuestions.length}`;
  const studentName = localStorage.getItem('cobi_student_name') || "Ẩn danh"; const testName = currentLevel.title + " (Phá Trận Đài)";
  try { fetch(API_URL + `?action=saveScore&name=${encodeURIComponent(studentName)}&testName=${encodeURIComponent(testName)}&score=${npScore}/${npQuestions.length}`, { mode: 'no-cors' }); } catch (e) {}
}

// ================= ÔN CỐ HIÊN (HỖ TRỢ 5 DẠNG BÀI TẬP) =================
let ocQuestions = []; let ocCurrentIndex = 0; let ocScore = 0; let ocLiveAnswers = []; let ocLiveCurrentStep = 0; let ocSelectedOption = null; let ocCtIsAnswered = false; let ocSelectedWords = []; let ocDtsxIsAnswered = false;

function startOnCoPractice() {
  showScreen('onco-practice-screen');
  ocQuestions = [...(currentLevel.onCoPractice || [])];
  ocCurrentIndex = 0; ocScore = 0;
  if(ocQuestions.length === 0) { 
      document.getElementById('oc-instruction').innerText = "Chưa có bài tập nào được giao."; 
      document.getElementById('oc-nghelenh-area').classList.add('hidden'); 
      document.getElementById('oc-tracnghiem-area').classList.add('hidden'); 
      document.getElementById('oc-chinhta-area').classList.add('hidden'); 
      document.getElementById('oc-dientusapxep-area').classList.add('hidden');
      return; 
  }
  renderOcQuestion();
}

function renderOcQuestion() {
  const q = ocQuestions[ocCurrentIndex];
  document.getElementById('oc-score-display').innerText = `Điểm: ${ocScore}`;
  document.getElementById('oc-btn-next').classList.add('hidden');
  
  // Ẩn tất cả khu vực
  document.getElementById('oc-nghelenh-area').classList.add('hidden');
  document.getElementById('oc-tracnghiem-area').classList.add('hidden');
  document.getElementById('oc-chinhta-area').classList.add('hidden');
  document.getElementById('oc-dientusapxep-area').classList.add('hidden');

  let rawContent = q.content; let rawOptions = q.options; let rawAnswer = q.answer;

  // AI Tự động sửa lỗi hoán đổi cột cho Nghe lệnh / Trắc nghiệm
  if (rawContent && rawContent.includes('/') && (!rawOptions || !rawOptions.includes('/')) && !q.type.toLowerCase().includes("sắp xếp")) {
    rawAnswer = rawOptions; rawOptions = rawContent; rawContent = "";
  }

  const typeLow = q.type.toLowerCase();

  // DẠNG 1: NGHE LỆNH
  if (typeLow.includes("nghe lệnh")) {
    document.getElementById('oc-instruction').innerText = rawContent || "Hãy lắng nghe hiệu lệnh của Sư Phụ và chọn thẻ tương ứng!";
    document.getElementById('oc-nghelenh-area').classList.remove('hidden');
    ocLiveAnswers = (rawAnswer || "").split('/').map(s => s.trim()).filter(s => s !== "");
    ocLiveCurrentStep = 0;
    const pool = document.getElementById('oc-words-pool'); pool.innerHTML = '';
    document.getElementById('oc-live-feedback').innerHTML = '';

    const opts = (rawOptions || "").split('/').map(o => o.trim()).filter(o => o !== "");
    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = "m-2 bg-[#fcf6e8] border-2 border-[#b7906c] text-[#5c3d2e] font-bold text-3xl py-4 px-6 rounded hover:bg-[#e0ac69] hover:text-white transition shadow-md";
      btn.innerText = opt;
      btn.onclick = () => clickOcLiveWord(btn, opt);
      pool.appendChild(btn);
    });
  } 
  
  // DẠNG 2: TRẮC NGHIỆM
  else if (typeLow.includes("trắc nghiệm")) {
    document.getElementById('oc-instruction').innerText = rawContent || "Lắng nghe âm thanh và chọn đáp án chính xác nhất:";
    document.getElementById('oc-tracnghiem-area').classList.remove('hidden');
    document.getElementById('oc-btn-mc-check').classList.add('hidden');
    document.getElementById('oc-btn-mc-help').classList.remove('hidden');
    document.getElementById('oc-mc-feedback').innerHTML = '';
    ocSelectedOption = null;

    const optionsContainer = document.getElementById('oc-mc-options');
    optionsContainer.innerHTML = '';
    const opts = (rawOptions || "").split('/').map(o => o.trim()).filter(o => o !== "");
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    opts.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = "w-full text-left p-4 bg-[#fcf6e8] border-2 border-[#b7906c]/30 rounded-lg text-[#5c3d2e] font-bold text-lg md:text-xl hover:bg-[#e0ac69] hover:text-white transition shadow-sm flex items-center";
      btn.innerHTML = `<span class="mr-4 text-[#8b5e34] text-xl font-black">${labels[idx] || '-'}.</span> <span>${opt}</span>`;
      btn.onclick = () => {
        Array.from(optionsContainer.children).forEach(c => {
          c.classList.remove('bg-[#e0ac69]', 'text-white', 'border-[#8b5e34]');
          c.classList.add('bg-[#fcf6e8]', 'text-[#5c3d2e]', 'border-[#b7906c]/30');
          c.querySelector('span').classList.remove('text-white');
          c.querySelector('span').classList.add('text-[#8b5e34]');
        });
        btn.classList.remove('bg-[#fcf6e8]', 'text-[#5c3d2e]', 'border-[#b7906c]/30');
        btn.classList.add('bg-[#e0ac69]', 'text-white', 'border-[#8b5e34]');
        btn.querySelector('span').classList.remove('text-[#8b5e34]');
        btn.querySelector('span').classList.add('text-white');
        
        ocSelectedOption = opt;
        document.getElementById('oc-btn-mc-check').classList.remove('hidden');
      };
      optionsContainer.appendChild(btn);
    });
    playOcAudio();
  }

  // DẠNG 3: CHÍNH TẢ / TRẢ LỜI CÂU HỎI
  else if (typeLow.includes("chính tả") || typeLow.includes("trả lời")) {
    let defaultInst = typeLow.includes("chính tả") ? "Hãy lắng nghe và gõ lại chính xác câu bạn nghe được:" : "Hãy nhập câu trả lời của bạn vào ô trống:";
    document.getElementById('oc-instruction').innerText = rawContent || defaultInst;
    document.getElementById('oc-chinhta-area').classList.remove('hidden');
    
    // Nếu là dạng "Trả lời", ta có thể Ẩn/Hiện nút Nghe nếu người dùng gõ câu hỏi vào Cột C
    if(typeLow.includes("trả lời") && !rawContent) {
        document.getElementById('oc-btn-ct-audio').classList.add('hidden'); // Ẩn nút nếu không có gì để nghe
    } else {
        document.getElementById('oc-btn-ct-audio').classList.remove('hidden');
    }

    ocCtIsAnswered = false;
    document.getElementById('oc-ct-input').value = "";
    document.getElementById('oc-ct-input').disabled = false;
    document.getElementById('oc-ct-feedback').innerHTML = "";
    document.getElementById('oc-btn-ct-check').classList.remove('hidden');
    document.getElementById('oc-btn-ct-help').classList.remove('hidden');
    
    if(typeLow.includes("chính tả")) playOcChinhTaAudio();
  }

  // DẠNG 4: ĐIỀN TỪ & SẮP XẾP CÂU
  else if (typeLow.includes("điền từ") || typeLow.includes("sắp xếp câu")) {
    document.getElementById('oc-instruction').innerText = typeLow.includes("điền từ") ? "Hãy chọn pháp khí (từ) thích hợp để điền vào chỗ trống:" : "Hãy nhấp (click) vào các từ bên dưới để di chuyển và sắp xếp thành câu hoàn chỉnh:";
    document.getElementById('oc-dientusapxep-area').classList.remove('hidden');
    document.getElementById('oc-btn-dtsx-check').classList.remove('hidden');
    document.getElementById('oc-btn-dtsx-help').classList.remove('hidden');
    document.getElementById('oc-dtsx-feedback').innerHTML = "";
    ocDtsxIsAnswered = false;

    if (typeLow.includes("điền từ")) {
      document.getElementById('oc-dientu-content').classList.remove('hidden');
      document.getElementById('oc-sapxep-content').classList.add('hidden');
      
      document.getElementById('oc-dt-sentence').innerHTML = (rawContent || "").replace('___', '<span id="oc-dt-blank" class="inline-block min-w-[60px] border-b-4 border-[#b7906c] text-[#5c3d2e] font-bold px-2 text-center">...</span>');
      const optionsDiv = document.getElementById('oc-dt-options');
      optionsDiv.innerHTML = '';
      const opts = (rawOptions || "").split('/').map(o => o.trim()).filter(o => o !== "");
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "m-2 bg-[#fcf6e8] border-2 border-[#b7906c] text-[#5c3d2e] font-bold text-2xl py-3 px-6 rounded hover:bg-[#e0ac69] hover:text-white transition shadow-sm";
        btn.innerText = opt;
        btn.onclick = () => { speakChinese(opt); document.getElementById('oc-dt-blank').innerText = opt; document.getElementById('oc-dt-blank').classList.add('text-green-700'); };
        optionsDiv.appendChild(btn);
      });
    } else {
      document.getElementById('oc-dientu-content').classList.add('hidden');
      document.getElementById('oc-sapxep-content').classList.remove('hidden');
      
      ocSelectedWords = [];
      const answerBox = document.getElementById('oc-sx-answer-box');
      const poolBox = document.getElementById('oc-sx-words-pool');
      answerBox.innerHTML = ''; poolBox.innerHTML = '';
      
      // Nhận diện dấu phẩy Tiếng Việt (,) và Tiếng Trung (，)
      let words = (rawContent || "").split(/[,，]/).map(w => w.trim()).filter(w => w !== "");
      words.sort(() => Math.random() - 0.5); 
      words.forEach((word) => {
        const btn = document.createElement('button');
        btn.className = "m-2 word-tile bg-[#fcf6e8] border-2 border-[#b7906c] text-[#5c3d2e] font-bold text-2xl py-3 px-5 rounded shadow-sm";
        btn.innerText = word;
        btn.onclick = () => toggleOcWord(btn, word);
        poolBox.appendChild(btn);
      });
    }
  }
}

// Logic Sắp xếp & Điền từ (Ôn Cố Hiên)
function toggleOcWord(btn, word) {
  if (ocDtsxIsAnswered) return;
  speakChinese(word); 
  const answerBox = document.getElementById('oc-sx-answer-box'); const poolBox = document.getElementById('oc-sx-words-pool');
  if (btn.parentElement === poolBox) { answerBox.appendChild(btn); ocSelectedWords.push(word); } 
  else { poolBox.appendChild(btn); const idx = ocSelectedWords.indexOf(word); if(idx > -1) ocSelectedWords.splice(idx, 1); }
}

function checkOcDienTuSapXep() {
  if (ocDtsxIsAnswered) return;
  const q = ocQuestions[ocCurrentIndex]; const feedback = document.getElementById('oc-dtsx-feedback'); let isCorrect = false;
  
  if (q.type.toLowerCase().includes("điền từ")) {
    const userAnswer = document.getElementById('oc-dt-blank').innerText; if (userAnswer === q.answer.trim()) isCorrect = true;
  } else if (q.type.toLowerCase().includes("sắp xếp câu")) {
    const userAnswer = ocSelectedWords.join(''); const formatText = (text) => text.replace(/[\s，。！？、]/g, ''); 
    if (formatText(userAnswer) === formatText(q.answer)) isCorrect = true;
  }
  
  if (isCorrect) {
    ocScore += 2;
    feedback.innerHTML = `<span class="text-green-600">Phá trận thành công! (+2 điểm)</span>`; speakChinese(q.answer); 
    ocDtsxIsAnswered = true;
    document.getElementById('oc-btn-dtsx-check').classList.add('hidden'); document.getElementById('oc-btn-dtsx-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
  } else { 
    ocScore -= 1;
    feedback.innerHTML = `<span class="text-red-600">Trận pháp sai lệch, hãy thử lại! (-1 điểm)</span>`; 
  }
  document.getElementById('oc-score-display').innerText = `Điểm: ${ocScore}`;
}

function showOcDienTuSapXepHelp() {
  if (ocDtsxIsAnswered) return;
  const q = ocQuestions[ocCurrentIndex]; const feedback = document.getElementById('oc-dtsx-feedback');
  feedback.innerHTML = `<span class="text-[#8b5e34]">Đáp án: ${q.answer}</span>`; speakChinese(q.answer); 
  ocDtsxIsAnswered = true;
  document.getElementById('oc-btn-dtsx-check').classList.add('hidden'); document.getElementById('oc-btn-dtsx-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
}


// Logic Trắc Nghiệm Nghe
function playOcAudio() { 
  const q = ocQuestions[ocCurrentIndex]; 
  // Chống đọc tiếng Việt nếu người dùng ghi câu hỏi tiếng Việt
  speakChinese(q.content || q.answer); 
}

function checkOcTracNghiem() {
  if (!ocSelectedOption) return;
  const q = ocQuestions[ocCurrentIndex]; const feedback = document.getElementById('oc-mc-feedback');
  if (ocSelectedOption === q.answer.trim()) {
    ocScore += 2; feedback.innerHTML = `<span class="text-green-600">Tuyệt vời! Đáp án chính xác. (+2 điểm)</span>`;
    document.getElementById('oc-btn-mc-check').classList.add('hidden'); document.getElementById('oc-btn-mc-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
    Array.from(document.getElementById('oc-mc-options').children).forEach(c => c.onclick = null);
  } else {
    ocScore -= 1; feedback.innerHTML = `<span class="text-red-600">Chưa chính xác! (Bị trừ 1 điểm)</span>`; playOcAudio();
  }
  document.getElementById('oc-score-display').innerText = `Điểm: ${ocScore}`;
}

function showOcTracNghiemHelp() {
  const q = ocQuestions[ocCurrentIndex]; const feedback = document.getElementById('oc-mc-feedback');
  feedback.innerHTML = `<span class="text-[#8b5e34]">Đáp án đúng: ${q.answer}</span>`;
  document.getElementById('oc-btn-mc-check').classList.add('hidden'); document.getElementById('oc-btn-mc-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
}

// Logic Nghe lệnh Sư phụ
function clickOcLiveWord(btn, word) {
  const targetWord = ocLiveAnswers[ocLiveCurrentStep];
  const feedback = document.getElementById('oc-live-feedback');

  if (word === targetWord) {
    ocScore += 2; speakChinese(word); feedback.innerHTML = `<span class="text-green-600">Chính xác! (+2 điểm)</span>`;
    btn.style.visibility = 'hidden'; ocLiveCurrentStep++;
    if (ocLiveCurrentStep >= ocLiveAnswers.length) {
      feedback.innerHTML = `<span class="text-green-600">Tuyệt vời! Đã hoàn thành ải này.</span>`; document.getElementById('oc-btn-next').classList.remove('hidden');
    }
  } else {
    ocScore -= 1; feedback.innerHTML = `<span class="text-red-600">Sai rồi! Bị trừ 1 điểm.</span>`;
    btn.style.transform = "translateX(5px)"; setTimeout(() => btn.style.transform = "translateX(-5px)", 100); setTimeout(() => btn.style.transform = "translateX(0)", 200);
  }
  document.getElementById('oc-score-display').innerText = `Điểm: ${ocScore}`;
}

// Logic Chép Chính Tả / Trả lời
function playOcChinhTaAudio() { const q = ocQuestions[ocCurrentIndex]; speakChinese(q.content || q.answer); }

function checkOcChinhTa() {
  if (ocCtIsAnswered) return;
  const q = ocQuestions[ocCurrentIndex]; const inputVal = document.getElementById('oc-ct-input').value.trim();
  const formatText = (text) => text.replace(/[\s，。！？、,.\?\!]/g, ''); const feedback = document.getElementById('oc-ct-feedback');

  if (formatText(inputVal) === formatText(q.answer) && inputVal !== "") {
    ocScore += 2; feedback.innerHTML = `<span class="text-green-600">Tuyệt vời! Chính xác 100%. (+2 điểm)</span>`;
    ocCtIsAnswered = true; document.getElementById('oc-ct-input').disabled = true; document.getElementById('oc-btn-ct-check').classList.add('hidden');
    document.getElementById('oc-btn-ct-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
  } else {
    ocScore -= 1; feedback.innerHTML = `<span class="text-red-600">Sai rồi! Suy nghĩ kỹ lại nhé (Bị trừ 1 điểm)</span>`; 
    if(q.type.toLowerCase().includes("chính tả")) playOcChinhTaAudio();
  }
  document.getElementById('oc-score-display').innerText = `Điểm: ${ocScore}`;
}

function showOcChinhTaHelp() {
  if (ocCtIsAnswered) return;
  const q = ocQuestions[ocCurrentIndex];
  document.getElementById('oc-ct-input').value = q.answer; document.getElementById('oc-ct-input').disabled = true;
  document.getElementById('oc-ct-feedback').innerHTML = `<span class="text-[#8b5e34]">Trợ giúp: ${q.answer}</span>`;
  ocCtIsAnswered = true; document.getElementById('oc-btn-ct-check').classList.add('hidden');
  document.getElementById('oc-btn-ct-help').classList.add('hidden'); document.getElementById('oc-btn-next').classList.remove('hidden');
}

function nextOcPractice() {
  ocCurrentIndex++;
  if (ocCurrentIndex < ocQuestions.length) renderOcQuestion();
  else {
    showScreen('win-message'); document.getElementById('win-score-text').innerText = `Thành tích Ôn Cố: ${ocScore} điểm`;
    const name = localStorage.getItem('cobi_student_name') || "Ẩn danh"; const testName = currentLevel.title + " (Ôn Cố Hiên)";
    try { fetch(API_URL + `?action=saveScore&name=${encodeURIComponent(name)}&testName=${encodeURIComponent(testName)}&score=${ocScore} điểm`, { mode: 'no-cors' }); } catch (e) {}
  }
}
