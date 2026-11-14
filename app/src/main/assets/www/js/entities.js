/**
 * PVZ Tower Defense 2D - Game Entities
 * BẮT BUỘC: Đọc trực tiếp DATA & LOGIC TẤN CÔNG (ATK) từ PLANT_CONFIG và ZOMBIE_CONFIG
 * Tuyệt đối không hardcode số liệu rải rác trong hàm
 */

let _entityIdCounter = 1;
function generateId() {
  return _entityIdCounter++;
}

/**
 * LỚP CÂY (Plant)
 */
class Plant {
  constructor(type, row, col) {
    const proto = PLANT_CONFIG[type] || PLANT_REGISTRY[type];
    if (!proto) throw new Error(`Unknown plant type: ${type}`);

    this.id = generateId();
    this.type = type;
    this.name = proto.name;
    this.group = proto.group || 'straight';
    this.row = row;
    this.col = col;

    // Tọa độ tâm ô
    this.x = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
    this.y = CONFIG.GRID_OFFSET_Y + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;

    this.maxHp = proto.hp;
    this.hp = proto.hp;
    this.alive = true;

    // Bộ đếm thời gian hành động & animation
    this.actionTimer = 0;
    this.flashTimer = 0;
    this.shootStateTimer = 0;
    this.animTime = Math.random() * Math.PI * 2;
    this.state = 'idle';

    // Cấu hình năng lực theo Object PLANT_CONFIG
    this.atkSpeed = proto.atkSpeed || proto.shootInterval || proto.attackInterval || 1.0;
    this.shootInterval = this.atkSpeed;
    this.shootTimer = 0;
    this.damage = proto.damage || 20;

    // Nhóm Functional: Sunflower tạo Sun (nhả 25 sun / 24s)
    if (proto.produceSun) {
      this.sunInterval = proto.sunInterval || 24.0;
      this.sunTimer = this.sunInterval - (proto.firstSunDelay || 5.0);
      this.sunAmount = proto.sunAmount || 25;
      this.glow = 0;
    }

    // Nhóm Straight: Repeater bắn liên thanh 2 hạt
    this.burstCount = proto.burstCount || 1;
    this.burstRemaining = 0;
    this.burstTimer = 0;

    // Nhóm Instant: Cherry Bomb
    if (type === 'cherry_bomb') {
      this.fuseTimer = proto.fuseTime || 1.2;
      this.hasExploded = false;
    }

    // Nhóm Melee Swallow: Chomper
    if (type === 'chomper') {
      this.swallowDamage = proto.swallowDamage || 2400;
      this.chewDuration = proto.chewDuration || 20.0;
      this.chewTimer = 0;
      this.isChewing = false;
      this.bossDamage = proto.bossDamage || 200;
      this.bossAtkSpeed = proto.bossAtkSpeed || 1.0;
    }

    // Nhóm Melee: Snapdragon & Bonk Choy
    if (type === 'snapdragon') {
      this.flameTimer = 0;
      this.rangeCols = proto.rangeCols || 2.2;
    }
    if (type === 'bonk_choy') {
      this.punchAnimTimer = 0;
      this.punchDir = 1;
    }
    if (type === 'galio') {
      this.skill1Timer = 0;
      this.skill1Interval = proto.skill1Interval || 5.0;
      this.skill1AnimTimer = 0;
      this.punchAnimTimer = 0;
      this.punchDir = 1;
      this.deathSkillTriggered = false;
    }
    if (type === 'jhinplant') {
      this.magSize = proto.magSize || 4;
      this.ammo = this.magSize;
      this.isReloading = false;
      this.reloadDuration = proto.reloadDuration || 4.0;
      this.reloadTimer = 0;
      this.curtainBarrage = null;
    }

    // Hạt Dẻ Toàn Ảnh: Infi-nut
    if (type === 'infi_nut') {
      this.timeSinceLastHit = 0;
      this.regenDelay = proto.regenDelay || 15.0;
      this.regenRate = proto.regenRate || 160.0;
      this.isRecharging = false;
      this.rechargeTimer = 0;
      this.rechargeDuration = 15.0;
    }

    // Nấm Mặt Trời: Sun Shroom
    if (type === 'sun_shroom') {
      this.stage = 1;
      this.growthTimer = 0;
    }

    // Hành Tây Choáng: Stunion
    if (type === 'stunion') {
      this.activated = false;
    }

    // Mìn Khoai Tây: Potato Mine
    // 5s sau khi đặt xuống mới nhô lên. Bị ăn trước khi nhô lên sẽ mất luôn.
    if (type === 'potato_mine') {
      this.armed = false;
      this.armTimer = 0;
      this.armDuration = proto.armDuration || 5.0;
      this.damage = proto.damage || 2700;
    }

    // Nấm Thôi Miên: Hypno-shroom
    if (type === 'hypno_shroom') {
      this.isHypno = true;
    }

    // Nấm Nam Châm: Magnet-shroom
    if (type === 'magnet_shroom') {
      this.attractTimer = 0;
      this.attractInterval = proto.attractInterval || 10.0;
      this.attractedArmor = null;
    }
  }

  update(dt, gameState) {
    if (!this.alive) return;

    this.animTime += dt;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    if (this.shootStateTimer > 0) {
      this.shootStateTimer -= dt;
      if (this.shootStateTimer <= 0 && this.state === 'shooting') {
        this.state = 'idle';
      }
    }

    // ----------------------------------------------------
    // NHÓM 4: CHỨC NĂNG - Sunflower (25 Sun / 24s)
    // ----------------------------------------------------
    if (this.type === 'sunflower') {
      this.sunTimer += dt;
      if (this.sunTimer >= this.sunInterval - 1.2) {
        this.glow = Math.min(1.0, this.glow + dt * 2);
      } else {
        this.glow = Math.max(0.0, this.glow - dt * 2);
      }

      if (this.sunTimer >= this.sunInterval) {
        this.sunTimer = 0;
        this.glow = 0;
        const offsetX = (Math.random() - 0.5) * 24;
        const targetY = this.y + 15 + Math.random() * 8;
        gameState.spawnSun(this.x + offsetX, this.y - 12, targetY, false, this.sunAmount);
      }
    }

    // Cập nhật loạt đạn liên thanh Plant Food (Peashooter 60 viên, Repeater 90 viên + đại đạn 600 DMG, Snow Pea 60 viên băng)
    if (this.plantFoodBarrage && this.plantFoodBarrage.count > 0) {
      this.plantFoodBarrage.timer -= dt;
      if (this.plantFoodBarrage.timer <= 0) {
        this.plantFoodBarrage.timer = this.plantFoodBarrage.interval || 0.02;
        this.plantFoodBarrage.count--;

        const pType = this.plantFoodBarrage.type || 'pea';
        const pDmg = this.plantFoodBarrage.damage || 20;
        const jitterY = (Math.random() - 0.5) * 12;
        const proj = new Projectile(pType, this.row, this.x + 20, this.y - 15 + jitterY, pDmg, 8.5);
        gameState.projectiles.push(proj);

        if (this.plantFoodBarrage.count === 0 && this.plantFoodBarrage.finisher) {
          const f = this.plantFoodBarrage.finisher;
          const giantProj = new Projectile('pea', this.row, this.x + 25, this.y - 15, f.damage || 600, 7.5);
          giantProj.isGiant = true;
          gameState.projectiles.push(giantProj);
          gameState.spawnParticles(this.x + 25, this.y - 15, '#76ff03', 15);
        }
      }
    }

    // Cập nhật Đám mây sấm sét Plant Food của Sậy Sét (Lightning Reed) truy kích zombie máu trâu nhất
    if (this.stormCloud) {
      this.stormCloud.duration -= dt;
      if (this.stormCloud.duration <= 0) {
        this.stormCloud = null;
      } else {
        if (!this.stormCloud.target || !this.stormCloud.target.alive) {
          let highestHp = -1;
          let bestTarget = null;
          gameState.zombies.forEach(z => {
            if (z.alive && !z.isHypnotized && z.hp > highestHp) {
              highestHp = z.hp;
              bestTarget = z;
            }
          });
          this.stormCloud.target = bestTarget;
        }

        if (this.stormCloud.target && this.stormCloud.target.alive) {
          const targetX = this.stormCloud.target.x;
          const targetY = this.stormCloud.target.y - 45;
          this.stormCloud.x += (targetX - this.stormCloud.x) * Math.min(1.0, dt * 5.0);
          this.stormCloud.y += (targetY - this.stormCloud.y) * Math.min(1.0, dt * 5.0);

          this.stormCloud.strikeTimer = (this.stormCloud.strikeTimer || 0) - dt;
          if (this.stormCloud.strikeTimer <= 0) {
            this.stormCloud.strikeTimer = 0.25;
            this.stormCloud.target.takeDamage(60);
            gameState.spawnLightningArc(this.stormCloud.x, this.stormCloud.y, this.stormCloud.target.x, this.stormCloud.target.y);
            gameState.spawnParticles(this.stormCloud.target.x, this.stormCloud.target.y - 10, '#00e5ff', 5);
            if (gameState.audio && gameState.audio.playLightning) {
              gameState.audio.playLightning();
            }
          }
        }
      }
    }

    // ----------------------------------------------------
    // NHÓM 1: BẮN THẲNG (Straight) - Peashooter, Snow Pea, Repeater, Goo Peashooter
    // (Không bao gồm lightning_reed vì lightning_reed chỉ giật tia sét)
    // ----------------------------------------------------
    if (this.type !== 'lightning_reed' && this.type !== 'jhinplant' && (this.group === 'straight' || this.type === 'peashooter' || this.type === 'snow_pea' || this.type === 'repeater' || this.type === 'goo_peashooter')) {
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
      }

      // Xử lý bắn phát đạn phụ (Repeater burst)
      if (this.burstRemaining > 0) {
        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
          this.burstRemaining--;
          this.shoot(gameState, 'pea');
          this.burstTimer = 0.15;
        }
      }

      // Tìm zombie hoặc vật cản còn sống trên cùng hàng ở phía trước (hoặc Zombot Dark Dragon nếu hitbox 2 hàng bao phủ hàng này)
      const hasTargetAhead = gameState.zombies.some(z => {
        if (!z.alive || z.isHypnotized) return false;
        const isBossTarget = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
        const matchesRow = z.row === this.row || isBossTarget;
        return matchesRow && z.x > this.x - 10 && z.x < CONFIG.CANVAS_WIDTH + 60;
      });

