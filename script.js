const app=document.getElementById('app');
const toastEl=document.getElementById('toast');

/* ===================== CẤU HÌNH TÀNG THƯ CÁC ===================== */
const TANGTHU_CONFIG={
  spreadsheetId:'18gAWVFIUoHNjr9xYbuqNWXgTXkzsiDjug8r0yxgSCx8',
  apiUrl:'https://script.google.com/macros/s/AKfycbzzHWX5KbhanlXDKIDpY3YLmQlhagNpx8MJ8sF-LiVCv1jIsZun1svZaqzRBuCu47KHYA/exec'
};

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#039;'
}[c]));

function toast(m){
  if(!toastEl)return alert(m);
  toastEl.textContent=m;
  toastEl.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>toastEl.classList.remove('show'),3000)
}

function speak(text){
  if(!('speechSynthesis' in window))
    return toast('Trình duyệt không hỗ trợ đọc tiếng Trung.');

  speechSynthesis.cancel();

  const u=new SpeechSynthesisUtterance(text);
  u.lang='zh-CN';
  u.rate=.82;

  speechSynthesis.speak(u);
}


/* ===================== TÀNG THƯ CÁC ===================== */

const CoBiTangThu=(()=>{

  const S={
    tab:'vocab',
    groups:[],
    groupId:'',
    words:[],
    filtered:[],
    visible:50,
    current:0,
    study:false,
    learned:{},
    grammar:null,
    reading:null,
    token:''
  };

  const itemKey=(group,index)=>`cobi_${group}_${index}`;


  /* ===================== ĐỌC CSV GOOGLE SHEETS ===================== */

  function parseCsv(text){

    const rows=[];
    let row=[];
    let cell='';
    let quote=false;

    for(let i=0;i<text.length;i++){

      const ch=text[i];
      const next=text[i+1];

      if(ch==='"'&&quote&&next==='"'){
        cell+='"';
        i++;
        continue;
      }

      if(ch==='"'){
        quote=!quote;
        continue;
      }

      if(ch===','&&!quote){
        row.push(cell);
        cell='';
        continue;
      }

      if((ch==='\n'||ch==='\r')&&!quote){

        if(ch==='\r'&&next==='\n')i++;

        row.push(cell);
        cell='';

        if(row.some(x=>String(x).trim()))
          rows.push(row);

        row=[];
        continue;
      }

      cell+=ch;
    }

    row.push(cell);

    if(row.some(x=>String(x).trim()))
      rows.push(row);

    return rows;
  }


  /* ===================== ĐỌC SHEET ===================== */

  async function sheetRows(sheet){

    if(
      !TANGTHU_CONFIG.spreadsheetId||
      TANGTHU_CONFIG.spreadsheetId.includes('DÁN_')
    ){
      throw Error('Chưa nhập Spreadsheet ID trong script.js.');
    }

    const url=
      `https://docs.google.com/spreadsheets/d/`+
      `${encodeURIComponent(TANGTHU_CONFIG.spreadsheetId)}`+
      `/gviz/tq?tqx=out:csv&sheet=`+
      `${encodeURIComponent(sheet)}`;

    const r=await fetch(url);

    if(!r.ok)
      throw Error(`Không đọc được sheet ${sheet}.`);

    return parseCsv(await r.text());
  }


  /* ===================== CSV → OBJECT ===================== */

  function objects(rows){

    if(!rows.length)return[];

    const h=rows[0].map(x=>
      String(x).trim().toUpperCase()
    );

    return rows.slice(1)
      .map(r=>{
        const o={};

        h.forEach((k,i)=>{
          o[k]=String(r[i]??'').trim();
        });

        return o;
      })
      .filter(o=>Object.values(o).some(Boolean));
  }


  /* ===================== LOAD TỪ VỰNG ===================== */

  async function loadVocab(){

    const rows=objects(
      await sheetRows('TUVUNG')
    );

    const map=new Map();

    rows.forEach((r,i)=>{

      const id=r.ID;

      if(!id)return;

      if(!map.has(id)){
        map.set(id,{
          id,
          title:id,
          items:[]
        });
      }

      map.get(id).items.push({

        id:itemKey(id,i),

        hanzi:r['TU VUNG'],

        pinyin:r.PINYIN,

        meaning:r.NGHIA,

        example:r.VIDU
      });

    });

    S.groups=[...map.values()];

    if(!S.groupId)
      S.groupId=S.groups[0]?.id||'';

    setGroup(S.groupId,false);
  }


  /* ===================== CHỌN BỘ TỪ ===================== */

  function setGroup(id,rerender=true){

    S.groupId=id;

    const g=S.groups.find(x=>x.id===id);

    S.words=g?.items||[];

    S.filtered=[...S.words];

    S.visible=50;

    S.current=0;

    S.study=false;

    if(rerender)
      renderContent();
  }


  /* ===================== GIAO DIỆN TÀNG THƯ ===================== */

  function render(){

    app.innerHTML=`

      <section class="page tangthu-page">

        <div class="section-title">

          <span class="cn">藏书阁</span>

          <span class="vi">
            Tàng Thư Các
          </span>

        </div>


        <div class="tangthu-tabs">

          <button
            class="tangthu-tab ${S.tab==='vocab'?'active':''}"
            data-tab="vocab"
          >
            Từ vựng
          </button>


          <button
            class="tangthu-tab ${S.tab==='grammar'?'active':''}"
            data-tab="grammar"
          >
            Ngữ pháp
          </button>


          <button
            class="tangthu-tab ${S.tab==='reading'?'active':''}"
            data-tab="reading"
          >
            Bài khóa
          </button>

        </div>


        <div id="tangthu-content"></div>

      </section>
    `;


    document
      .querySelectorAll('.tangthu-tab')
      .forEach(b=>{

        b.onclick=()=>switchTab(
          b.dataset.tab
        );

      });


    renderContent();
  }


  /* ===================== CHUYỂN TAB ===================== */

  function switchTab(tab){

    S.tab=tab;

    render();

    if(tab==='vocab'){

      if(!S.groups.length){

        loadVocab()
          .then(renderContent)
          .catch(e=>
            error(
              document.getElementById(
                'tangthu-content'
              ),
              e.message
            )
          );

      }

    }else{

      unlock(tab);

    }

  }


  /* ===================== RENDER NỘI DUNG ===================== */

  function renderContent(){

    const box=
      document.getElementById(
        'tangthu-content'
      );

    if(!box)return;


    if(S.tab==='vocab')
      return renderVocab(box);


    if(S.tab==='grammar')
      return S.grammar
        ?renderGrammar(box)
        :unlock('grammar');


    return S.reading
      ?renderReading(box)
      :unlock('reading');
  }


  /* ===================== TỪ VỰNG ===================== */

  function renderVocab(box){

    if(!S.groups.length){

      box.innerHTML=`
        <div class="card">

          <div class="notice">
            Đang tải Từ vựng...
          </div>

        </div>
      `;

      loadVocab()
        .then(renderContent)
        .catch(e=>error(box,e.message));

      return;
    }


    if(S.study)
      return renderStudy(box);


    const g=
      S.groups.find(x=>x.id===S.groupId)||
      S.groups[0];


    box.innerHTML=`

      <div class="card">

        <div class="group-list">

          ${
            S.groups.map(x=>`

              <button
                class="group-chip ${
                  x.id===g.id?'active':''
                }"
                data-group="${esc(x.id)}"
              >

                ${esc(x.title)}

                <small>
                  ${x.items.length}
                </small>

              </button>

            `).join('')
          }

        </div>

      </div>


      <div class="vocab-search-row">

        <input
          id="tt-search"
          class="vocab-search"
          placeholder="Tìm chữ Hán, pinyin hoặc nghĩa..."
        >

        <span class="vocab-count">
          ${S.words.length} từ
        </span>

      </div>


      <div class="vocab-table-wrap">

        <table class="vocab-table">

          <thead>

            <tr>

              <th>#</th>

              <th>汉字</th>

              <th>Pinyin</th>

              <th>Nghĩa</th>

              <th>Ví dụ</th>

              <th></th>

            </tr>

          </thead>


          <tbody id="tt-body"></tbody>

        </table>

      </div>


      <div class="tangthu-more">

        <button
          class="btn secondary"
          id="tt-more"
        >
          XEM THÊM
        </button>

      </div>
    `;


    document
      .querySelectorAll('[data-group]')
      .forEach(b=>{

        b.onclick=()=>setGroup(
          b.dataset.group
        );

      });


    document.getElementById(
      'tt-search'
    ).oninput=e=>{

      const q=
        e.target.value
          .trim()
          .toLowerCase();


      S.filtered=
        S.words.filter(w=>
          `${w.hanzi} ${w.pinyin} ${w.meaning} ${w.example}`
            .toLowerCase()
            .includes(q)
        );


      S.visible=50;

      fillVocab();
    };


    document.getElementById(
      'tt-more'
    ).onclick=()=>{

      S.visible+=50;

      fillVocab();
    };


    fillVocab();
  }


  /* ===================== HIỂN THỊ TỪ VỰNG ===================== */

  function fillVocab(){

    const body=
      document.getElementById(
        'tt-body'
      );

    const more=
      document.getElementById(
        'tt-more'
      );


    if(!body)return;


    body.innerHTML=
      S.filtered
        .slice(0,S.visible)
        .map((w,i)=>`

          <tr
            class="${
              S.learned[w.id]
                ?'learned'
                :''
            }"
          >

            <td>
              ${i+1}
            </td>


            <td class="hanzi-cell">
              ${esc(w.hanzi)}
            </td>


            <td>
              ${esc(w.pinyin)}
            </td>


            <td>
              ${esc(w.meaning)}
            </td>


            <td>
              ${esc(w.example)}
            </td>


            <td>

              <button
                class="icon-btn"
                data-speak="${esc(w.hanzi)}"
                title="Nghe"
              >
                🔊
              </button>


              <button
                class="icon-btn"
                data-study="${esc(w.id)}"
                title="Học từ"
              >
                →
              </button>

            </td>

          </tr>

        `)
        .join('');


    document
      .querySelectorAll('[data-speak]')
      .forEach(b=>
        b.onclick=()=>speak(
          b.dataset.speak
        )
      );


    document
      .querySelectorAll('[data-study]')
      .forEach(b=>{

        b.onclick=()=>{

          const i=
            S.words.findIndex(
              w=>w.id===b.dataset.study
            );

          if(i>=0){

            S.current=i;

            S.study=true;

            renderContent();
          }

        };

      });


    more.style.display=
      S.visible<S.filtered.length
        ?'inline-flex'
        :'none';
  }


  /* ===================== FLASHCARD ===================== */

  function renderStudy(box){

    const w=S.words[S.current];


    if(!w){

      S.study=false;

      return renderVocab(box);
    }


    box.innerHTML=`

      <div class="study-wrap">

        <div class="study-index">
          ${S.current+1} / ${S.words.length}
        </div>


        <div
          id="tt-flip"
          class="flip-card"
        >

          <div class="flip-inner">


            <div class="flip-face flip-front">

              <div class="front-label">
                NHÌN CHỮ HÁN
              </div>


              <div class="study-hanzi">
                ${esc(w.hanzi)}
              </div>


              <button
                class="speak-btn"
                id="tt-speak"
              >
                🔊 Nghe phát âm
              </button>


              <div class="flip-hint">
                Chạm vào thẻ để lật
              </div>

            </div>


            <div class="flip-face flip-back">

              <div class="front-label">
                MẶT SAU
              </div>


              <div class="study-hanzi small">
                ${esc(w.hanzi)}
              </div>


              <div class="study-pinyin">
                ${esc(w.pinyin)}
              </div>


              <div class="study-meaning">
                ${esc(w.meaning)}
              </div>


              <div class="example-box">

                <div class="example-label">
                  CÂU VÍ DỤ
                </div>


                <div class="example-cn">
                  ${esc(w.example)}
                </div>


                ${
                  w.example
                  ?`
                    <button
                      class="speak-example"
                      id="tt-example"
                    >
                      🔊 Nghe câu ví dụ
                    </button>
                  `
                  :''
                }

              </div>

            </div>

          </div>

        </div>


        <button
          class="flip-button"
          id="tt-flip-btn"
        >
          ↻ Lật thẻ
        </button>


        <div class="study-actions">

          <button
            class="btn secondary"
            id="tt-prev"
            ${S.current===0?'disabled':''}
          >
            ← Từ trước
          </button>


          <button
            class="btn red"
            id="tt-learn"
          >
            ${
              S.learned[w.id]
                ?'✓ Đã học'
                :'Đánh dấu đã học'
            }
          </button>


          <button
            class="btn secondary"
            id="tt-next"
          >
            Từ tiếp →
          </button>

        </div>


        <div class="back-row">

          <button
            class="btn secondary"
            id="tt-list"
          >
            ← Danh sách
          </button>

        </div>

      </div>
    `;


    const flip=()=>
      document
        .getElementById('tt-flip')
        .classList.toggle('flipped');


    document.getElementById(
      'tt-flip'
    ).onclick=flip;


    document.getElementById(
      'tt-flip-btn'
    ).onclick=flip;


    document.getElementById(
      'tt-speak'
    ).onclick=e=>{

      e.stopPropagation();

      speak(w.hanzi);
    };


    document.getElementById(
      'tt-example'
    )?.addEventListener(
      'click',
      e=>{

        e.stopPropagation();

        speak(w.example);

      }
    );


    document.getElementById(
      'tt-prev'
    ).onclick=()=>{

      S.current--;

      renderContent();
    };


    document.getElementById(
      'tt-next'
    ).onclick=()=>{

      S.current=
        (S.current+1)%S.words.length;

      renderContent();
    };


    document.getElementById(
      'tt-learn'
    ).onclick=()=>{

      S.learned[w.id]=true;

      localStorage.setItem(
        'cobi_tangthu_learned',
        JSON.stringify(S.learned)
      );

      renderContent();
    };


    document.getElementById(
      'tt-list'
    ).onclick=()=>{

      S.study=false;

      renderContent();
    };

  }


  /* ===================== KHÓA NGỮ PHÁP / BÀI KHÓA ===================== */

  async function unlock(type){

    const box=
      document.getElementById(
        'tangthu-content'
      );

    if(!box)return;


    box.innerHTML=`

      <div class="card">

        <div class="notice">

          Nội dung ${
            type==='grammar'
              ?'Ngữ pháp'
              :'Bài khóa'
          }
          được bảo vệ.

        </div>


        <button
          class="btn red"
          id="tt-unlock"
        >
          Nhập mã truy cập
        </button>

      </div>
    `;


    document.getElementById(
      'tt-unlock'
    ).onclick=async()=>{

      const code=prompt(
        `Nhập mã truy cập ${
          type==='grammar'
            ?'Ngữ pháp'
            :'Bài khóa'
        }:`
      );


      if(!code)return;


      box.innerHTML=`

        <div class="card">

          <div class="notice">
            Đang xác thực mã và thiết bị...
          </div>

        </div>

      `;


      try{

        const login=
          await api(
            'login',
            code.trim()
          );


        S.token=
          login.token||
          code.trim();


        const data=
          await api(
            type==='grammar'
              ?'getGrammar'
              :'getReading',
            S.token
          );


        if(type==='grammar')
          S.grammar=data.items||[];
        else
          S.reading=data.items||[];


        renderContent();


      }catch(e){

        box.innerHTML=`

          <div class="card">

            <div class="notice">
              ${esc(e.message)}
            </div>


            <button
              class="btn secondary"
              id="tt-retry"
            >
              Thử lại
            </button>

          </div>

        `;


        document.getElementById(
          'tt-retry'
        ).onclick=()=>unlock(type);

      }

    };

  }


  /* ===================== DEVICE ID ===================== */

  function deviceId(){

    let id=
      localStorage.getItem(
        'cobi_device_id'
      );


    if(!id){

      const c=window.crypto;


      id=
        c?.randomUUID
          ?c.randomUUID()
          :`cobi-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`;


      localStorage.setItem(
        'cobi_device_id',
        id
      );

    }


    return id;
  }


  /* ===================== GOOGLE APPS SCRIPT API ===================== */

  async function api(action,code){

    if(
      !TANGTHU_CONFIG.apiUrl||
      TANGTHU_CONFIG.apiUrl.includes('DÁN_')
    ){

      throw Error(
        'Chưa nhập Web App URL trong script.js.'
      );

    }


    const r=
      await fetch(
        TANGTHU_CONFIG.apiUrl,
        {
          method:'POST',

          headers:{
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body:JSON.stringify({

            action,

            code,

            deviceId:deviceId()

          })
        }
      );


    if(!r.ok)
      throw Error(
        'Không kết nối được máy chủ.'
      );


    const data=await r.json();


    if(!data.ok)
      throw Error(
        data.message||
        'Mã truy cập không hợp lệ.'
      );


    return data;
  }


  /* ===================== NGỮ PHÁP ===================== */

  function renderGrammar(box){

    box.innerHTML=`

      <div class="grammar-grid">

        ${
          S.grammar.map(x=>`

            <article class="card grammar-card">

              <h3>
                ${esc(x.TIEUDE)}
              </h3>


              <div class="grammar-structure">
                ${esc(x.CAUTRUC)}
              </div>


              <p>
                ${esc(x.GIAITHICH)}
              </p>


              <div class="example-box">

                <b>例：</b>

                ${esc(x.VIDU)}


                <button
                  class="icon-btn"
                  data-g="${esc(x.VIDU)}"
                >
                  🔊
                </button>

              </div>

            </article>

          `).join('')
        }

      </div>
    `;


    document
      .querySelectorAll('[data-g]')
      .forEach(b=>
        b.onclick=()=>speak(
          b.dataset.g
        )
      );

  }


  /* ===================== BÀI KHÓA ===================== */

  function renderReading(box){

    box.innerHTML=`

      <div class="reading-grid">

        ${
          S.reading.map((x,i)=>`

            <article
              class="card reading-card"
            >

              <div class="reading-head">

                <span>
                  ${esc(x.LEVEL)}
                </span>


                <h3>
                  ${
                    esc(
                      x.TIEUDE||
                      `Bài ${i+1}`
                    )
                  }
                </h3>

              </div>


              <div class="reading-text">
                ${esc(x.TEXT)}
              </div>


              <button
                class="btn secondary tt-pinyin"
                data-i="${i}"
              >
                Hiện Pinyin
              </button>


              <div
                class="reading-pinyin"
                id="tt-p-${i}"
                hidden
              >
                ${esc(x.PINYIN)}
              </div>


              <details>

                <summary>
                  Nghĩa tiếng Việt
                </summary>


                <div class="reading-meaning">
                  ${esc(x.NGHIA)}
                </div>

              </details>


              <button
                class="speak-btn"
                data-r="${esc(x.TEXT)}"
              >
                🔊 Nghe bài khóa
              </button>

            </article>

          `).join('')
        }

      </div>
    `;


    document
      .querySelectorAll('.tt-pinyin')
      .forEach(b=>{

        b.onclick=()=>{

          const e=
            document.getElementById(
              'tt-p-'+b.dataset.i
            );


          e.hidden=!e.hidden;


          b.textContent=
            e.hidden
              ?'Hiện Pinyin'
              :'Ẩn Pinyin';

        };

      });


    document
      .querySelectorAll('[data-r]')
      .forEach(b=>
        b.onclick=()=>speak(
          b.dataset.r
        )
      );

  }


  /* ===================== LỖI ===================== */

  function error(box,msg){

    box.innerHTML=`

      <div class="card">

        <div class="notice">

          ${esc(msg)}

        </div>

      </div>

    `;

  }


  /* ===================== KHỞI ĐỘNG ===================== */

  async function init(){

    try{

      S.learned=
        JSON.parse(
          localStorage.getItem(
            'cobi_tangthu_learned'
          )||'{}'
        );

    }catch(e){

      S.learned={};

    }


    render();


    try{

      await loadVocab();

      renderContent();

    }catch(e){

      error(
        document.getElementById(
          'tangthu-content'
        ),
        e.message
      );

    }

  }


  return{
    render:init
  };

})();


