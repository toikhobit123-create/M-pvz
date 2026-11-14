/**
 * PVZ Tower Defense 2D - Systems
 * Quản lý: Đợt Zombie (WaveManager 5 Wave/màn), Tương tác nhập liệu (InputHandler), Sandbox Panel kéo thả
 */

class CollisionSystem {
  static handleProjectileZombieCollisions(projectiles, zombies, gameState) {
    for (const p of projectiles) {
      if (!p.alive || p.isLobbed || p.isRollingPoisonBoulder || p.isEnergyWave || p.isJhinBullet) continue;

      let targetZombie = null;
      let minX = Infinity;

      for (const z of zombies) {
        if (!z.alive || z.isHypnotized) continue;
        if (z.row !== p.row) continue;

        if (p.x >= z.x - 25 && p.x <= z.x + 30) {
          if (z.x < minX) {
            minX = z.x;
            targetZombie = z;
          }
        }
      }

      if (targetZombie) {
        targetZombie.takeDamage(p.damage);
        p.alive = false;

        if (gameState && gameState.audio) {
          gameState.audio.playHit();
        }

        if (p.type === 'goo_pea') {
          targetZombie.applyPoison(1, 6.0, 3.0);
          targetZombie.applySlow(0.5, 4.0);
          gameState.spawnParticles(p.x, p.y, '#ba68c8', 6);
        } else if (p.type === 'ice_pea') {
          targetZombie.applySlow(0.5, 10.0);
          gameState.spawnParticles(p.x, p.y, '#00e5ff', 6);
        } else {
          gameState.spawnParticles(p.x, p.y, '#81c784', 5);
        }
      }
    }
  }
}

/**
 * QUẢN LÝ ĐỢT TẤN CÔNG (WaveManager - 5 Wave / Màn)
 * - Đầu game delay 20s trước khi zombie xuất hiện.
 * - Zombie yếu ra trước, zombie mạnh dần về sau trong mỗi wave và xuyên suốt các wave.
 * - Phải diệt sạch 100% wave hiện tại mới sang wave tiếp theo, nghỉ 15s giữa các wave.
 * - Wave 1-4 tăng dần. Wave 5 là wave cuối (có Flag Zombie + Boss). Thắng khi diệt xong Wave 5.
 */
class WaveManager {
  constructor(level = 1) {
    this.level = level;
    this.levelConfig = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

    this.currentWave = 1;
    this.totalWaves = (level === 6) ? 1 : 5;

    // Trạng thái: 'initial_delay' | 'spawning' | 'waiting_clear' | 'wave_rest' | 'all_cleared'
    this.state = 'initial_delay';
    this.delayTimer = (level === 6) ? 8.0 : WAVE_CONFIG.INITIAL_DELAY; // Cấp 6 boss xuất hiện sau 8s chuẩn bị
    this.restTimer = 0;
    this.spawnTimer = 0;
    this.waveSpawnQueue = [];

    this.totalZombiesInWave = 0;
    this.spawnedZombiesInWave = 0;
    this.killedZombiesInWave = 0;

    this.prepareWave(1);
  }

