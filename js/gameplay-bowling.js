window.CBCL_BOWLING = (() => {
  let speedInterval = null;
  let speedValue = 0;
  let speedDirection = 1;
  let inPlay = false;

  const zoneMap = [
    {
      min: 88,
      outcome: { label: 'Bowled', points: 12, type: 'positive', wickets: 1 },
      target: { top: '10%', left: '50%' },
      zoneSelector: '.zone-wicket'
    },
    {
      min: 68,
      outcome: { label: 'Catch', points: 8, type: 'positive', wickets: 1 },
      target: { top: '22%', left: '82%' },
      zoneSelector: '.zone-catch'
    },
    {
      min: 50,
      outcome: { label: 'LBW', points: 4, type: 'positive', wickets: 1 },
      target: { top: '80%', left: '82%' },
      zoneSelector: '.zone-lbw'
    },
    {
      min: 34,
      outcome: { label: '-1', points: -1, type: 'negative' },
      target: { top: '91%', left: '50%' },
      zoneSelector: '.zone-minus-one'
    },
    {
      min: 18,
      outcome: { label: '-4', points: -4, type: 'negative' },
      target: { top: '50%', left: '90%' },
      zoneSelector: '.zone-minus-four'
    },
    {
      min: 0,
      outcome: { label: '-6', points: -6, type: 'negative' },
      target: { top: '50%', left: '8%' },
      zoneSelector: '.zone-minus-six'
    }
  ];

  const getPointer = () => document.getElementById('speed-pointer');
  const getBall = () => document.getElementById('bowl-ball');
  const getStatus = () => document.getElementById('bowl-status-text');
  const getReleaseBtn = () => document.getElementById('bowl-release-btn');
  const getCircle = () => document.querySelector('.bowling-circle');

  const clearZoneHits = () => {
    document.querySelectorAll('.zone').forEach((zone) => {
      zone.classList.remove('zone-hit', 'zone-hit-negative');
    });
  };

  const pulseStage = (active) => {
    const circle = getCircle();
    if (!circle) return;
    circle.classList.toggle('animate-stadium-live', active);
  };

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
    clearZoneHits();
    pulseStage(false);

    if (ball) {
      ball.style.top = '13%';
      ball.style.left = '50%';
      ball.style.transform = 'translateX(-50%)';
      ball.classList.remove('ball-impact', 'ball-impact-negative');
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
      speedValue += speedDirection * 3.8;

      if (speedValue >= 100) {
        speedValue = 100;
        speedDirection = -1;
      }
      if (speedValue <= 0) {
        speedValue = 0;
        speedDirection = 1;
      }

      pointer.style.left = `${speedValue}%`;
    }, 14);
  };

  const startRunUp = async () => {
    const status = getStatus();
    const releaseBtn = getReleaseBtn();

    if (inPlay) return;
    inPlay = true;
    pulseStage(true);

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

    if (!selection) return null;

    if (releaseBtn) releaseBtn.disabled = true;
    if (status) status.textContent = `Delivery fired at ${Math.round(speedScore)}%`;

    const zone = document.querySelector(selection.zoneSelector);
    if (zone) {
      if (selection.outcome.type === 'negative') zone.classList.add('zone-hit-negative');
      else zone.classList.add('zone-hit');
    }

    if (ball) {
      const frames = [
        { top: '13%', left: '50%', transform: 'translateX(-50%) scale(1)' },
        { top: '32%', left: '50%', transform: 'translateX(-50%) scale(1.03)' },
        { top: '56%', left: '50%', transform: 'translateX(-50%) scale(1.06)' },
        { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1.08)' },
        { top: selection.target.top, left: selection.target.left, transform: 'translate(-50%, -50%) scale(1.14)' }
      ];

      ball.animate(frames, {
        duration: 440,
        easing: 'ease-out',
        fill: 'forwards'
      });

      if (selection.outcome.type === 'negative') {
        ball.classList.add('ball-impact-negative');
      } else {
        ball.classList.add('ball-impact');
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 480));

    pulseStage(false);
    inPlay = false;
    return selection.outcome;
  };

  return {
    resetBowlingUI,
    startRunUp,
    releaseBall
  };
})();