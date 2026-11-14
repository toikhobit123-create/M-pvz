/**
 * Plants vs. Zombies - Web Audio API Sound & Music Synthesizer
 * Pure procedural synthesis: Zero external audio files, zero latency, 100% offline.
 */
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.75;
    this.sfxVolume = 0.85;
    this.bgmVolume = 0.45;

    this.currentTrack = null;
    this.bgmIsPlaying = false;
    this.schedulerTimer = null;
    this.nextNoteTime = 0;
    this.currentStep = 0;
    this.bgmTempo = 120;

    // Cache noise buffer for snappier performance
    this.noiseBuffer = null;

    // Throttling for frequent sounds (e.g. hits and bites)
    this.lastSoundTimes = {};

    this.loadSettings();
    this.initAudioContext();
  }

  loadSettings() {
    try {
      const savedMute = localStorage.getItem('pvz_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch (e) {
      console.warn('Cannot read audio settings from localStorage:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('pvz_audio_muted', this.isMuted ? 'true' : 'false');
    } catch (e) {
      console.warn('Cannot save audio settings to localStorage:', e);
    }
  }

  initAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this environment');
      return;
    }

    try {
      this.ctx = new AudioContextClass();

      // Master output bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // BGM bus
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Pre-create 1-second white noise buffer for bites, explosions, hats
      this.generateNoiseBuffer();

      // Setup user gesture unlock
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            if (this.currentTrack && !this.bgmIsPlaying) {
              this.startScheduler();
            }
          });
        }
      };

      window.addEventListener('click', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    } catch (err) {
      console.warn('Failed to initialize AudioContext:', err);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  generateNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveSettings();
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.05);
    }
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    this.saveSettings();
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.05);
    }
  }

  setVolumes(master, bgm, sfx) {
    if (typeof master === 'number' && !isNaN(master)) {
      this.masterVolume = Math.max(0, Math.min(1, master));
    }
    if (typeof bgm === 'number' && !isNaN(bgm)) {
      this.bgmVolume = Math.max(0, Math.min(1, bgm));
    }
    if (typeof sfx === 'number' && !isNaN(sfx)) {
      this.sfxVolume = Math.max(0, Math.min(1, sfx));
    }
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, now, 0.03);
      }
      if (this.bgmGain) {
        this.bgmGain.gain.setTargetAtTime(this.bgmVolume, now, 0.03);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(this.sfxVolume, now, 0.03);
      }
    }
  }

  throttle(key, delayMs) {
    const now = Date.now();
    if (this.lastSoundTimes[key] && now - this.lastSoundTimes[key] < delayMs) {
      return false;
    }
    this.lastSoundTimes[key] = now;
    return true;
  }

  // ==========================================================================
  // SOUND EFFECTS (SFX) SYNTHESIS
  // ==========================================================================

  /**
   * Sound: Trồng cây (Planting Thump / Plop)
   * Earthy organic pop with gentle soil patting
   */
  playPlant(plantType = '') {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Pitched thump (Sine dropping 240Hz -> 65Hz)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.12);

    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    // 2. Dirt noise tap
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(450, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.07);
    }

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Sound: Xẻng đào cây (Shovel Dig / Scrape)
   */
  playShovel() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1100, now);
      bandpass.Q.setValueAtTime(1.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.18);
    }
  }

  /**
   * Sound: Thu thập Mặt Trời (Sun Collected Chime)
   * Celestial sparkling 3-note arpeggio (D5 -> A5 -> D6)
   */
  playSun() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.38, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.24);
    });
  }

  /**
   * Sound: Zombie cắn cây (Zombie Chomp / Bite)
   * Crunchy wet bite
   */
  playChomp() {
    if (!this.ensureContext() || this.isMuted) return;
    if (!this.throttle('chomp', 180)) return;
    const now = this.ctx.currentTime;

    // Crunch noise
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 200, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.1);
    }

    // Low crunch jaw snap
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Sound: Bắn đạn (Shoot Projectile)
   */
  playShoot(type = 'pea') {
    if (!this.ensureContext() || this.isMuted) return;
    if (!this.throttle('shoot', 65)) return;
    const now = this.ctx.currentTime;

    if (type === 'lobbed' || type === 'cabbage' || type === 'melon') {
      // Catapult fling
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(360, now + 0.07);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else {
      // Classic Pea pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  /**
   * Sound: Tiếng súng bắn tỉa của Jhinplant (Viên thứ 4 uy lực hơn hẳn)
   */
  playJhinShot(isFourth = false) {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isFourth ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isFourth ? 520 : 680, now);
    osc.frequency.exponentialRampToValueAtTime(isFourth ? 55 : 120, now + (isFourth ? 0.22 : 0.09));

    gain.gain.setValueAtTime(isFourth ? 0.65 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isFourth ? 0.24 : 0.1));

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isFourth ? 0.25 : 0.11));

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isFourth ? 1400 : 1800, now);
      filter.Q.setValueAtTime(1.4, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(isFourth ? 0.55 : 0.3, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + (isFourth ? 0.18 : 0.07));

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + (isFourth ? 0.19 : 0.08));
    }
  }

  /**
   * Sound: Đạn trúng zombie (Pea Splat / Hit)
   */
  playHit() {
    if (!this.ensureContext() || this.isMuted) return;
    if (!this.throttle('hit', 80)) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Sound: Bom nổ / Mìn nổ (Explosion / Cherry / Potato Mine SPUDOW!)
   */
  playExplosion(variant = 'normal') {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low rumble sub-bass
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(variant === 'spudow' ? 140 : 110, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.65);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.72);

    // Filtered noise blast
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(variant === 'spudow' ? 850 : 500, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.55);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.85, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + 0.62);
    }
  }

  /**
   * Sound: Thôi miên (Hypno-shroom Mind Control)
   * Mystic shimmering glissando
   */
  playHypno() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(740, now + 0.45);

    osc2.frequency.setValueAtTime(326, now); // 6Hz detune shimmer
    osc2.frequency.exponentialRampToValueAtTime(746, now + 0.45);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  /**
   * Sound: Máy cắt cỏ (Lawnmower Motor Rev)
   */
  playLawnmower() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(260, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.85);
  }

  /**
   * Sound: Còi báo hiệu Wave khổng lồ (Wave Horn Fanfare)
   */
  playWaveHorn() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Dual ominous brass (110Hz A2 + 164.81Hz E3 - fifth)
    [110, 164.81].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      filter.frequency.linearRampToValueAtTime(750, now + 0.2);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.9);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.38, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 1.0);
    });
  }

  /**
   * Sound: Tiếng rên rỉ của Zombie (Zombie Groan / Moan)
   */
  playZombieGroan() {
    if (!this.ensureContext() || this.isMuted) return;
    if (!this.throttle('groan', 2500)) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.linearRampToValueAtTime(68, now + 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  /**
   * Sound: Đập bẹp của Trùm Gargantuar (Boss Smash)
   */
  playGargantuarSmash() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Sound: Bấm nút giao diện (UI Tactile Tap)
   */
  playClick() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.03);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Sound: Chiến thắng qua màn (Victory Fanfare)
   */
  playWin() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5

    chord.forEach((freq, idx) => {
      const startTime = now + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.35, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  }

  /**
   * Sound: Thua cuộc (Game Over / Zombies Ate Your Brains)
   */
  playLose() {
    if (!this.ensureContext() || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [293.66, 277.18, 261.63, 220.0, 196.0]; // D4 -> C#4 -> C4 -> A3 -> G3

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // ==========================================================================
  // BACKGROUND MUSIC (BGM) SEQUENCER
  // ==========================================================================

  playBGM(trackName = 'battle') {
    if (!this.ensureContext()) return;
    if (this.currentTrack === trackName && this.bgmIsPlaying) return;

    this.currentTrack = trackName;
    this.currentStep = 0;
    this.bgmIsPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    if (trackName === 'menu') {
      this.bgmTempo = 110;
    } else if (trackName === 'boss') {
      this.bgmTempo = 142;
    } else {
      this.bgmTempo = 126; // battle
    }

    this.startScheduler();
  }

  stopBGM() {
    this.bgmIsPlaying = false;
    this.currentTrack = null;
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  pauseBGM() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  resumeBGM() {
    if (this.currentTrack && this.bgmIsPlaying && !this.schedulerTimer) {
      if (this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }
      this.startScheduler();
    }
  }

  startScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
    }
    // High-precision Web Audio lookahead loop
    this.schedulerTimer = setInterval(() => {
      if (!this.ctx || !this.bgmIsPlaying) return;
      const scheduleAheadTime = 0.15;
      while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
        this.scheduleStep(this.currentStep, this.nextNoteTime);
        const secondsPer16th = (60.0 / this.bgmTempo) / 4.0;
        this.nextNoteTime += secondsPer16th;
        this.currentStep = (this.currentStep + 1) % 64; // 4-bar 16-step loop
      }
    }, 35);
  }

  scheduleStep(step, time) {
    if (this.isMuted) return;

    if (this.currentTrack === 'menu') {
      this.scheduleMenuStep(step, time);
    } else if (this.currentTrack === 'boss') {
      this.scheduleBossStep(step, time);
    } else {
      this.scheduleBattleStep(step, time);
    }
  }

  /**
   * Menu BGM: Eerie gothic waltz / mysterious lounge groove
   */
  scheduleMenuStep(step, time) {
    // Bass: D2, F2, A2, G2
    const bassNotes = [
      73.42, null, null, null, 87.31, null, null, null,
      110.0, null, null, null, 98.0, null, null, null
    ];
    const bNote = bassNotes[step % 16];
    if (bNote) {
      this.playNote(bNote, time, 0.22, 'triangle', 0.28, 300);
    }

    // High bells / marimba motif
    const melodyNotes = [
      293.66, null, 349.23, null, 440.0, null, 392.0, null,
      349.23, null, 329.63, null, 293.66, null, null, null
    ];
    const mNote = melodyNotes[step % 16];
    if (mNote) {
      this.playNote(mNote, time, 0.14, 'sine', 0.2, 1200);
    }

    // Soft shaker on 8th notes
    if (step % 2 === 0) {
      this.playPercussion('hat', time, 0.08);
    }
  }

  /**
   * Battle BGM: The iconic Grasswalk PvZ groove!
   * Walking bass + funky stabs + syncopated lead melody + kick & snare
   */
  scheduleBattleStep(step, time) {
    // 1. Walking Bassline (16 steps per bar)
    const bassline = [
      87.31, null, 87.31, null, 103.83, null, 110.0, null,  // F2, F2, Ab2, A2
      116.54, null, 123.47, null, 130.81, null, 65.41, null // Bb2, B2, C3, C2
    ];
    const bFreq = bassline[step % 16];
    if (bFreq) {
      this.playNote(bFreq, time, 0.13, 'sawtooth', 0.32, 280);
    }

    // 2. Funky Chord Stabs (Organ/Piano on off-beats: steps 2, 6, 10, 14)
    if (step % 4 === 2) {
      const chords = [
        [174.61, 220.0, 261.63], // F, A, C
        [207.65, 261.63, 311.13], // Ab, C, Eb
        [233.08, 293.66, 349.23], // Bb, D, F
        [130.81, 196.0, 246.94]   // C, G, B
      ];
      const chord = chords[Math.floor((step % 16) / 4)];
      chord.forEach(f => {
        this.playNote(f, time, 0.09, 'triangle', 0.14, 800);
      });
    }

    // 3. Playful PvZ Lead Melody
    const leadNotes = [
      // Bar 1
      349.23, null, null, 392.0, 415.3, null, 392.0, null,
      349.23, null, 293.66, null, 311.13, null, null, null,
      // Bar 2
      261.63, null, 349.23, null, 392.0, null, 415.3, null,
      523.25, null, 466.16, null, 415.3, null, 392.0, null
    ];
    const lFreq = leadNotes[step % 32];
    if (lFreq) {
      this.playNote(lFreq, time, 0.16, 'square', 0.18, 1400);
    }

    // 4. Drum groove: Kick on 0, 8; Snare on 4, 12; Hi-hat on every 2nd step
    if (step % 8 === 0) {
      this.playPercussion('kick', time, 0.45);
    }
    if (step % 8 === 4) {
      this.playPercussion('snare', time, 0.38);
    }
    if (step % 2 === 0) {
      this.playPercussion('hat', time, 0.12);
    }
  }

  /**
   * Boss / Huge Wave BGM: Fast tempo, heavy driving pulse, menacing tension
   */
  scheduleBossStep(step, time) {
    // Fast driving bass pulse on every 16th note
    const bossBass = [
      65.41, 65.41, 65.41, 77.78, 65.41, 65.41, 87.31, 65.41,
      61.74, 61.74, 61.74, 73.42, 61.74, 61.74, 82.41, 61.74
    ];
    const freq = bossBass[step % 16];
    this.playNote(freq, time, 0.09, 'sawtooth', 0.35, 340);

    // Urgent high arpeggios
    const arps = [523.25, 622.25, 783.99, 932.33];
    const aFreq = arps[step % 4];
    this.playNote(aFreq, time, 0.08, 'square', 0.15, 1800);

    // Driving heavy drums
    if (step % 4 === 0) {
      this.playPercussion('kick', time, 0.6);
    }
    if (step % 4 === 2) {
      this.playPercussion('snare', time, 0.45);
    }
    this.playPercussion('hat', time, 0.15);
  }

  playNote(frequency, startTime, duration, type = 'sine', volume = 0.25, filterCutoff = 1000) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterCutoff, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch (e) {
      // Ignore timing race conditions on quick stops
    }
  }

  playPercussion(type, startTime, volume = 0.3) {
    if (!this.ctx) return;
    try {
      if (type === 'kick') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, startTime);
        osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.08);

        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      } else if (type === 'snare' && this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, startTime);
        filter.Q.setValueAtTime(1.2, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(startTime);
        noise.stop(startTime + 0.11);
      } else if (type === 'hat' && this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6500, startTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(startTime);
        noise.stop(startTime + 0.04);
      }
    } catch (e) {
      // Ignore occasional scheduler race
    }
  }
}