  prepareWave(waveNumber) {
    this.currentWave = waveNumber;
    const level = this.level || 1;
    const pool = this.levelConfig.zombiePool || ['basic'];
    const isBossLevel = !!this.levelConfig.isBossLevel;

    // 1. Phân loại độ mạnh/nguy hiểm của Zombie (Thứ hạng càng nhỏ càng yếu, yếu ra trước)
    const ZOMBIE_TIER = {
      imp: 1,
      imp_dragon: 1,
      yeti_imp: 1,
      basic: 2,
      regular: 2,
      conehead: 3,
      pole_vaulting: 4,
      buckethead: 5,
      turquoise_skull: 6,
      lang_khach: 6,
      jurassic_bully: 7,
      troglobite: 7,
      ice_block: 8,
      gargantuar: 10,
      zombot_dark_dragon: 20
    };

    const chosenList = [];

    // CẤU HÌNH CHI TIẾT THEO YÊU CẦU:
    // - Phân bổ tất cả zombie để tất cả đều có trong 6 map của chiến dịch
    // - Zombie mới đầu game ít, không ra dồn dập, tăng dần thử thách
    // - Trong mỗi wave: Zombie yếu ra trước, zombie mạnh ra sau
    if (level === 1) {
      // MAP 1 (Sân cỏ cơ bản): Khởi đầu với Basic Zombie & Quỷ lùn Imp
      // Wave 1: Đúng 1 zombie cơ bản duy nhất để người chơi làm quen & trồng Hướng Dương
      // Wave 2: 2 basic
      // Wave 3: 2 basic + 1 imp
      // Wave 4: 3 basic + 1 imp
      // Wave 5: 4 basic + 2 imp
      if (waveNumber === 1) {
        chosenList.push('basic');
      } else if (waveNumber === 2) {
        chosenList.push('basic', 'basic');
      } else if (waveNumber === 3) {
        chosenList.push('basic', 'basic', 'imp');
      } else if (waveNumber === 4) {
        chosenList.push('basic', 'basic', 'basic', 'imp');
      } else {
        chosenList.push('basic', 'basic', 'basic', 'basic', 'imp', 'imp');
      }
    } else if (level === 2) {
      // MAP 2: BẮT ĐẦU XUẤT HIỆN THÊM CONEHEAD ZOMBIE & POLE VAULTING ZOMBIE (Nhảy sào)
      // Wave 1: 2 Basic
      // Wave 2: 2 Basic + 1 Conehead
      // Wave 3: 2 Basic + 1 Conehead + 1 Pole Vaulting
      // Wave 4: 3 Basic + 2 Conehead + 1 Pole Vaulting
      // Wave 5: 3 Basic + 2 Conehead + 2 Pole Vaulting
      if (waveNumber === 1) {
        chosenList.push('basic', 'basic');
      } else if (waveNumber === 2) {
        chosenList.push('basic', 'basic', 'conehead');
      } else if (waveNumber === 3) {
        chosenList.push('basic', 'basic', 'conehead', 'pole_vaulting');
      } else if (waveNumber === 4) {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'pole_vaulting');
      } else {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'pole_vaulting', 'pole_vaulting');
      }
    } else if (level === 3) {
      // MAP 3: BẮT ĐẦU XUẤT HIỆN THÊM BUCKETHEAD & TURQUOISE SKULL (Bắn Laser)
      // Wave 1: 2 Basic + 1 Conehead
      // Wave 2: 2 Basic + 1 Conehead + 1 Buckethead
      // Wave 3: 2 Basic + 2 Conehead + 1 Buckethead + 1 Turquoise Skull
      // Wave 4: 3 Basic + 2 Conehead + 2 Buckethead + 1 Turquoise Skull
      // Wave 5: 3 Basic + 3 Conehead + 2 Buckethead + 2 Turquoise Skull
      if (waveNumber === 1) {
        chosenList.push('basic', 'basic', 'conehead');
      } else if (waveNumber === 2) {
        chosenList.push('basic', 'basic', 'conehead', 'buckethead');
      } else if (waveNumber === 3) {
        chosenList.push('basic', 'basic', 'conehead', 'conehead', 'buckethead', 'turquoise_skull');
      } else if (waveNumber === 4) {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'buckethead', 'buckethead', 'turquoise_skull');
      } else {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'conehead', 'buckethead', 'buckethead', 'turquoise_skull', 'turquoise_skull');
      }
    } else if (level === 4) {
      // MAP 4: KỶ BĂNG HÀ & JURASSIC BULLY + TROGLOBITE + LÃNG KHÁCH ZOMBIE
      if (waveNumber === 1) {
        chosenList.push('basic', 'basic', 'conehead', 'buckethead');
      } else if (waveNumber === 2) {
        chosenList.push('basic', 'basic', 'conehead', 'jurassic_bully');
      } else if (waveNumber === 3) {
        chosenList.push('basic', 'basic', 'conehead', 'buckethead', 'lang_khach', 'troglobite');
      } else if (waveNumber === 4) {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'lang_khach', 'jurassic_bully', 'troglobite');
      } else {
        chosenList.push('basic', 'basic', 'basic', 'conehead', 'conehead', 'buckethead', 'buckethead', 'lang_khach', 'lang_khach', 'jurassic_bully', 'jurassic_bully', 'troglobite', 'troglobite');
      }
    } else if (level === 5) {
      // MAP 5: ĐẠI CHIẾN TẤT CẢ BINH CHỦNG + BOSS GARGANTUAR Ở WAVE 5
      if (waveNumber === 1) {
        chosenList.push('basic', 'basic', 'imp', 'conehead');
      } else if (waveNumber === 2) {
        chosenList.push('basic', 'basic', 'conehead', 'pole_vaulting', 'buckethead');
      } else if (waveNumber === 3) {
        chosenList.push('basic', 'basic', 'lang_khach', 'turquoise_skull', 'jurassic_bully', 'troglobite');
      } else if (waveNumber === 4) {
        chosenList.push('basic', 'basic', 'imp', 'conehead', 'conehead', 'buckethead', 'buckethead', 'pole_vaulting', 'lang_khach', 'jurassic_bully', 'turquoise_skull', 'troglobite');
      } else {
        chosenList.push('basic', 'basic', 'imp', 'imp', 'conehead', 'conehead', 'buckethead', 'buckethead', 'pole_vaulting', 'pole_vaulting', 'lang_khach', 'lang_khach', 'jurassic_bully', 'turquoise_skull', 'troglobite', 'gargantuar');
      }
    } else {
      // MAP 6: ĐẠI CHIẾN ZOMBOT DARK DRAGON (27.000 HP)
      // Xuất hiện ngay Boss Zombot Dark Dragon ở vị trí 2 ô đầu mép phải map
      chosenList.push('zombot_dark_dragon');
    }

    // 2. BẮT BUỘC: SẮP XẾP ZOMBIE YẾU RA TRƯỚC, ZOMBIE MẠNH DẦN VỀ SAU
    chosenList.sort((a, b) => {
      const tierA = ZOMBIE_TIER[a] || 2;
      const tierB = ZOMBIE_TIER[b] || 2;
      return tierA - tierB;
    });

    this.totalZombiesInWave = chosenList.length;
    this.spawnedZombiesInWave = 0;
    this.killedZombiesInWave = 0;
    this.waveSpawnQueue = [];

    // 3. Lên lịch thời gian xuất kích cho từng Zombie theo thứ tự yếu trước, mạnh sau
    // Giãn cách thời gian hợp lý: Đầu game cách nhau 8.5s - 11s, người chơi đủ thời gian trồng cây
    let currentDelay = 0;
    for (let i = 0; i < chosenList.length; i++) {
      const type = chosenList[i];
      const assignedRow = Math.floor(Math.random() * CONFIG.ROWS);

      let interval;
      if (waveNumber === 1) {
        // Wave 1: Rất thưa và thư thả (8.5s - 11s)
        interval = 8.5 + Math.random() * 2.5;
      } else if (waveNumber === 2) {
        // Wave 2: 7.0s - 9.5s
        interval = 7.0 + Math.random() * 2.5;
      } else if (waveNumber === 3) {
        // Wave 3: 5.5s - 7.5s
        interval = 5.5 + Math.random() * 2.0;
      } else if (waveNumber === 4) {
        // Wave 4: 4.5s - 6.0s
        interval = 4.5 + Math.random() * 1.5;
      } else {
        // Wave 5 (Tổng lực): 3.2s - 4.5s, Boss xuất hiện cuối cùng
        interval = 3.2 + Math.random() * 1.3;
      }

      currentDelay += (i === 0 ? 0 : interval);

      this.waveSpawnQueue.push({
        type: type,
        row: assignedRow,
        delay: currentDelay
      });
    }

    this.spawnTimer = 0;
  }

  update(dt, gameState) {
    // 0. Chế độ Sandbox: Hoàn toàn KHÔNG tự động sinh zombie
    if (gameState && gameState.isSandbox) {
      return;
    }

    // 1. Đầu game: Chờ 20s delay trước khi zombie xuất hiện theo yêu cầu
    if (this.state === 'initial_delay') {
      this.delayTimer -= dt;
      if (this.delayTimer <= 0) {
        this.state = 'spawning';
        this.delayTimer = 0;
        if (gameState && gameState.audio) {
          gameState.audio.playZombieGroan();
        }
      }
      return;
    }

    // 2. Nghỉ 15s giữa các Wave sau khi diệt sạch 100% zombie wave trước
    if (this.state === 'wave_rest') {
      this.restTimer -= dt;
      if (this.restTimer <= 0) {
        const nextWave = this.currentWave + 1;
        this.prepareWave(nextWave);
        this.state = 'spawning';
        if (gameState && gameState.audio) {
          if (nextWave === 5) {
            gameState.audio.playWaveHorn();
            gameState.audio.playBGM('boss');
          } else {
            gameState.audio.playZombieGroan();
          }
        }
      }
      return;
    }

    // 3. Đang sinh quái của Wave hiện tại (yếu ra trước, mạnh dần về sau)
    if (this.state === 'spawning') {
      this.spawnTimer += dt;
      while (this.waveSpawnQueue.length > 0 && this.waveSpawnQueue[0].delay <= this.spawnTimer) {
        const item = this.waveSpawnQueue.shift();
        gameState.spawnZombie(item.type, item.row);
        this.spawnedZombiesInWave++;
      }

      if (this.waveSpawnQueue.length === 0) {
        this.state = 'waiting_clear';
      }
    }

    // 4. BẮT BUỘC: Phải diệt sạch 100% quái vật của Wave hiện tại mới chuyển trạng thái
    if (this.state === 'waiting_clear') {
      const activeEnemies = gameState.zombies.filter(z => z.alive && !z.isObstacle && !z.isHypnotized).length;
      const flyingImps = gameState.flyingImps ? gameState.flyingImps.length : 0;

      if (activeEnemies === 0 && flyingImps === 0) {
        // Đã diệt sạch 100% wave hiện tại!
        if (this.currentWave >= this.totalWaves) {
          this.state = 'all_cleared';
          gameState.onLevelVictory();
        } else {
          // BẮT BUỘC: Nghỉ đúng 15s trước khi vào wave tiếp theo
          this.state = 'wave_rest';
          this.restTimer = WAVE_CONFIG.REST_DELAY; // 15.0s
        }
      }
    }
  }

  getProgress() {
    if (this.state === 'initial_delay') return 0;
    const waveFraction = (this.currentWave - 1) / this.totalWaves;
    let inWaveProgress = 0;
    if (this.totalZombiesInWave > 0) {
      inWaveProgress = (this.spawnedZombiesInWave / this.totalZombiesInWave) * (1 / this.totalWaves);
    }
    return Math.min(1.0, Math.max(0.0, waveFraction + inWaveProgress));
  }

  getStatusText(gameState) {
    if (gameState && gameState.isSandbox) return null;

    if (this.state === 'initial_delay') {
      return {
        title: '⏳ CHUẨN BỊ CHIẾN ĐẤU',
        sub: `Zombie tấn công sau: ${Math.ceil(this.delayTimer)}s`,
        color: '#ffb300'
      };
    }
    if (this.state === 'wave_rest') {
      return {
        title: `✨ HOÀN THÀNH WAVE ${this.currentWave}!`,
        sub: `Nghỉ ngơi ${Math.ceil(this.restTimer)}s trước Wave ${this.currentWave + 1}...`,
        color: '#4fc3f7'
      };
    }
    if (this.state === 'waiting_clear') {
      const remaining = gameState ? gameState.zombies.filter(z => z.alive && !z.isObstacle && !z.isHypnotized).length : 0;
      return {
        title: `⚔️ TIÊU DIỆT HẾT ZOMBIE CÒN LẠI (${remaining})`,
        sub: 'Phải diệt sạch 100% để qua Wave!',
        color: '#ff7043'
      };
    }
    if (this.state === 'spawning' && this.currentWave === 5) {
      return {
        title: '🚨 ĐỢT TẤN CÔNG CUỐI CÙNG (FINAL WAVE)!',
        sub: 'Toàn bộ Zombie đang ồ ạt tràn vào!',
        color: '#e53935'
      };
    }
    return null;
  }
}