      if (hasTargetAhead && this.shootTimer <= 0 && this.burstRemaining === 0) {
        const proto = PLANT_CONFIG[this.type];
        this.shootTimer = (proto && proto.atkSpeed) ? proto.atkSpeed : this.atkSpeed;

        if (this.type === 'repeater') {
          this.shoot(gameState, 'pea');
          this.burstRemaining = 1; // Phát thứ 2 bắn sau 0.15s
          this.burstTimer = 0.15;
        } else if (this.type === 'snow_pea') {
          this.shoot(gameState, 'ice_pea');
        } else if (this.type === 'goo_peashooter') {
          this.shoot(gameState, 'goo_pea');
        } else {
          this.shoot(gameState, 'pea');
        }
      }
    }

    // ----------------------------------------------------
    // JHINPLANT (Hoa Súng Tử Vong) - 4 viên (125 DMG, viên 4 x4 = 500 DMG) + Nạp đạn 4s
    // ----------------------------------------------------
    if (this.type === 'jhinplant') {
      const proto = PLANT_CONFIG.jhinplant || {};

      // Plant Food: Bắn liên hoàn 4 phát đại bác tử vong
      if (this.curtainBarrage && this.curtainBarrage.shotsLeft > 0) {
        this.curtainBarrage.timer -= dt;
        if (this.curtainBarrage.timer <= 0) {
          this.curtainBarrage.timer = this.curtainBarrage.interval || 0.16;
          const isFourthPF = (this.curtainBarrage.shotsLeft === 1);
          this.curtainBarrage.shotsLeft--;

          const pfDmg = isFourthPF ? 1000 : 250;
          const proj = gameState.spawnProjectile(
            'jhin_bullet',
            this.row,
            this.x + 26,
            this.y - 14,
            pfDmg,
            13.0
          );
          proj.isJhinBullet = true;
          proj.isFourthShot = isFourthPF;
          this.state = 'shooting';
          this.shootStateTimer = 0.2;
          gameState.spawnParticles(this.x + 24, this.y - 14, isFourthPF ? '#ff1744' : '#e040fb', isFourthPF ? 10 : 5);
          if (gameState.audio && gameState.audio.playJhinShot) {
            gameState.audio.playJhinShot(isFourthPF);
          }
          if (this.curtainBarrage.shotsLeft === 0) {
            this.curtainBarrage = null;
          }
        }
      }

      if (this.isReloading) {
        this.reloadTimer -= dt;
        if (this.reloadTimer <= 0) {
          this.isReloading = false;
          this.reloadTimer = 0;
          this.ammo = this.magSize || 4;
          this.shootTimer = 0;
        }
      } else {
        if (this.shootTimer > 0) {
          this.shootTimer -= dt;
        }

        const hasTargetAhead = gameState.zombies.some(z => {
          if (!z.alive || z.isHypnotized) return false;
          const isBossTarget = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
          const matchesRow = z.row === this.row || isBossTarget;
          return matchesRow && z.x > this.x - 10 && z.x < CONFIG.CANVAS_WIDTH + 60;
        });

        if (hasTargetAhead && this.shootTimer <= 0) {
          const isFourthShot = (this.ammo === 1);
          const baseDmg = proto.damage || 125;
          const dmg = isFourthShot ? baseDmg * (proto.fourthShotMultiplier || 4) : baseDmg;
          const speed = proto.projectileSpeed || 11.0;

          const proj = gameState.spawnProjectile(
            'jhin_bullet',
            this.row,
            this.x + 26,
            this.y - 14,
            dmg,
            speed
          );
          proj.isJhinBullet = true;
          proj.isFourthShot = isFourthShot;

          this.state = 'shooting';
          this.shootStateTimer = isFourthShot ? 0.3 : 0.2;
          gameState.spawnParticles(this.x + 24, this.y - 14, isFourthShot ? '#ff1744' : '#ba68c8', isFourthShot ? 10 : 4);
          if (gameState.audio && gameState.audio.playJhinShot) {
            gameState.audio.playJhinShot(isFourthShot);
          }

          this.ammo--;
          if (this.ammo <= 0) {
            this.isReloading = true;
            this.reloadTimer = proto.reloadDuration || 4.0;
            this.shootTimer = 0;
            if (gameState.spawnFloatingText) {
              gameState.spawnFloatingText(this.x, this.y - 30, 'IV! NẠP ĐẠN 4s', '#ff1744', 15);
            }
          } else {
            this.shootTimer = proto.atkSpeed || 1.0;
          }
        }
      }
    }

    // ----------------------------------------------------
    // NHÓM 2: BẮN CẦU VỒNG (Lobbed) - Cabbage-pult, Melon-pult
    // Ưu tiên bắn zombie địch trước, khi không có zombie mới ưu tiên target Mộ (Tombstone)
    // ----------------------------------------------------
    if (this.group === 'lobbed') {
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
      }

      // 1. Tìm zombie địch bình thường (ưu tiên) hoặc Bia Mộ ở phía trước không cấp phát mảng/sắp xếp
      let targetZombie = null;
      let minZombieX = Infinity;
      let targetObstacle = null;
      let minObstacleX = Infinity;

      for (let i = 0; i < gameState.zombies.length; i++) {
        const z = gameState.zombies[i];
        if (!z.alive || z.isHypnotized) continue;
        const isBossTarget = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
        const matchesRow = z.row === this.row || isBossTarget;
        if (!matchesRow || z.x <= this.x - 10 || z.x >= CONFIG.CANVAS_WIDTH + 60) continue;

        if (!z.isObstacle) {
          if (z.x < minZombieX) {
            minZombieX = z.x;
            targetZombie = z;
          }
        } else if (z.row === this.row && z.x < minObstacleX) {
          minObstacleX = z.x;
          targetObstacle = z;
        }
      }

      const targetZombieToShoot = targetZombie || targetObstacle;

      if (targetZombieToShoot && this.shootTimer <= 0) {
        const proto = PLANT_CONFIG[this.type];
        this.shootTimer = (proto && proto.atkSpeed) ? proto.atkSpeed : this.atkSpeed;

        const spawnX = this.x - 10;
        const spawnY = this.y - 25;
        const projType = proto.projectileType || (this.type === 'melon_pult' ? 'melon' : 'cabbage');

        gameState.spawnLobbedProjectile(
          projType,
          this.row,
          spawnX,
          spawnY,
          targetZombieToShoot.x + 10,
          targetZombieToShoot.y,
          proto.damage,
          proto.splashDamage || 0,
          proto.splashRadiusCells || 1.2,
          proto.arcHeight || 95
        );

        if (gameState && gameState.audio) {
          gameState.audio.playShoot('lobbed');
        }

        this.state = 'shooting';
        this.shootStateTimer = 0.25;
      }
    }

    // ----------------------------------------------------
    // NHÓM 3: CẬN CHIẾN (Melee) - Bonk Choy & Snapdragon
    // ----------------------------------------------------
    if (this.type === 'bonk_choy') {
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
      }
      if (this.punchAnimTimer > 0) {
        this.punchAnimTimer -= dt;
      }

      // Phạm vi tấn công 2 ô trước mặt và 2 ô đằng sau lưng (rangeCols: 2 ô)
      const rangePx = CONFIG.CELL_WIDTH * 2.15;
      const targets = gameState.zombies.filter(z => {
        return z.alive && !z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) <= rangePx;
      });

      if (targets.length > 0 && this.shootTimer <= 0) {
        const proto = PLANT_CONFIG.bonk_choy;
        this.shootTimer = proto.atkSpeed || 0.5; // 0.5s mỗi lần đấm
        this.punchAnimTimer = 0.24;
        this.state = 'shooting';
        this.shootStateTimer = 0.24;

        const hasFront = targets.some(z => z.x >= this.x);
        const hasBack = targets.some(z => z.x < this.x);
        this.punchDir = (hasFront && hasBack) ? 0 : (hasBack ? -1 : 1);

        // Đấm 20 sát thương mỗi 0.5s cho các mục tiêu trong phạm vi
        targets.forEach(z => {
          z.takeDamage(proto.damage || 20);
          gameState.spawnParticles(z.x, z.y - 10, '#cddc39', 3);
        });
        if (gameState.spawnAttackEffect) {
          const lawnLeft = CONFIG.GRID_OFFSET_X;
          const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
          gameState.spawnAttackEffect({
            kind: 'bonk_choy_punch',
            x: this.x,
            y: this.y,
            row: this.row,
            minRow: this.row,
            maxRow: this.row,
            startX: Math.max(lawnLeft, this.x - rangePx),
            endX: Math.min(lawnRight, this.x + rangePx),
            punchDir: this.punchDir,
            duration: 0.22
          });
        }
        if (gameState && gameState.audio) {
          gameState.audio.playMelee && gameState.audio.playMelee();
        }
      }
    }

    if (this.type === 'snapdragon') {
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
      }
      if (this.flameTimer > 0) {
        this.flameTimer -= dt;
      }

      // Tầm 1x3 ô: hàng trên, hàng hiện tại, hàng dưới; 2.2 ô phía trước (không thiêu đồng minh thôi miên)
      const rangePx = CONFIG.CELL_WIDTH * 2.2;
      const targets = gameState.zombies.filter(z => {
        return z.alive && !z.isHypnotized && Math.abs(z.row - this.row) <= 1 && z.x >= this.x && z.x <= this.x + rangePx;
      });

      if (targets.length > 0 && this.shootTimer <= 0) {
        const proto = PLANT_CONFIG.snapdragon;
        this.shootTimer = proto.atkSpeed || 1.0;
        this.flameTimer = 0.42;
        this.state = 'shooting';
        this.shootStateTimer = 0.42;

        // Phun lửa thiêu rụi toàn bộ mục tiêu trong phạm vi 1x3 ô
        targets.forEach(z => {
          z.takeDamage(proto.damage);
          gameState.spawnParticles(z.x, z.y - 8, '#ff5722', 4);
        });
        if (gameState.spawnAttackEffect) {
          const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
          gameState.spawnAttackEffect({
            kind: 'snapdragon_flame',
            x: this.x,
            y: this.y,
            row: this.row,
            minRow: Math.max(0, this.row - 1),
            maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
            startX: this.x,
            endX: Math.min(lawnRight, this.x + rangePx),
            isPlantFood: false,
            duration: 0.36
          });
        }
      }
    }

    if (this.type === 'galio') {
      if (this.shootTimer > 0) {
        this.shootTimer -= dt;
      }
      if (this.punchAnimTimer > 0) {
        this.punchAnimTimer -= dt;
      }
      if (this.skill1AnimTimer > 0) {
        this.skill1AnimTimer -= dt;
      }

      const proto = PLANT_CONFIG.galio;
      const rangePx = CONFIG.CELL_WIDTH * 2.15; // 2 ô tính từ bản thân

      // Basic Attack: 2 ô tính từ bản thân, 50 sát thương / 0.5s
      const meleeTargets = gameState.zombies.filter(z => {
        if (!z.alive || z.isHypnotized) return false;
        const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
        const isRowMatch = z.row === this.row || isBossHitbox;
        return isRowMatch && Math.abs(z.x - this.x) <= rangePx;
      });

      if (meleeTargets.length > 0 && this.shootTimer <= 0) {
        this.shootTimer = proto.atkSpeed || 0.5;
        this.punchAnimTimer = 0.22;
        this.state = 'shooting';
        this.shootStateTimer = 0.22;

        const hasFront = meleeTargets.some(z => z.x >= this.x);
        const hasBack = meleeTargets.some(z => z.x < this.x);
        this.punchDir = (hasFront && hasBack) ? 0 : (hasBack ? -1 : 1);

        meleeTargets.forEach(z => {
          z.takeDamage(proto.damage || 50);
          gameState.spawnParticles(z.x, z.y - 10, '#4fc3f7', 3);
        });

        if (gameState.spawnAttackEffect) {
          const lawnLeft = CONFIG.GRID_OFFSET_X;
          const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
          gameState.spawnAttackEffect({
            kind: 'galio_strike',
            x: this.x,
            y: this.y,
            row: this.row,
            minRow: this.row,
            maxRow: this.row,
            startX: Math.max(lawnLeft, this.x - rangePx),
            endX: Math.min(lawnRight, this.x + rangePx),
            punchDir: this.punchDir,
            duration: 0.22
          });
        }
        if (gameState && gameState.audio && gameState.audio.playMelee) {
          gameState.audio.playMelee();
        }
      }

      // Skill 1: Chỉ tích tiến độ khi đang tấn công zombie; đủ 5s bắn sóng năng lượng trước mặt (500 sát thương lên zombie đầu tiên trúng chiêu)
      if (meleeTargets.length > 0) {
        const interval = this.skill1Interval || 5.0;
        this.skill1Timer = Math.min(interval, this.skill1Timer + dt);
        if (this.skill1Timer >= interval) {
          this.skill1Timer = 0;
          this.skill1AnimTimer = 0.4;
          this.punchDir = 1;
          this.state = 'shooting';
          this.shootStateTimer = 0.35;

          const wave = new Projectile(
            'galio_wave',
            this.row,
            this.x + 22,
            this.y - 4,
            proto.skill1Damage || 500,
            proto.skill1Speed || 9.0
          );
          wave.isEnergyWave = true;
          wave.isSingleTarget = true;
          wave.hitZombies = new Set();
          gameState.projectiles.push(wave);

          gameState.spawnParticles(this.x + 20, this.y - 4, '#00e5ff', 6);
          if (gameState && gameState.audio && gameState.audio.playShoot) {
            gameState.audio.playShoot('laser');
          }
        }
      }
    }

    // ----------------------------------------------------
    // NHÓM 4: CHỨC NĂNG ĐẶC BIỆT - Cherry Bomb & Chomper
    // ----------------------------------------------------
    if (this.type === 'cherry_bomb') {
      if (!this.hasExploded) {
        this.fuseTimer -= dt;
        // Rung lắc & nhấp nháy đỏ sắp nổ
        if (this.fuseTimer <= 0) {
          this.hasExploded = true;
          this.alive = false;

          const proto = PLANT_CONFIG.cherry_bomb;
          const radiusPx = CONFIG.CELL_WIDTH * 1.6;

          // Nổ 3x3 gây 1800 DMG (không đánh đồng minh thôi miên)
          gameState.zombies.forEach(z => {
            if (z.alive && !z.isHypnotized && Math.abs(z.row - this.row) <= 1 && Math.abs(z.x - this.x) <= radiusPx) {
              z.takeDamage(proto.damage); // 1800 DMG
              gameState.spawnParticles(z.x, z.y, '#e53935', 12);
            }
          });

          if (gameState.spawnAttackEffect) {
            const lawnLeft = CONFIG.GRID_OFFSET_X;
            const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
            gameState.spawnAttackEffect({
              kind: 'blast_3x3',
              x: this.x,
              y: this.y,
              row: this.row,
              minRow: Math.max(0, this.row - 1),
              maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
              startX: Math.max(lawnLeft, this.x - radiusPx),
              endX: Math.min(lawnRight, this.x + radiusPx),
              color: '#ff1744',
              duration: 0.55
            });
          }

          // Hiệu ứng khói lửa nổ tung
          gameState.spawnExplosion(this.x, this.y);
          if (gameState && gameState.audio) {
            gameState.audio.playExplosion('normal');
          }
        }
      }
    }

    if (this.type === 'chomper') {
      if (this.isChewing) {
        this.chewTimer -= dt;
        if (this.chewTimer <= 0) {
          this.isChewing = false;
          this.state = 'idle';
        }
      } else {
        if (this.shootTimer > 0) {
          this.shootTimer -= dt;
        }

        // Tầm cắn: Bao gồm ô của bản thân và 1 ô trước mặt (Ví dụ đặt sau Hạt Dẻ, khi zombie cắn hạt dẻ Chomper vẫn với tới ăn được)
        const cellLeft = this.x - CONFIG.CELL_WIDTH * 0.45;
        const reachRight = this.x + CONFIG.CELL_WIDTH * 1.85;
        const target = gameState.zombies.find(z => {
          return z.alive && !z.isHypnotized && z.row === this.row && z.x >= cellLeft && z.x <= reachRight;
        });

        if (target && this.shootTimer <= 0) {
          const proto = PLANT_CONFIG.chomper;
          this.state = 'shooting';
          this.shootStateTimer = 0.35;

          if (gameState.spawnAttackEffect) {
            const lawnLeft = CONFIG.GRID_OFFSET_X;
            const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
            gameState.spawnAttackEffect({
              kind: 'chomper_bite',
              x: this.x,
              y: this.y,
              row: this.row,
              minRow: this.row,
              maxRow: this.row,
              startX: Math.max(lawnLeft, cellLeft),
              endX: Math.min(lawnRight, reachRight),
              targetX: target.x,
              duration: 0.38
            });
          }

          if (target.isBoss || target.isObstacle) {
            // Với Boss / Vật cản: Cắn 200 dmg mỗi 1.0s
            this.shootTimer = proto.bossAtkSpeed || 1.0;
            target.takeDamage(proto.bossDamage);
            gameState.spawnParticles(target.x, target.y - 10, '#ab47bc', 5);
          } else {
            // Với Zombie thường: Nuốt tức thì (2400 dmg), tiêu hóa 20s
            target.takeDamage(proto.swallowDamage);
            this.isChewing = true;
            this.chewTimer = proto.chewDuration || 20.0;
            this.state = 'chewing';
            gameState.spawnParticles(target.x, target.y - 10, '#7b1fa2', 8);
          }
          if (gameState && gameState.audio) {
            gameState.audio.playChomp && gameState.audio.playChomp();
          }
        }
      }
    }

    // ----------------------------------------------------
    // CÁC CÂY TƯƠNG THÍCH KHÁC (Sậy Sét, Stunion, Infi-nut, Sun-shroom)
    // ----------------------------------------------------
    if (this.type === 'lightning_reed') {
      if (this.shootTimer > 0) this.shootTimer -= dt;
      const validZombies = gameState.zombies.filter(z => {
        if (!z.alive || z.isHypnotized) return false;
        const isBossTarget = z.type === 'zombot_dark_dragon' && (Math.abs(z.bossRow - this.row) <= 1 || Math.abs((z.bossRow + 1) - this.row) <= 1);
        const matchesRow = Math.abs(z.row - this.row) <= 1 || isBossTarget;
        return matchesRow && z.x >= this.x - 40 && z.x <= CONFIG.CANVAS_WIDTH + 60;
      });
      if (validZombies.length > 0 && this.shootTimer <= 0) {
        this.shootTimer = this.shootInterval;
        this.attackLightning(validZombies, gameState);
      }
    }

    if (this.type === 'stunion') {
      if (!this.activated) {
        const targetZombie = gameState.zombies.find(z => {
          return z.alive && !z.isHypnotized && !z.isObstacle && z.row === this.row && z.x >= this.x - 20 && z.x <= this.x + 1.8 * CONFIG.CELL_WIDTH;
        });
        if (targetZombie) {
          this.activated = true;
          this.state = 'shooting';
          gameState.zombies.forEach(z => {
            if (z.alive && !z.isHypnotized && !z.isObstacle && z.row === this.row && z.x >= this.x - 25 && z.x <= this.x + 2.2 * CONFIG.CELL_WIDTH) {
              z.applyStun(12.0);
            }
          });
          gameState.spawnGasCloud(this.x + 35, this.y);
          if (gameState.spawnAttackEffect) {
            const lawnLeft = CONFIG.GRID_OFFSET_X;
            const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
            gameState.spawnAttackEffect({
              kind: 'stunion_gas',
              x: this.x,
              y: this.y,
              row: this.row,
              minRow: this.row,
              maxRow: this.row,
              startX: Math.max(lawnLeft, this.x - 25),
              endX: Math.min(lawnRight, this.x + 2.2 * CONFIG.CELL_WIDTH),
              isPlantFood: false,
              duration: 0.85
            });
          }
          setTimeout(() => { this.alive = false; }, 300);
        }
      }
    }

    if (this.type === 'infi_nut') {
      // Khi Infi-nut bị tiêu diệt bởi zombie thường: Để lại máy chiếu, sau 15s hồi sinh đầy máu!
      if (this.isRecharging) {
        this.rechargeTimer -= dt;
        if (this.rechargeTimer <= 0) {
          this.isRecharging = false;
          this.rechargeTimer = 0;
          this.hp = this.maxHp;
          this.state = 'idle';
          gameState.spawnParticles(this.x, this.y, '#00e5ff', 25);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x, this.y - 25, 'HỒI SINH! 🛡️', '#00e5ff', 16);
          }
          if (gameState && gameState.audio) {
            gameState.audio.playPlant();
          }
        }
      } else {
        // Tự phục hồi máu bình thường khi không nhận sát thương sau 15s
        this.timeSinceLastHit += dt;
        if (this.timeSinceLastHit >= this.regenDelay && this.hp < this.maxHp) {
          this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
        }
      }
    }

    if (this.type === 'sun_shroom') {
      this.growthTimer += dt;
      const proto = PLANT_CONFIG.sun_shroom;
      if (this.stage === 1 && this.growthTimer >= proto.stage2Time) {
        this.stage = 2;
        gameState.spawnParticles(this.x, this.y, '#ffd54f', 6);
      } else if (this.stage === 2 && this.growthTimer >= proto.stage3Time) {
        this.stage = 3;
        gameState.spawnParticles(this.x, this.y, '#ffa000', 8);
      }
      this.sunTimer += dt;
      if (this.sunTimer >= this.sunInterval) {
        this.sunTimer = 0;
        const amount = this.stage === 1 ? proto.stage1Sun : (this.stage === 2 ? proto.stage2Sun : proto.stage3Sun);
        gameState.spawnSun(this.x, this.y - 10, this.y + 15, false, amount);
      }
    }

    // ----------------------------------------------------
    // NẤM NAM CHÂM (Magnet-shroom)
    // ----------------------------------------------------
    // NẤM NAM CHÂM (Magnet-shroom)
    // Hút thùng sắt, mũ giáp kim loại của zombie trên sân (bán kính 7.5 ô)
    // ----------------------------------------------------
    if (this.type === 'magnet_shroom') {
      if (this.attractTimer > 0) {
        this.attractTimer -= dt;
        if (this.attractTimer <= 0) {
          this.attractedArmor = null; // Tiêu hóa xong thùng sắt, sẵn sàng hút tiếp
        }
      } else {
        // Tìm zombie gần nhất còn giáp sắt/thùng sắt
        const candidateZombie = gameState.zombies.find(z => {
          return z.alive && !z.isHypnotized && !z.isObstacle && (z.armorHp > 0 || z.type === 'buckethead') && Math.hypot(z.x - this.x, z.y - this.y) <= CONFIG.CELL_WIDTH * 7.5;
        });

        if (candidateZombie) {
          candidateZombie.armorHp = 0; // Hút phăng giáp sắt!
          candidateZombie.hasShield = false;
          // Đưa máu về máu cơ bản (190 HP của zombie thường) để loại bỏ hoàn toàn lượng máu khủng của giáp thùng sắt
          if (candidateZombie.baseHp && candidateZombie.hp > candidateZombie.baseHp) {
            candidateZombie.hp = candidateZombie.baseHp;
          }
          this.attractedArmor = 'bucket';
          this.attractTimer = this.attractInterval || 12.0;

          // Hiệu ứng tia từ tính và mảnh kim loại bay về phía nấm nam châm
          gameState.spawnParticles(this.x, this.y - 20, '#b0bec5', 18);
          gameState.spawnParticles(this.x, this.y - 20, '#00e5ff', 12);
          gameState.spawnParticles(candidateZombie.x, candidateZombie.y - 20, '#b0bec5', 14);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x, this.y - 28, 'HÚT KIM LOẠI! 🧲', '#00e5ff', 16);
            gameState.spawnFloatingText(candidateZombie.x, candidateZombie.y - 25, 'MẤT THÙNG SẮT! ⛓️', '#b0bec5', 14);
          }
          if (gameState.audio && gameState.audio.playHit) {
            gameState.audio.playHit();
          }
        }
      }
    }

    // ----------------------------------------------------
    // MÌN KHOAI TÂY (Potato Mine)
    // ----------------------------------------------------
    if (this.type === 'potato_mine') {
      if (!this.armed) {
        this.armTimer += dt;
        if (this.armTimer >= this.armDuration) {
          this.armed = true;
          gameState.spawnParticles(this.x, this.y, '#ffd54f', 8);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x, this.y - 25, 'SẴN SÀNG! 🥔', '#76ff03', 14);
          }
        }
      } else {
        // Đã nhô lên: Quét bất kỳ Zombie địch nào bước tới (bao gồm Gargantuar bước vào tầm đập hoặc dẫm)
        const triggerZombie = gameState.zombies.find(z => {
          if (!z.alive || z.isHypnotized || z.isObstacle || z.row !== this.row) return false;
          const dist = Math.abs(z.x - this.x);
          return dist <= (z.type === 'gargantuar' ? 65 : 42) || (z.isEating && z.eatingPlant === this);
        });

        if (triggerZombie) {
          this.alive = false;
          // Hiệu ứng nổ SPUDOW!
          gameState.spawnParticles(this.x, this.y, '#ff6f00', 25);
          gameState.spawnParticles(this.x, this.y, '#ffd54f', 20);
          gameState.spawnParticles(this.x, this.y, '#5d4037', 15);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x, this.y - 32, 'SPUDOW! 💥', '#ff6f00', 22);
          }
          if (gameState && gameState.audio) {
            gameState.audio.playExplosion('spudow');
          }

          // Nổ sát thương 2700 trong phạm vi 3x3 ô (bán kính 1.5 ô quanh tâm)
          const radiusX = CONFIG.CELL_WIDTH * 1.5;
          if (gameState.spawnAttackEffect) {
            const lawnLeft = CONFIG.GRID_OFFSET_X;
            const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
            gameState.spawnAttackEffect({
              kind: 'blast_3x3',
              x: this.x,
              y: this.y,
              row: this.row,
              minRow: Math.max(0, this.row - 1),
              maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
              startX: Math.max(lawnLeft, this.x - radiusX),
              endX: Math.min(lawnRight, this.x + radiusX),
              color: '#ff9100',
              duration: 0.55
            });
          }
          gameState.zombies.forEach(z => {
            if (z.alive && !z.isHypnotized && !z.isObstacle) {
              const rowDiff = Math.abs(z.row - this.row);
              const colDist = Math.abs(z.x - this.x);
              if (rowDiff <= 1 && colDist <= radiusX) {
                z.takeDamage(this.damage); // 2700 DMG
              }
            }
          });
        }
      }
    }
  }

  shoot(gameState, projType = 'pea') {
    const proto = PLANT_CONFIG[this.type] || {};
    const spawnX = this.x + 24;
    const spawnY = this.y - 12;
    const dmg = proto.damage || this.damage || 20;
    const speed = proto.projectileSpeed || 6.5;

    gameState.spawnProjectile(projType, this.row, spawnX, spawnY, dmg, speed);
    if (gameState && gameState.audio) {
      gameState.audio.playShoot(projType);
    }
    this.state = 'shooting';
    this.shootStateTimer = 0.2;
  }

  attackLightning(validZombies, gameState) {
    this.state = 'shooting';
    this.shootStateTimer = 0.22;
    let primaryTarget = null;
    let minDistance = Infinity;

    for (const z of validZombies) {
      const dist = Math.hypot(z.x - this.x, z.y - this.y);
      if (dist < minDistance) {
        minDistance = dist;
        primaryTarget = z;
      }
    }
    if (!primaryTarget) return;

    // Mục tiêu chính: 10 sát thương sét
    primaryTarget.takeDamage(10);
    gameState.spawnLightningArc(this.x + 8, this.y - 20, primaryTarget.x, primaryTarget.y - 8);
    gameState.spawnParticles(primaryTarget.x, primaryTarget.y - 8, '#00e5ff', 4);
    if (gameState && gameState.audio) {
      gameState.audio.playZap && gameState.audio.playZap();
    }

    // Sát thương lan tối đa 3 mục tiêu (1 mục tiêu chính + tối đa 2 mục tiêu lan)
    // Khoảng cách từ mục tiêu chính tới mục tiêu lan không quá 3 ô (3 * CONFIG.CELL_WIDTH)
    const maxChainDistPx = CONFIG.CELL_WIDTH * 3.0;
    const chainCandidates = validZombies.filter(z => {
      if (z.id === primaryTarget.id || !z.alive) return false;
      const distFromPrimary = Math.hypot(z.x - primaryTarget.x, z.y - primaryTarget.y);
      return distFromPrimary <= maxChainDistPx;
    });

    chainCandidates.sort((a, b) => Math.hypot(a.x - primaryTarget.x, a.y - primaryTarget.y) - Math.hypot(b.x - primaryTarget.x, b.y - primaryTarget.y));

    for (const chainZ of chainCandidates.slice(0, 2)) {
      chainZ.takeDamage(10);
      gameState.spawnLightningArc(primaryTarget.x, primaryTarget.y - 8, chainZ.x, chainZ.y - 8);
      gameState.spawnParticles(chainZ.x, chainZ.y - 8, '#00e5ff', 3);
    }
  }

  triggerPlantFood(gameState) {
    if (!gameState) return false;

    // 5. Cây tức thời: Cherry Bomb KHÔNG thể dùng Plant Food
    if (this.type === 'cherry_bomb') {
      return false;
    }

    // Ngắt đòn khạc lửa của Zombot Dark Dragon nếu rồng đang chuẩn bị hoặc đang khạc lửa
    const bossDragon = gameState.zombies.find(z => z.alive && z.type === 'zombot_dark_dragon');
    if (bossDragon) {
      bossDragon.cancelFireBreath(gameState);
    }

    // Hiệu ứng chung: Hồi đầy máu và phát tán hào quang lá thần
    this.hp = this.maxHp;
    gameState.spawnParticles(this.x, this.y, '#76ff03', 25);
    gameState.spawnParticles(this.x, this.y, '#ffd54f', 15);

    // ====================================================
    // 1. NHÓM SẢN XUẤT MẶT TRỜI
    // ====================================================
    if (this.type === 'sunflower') {
      // Hướng Dương: Lập tức sản xuất ra 150 mặt trời (6 cụm x 25)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const targetX = this.x + Math.cos(angle) * 35;
        const targetY = this.y + Math.sin(angle) * 30;
        gameState.spawnSun(this.x, this.y - 10, targetY, false, 25);
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, '+150 SUN! ☀️', '#ffd54f', 18);
      }
      return true;
    }

    if (this.type === 'sun_shroom') {
      // Nấm Mặt Trời: Đạt kích thước lớn nhất (stage 3) và tạo 225 mặt trời (3 cụm x 75)
      this.stage = 3;
      this.growthTimer = (PLANT_CONFIG.sun_shroom && PLANT_CONFIG.sun_shroom.stage3Time) || 90.0;
      for (let i = 0; i < 3; i++) {
        const offsetX = (i - 1) * 28;
        gameState.spawnSun(this.x + offsetX, this.y - 15, this.y + 20, false, 75);
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'MAX SIZE! +225 SUN! 🍄☀️', '#ffa000', 18);
      }
      return true;
    }

    // ====================================================
    // 2. NHÓM CÂY TẤN CÔNG TẦM XA (BẮN ĐẬU & BẮN ĐÁ)
    // ====================================================
    if (this.type === 'peashooter') {
      // Đậu Bắn Súng: Loạt đạn liên thanh gồm 60 viên đậu, 20 DMG/viên = 1200 tổng sát thương
      this.plantFoodBarrage = {
        count: 60,
        interval: 0.02,
        timer: 0,
        type: 'pea',
        damage: 20
      };
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'BARRAGE 60 PEAS! 🍃', '#76ff03', 16);
      }
      return true;
    }

    if (this.type === 'repeater') {
      // Đậu Nòng Đôi: Loạt 90 viên đậu kết thúc bằng viên đậu khổng lồ 600 DMG
      this.plantFoodBarrage = {
        count: 90,
        interval: 0.016,
        timer: 0,
        type: 'pea',
        damage: 20,
        finisher: { damage: 600 }
      };
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'GATLING + GIANT PEA! 💥', '#76ff03', 16);
      }
      return true;
    }

    if (this.type === 'snow_pea') {
      // Đậu Băng: Tạo dải băng chạy dọc hàng làm chậm và đóng băng zombie + 60 viên đậu băng liên thanh
      gameState.zombies.forEach(z => {
        if (z.alive && !z.isHypnotized && z.row === this.row) {
          z.applySlow(0.3, 12.0); // Làm chậm nặng
          z.applyStun(3.0, true); // Đóng băng 3s (isFreeze = true)
          z.takeDamage(100);
          gameState.spawnParticles(z.x, z.y - 10, '#00e5ff', 8);
        }
      });
      // Vệt sương băng trên toàn hàng
      for (let c = 0; c < CONFIG.COLS; c++) {
        const iceX = CONFIG.GRID_OFFSET_X + c * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
        gameState.spawnParticles(iceX, this.y + 15, '#e0f7fa', 3);
      }
      this.plantFoodBarrage = {
        count: 60,
        interval: 0.02,
        timer: 0,
        type: 'ice_pea',
        damage: 20
      };
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'BLIZZARD LANE! ❄️', '#00e5ff', 16);
      }
      return true;
    }

    if (this.type === 'goo_peashooter') {
      // Đậu Độc: Nhổ viên đạn độc khổng lồ lăn dọc hàng, xô ngã, 1000 impact damage + dải độc 8s
      const boulder = new Projectile('goo_pea', this.row, this.x + 25, this.y - 8, 1000, 5.5);
      boulder.isRollingPoisonBoulder = true;
      boulder.hitZombies = new Set();
      gameState.projectiles.push(boulder);
      gameState.spawnParticles(this.x + 25, this.y - 8, '#d500f9', 20);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'POISON BOULDER! ☣️', '#d500f9', 18);
      }
      return true;
    }

    if (this.type === 'cabbage_pult') {
      // Bắp Cải: Bắn bắp cải lớn vào tất cả zombie trên sân, mỗi bắp cải 200 sát thương
      const livingZombies = gameState.zombies.filter(z => z.alive && !z.isHypnotized && !z.isObstacle);
      if (livingZombies.length > 0) {
        livingZombies.forEach(z => {
          gameState.spawnLobbedProjectile('cabbage', z.row, this.x - 10, this.y - 25, z.x, z.y, 200, 0, 1.0, 110);
        });
      } else {
        // Mưa bắp cải khắp các hàng nếu chưa có zombie
        for (let r = 0; r < CONFIG.ROWS; r++) {
          const targetX = CONFIG.GRID_OFFSET_X + 6 * CONFIG.CELL_WIDTH;
          const targetY = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
          gameState.spawnLobbedProjectile('cabbage', r, this.x - 10, this.y - 25, targetX, targetY, 200, 0, 1.0, 110);
        }
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'CABBAGE BARRAGE! 🥬', '#8bc34a', 18);
      }
      return true;
    }

    if (this.type === 'melon_pult') {
      // Dưa Hấu: Bắn dưa hấu khổng lồ vào tất cả zombie trên màn hình (200 direct + 100 AoE)
      const livingZombies = gameState.zombies.filter(z => z.alive && !z.isHypnotized && !z.isObstacle);
      if (livingZombies.length > 0) {
        livingZombies.forEach(z => {
          gameState.spawnLobbedProjectile('melon', z.row, this.x - 10, this.y - 25, z.x, z.y, 200, 100, 1.5, 120);
        });
      } else {
        for (let r = 0; r < CONFIG.ROWS; r++) {
          const targetX = CONFIG.GRID_OFFSET_X + 6 * CONFIG.CELL_WIDTH;
          const targetY = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
          gameState.spawnLobbedProjectile('melon', r, this.x - 10, this.y - 25, targetX, targetY, 200, 100, 1.5, 120);
        }
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'MELON RAIN! 🍉', '#4caf50', 18);
      }
      return true;
    }

    // ====================================================
    // 3. NHÓM CẬN CHIẾN & DIỆN RỘNG
    // ====================================================
    if (this.type === 'bonk_choy') {
      // Đấm Bốc: Tung chuỗi đấm liên hoàn quét mọi hướng phạm vi 3x3 (1500 DMG)
      this.state = 'shooting';
      this.punchAnimTimer = 1.0;
      this.punchDir = 0;
      const radiusPx = CONFIG.CELL_WIDTH * 1.8;
      if (gameState.spawnAttackEffect) {
        const lawnLeft = CONFIG.GRID_OFFSET_X;
        const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
        gameState.spawnAttackEffect({
          kind: 'bonk_choy_flurry',
          x: this.x,
          y: this.y,
          row: this.row,
          minRow: Math.max(0, this.row - 1),
          maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
          startX: Math.max(lawnLeft, this.x - radiusPx),
          endX: Math.min(lawnRight, this.x + radiusPx),
          duration: 0.9
        });
      }
      gameState.zombies.forEach(z => {
        if (z.alive && !z.isHypnotized && !z.isObstacle) {
          if (Math.abs(z.row - this.row) <= 1 && Math.abs(z.x - this.x) <= radiusPx) {
            z.takeDamage(1500);
            gameState.spawnParticles(z.x, z.y - 10, '#cddc39', 12);
            gameState.spawnParticles(z.x, z.y - 10, '#ffeb3b', 8);
          }
        }
      });
      if (gameState.audio && gameState.audio.playMelee) {
        gameState.audio.playMelee();
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, '1500 DMG FLURRY! 🥊💥', '#cddc39', 18);
      }
      return true;
    }

    if (this.type === 'snapdragon') {
      // Rồng Lửa: Nhảy lên không trung và phun luồng lửa lớn 3x3 phía trước mặt (1200 DMG)
      this.state = 'shooting';
      this.flameTimer = 1.2;
      const maxRangeX = this.x + CONFIG.CELL_WIDTH * 3.2;
      if (gameState.spawnAttackEffect) {
        const lawnLeft = CONFIG.GRID_OFFSET_X;
        const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
        gameState.spawnAttackEffect({
          kind: 'snapdragon_flame',
          x: this.x,
          y: this.y,
          row: this.row,
          minRow: Math.max(0, this.row - 1),
          maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
          startX: Math.max(lawnLeft, this.x - 10),
          endX: Math.min(lawnRight, maxRangeX),
          isPlantFood: true,
          duration: 1.05
        });
      }
      gameState.zombies.forEach(z => {
        if (z.alive && !z.isHypnotized && !z.isObstacle) {
          if (Math.abs(z.row - this.row) <= 1 && z.x >= this.x - 10 && z.x <= maxRangeX) {
            z.takeDamage(1200);
            gameState.spawnParticles(z.x, z.y - 10, '#ff5722', 14);
            gameState.spawnParticles(z.x, z.y - 10, '#ff9800', 10);
          }
        }
      });
      if (gameState.audio && gameState.audio.playExplosion) {
        gameState.audio.playExplosion('fire');
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, '1200 FIRE BLAST! 🔥🐉', '#ff5722', 18);
      }
      return true;
    }

    if (this.type === 'lightning_reed') {
      // Sậy Sét: Triệu hồi đám mây sấm sét nhỏ tự đuổi theo zombie có máu cao nhất, giật sét liên tục 10s
      this.stormCloud = {
        x: this.x,
        y: this.y - 50,
        duration: 10.0,
        strikeTimer: 0,
        target: null
      };
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, 'STORM CLOUD! ⚡☁️', '#00e5ff', 18);
      }
      return true;
    }

    if (this.type === 'chomper') {
      // Hoa Ăn Thịt: Hút nuốt chửng tối đa 3 zombie phía trước trên hàng, sau đó ợ hơi đẩy lùi và làm choáng các zombie còn lại
      const rowZombies = gameState.zombies.filter(z => {
        return z.alive && !z.isHypnotized && z.row === this.row && z.x >= this.x - 20;
      });
      rowZombies.sort((a, b) => a.x - b.x);

      const swallowTargets = rowZombies.slice(0, 3);
      swallowTargets.forEach(target => {
        if (target.isBoss || target.type === 'zombot_dark_dragon') {
          target.takeDamage(1500);
        } else {
          target.takeDamage(99999);
        }
        gameState.spawnParticles(target.x, target.y - 10, '#7b1fa2', 15);
      });

      // Ợ hơi tạo luồng gió đẩy lùi tất cả zombie còn lại trên hàng và gây choáng 2s
      gameState.zombies.forEach(z => {
        if (z.alive && !z.isHypnotized && z.row === this.row && !swallowTargets.includes(z)) {
          z.applyKnockback(180);
          z.applyStun(2.0);
          gameState.spawnParticles(z.x, z.y, '#e1bee7', 6);
        }
      });

      if (gameState.spawnAttackEffect) {
        const lawnLeft = CONFIG.GRID_OFFSET_X;
        const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
        gameState.spawnAttackEffect({
          kind: 'chomper_burp',
          x: this.x,
          y: this.y,
          row: this.row,
          minRow: this.row,
          maxRow: this.row,
          startX: Math.max(lawnLeft, this.x - 20),
          endX: lawnRight,
          duration: 0.7
        });
      }

      this.isChewing = true;
      this.chewTimer = 10.0;
      this.state = 'chewing';

      if (gameState.audio && gameState.audio.playChomp) {
        gameState.audio.playChomp();
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, 'SWALLOW 3 & BURP! 💨', '#ab47bc', 18);
      }
      return true;
    }

    // ====================================================
    // 4. NHÓM PHÒNG THỦ & KHỐNG CHẾ
    // ====================================================
    if (this.type === 'wall_nut') {
      // Hạt Dẻ: Khoác lớp giáp kim loại hiệp sĩ (8000 HP, chặn đòn đập Gargantuar không vỡ ngay)
      this.hasArmor = true;
      this.armorHp = 8000;
      this.maxArmorHp = 8000;
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'KNIGHT ARMOR 8000 HP! 🛡️⚔️', '#b0bec5', 18);
      }
      return true;
    }

    if (this.type === 'infi_nut') {
      // Hạt Dẻ Hologram: Tạo bức tường lực 10.000 máu bao phủ cả 5 hàng ngang, tự phục hồi
      this.isRecharging = false;
      this.rechargeTimer = 0;
      gameState.spawnHolographicBarrier(this.col + 1);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, '10,000 HP BARRIER! 🛡️🌐', '#00e5ff', 18);
      }
      return true;
    }

    if (this.type === 'stunion') {
      // Hành Choáng: Thở đám mây khí gas khổng lồ làm choáng (stun) toàn bộ zombie trong phạm vi 3x4 phía trước suốt 12s
      this.activated = true;
      this.state = 'shooting';
      const reachX = this.x + CONFIG.CELL_WIDTH * 4.2;
      for (let r = Math.max(0, this.row - 1); r <= Math.min(CONFIG.ROWS - 1, this.row + 1); r++) {
        gameState.spawnGasCloud(this.x + 60, CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2);
      }
      gameState.zombies.forEach(z => {
        if (z.alive && !z.isHypnotized && !z.isObstacle) {
          if (Math.abs(z.row - this.row) <= 1 && z.x >= this.x - 20 && z.x <= reachX) {
            z.applyStun(12.0);
            gameState.spawnParticles(z.x, z.y - 10, '#cddc39', 8);
          }
        }
      });
      if (gameState.spawnAttackEffect) {
        const lawnLeft = CONFIG.GRID_OFFSET_X;
        const lawnRight = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
        gameState.spawnAttackEffect({
          kind: 'stunion_gas',
          x: this.x,
          y: this.y,
          row: this.row,
          minRow: Math.max(0, this.row - 1),
          maxRow: Math.min(CONFIG.ROWS - 1, this.row + 1),
          startX: Math.max(lawnLeft, this.x - 20),
          endX: Math.min(lawnRight, reachX),
          isPlantFood: true,
          duration: 1.1
        });
      }
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, '3x4 STUN 12 SECONDS! 🧅💨', '#ffd54f', 18);
      }
      setTimeout(() => { if (this.alive) this.alive = false; }, 400);
      return true;
    }

    // ====================================================
    // 5. NHÓM CÂY TỨC THỜI, NẤM & MÌN
    // ====================================================
    if (this.type === 'potato_mine') {
      // Mìn Khoai Tây: Lập tức trồi lên đã kích hoạt + phân bào ném 2 quả mìn đã kích hoạt vào ô trống ngẫu nhiên
      this.armed = true;
      this.armTimer = this.armDuration || 14.0;

      // Tìm các ô trống trên sân
      const emptyTiles = [];
      for (let r = 0; r < CONFIG.ROWS; r++) {
        for (let c = 1; c < CONFIG.COLS - 1; c++) {
          const hasPlant = gameState.plants.some(p => p.alive && p.row === r && p.col === c);
          if (!hasPlant) {
            emptyTiles.push({ row: r, col: c });
          }
        }
      }

      emptyTiles.sort(() => Math.random() - 0.5);
      const chosen = emptyTiles.slice(0, 2);
      chosen.forEach(tile => {
        const extraMine = new Plant('potato_mine', tile.row, tile.col);
        extraMine.armed = true;
        extraMine.armTimer = extraMine.armDuration || 14.0;
        gameState.plants.push(extraMine);
        gameState.spawnParticles(extraMine.x, extraMine.y, '#ffd54f', 15);
      });

      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 25, 'ARMED + 2 EXTRA MINES! 🥔🥔🥔', '#ffd54f', 18);
      }
      return true;
    }

    if (this.type === 'hypno_shroom') {
      // Nấm Thôi Miên: Nhận năng lượng thôi miên mạnh mẽ (isSuperHypno = true)
      // Zombie ăn phải sẽ đột biến thành Gargantuar chiến đấu cho người chơi
      this.isSuperHypno = true;
      gameState.spawnParticles(this.x, this.y, '#e040fb', 35);
      gameState.spawnParticles(this.x, this.y, '#ffd54f', 20);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, 'SUPER HYPNO! (MUTATE GARGANTUAR) 🌀🧟‍♂️', '#e040fb', 18);
      }
      return true;
    }

    if (this.type === 'magnet_shroom') {
      // Nấm Nam Châm: Hút toàn bộ kim loại của tất cả zombie trên sân và bắn trả lại làm đạn (300 DMG/mảnh)
      const metalZombies = gameState.zombies.filter(z => {
        return z.alive && !z.isHypnotized && !z.isObstacle && (z.armorHp > 0 || z.type === 'buckethead' || z.hasShield);
      });

      if (metalZombies.length > 0) {
        metalZombies.forEach(z => {
          z.armorHp = 0;
          z.hasShield = false;
          if (z.baseHp && z.hp > z.baseHp) {
            z.hp = z.baseHp;
          }
          gameState.spawnParticles(z.x, z.y - 15, '#b0bec5', 12);

          // Bắn trả mảnh kim loại vào zombie
          const shrapnel = new Projectile('pea', z.row, this.x + 20, this.y - 10, 300, 8.5);
          gameState.projectiles.push(shrapnel);
        });
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(this.x, this.y - 28, `STRIPPED & FIRED ${metalZombies.length} METALS! 🧲⚡`, '#00e5ff', 18);
        }
      } else {
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(this.x, this.y - 28, 'KHÔNG CÓ KIM LOẠI 🧲', '#b0bec5', 16);
        }
      }
      return true;
    }

    if (this.type === 'galio') {
      const proto = PLANT_CONFIG.galio || {};
      this.hp = this.maxHp;
      this.skill1Timer = 0;
      this.skill1AnimTimer = 0.45;
      this.punchDir = 1;
      const superWave = new Projectile(
        'galio_wave',
        this.row,
        this.x + 22,
        this.y - 4,
        (proto.skill1Damage || 500) * 2.4,
        10.5
      );
      superWave.isEnergyWave = true;
      superWave.isGiant = true;
      superWave.hitZombies = new Set();
      gameState.projectiles.push(superWave);
      gameState.spawnParticles(this.x + 20, this.y, '#00e5ff', 18);
      gameState.spawnParticles(this.x, this.y, '#ffd54f', 12);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 28, 'SÓNG VỆ THẦN! ⚡🛡️', '#00e5ff', 18);
      }
      return true;
    }

    if (this.type === 'jhinplant') {
      this.hp = this.maxHp;
      this.isReloading = false;
      this.reloadTimer = 0;
      this.ammo = this.magSize || 4;
      this.shootTimer = 0;
      this.curtainBarrage = {
        shotsLeft: 4,
        timer: 0,
        interval: 0.16
      };
      gameState.spawnParticles(this.x + 10, this.y - 10, '#ff1744', 18);
      gameState.spawnParticles(this.x + 10, this.y - 10, '#e040fb', 14);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 30, 'MÀN HẠ MÀN IV! 🎭🌹', '#ff1744', 18);
      }
      return true;
    }

    return true;
  }

  takeDamage(amount, isPermanentKill = false) {
    if (this.isRecharging) return; // Máy chiếu đang sạc không nhận sát thương

    // Giáp sắt hiệp sĩ của Wall-Nut (8000 HP, chặn đòn đập Gargantuar không vỡ ngay)
    if (this.hasArmor && this.armorHp > 0) {
      this.flashTimer = 0.12;
      const effectiveDmg = amount >= 5000 ? 2000 : amount;
      this.armorHp -= effectiveDmg;
      if (this.armorHp <= 0) {
        this.armorHp = 0;
        this.hasArmor = false;
      }
      return;
    }

    this.hp -= amount;
    this.flashTimer = 0.12;
    if (this.type === 'infi_nut') {
      this.timeSinceLastHit = 0;
      if (this.hp <= 0) {
        if (isPermanentKill) {
          // Chỉ có Gargantuar đập nát hoàn toàn máy chiếu!
          this.hp = 0;
          this.alive = false;
        } else {
          // Zombie thường tiêu diệt sẽ để lại máy chiếu, sau 15s hồi sinh đầy máu
          this.hp = 0;
          this.isRecharging = true;
          this.rechargeTimer = this.rechargeDuration || 15.0;
          this.state = 'recharging';
        }
        return;
      }
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  // Skill 2 của Galio khi chết:
  // Dừng thời gian 1s, hút tối đa 5 zombie gần vào nhà nhất vô ô Galio và gây 1500 sát thương
  triggerGalioDeathSkill(gameState) {
    if (this.deathSkillTriggered || !gameState) return;
    this.deathSkillTriggered = true;

    const proto = PLANT_CONFIG.galio || {};
    const freezeDuration = proto.deathFreezeDuration || 1.0;
    const pullCount = proto.deathPullCount || 5;
    const skillDmg = proto.deathSkillDamage || 1500;

    // 1. Dừng thời gian 1s
    gameState.timeStopTimer = Math.max(gameState.timeStopTimer || 0, freezeDuration);

    // 2. Chọn tối đa 5 zombie địch gần vào nhà nhất (x nhỏ nhất trước)
    const candidates = (gameState.zombies || []).filter(z => {
      return z.alive && !z.isHypnotized && !z.isObstacle && z.type !== 'zombot_dark_dragon';
    });
    candidates.sort((a, b) => a.x - b.x);
    const pulled = candidates.slice(0, pullCount);

    const pulledPaths = [];
    pulled.forEach((z, idx) => {
      const oldX = z.x;
      const oldY = z.y;
      const spreadX = (idx - (pulled.length - 1) / 2) * 8;

      if (z.iceBlock) {
        z.iceBlock.pusher = null;
        z.iceBlock = null;
      }

      z.isEating = false;
      z.isSmashing = false;
      z.eatingPlant = null;
      z.row = this.row;
      z.x = this.x + spreadX;
      z.y = this.y;

      pulledPaths.push({ fromX: oldX, fromY: oldY, toX: z.x, toY: z.y });

      gameState.spawnParticles(oldX, oldY - 10, '#00e5ff', 5);
      z.takeDamage(skillDmg);
      gameState.spawnParticles(z.x, z.y - 10, '#ffd54f', 6);
    });

    if (gameState.spawnAttackEffect) {
      gameState.spawnAttackEffect({
        kind: 'galio_vortex',
        x: this.x,
        y: this.y,
        row: this.row,
        minRow: this.row,
        maxRow: this.row,
        startX: this.x - CONFIG.CELL_WIDTH * 0.5,
        endX: this.x + CONFIG.CELL_WIDTH * 0.5,
        pulledPaths,
        duration: freezeDuration
      });
    }

    if (gameState.spawnFloatingText) {
      gameState.spawnFloatingText(
        this.x,
        this.y - 26,
        `DỪNG THỜI GIAN 1s · HÚT ${pulled.length} ZOM (-1500) ⏳🌀`,
        '#00e5ff',
        17
      );
    }
    if (gameState.audio && gameState.audio.playExplosion) {
      gameState.audio.playExplosion('normal');
    }
  }
}

/**
 * LỚP ZOMBIE
 * Tính toán tốc độ, cắn, đập, nhảy sào, mất máu đọc 100% từ ZOMBIE_CONFIG
 */
class Zombie {
  constructor(type, row) {
    let proto = ZOMBIE_CONFIG[type];
    // Xác thực tính hợp lệ của loại zombie: phải là object và có id, hp
    if (!proto || typeof proto !== 'object' || !proto.id || !proto.hp) {
      console.warn(`[Zombie] Loại zombie không hợp lệ: '${type}', chuyển về 'basic'`);
      proto = ZOMBIE_CONFIG.basic;
      type = 'basic';
    }

    this.id = generateId();
    this.type = type;
    this.name = proto.name;
    this.row = row;

    this.x = CONFIG.CANVAS_WIDTH + 20;
    this.y = CONFIG.GRID_OFFSET_Y + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;

    this.maxHp = proto.hp;
    this.hp = proto.hp;
    this.armorHp = proto.armorHp || 0;
    this.baseHp = proto.baseHp || proto.hp;
    this.isBoss = proto.isBoss || false;
    this.isObstacle = proto.isObstacle || false;

    // Tốc độ di chuyển tính từ speedPerCell (giây / ô)
    // Tốc độ px/giây = CELL_WIDTH / speedPerCell
    this.speedPerCell = proto.speedPerCell || 5.0;
    this.speed = (CONFIG.CELL_WIDTH / this.speedPerCell) / 60; // pixel/frame 60fps

    // Sát thương cắn: 100 DPS (50 DMG mỗi 0.5s từ ZOMBIE_COMBAT_DEFAULTS)
    const defaultDamage = (typeof ZOMBIE_COMBAT_DEFAULTS !== 'undefined' ? ZOMBIE_COMBAT_DEFAULTS.biteDamage : 50);
    const defaultInterval = (typeof ZOMBIE_COMBAT_DEFAULTS !== 'undefined' ? ZOMBIE_COMBAT_DEFAULTS.biteInterval : 0.5);
    this.damage = proto.damage !== undefined ? proto.damage : defaultDamage;
    this.attackInterval = proto.atkSpeed || proto.attackInterval || defaultInterval;
    this.attackTimer = 0;

    // Pole Vaulting Zombie
    this.hasVaulted = false;
    this.isVaulting = false;
    this.vaultTimer = 0;
    this.vaultStartX = 0;
    this.vaultTargetX = 0;

    // Gargantuar (Khổng Lồ)
    this.isSmashing = false;
    this.hasStruckThisCycle = false;
    this.hasThrownImp = false;
    this.isThrowingImp = false;
    this.throwImpTimer = 0;
    this.smashWindup = proto.smashWindup || 1.1;

    // Turquoise Skull Zombie (Laser Beam)
    this.isChargingLaser = false;
    this.laserTimer = 0;
    this.laserChargeDuration = proto.laserChargeDuration || 5.0;
    this.laserDamage = proto.laserDamage || 4000;
    this.laserRangeCells = proto.laserRangeCells || 4;

    // Kháng hiệu ứng & đẩy lùi
    this.knockbackImmune = proto.knockbackImmune || (this.isBoss || this.isObstacle);
    this.stunTimer = 0;
    this.slowTimer = 0;
    this.slowFactor = 1.0;
    this.poisonStacks = 0;
    this.poisonDuration = 0;
    this.poisonTickTimer = 0;
    this.poisonDmgPerSec = 3.0;

    // Trạng thái cắn cây & vòng đời
    this.isEating = false;
    this.eatingPlant = null;
    this.alive = true;
    this.deathTimer = 0;
    this.flashTimer = 0;
    this.animTime = Math.random() * Math.PI * 2;
    this.walkCycle = 0; // Khởi tạo chu kỳ bước đi, chống lỗi undefined -> NaN
    // Trạng thái thôi miên (Hypnotized)
    this.isHypnotized = false;

    // Vật cản Tombstone: đứng yên trên sân
    if (this.isObstacle) {
      this.speed = 0;
      this.speedPerCell = 999999;
    }

    // Zombot Dark Dragon (Trùm Rồng 27.000 HP - Map 6)
    if (this.type === 'zombot_dark_dragon') {
      this.isDarkDragon = true;
      this.x = CONFIG.GRID_OFFSET_X + 7.5 * CONFIG.CELL_WIDTH; // Nằm ở 2 ô đầu bên phải map (cột 7-8)
      this.bossRow = 1; // Chiếm 2 hàng: hàng bossRow và bossRow + 1
      this.row = 1;
      this.targetRow = 1;
      this.moveRowTimer = 3.5;
      this.bobbingAnim = 0;

      // Cooldown kỹ năng (Khởi đầu giãn cách cho người chơi kịp xếp cây trên băng chuyền)
      this.roarTimer = 16.0;        // Gầm triệu hồi lính (ban đầu 16s cho dễ thở)
      this.fireballTimer = 10.0;    // Bắn cầu lửa ấp nở Imp Dragon
      this.breathTimer = 22.0;     // Khạc lửa càn quét 2 hàng

      // Trạng thái vận chiêu
      this.isRoaring = false;
      this.roarDuration = 0;
      this.isPreparingFireball = false;
      this.fireballPrepTimer = 0;
      this.isBreathingFire = false;
      this.isWindupBreath = false;
      this.breathWindupTimer = 0;
      this.breathDuration = 0;
      this.breathRows = [1, 2];
    }

    // Miễn nhiễm đóng băng & làm chậm (Freeze & Slow Immune) cho Troglobite và Yeti Imp
    this.freezeImmune = proto.freezeImmune || false;
    this.slowImmune = proto.slowImmune || false;

    // Troglobite đẩy khối băng
    this.hasSpawnedBlock = false;
    this.iceBlock = null;
    this.hasReleasedImp = false;

    // Lãng Khách Zombie (Yasuo Zombie)
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.28;
    this.dashStartX = 0;
    this.dashTargetX = 0;
    this.dashRecoveryTimer = 0;
    this.dashBlockedPlant = null;
    this.dashCount = 0;
    this.hasTriggeredInvuln = false;
    this.invulnerableTimer = 0;
    this.slashAnimTimer = 0;
  }

  hypnotize(gameState) {
    if (this.isObstacle || !this.alive || this.isHypnotized) return;
    this.isHypnotized = true;
    this.isEating = false;
    this.isSmashing = false;
    this.eatingPlant = null;
    this.attackTimer = 0;
    this.hasVaulted = true; // Bỏ sào nhảy nếu có

    if (gameState) {
      gameState.spawnParticles(this.x, this.y, '#e040fb', 20);
      gameState.spawnParticles(this.x, this.y, '#ffd54f', 10);
      if (gameState.spawnFloatingText) {
        gameState.spawnFloatingText(this.x, this.y - 35, 'THÔI MIÊN! 🌀', '#e040fb', 18);
      }
    }
  }

  applyKnockback(distance) {
    if (this.knockbackImmune || !this.alive) return;
    if (this.isObstacle) return;
    this.x = Math.min(CONFIG.CANVAS_WIDTH + 50, this.x + distance);
  }

  applyStun(duration, isFreeze = false) {
    if (this.isObstacle || !this.alive) return;
    if (this.freezeImmune && isFreeze) return; // Miễn nhiễm với việc đóng băng!
    this.stunTimer = Math.max(this.stunTimer, duration);
    this.isEating = false;
    this.isSmashing = false;
    this.eatingPlant = null;
  }

  applySlow(factor, duration) {
    if (this.isObstacle || !this.alive) return;
    if (this.slowImmune || this.freezeImmune) return; // Miễn nhiễm hoàn toàn làm chậm và đóng băng!
    this.slowTimer = Math.max(this.slowTimer, duration);
    this.slowFactor = factor;
  }

  applyPoison(stacks, duration, dmgPerSec = 15.0, maxStacks = 3) {
    if (this.isObstacle || !this.alive) return;
    this.poisonStacks = Math.min(maxStacks, this.poisonStacks + stacks);
    this.poisonDuration = Math.max(this.poisonDuration, duration);
    this.poisonDmgPerSec = dmgPerSec;
  }

  update(dt, gameState) {
    this.gameState = gameState;
    this.animTime += dt;

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    if (this.slashAnimTimer > 0) {
      this.slashAnimTimer = Math.max(0, this.slashAnimTimer - dt);
    }
    if (this.dashRecoveryTimer > 0) {
      this.dashRecoveryTimer = Math.max(0, this.dashRecoveryTimer - dt);
    }

    // Xử lý Khối Băng (Ice Block) do Troglobite đẩy
    if (this.type === 'ice_block') {
      if (this.hp <= 0 && !this.hasReleasedImp) {
        this.hasReleasedImp = true;
        this.alive = false;
        gameState.spawnParticles(this.x, this.y, '#80deea', 25);
        gameState.spawnParticles(this.x, this.y, '#ffffff', 20);
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(this.x, this.y - 25, 'YETI IMP THOÁT RA! ❄️👹', '#00e5ff', 16);
        }
        if (gameState.audio && gameState.audio.playHit) {
          gameState.audio.playHit();
        }
        const imp = new Zombie('yeti_imp', this.row);
        imp.x = this.x;
        gameState.zombies.push(imp);
        return;
      }
      if (!this.alive) {
        this.deathTimer += dt;
        return;
      }

      // Nghiền nát tất cả các cây phía trước khi bị đẩy tới!
      const crushedPlant = gameState.plants.find(p => {
        return p.alive && !p.isRecharging && p.row === this.row &&
               p.x >= this.x - CONFIG.CELL_WIDTH * 0.45 && p.x <= this.x + CONFIG.CELL_WIDTH * 0.65;
      });

      if (crushedPlant) {
        if (crushedPlant.hasArmor && crushedPlant.armorHp > 0) {
          crushedPlant.takeDamage(2000, true);
        } else {
          crushedPlant.takeDamage(99999, true);
        }
        gameState.spawnParticles(crushedPlant.x, crushedPlant.y, '#80deea', 12);
        gameState.spawnParticles(crushedPlant.x, crushedPlant.y, '#81c784', 8);
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(crushedPlant.x, crushedPlant.y - 25, 'CRUSHED! 🧊💥', '#80deea', 16);
        }
        if (gameState.audio && gameState.audio.playExplosion) {
          gameState.audio.playExplosion('normal');
        }
      }
      return;
    }

    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }

    // Troglobite đẩy khối băng
    if (this.type === 'troglobite') {
      if (!this.hasSpawnedBlock && gameState) {
        this.hasSpawnedBlock = true;
        const block = new Zombie('ice_block', this.row);
        block.x = this.x - 48;
        block.pusher = this;
        this.iceBlock = block;
        gameState.zombies.push(block);
      }

      // Đẩy khối băng di chuyển cùng nhịp ở phía trước
      if (this.iceBlock && this.iceBlock.alive) {
        this.iceBlock.x = this.x - 48;
        this.iceBlock.y = this.y;
      }
    }

    // Vật cản Tombstone đứng yên
    if (this.isObstacle) return;

    // ====================================================
    // XỬ LÝ BOSS ZOMBOT DARK DRAGON (Map 6)
    // ====================================================
    if (this.type === 'zombot_dark_dragon') {
      this.bobbingAnim += dt * 2.0;

      // Di chuyển lướt lên xuống nhịp nhàng ở 2 ô đầu mép phải map (cột 7-8)
      this.moveRowTimer -= dt;
      if (this.moveRowTimer <= 0) {
        this.moveRowTimer = 4.0 + Math.random() * 2.5;
        // Chọn hàng mục tiêu (0, 1, 2, 3 - mỗi vị trí chiếm 2 hàng liên tiếp)
        const possibleRows = [0, 1, 2, 3].filter(r => r !== this.targetRow);
        this.targetRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];
      }

      // Nội suy vị trí y mượt mà theo targetRow (vị trí giữa 2 hàng)
      const targetCenterY = CONFIG.GRID_OFFSET_Y + (this.targetRow + 0.5) * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
      this.y += (targetCenterY - this.y) * Math.min(1.0, dt * 2.5);
      this.bossRow = Math.max(0, Math.min(3, Math.round((this.y - CONFIG.GRID_OFFSET_Y - CONFIG.CELL_HEIGHT) / CONFIG.CELL_HEIGHT)));
      this.row = this.bossRow; // Gán hàng cơ sở để đạn bắn thẳng kiểm tra va chạm

      // 1. Kỹ năng 1: GẦM TRIỆU HỒI ZOMBIE DARK AGES (Roaring)
      if (this.isRoaring) {
        this.roarDuration -= dt;
        if (this.roarDuration <= 0) {
          this.isRoaring = false;
        }
      } else {
        this.roarTimer -= dt;
        if (this.roarTimer <= 0) {
          const hpRatio = this.hp / this.maxHp;
          let spawnCount = 2;
          let pool = ['basic', 'imp_dragon'];

          if (hpRatio > 0.65) {
            // Giai đoạn đầu (Máu > 65%): Thả ít (2 con), loại cơ bản để người chơi chuẩn bị
            this.roarTimer = 17.0 + Math.random() * 3.0;
            spawnCount = 2;
            pool = ['basic', 'imp_dragon', 'imp'];
          } else if (hpRatio >= 0.30) {
            // Giai đoạn giữa (Máu 30% - 65%): Thả vừa phải (3 con), tăng thêm Conehead, Pole Vaulting, Turquoise Skull, Lãng Khách
            this.roarTimer = 14.0 + Math.random() * 3.0;
            spawnCount = 3;
            pool = ['basic', 'conehead', 'pole_vaulting', 'imp_dragon', 'turquoise_skull', 'lang_khach'];
          } else {
            // Giai đoạn nguy cấp (Máu < 30% - Cuồng bạo): Thả nhiều (4-5 con), xuất hiện Buckethead, Lãng Khách, Bully, Troglobite & Gargantuar
            this.roarTimer = 11.0 + Math.random() * 2.0;
            spawnCount = 4 + Math.floor(Math.random() * 2);
            pool = ['conehead', 'buckethead', 'lang_khach', 'imp_dragon', 'turquoise_skull', 'jurassic_bully', 'troglobite', 'gargantuar'];
          }

          this.isRoaring = true;
          this.roarDuration = 2.0;
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x - 30, this.y - 60, 'GẦM RỐNG! 🐲', '#ff1744', 22);
          }
          if (gameState.audio) {
            gameState.audio.playRoar && gameState.audio.playRoar();
          }

          for (let i = 0; i < spawnCount; i++) {
            const zType = pool[Math.floor(Math.random() * pool.length)];
            const r = Math.floor(Math.random() * CONFIG.ROWS);
            // KHÔNG THẢ GẦN NHÀ: Luôn cách nhà ít nhất 4 ô (cột 4, 5, 6)
            const col = 4 + Math.floor(Math.random() * 3);
            const spawnX = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
            setTimeout(() => {
              if (!gameState || !this.alive || gameState.isPaused || gameState.isGameOver || gameState.isVictory) return;
              const summonedZ = new Zombie(zType, r);
              summonedZ.x = spawnX;
              gameState.zombies.push(summonedZ);
              gameState.spawnParticles(spawnX, summonedZ.y, '#795548', 15);
              gameState.spawnParticles(spawnX, summonedZ.y, '#ffd54f', 8);
            }, i * 350);
          }
        }
      }

      // 2. Kỹ năng 2: BẮN CẦU LỬA ẤP NỞ IMP DRAGON & THIÊU RỤI Ô 10S (Lobbed Fireballs)
      if (this.isPreparingFireball) {
        this.fireballPrepTimer -= dt;
        if (this.fireballPrepTimer <= 0) {
          this.isPreparingFireball = false;
        }
      } else {
        this.fireballTimer -= dt;
        if (this.fireballTimer <= 0) {
          this.fireballTimer = 9.0 + Math.random() * 3.0;
          this.isPreparingFireball = true;
          this.fireballPrepTimer = 1.0;

          // Tìm mục tiêu: KHÔNG BẮN VÀO 4 Ô GẦN NHÀ (cột 0, 1, 2, 3)
          // Ưu tiên Nấm Nam Châm ở cột >= 4, hoặc cây khác ở cột >= 4
          let targetPlant = gameState.plants.find(p => p.alive && p.col >= 4 && p.type === 'magnet_shroom');
          let targetRow, targetCol;
          if (targetPlant) {
            targetRow = targetPlant.row;
            targetCol = targetPlant.col;
          } else {
            // Chọn ngẫu nhiên trong các cây an toàn (cột >= 4)
            const safeLivingPlants = gameState.plants.filter(p => p.alive && !p.isRecharging && p.col >= 4);
            if (safeLivingPlants.length > 0 && Math.random() < 0.7) {
              const p = safeLivingPlants[Math.floor(Math.random() * safeLivingPlants.length)];
              targetRow = p.row;
              targetCol = p.col;
            } else {
              targetRow = Math.floor(Math.random() * CONFIG.ROWS);
              targetCol = 4 + Math.floor(Math.random() * 3); // Cột 4, 5, 6
            }
          }

          const targetX = CONFIG.GRID_OFFSET_X + targetCol * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
          const targetY = CONFIG.GRID_OFFSET_Y + targetRow * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;

          // Nhổ cầu lửa bay dạng parabol xuống ô mục tiêu (đảm bảo cách nhà ít nhất 4 ô)
          if (gameState.spawnFireball) {
            gameState.spawnFireball(this.x - 30, this.y - 20, targetX, targetY, targetRow, targetCol);
          }
        }
      }

      // 3. Kỹ năng 3: KHẠC LỬA CÀN QUÉT 2 HÀNG NGANG (Fire Breath)
      // Có thể bị ngắt bằng cách kích hoạt Plant Food lên cây
      if (this.isWindupBreath) {
        this.breathWindupTimer -= dt;
        if (this.breathWindupTimer <= 0) {
          this.isWindupBreath = false;
          this.isBreathingFire = true;
          this.breathDuration = 2.2;

          // Phun lửa càn quét 2 hàng ngang [breathRows[0], breathRows[1]]
          this.executeFireBreath(gameState);
        }
      } else if (this.isBreathingFire) {
        this.breathDuration -= dt;
        if (this.breathDuration <= 0) {
          this.isBreathingFire = false;
        }
      } else {
        this.breathTimer -= dt;
        if (this.breathTimer <= 0) {
          this.breathTimer = 22.0 + Math.random() * 5.0;
          this.isWindupBreath = true;
          this.breathWindupTimer = 1.8; // Báo hiệu tích tụ lửa trong 1.8s
          this.breathRows = [this.bossRow, this.bossRow + 1];

          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(this.x - 30, this.y - 40, 'HƠI THỞ LỬA SẮP ĐẾN! 🔥', '#ff3d00', 18);
          }
        }
      }

      return; // Rồng không di chuyển về phía sân nhà hay cắn cây thông thường
    }

    // Xử lý ném Imp của Gargantuar khi HP < 50% HP tối đa (< 1500 / 1800)
    if (this.type === 'gargantuar' && !this.hasThrownImp && this.hp < this.maxHp * 0.5 && this.alive) {
      this.hasThrownImp = true;
      this.isThrowingImp = true;
      this.throwImpTimer = 0.5;
    }

    if (this.isThrowingImp) {
      this.throwImpTimer -= dt;
      if (this.throwImpTimer <= 0) {
        this.isThrowingImp = false;
        const rawTargetX = this.x - 3 * CONFIG.CELL_WIDTH;
        const minLawnX = CONFIG.GRID_OFFSET_X + CONFIG.CELL_WIDTH / 2;
        const maxLawnX = CONFIG.GRID_OFFSET_X + (CONFIG.COLS - 0.5) * CONFIG.CELL_WIDTH;
        const clampedTargetX = Math.max(minLawnX, Math.min(rawTargetX, maxLawnX));

        const startX = this.x - 20;
        const startY = this.y - 30;
        const targetY = CONFIG.GRID_OFFSET_Y + this.row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;

        gameState.spawnFlyingImp(this.row, startX, startY, clampedTargetX, targetY);
      }
    }

    // Xử lý sát thương độc (Đánh thẳng vào máu, xuyên giáp)
    if (this.poisonDuration > 0 && this.poisonStacks > 0) {
      this.poisonDuration -= dt;
      this.poisonTickTimer += dt;
      if (this.poisonTickTimer >= 0.5) {
        const tickDamage = (this.poisonDmgPerSec * this.poisonStacks) * this.poisonTickTimer;
        this.takeDamage(tickDamage, true); // Độc đánh thẳng vào máu xuyên giáp!
        this.poisonTickTimer = 0;
        gameState.spawnParticles(this.x, this.y - 12, '#ab47bc', 2);
      }
      if (this.poisonDuration <= 0) {
        this.poisonStacks = 0;
      }
    }

    // Choáng: đứng yên
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.isEating = false;
      this.isSmashing = false;
      this.eatingPlant = null;
      return;
    }

    // Hiệu ứng làm chậm (Slow Pea)
    let currentSpeedFactor = 1.0;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      currentSpeedFactor = this.slowFactor;
    }

    // ----------------------------------------------------
    // ZOMBIE BỊ THÔI MIÊN: QUAY LẠI VÀ CHIẾN ĐẤU CHO BẠN (Hypnotized Zombie)
    // Tấn công cả Zombie địch lẫn Bia Mộ (Tombstone) cản đường
    // ----------------------------------------------------
    if (this.isHypnotized) {
      // Tìm Zombie quân địch hoặc Mộ phía trước trên cùng hàng (hướng di chuyển sang phải)
      const enemyTargetAhead = gameState.zombies.find(z => {
        return z.alive && !z.isHypnotized && z.row === this.row &&
               z.x >= this.x - 15 && z.x <= this.x + 40;
      });

      if (enemyTargetAhead) {
        this.isEating = true;
        this.attackTimer += dt;
        if (this.attackTimer >= this.attackInterval) {
          this.attackTimer = 0;
          enemyTargetAhead.takeDamage(this.damage || 50);
          gameState.spawnParticles(enemyTargetAhead.x, enemyTargetAhead.y, '#e040fb', 5);
          // Nếu đối phương là zombie địch (không phải bia mộ bất động), zombie địch cắn trả
          if (!enemyTargetAhead.isObstacle) {
            this.takeDamage(enemyTargetAhead.damage || 50);
          }
        }
      } else {
        this.isEating = false;
        this.attackTimer = 0;
        // Đi lùi về phía bên phải
        const currentSpeedPxPerSec = (CONFIG.CELL_WIDTH / (this.speedPerCell || 6.0)) * currentSpeedFactor;
        this.x += currentSpeedPxPerSec * dt;
        this.walkCycle = (Number.isFinite(this.walkCycle) ? this.walkCycle : 0) + dt * 4.5 * currentSpeedFactor;

        // Rời trận khi ra khỏi mép phải
        if (this.x > CONFIG.CANVAS_WIDTH + 60) {
          this.alive = false;
        }
      }
      return;
    }

    // ----------------------------------------------------
    // XỬ LÝ NHẢY SÀO (Pole Vaulting Zombie)
    // ----------------------------------------------------
    if (this.type === 'pole_vaulting' && this.isVaulting) {
      this.vaultTimer += dt;
      const t = Math.min(1.0, this.vaultTimer / 0.85);
      // Quỹ đạo nhảy hình parabol qua đầu cây
      this.x = this.vaultStartX + (this.vaultTargetX - this.vaultStartX) * t;

      if (t >= 1.0) {
        this.isVaulting = false;
        this.hasVaulted = true;
        // Sau khi nhảy mất sào: tốc độ giảm xuống 4.5s/ô (17.78 px/s)
        this.speedPerCell = ZOMBIE_CONFIG.pole_vaulting.slowSpeedPerCell || 4.5;
        this.speed = (CONFIG.CELL_WIDTH / this.speedPerCell) / 60;
      }
      return;
    }

    // ----------------------------------------------------
    // XỬ LÝ LÃNG KHÁCH ZOMBIE (Skill 1: Lướt & Skill 3: Lốc Xoáy)
    // ----------------------------------------------------
    if (this.type === 'lang_khach') {
      const proto = ZOMBIE_CONFIG.lang_khach || {};
      // Mở khóa lướt nếu cây chắn trước mặt đã bị tiêu diệt
      if (this.dashBlockedPlant && (!this.dashBlockedPlant.alive || this.dashBlockedPlant.isRecharging)) {
        this.dashBlockedPlant = null;
      }

      if (this.isDashing) {
        this.dashTimer += dt;
        const t = Math.min(1.0, this.dashTimer / (this.dashDuration || 0.28));
        const easeT = 1 - Math.pow(1 - t, 2);
        this.x = this.dashStartX + (this.dashTargetX - this.dashStartX) * easeT;

        if (t >= 1.0) {
          this.isDashing = false;
          this.dashRecoveryTimer = 0.25;

          const landedCol = Math.floor((this.x - CONFIG.GRID_OFFSET_X) / CONFIG.CELL_WIDTH);
          const blockingPlant = gameState.plants.find(p =>
            p.alive && !p.isRecharging && p.row === this.row &&
            (p.col === landedCol || (p.x <= this.x + 25 && (this.x - p.x) <= CONFIG.CELL_WIDTH * 0.85))
          );
          if (blockingPlant) {
            this.dashBlockedPlant = blockingPlant;
          }

          if (this.dashCount >= (proto.tornadoThreshold || 3)) {
            this.dashCount = 0;
            this.triggerLangKhachTornado(gameState);
            if (this.dashBlockedPlant && (!this.dashBlockedPlant.alive || this.dashBlockedPlant.isRecharging)) {
              this.dashBlockedPlant = null;
            }
          }
        }
        return;
      }

      // Skill 1: Khi cách cây đầu tiên phía trước <= 3 ô và không bị cây chắn buộc phải giết trước -> Lướt xuyên qua!
      if (!this.dashBlockedPlant && this.dashRecoveryTimer <= 0) {
        const dashRangePx = CONFIG.CELL_WIDTH * (proto.dashRangeCells || 3.0) + 8;
        let firstPlantAhead = null;
        let maxPlantX = -Infinity;
        for (const p of gameState.plants) {
          if (!p.alive || p.isRecharging || p.row !== this.row) continue;
          if (p.x <= this.x + CONFIG.CELL_WIDTH * 0.35 && (this.x - p.x) <= dashRangePx) {
            if (p.x > maxPlantX) {
              maxPlantX = p.x;
              firstPlantAhead = p;
            }
          }
        }

        if (firstPlantAhead) {
          const dashDmg = proto.dashDamage || 100;
          firstPlantAhead.takeDamage(dashDmg, false);
          gameState.spawnParticles(firstPlantAhead.x, firstPlantAhead.y - 8, '#80deea', 8);

          const landingCol = firstPlantAhead.col - 1;
          const plantAtLanding = gameState.plants.find(p =>
            p.alive && !p.isRecharging && p.row === this.row && p.col === landingCol
          );
          const minSafeX = CONFIG.GRID_OFFSET_X + 14;
          const rawLandingX = plantAtLanding
            ? (plantAtLanding.x + 18)
            : (firstPlantAhead.x - CONFIG.CELL_WIDTH);
          const clampedTargetX = Math.max(minSafeX, rawLandingX);

          this.isDashing = true;
          this.dashTimer = 0;
          this.dashStartX = this.x;
          this.dashTargetX = clampedTargetX;
          this.dashCount += 1;
          this.slashAnimTimer = 0.34;
          this.isEating = false;
          this.eatingPlant = null;

          if (gameState.spawnAttackEffect) {
            gameState.spawnAttackEffect({
              kind: 'lang_khach_dash',
              x: this.x,
              y: this.y,
              row: this.row,
              minRow: this.row,
              maxRow: this.row,
              startX: clampedTargetX,
              endX: this.x,
              duration: 0.32
            });
          }
          gameState.spawnParticles(this.x, this.y + 12, '#ef5350', 6);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(firstPlantAhead.x, firstPlantAhead.y - 26, `LƯỚT! 💨 (-${dashDmg})`, '#80deea', 16);
          }
          return;
        }
      }
    }

    // ----------------------------------------------------
    // XỬ LÝ BẮN LASER (Turquoise Skull Zombie)
    // ----------------------------------------------------
    if (this.type === 'turquoise_skull') {
      const targetPlantInLaserRange = gameState.plants.find(p => {
        return p.alive && p.row === this.row && p.x < this.x && (this.x - p.x) <= CONFIG.CELL_WIDTH * 4;
      });

      if (targetPlantInLaserRange) {
        this.isChargingLaser = true;
        this.laserTimer += dt;
        if (this.laserTimer >= this.laserChargeDuration) {
          this.laserTimer = 0;
          this.isChargingLaser = false;
          // Bắn tia Laser xuyên thấu tiêu diệt cây với 4000 sát thương
          if (targetPlantInLaserRange.alive) {
            targetPlantInLaserRange.takeDamage(this.laserDamage);
          }
          if (gameState.spawnLaserBeam) {
            gameState.spawnLaserBeam(this.x, this.y, targetPlantInLaserRange.x, targetPlantInLaserRange.y, this.row);
          }
        }
        return; // Dừng di chuyển trong khi đang tập trung năng lượng bắn Laser
      } else {
        this.isChargingLaser = false;
        this.laserTimer = 0;
      }
    }

    // Kiểm tra va chạm với Cây, Hàng rào toàn ảnh hoặc Zombie đồng minh thôi miên
    // Khi cây đặt ra sau khi zombie đã bước vào ô, zombie lập tức tương tác/tấn công và nhận tác dụng của cây
    const plantInFront = gameState.plants.find(p => {
      return p.alive && !p.isRecharging && p.row === this.row && this.x >= p.x - CONFIG.CELL_WIDTH * 0.45 && this.x <= p.x + CONFIG.CELL_WIDTH * 0.85;
    });

    const barrierInFront = gameState.barriers.find(b => {
      return b.alive && Math.abs(this.x - b.x) < 30;
    });

    const hypnotizedAllyInFront = gameState.zombies.find(z => {
      return z.alive && z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) <= 30;
    });

    const targetToAttack = plantInFront || barrierInFront || hypnotizedAllyInFront;

    // Pole Vaulting gặp cây đầu tiên: Nhảy qua cây thay vì cắn (trừ Hạt Dẻ Cao Tall-nut sẽ chặn đứng cú nhảy!)
    if (this.type === 'pole_vaulting' && !this.hasVaulted && !this.isVaulting && plantInFront) {
      if (plantInFront.type === 'tall_nut') {
        this.hasVaulted = true; // Mất sào, rơi xuống trước mặt Tall-nut
        this.speedPerCell = ZOMBIE_CONFIG.pole_vaulting.slowSpeedPerCell || 4.5;
        this.speed = (CONFIG.CELL_WIDTH / this.speedPerCell) / 60;
        gameState.spawnParticles(this.x, this.y, '#d7ccc8', 12);
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(plantInFront.x, plantInFront.y - 25, 'CHẶN ĐỨNG! 🛡️', '#ffd54f', 16);
        }
      } else {
        this.isVaulting = true;
        this.vaultTimer = 0;
        this.vaultStartX = this.x;
        this.vaultTargetX = Math.max(CONFIG.GRID_OFFSET_X, plantInFront.x - CONFIG.CELL_WIDTH * 0.9);
        gameState.spawnParticles(this.x, this.y, '#ffd54f', 6);
        return;
      }
    }

    if (targetToAttack) {
      // Dừng di chuyển để tấn công
      this.isEating = true;
      this.eatingPlant = targetToAttack;

      if (this.type === 'gargantuar') {
        // Gargantuar: Đập bẹp 1-hit ONESHOT bất kỳ cây nào (99999 DMG, phá hủy vĩnh viễn cả máy chiếu Infi-nut)
        this.isSmashing = true;
        this.attackTimer += dt;

        if (this.attackTimer >= this.smashWindup && !this.hasStruckThisCycle) {
          this.hasStruckThisCycle = true;
          targetToAttack.takeDamage(99999, true); // 1-hit oneshot bất kỳ plant nào!
          gameState.spawnParticles(targetToAttack.x, targetToAttack.y, '#795548', 12);
          if (gameState && gameState.audio) {
            gameState.audio.playGargantuarSmash();
          }

          // Nếu là nấm thôi miên bị đập thì bị nghiền nát
          if (targetToAttack.type === 'hypno_shroom') {
            targetToAttack.alive = false;
          }
        }

        if (this.attackTimer >= 2.0) {
          this.attackTimer = 0;
          this.hasStruckThisCycle = false;
          if (!targetToAttack.alive || targetToAttack.isRecharging) {
            this.isEating = false;
            this.isSmashing = false;
            this.eatingPlant = null;
          }
        }
      } else {
        // Zombie thường / Nón sắt / Thùng sắt: Cắn 50 DMG mỗi 0.5s (100 DPS)
        this.attackTimer += dt;
        if (this.attackTimer >= this.attackInterval) {
          this.attackTimer = 0;

          // ĐẶC ĐIỂM BẢN GỐC: KHI THÂY MA ĂN NẤM THÔI MIÊN, CHÚNG SẼ QUAY LẠI VÀ CHIẾN ĐẤU CHO BẠN!
          if (targetToAttack.type === 'hypno_shroom') {
            const isSuper = targetToAttack.isSuperHypno;
            targetToAttack.alive = false;
            targetToAttack.takeDamage(9999);
            this.isEating = false;
            this.eatingPlant = null;
            if (isSuper) {
              // Zombie đột biến thành Gargantuar chiến đấu cho phe người chơi!
              this.alive = false;
              const allyGarg = new Zombie('gargantuar', this.row);
              allyGarg.x = this.x;
              allyGarg.isHypnotized = true;
              gameState.zombies.push(allyGarg);
              gameState.spawnParticles(this.x, this.y, '#e040fb', 30);
              gameState.spawnParticles(this.x, this.y, '#ffd54f', 20);
              if (gameState.spawnFloatingText) {
                gameState.spawnFloatingText(this.x, this.y - 35, 'ĐỘT BIẾN GARGANTUAR! 🧟‍♂️⚡', '#e040fb', 18);
              }
            } else {
              this.hypnotize(gameState);
            }
            if (gameState && gameState.audio) {
              gameState.audio.playHypno();
            }
            return;
          }

          targetToAttack.takeDamage(this.damage, false); // 50 DMG
          if (this.type === 'lang_khach') {
            this.slashAnimTimer = 0.25;
            gameState.spawnParticles(targetToAttack.x + 8, targetToAttack.y - 6, '#b2ebf2', 4);
          } else {
            gameState.spawnParticles(targetToAttack.x + 10, targetToAttack.y, '#81c784', 3);
          }
          if (gameState && gameState.audio) {
            gameState.audio.playChomp();
          }

          // Nếu cây chết hoặc biến thành máy chiếu sạc (Infi-nut), zombie dừng cắn và đi tiếp!
          if (!targetToAttack.alive || targetToAttack.isRecharging) {
            this.isEating = false;
            this.eatingPlant = null;
            if (this.dashBlockedPlant === targetToAttack) {
              this.dashBlockedPlant = null;
            }
          }
        }
      }
    } else {
      // Không có cây chặn đường -> Tiếp tục bước đi
      this.isEating = false;
      this.isSmashing = false;
      this.eatingPlant = null;
      this.attackTimer = 0;
      this.hasStruckThisCycle = false;

      // Di chuyển từ phải sang trái (dx = (CELL_WIDTH / speedPerCell) * dt * speedFactor)
      const currentSpeedPxPerSec = (CONFIG.CELL_WIDTH / this.speedPerCell) * currentSpeedFactor;
      this.x -= currentSpeedPxPerSec * dt;
      this.walkCycle = (Number.isFinite(this.walkCycle) ? this.walkCycle : 0) + dt * 4.5 * currentSpeedFactor;

      // Zombie xâm nhập vào nhà bên trái -> Kích hoạt Máy cắt cỏ hoặc Game Over
      if (this.x <= CONFIG.GRID_OFFSET_X) {
        const mower = gameState.lawnmowers[this.row];
        if (mower && mower.active) {
          mower.trigger(gameState);
        } else if (!mower || !mower.active) {
          if (gameState.isSandbox) {
            this.alive = false; // Trong Sandbox không ngắt quãng bằng Game Over
          } else {
            gameState.triggerGameOver();
          }
        }
      }
    }
  }

  takeDamage(amount, bypassArmor = false) {
    if (!this.alive) return;

    // Skill 2 của Lãng Khách Zombie: Khi đang bất tử 3s thì miễn nhiễm mọi sát thương chiến đấu
    if (this.type === 'lang_khach' && this.invulnerableTimer > 0 && amount < 99999) {
      this.flashTimer = 0.08;
      return;
    }

    this.flashTimer = 0.12;
    const prevHp = this.hp;

    // Nếu có cờ bypassArmor (Đậu Độc): Đánh thẳng vào máu, bỏ qua giáp nón/xô
    if (bypassArmor) {
      this.hp -= amount;
    } else {
      // Trừ giáp trước nếu có (Conehead / Buckethead)
      if (this.armorHp > 0) {
        if (this.armorHp >= amount) {
          this.armorHp -= amount;
          this.hp -= amount;
          return;
        } else {
          this.armorHp = 0;
          this.hp -= amount;
        }
      } else {
        this.hp -= amount;
      }
    }

    // Skill 2 của Lãng Khách Zombie: Khi HP tụt xuống dưới 50% -> Bất tử 3s (1 lần/mạng)
    if (this.type === 'lang_khach' && !this.hasTriggeredInvuln && amount < 99999 && this.hp < this.maxHp * 0.5) {
      this.hasTriggeredInvuln = true;
      const proto = ZOMBIE_CONFIG.lang_khach || {};
      this.invulnerableTimer = proto.invulnDuration || 3.0;
      if (this.hp <= 0 && prevHp > 0) {
        this.hp = 1;
      }
      if (this.gameState) {
        this.gameState.spawnParticles(this.x, this.y - 10, '#80deea', 16);
        this.gameState.spawnParticles(this.x, this.y - 10, '#ffd54f', 12);
        if (this.gameState.spawnFloatingText) {
          this.gameState.spawnFloatingText(this.x, this.y - 36, 'BẤT TỬ 3s! 🛡️🌪️', '#ffd54f', 18);
        }
      }
      return;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.isEating = false;
      this.isSmashing = false;
      this.eatingPlant = null;

      // Nếu khối băng bị phá hủy, giải phóng Yeti Imp
      if (this.type === 'ice_block' && !this.hasReleasedImp && this.gameState) {
        this.hasReleasedImp = true;
        this.gameState.spawnParticles(this.x, this.y, '#80deea', 25);
        this.gameState.spawnParticles(this.x, this.y, '#ffffff', 20);
        if (this.gameState.spawnFloatingText) {
          this.gameState.spawnFloatingText(this.x, this.y - 25, 'YETI IMP THOÁT RA! ❄️👹', '#00e5ff', 16);
        }
        if (this.gameState.audio && this.gameState.audio.playHit) {
          this.gameState.audio.playHit();
        }
        const imp = new Zombie('yeti_imp', this.row);
        imp.x = this.x;
        this.gameState.zombies.push(imp);
      }
    }
  }

  // Skill 3 của Lãng Khách Zombie: Lướt đủ 3 lần -> Bắn lốc xoáy gây 1800 sát thương lên 2 ô trước mặt
  triggerLangKhachTornado(gameState) {
    if (!gameState) return;
    const proto = ZOMBIE_CONFIG.lang_khach || {};
    const tornadoDmg = proto.tornadoDamage || 1800;
    const rangeCells = proto.tornadoRangeCells || 2.0;
    const rangePx = CONFIG.CELL_WIDTH * rangeCells + 16;
    const minX = Math.max(CONFIG.GRID_OFFSET_X, this.x - rangePx);
    const maxX = this.x + 15;

    (gameState.plants || []).forEach(p => {
      if (p.alive && !p.isRecharging && p.row === this.row && p.x >= minX && p.x <= maxX) {
        p.takeDamage(tornadoDmg, false);
        gameState.spawnParticles(p.x, p.y - 10, '#80deea', 8);
        gameState.spawnParticles(p.x, p.y - 10, '#ef5350', 4);
      }
    });
    (gameState.zombies || []).forEach(z => {
      if (z.alive && z.isHypnotized && z.row === this.row && z.x >= minX && z.x <= maxX) {
        z.takeDamage(tornadoDmg);
      }
    });
    (gameState.barriers || []).forEach(b => {
      if (b.alive && b.x >= minX && b.x <= maxX) {
        b.takeDamage(tornadoDmg);
      }
    });

    if (gameState.spawnAttackEffect) {
      gameState.spawnAttackEffect({
        kind: 'lang_khach_tornado',
        x: this.x,
        y: this.y,
        row: this.row,
        minRow: this.row,
        maxRow: this.row,
        startX: minX,
        endX: this.x,
        duration: 0.65
      });
    }
    if (gameState.spawnFloatingText) {
      gameState.spawnFloatingText(this.x - 30, this.y - 36, `LỐC XOÁY! 🌪️ (-${tornadoDmg})`, '#80deea', 18);
    }
    if (gameState.audio && gameState.audio.playExplosion) {
      gameState.audio.playExplosion('normal');
    }
  }

  // Khạc lửa càn quét qua 2 hàng ngang
  executeFireBreath(gameState) {
    if (!gameState) return;
    const rows = this.breathRows || [this.bossRow, this.bossRow + 1];

    if (gameState.audio) {
      gameState.audio.playExplosion && gameState.audio.playExplosion('fire');
    }

    // Tiêu diệt toàn bộ cây trên 2 hàng và thiêu rụi các ô thành đất cháy 10s
    for (let r of rows) {
      if (r < 0 || r >= CONFIG.ROWS) continue;

      // Thiêu rụi cây
      gameState.plants.forEach(p => {
        if (p.alive && p.row === r) {
          p.takeDamage(99999, true); // Thiêu rụi ngay lập tức
          gameState.spawnParticles(p.x, p.y, '#ff3d00', 12);
        }
      });

      // Tiêu diệt cả zombie phe nó trên đường đi (trừ bản thân rồng)
      gameState.zombies.forEach(z => {
        if (z.alive && z.id !== this.id && z.row === r) {
          if (!z.isFireImmune) {
            z.takeDamage(99999);
            gameState.spawnParticles(z.x, z.y, '#ff5722', 10);
          }
        }
      });

      // Thiêu rụi tất cả các ô trên 2 hàng này trong 10 giây
      for (let c = 0; c < CONFIG.COLS - 2; c++) {
        if (gameState.scorchTile) {
          gameState.scorchTile(r, c, 10.0);
        }
      }
    }
  }

  // Ngắt đòn khạc lửa khi người chơi dùng Plant Food
  cancelFireBreath(gameState) {
    if (this.isWindupBreath || this.isBreathingFire) {
      this.isWindupBreath = false;
      this.isBreathingFire = false;
      this.breathWindupTimer = 0;
      this.breathDuration = 0;
      this.breathTimer = 18.0; // Hồi chiêu lại
      this.applyStun(3.0); // Choáng rồng 3 giây!

      if (gameState) {
        gameState.spawnParticles(this.x, this.y, '#76ff03', 30);
        gameState.spawnParticles(this.x, this.y, '#00e5ff', 25);
        if (gameState.spawnFloatingText) {
          gameState.spawnFloatingText(this.x - 30, this.y - 50, 'NGẮT CHIÊU THÀNH CÔNG! ⚡', '#76ff03', 20);
        }
      }
    }
  }
}

