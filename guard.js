/* Chèn dòng này vào ĐẦU mỗi trang dành cho học viên (trong <head>):
     <script src="../guard.js"></script>      (số "../" tùy độ sâu thư mục)
   Nếu máy chưa đăng nhập, trang sẽ bị che và đưa về trang chủ.
   Lưu ý: đây là "cổng" cho học viên, không phải két sắt (xem hướng dẫn). */
(function () {
  var ok = false;
  try { ok = !!localStorage.getItem('cobi_code'); } catch (e) {}
  if (ok) return;
  var src = document.currentScript ? document.currentScript.src : '';
  var home = src ? src.replace(/guard\.js.*$/, 'index.html') : './';
  var s = document.createElement('style');
  s.textContent = 'html{background:#fbf8f0}body{display:none!important}';
  document.head.appendChild(s);
  document.addEventListener('DOMContentLoaded', function () {
    var d = document.createElement('div');
    d.style.cssText = 'font:16px/1.6 Georgia,serif;text-align:center;padding:60px 20px;color:#4a3525;display:block';
    d.innerHTML = '🔒 <b>Trang dành cho học viên Thư Quán.</b><br>Hãy mở trang chủ và nhập mã học viên.<br><br><a href="' + home + '" target="_top" style="color:#1e3a5f">Về trang chủ</a>';
    document.documentElement.appendChild(d);
    try { if (window.top !== window) window.top.postMessage('cobi-need-login', '*'); } catch (e) {}
  });
})();