/**
 * QUẢN LÝ NHẬP LIỆU & SANDBOX CONTROL PANEL
 */
class InputHandler {
  constructor(canvas, gameState) {
    this.canvas = canvas;
    this.gameState = gameState;

    this.hoverCol = -1;
    this.hoverRow = -1;
    this.pointerX = 0;
    this.pointerY = 0;
    this.isPointerOnCanvas = false;

    this.initEvents();
  }

  initEvents() {
    const updatePointerPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.pointerX = (clientX - rect.left) * scaleX;
      this.pointerY = (clientY - rect.top) * scaleY;

      const relativeX = this.pointerX - CONFIG.GRID_OFFSET_X;
      const relativeY = this.pointerY - CONFIG.GRID_OFFSET_Y;

      if (relativeX >= 0 && relativeX < CONFIG.COLS * CONFIG.CELL_WIDTH &&
          relativeY >= 0 && relativeY < CONFIG.ROWS * CONFIG.CELL_HEIGHT) {
        this.hoverCol = Math.floor(relativeX / CONFIG.CELL_WIDTH);
        this.hoverRow = Math.floor(relativeY / CONFIG.CELL_HEIGHT);
        this.isPointerOnCanvas = true;
      } else {
        this.hoverCol = -1;
        this.hoverRow = -1;
        this.isPointerOnCanvas = false;
      }
    };