/**
 * LỚP ĐẠN BẮN THẲNG & ĐẠN CẦU VỒNG (Projectile)
 */
class Projectile {
  constructor(type, row, x, y, damage, speed = 6.5) {
    this.id = generateId();
    this.type = type; // 'pea', 'ice_pea', 'goo_pea', 'cabbage', 'melon'
    this.row = row;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = speed;
    this.alive = true;

    // Cấu hình đạn cầu vồng (Lobbed)
    this.isLobbed = (type === 'cabbage' || type === 'melon');
    this.targetX = x;
    this.targetY = y;
    this.startX = x;
    this.startY = y;
    this.arcHeight = 90;
    this.lobProgress = 0;
    this.lobDuration = 0.75;
    this.splashDamage = 0;
    this.splashRadiusCells = 1.2;
  }

  update(dt, gameState) {
    if (!this.alive) return;

    if (this.isLobbed) {
      // Đạn cầu vồng bay parabol theo thời gian, bỏ qua vật cản
      this.lobProgress += dt / this.lobDuration;
      const t = Math.min(1.0, this.lobProgress);

      this.x = this.startX + (this.targetX - this.startX) * t;
      const linearY = this.startY + (this.targetY - this.startY) * t;
      const arc = 4 * this.arcHeight * t * (1 - t);
      this.y = linearY - arc;

      // Đạn tiếp đất -> Gây sát thương trực tiếp và sát thương lan AoE 3x3
      if (t >= 1.0) {
        this.alive = false;
        const splashRadiusPx = this.splashRadiusCells * CONFIG.CELL_WIDTH;

        gameState.zombies.forEach(z => {
          if (z.alive && !z.isHypnotized && Math.abs(z.row - this.row) <= 1) {
            const dist = Math.hypot(z.x - this.targetX, z.y - this.targetY);
            if (dist <= 35) {
              z.takeDamage(this.damage); // Sát thương trực tiếp
              gameState.spawnParticles(z.x, z.y - 10, this.type === 'melon' ? '#4caf50' : '#8bc34a', 6);
            } else if (dist <= splashRadiusPx && this.splashDamage > 0) {
              z.takeDamage(this.splashDamage); // Sát thương lan AoE 3x3
              gameState.spawnParticles(z.x, z.y - 10, '#81c784', 3);
            }
          }
        });
      }
      return;
    }

    // Đạn bắn thẳng di chuyển ngang
    const moveStep = this.speed * (60 * dt);
    this.x += moveStep;

    if (this.isRollingPoisonBoulder) {
      // Đạn độc khổng lồ lăn dọc hàng (Goo Peashooter Plant Food): Xô ngã, 1000 DMG xuyên giáp, để lại độc 8s
      this.hitZombies = this.hitZombies || new Set();
      gameState.zombies.forEach(z => {
        if (!z.alive || z.isHypnotized) return;
        const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
        const isRowMatch = z.row === this.row || isBossHitbox;
        if (isRowMatch && Math.abs(z.x - this.x) <= 35 && !this.hitZombies.has(z.id)) {
          this.hitZombies.add(z.id);
          z.takeDamage(this.damage || 1000, true);
          z.applyKnockback(120);
          z.applyPoison(3, 8.0, 30.0, 3);
          gameState.spawnParticles(z.x, z.y - 10, '#d500f9', 12);
          gameState.spawnParticles(z.x, z.y - 10, '#00e676', 8);
        }
      });
      if (this.x > CONFIG.CANVAS_WIDTH + 80) {
        this.alive = false;
      }
      return;
    }

    if (this.isEnergyWave) {
      // Sóng năng lượng của Galio:
      // - Skill 1 (isSingleTarget / !isGiant): chỉ gây sát thương lên zombie đầu tiên dính chiêu rồi tan biến
      // - Plant Food (isGiant): xuyên qua toàn bộ hàng
      this.hitZombies = this.hitZombies || new Set();
      if (this.isSingleTarget || !this.isGiant) {
        let firstZombie = null;
        let minX = Infinity;
        for (const z of gameState.zombies) {
          if (!z.alive || z.isHypnotized) continue;
          const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
          const isRowMatch = z.row === this.row || isBossHitbox;
          const hitHalfW = z.type === 'zombot_dark_dragon' ? 60 : 34;
          if (isRowMatch && Math.abs(z.x - this.x) <= hitHalfW && z.x < minX) {
            minX = z.x;
            firstZombie = z;
          }
        }
        if (firstZombie) {
          firstZombie.takeDamage(this.damage || 500);
          gameState.spawnParticles(firstZombie.x, firstZombie.y - 10, '#00e5ff', 10);
          gameState.spawnParticles(firstZombie.x, firstZombie.y - 10, '#ffd54f', 6);
          if (gameState && gameState.audio && gameState.audio.playHit) {
            gameState.audio.playHit();
          }
          this.alive = false;
        }
      } else {
        gameState.zombies.forEach(z => {
          if (!z.alive || z.isHypnotized) return;
          const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
          const isRowMatch = z.row === this.row || isBossHitbox;
          const hitHalfW = z.type === 'zombot_dark_dragon' ? 60 : 38;
          if (isRowMatch && Math.abs(z.x - this.x) <= hitHalfW && !this.hitZombies.has(z.id)) {
            this.hitZombies.add(z.id);
            z.takeDamage(this.damage || 500);
            gameState.spawnParticles(z.x, z.y - 10, '#00e5ff', 6);
            gameState.spawnParticles(z.x, z.y - 10, '#ffd54f', 4);
          }
        });
      }
      if (this.x > CONFIG.CANVAS_WIDTH + 60) {
        this.alive = false;
      }
      return;
    }

    // Đạn của Jhinplant: tìm mục tiêu gần nhất phía trước, nếu là viên thứ 4 hạ gục zombie sẽ đặt Bẫy Hoa Sen
    if (this.isJhinBullet) {
      let frontZombie = null;
      let minX = Infinity;
      for (const z of gameState.zombies) {
        if (!z.alive || z.isHypnotized) continue;
        const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
        const isRowMatch = z.row === this.row || isBossHitbox;
        const hitHalfW = z.type === 'zombot_dark_dragon' ? 58 : 28;
        if (isRowMatch && Math.abs(z.x - this.x) < hitHalfW && z.x < minX) {
          minX = z.x;
          frontZombie = z;
        }
      }

      if (frontZombie) {
        this.alive = false;
        const wasAlive = frontZombie.alive;
        frontZombie.takeDamage(this.damage);

        if (gameState && gameState.audio && gameState.audio.playHit) {
          gameState.audio.playHit();
        }

        if (this.isFourthShot) {
          gameState.spawnParticles(frontZombie.x, frontZombie.y - 12, '#ff1744', 14);
          gameState.spawnParticles(frontZombie.x, frontZombie.y - 12, '#e040fb', 10);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(frontZombie.x, frontZombie.y - 28, `IV! -${this.damage}`, '#ff1744', 18);
          }
          // Skill: Khi viên thứ 4 tiêu diệt Zombie -> đặt 1 Bẫy Hoa Sen tại đó
          if (wasAlive && !frontZombie.alive && typeof gameState.spawnLotusTrap === 'function') {
            gameState.spawnLotusTrap(frontZombie.row, frontZombie.x, frontZombie.y);
          }
        } else {
          gameState.spawnParticles(frontZombie.x, frontZombie.y - 10, '#ce93d8', 6);
        }
      }

      if (this.x > CONFIG.CANVAS_WIDTH + 20) {
        this.alive = false;
      }
      return;
    }

