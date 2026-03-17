window.CBCL_SOUNDS = (() => {
  let enabled = true;

  const SOUND_PATHS = {
    tap: './assets/sounds/tap.mp3',
    batHit: './assets/sounds/bat-hit.mp3',
    sixer: './assets/sounds/sixer.mp3',
    wicket: './assets/sounds/wicket.mp3',
    crowdCheer: './assets/sounds/crowd-cheer.mp3',
    reveal: './assets/sounds/reveal.mp3'
  };

  const audioCache = {};

  const getAudio = (name) => {
    if (!SOUND_PATHS[name]) return null;

    if (!audioCache[name]) {
      audioCache[name] = new Audio(SOUND_PATHS[name]);
      audioCache[name].preload = 'auto';
    }

    return audioCache[name];
  };

  const play = (name, volume = 0.7) => {
    if (!enabled) return;

    const baseAudio = getAudio(name);
    if (!baseAudio) return;

    try {
      const sound = baseAudio.cloneNode();
      sound.volume = volume;
      sound.play().catch(() => null);
    } catch {
      return;
    }
  };

  const stopAll = () => {
    Object.values(audioCache).forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        return;
      }
    });
  };

  const setEnabled = (value) => {
    enabled = Boolean(value);
    if (!enabled) stopAll();
  };

  const isEnabled = () => enabled;

  return {
    play,
    stopAll,
    setEnabled,
    isEnabled
  };
})();