    this.canvas.addEventListener('mousemove', (e) => updatePointerPos(e));
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      updatePointerPos(e);
    }, { passive: false });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCol = -1;
      this.hoverRow = -1;
      this.isPointerOnCanvas = false;
    });

    const handleAction = (e) => {
      updatePointerPos(e);

      // TÍCH HỢP CONVEYOR: Bắt sự kiện nhấn chuột / chạm vào thẻ bài trên băng chuyền
      if (this.gameState.gameMode === 'conveyor' && this.gameState.conveyorSystem) {
        const hitConveyor = this.gameState.conveyorSystem.onInputDown(this.pointerX, this.pointerY);
        if (hitConveyor) {
          if (this.gameState.audio && this.gameState.audio.playClick) {
            this.gameState.audio.playClick();
          }
          return; // Nếu chạm vào băng chuyền thì bỏ qua logic sân cỏ
        }
      }

      // 1. Nhặt Sun bằng tay
      const sunHitRadius = 40;
      for (const sun of this.gameState.suns) {
        if (!sun.collected && sun.alive) {
          const dx = this.pointerX - sun.x;
          const dy = this.pointerY - (sun.y + Math.sin(sun.floatTimer) * 4);
          if (dx * dx + dy * dy <= sunHitRadius * sunHitRadius) {
            sun.collect();
            return;
          }
        }
      }

      // 1.8. Dùng Plant Food lên cây đã trồng (Ngắt hơi thở lửa của Rồng & kích hoạt chiêu cuối)
      if (this.gameState.isPlantFoodActive) {
        if (this.hoverRow >= 0 && this.hoverCol >= 0) {
          const targetPlant = this.gameState.plants.find(p => p.alive && p.row === this.hoverRow && p.col === this.hoverCol);
          if (targetPlant) {
            const success = targetPlant.triggerPlantFood(this.gameState);
            if (success === false) {
              if (this.gameState.spawnFloatingText) {
                this.gameState.spawnFloatingText(targetPlant.x, targetPlant.y - 20, 'KHÔNG THỂ DÙNG! ⚠️', '#ff5252', 16);
              }
              this.gameState.setPlantFood(false);
              return;
            }
            this.gameState.plantFood = Math.max(0, this.gameState.plantFood - 1);
            this.gameState.setPlantFood(false);
            this.gameState.updateHUD();
            if (this.gameState.audio && this.gameState.audio.playExplosion) {
              this.gameState.audio.playExplosion('fire');
            }
            if (this.gameState.spawnFloatingText) {
              this.gameState.spawnFloatingText(targetPlant.x, targetPlant.y - 20, 'PLANT FOOD! ⚡🍃', '#76ff03', 20);
            }
            return;
          }
        }
        this.gameState.setPlantFood(false);
        return;
      }

      // 2. Xẻng đào cây
      if (this.gameState.isShovelActive) {
        if (this.hoverRow >= 0 && this.hoverCol >= 0) {
          this.gameState.removePlantAt(this.hoverRow, this.hoverCol);
        }
        this.gameState.setShovel(false);
        return;
      }

      // 3. Trồng cây
      if (this.gameState.selectedPlantType) {
        if (this.hoverRow >= 0 && this.hoverCol >= 0) {
          const success = this.gameState.tryPlant(this.gameState.selectedPlantType, this.hoverRow, this.hoverCol);
          if (success) {
            this.gameState.clearSelection();
          }
        } else {
          this.gameState.clearSelection();
        }
      }
    };

    const handleRelease = (e) => {
      // TÍCH HỢP CONVEYOR: Xử lý thả thẻ bài (Trồng cây hoặc Buff lá Plant Food)
      if (this.gameState.gameMode === 'conveyor' && this.gameState.conveyorSystem && this.gameState.conveyorSystem.draggedItem) {
        const gridPos = (this.hoverRow >= 0 && this.hoverCol >= 0) ? { row: this.hoverRow, col: this.hoverCol } : null;
        const currentPlant = gridPos ? this.gameState.plants.find(p => p.alive && p.row === gridPos.row && p.col === gridPos.col) : null;

        // Giao quyền xử lý đặt cây/buff lá cho Conveyor (Trồng miễn phí)
        this.gameState.conveyorSystem.onInputUp(
          gridPos,
          currentPlant,
          (row, col, plantId) => this.gameState.tryPlant(plantId, row, col, true),
          (plantEntity) => {
            if (plantEntity && plantEntity.triggerPlantFood) {
              const success = plantEntity.triggerPlantFood(this.gameState);
              if (success === false) {
                if (this.gameState.spawnFloatingText) {
                  this.gameState.spawnFloatingText(plantEntity.x, plantEntity.y - 20, 'KHÔNG THỂ DÙNG! ⚠️', '#ff5252', 16);
                }
                return false;
              }
              if (this.gameState.audio && this.gameState.audio.playExplosion) {
                this.gameState.audio.playExplosion('fire');
              }
              if (this.gameState.spawnFloatingText) {
                this.gameState.spawnFloatingText(plantEntity.x, plantEntity.y - 20, 'PLANT FOOD! ⚡🍃', '#76ff03', 20);
              }
              return true;
            }
            return false;
          }
        );
      }
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        e.preventDefault();
        this.gameState.clearSelection();
        return;
      }
      handleAction(e);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      handleRelease(e);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      handleAction(e);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      handleRelease(e);
    }, { passive: false });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.initSandboxEvents();

    const getSpawnRow = () => {
      const selectEl = document.getElementById('sb-row-select');
      const val = selectEl ? parseInt(selectEl.value, 10) : -1;
      if (val >= 0 && val < CONFIG.ROWS) return val;
      if (this.hoverRow >= 0) return this.hoverRow;
      return Math.floor(Math.random() * CONFIG.ROWS);
    };

    // Phím tắt kiểm thử
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 7) {
        const deck = this.gameState.selectedDeck;
        if (deck && deck[num - 1]) {
          this.gameState.selectCard(deck[num - 1]);
        } else if (num <= this.gameState.plantKeys.length) {
          this.gameState.selectCard(this.gameState.plantKeys[num - 1]);
        }
      } else if (e.key === 's' || e.key === 'S') {
        this.gameState.addSun(100);
        this.gameState.spawnParticles(100, 30, '#ffd54f', 6);
      } else if (e.key === 'd' || e.key === 'D' || e.key === 'x' || e.key === 'X') {
        this.gameState.clearSelection();
        this.gameState.setShovel(!this.gameState.isShovelActive);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.gameState.toggleSpeed();
      } else if (e.key === 'z' || e.key === 'Z') {
        this.gameState.spawnZombie('basic', getSpawnRow());
      } else if (e.key === 'c' || e.key === 'C') {
        this.gameState.spawnZombie('conehead', getSpawnRow());
      } else if (e.key === 'b' || e.key === 'B') {
        this.gameState.spawnZombie('buckethead', getSpawnRow());
      } else if (e.key === 'p' || e.key === 'P') {
        this.gameState.spawnZombie('pole_vaulting', getSpawnRow());
      } else if (e.key === 'g' || e.key === 'G') {
        this.gameState.spawnZombie('gargantuar', getSpawnRow());
      } else if (e.key === 't' || e.key === 'T') {
        this.gameState.spawnZombie('tombstone', getSpawnRow());
      } else if (e.key === 'j' || e.key === 'J') {
        this.gameState.spawnZombie('jurassic_bully', getSpawnRow());
      } else if (e.key === 'l' || e.key === 'L') {
        this.gameState.spawnZombie('lang_khach', getSpawnRow());
      } else if (e.key === 'Escape') {
        this.gameState.clearSelection();
        this.gameState.setShovel(false);
        const sbPanel = document.getElementById('sandbox-panel');
        if (sbPanel && !sbPanel.classList.contains('hidden')) {
          sbPanel.classList.add('hidden');
        } else {
          this.gameState.togglePause();
        }
      }
    });
  }

  initSandboxEvents() {
    const sandboxBtn = document.getElementById('sandbox-btn');
    const sandboxPanel = document.getElementById('sandbox-panel');
    const closeBtn = document.getElementById('sandbox-close-btn');

    if (sandboxBtn && sandboxPanel) {
      let lastToggleTime = 0;
      const toggleSandbox = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const now = Date.now();
        if (now - lastToggleTime < 350) return;
        lastToggleTime = now;

        sandboxPanel.classList.toggle('hidden');
        if (!sandboxPanel.classList.contains('hidden')) {
          sandboxPanel.style.right = '8px';
          sandboxPanel.style.left = 'auto';
          sandboxPanel.style.top = '52px';
        }
      };

      sandboxBtn.addEventListener('click', toggleSandbox);
      sandboxBtn.addEventListener('touchend', toggleSandbox, { passive: false });
    }

    if (closeBtn && sandboxPanel) {
      closeBtn.addEventListener('click', () => {
        sandboxPanel.classList.add('hidden');
      });
    }

    // Bảng điều khiển HTML góc phải KÉO THẢ ĐƯỢC (Draggable)
    const headerEl = sandboxPanel ? sandboxPanel.querySelector('.sandbox-header') : null;
    if (sandboxPanel && headerEl) {
      let isDragging = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      const onStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        const rect = sandboxPanel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        sandboxPanel.style.right = 'auto';
        sandboxPanel.style.left = `${initialLeft}px`;
        sandboxPanel.style.top = `${initialTop}px`;
      };

      const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        sandboxPanel.style.left = `${Math.max(10, Math.min(window.innerWidth - 260, initialLeft + dx))}px`;
        sandboxPanel.style.top = `${Math.max(10, Math.min(window.innerHeight - 200, initialTop + dy))}px`;
      };

      const onEnd = () => { isDragging = false; };

      headerEl.addEventListener('mousedown', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        onStart(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onEnd);

      headerEl.addEventListener('touchstart', (e) => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches) onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      window.addEventListener('touchend', onEnd);
    }

    // Nút +1000 Sun (yêu cầu bắt buộc) & +100 Sun (test tương thích)
    const add1000Btn = document.getElementById('sb-add-1000-sun');
    if (add1000Btn) {
      add1000Btn.addEventListener('click', () => {
        this.gameState.addSun(1000);
        this.gameState.spawnParticles(100, 30, '#ffd54f', 15);
      });
    }

    const add100Btn = document.getElementById('sb-add-100-sun');
    if (add100Btn) {
      add100Btn.addEventListener('click', () => {
        this.gameState.addSun(100);
        this.gameState.spawnParticles(100, 30, '#ffd54f', 6);
      });
    }

    const maxSunBtn = document.getElementById('sb-max-sun');
    if (maxSunBtn) {
      maxSunBtn.addEventListener('click', () => {
        this.gameState.sun = 9999;
        this.gameState.updateHUD();
        this.gameState.spawnParticles(100, 30, '#ffd54f', 20);
      });
    }

    // Nút Xóa toàn bộ Zombie/Cây/Reset màn
    const clearAllBtn = document.getElementById('sb-clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.gameState.clearAllZombies();
        this.gameState.plants = [];
        this.gameState.projectiles = [];
        this.gameState.barriers = [];
        this.gameState.flyingImps = [];
      });
    }

    const clearZombiesBtn = document.getElementById('sb-clear-zombies');
    if (clearZombiesBtn) {
      clearZombiesBtn.addEventListener('click', () => {
        this.gameState.clearAllZombies();
      });
    }

    const resetLevelBtn = document.getElementById('sb-reset-level');
    if (resetLevelBtn) {
      resetLevelBtn.addEventListener('click', () => {
        this.gameState.reset();
      });
    }

    // Nút Toggle x1 / x2 trong Sandbox
    const toggleSpeedBtn = document.getElementById('sb-toggle-speed');
    if (toggleSpeedBtn) {
      toggleSpeedBtn.addEventListener('click', () => {
        this.gameState.toggleSpeed();
      });
    }

    const getSelectedRow = () => {
      const selectEl = document.getElementById('sb-row-select');
      const val = selectEl ? parseInt(selectEl.value, 10) : -1;
      if (val >= 0 && val < CONFIG.ROWS) return val;
      if (this.hoverRow >= 0) return this.hoverRow;
      return Math.floor(Math.random() * CONFIG.ROWS);
    };

    const bindSpawn = (id, type) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.gameState.spawnZombie(type, getSelectedRow());
        });
      }
    };

    bindSpawn('sb-spawn-basic', 'basic');
    bindSpawn('sb-spawn-regular', 'regular');
    bindSpawn('sb-spawn-conehead', 'conehead');
    bindSpawn('sb-spawn-buckethead', 'buckethead');
    bindSpawn('sb-spawn-pole-vaulting', 'pole_vaulting');
    bindSpawn('sb-spawn-gargantuar', 'gargantuar');
    bindSpawn('sb-spawn-tombstone', 'tombstone');
    bindSpawn('sb-spawn-imp', 'imp');
    bindSpawn('sb-spawn-bully', 'jurassic_bully');
    bindSpawn('sb-spawn-skull', 'turquoise_skull');
    bindSpawn('sb-spawn-dragon', 'zombot_dark_dragon');
    bindSpawn('sb-spawn-imp-dragon', 'imp_dragon');
    bindSpawn('sb-spawn-troglobite', 'troglobite');
    bindSpawn('sb-spawn-yeti-imp', 'yeti_imp');
    bindSpawn('sb-spawn-lang-khach', 'lang_khach');

    const resetCdBtn = document.getElementById('sb-reset-cooldowns');
    if (resetCdBtn) {
      resetCdBtn.addEventListener('click', () => {
        if (typeof this.gameState.toggleSandboxNoCooldown === 'function') {
          this.gameState.toggleSandboxNoCooldown();
        } else {
          this.gameState.resetCooldowns();
        }
      });
    }
  }
}

if (typeof window !== 'undefined') {
  window.CollisionSystem = CollisionSystem;
  window.WaveManager = WaveManager;
  window.InputHandler = InputHandler;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CollisionSystem, WaveManager, InputHandler };
}