    // Va chạm với Tombstone (Vật cản) hoặc Zombie đầu tiên trên hàng (không bắn trúng đồng minh bị thôi miên)
    for (const z of gameState.zombies) {
      if (!z.alive || z.isHypnotized) continue;

      // Với Zombot Dark Dragon: Hitbox chiếm 2 hàng liên tiếp (z.bossRow và z.bossRow + 1)
      const isBossHitbox = z.type === 'zombot_dark_dragon' && (this.row === z.bossRow || this.row === z.bossRow + 1);
      const isRowMatch = z.row === this.row || isBossHitbox;

      if (isRowMatch && Math.abs(z.x - this.x) < (z.type === 'zombot_dark_dragon' ? 55 : (this.isGiant ? 36 : 26))) {
        this.alive = false;
        if (this.isGiant) {
          z.takeDamage(this.damage || 600);
          z.applyKnockback(60);
          gameState.spawnParticles(z.x, z.y - 10, '#76ff03', 18);
          gameState.spawnParticles(z.x, z.y - 10, '#ffffff', 8);
          if (gameState.spawnFloatingText) {
            gameState.spawnFloatingText(z.x, z.y - 25, '600 DMG! 💥', '#76ff03', 18);
          }
          break;
        }
        if (this.type === 'ice_pea') {
          z.takeDamage(this.damage);
          z.applySlow(0.5, 10.0); // Làm chậm 50% trong 10s
          gameState.spawnParticles(z.x, z.y - 10, '#00e5ff', 5);
        } else if (this.type === 'goo_pea') {
          // Đậu Độc: Sát thương cơ bản 30, đánh thẳng vào máu xuyên giáp nón/xô, độc 15 dmg/s dồn tối đa 3 lần, KHÔNG làm chậm
          z.takeDamage(this.damage || 30, true); // bypassArmor = true!
          z.applyPoison(1, 4.0, 15.0, 3); // 1 stack mỗi viên, 15 dmg/s, tối đa 3 stacks
          gameState.spawnParticles(z.x, z.y - 10, '#d500f9', 5);
        } else {
          z.takeDamage(this.damage);
          gameState.spawnParticles(z.x, z.y - 10, '#76ff03', 4);
        }
        break;
      }
    }

