document.addEventListener('DOMContentLoaded', () => {
  const shell = document.getElementById('app-shell');
  const btnHome = document.getElementById('btn-home');
  const navBtns = document.querySelectorAll('.nav-btn');
  const sidebarTitle = document.getElementById('sidebar-title');
  const moduleList = document.getElementById('module-list');
  const iframe = document.getElementById('content-frame');
  const menuToggle = document.getElementById('menu-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  const closeSidebar = () => shell.classList.remove('sidebar-open');

  function setActive(el) {
    document.querySelectorAll('.sub-item, .module-item').forEach(x => x.classList.remove('active-item'));
    if (el) el.classList.add('active-item');
  }

  function openPage(el, path) {
    setActive(el);
    iframe.src = path;
    closeSidebar();
  }

  function goHome() {
    navBtns.forEach(b => b.classList.remove('active'));
    shell.classList.remove('with-sidebar', 'sidebar-open');
    iframe.src = 'home.html';
  }

  function loadSidebar(categoryKey) {
    const data = COBI_DATA[categoryKey];
    if (!data) return;

    shell.classList.add('with-sidebar');
    closeSidebar();
    sidebarTitle.textContent = data.title;
    moduleList.innerHTML = '';

    let first = null; // trang đầu tiên của phân khu, sẽ được mở mặc định

    data.modules.forEach(mod => {
      const li = document.createElement('li');

      if (mod.subModules && mod.subModules.length) {
        // MỤC CÓ DANH SÁCH CON (XỔ XUỐNG)
        li.className = 'module-item has-submenu';

        const title = document.createElement('div');
        title.className = 'menu-title';
        const label = document.createElement('span');
        label.textContent = mod.name;
        const arrow = document.createElement('span');
        arrow.className = 'arrow';
        arrow.textContent = '▼';
        title.appendChild(label);
        title.appendChild(arrow);

        const ul = document.createElement('ul');
        ul.className = 'sub-menu';
        ul.style.display = 'none';

        const setOpen = (open) => {
          ul.style.display = open ? 'block' : 'none';
          arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
        };

        mod.subModules.forEach(sub => {
          const subLi = document.createElement('li');
          subLi.className = 'sub-item';
          subLi.textContent = sub.name;
          subLi.addEventListener('click', (e) => {
            e.stopPropagation();
            openPage(subLi, sub.path);
          });
          ul.appendChild(subLi);
          if (!first) first = { el: subLi, path: sub.path, open: () => setOpen(true) };
        });

        title.addEventListener('click', () => setOpen(ul.style.display === 'none'));
        li.appendChild(title);
        li.appendChild(ul);

      } else {
        // MỤC THƯỜNG (BẤM LÀ MỞ)
        li.className = 'module-item';
        const title = document.createElement('div');
        title.className = 'menu-title';
        const label = document.createElement('span');
        label.textContent = mod.name;
        title.appendChild(label);
        li.appendChild(title);
        li.addEventListener('click', () => openPage(li, mod.path));
        if (!first) first = { el: li, path: mod.path, open: null };
      }

      moduleList.appendChild(li);
    });

    // Mặc định mở trang đầu tiên của phân khu
    if (first) {
      setActive(first.el);
      if (first.open) first.open();
      iframe.src = first.path;
    }
  }

  btnHome.addEventListener('click', goHome);

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSidebar(btn.dataset.target);
    });
  });

  menuToggle.addEventListener('click', () => shell.classList.toggle('sidebar-open'));
  backdrop.addEventListener('click', closeSidebar);

  // Xoay ngang/dọc hoặc kéo rộng cửa sổ: đóng ngăn kéo cho gọn
  window.addEventListener('resize', () => { if (window.innerWidth > 850) closeSidebar(); });

  goHome();
});