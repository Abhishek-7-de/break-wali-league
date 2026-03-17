window.CBCL_LEADERBOARD = (() => {
  const initials = (name) =>
    (name || 'CB')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');

  const rankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  const sortUsersByPoints = (users) => [...users].sort((a, b) => b.totalPoints - a.totalPoints);
  const sortUsersByRuns = (users) => [...users].sort((a, b) => (b.runs || 0) - (a.runs || 0));
  const sortUsersByWickets = (users) => [...users].sort((a, b) => (b.wickets || 0) - (a.wickets || 0));
  const sortUsersByImpact = (users) =>
    [...users].sort((a, b) => ((b.runs || 0) + (b.wickets || 0) * 10) - ((a.runs || 0) + (a.wickets || 0) * 10));

  const renderRows = (users, currentUserId) =>
    users.map((user, index) => {
      const isCurrent = user.id === currentUserId;
      return `
        <div class="leaderboard-row${isCurrent ? ' current' : ''}">
          <div class="rank-badge ${rankClass(index)}">#${index + 1}</div>
          <div class="row-main">
            <strong>${user.nickname || user.name}</strong>
            <span>${user.name} • ${user.runs || 0} runs • ${user.wickets || 0} wickets</span>
          </div>
          <div class="row-score">
            <strong>${user.totalPoints || 0}</strong>
            <span>${user.matchesPlayed || 0} plays</span>
          </div>
        </div>
      `;
    }).join('');

  const renderStatBlocks = (users) => {
    const runLeader = sortUsersByRuns(users)[0];
    const wicketLeader = sortUsersByWickets(users)[0];
    const impactLeader = sortUsersByImpact(users)[0];

    return `
      <div class="leaderboard-row">
        <div class="rank-badge rank-1">🏏</div>
        <div class="row-main">
          <strong>Highest Run Scorer</strong>
          <span>${runLeader ? (runLeader.nickname || runLeader.name) : '-'} • ${runLeader?.runs || 0} runs</span>
        </div>
        <div class="row-score">
          <strong>${runLeader?.runs || 0}</strong>
          <span>Runs</span>
        </div>
      </div>

      <div class="leaderboard-row">
        <div class="rank-badge rank-1">🎯</div>
        <div class="row-main">
          <strong>Highest Wicket Taker</strong>
          <span>${wicketLeader ? (wicketLeader.nickname || wicketLeader.name) : '-'} • ${wicketLeader?.wickets || 0} wickets</span>
        </div>
        <div class="row-score">
          <strong>${wicketLeader?.wickets || 0}</strong>
          <span>Wickets</span>
        </div>
      </div>

      <div class="leaderboard-row">
        <div class="rank-badge rank-1">⭐</div>
        <div class="row-main">
          <strong>All Round Impact Player</strong>
          <span>${impactLeader ? (impactLeader.nickname || impactLeader.name) : '-'} • ${impactLeader?.runs || 0} runs • ${impactLeader?.wickets || 0} wickets</span>
        </div>
        <div class="row-score">
          <strong>${(impactLeader?.runs || 0) + (impactLeader?.wickets || 0) * 10}</strong>
          <span>Impact</span>
        </div>
      </div>
    `;
  };

  return {
    initials,
    sortUsersByPoints,
    sortUsersByRuns,
    sortUsersByWickets,
    sortUsersByImpact,
    renderRows,
    renderStatBlocks
  };
})();