    if (this.x > CONFIG.CANVAS_WIDTH + 20) {
      this.alive = false;
    }
  }
}

/**
 * LỚP SUN (Tài nguyên Mặt Trời)
 * Tự động nhặt sau khi rơi 0.5s (có thể click tay bất cứ lúc nào)
 */
class Sun {
  constructor(x, y, targetY, isNatural = true, amount = 25) {
    this.id = generateId();
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.isNatural = isNatural;
    this.amount = amount;

    this.collected = false;
    this.alive = true;
    this.lifetime = 0;
    this.groundTime = 0;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.rotTimer = Math.random() * Math.PI * 2;

    this.startX = x;
    this.startY = y;
    this.flyProgress = 0;
  }

  update(dt, sunTargetPos, gameState) {
    if (!this.alive) return;

    this.rotTimer += dt * 1.5;

    // Tự động nhặt sau khi rơi 0.5s theo đúng yêu cầu
    if (!this.collected) {
      this.groundTime += dt;
      if (this.groundTime >= CONFIG.SUN_AUTO_COLLECT_DELAY) {
        this.collect();
      }
    }

    if (this.collected) {
      this.flyProgress += dt * 3.5;
      if (this.flyProgress >= 1.0) {
        this.flyProgress = 1.0;
        this.alive = false;
        gameState.addSun(this.amount);
        return;
      }
      const t = this.flyProgress;
      const easeT = t * t * (3 - 2 * t);
      this.x = this.startX + (sunTargetPos.x - this.startX) * easeT;
      this.y = this.startY + (sunTargetPos.y - this.startY) * easeT;
      return;
    }

    // Rơi xuống đất
    if (this.y < this.targetY) {
      this.y += 85 * dt;
      if (this.y >= this.targetY) {
        this.y = this.targetY;
      }
    } else {
      this.floatTimer += dt * 3;
      this.lifetime += dt;
      if (this.lifetime >= CONFIG.NATURAL_SUN_LIFETIME) {
        this.alive = false;
      }
    }
  }

