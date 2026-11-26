/* =====================================================================
   ĐĂNG NHẬP HỌC VIÊN  -  Thư Quán Hán Ngữ CoBi
   Mỗi học viên 1 mã. Mã tự gắn vào MÁY ĐẦU TIÊN đăng nhập (kiểm tra ở
   Google Apps Script). Lần sau máy đó vào tự động; máy khác bị từ chối.
   ===================================================================== */
(function () {
  const FALLBACK_API = 'https://script.google.com/macros/s/AKfycby1TyfXxZVmt2aoSIwOaNXxrrSmOXIHv-CVAU-B_9Xiv-Dxt4LyW2Yd1DSaJIOg4pfUIw/exec';
  const API = (typeof COBI_API_URL !== 'undefined' && COBI_API_URL) ? COBI_API_URL : FALLBACK_API;
  const K = { dev: 'cobi_device', code: 'cobi_code', name: 'cobi_name' };
  const mem = {};   // dự phòng khi trình duyệt chặn localStorage

  const get = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return mem[k] || ''; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } };
  const del = (k) => { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } };

  function device() {
    let d = get(K.dev);
    if (!/^[A-Za-z0-9-]{16,64}$/.test(d)) {
      if (window.crypto && crypto.randomUUID) d = crypto.randomUUID();
      else d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      set(K.dev, d);
    }
    return d;
  }

  const listeners = [];
  const emit = () => listeners.forEach(f => { try { f(); } catch (e) {} });
  window.addEventListener('storage', (e) => { if (e.key === K.code || e.key === K.name) emit(); });

  async function ask(code) {
    const url = API + '?action=authLogin&code=' + encodeURIComponent(code) +
      '&device=' + encodeURIComponent(device()) + '&t=' + Date.now();
    let res;
    try { res = await fetch(url); } catch (e) { const er = new Error('Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.'); er.network = true; throw er; }
    if (!res.ok) { const er = new Error('Máy chủ đang bận (' + res.status + '). Thử lại sau ít phút.'); er.network = true; throw er; }
    let json;
    try { json = await res.json(); } catch (e) { const er = new Error('Máy chủ trả dữ liệu lạ. Hãy báo Thư Chủ.'); er.network = true; throw er; }
    if (!json.success) { const er = new Error(json.message || 'Đăng nhập thất bại.'); er.reason = json.reason || 'invalid'; throw er; }
    return json;
  }

  const AUTH = {
    isLoggedIn: () => !!get(K.code),
    name: () => get(K.name),
    isPublic: (id) => {
      const list = (typeof COBI_ACCESS !== 'undefined' && COBI_ACCESS.publicIds) ? COBI_ACCESS.publicIds : [];
      return list.indexOf(id) > -1;
    },
    can: (id) => AUTH.isPublic(id) || AUTH.isLoggedIn(),

    /* Đăng nhập bằng mã. Thành công: lưu mã + tên. Thất bại: ném lỗi có chữ tiếng Việt. */
    login: async (raw) => {
      const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length < 6) throw new Error('Mã chưa đủ ký tự. Hãy nhập đúng mã Thư Chủ đã gửi.');
      const r = await ask(code);
      set(K.code, code); set(K.name, r.name || 'Học viên');
      emit();
      return r;
    },

    /* Tự kiểm tra lại mã đã lưu (gọi khi mở trang). Mất mạng thì vẫn giữ đăng nhập. */
    verify: async () => {
      const code = get(K.code);
      if (!code) return true;
      try {
        const r = await ask(code);
        if (r.name && r.name !== get(K.name)) { set(K.name, r.name); emit(); }
        return true;
      } catch (e) {
        if (e.network) return true;
        AUTH.logout(e.message);    // mã bị khóa / bị gỡ / đã gắn máy khác
        return false;
      }
    },

    logout: (why) => { del(K.code); del(K.name); AUTH.lastMessage = why || ''; emit(); },
    lastMessage: '',
    onChange: (f) => listeners.push(f)
  };

  window.COBI_AUTH = AUTH;
})();
