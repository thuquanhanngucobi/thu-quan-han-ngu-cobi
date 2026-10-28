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
    iframe.src = 'home.html';
  }

  function clearActive() {
    document.querySelectorAll('.sub-item, .module-item').forEach(el => el.classList.remove('active-item'));
  }

  function setExpanded(entry, on) {
    if (!entry || !entry.ul) return;
    entry.ul.style.display = on ? 'block' : 'none';
    entry.arrow.style.transform = on ? 'rotate(180deg)' : 'rotate(0deg)';
  }

  /* ---- Dựng thanh bên cho một phân khu ---- */
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

    function openEntry(entry) {
      if (entry.children) {            // mục có danh sách con: xổ ra rồi mở mục con đầu tiên
        setExpanded(entry, true);
        openEntry(entry.children[0]);
        return;
      }
      clearActive();
      entry.el.classList.add('active-item');
      if (entry.parent) setExpanded(entry.parent, true);
      iframe.src = entry.path;
      if (isMobile()) closeSidebar();
    }

    data.modules.forEach(mod => {
      const li = document.createElement('li');
      const entry = { el: li, path: mod.path };
      refs[mod.id] = entry;

      if (mod.subModules) {
        li.className = 'module-item has-submenu';
        li.innerHTML = '<div class="menu-title"><span>' + mod.name + '</span> <span class="arrow">▼</span></div>';

        const ul = document.createElement('ul');
        ul.className = 'sub-menu';
        ul.style.display = 'none';
        entry.ul = ul;
        entry.arrow = li.querySelector('.arrow');
        entry.children = [];

        mod.subModules.forEach(sub => {
          const subLi = document.createElement('li');
          subLi.className = 'sub-item';
          subLi.textContent = sub.name;
          const subEntry = { el: subLi, path: sub.path, parent: entry };
          refs[sub.id] = subEntry;
          entry.children.push(subEntry);
          subLi.onclick = (e) => { e.stopPropagation(); openEntry(subEntry); };
          ul.appendChild(subLi);
        });

        li.appendChild(ul);
        li.querySelector('.menu-title').onclick = () => setExpanded(entry, ul.style.display !== 'block');

      } else {
        li.className = 'module-item';
        li.innerHTML = '<div class="menu-title"><span>' + mod.name + '</span></div>';
        li.onclick = () => openEntry(entry);
      }

      moduleList.appendChild(li);
    });

    // Mở mục được chỉ định (từ thẻ trang chủ) hoặc mục đầu tiên
    const first = data.modules[0];
    openEntry((targetId && refs[targetId]) || refs[first.id]);
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

  goHome();
});