  collect() {
    if (this.collected || !this.alive) return false;
    this.collected = true;
    this.startX = this.x;
    this.startY = this.y;
    this.flyProgress = 0;
    return true;
  }
}

/**
 * LỚP MÁY CẮT CỎ (Lawnmower)
 * 5 máy (1/hàng) ở mép trái. Tự chạy khi zombie chạm nhà, nghiền nát mọi zombie trên hàng. Dùng 1 lần.
 */
class Lawnmower {
  constructor(row) {
    this.row = row;
    this.x = CONFIG.GRID_OFFSET_X - 45;
    this.y = CONFIG.GRID_OFFSET_Y + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
    this.active = true;
    this.moving = false;
    this.speed = CONFIG.LAWNMOWER_SPEED || 8.5;
    this.hasHitBoss = false;
  }

  trigger(gameState) {
    if (!this.active || this.moving) return;
    this.moving = true;
    if (gameState && gameState.audio) {
      gameState.audio.playLawnmower();
    }
  }

  update(dt, gameState) {
    if (!this.active) return;

    if (this.moving) {
      this.x += this.speed * (60 * dt);

      // Nghiền nát tất cả zombie quân địch trên cùng hàng khi máy chạy qua
      gameState.zombies.forEach(z => {
        if (!z.alive || z.isHypnotized) return;

        const isBoss = z.type === 'zombot_dark_dragon';
        const isRowMatch = isBoss
          ? (this.row === z.bossRow || this.row === z.bossRow + 1 || z.row === this.row)
          : (z.row === this.row);
        const hitDistance = isBoss ? 55 : 45;

        if (isRowMatch && Math.abs(z.x - this.x) < hitDistance) {
          if (isBoss) {
            // Máy cắt cỏ KHÔNG giết boss Zombot ngay lập tức!
            // Va chạm chỉ gây đúng 111 sát thương theo yêu cầu của người chơi
            if (!this.hasHitBoss) {
              this.hasHitBoss = true;
              const bossDmg = 111;
              z.takeDamage(bossDmg);
              if (gameState.spawnExplosion) {
                gameState.spawnExplosion(this.x, this.y);
              }
              if (gameState.spawnParticles) {
                gameState.spawnParticles(this.x, this.y, '#ff1744', 16);
                gameState.spawnParticles(this.x, this.y, '#ffd54f', 12);
              }
              if (gameState.spawnFloatingText) {
                gameState.spawnFloatingText(z.x, z.y - 20, `-${bossDmg} DMG! 💥`, '#ff1744', 22);
              }
              if (gameState.audio && gameState.audio.playExplosion) {
                gameState.audio.playExplosion('fire');
              }
              // Tiêu hao máy cắt cỏ sau khi đâm vào thân rồng khổng lồ
              this.active = false;
              this.moving = false;
            }
          } else {
            z.takeDamage(99999);
            gameState.spawnParticles(z.x, z.y, '#b71c1c', 10);
          }
        }
      });

      if (this.x > CONFIG.CANVAS_WIDTH + 60) {
        this.active = false;
        this.moving = false;
      }
    }
  }
}

