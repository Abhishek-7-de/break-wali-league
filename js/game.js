window.CBCL_GAME = ((config, storage) => {
  let isAnimating = false;

  const isBoostTime = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;
    const mins = now.getHours() * 60 + now.getMinutes();

    if (config.iplMatches && config.iplMatches.length > 0) {
      const todayMatches = config.iplMatches.filter(match => match.date === todayStr);
      for (const match of todayMatches) {
        if (!match.time) continue;
        const parts = match.time.split(':');
        const startMins = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        const endMins = startMins + 4 * 60 + 30; // 4.5 hours duration
        if (mins >= startMins && mins <= endMins) {
          return true;
        }
      }
    }

    const start = config.matchBoost.startHour * 60 + config.matchBoost.startMinute;
    const end = config.matchBoost.endHour * 60 + config.matchBoost.endMinute;
    return mins >= start && mins <= end;
  };

  const weightedPick = (list) => {
    const total = list.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * total;
    for (const item of list) {
      rand -= item.weight;
      if (rand <= 0) return item;
    }
    return list[list.length - 1];
  };

  const normalizeDailyState = (user) => {
    const today = storage.todayKey();
    if (user.lastPlayDate !== today) {
      user.playsToday = 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (user.lastPlayDate !== yKey) user.streak = 0;
    }
  };

  const play = ({ mode, state, els, onDone, toast }) => {
    const user = state.users.find((item) => item.id === state.currentUserId);
    if (!user || isAnimating) return;

    normalizeDailyState(user);

    if ((user.playsToday || 0) >= config.dailyFreePlays) {
      toast('Daily plays finished for now.');
      return;
    }

    isAnimating = true;

    const outcomes = config.outcomes[mode];
    const finalOutcome = weightedPick(outcomes);

    const sequence = [];
    for (let i = 0; i < 7; i++) {
      sequence.push(outcomes[Math.floor(Math.random() * outcomes.length)].label);
    }
    sequence.push(finalOutcome.label);

    const lines = mode === 'bat'
      ? ['Crowd rises…', 'Bat swings through…', 'Timing looks sweet…', 'Could this clear the ropes…']
      : ['Field set…', 'Bowler charges in…', 'Pressure building…', 'Appeal loading…'];

    let step = 0;

    const timer = setInterval(() => {
      const current = sequence[Math.min(step, sequence.length - 1)];
      const line = lines[step % lines.length];

      els.arena.innerHTML = `
        <div class="play-sequence">
          <div class="sequence-kicker">${mode === 'bat' ? 'Batting Mode' : 'Bowling Mode'}</div>
          <div class="sequence-main">${mode === 'bat' ? 'Ball coming in…' : 'Charging to bowl…'}</div>
          <div class="rolling-track">
            ${outcomes.map((item) => `<span class="roll-chip ${item.label === current ? 'active' : ''}">${item.label}</span>`).join('')}
          </div>
          <div class="commentary-line">${line}</div>
        </div>
      `;

      step += 1;

      if (step >= sequence.length) {
        clearInterval(timer);

        const boost = isBoostTime() ? config.matchBoost.multiplier : 1;
        const finalPoints = finalOutcome.points * boost;

        user.totalPoints += finalPoints;
        user.matchesPlayed = (user.matchesPlayed || 0) + 1;
        user.playsToday = (user.playsToday || 0) + 1;

        const today = storage.todayKey();
        const newDay = user.lastPlayDate !== today;
        user.lastPlayDate = today;
        user.streak = newDay ? (user.streak || 0) + 1 : (user.streak || 1);

        if (finalOutcome.runs) user.runs = (user.runs || 0) + finalOutcome.runs;
        if (finalOutcome.wickets) user.wickets = (user.wickets || 0) + finalOutcome.wickets;
        if (finalOutcome.sixes) user.sixes = (user.sixes || 0) + finalOutcome.sixes;
        if (finalOutcome.dots) user.dots = (user.dots || 0) + finalOutcome.dots;

        user.history.push({
          mode,
          label: finalOutcome.label,
          finalPoints,
          boost,
          ts: new Date().toISOString()
        });

        if (user.history.length > 30) {
          user.history = user.history.slice(-30);
        }

        storage.save(state);

        const tone =
          finalOutcome.type === 'negative'
            ? 'negative'
            : finalOutcome.type === 'gold'
            ? 'gold'
            : 'positive';

        const sign = finalPoints > 0 ? '+' : '';

        els.arena.innerHTML = `
          <div>
            <div class="outcome ${tone}">${finalOutcome.label}</div>
            <h2>${sign}${finalPoints} points</h2>
            <p>${boost > 1 ? 'Match Boost doubled it. Stadium went feral.' : 'Standard scoring applied.'}</p>
          </div>
        `;

        onDone({ outcome: finalOutcome, finalPoints, mode });
        toast(`${mode === 'bat' ? 'Batting' : 'Bowling'}: ${finalOutcome.label} • ${sign}${finalPoints}`);
        isAnimating = false;
      }
    }, 180);
  };

  return { isBoostTime, normalizeDailyState, play, weightedPick };
})(window.CBCL_CONFIG, window.CBCL_STORAGE);