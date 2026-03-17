window.CBCL_STORAGE = (() => {
  const KEYS = {
    users: 'cbcl_users',
    currentUser: 'cbcl_current_user',
    otp: 'cbcl_pending_otp',
    dailyBonus: 'cbcl_daily_bonus',
    stayLoggedIn: 'cbcl_stay_logged_in'
  };

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  const seedDemoUsers = () =>
    deepClone(window.CBCL_CONFIG.demoUsers).map((user) => ({
      ...user,
      lastPlayDate: todayKey()
    }));

  const load = () => {
    const users = localStorage.getItem(KEYS.users);
    const currentUser = localStorage.getItem(KEYS.currentUser);
    const dailyBonus = localStorage.getItem(KEYS.dailyBonus);
    const stayLoggedIn = localStorage.getItem(KEYS.stayLoggedIn);

    return {
      users: users ? JSON.parse(users) : seedDemoUsers(),
      currentUserId: currentUser || null,
      dailyBonus: dailyBonus ? JSON.parse(dailyBonus) : {},
      stayLoggedIn: stayLoggedIn === 'true'
    };
  };

  const save = (state) => {
    localStorage.setItem(KEYS.users, JSON.stringify(state.users));
    localStorage.setItem(KEYS.currentUser, state.currentUserId || '');
    localStorage.setItem(KEYS.dailyBonus, JSON.stringify(state.dailyBonus || {}));
    localStorage.setItem(KEYS.stayLoggedIn, String(Boolean(state.stayLoggedIn)));
  };

  const setOtp = (payload) => localStorage.setItem(KEYS.otp, JSON.stringify(payload));
  const getOtp = () => {
    const raw = localStorage.getItem(KEYS.otp);
    return raw ? JSON.parse(raw) : null;
  };
  const clearOtp = () => localStorage.removeItem(KEYS.otp);

  const reset = () => {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  };

  return { KEYS, load, save, setOtp, getOtp, clearOtp, reset, todayKey };
})();