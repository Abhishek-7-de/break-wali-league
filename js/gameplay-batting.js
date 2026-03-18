window.CBCL_BATTING = (() => {
  let timingInterval = null;
  let pointerValue = 0;
  let pointerDirection = 1;
  let inPlay = false;

  const zoneMap = [
    {
      min: 86,
      outcome: { label: '6', points: 6, type: 'positive', runs: 6, sixes: 1 },
      target: { top: '10%', left: '50%' },
      zoneSelector: '.zone-six'
    },
    {
      min: 70,
      outcome: { label: '4', points: 4, type: 'positive', runs: 4 },
      target: { top: '22%', left: '82%' },
      zoneSelector: '.zone-four'
    },
    {
      min: 55,
      outcome: { label: '3', points: 3, type: 'positive', runs: 3 },
      target: { top: '50%', left: '90%' },
      zoneSelector: '.zone-three'
    },
    {
      min: 40,
      outcome: { label: '2', points: 2, type: 'positive', runs: 2 },
      target: { top: '80%', left: '82%' },
      zoneSelector: '.zone-two'
    },
    {
      min: 20,
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
      pointerValue += pointerDirection * 3.4;

      if (pointerValue >= 100) {
        pointerValue = 100;
        pointerDirection = -1;
      }
      if (pointerValue <= 0) {
        pointerValue = 0;
        pointerDirection = 1;
      }

      pointer.style.left = `${pointerValue}%`;
    }, 14);
  };

  const animateDelivery = async () => {
    const ball = getBall();
    const status = getStatus();
    const shotBtn = getShotBtn();

    if (!ball || inPlay) return;

    inPlay = true;
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
        duration: 720,
        easing: 'linear',
        fill: 'forwards'
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 720));
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

    const timingScore = Math.max(0, 100 - Math.abs(pointerValue - 50) * 2);
    const selection = zoneMap.find((item) => timingScore >= item.min);

    if (!selection) return null;

    if (status) status.textContent = `Shot timed at ${Math.round(timingScore)}%`;
    if (shotBtn) shotBtn.disabled = true;

    const zone = document.querySelector(selection.zoneSelector);
    if (zone) zone.classList.add('zone-hit');

    if (ball) {
      const launchFrames = [
        { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1)' },
        { top: '60%', left: '56%', transform: 'translate(-50%, -50%) scale(1.02)' },
        { top: '42%', left: '66%', transform: 'translate(-50%, -50%) scale(1.04)' },
        { top: selection.target.top, left: selection.target.left, transform: 'translate(-50%, -50%) scale(1.14)' }
      ];

      if (selection.outcome.label === '6') {
        launchFrames.splice(
          2,
          0,
          { top: '22%', left: '58%', transform: 'translate(-50%, -50%) scale(1.08)' }
        );
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
    return selection.outcome;
  };

  return {
    resetBattingUI,
    animateDelivery,
    playShot
  };
})();