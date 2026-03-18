(() => {
  const state = window.CBCL_STORAGE.load();
  const config = window.CBCL_CONFIG;
  const storage = window.CBCL_STORAGE;
  const auth = window.CBCL_AUTH;
  const board = window.CBCL_LEADERBOARD;
  const sounds = window.CBCL_SOUNDS;
  const batting = window.CBCL_BATTING;
  const bowling = window.CBCL_BOWLING;
  const fb = window.CBCL_FIREBASE || null;

  const els = {
    splash: document.getElementById('splash-screen'),
    screens: document.querySelectorAll('.screen'),
    tabs: document.querySelectorAll('.mobile-tab, [data-nav]'),
    leagueTitle: document.getElementById('league-title'),
    rulesSheet: document.getElementById('rules-sheet'),
    closeRulesBtn: document.getElementById('close-rules-btn'),
    globalBoostPill: document.getElementById('global-boost-pill'),
    arenaBoostPill: document.getElementById('arena-boost-pill'),
    toast: document.getElementById('toast'),
    demoLoginBtn: document.getElementById('demo-login-btn'),
    sendOtpBtn: document.getElementById('send-otp-btn'),
    verifyBtn: document.getElementById('verify-btn'),
    name: document.getElementById('name'),
    phone: document.getElementById('phone'),
    nickname: document.getElementById('nickname'),
    otp: document.getElementById('otp'),
    otpPreview: document.getElementById('otp-preview'),
    stayLoggedIn: document.getElementById('stay-logged-in'),
    avatarBox: document.getElementById('avatar-box'),
    playerName: document.getElementById('player-name'),
    playerMeta: document.getElementById('player-meta'),
    statPoints: document.getElementById('stat-points'),
    statRank: document.getElementById('stat-rank'),
    profileRuns: document.getElementById('profile-runs'),
    profileWickets: document.getElementById('profile-wickets'),
    profileRunsFull: document.getElementById('profile-runs-full'),
    profileWicketsFull: document.getElementById('profile-wickets-full'),
    profileSixesFull: document.getElementById('profile-sixes-full'),
    profileDotsFull: document.getElementById('profile-dots-full'),
    unlockBattingBtn: document.getElementById('unlock-batting-btn'),
    unlockBowlingBtn: document.getElementById('unlock-bowling-btn'),
    arena: document.getElementById('arena'),
    leaderboardPreview: document.getElementById('leaderboard-preview'),
    statsPreview: document.getElementById('stats-preview'),
    leaderboardFull: document.getElementById('leaderboard-full'),
    leaderboardStatsFull: document.getElementById('leaderboard-stats-full'),
    resetBtn: document.getElementById('reset-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    batStartBtn: document.getElementById('bat-start-btn'),
    batShotBtn: document.getElementById('bat-shot-btn'),
    bowlStartBtn: document.getElementById('bowl-start-btn'),
    bowlReleaseBtn: document.getElementById('bowl-release-btn')
  };

  const toast = (message) => {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  };

  const navigate = (name) => {
    els.screens.forEach((screen) => {
      screen.classList.toggle('active', screen.id === `screen-${name}`);
    });
    document.querySelectorAll('.mobile-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.nav === name);
    });
  };

  const currentUser = () => state.users.find((user) => user.id === state.currentUserId) || null;

  const isBoostTime = () => {
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const start = config.matchBoost.startHour * 60 + config.matchBoost.startMinute;
    const end = config.matchBoost.endHour * 60 + config.matchBoost.endMinute;
    return mins >= start && mins <= end;
  };

  const updateBoostPills = () => {
    const text = isBoostTime()
      ? '🔥 Match Boost LIVE • 2× points'
      : '⏳ Match Boost • 7:00 PM to 11:30 PM';
    els.globalBoostPill.textContent = text;
    if (els.arenaBoostPill) els.arenaBoostPill.textContent = text;
  };

  const updateProfile = () => {
    const user = currentUser();
    if (!user) return;

    const pointsSorted = board.sortUsersByPoints(state.users);
    const rank = pointsSorted.findIndex((item) => item.id === user.id) + 1;

    els.playerName.textContent = user.nickname || user.name;
    els.playerMeta.textContent = `${user.name} • Rank #${rank || '-'}`;
    els.statPoints.textContent = user.totalPoints || 0;
    els.statRank.textContent = rank ? `#${rank}` : '#-';
    els.profileRuns.textContent = user.runs || 0;
    els.profileWickets.textContent = user.wickets || 0;
    els.profileRunsFull.textContent = user.runs || 0;
    els.profileWicketsFull.textContent = user.wickets || 0;
    els.profileSixesFull.textContent = user.sixes || 0;
    els.profileDotsFull.textContent = user.matchesPlayed || 0;
    els.avatarBox.textContent = board.initials(user.nickname || user.name);
  };

  const updateBoards = () => {
    const pointsSorted = board.sortUsersByPoints(state.users);
    els.leaderboardPreview.innerHTML = board.renderRows(pointsSorted.slice(0, 5), state.currentUserId);
    els.leaderboardFull.innerHTML = board.renderRows(pointsSorted, state.currentUserId);
    els.statsPreview.innerHTML = board.renderStatBlocks(state.users);
    els.leaderboardStatsFull.innerHTML = board.renderStatBlocks(state.users);
  };

  const setArenaDefault = () => {
    els.arena.innerHTML = `
      <div>
        <h2>Choose your mode</h2>
        <p>Every ball updates the live leaderboard instantly.</p>
      </div>
    `;
  };

  const refresh = () => {
    updateBoostPills();
    updateProfile();
    updateBoards();
    storage.save(state);
  };

  const simulateRivalsTick = () => {
    const rivals = state.users.filter((u) => u.id !== state.currentUserId);
    if (!rivals.length) return;

    const movers = rivals.sort(() => Math.random() - 0.5).slice(0, Math.min(2, rivals.length));
    movers.forEach((rival) => {
      const gain = Math.random();
      if (gain > 0.78) {
        rival.totalPoints += 6;
        rival.runs = (rival.runs || 0) + 6;
        rival.sixes = (rival.sixes || 0) + 1;
      } else if (gain > 0.55) {
        rival.totalPoints += 4;
        rival.runs = (rival.runs || 0) + 4;
      } else if (gain > 0.3) {
        rival.totalPoints += 2;
        rival.runs = (rival.runs || 0) + 2;
      } else {
        rival.totalPoints += 1;
        rival.runs = (rival.runs || 0) + 1;
      }
      rival.matchesPlayed = (rival.matchesPlayed || 0) + 1;
    });
  };

  const saveResultToLocal = (user, mode, outcome) => {
    const multiplier = isBoostTime() ? config.matchBoost.multiplier : 1;
    const finalPoints = outcome.points * multiplier;

    user.totalPoints = (user.totalPoints || 0) + finalPoints;
    user.matchesPlayed = (user.matchesPlayed || 0) + 1;
    user.runs = (user.runs || 0) + (outcome.runs || 0);
    user.wickets = (user.wickets || 0) + (outcome.wickets || 0);
    user.sixes = (user.sixes || 0) + (outcome.sixes || 0);
    user.dots = (user.dots || 0) + 1;
    user.history = user.history || [];
    user.history.push({
      mode,
      label: outcome.label,
      finalPoints,
      ts: new Date().toISOString()
    });
    if (user.history.length > 30) user.history = user.history.slice(-30);

    return finalPoints;
  };

  const showArenaMoment = async (mode, outcome, finalPoints) => {
    const circle = document.querySelector(mode === 'bat' ? '.batting-circle' : '.bowling-circle');
    if (!circle) return;

    const crowd = circle.querySelector('.crowd-overlay');
    if (crowd) crowd.classList.add('animate-crowd-flash');

    const isNegative = outcome.type === 'negative';
    const overlay = document.createElement('div');
    overlay.className = `result-overlay ${isNegative ? 'negative' : ''} animate-result-burst`;
    overlay.innerHTML = `
      <div class="result-label">${outcome.label}</div>
      <div class="result-points">${finalPoints > 0 ? '+' : ''}${finalPoints} pts</div>
    `;

    const floating = document.createElement('div');
    floating.className = `floating-score ${isNegative ? 'negative' : ''} animate-floating-score`;
    floating.textContent = mode === 'bat'
      ? `${outcome.label} Run${outcome.label === '1' ? '' : 's'}`
      : (['Bowled', 'Catch', 'LBW'].includes(outcome.label) ? outcome.label : outcome.label);

    circle.appendChild(overlay);
    circle.appendChild(floating);

    await new Promise((resolve) => setTimeout(resolve, 700));

    overlay.remove();
    floating.remove();
    if (crowd) crowd.classList.remove('animate-crowd-flash');
  };

  const showResult = (mode, outcome, finalPoints) => {
    const tone = outcome.type === 'negative' ? 'negative' : outcome.type === 'gold' ? 'gold' : 'positive';
    const sign = finalPoints > 0 ? '+' : '';
    els.arena.innerHTML = `
      <div class="animate-reveal">
        <div class="outcome ${tone}">${outcome.label}</div>
        <h2>${sign}${finalPoints} points</h2>
        <p>${isBoostTime() ? 'Match Boost doubled it.' : 'Leaderboard updated live.'}</p>
      </div>
    `;
    navigate('dashboard');
  };

  const finishPlay = async (mode, outcome) => {
    const user = currentUser();
    if (!user) return;

    let finalPoints = saveResultToLocal(user, mode, outcome);

    if (fb && auth.hasFirebase() && !String(user.id).startsWith('u_')) {
      try {
        const saved = await fb.saveGameResult({
          uid: user.id,
          mode,
          outcome,
          config
        });

        Object.assign(user, {
          totalPoints: saved.totalPoints,
          matchesPlayed: saved.matchesPlayed,
          runs: saved.runs,
          wickets: saved.wickets,
          sixes: saved.sixes,
          dots: saved.dots,
          streak: saved.streak,
          playsToday: saved.playsToday,
          lastPlayDate: saved.lastPlayDate,
          history: saved.history
        });

        finalPoints = saved.finalPoints;
      } catch (error) {
        console.error(error);
      }
    }

    simulateRivalsTick();

    if (mode === 'bat') {
      if (outcome.label === '6') {
        sounds.play('sixer');
        sounds.play('crowdCheer');
      } else if (outcome.label === '4') {
        sounds.play('batHit');
        sounds.play('crowdCheer');
      } else {
        sounds.play('batHit');
      }
    } else {
      if (['Bowled', 'Catch', 'LBW'].includes(outcome.label)) {
        sounds.play('wicket');
        sounds.play('crowdCheer');
      } else {
        sounds.play('reveal');
      }
    }

    await showArenaMoment(mode, outcome, finalPoints);
    refresh();
    showResult(mode, outcome, finalPoints);
    toast(`${mode === 'bat' ? 'Batting' : 'Bowling'}: ${outcome.label}`);
  };

  els.tabs.forEach((node) => {
    node.addEventListener('click', () => {
      const target = node.dataset.nav;
      if (target) navigate(target);
    });
  });

  els.leagueTitle.addEventListener('click', () => {
    els.rulesSheet.classList.remove('hidden');
  });

  els.closeRulesBtn.addEventListener('click', () => {
    els.rulesSheet.classList.add('hidden');
  });

  els.unlockBattingBtn.addEventListener('click', () => {
    batting.resetBattingUI();
    navigate('batting');
  });

  els.unlockBowlingBtn.addEventListener('click', () => {
    bowling.resetBowlingUI();
    navigate('bowling');
  });

  els.demoLoginBtn?.addEventListener('click', () => {
    state.currentUserId = state.users[0].id;
    refresh();
    navigate('dashboard');
    toast('Demo player loaded');
  });

  els.sendOtpBtn?.addEventListener('click', async () => {
    const name = els.name.value.trim();
    const phone = els.phone.value.trim();

    if (!name || !auth.PHONE_RE.test(phone)) {
      toast('Enter valid name and phone');
      return;
    }

    try {
      const result = await auth.createOtp(phone);
      if (result.mode === 'demo' && result.otp) {
        els.otpPreview.classList.remove('hidden');
        els.otpPreview.innerHTML = `<strong>Demo OTP:</strong> ${result.otp}`;
      } else {
        els.otpPreview.classList.add('hidden');
      }
      toast('OTP sent');
    } catch (error) {
      console.error(error);
      toast('OTP send failed');
    }
  });

  els.verifyBtn?.addEventListener('click', async () => {
    const name = els.name.value.trim();
    const phone = els.phone.value.trim();
    const nickname = els.nickname.value.trim();
    const otp = els.otp.value.trim();
    const stayLoggedIn = els.stayLoggedIn.checked;

    if (!name || !auth.PHONE_RE.test(phone)) {
      toast('Enter valid name and phone');
      return;
    }

    try {
      const verifyResult = await auth.verifyOtp(phone, otp);
      if (!verifyResult.ok) {
        toast('OTP incorrect');
        return;
      }

      const user = await auth.upsertUser({
        state,
        name,
        phone,
        nickname,
        firebaseUser: verifyResult.firebaseUser || null,
        stayLoggedIn
      });

      refresh();
      navigate('dashboard');
      setArenaDefault();
      toast(`Welcome ${user.nickname || user.name}`);
    } catch (error) {
      console.error(error);
      toast('Verification failed');
    }
  });

  els.batStartBtn?.addEventListener('click', async () => {
    sounds.play('tap');
    batting.resetBattingUI();
    await batting.animateDelivery();
  });

  els.batShotBtn?.addEventListener('click', async () => {
    sounds.play('batHit');
    const outcome = await batting.playShot();
    if (outcome) await finishPlay('bat', outcome);
  });

  els.bowlStartBtn?.addEventListener('click', async () => {
    sounds.play('tap');
    bowling.resetBowlingUI();
    await bowling.startRunUp();
  });

  els.bowlReleaseBtn?.addEventListener('click', async () => {
    sounds.play('tap');
    const outcome = await bowling.releaseBall();
    if (outcome) await finishPlay('bowl', outcome);
  });

  els.resetBtn?.addEventListener('click', () => {
    storage.reset();
    location.reload();
  });

  els.logoutBtn?.addEventListener('click', () => {
    state.currentUserId = null;
    storage.save(state);
    navigate('home');
    toast('Logged out');
  });

  const bootSplash = () => {
    if (!els.splash) return;
    setTimeout(() => {
      els.splash.classList.add('hide');
    }, 1750);
  };

  updateBoostPills();
  setArenaDefault();
  refresh();
  navigate(state.currentUserId ? 'dashboard' : 'home');
  bootSplash();

  setInterval(() => {
    simulateRivalsTick();
    refresh();
  }, 9000);

  setInterval(updateBoostPills, 30000);
})();