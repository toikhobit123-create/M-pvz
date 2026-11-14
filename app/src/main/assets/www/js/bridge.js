/**
 * Native Jetpack Compose <-> WebView Canvas Bridge
 * Synchronizes game state, HUD telemetry, audio settings, and user actions cleanly.
 */
(function () {
  if (typeof window === 'undefined') return;

  const isAndroidHost = typeof window.PvzAndroidBridge !== 'undefined';
  if (isAndroidHost && document.body) {
    document.body.classList.add('native-compose-hud');
  } else if (isAndroidHost) {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.classList.add('native-compose-hud');
    });
  }

  let confirmShovelEnabled = false;
  let pendingShovelTarget = null;
  let lastHudPayload = '';
  let preferredDefaultSpeed = 2;

  function getGame() {
    return window.pvzGame || null;
  }

  function buildHudSnapshot(game) {
    const cooldowns = {};
    if (game.plantKeys && typeof PLANT_CONFIG !== 'undefined') {
      for (const key of game.plantKeys) {
        const proto = PLANT_CONFIG[key];
        const cd = game.cooldowns ? (game.cooldowns[key] || 0) : 0;
        const total = proto && proto.cooldown ? proto.cooldown : 7.5;
        cooldowns[key] = total > 0 ? Math.max(0, Math.min(1, cd / total)) : 0;
      }
    }

    const isBossLevel = game.currentLevel === 6;
    let bossHp = 0;
    let bossMaxHp = 27000;
    if (isBossLevel && Array.isArray(game.zombies)) {
      const boss = game.zombies.find(z => z.alive && z.type === 'zombot_dark_dragon');
      if (boss) {
        bossHp = Math.max(0, Math.ceil(boss.hp));
        bossMaxHp = Math.max(1, Math.ceil(boss.maxHp || 27000));
      } else if (game.isVictory) {
        bossHp = 0;
      } else {
        bossHp = bossMaxHp;
      }
    }

    const waveStatus = (game.waveManager && typeof game.waveManager.getStatusText === 'function')
      ? game.waveManager.getStatusText(game)
      : null;

    return {
      sun: Math.floor(game.sun || 0),
      plantFood: game.plantFood !== undefined ? game.plantFood : 3,
      isPlantFoodActive: !!game.isPlantFoodActive,
      isShovelActive: !!game.isShovelActive,
      selectedPlantType: game.selectedPlantType || '',
      gameSpeed: game.gameSpeed === 1 ? 1 : 2,
      isPaused: !!game.isPaused,
      isSandbox: !!game.isSandbox,
      sandboxNoCooldown: !!game.sandboxNoCooldown,
      gameMode: game.gameMode || 'normal',
      currentLevel: game.currentLevel || 0,
      waveProgress: game.waveManager ? game.waveManager.getProgress() : 0,
      currentWave: game.waveManager ? game.waveManager.currentWave : 1,
      totalWaves: game.waveManager ? game.waveManager.totalWaves : 5,
      waveStatusTitle: waveStatus ? waveStatus.title : '',
      waveStatusSub: waveStatus ? waveStatus.sub : '',
      isBossLevel: isBossLevel,
      bossHp: bossHp,
      bossMaxHp: bossMaxHp,
      selectedDeck: Array.isArray(game.selectedDeck) ? game.selectedDeck : [],
      cooldowns: cooldowns
    };
  }

  function pushHudSnapshot(force) {
    if (!isAndroidHost) return;
    const game = getGame();
    if (!game) return;
    try {
      const payload = JSON.stringify(buildHudSnapshot(game));
      if (force || payload !== lastHudPayload) {
        lastHudPayload = payload;
        window.PvzAndroidBridge.onHudState(payload);
      }
    } catch (err) {
      console.warn('Bridge pushHudSnapshot error:', err);
    }
  }

  function hookGameEngine(game) {
    if (!game || game._androidBridgeHooked) return;
    game._androidBridgeHooked = true;

    const origUpdateHUD = game.updateHUD.bind(game);
    game.updateHUD = function () {
      origUpdateHUD();
      pushHudSnapshot(false);
    };

    const origOnVictory = game.onLevelVictory.bind(game);
    game.onLevelVictory = function () {
      const wasVictory = game.isVictory;
      origOnVictory();
      if (!wasVictory && game.isVictory && isAndroidHost) {
        try {
          window.PvzAndroidBridge.onMatchResult(JSON.stringify({
            victory: true,
            level: game.currentLevel,
            unlockedLevel: game.unlockedLevel,
            completedLevels: game.completedLevels || []
          }));
        } catch (err) {
          console.warn('Bridge onVictory error:', err);
        }
      }
    };

    const origOnGameOver = game.onGameOver.bind(game);
    game.onGameOver = function () {
      const wasOver = game.isGameOver;
      origOnGameOver();
      if (!wasOver && game.isGameOver && isAndroidHost) {
        try {
          window.PvzAndroidBridge.onMatchResult(JSON.stringify({
            victory: false,
            level: game.currentLevel,
            unlockedLevel: game.unlockedLevel,
            completedLevels: game.completedLevels || []
          }));
        } catch (err) {
          console.warn('Bridge onGameOver error:', err);
        }
      }
    };

    const origRemovePlantAt = game.removePlantAt.bind(game);
    game.removePlantAt = function (row, col) {
      if (isAndroidHost && confirmShovelEnabled) {
        const plant = game.plants.find(p => p.alive && p.row === row && p.col === col);
        if (plant) {
          pendingShovelTarget = { row, col, origRemovePlantAt };
          game.setPaused(true);
          if (game.audio) game.audio.pauseBGM();
          pushHudSnapshot(true);
          try {
            window.PvzAndroidBridge.onShovelConfirmRequested(plant.type, row, col);
          } catch (err) {
            console.warn('Bridge shovel confirm error:', err);
            pendingShovelTarget = null;
            origRemovePlantAt(row, col);
          }
          return;
        }
      }
      origRemovePlantAt(row, col);
    };

    // Export high-resolution Canvas plant icons once for native Compose cards
    const icons = {};
    if (typeof GameRenderer !== 'undefined' && typeof GameRenderer.getPlantIconDataURL === 'function') {
      (game.plantKeys || []).forEach(key => {
        try {
          const url = GameRenderer.getPlantIconDataURL(key, 96);
          if (url) icons[key] = url;
        } catch (_) {}
      });
    }

    if (isAndroidHost) {
      try {
        window.PvzAndroidBridge.onEngineReady(JSON.stringify(icons));
      } catch (err) {
        console.warn('Bridge onEngineReady error:', err);
      }
      pushHudSnapshot(true);
    }
  }

  window.pvzBridge = {
    startLevel: function (level, deckJson, defaultSpeed) {
      const game = getGame();
      if (!game) return;
      if (typeof defaultSpeed === 'number') preferredDefaultSpeed = defaultSpeed === 1 ? 1 : 2;
      try {
        const parsedDeck = JSON.parse(deckJson);
        if (Array.isArray(parsedDeck) && parsedDeck.length > 0) {
          game.selectedDeck = parsedDeck.slice(0, 7);
        }
      } catch (_) {}
      game.startLevel(level);
      game.setSpeed(preferredDefaultSpeed);
      pushHudSnapshot(true);
    },

    startSandbox: function (defaultSpeed) {
      const game = getGame();
      if (!game) return;
      if (typeof defaultSpeed === 'number') preferredDefaultSpeed = defaultSpeed === 1 ? 1 : 2;
      game.startSandbox();
      game.setSpeed(preferredDefaultSpeed);
      pushHudSnapshot(true);
    },

    selectCard: function (plantId) {
      const game = getGame();
      if (!game) return;
      game.selectCard(plantId);
      pushHudSnapshot(true);
    },

    toggleShovel: function () {
      const game = getGame();
      if (!game) return;
      const next = !game.isShovelActive;
      game.clearSelection();
      game.setShovel(next);
      pushHudSnapshot(true);
    },

    togglePlantFood: function () {
      const game = getGame();
      if (!game) return;
      game.togglePlantFood();
      pushHudSnapshot(true);
    },

    setSpeed: function (speed) {
      const game = getGame();
      if (!game) return;
      game.setSpeed(speed === 1 ? 1 : 2);
      if (game.audio) game.audio.playClick();
      pushHudSnapshot(true);
    },

    setPaused: function (paused) {
      const game = getGame();
      if (!game) return;
      game.setPaused(!!paused);
      if (game.audio) {
        if (paused) {
          game.audio.pauseBGM();
        } else {
          game.audio.resumeBGM();
        }
      }
      pushHudSnapshot(true);
    },

    resetLevel: function () {
      const game = getGame();
      if (!game) return;
      game.reset();
      game.setSpeed(preferredDefaultSpeed);
      if (game.audio) {
        game.audio.playBGM(game.currentLevel >= 5 ? 'boss' : 'battle');
      }
      pushHudSnapshot(true);
    },

    returnToMenu: function () {
      const game = getGame();
      if (!game) return;
      game.isSandbox = false;
      game.setPaused(true);
      if (game.audio) game.audio.playBGM('menu');
      pushHudSnapshot(true);
    },

    applySettings: function (masterVol, bgmVol, sfxVol, muted, defaultSpeed, confirmShovel) {
      preferredDefaultSpeed = defaultSpeed === 1 ? 1 : 2;
      confirmShovelEnabled = !!confirmShovel;
      const game = getGame();
      if (!game) return;
      if (game.audio) {
        if (typeof game.audio.setMuted === 'function') game.audio.setMuted(!!muted);
        if (typeof game.audio.setVolumes === 'function') game.audio.setVolumes(masterVol, bgmVol, sfxVol);
      }
      pushHudSnapshot(true);
    },

    applyProgress: function (unlockedLevel, completedJson, deckJson) {
      const game = getGame();
      if (!game) return;
      if (typeof unlockedLevel === 'number') {
        game.unlockedLevel = Math.max(1, Math.min(6, unlockedLevel));
      }
      try {
        const list = JSON.parse(completedJson);
        if (Array.isArray(list)) game.completedLevels = list;
      } catch (_) {}
      try {
        const deck = JSON.parse(deckJson);
        if (Array.isArray(deck) && deck.length > 0) game.selectedDeck = deck.slice(0, 7);
      } catch (_) {}
      pushHudSnapshot(true);
    },

    confirmPendingShovel: function (confirmed) {
      const game = getGame();
      const target = pendingShovelTarget;
      pendingShovelTarget = null;
      if (game) {
        if (confirmed && target) {
          target.origRemovePlantAt(target.row, target.col);
        }
        game.setPaused(false);
        if (game.audio) game.audio.resumeBGM();
        pushHudSnapshot(true);
      }
    },

    sandboxAddSun: function (amount) {
      const game = getGame();
      if (!game) return;
      game.addSun(amount);
      pushHudSnapshot(true);
    },

    sandboxSetSun: function (amount) {
      const game = getGame();
      if (!game) return;
      game.sun = amount;
      game.updateHUD();
      pushHudSnapshot(true);
    },

    sandboxClearAll: function () {
      const game = getGame();
      if (!game) return;
      game.clearAllZombies();
      game.plants = [];
      game.projectiles = [];
      game.barriers = [];
      game.flyingImps = [];
      game.lotusTraps = [];
      pushHudSnapshot(true);
    },

    sandboxClearZombies: function () {
      const game = getGame();
      if (!game) return;
      game.clearAllZombies();
      pushHudSnapshot(true);
    },

    sandboxToggleNoCooldown: function () {
      const game = getGame();
      if (!game) return;
      game.toggleSandboxNoCooldown();
      pushHudSnapshot(true);
    },

    sandboxSpawnZombie: function (type, row) {
      const game = getGame();
      if (!game) return;
      const targetRow = (typeof row === 'number' && row >= 0 && row < CONFIG.ROWS)
        ? row
        : Math.floor(Math.random() * CONFIG.ROWS);
      game.spawnZombie(type, targetRow);
      pushHudSnapshot(true);
    }
  };

  function waitForGameInit() {
    const game = getGame();
    if (game) {
      hookGameEngine(game);
    } else {
      setTimeout(waitForGameInit, 40);
    }
  }
  waitForGameInit();
})();
