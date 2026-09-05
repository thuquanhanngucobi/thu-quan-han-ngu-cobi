window.CoBiTangThu = {
  apiUrl: 'DÁN_APPS_SCRIPT_URL_VÀO_ĐÂY',

  deviceId: null,
  accessCode: null,

  init() {
    let deviceId = localStorage.getItem('cobi_device_id');

    if (!deviceId) {
      deviceId =
        crypto.randomUUID
          ? crypto.randomUUID()
          : 'cobi-' + Date.now() + '-' + Math.random().toString(36).slice(2);

      localStorage.setItem('cobi_device_id', deviceId);
    }

    this.deviceId = deviceId;

    const savedCode = localStorage.getItem('cobi_access_code');

    if (savedCode) {
      this.accessCode = savedCode;
    }
  },

  async login(code) {
    code = String(code || '').trim();

    if (!code) {
      return {
        success: false,
        message: 'Vui lòng nhập mã truy cập.'
      };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'login',
        code: code,
        deviceId: this.deviceId
      })
    });

    const result = await response.json();

    if (result.success) {
      this.accessCode = code;
      localStorage.setItem('cobi_access_code', code);
    }

    return result;
  },

  async getGrammar() {
    return this.getProtectedData('getGrammar');
  },

  async getReading() {
    return this.getProtectedData('getReading');
  },

  async getProtectedData(action) {
    if (!this.accessCode) {
      return {
        success: false,
        message: 'Chưa đăng nhập.'
      };
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: action,
        code: this.accessCode,
        deviceId: this.deviceId
      })
    });

    return await response.json();
  }
};

window.CoBiTangThu.init();