window.CBCL_BATTING = (() => {
  let timingInterval = null;
  let pointerValue = 0;
  let pointerDirection = 1;
  let inPlay = false;
  let deliveryReached = false;

  const zoneMap = [
    {
      min: 82,
      outcome: { label: '6', points: 6, type: 'positive', runs: 6, sixes: 1 },
      target: { top: '10%', left: '50%' },
      zoneSelector: '.zone-six'
    },
    {
      min: 64,
      outcome: { label: '4', points: 4, type: 'positive', runs: 4 },
      target: { top: '22%', left: '82%' },
      zoneSelector: '.zone-four'
    },
    {
      min: 48,
      outcome: { label: '3', points: 3, type: 'positive', runs: 3 },
      target: { top: '50%', left: '90%' },
      zoneSelector: '.zone-three'
    },
    {
      min: 30,
      outcome: { label: '2', points: 2, type: 'positive', runs: 2 },
      target: { top: '80%', left: '82%' },
      zoneSelector: '.zone-two'
    },
    {
      min: 14,
      outcome: { label: '1', points: 1, type: 'positive', runs: 1 },
      target: { top: '91%', left: '50%' },
      zoneSelector: '.zone-one'
    },
    {
      min: 0,
      outcome: { label: '1', points: 1, type: 'positive', runs: 1 },
      target: { top: '50%', left: '8%' },
      zoneSelector: '.zone-soft'
    }
  ];

  const getPointer = () => document.getElementById('timing-pointer');
  const getBall = () => document.getElementById('bat-ball');
  const getStatus = () => document.getElementById('bat-status-text');
  const getShotBtn = () => document.getElementById('bat-shot-btn');
  const getCircle = () => document.querySelector('.batting-circle');

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

  const resetBattingUI = () => {
    const ball = getBall();
    const pointer = getPointer();
    const status = getStatus();
    const shotBtn = getShotBtn();

    if (timingInterval) {
      clearInterval(timingInterval);
      timingInterval = null;
    }

    pointerValue = 0;
    pointerDirection = 1;
    inPlay = false;
    deliveryReached = false;
    clearZoneHits();
    pulseStage(false);

    if (ball) {
      ball.style.top = '13%';
      ball.style.left = '50%';
      ball.style.transform = 'translateX(-50%)';
      ball.classList.remove('ball-impact', 'ball-impact-negative');
    }

    if (pointer) pointer.style.left = '0%';
    if (status) status.textContent = 'Press Start Play to face the delivery';
    if (shotBtn) shotBtn.disabled = true;
  };

  const startTimingMeter = () => {
    const pointer = getPointer();
    if (!pointer) return;

    if (timingInterval) clearInterval(timingInterval);

    timingInterval = setInterval(() => {
      pointerValue += pointerDirection * 4.2;

      if (pointerValue >= 100) {
        pointerValue = 100;
        pointerDirection = -1;
      }

      if (pointerValue <= 0) {
        pointerValue = 0;
        pointerDirection = 1;
      }

      pointer.style.left = `${pointerValue}%`;
    }, 12);
  };

  const animateDelivery = async () => {
    const ball = getBall();
    const status = getStatus();
    const shotBtn = getShotBtn();

    if (!ball || inPlay) return;

    inPlay = true;
    deliveryReached = false;
    pulseStage(true);

    if (status) status.textContent = 'Bowler charging in...';
    if (shotBtn) shotBtn.disabled = false;

    startTimingMeter();

    ball.animate(
      [
        { top: '13%', left: '50%', transform: 'translateX(-50%) scale(1)' },
        { top: '28%', left: '50%', transform: 'translateX(-50%) scale(1.03)' },
        { top: '48%', left: '49%', transform: 'translateX(-50%) scale(1.06)' },
        { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1.08)' }
      ],
      {
        duration: 760,
        easing: 'linear',
        fill: 'forwards'
      }
    );

    setTimeout(() => {
      deliveryReached = true;
      if (status && inPlay) {
        status.textContent = 'Take the shot now!';
      }
    }, 720);

    await new Promise((resolve) => setTimeout(resolve, 760));
  };

  const playShot = async () => {
    if (!inPlay) return null;

    const ball = getBall();
    const status = getStatus();
    const shotBtn = getShotBtn();

    if (timingInterval) {
      clearInterval(timingInterval);
      timingInterval = null;
    }

    const effectiveValue = deliveryReached ? pointerValue : Math.max(0, pointerValue - 8);
    const timingScore = Math.max(0, 100 - Math.abs(effectiveValue - 50) * 1.7);
    const selection = zoneMap.find((item) => timingScore >= item.min) || zoneMap[zoneMap.length - 1];

    if (status) status.textContent = `Shot timed at ${Math.round(timingScore)}%`;
    if (shotBtn) shotBtn.disabled = true;

    const zone = document.querySelector(selection.zoneSelector);
    if (zone) zone.classList.add('zone-hit');

    if (ball) {
      const launchFrames = [
        { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1)' },
        { top: '60%', left: '56%', transform: 'translate(-50%, -50%) scale(1.02)' },
        { top: '42%', left: '66%', transform: 'translate(-50%, -50%) scale(1.05)' },
        { top: selection.target.top, left: selection.target.left, transform: 'translate(-50%, -50%) scale(1.15)' }
      ];

      if (selection.outcome.label === '6') {
        launchFrames.splice(2, 0, {
          top: '22%',
          left: '58%',
          transform: 'translate(-50%, -50%) scale(1.09)'
        });
      }

      ball.animate(launchFrames, {
        duration: 420,
        easing: 'ease-out',
        fill: 'forwards'
      });

      ball.classList.add('ball-impact');
    }

    await new Promise((resolve) => setTimeout(resolve, 460));

    pulseStage(false);
    inPlay = false;
    deliveryReached = false;
    return selection.outcome;
  };

  return {
    resetBattingUI,
    animateDelivery,
    playShot
  };
})();