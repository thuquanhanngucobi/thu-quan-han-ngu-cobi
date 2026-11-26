document.addEventListener('DOMContentLoaded', () => {
  const shell = document.getElementById('app-shell');
  const btnHome = document.getElementById('btn-home');
  const navBtns = document.querySelectorAll('.nav-btn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const sidebarTitle = document.getElementById('sidebar-title');
  const moduleList = document.getElementById('module-list');
  const iframe = document.getElementById('content-frame');
  const menuToggle = document.getElementById('menu-toggle');
  const seal = document.getElementById('brand-seal');

  const isMobile = () => window.innerWidth <= 850;

  /* ---- Áp ảnh nền và logo từ config.js (PHẦN 2) ---- */
  const IMG = (typeof COBI_IMAGES !== 'undefined') ? COBI_IMAGES : {};
  if (IMG.background) {
    document.documentElement.style.setProperty('--bg-image', 'url("' + IMG.background + '")');
  }
  if (IMG.logo) {
    seal.classList.add('has-logo');
    seal.innerHTML = '<img src="' + IMG.logo + '" alt="CoBi">';
  }

  /* ---- Đăng nhập học viên ---- */
  const A = window.COBI_AUTH;
  const userBtn = document.getElementById('user-btn');
  const userTxt = document.getElementById('user-txt');
  const modal = document.getElementById('login-modal');
  const form = document.getElementById('lm-form');
  const outBox = document.getElementById('lm-out');
  const codeInput = document.getElementById('lm-code');
  const msg = document.getElementById('lm-msg');
  const goBtn = document.getElementById('lm-go');
  const lmTitle = document.getElementById('lm-title');

  let current = { type: 'home', entry: null };   // đang xem gì, để mở lại khi đăng nhập xong

  (function fillContact() {
    const c = (typeof COBI_SITE !== 'undefined' && COBI_SITE.contact) || {};
    const bits = [];
    if (c.zalo) bits.push('<a href="' + c.zalo + '" target="_blank" rel="noopener">Zalo</a>');
    if (c.facebook) bits.push('<a href="' + c.facebook + '" target="_blank" rel="noopener">Facebook</a>');
    if (c.phone) bits.push('số ' + c.phone);
    if (bits.length) document.getElementById('lm-contact').innerHTML = bits.join(' · ');
  })();

  function paintUser() {
    const on = A.isLoggedIn();
    userBtn.classList.toggle('on', on);
    userTxt.textContent = on ? A.name() : 'Đăng nhập';
    userBtn.setAttribute('aria-label', on ? 'Tài khoản học viên' : 'Đăng nhập học viên');
  }

  function openLogin(note) {
    const on = A.isLoggedIn();
    outBox.hidden = !on;
    form.hidden = on;
    lmTitle.textContent = on ? 'Tài khoản học viên' : 'Cửa dành cho học viên';
    document.getElementById('lm-name').textContent = A.name();
    msg.textContent = note || '';
    modal.hidden = false;
    if (!on) setTimeout(() => codeInput.focus(), 50);
  }
  function closeLogin() { modal.hidden = true; }
  window.cobiLogin = () => openLogin();

  userBtn.onclick = () => openLogin();
  document.getElementById('lm-close').onclick = closeLogin;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeLogin(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLogin(); });
  document.getElementById('lm-logout').onclick = () => { A.logout(); closeLogin(); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    goBtn.disabled = true; goBtn.textContent = 'Đang kiểm tra…';
    try {
      await A.login(codeInput.value);
      codeInput.value = '';
      closeLogin();
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      goBtn.disabled = false; goBtn.textContent = 'Vào Thư Quán';
    }
  });

  /* ---- Menu trượt (điện thoại) ---- */
  function openSidebar()  { sidebar.classList.add('open');    backdrop.classList.add('show'); }
  function closeSidebar() { sidebar.classList.remove('open'); backdrop.classList.remove('show'); }

  function setActiveNav(key) {
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.target === key));
  }

  function goHome() {
    setActiveNav('home');
    shell.classList.remove('has-sidebar');
    shell.classList.add('is-home');
    closeSidebar();
    current = { type: 'home', entry: null };
    iframe.src = 'home.html?v=5';
  }

  function clearActive() {
    document.querySelectorAll('.sub-item, .module-item').forEach(el => el.classList.remove('active-item'));
  }

  function setExpanded(entry, on) {
    if (!entry || !entry.ul) return;
    entry.ul.style.display = on ? 'block' : 'none';
    entry.arrow.style.transform = on ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  /* ---- Dựng thanh bên cho một phân khu (hỗ trợ nhiều cấp lồng nhau) ---- */
  function loadSidebar(key, targetId) {
    const data = COBI_DATA[key];
    if (!data) return;

    setActiveNav(key);
    shell.classList.add('has-sidebar');
    shell.classList.remove('is-home');
    closeSidebar();
    sidebarTitle.textContent = data.title;
    moduleList.innerHTML = '';

    const refs = {};   // id -> mục menu
    const allEntries = [];   // mọi mục (kể cả khi trùng id) để gắn dấu khóa

    function openEntry(entry) {
      if (!entry) return;
      if (entry.children) {            // nhóm: xổ ra rồi mở mục con đầu tiên
        setExpanded(entry, true);
        for (let p = entry.parent; p; p = p.parent) setExpanded(p, true);
        if (entry.children.length) openEntry(entry.children[0]);
        return;
      }
      clearActive();
      entry.el.classList.add('active-item');
      // xổ tất cả các nhóm cha
      for (let p = entry.parent; p; p = p.parent) setExpanded(p, true);
      current = { type: 'entry', entry: entry };
      iframe.src = A.can(entry.id)
        ? entry.path
        : 'lock.html?v=5&name=' + encodeURIComponent(entry.title || '');
      if (isMobile()) closeSidebar();
    }

    // Tạo một mục (đệ quy). depth 0 = cấp ngoài cùng.
    function buildItem(item, parent, depth) {
      const li = document.createElement('li');
      const entry = { id: item.id, title: String(item.name || '').replace(/^\d+\.\s*/, ''), el: li, path: item.path, parent: parent };
      refs[item.id] = entry;
      allEntries.push(entry);
      li._entry = entry;

      if (item.subModules) {
        li.className = (depth === 0 ? 'module-item' : 'sub-item') + ' has-submenu';
        li.innerHTML = '<div class="menu-title"><span>' + item.name + '</span> <span class="arrow">▼</span></div>';

        const ul = document.createElement('ul');
        ul.className = 'sub-menu';
        ul.style.display = 'none';
        entry.ul = ul;
        entry.arrow = li.querySelector('.arrow');
        entry.children = [];

        item.subModules.forEach(sub => {
          const childLi = buildItem(sub, entry, depth + 1);
          entry.children.push(childLi._entry);
          ul.appendChild(childLi);
        });

        li.appendChild(ul);
        li.querySelector('.menu-title').onclick = (e) => {
          e.stopPropagation();
          setExpanded(entry, ul.style.display !== 'block');
        };

      } else if (depth === 0) {
        li.className = 'module-item';
        li.innerHTML = '<div class="menu-title"><span>' + item.name + '</span></div>';
        li.onclick = () => openEntry(entry);

      } else {
        li.className = 'sub-item';
        li.textContent = item.name;
        li.onclick = (e) => { e.stopPropagation(); openEntry(entry); };
      }

      return li;
    }

    data.modules.forEach(mod => moduleList.appendChild(buildItem(mod, null, 0)));

    lockEntries = allEntries;
    updateLocks();

    // Mở mục được chỉ định (từ thẻ trang chủ) hoặc mục đầu tiên mà người xem được phép vào
    const topEntries = data.modules.map(m => refs[m.id]);
    const firstOpen = topEntries.find(e => !isLocked(e)) || topEntries[0];
    openEntry((targetId && refs[targetId]) || firstOpen);
  }

  /* Hiện dấu khóa trên mục chưa được phép vào (nhóm bị khóa khi mọi mục con đều khóa) */
  let lockEntries = [];
  function isLocked(e) { return e.children ? e.children.every(isLocked) : !A.can(e.id); }
  function updateLocks() {
    lockEntries.forEach(e => e.el.classList.toggle('is-locked', isLocked(e)));
  }

  /* Trang chủ gọi hàm này khi bấm vào một mục trên thẻ */
  window.cobiOpen = (key, id) => loadSidebar(key, id);

  btnHome.onclick = goHome;

  navBtns.forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.target === 'home') goHome();
      else loadSidebar(btn.dataset.target);
    };
  });

  menuToggle.onclick = () => (sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  backdrop.onclick = closeSidebar;
  window.addEventListener('resize', () => { if (!isMobile()) closeSidebar(); });

  /* Khi trạng thái đăng nhập đổi: cập nhật nút, dấu khóa và trang đang xem */
  A.onChange(() => {
    paintUser();
    updateLocks();
    if (current.type === 'home') { iframe.src = 'home.html?v=5'; }
    else if (current.entry) {
      const en = current.entry;
      iframe.src = A.can(en.id) ? en.path : 'lock.html?v=5&name=' + encodeURIComponent(en.title || '');
    }
    if (!A.isLoggedIn() && A.lastMessage) { openLogin(A.lastMessage); A.lastMessage = ''; }
  });

  // Trang con báo "cần đăng nhập"
  window.addEventListener('message', (e) => { if (e.data === 'cobi-need-login') openLogin(); });

  paintUser();
  goHome();
  A.verify();     // kiểm tra lại mã đã lưu với máy chủ (mất mạng thì vẫn giữ đăng nhập)
});