/* ===================== TRANG CHỦ ===================== */

function renderHome(){

  app.innerHTML=`

    <section class="page home-page">

      <div class="hero">

        <div class="hero-kicker">
          漢 · 書 · 語 · 學
        </div>

        <h1>
          <span class="hero-vn">
            Thư Quán Hán Ngữ
          </span>

          <span class="hero-cobi">
            CoBi
          </span>
        </h1>

        <h2>
          一朝入书馆，一生伴汉语
        </h2>

        <p>
          Một ngày nhập Thư Quán,
          trọn đời hành Hán Ngữ.
        </p>

        <div class="hero-ornament">
          — ❖ —
        </div>

      </div>


      <!-- ================= 3 MỤC CHÍNH ================= -->

      <div class="home-main-grid">


        <!-- TÀNG THƯ CÁC -->

        <a
          class="home-main-card"
          href="#knowledge"
        >

          <div class="home-card-symbol">
            藏
          </div>

          <div class="home-card-content">

            <h3>
              Tàng Thư Các
            </h3>

            <p>
              Kho tàng kiến thức – Nền tảng vững bền.
            </p>

            <div class="home-card-cn">
              知识宝库，坚实基础
            </div>

          </div>

          <span class="home-card-arrow">
            进入 →
          </span>

        </a>


        <!-- DU LẠC HIÊN -->

        <a
          class="home-main-card"
          href="https://thuquanhanngucobi.github.io/cobi-du-lac-hien/"
        >

          <div class="home-card-symbol">
            游
          </div>

          <div class="home-card-content">

            <h3>
              Du Lạc Hiên
            </h3>

            <p>
              Ôn tập – Luyện tập – Học mà vui.
            </p>

            <div class="home-card-cn">
              温故练习，学而有乐
            </div>

          </div>

          <span class="home-card-arrow">
            进入 →
          </span>

        </a>


        <!-- KHẢO THÍ ĐƯỜNG -->

        <a
          class="home-main-card"
          href="https://thuquanhanngucobi.github.io/cobi-khao-thi-duong/"
        >

          <div class="home-card-symbol">
            考
          </div>

          <div class="home-card-content">

            <h3>
              Khảo Thí Đường
            </h3>

            <p>
              Luyện đề – Kiểm tra – Chinh phục HSK.
            </p>

            <div class="home-card-cn">
              模拟考试，检验实力
            </div>

          </div>

          <span class="home-card-arrow">
            进入 →
          </span>

        </a>


      </div>

    </section>

  `;

}


/* ===================== ĐIỀU HƯỚNG ===================== */

function route(){

  const h=
    location.hash.slice(1)||
    'home';


  if(h==='knowledge'){

    CoBiTangThu.render();

  }else{

    renderHome();

  }


  document
    .querySelectorAll('.main-nav a')
    .forEach(a=>

      a.classList.toggle(
        'active',
        a.dataset.route===h
      )

    );

}


window.addEventListener(
  'hashchange',
  route
);


route();
