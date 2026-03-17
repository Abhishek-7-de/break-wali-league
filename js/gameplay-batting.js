window.CBCL_BATTING = (() => {
  let timingInterval = null;
  let pointerValue = 0;
  let pointerDirection = 1;
  let inPlay = false;

  const zoneMap = [
    { min: 90, outcome: { label: '6', points: 6, type: 'positive', runs: 6, sixes: 1 }, target: { top: '9%', left: '50%' } },
    { min: 75, outcome: { label: '4', points: 4, type: 'positive', runs: 4 }, target: { top: '22%', left: '82%' } },
    { min: 60, outcome: { label: '3', points: 3, type: 'positive', runs: 3 }, target: { top: '50%', left: '90%' } },
    { min: 45, outcome: { label: '2', points: 2, type: 'positive', runs: 2 }, target: { top: '80%', left: '82%' } },
    { min: 28, outcome: { label: '1', points: 1, type: 'positive', runs: 1 }, target: { top: '91%', left: '50%' } },
    { min: 0, outcome: { label: 'Dot', points: 0, type: 'gold', dots: 1 }, target: { top: '50%', left: '8%' } }
  ];

  const getPointer = () => document.getElementById('timing-pointer');
  const getBall = () => document.getElementById('bat-ball');
  const getStatus = () => document.getElementById('bat-status-text');
  const getShotBtn = () => document.getElementById('bat-shot-btn');

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

    if (ball) {
      ball.style.top = '13%';
      ball.style.left = '50%';
      ball.style.transform = 'translateX(-50%)';
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
      pointerValue += pointerDirection * 3;

      if (pointerValue >= 100) {
        pointerValue = 100;
        pointerDirection = -1;
      }
      if (pointerValue <= 0) {
        pointerValue = 0;
        pointerDirection = 1;
      }

      pointer.style.left = `${pointerValue}%`;
    }, 20);
  };

  const animateDelivery = async () => {
    const ball = getBall();
    const status = getStatus();
    const shotBtn = getShotBtn();

    if (!ball || inPlay) return;

    inPlay = true;
    if (status) status.textContent = 'Bowler charging in...';
    if (shotBtn) shotBtn.disabled = false;

    startTimingMeter();

    ball.animate(
      [
        { top: '13%', left: '50%', transform: 'translateX(-50%)' },
        { top: '72%', left: '50%', transform: 'translateX(-50%)' }
      ],
      {
        duration: 900,
        easing: 'linear',
        fill: 'forwards'
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 900));
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

    if (status) status.textContent = `Shot timed at ${Math.round(timingScore)}%`;
    if (shotBtn) shotBtn.disabled = true;

    if (ball && selection) {
      ball.animate(
        [
          { top: '72%', left: '50%', transform: 'translateX(-50%) scale(1)' },
          { top: selection.target.top, left: selection.target.left, transform: 'translate(-50%, -50%) scale(1.1)' }
        ],
        {
          duration: 520,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 560));
    inPlay = false;
    return selection.outcome;
  };

  return {
    resetBattingUI,
    animateDelivery,
    playShot
  };
})();