/**
 * LỚP HIỆU ỨNG HẠT (Particle)
 */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 130;
    this.vy = (Math.random() - 0.5) * 130 - 40;
    this.color = color;
    this.radius = 2.5 + Math.random() * 2.5;
    this.alpha = 1.0;
    this.alive = true;
    this.gravity = 180;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.alpha -= dt * 2.0;
    if (this.alpha <= 0) {
      this.alive = false;
    }
  }
}

/**
 * LỚP IMP ĐANG BAY TRÊN KHÔNG (FlyingImp)
 */
class FlyingImp {
  constructor(row, startX, startY, targetX, targetY) {
    this.id = generateId();
    this.row = row;
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.x = startX;
    this.y = startY;
    this.arcHeight = 85;
    this.progress = 0;
    this.duration = 0.9;
    this.alive = true;
  }

  update(dt, gameState) {
    if (!this.alive) return;
    this.progress += dt / this.duration;
    const t = Math.min(1.0, this.progress);
    this.x = this.startX + (this.targetX - this.startX) * t;
    const linearY = this.startY + (this.targetY - this.startY) * t;
    const arc = 4 * this.arcHeight * t * (1 - t);
    this.y = linearY - arc;

    if (t >= 1.0) {
      this.alive = false;
      gameState.spawnLandedImp(this.row, this.targetX, this.targetY);
    }
  }
}

