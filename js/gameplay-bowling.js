window.CBCL_BOWLING = (() => {
  let speedInterval = null;
  let speedValue = 0;
  let speedDirection = 1;
  let inPlay = false;

  const zoneMap = [
    { min: 90, outcome: { label: 'Bowled', points: 12, type: 'positive', wickets: 1 }, target: { top: '9%', left: '50%' } },
    { min: 72, outcome: { label: 'Catch', points: 8, type: 'positive', wickets: 1 }, target: { top: '22%', left: '82%' } },
    { min: 55, outcome: { label: 'LBW', points: 4, type: 'positive', wickets: 1 }, target: { top: '80%', left: '82%' } },
    { min: 38, outcome: { label: '-1', points: -1, type: 'negative' }, target: { top: '91%', left: '50%' } },
    { min: 20, outcome: { label: '-4', points: -4, type: 'negative' }, target: { top: '50%', left: '90%' } },
    { min: 0, outcome: { label: '-6', points: -6, type: 'negative' }, target: { top: '50%', left: '8%' } }
  ];

  const getPointer = () => document.getElementById('speed-pointer');
  const getBall = () => document.getElementById('bowl-ball');
  const getStatus = () => document.getElementById('bowl-status-text');
  const getReleaseBtn = () => document.getElementById('bowl-release-btn');

  const resetBowlingUI = () => {
    const ball = getBall();
    const pointer = getPointer();
    const status = getStatus();
    const releaseBtn = getReleaseBtn();

    if (speedInterval) {
      clearInterval(speedInterval);
      speedInterval = null;
    }

    speedValue = 0;
    speedDirection = 1;
    inPlay = false;

    if (ball) {
      ball.style.top = '13%';
      ball.style.left = '50%';
      ball.style.transform = 'translateX(-50%)';
    }

    if (pointer) pointer.style.left = '0%';
    if (status) status.textContent = 'Press Start Bowl to build speed';
    if (releaseBtn) releaseBtn.disabled = true;
  };

  const startSpeedMeter = () => {
    const pointer = getPointer();
    if (!pointer) return;

    if (speedInterval) clearInterval(speedInterval);

    speedInterval = setInterval(() => {
      speedValue += speedDirection * 3.2;

      if (speedValue >= 100) {
        speedValue = 100;
        speedDirection = -1;
      }
      if (speedValue <= 0) {
        speedValue = 0;
        speedDirection = 1;
      }

      pointer.style.left = `${speedValue}%`;
    }, 18);
  };

  const startRunUp = async () => {
    const status = getStatus();
    const releaseBtn = getReleaseBtn();

    if (inPlay) return;
    inPlay = true;

    if (status) status.textContent = 'Run-up in motion...';
    if (releaseBtn) releaseBtn.disabled = false;
    startSpeedMeter();
  };

  const releaseBall = async () => {
    if (!inPlay) return null;

    const ball = getBall();
    const status = getStatus();
    const releaseBtn = getReleaseBtn();

    if (speedInterval) {
      clearInterval(speedInterval);
      speedInterval = null;
    }

    const speedScore = speedValue;
    const selection = zoneMap.find((item) => speedScore >= item.min);

    if (releaseBtn) releaseBtn.disabled = true;
    if (status) status.textContent = `Delivery fired at ${Math.round(speedScore)}%`;

    if (ball && selection) {
      ball.animate(
        [
          { top: '13%', left: '50%', transform: 'translateX(-50%) scale(1)' },
          { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1.05)' },
          { top: selection.target.top, left: selection.target.left, transform: 'translate(-50%, -50%) scale(1.08)' }
        ],
        {
          duration: 700,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 740));
    inPlay = false;
    return selection.outcome;
  };

  return {
    resetBowlingUI,
    startRunUp,
    releaseBall
  };
})();