const app=document.getElementById('app'),toastEl=document.getElementById('toast');
const EXAM={data:HSK4_DATA,section:'idle',studentName:'',timer:null,remaining:0,answers:{},submitted:false,audio:null,audioTimer:null,reviewMode:false,reviewDeadline:0};
function goTop(){window.scrollTo({top:0,left:0,behavior:'auto'});document.documentElement.scrollTop=0;document.body.scrollTop=0}
function setPhaseTimer(seconds,onEnd){clearTimers();EXAM.remaining=seconds;paintTimer();const deadline=Date.now()+seconds*1000;EXAM.timer=setInterval(()=>{EXAM.remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));paintTimer();if(EXAM.remaining<=0){clearInterval(EXAM.timer);EXAM.timer=null;onEnd()}},200);}
const CENTER={address:'K814 H83B/37 Trần Cao Vân, Thanh Khê, Đà Nẵng',contact:'0905655413'};
document.getElementById('center-address').textContent=CENTER.address;document.getElementById('center-contact').textContent=CENTER.contact;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const norm=v=>String(v??'').trim().toUpperCase().replace(/\s+/g,'');
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),3000)}
function route(){let h=location.hash.slice(1)||'home';if(['practice','hsk4'].includes(h))renderPracticeHome();else if(h==='knowledge')placeholder('Kiến Thức','Từ vựng, ngữ pháp và kiến thức Hán Ngữ.');else if(h==='review')placeholder('Ôn tập','Ôn tập theo trình độ và chủ đề.');else renderHome();document.querySelectorAll('.main-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===h))}
function placeholder(t,d){app.innerHTML=`<section class="page"><div class="section-title"><span class="cn">${esc(t)}</span><span class="vi">${esc(d)}</span></div><div class="card"><div class="notice">Khu vực này đã được giữ sẵn trong hệ thống Thư Quán.</div></div></section>`}
function renderHome(){app.innerHTML=`<section class="page hero"><div><div class="hero-kicker">漢 · 書 · 語 · 學</div><h1><span class="hero-vn">Thư Quán Hán Ngữ</span> <span class="hero-cobi">CoBi</span></h1><h2>一朝入书馆，一生伴汉语</h2><p>Một ngày nhập Thư Quán, trọn đời hành Hán Ngữ.</p><div class="hero-ornament">— ❖ —</div></div></section><section class="page" style="padding-top:0"><div class="section-title"><span class="cn">入馆三卷</span><span class="vi">Ba không gian học tập của Thư Quán</span></div><div class="card-grid"><a class="card menu-card" href="#knowledge"><div class="symbol">知</div><h3>Kiến Thức</h3><p>Từ vựng, ngữ pháp, cấu trúc câu.</p></a><a class="card menu-card" href="#review"><div class="symbol">习</div><h3>Ôn tập</h3><p>Ôn lại kiến thức theo trình độ.</p></a><a class="card menu-card" href="#practice"><div class="symbol">试</div><h3>Luyện đề</h3><p>Luyện đề HSK1–HSK6.</p></a></div></section>`}
function renderPracticeHome(){app.innerHTML=`<section class="page"><div class="section-title"><span class="cn">HSK4 模拟考试</span><span class="vi">Luyện đề HSK4 · 第01套</span></div><div class="notice"><strong>听力:</strong> thời gian đúng bằng độ dài audio. <strong>阅读:</strong> 40 phút. <strong>书写:</strong> 25 phút. <strong>检查:</strong> 5 phút.</div><div class="card-grid"><div class="card"><h3>听力 · 45题</h3><p>判断正误 + ABCD.</p></div><div class="card"><h3>阅读 · 40题</h3><p>选词填空 + 排列顺序 + 阅读理解.</p></div><div class="card"><h3>书写 · 15题</h3><p>86–95 tự chấm; 96–100 giáo viên chấm.</p></div></div><div class="card start-card"><label><strong>姓名 · Họ tên học viên</strong></label><input id="student-name" placeholder="Nhập họ tên"><button class="btn red" id="start-exam">开始考试 · Bắt đầu</button></div></section>`;document.getElementById('start-exam').onclick=startExam}
function allQuestions(){return [...EXAM.data.listening,...EXAM.data.reading,...EXAM.data.writingOrder,...EXAM.data.writingPicture]}
function sectionQuestions(section){if(section==='listening')return EXAM.data.listening;if(section==='reading')return EXAM.data.reading;if(section==='writing')return [...EXAM.data.writingOrder,...EXAM.data.writingPicture];return allQuestions()}
function questionSection(id){if(id<=45)return'listening';if(id<=85)return'reading';return'writing'}
function isDone(q){return EXAM.answers[q.id]!==undefined&&String(EXAM.answers[q.id]).trim()!==''}
function startExam(){let n=document.getElementById('student-name').value.trim();if(!n)return toast('Vui lòng nhập họ tên học viên.');EXAM.studentName=n;EXAM.answers={};EXAM.submitted=false;EXAM.section='listening';renderListening()}
function clearTimers(){clearInterval(EXAM.timer);clearInterval(EXAM.audioTimer);EXAM.timer=null;EXAM.audioTimer=null}
function startClock(seconds,onEnd){setPhaseTimer(seconds,onEnd)}
function startAudioClock(){clearInterval(EXAM.audioTimer);EXAM.audioTimer=setInterval(()=>{if(EXAM.audio&&!EXAM.audio.paused&&isFinite(EXAM.audio.duration)){EXAM.remaining=Math.max(0,Math.ceil(EXAM.audio.duration-EXAM.audio.currentTime));paintTimer()}},250)}
function paintTimer(){let e=document.getElementById('timer');if(!e)return;let s=Math.max(0,EXAM.remaining),m=Math.floor(s/60),r=s%60;e.textContent=`${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`;e.classList.toggle('warning',s<=60)}
function shell(title,sub,qs){app.innerHTML=`<div class="practice-shell"><div class="practice-top"><div class="practice-top-row"><div><div class="exam-title">${esc(EXAM.data.meta.title)}</div><div class="subhead">${esc(title)} · ${esc(sub)}</div></div><div class="timer" id="timer">00:00</div></div><div class="progress-line"><div class="progress-fill" id="progress-fill"></div></div></div><div class="exam-layout"><main class="exam-main" id="exam-main"></main><aside class="reading-nav"><h3>答题卡</h3><div class="legend"><span class="dot green"></span> Đã làm <span class="dot red"></span> Chưa làm</div><div class="palette" id="palette"></div></aside></div></div>`;renderPalette();updateProgress()}
function renderListening(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='listening'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 听力':'听力','Nghe'+(reviewMode?' · Rà soát':' · Audio'),EXAM.data.listening);
  const main=document.getElementById('exam-main');
  if(!reviewMode){
    const audio=document.createElement('audio'); audio.id='listening-audio'; audio.src=EXAM.data.meta.listeningAudio; audio.preload='metadata'; audio.controls=false; audio.style.display='none';
    audio.addEventListener('loadedmetadata',()=>{if(isFinite(audio.duration)&&audio.duration>0){EXAM.remaining=Math.ceil(audio.duration);paintTimer();startAudioClock()}});
    audio.addEventListener('timeupdate',()=>{if(isFinite(audio.duration)&&audio.duration>0){EXAM.remaining=Math.max(0,Math.ceil(audio.duration-audio.currentTime));paintTimer()}});
    audio.addEventListener('ended',endListening);
    audio.addEventListener('error',()=>toast('Không đọc được audio. Kiểm tra file audio/hsk4/test01.mp3.'));
    main.appendChild(audio); EXAM.audio=audio; audio.play().catch(()=>toast('Nếu trình duyệt chặn tự phát audio, hãy cho phép âm thanh rồi mở lại bài.'));
  }
  EXAM.data.listening.forEach(q=>main.appendChild(questionElement(q)));
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-section">下一部分 → Sang 阅读</button></div>`);
    document.getElementById('next-section').onclick=endListening;
  }
  renderPalette(); updateProgress();
  if(!reviewMode) setTimeout(()=>{if(EXAM.audio&&isFinite(EXAM.audio.duration)&&EXAM.audio.duration>0)startAudioClock()},500);
}
function endListening(){if(EXAM.section!=='listening')return;clearTimers();if(EXAM.audio){EXAM.audio.pause();EXAM.audio.currentTime=0}EXAM.audio=null;renderReading()}
function renderReading(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='reading'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 阅读':'阅读','Đọc · '+(reviewMode?'Rà soát':'40 phút'),EXAM.data.reading);
  const main=document.getElementById('exam-main');
  const groups=[['第一部分 · 选词填空',EXAM.data.reading.filter(q=>q.id<=55)],['第二部分 · 排列顺序',EXAM.data.reading.filter(q=>q.id>=56&&q.id<=65)],['第三部分 · 阅读理解',EXAM.data.reading.filter(q=>q.id>=66)]];
  groups.forEach(([title,qs])=>{main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>${esc(title)}</span></div>`);qs.forEach(q=>main.appendChild(questionElement(q)))});
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-writing">下一部分 → Sang 书写</button></div>`);
    document.getElementById('next-writing').onclick=()=>renderWriting(false);
    setPhaseTimer(40*60,()=>renderWriting(false));
  }
  renderPalette(); updateProgress();
}
function renderWriting(reviewMode=false){
  if(!reviewMode) clearTimers();
  goTop();
  EXAM.section='writing'; EXAM.reviewMode=reviewMode;
  shell(reviewMode?'检查答案 · 书写':'书写','Viết · '+(reviewMode?'Rà soát':'25 phút'),sectionQuestions('writing'));
  const main=document.getElementById('exam-main');
  main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>第一部分 · 完成句子</span></div>`);
  EXAM.data.writingOrder.forEach(q=>main.appendChild(questionElement(q)));
  main.insertAdjacentHTML('beforeend',`<div class="exam-section-heading"><span>第二部分 · 看图，用词造句</span></div><div class="shared-writing-image"><img src="${esc(EXAM.data.meta.writingPicture)}" alt="HSK4 96–100"><p>第96–100题共用此图</p></div>`);
  EXAM.data.writingPicture.forEach(q=>main.appendChild(questionElement(q)));
  if(reviewMode){
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn secondary" id="back-review">← 回到检查答案 · Quay lại rà soát</button></div>`);
    document.getElementById('back-review').onclick=renderReview;
  }else{
    main.insertAdjacentHTML('beforeend',`<div class="action-row"><span></span><button class="btn red" id="next-review">检查答案 → 进入 5 分钟 rà soát</button></div>`);
    document.getElementById('next-review').onclick=startReview;
    setPhaseTimer(25*60,startReview);
  }
  renderPalette(); updateProgress();
}
function startReview(){
  if(EXAM.section==='review')return;
  goTop();
  clearTimers();
  if(EXAM.audio)EXAM.audio.pause();
  EXAM.audio=null; EXAM.section='review'; EXAM.reviewMode=false;
  EXAM.reviewDeadline=Date.now()+EXAM.data.meta.reviewMinutes*60*1000;
  renderReview();
}
function questionElement(q){const c=document.createElement('article');c.className='question-card';c.id='q-'+q.id;let body='';if(q.type==='tf'){body=`<div class="statement">★ ${esc(q.statement)}</div>${options(q,q.options)}`}else if(q.type==='mcq'){body=options(q,q.options)}else if(q.type==='cloze'){body=(q.example?`<div class="example"><strong>例如：</strong>${esc(q.example)}</div>`:'')+`<div class="cloze-text">${esc(q.question)}</div>${options(q,q.options)}`}else if(q.type==='order'){const keys=Array.isArray(q.parts)?q.parts.map((_,i)=>String.fromCharCode(65+i)):Object.keys(q.parts);const labels=Array.isArray(q.parts)?q.parts:Object.values(q.parts);const saved=String(EXAM.answers[q.id]||'').split('').filter(Boolean);const ordered=saved.length?saved:keys;body=`<div class="order-parts">${labels.map((v,i)=>`<div class="order-part"><b>${keys[i]}</b><span>${esc(v)}</span></div>`).join('')}</div><p class="drag-hint">拖动下方字母排列顺序 · Có thể kéo thả hoặc bấm để đổi vị trí</p><div class="order-builder" data-order="${q.id}">${ordered.map(k=>`<button type="button" class="order-token" draggable="true" data-token="${k}">${k}</button>`).join('')}</div><input type="hidden" class="answer-input" data-answer="${q.id}" value="${esc(ordered.join(''))}">`}else if(q.type==='reading'){body=`<div class="passage">${esc(q.passage)}</div><div class="question-text">${esc(q.question)}</div>${options(q,q.options)}`}else if(q.type==='picture'){body=`<div class="picture-instruction">看图，用词“<strong>${esc(q.word)}</strong>”造句</div><input class="answer-input picture-answer" data-answer="${q.id}" value="${esc(EXAM.answers[q.id]||'')}" placeholder="请输入句子">`};c.innerHTML=`<div class="q-head"><span class="q-number">第 ${q.id} 题</span><span class="q-type">${typeName(q.type)}</span></div>${body}`;c.querySelectorAll('input[type=radio]').forEach(r=>r.onchange=()=>setAnswer(q.id,r.value));c.querySelectorAll('.answer-input:not([type=hidden])').forEach(i=>i.oninput=()=>setAnswer(q.id,i.value));const builder=c.querySelector('.order-builder');if(builder){let dragged=null;const sync=()=>{const order=[...builder.querySelectorAll('.order-token')].map(b=>b.dataset.token).join('');const input=c.querySelector('.answer-input');input.value=order;setAnswer(q.id,order)};builder.querySelectorAll('.order-token').forEach(btn=>{btn.addEventListener('dragstart',e=>{dragged=btn;btn.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',btn.dataset.token)});btn.addEventListener('dragend',()=>{dragged=null;btn.classList.remove('dragging');builder.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'))});btn.addEventListener('dragover',e=>{e.preventDefault();btn.classList.add('drag-over');e.dataTransfer.dropEffect='move'});btn.addEventListener('dragleave',()=>btn.classList.remove('drag-over'));btn.addEventListener('drop',e=>{e.preventDefault();btn.classList.remove('drag-over');if(!dragged||dragged===btn)return;const rect=btn.getBoundingClientRect();builder.insertBefore(dragged,e.clientX>rect.left+rect.width/2?btn.nextSibling:btn);sync()});btn.addEventListener('click',()=>{const arr=[...builder.querySelectorAll('.order-token')];const idx=arr.indexOf(btn);if(idx>0){builder.insertBefore(btn,arr[idx-1]);sync()}else if(arr.length>1){builder.appendChild(btn);sync()}})})}return c}
function typeName(t){return({tf:'判断正误',mcq:'选择题',cloze:'选词填空',reading:'阅读理解',order:'排列顺序',picture:'看图写句'})[t]||''}
function options(q,o){return `<div class="options">${Object.entries(o).map(([k,v])=>`<label class="option"><input type="radio" name="q-${q.id}" value="${k}" ${EXAM.answers[q.id]===k?'checked':''}><span><b>${k}.</b> ${esc(v)}</span></label>`).join('')}</div>`}
function setAnswer(id,v){EXAM.answers[id]=v;renderPalette();updateProgress()}
function renderPalette(){let e=document.getElementById('palette');if(!e)return;let qs=sectionQuestions(EXAM.section);e.innerHTML=qs.map(q=>`<button class="${isDone(q)?'done':''}" data-jump="${q.id}">${q.id}</button>`).join('');e.querySelectorAll('button').forEach(b=>b.onclick=()=>jumpToQuestion(Number(b.dataset.jump)))}
function jumpToQuestion(id){
  const sec=questionSection(id);
  if(EXAM.section===sec && !EXAM.reviewMode){document.getElementById('q-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(EXAM.section!=='review'){toast('Câu này thuộc phần khác.');return;}
  if(Date.now()>=EXAM.reviewDeadline){submitExam();return;}
  if(sec==='listening')renderListening(true);else if(sec==='reading')renderReading(true);else renderWriting(true);
  setTimeout(()=>document.getElementById('q-'+id)?.scrollIntoView({behavior:'auto',block:'start'}),80);
}
function updateProgress(){let e=document.getElementById('progress-fill');if(!e)return;let qs=sectionQuestions(EXAM.section);e.style.width=qs.length?`${qs.filter(isDone).length/qs.length*100}%`:'0%'}
function renderReview(){
  clearTimers();
  goTop();
  EXAM.section='review'; EXAM.reviewMode=false;
  let qs=allQuestions(),un=qs.filter(q=>!isDone(q));
  app.innerHTML=`<section class="page"><div class="review-top"><div class="section-title"><span class="cn">检查答案</span><span class="vi">Rà soát · còn ${un.length} câu chưa làm</span></div><div class="review-timer" id="review-timer">05:00</div></div><div class="card"><p><b class="green-text">Xanh</b> = đã làm · <b class="red-text">Đỏ</b> = chưa làm. Bấm số câu để xem và sửa đáp án.</p><div class="palette review-palette">${qs.map(q=>`<button class="${isDone(q)?'done':''}" data-jump="${q.id}">${q.id}</button>`).join('')}</div></div><div class="card"><button class="btn red" id="submit-now">提交答案 · Nộp bài ngay</button></div></section>`;
  document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>jumpToQuestion(Number(b.dataset.jump)));
  document.getElementById('submit-now').onclick=submitExam;
  EXAM.remaining=Math.max(0,Math.ceil((EXAM.reviewDeadline-Date.now())/1000));
  paintReviewTimer();
  EXAM.timer=setInterval(()=>{EXAM.remaining=Math.max(0,Math.ceil((EXAM.reviewDeadline-Date.now())/1000));paintReviewTimer();if(EXAM.remaining<=0){clearTimers();submitExam()}},200);
}
function paintReviewTimer(){const el=document.getElementById('review-timer');if(el){el.textContent=formatTime(EXAM.remaining);el.classList.toggle('warning',EXAM.remaining<=60)}}
function formatTime(s){s=Math.max(0,Math.ceil(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function submitExam(){if(EXAM.submitted)return;EXAM.submitted=true;clearTimers();if(EXAM.audio)EXAM.audio.pause();let r=calculateResult();saveResultLocally(r);renderResult(r);sendResultToGoogleSheets(r)}
function calculateResult(){let l=EXAM.data.listening,r=EXAM.data.reading,w=EXAM.data.writingOrder,p=EXAM.data.writingPicture;let lc=l.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length,rc=r.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length,wc=w.filter(q=>norm(EXAM.answers[q.id])===norm(q.answer)).length;let wrong=[...l,...r,...w].filter(q=>q.answer&&norm(EXAM.answers[q.id])!==norm(q.answer)).map(q=>({id:q.id,student:EXAM.answers[q.id]||'',correct:q.answer}));return{examId:EXAM.data.meta.title,level:EXAM.data.meta.level,studentName:EXAM.studentName,submittedAt:new Date().toISOString(),listeningCorrect:lc,listeningTotal:l.length,readingCorrect:rc,readingTotal:r.length,writingOrderCorrect:wc,writingOrderTotal:w.length,pictureAnswered:p.filter(isDone).length,pictureTotal:p.length,autoScore:+(lc*2.22+rc*2.5+wc*6).toFixed(2),wrong,answers:{...EXAM.answers}}}
function renderResult(r){app.innerHTML=`<section class="page"><div class="result-box"><div class="section-title"><span class="cn">考试结果</span><span class="vi">Kết quả luyện đề</span></div><div class="score-big">${r.autoScore}</div><p class="result-note">Học viên: <b>${esc(r.studentName)}</b><br>Điểm tự động, chưa gồm điểm 96–100 do giáo viên chấm.</p><table class="score-table"><tr><th>Phần</th><th>Đúng</th><th>Điểm</th></tr><tr><td>Nghe</td><td>${r.listeningCorrect}/${r.listeningTotal}</td><td>${(r.listeningCorrect*2.22).toFixed(2)}</td></tr><tr><td>Đọc</td><td>${r.readingCorrect}/${r.readingTotal}</td><td>${(r.readingCorrect*2.5).toFixed(2)}</td></tr><tr><td>Viết 86–95</td><td>${r.writingOrderCorrect}/${r.writingOrderTotal}</td><td>${(r.writingOrderCorrect*6).toFixed(2)}</td></tr><tr><td>Viết 96–100</td><td>${r.pictureAnswered}/${r.pictureTotal}</td><td>GV chấm</td></tr></table><h3>Câu sai / chưa làm</h3><div class="wrong-list">${r.wrong.length?r.wrong.map(w=>`<div class="wrong-item"><b>Câu ${w.id}</b> · Bạn: <code>${esc(w.student||'Chưa làm')}</code> · Đáp án: <code>${esc(w.correct)}</code></div>`).join(''):'Không có câu sai ở phần tự chấm.'}</div><div class="notice">${GOOGLE_SHEETS_WEB_APP_URL?'Kết quả đã được gửi lên Google Sheets.':''}</div><a class="btn secondary" href="#practice">Làm lại</a></div></section>`}
const GOOGLE_SHEETS_WEB_APP_URL='https://script.google.com/macros/s/AKfycbwotWNfwoNDMZWABbdifr5KGD05Qb3E0Txp-TOETXoP48Yb-v91zciX0VdMgzzUlWoXLw/exec'; // Dán Web App URL của Google Apps Script vào đây sau khi triển khai
function saveResultLocally(r){try{const key='cobi_hsk_results';const old=JSON.parse(localStorage.getItem(key)||'[]');old.push(r);localStorage.setItem(key,JSON.stringify(old));}catch(e){console.warn('Không lưu được localStorage',e)}}
function sendResultToGoogleSheets(r){if(!GOOGLE_SHEETS_WEB_APP_URL)return;const payload={...r,answers:JSON.stringify(r.answers),wrong:JSON.stringify(r.wrong)};fetch(GOOGLE_SHEETS_WEB_APP_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)}).then(()=>toast('Đã gửi kết quả lên Google Sheets.')).catch(()=>toast('Không gửi được Google Sheets; kết quả vẫn được lưu trên máy.'))}
window.addEventListener('hashchange',route);route();