/**
 * LỚP HÀNG RÀO TOÀN ẢNH (Holographic Barrier)
 */
class HolographicBarrier {
  constructor(col) {
    this.id = generateId();
    this.col = Math.min(CONFIG.COLS - 1, col);
    this.x = CONFIG.GRID_OFFSET_X + this.col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
    this.maxHp = 10000;
    this.hp = 10000;
    this.alive = true;
    this.flashTimer = 0;
    this.animTime = 0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flashTimer = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  update(dt) {
    this.animTime += dt;
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }
    // Tự phục hồi nếu không bị phá hủy hoàn toàn (hồi 200 HP/s)
    if (this.alive && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 200 * dt);
    }
  }
}

/**
 * LỚP CHỮ BAY NỔI (FloatingText) - Cho hiệu ứng SPUDOW!, THÔI MIÊN!, v.v.
 */
class FloatingText {
  constructor(x, y, text, color = '#ffd54f', fontSize = 16) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.fontSize = fontSize;
    this.life = 1.3;
    this.maxLife = 1.3;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 25 * dt;
    if (this.life <= 0) {
      this.alive = false;
    }
  }
}

if (typeof window !== 'undefined') {
  window.Plant = Plant;
  window.Zombie = Zombie;
  window.Projectile = Projectile;
  window.Lawnmower = Lawnmower;
  window.Sun = Sun;
  window.FloatingText = FloatingText;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Plant, Zombie, Projectile, Lawnmower, Sun, FloatingText };
}
