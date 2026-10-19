document.addEventListener('DOMContentLoaded', () => {
  const btnHome = document.getElementById('btn-home');
  const navBtns = document.querySelectorAll('.nav-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarTitle = document.getElementById('sidebar-title');
  const moduleList = document.getElementById('module-list');
  const iframe = document.getElementById('content-frame');
  const menuToggle = document.getElementById('menu-toggle');

  function goHome() {
    navBtns.forEach(b => b.classList.remove('active'));
    sidebar.style.display = 'none';
    menuToggle.style.display = 'none';
    iframe.src = 'home.html';
  }

  function loadSidebar(categoryKey) {
    const data = COBI_DATA[categoryKey];
    if (!data) return;

    sidebar.style.display = 'flex';
    if (window.innerWidth <= 850) menuToggle.style.display = 'block';

    sidebarTitle.textContent = data.title;
    moduleList.innerHTML = '';

    data.modules.forEach((mod, index) => {
      const li = document.createElement('li');
      
      // NẾU LÀ MỤC CÓ DANH SÁCH CON (XỔ XUỐNG)
      if (mod.subModules) {
        li.className = 'module-item has-submenu';
        li.innerHTML = `<div class="menu-title"><span>${mod.name}</span> <span class="arrow">▼</span></div>`;
        
        const ul = document.createElement('ul');
        ul.className = 'sub-menu';
        ul.style.display = 'none'; // Mặc định thu gọn

        mod.subModules.forEach(sub => {
          const subLi = document.createElement('li');
          subLi.className = 'sub-item';
          subLi.textContent = sub.name;
          
          subLi.onclick = (e) => {
            e.stopPropagation(); // Ngăn sự kiện click truyền lên cha
            document.querySelectorAll('.sub-item, .module-item').forEach(el => el.classList.remove('active-item'));
            subLi.classList.add('active-item');
            iframe.src = sub.path;
            if (window.innerWidth <= 850) sidebar.classList.remove('open');
          };
          ul.appendChild(subLi);
        });

        li.appendChild(ul);

        // Hiệu ứng bấm để xổ xuống
        li.querySelector('.menu-title').onclick = () => {
          const isExpanded = ul.style.display === 'block';
          ul.style.display = isExpanded ? 'none' : 'block';
          li.querySelector('.arrow').style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        };

      } else {
        // NẾU LÀ MỤC THƯỜNG (BẤM VÀO LUÔN)
        li.className = 'module-item';
        li.innerHTML = `<div class="menu-title"><span>${mod.name}</span></div>`;
        
        li.onclick = () => {
          document.querySelectorAll('.sub-item, .module-item').forEach(el => el.classList.remove('active-item'));
          li.classList.add('active-item');
          iframe.src = mod.path;
          if (window.innerWidth <= 850) sidebar.classList.remove('open');
        };
      }
      
      moduleList.appendChild(li);
    });

    // Mặc định load trang đầu tiên
    if (data.modules.length > 0) {
      if (data.modules[0].subModules) {
        iframe.src = data.modules[0].subModules[0].path;
      } else {
        iframe.src = data.modules[0].path;
      }
    }
  }

  btnHome.onclick = goHome;

  navBtns.forEach(btn => {
    btn.onclick = () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadSidebar(btn.dataset.target);
    };
  });

  menuToggle.onclick = () => sidebar.classList.toggle('open');

  goHome();
});