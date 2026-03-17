window.CBCL_AUTH = ((storage) => {
  const PHONE_RE = /^[0-9]{10}$/;

  const hasFirebase = () => Boolean(window.CBCL_FIREBASE);

  const createOtp = async (phone, containerId = 'recaptcha-container') => {
    if (hasFirebase()) {
      const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
      await window.CBCL_FIREBASE.sendOtp(formatted, containerId);
      return { mode: 'firebase' };
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    storage.setOtp({ phone, otp, createdAt: Date.now() });
    return { mode: 'demo', otp };
  };

  const verifyOtp = async (phone, otp) => {
    if (hasFirebase()) {
      const fbUser = await window.CBCL_FIREBASE.verifyOtp(otp);
      return { ok: true, firebaseUser: fbUser };
    }

    const pending = storage.getOtp();
    const ok = Boolean(pending && pending.phone === phone && pending.otp === otp);
    return { ok, firebaseUser: null };
  };

  const upsertUser = async ({ state, name, phone, nickname, firebaseUser, stayLoggedIn }) => {
    if (hasFirebase() && firebaseUser) {
      const profile = await window.CBCL_FIREBASE.upsertUserProfile({
        uid: firebaseUser.uid,
        phone: firebaseUser.phoneNumber || `+91${phone}`,
        name,
        nickname,
        profilePhoto: ''
      });

      let user = state.users.find((item) => item.id === firebaseUser.uid);
      if (!user) {
        user = {
          id: firebaseUser.uid,
          name: profile.name,
          phone,
          nickname: profile.nickname || '',
          profilePhoto: '',
          totalPoints: profile.totalPoints || 0,
          matchesPlayed: profile.matchesPlayed || 0,
          runs: profile.runs || 0,
          wickets: profile.wickets || 0,
          sixes: profile.sixes || 0,
          dots: profile.dots || 0,
          streak: profile.streak || 0,
          playsToday: profile.playsToday || 0,
          lastPlayDate: profile.lastPlayDate || '',
          history: profile.history || []
        };
        state.users.push(user);
      } else {
        Object.assign(user, {
          name: profile.name,
          nickname: profile.nickname || '',
          totalPoints: profile.totalPoints || 0,
          matchesPlayed: profile.matchesPlayed || 0,
          runs: profile.runs || 0,
          wickets: profile.wickets || 0,
          sixes: profile.sixes || 0,
          dots: profile.dots || 0,
          streak: profile.streak || 0,
          playsToday: profile.playsToday || 0,
          lastPlayDate: profile.lastPlayDate || '',
          history: profile.history || []
        });
      }

      state.currentUserId = firebaseUser.uid;
      state.stayLoggedIn = Boolean(stayLoggedIn);
      storage.clearOtp();
      storage.save(state);
      return user;
    }

    let user = state.users.find((item) => item.phone === phone);
    if (!user) {
      user = {
        id: `u_${Date.now()}`,
        name,
        phone,
        nickname: nickname || '',
        profilePhoto: '',
        totalPoints: 0,
        matchesPlayed: 0,
        runs: 0,
        wickets: 0,
        sixes: 0,
        dots: 0,
        streak: 0,
        playsToday: 0,
        lastPlayDate: '',
        history: []
      };
      state.users.push(user);
    } else {
      user.name = name;
      user.nickname = nickname || user.nickname;
    }

    state.currentUserId = user.id;
    state.stayLoggedIn = Boolean(stayLoggedIn);
    storage.clearOtp();
    storage.save(state);
    return user;
  };

  return { PHONE_RE, createOtp, verifyOtp, upsertUser, hasFirebase };
})(window.CBCL_STORAGE);