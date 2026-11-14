/**
 * PVZ Tower Defense 2D - Renderer
 * Vẽ toàn bộ sân cỏ 5x9, Cây, Zombie, Đạn, Sun, Máy cắt cỏ, Hiệu ứng
 */

// Polyfill an toàn cho roundRect trên tất cả các phiên bản Android WebView
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    let r1 = 0, r2 = 0, r3 = 0, r4 = 0;
    if (typeof radii === 'number') {
      r1 = r2 = r3 = r4 = radii;
    } else if (Array.isArray(radii)) {
      if (radii.length === 1) { r1 = r2 = r3 = r4 = radii[0]; }
      else if (radii.length === 2) { r1 = r3 = radii[0]; r2 = r4 = radii[1]; }
      else if (radii.length === 4) { [r1, r2, r3, r4] = radii; }
    }
    this.beginPath();
    this.moveTo(x + r1, y);
    this.lineTo(x + w - r2, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r2);
    this.lineTo(x + w, y + h - r3);
    this.quadraticCurveTo(x + w, y + h, x + w - r3, y + h);
    this.lineTo(x + r4, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r4);
    this.lineTo(x, y + r1);
    this.quadraticCurveTo(x, y, x + r1, y);
    this.closePath();
    return this;
  };
}

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(gameState, inputHandler) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Vẽ nền sân cỏ và bối cảnh 5x9
    this.drawLawn(ctx);

    // 1.5. Vẽ các ô bị thiêu rụi thành đất cháy trong 10s (Scorched Tiles)
    if (gameState.scorchedTiles && gameState.scorchedTiles.length > 0) {
      this.drawScorchedTiles(ctx, gameState.scorchedTiles);
    }

    // 1.7. Vẽ Bẫy Hoa Sen của Jhinplant trên mặt sân
    if (gameState.lotusTraps && gameState.lotusTraps.length > 0) {
      this.drawLotusTraps(ctx, gameState.lotusTraps);
    }

    // 2. Vẽ ô đánh dấu hover / preview trồng cây
    this.drawPlacementPreview(ctx, gameState, inputHandler);

    // 2.5. Vẽ vùng phạm vi tấn công (Ground Range Highlight) để nhìn rõ tầm đánh của cây
    if (gameState.attackEffects && gameState.attackEffects.length > 0) {
      this.drawAttackRangeZones(ctx, gameState.attackEffects);
    }

    // 3. Vẽ máy cắt cỏ (Lawnmowers)
    this.drawLawnmowers(ctx, gameState.lawnmowers);

    // 4. Vẽ hàng rào toàn ảnh (Holographic Barriers)
    if (gameState.barriers && gameState.barriers.length > 0) {
      this.drawBarriers(ctx, gameState.barriers);
    }

    // 5. Vẽ Cây (Plants)
    for (const plant of gameState.plants) {
      if (plant.alive) {
        this.drawPlant(ctx, plant);
      }
    }

    // 6. Vẽ tia sét (Lightning Arcs)
    if (gameState.lightningArcs && gameState.lightningArcs.length > 0) {
      this.drawLightningArcs(ctx, gameState.lightningArcs);
    }

    // 7. Vẽ đám mây khí choáng (Gas Clouds)
    if (gameState.gasClouds && gameState.gasClouds.length > 0) {
      this.drawGasClouds(ctx, gameState.gasClouds);
    }

    // 8. Vẽ Zombie (sắp xếp theo y để hiển thị đúng độ sâu lớp)
    const sortedZombies = [...gameState.zombies].sort((a, b) => a.y - b.y);
    for (const zombie of sortedZombies) {
      this.drawZombie(ctx, zombie);
    }

    // 8.3. Vẽ hơi thở lửa (Fire Breath) & cảnh báo của Zombot Dark Dragon
    const bossDragon = gameState.zombies.find(z => z.alive && z.type === 'zombot_dark_dragon');
    if (bossDragon && (bossDragon.isWindupBreath || bossDragon.isBreathingFire)) {
      this.drawFireBreath(ctx, bossDragon);
    }

    // 8.4. Vẽ hiệu ứng đòn đánh phạm vi phía trước (Ngọn lửa 3 hàng, Sóng đấm, Cắn, Nổ...)
    if (gameState.attackEffects && gameState.attackEffects.length > 0) {
      this.drawAttackEffectVfx(ctx, gameState.attackEffects);
    }

    // 8.5. Vẽ Imp đang bay trên không (FlyingImps)
    if (gameState.flyingImps && gameState.flyingImps.length > 0) {
      this.drawFlyingImps(ctx, gameState.flyingImps);
    }

    // 8.8. Vẽ tia Laser của Turquoise Skull Zombie
    if (gameState.laserBeams && gameState.laserBeams.length > 0) {
      this.drawLaserBeams(ctx, gameState.laserBeams);
    }

    // 9. Vẽ Đạn (Projectiles)
    for (const proj of gameState.projectiles) {
      if (proj.alive) {
        this.drawProjectile(ctx, proj);
      }
    }

    // 9.5. Vẽ Cầu lửa Zombot Dark Dragon (Lobbed Fireballs)
    if (gameState.fireballs && gameState.fireballs.length > 0) {
      this.drawFireballs(ctx, gameState.fireballs);
    }

    // 10. Vẽ Mặt trời (Suns)
    for (const sun of gameState.suns) {
      if (sun.alive) {
        this.drawSun(ctx, sun);
      }
    }

    // 11. Vẽ Hiệu ứng hạt (Particles)
    for (const p of gameState.particles) {
      if (p.alive) {
        this.drawParticle(ctx, p);
      }
    }

    // 12. Vẽ Chữ nổi (Floating Texts như SPUDOW! 💥)
    if (gameState.floatingTexts) {
      for (const ft of gameState.floatingTexts) {
        if (ft.alive && ft.draw) {
          ft.draw(ctx);
        }
      }
    }

    // 12.8. Hiệu ứng Ngưng Đọng Thời Gian (Galio Skill 2)
    if (gameState.timeStopTimer && gameState.timeStopTimer > 0) {
      ctx.save();
      const pulse = Math.min(1, gameState.timeStopTimer / 0.35);
      ctx.fillStyle = `rgba(0, 229, 255, ${0.12 * pulse})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = `rgba(255, 215, 64, ${0.45 * pulse})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
      ctx.restore();
    }

    // 13. UI Thanh Máu Trùm Persistent (Đỉnh Canvas) hoặc Banner Wave thông thường
    const isDragonBossLevel = (gameState.currentLevel === 6) ||
      (gameState.zombies && gameState.zombies.some(z => z.type === 'zombot_dark_dragon'));

    if (isDragonBossLevel && !gameState.isSandbox) {
      this.drawBossHealthBar(ctx, gameState);
    } else {
      this.drawWaveBanner(ctx, gameState);
    }

    // 14. Vẽ Băng chuyền (Conveyor Belt) nếu ở chế độ Conveyor
    if (gameState.gameMode === 'conveyor' && gameState.conveyorSystem) {
      gameState.conveyorSystem.draw(ctx, inputHandler ? inputHandler.pointerX : 0, inputHandler ? inputHandler.pointerY : 0);
    }
  }

  drawWaveBanner(ctx, gameState) {
    if (!gameState || !gameState.waveManager || gameState.isSandbox) return;
    const wm = gameState.waveManager;
    const status = wm.getStatusText ? wm.getStatusText(gameState) : null;
    if (!status) return;

    ctx.save();
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const cy = 34;

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const text = `${status.title}  —  ${status.sub}`;
    const textWidth = ctx.measureText(text).width;
    const boxW = Math.max(340, textWidth + 30);
    const boxH = 30;

    // Nền bảng ma quái huyền bí với viền phát sáng sắc nét, không dùng shadowBlur gây giật lag
    ctx.fillStyle = 'rgba(12, 16, 24, 0.92)';
    ctx.strokeStyle = status.color || '#4fc3f7';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 6);
    } else {
      ctx.rect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = status.color || '#ffffff';
    ctx.fillText(text, cx, cy);

    ctx.restore();
  }

  // ==========================================================================
  // THANH MÁU TRÙM PERSISTENT DYNAMIC Ở ĐỈNH CANVAS (ZOMBOT DARK DRAGON 27,000 HP)
  // Cập nhật thời gian thực, có hiệu ứng thanh bóng ma tổn thương (Ghost bar)
  // ==========================================================================
  drawBossHealthBar(ctx, gameState) {
    if (!gameState) return;
    const boss = (gameState.zombies && gameState.zombies.length > 0)
      ? gameState.zombies.find(z => z.type === 'zombot_dark_dragon')
      : null;
    const maxHp = 27000;
    const currentHp = boss ? Math.max(0, boss.hp) : (gameState.isVictory ? 0 : maxHp);
    const hpRatio = Math.max(0, Math.min(1.0, currentHp / maxHp));

    // Hiệu ứng thanh bóng ma tổn thương (Trailing ghost damage bar)
    if (this.bossTrailingHp === undefined || this.bossTrailingHp > maxHp || this.bossTrailingHp < 0) {
      this.bossTrailingHp = currentHp;
    }
    if (this.bossTrailingHp > currentHp) {
      this.bossTrailingHp -= Math.max(35, (this.bossTrailingHp - currentHp) * 0.08);
      if (this.bossTrailingHp < currentHp) this.bossTrailingHp = currentHp;
    } else if (this.bossTrailingHp < currentHp) {
      this.bossTrailingHp = currentHp;
    }
    const trailingRatio = Math.max(0, Math.min(1.0, this.bossTrailingHp / maxHp));

    ctx.save();

    const barW = 540;
    const barH = 26;
    const cx = CONFIG.CANVAS_WIDTH / 2;
    const x = cx - barW / 2;
    const y = 8;
    const r = 6;

    // 1. Khung nền Dark Gothic kim loại phát sáng
    ctx.fillStyle = 'rgba(10, 12, 18, 0.95)';
    ctx.strokeStyle = (hpRatio < 0.30 && currentHp > 0) ? '#ff1744' : '#ffd700';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, barW, barH, r);
    } else {
      ctx.rect(x, y, barW, barH);
    }
    ctx.fill();
    ctx.stroke();

    // 2. Lòng thanh máu (Inner track)
    const pad = 3;
    const innerX = x + pad;
    const innerY = y + pad;
    const innerW = barW - pad * 2;
    const innerH = barH - pad * 2;

    ctx.fillStyle = '#140d12';
    ctx.fillRect(innerX, innerY, innerW, innerH);

    // 3. Thanh bóng ma tổn thương (Trailing ghost damage bar)
    if (trailingRatio > hpRatio) {
      const trailWidth = innerW * trailingRatio;
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(innerX, innerY, trailWidth, innerH);
    }

    // 4. Thanh máu thực tế (Real-time dynamic fill bar)
    if (hpRatio > 0) {
      const fillWidth = innerW * hpRatio;
      const grad = ctx.createLinearGradient(innerX, innerY, innerX + fillWidth, innerY + innerH);

      if (hpRatio > 0.65) {
        grad.addColorStop(0, '#00e676');
        grad.addColorStop(1, '#76ff03');
      } else if (hpRatio >= 0.30) {
        grad.addColorStop(0, '#ffa000');
        grad.addColorStop(1, '#ff3d00');
      } else {
        grad.addColorStop(0, '#b71c1c');
        grad.addColorStop(1, '#ff1744');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(innerX, innerY, fillWidth, innerH);

      // Hiệu ứng bóng sáng bề mặt thủy tinh (Gloss highlight)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(innerX, innerY, fillWidth, innerH / 2);
    }

    // 5. Vạch phân mốc giai đoạn (Phase dividers: 65% và 30%)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const notch1X = innerX + innerW * 0.65;
    const notch2X = innerX + innerW * 0.30;
    ctx.fillRect(notch1X - 1, innerY, 2, innerH);
    ctx.fillRect(notch2X - 1, innerY, 2, innerH);

    // 6. Huy hiệu Rồng ở góc trái thanh máu
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐲', x - 14, y + barH / 2);

    // 7. Huy hiệu trạng thái / Giai đoạn
    let phaseText = '';
    if (!boss && !gameState.isVictory) {
      phaseText = '⏳ ĐANG ĐỔ BỘ...';
    } else if (hpRatio > 0.65) {
      phaseText = 'GĐ 1: GẦM THẢ LÍNH';
    } else if (hpRatio >= 0.30) {
      phaseText = 'GĐ 2: CẦU LỬA & IMP';
    } else if (currentHp > 0) {
      phaseText = 'GĐ 3: CUỒNG BỘ! 🔥';
    } else {
      phaseText = 'ĐÃ HẠ GỤC!';
    }

    // 8. Chữ hiển thị thông số máu thời gian thực (Real-time dynamic text)
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let hpLabel = '';
    if (currentHp <= 0 || gameState.isVictory) {
      hpLabel = '💀 ZOMBOT DARK DRAGON ĐÃ BỊ HẠ GỤC! (0 / 27,000 HP)';
    } else {
      hpLabel = `ZOMBOT DARK DRAGON  ·  ${Math.ceil(currentHp).toLocaleString()} / 27,000 HP  (${ (hpRatio * 100).toFixed(1) }%)  [${phaseText}]`;
    }

    // Viền đen đổ bóng cho chữ để đảm bảo 100% tương phản
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.strokeText(hpLabel, cx, y + barH / 2);

    ctx.fillStyle = (hpRatio < 0.30 && currentHp > 0) ? '#ffea00' : '#ffffff';
    ctx.fillText(hpLabel, cx, y + barH / 2);

    ctx.restore();
  }

  drawLawn(ctx) {
    // ==========================================
    // CHIẾN TRƯỜNG HUYỀN BÍ DƯỚI ÁNH TRĂNG (MOONLIT HORROR GRAVEYARD LAWN)
    // Sáng rõ, sắc nét, tương phản cao, tràn ngập ánh trăng ma quái
    // ==========================================

    // 1. Khu vực thềm đá hầm mộ cổ bên trái (Patio)
    const patioWidth = CONFIG.GRID_OFFSET_X;
    ctx.fillStyle = '#2c3342';
    ctx.fillRect(0, 0, patioWidth, this.canvas.height);

    // Phiến đá hầm mộ granite ánh trăng nứt nẻ
    ctx.strokeStyle = '#47536b';
    ctx.lineWidth = 2;
    for (let y = 0; y < this.canvas.height; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(patioWidth, y);
      ctx.stroke();

      // Điểm nhấn đá hoa cương sáng
      ctx.fillStyle = '#374154';
      ctx.fillRect(4, y + 3, patioWidth - 14, 18);
    }

    // Mép thềm đá viền thép đen & rãnh huyết ngọc rỉ dọc mép
    ctx.fillStyle = '#1c202b';
    ctx.fillRect(patioWidth - 10, 0, 10, this.canvas.height);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(patioWidth - 3, 0, 3, this.canvas.height);

    // 2. Mép nghĩa địa & Bia mộ cổ phát sáng bên phải (Right Graveyard Zone)
    const lawnEndX = CONFIG.GRID_OFFSET_X + CONFIG.COLS * CONFIG.CELL_WIDTH;
    ctx.fillStyle = '#262936';
    ctx.fillRect(lawnEndX, 0, this.canvas.width - lawnEndX, this.canvas.height);

    // Mép đá cổ rêu phong
    ctx.fillStyle = '#343f3b';
    ctx.fillRect(lawnEndX, 0, 16, this.canvas.height);
    ctx.strokeStyle = '#52665e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lawnEndX, 0, 16, this.canvas.height);

    // Các bia mộ cổ bằng đá granite phát quang ánh lân tinh xanh (Tombstones)
    for (let r = 0; r < CONFIG.ROWS; r++) {
      const graveY = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT + 20;
      const graveX = lawnEndX + 18;

      ctx.save();
      // Bóng bia mộ
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(graveX + 10, graveY + 40, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thân bia mộ đá granite sáng rõ
      ctx.fillStyle = '#546e7a';
      ctx.beginPath();
      ctx.roundRect(graveX, graveY, 20, 38, [10, 10, 0, 0]);
      ctx.fill();
      ctx.strokeStyle = '#90a4ae';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Cây thánh giá khắc trên bia mộ
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(graveX + 10, graveY + 7); ctx.lineTo(graveX + 10, graveY + 22);
      ctx.moveTo(graveX + 4, graveY + 12); ctx.lineTo(graveX + 16, graveY + 12);
      ctx.stroke();

      // Cổ ngữ lân tinh xanh rực sáng huyền ảo
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(graveX + 10, graveY + 28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Nến đỏ linh hồn thắp sáng trên đỉnh bia mộ
      ctx.fillStyle = '#ff5252';
      ctx.beginPath();
      ctx.arc(graveX + 10, graveY - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Lưới đất bãi tha ma 5 hàng x 9 cột (Moonlit Emerald & Evergreen Moss Lawn)
    // Gam màu xanh rêu - ngọc bích ma mị sáng rõ, tương phản cao, dễ nhìn
    const lawnTile1 = '#2d4b3e'; // Ô cỏ xanh rêu ngọc bích ánh trăng
    const lawnTile2 = '#233d32'; // Ô cỏ rêu trầm tương phản

    for (let r = 0; r < CONFIG.ROWS; r++) {
      for (let c = 0; c < CONFIG.COLS; c++) {
        const x = CONFIG.GRID_OFFSET_X + c * CONFIG.CELL_WIDTH;
        const y = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT;
        const isAlt = (r + c) % 2 === 0;

        ctx.fillStyle = isAlt ? lawnTile1 : lawnTile2;
        ctx.fillRect(x, y, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);

        // Viền ô lưới màu ngọc bích ánh trăng sắc nét, rõ ràng
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x, y, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);

        // Bụi cỏ lân tinh và hoa dại ma quái điểm xuyết tạo chiều sâu
        ctx.fillStyle = isAlt ? '#3e6654' : '#2f4f41';
        ctx.beginPath();
        ctx.arc(x + 18, y + 24, 2, 0, Math.PI * 2);
        ctx.arc(x + 55, y + 60, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mạch nứt cổ ngữ ánh trăng cyan hoặc tím huyền bí
        if ((r * 3 + c * 5) % 4 === 0) {
          ctx.strokeStyle = isAlt ? 'rgba(0, 229, 255, 0.4)' : 'rgba(224, 64, 251, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + 12, y + 16);
          ctx.lineTo(x + 36, y + 42);
          ctx.lineTo(x + 68, y + 36);
          ctx.stroke();
        }

        // Rễ cây ma quái uốn lượn rõ nét
        if ((r * 2 + c * 3) % 5 === 0) {
          ctx.strokeStyle = '#1a2420';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 70);
          ctx.quadraticCurveTo(x + 28, y + 54, x + 48, y + 68);
          ctx.stroke();
        }
      }
    }

    // 4. Vầng Trăng Tròn Huyền Bí Trên Bầu Trời (Luminous Gothic Full Moon)
    // Tỏa ánh trăng vằng vặc chiếu rọi toàn bộ chiến trường
    ctx.save();
    const moonX = 640;
    const moonY = 32;

    // Quầng sáng trăng xanh ngọc bao la
    const moonHalo = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 95);
    moonHalo.addColorStop(0, 'rgba(224, 247, 250, 0.45)');
    moonHalo.addColorStop(0.4, 'rgba(128, 222, 234, 0.22)');
    moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 95, 0, Math.PI * 2);
    ctx.fill();

    // Đĩa mặt trăng tròn sáng bạc
    ctx.fillStyle = '#f0fcff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();

    // Hố mặt trăng mờ ảo
    ctx.fillStyle = '#d0edf2';
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 6, 5, 0, Math.PI * 2);
    ctx.arc(moonX + 6, moonY + 7, 7, 0, Math.PI * 2);
    ctx.arc(moonX + 11, moonY - 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // Luồng ánh trăng bao phủ sân chơi (Ambient Moonlight Illumination)
    const yardLight = ctx.createRadialGradient(480, 160, 50, 480, 240, 500);
    yardLight.addColorStop(0, 'rgba(224, 247, 250, 0.14)');
    yardLight.addColorStop(0.7, 'rgba(128, 222, 234, 0.06)');
    yardLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = yardLight;
    ctx.fillRect(CONFIG.GRID_OFFSET_X, CONFIG.GRID_OFFSET_Y, CONFIG.COLS * CONFIG.CELL_WIDTH, CONFIG.ROWS * CONFIG.CELL_HEIGHT);

    // 5. Rừng gai đen gothic trên nóc với viền bạc ánh trăng
    ctx.fillStyle = '#1e222e';
    for (let i = 0; i < 16; i++) {
      const bx = 30 + i * 60;
      const by = (i % 2 === 0) ? 14 : 22;
      ctx.beginPath();
      ctx.arc(bx, by, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cành gai nhọn hoắt chĩa xuống có viền ánh trăng sáng
    ctx.strokeStyle = '#3e475d';
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 12; i++) {
      const gx = 60 + i * 75;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx - 8, 26);
      ctx.lineTo(gx + 4, 36);
      ctx.stroke();
    }

    // 6. Dải sương mù lân tinh mỏng lơ lửng ở chân sân (không che khuất tầm nhìn)
    const gradMist = ctx.createLinearGradient(0, this.canvas.height - 40, 0, this.canvas.height);
    gradMist.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradMist.addColorStop(1, 'rgba(128, 222, 234, 0.18)');
    ctx.fillStyle = gradMist;
    ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);

    ctx.restore();
  }

  drawPlacementPreview(ctx, gameState, input) {
    if (!input.isPointerOnCanvas) return;
    const r = input.hoverRow;
    const c = input.hoverCol;
    if (r < 0 || r >= CONFIG.ROWS || c < 0 || c >= CONFIG.COLS) return;

    const cellX = CONFIG.GRID_OFFSET_X + c * CONFIG.CELL_WIDTH;
    const cellY = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT;

    const isOccupied = gameState.isCellOccupied(r, c);

    if (gameState.selectedPlantType) {
      if (isOccupied) {
        // Ô đã có quái vật -> Highlight đỏ sẫm cảnh báo
        ctx.fillStyle = 'rgba(213, 0, 0, 0.45)';
        ctx.fillRect(cellX, cellY, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cellX + 2, cellY + 2, CONFIG.CELL_WIDTH - 4, CONFIG.CELL_HEIGHT - 4);
      } else {
        // Ô hợp lệ -> Vòng triệu hồi hắc ám phát quang xanh tím
        ctx.fillStyle = 'rgba(118, 255, 3, 0.22)';
        ctx.fillRect(cellX, cellY, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);
        ctx.strokeStyle = '#76ff03';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cellX + 2, cellY + 2, CONFIG.CELL_WIDTH - 4, CONFIG.CELL_HEIGHT - 4);

        // Vẽ mờ cây quỷ xem trước
        ctx.save();
        ctx.globalAlpha = 0.65;
        const dummyPlant = {
          type: gameState.selectedPlantType,
          x: cellX + CONFIG.CELL_WIDTH / 2,
          y: cellY + CONFIG.CELL_HEIGHT / 2,
          animTime: 0,
          flashTimer: 0,
          state: 'idle',
          glow: 0,
          stage: 1,
          armed: false,
          isIcon: true,
          hp: 1,
          maxHp: 1
        };
        this.drawPlant(ctx, dummyPlant);
        ctx.restore();
      }
    } else if (gameState.isShovelActive && isOccupied) {
      // Đang dùng xẻng đào mộ
      ctx.fillStyle = 'rgba(183, 28, 28, 0.55)';
      ctx.fillRect(cellX, cellY, CONFIG.CELL_WIDTH, CONFIG.CELL_HEIGHT);
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cellX + 2, cellY + 2, CONFIG.CELL_WIDTH - 4, CONFIG.CELL_HEIGHT - 4);
    }
  }

  // CỖ MÁY NGHIỀN HỒN SẮT ĐEN (Soul Harvesters / Bone Grinder Death Carts)
  drawLawnmowers(ctx, lawnmowers) {
    lawnmowers.forEach(m => {
      if (!m.active) return;
      ctx.save();
      ctx.translate(m.x, m.y);

      // Bóng tử khí đen kịt dưới máy
      ctx.fillStyle = 'rgba(5, 3, 8, 0.65)';
      ctx.beginPath();
      ctx.ellipse(0, 16, 26, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tay đẩy kim loại rỉ sét đen
      ctx.strokeStyle = '#455a64';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-30, -22);
      ctx.lineTo(-38, -20);
      ctx.stroke();

      // Bánh xe sắt gai nhọn hoắt
      ctx.fillStyle = '#10171a';
      ctx.beginPath();
      ctx.arc(-14, 12, 7.5, 0, Math.PI * 2);
      ctx.arc(14, 12, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Thân cỗ máy sắt đen bọc thép gai đẫm máu
      ctx.fillStyle = '#1c1b22';
      ctx.beginPath();
      ctx.roundRect(-22, -12, 44, 24, 5);
      ctx.fill();
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vết máu tươi bắn loang lổ trên thân máy
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(-18, -6, 28, 5);
      ctx.fillRect(-6, 2, 22, 4);

      // Đầu lâu kim loại phát sáng mắt đỏ gắn đầu xe
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.arc(16, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Mắt đỏ quỷ
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(18, -3, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Động cơ hơi nước hắc ám
      ctx.fillStyle = '#263238';
      ctx.fillRect(-6, -18, 14, 8);
      // Khói đen bốc lên
      ctx.fillStyle = 'rgba(20, 15, 25, 0.6)';
      ctx.beginPath();
      ctx.arc(-2, -24, 4, 0, Math.PI * 2);
      ctx.arc(-5, -30, 6, 0, Math.PI * 2);
      ctx.fill();

      // LƯỠI CƯA RĂNG GAI XOAY TÍT KHI ĐANG PHÓNG ĐI (Spinning Razor Blades)
      if (m.moving) {
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(22, 0, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
        ctx.beginPath();
        ctx.arc(22, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawPlant(ctx, plant) {
    // 1. Bóng tự nhiên dịu mát dưới gốc thực vật
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(plant.x, plant.y + 24, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Vẽ thực vật
    ctx.save();
    ctx.translate(plant.x, plant.y);

    this.drawPlantBody(ctx, plant);

    // Thanh tiến độ Skill 1 nhỏ trên đầu Galio + thanh máu khi bị thương (không chồng đè)
    const isDamaged = plant.hp < plant.maxHp && !plant.isRecharging;
    if (plant.type === 'galio') {
      const skillInterval = plant.skill1Interval || 5.0;
      const skillRatio = Math.max(0, Math.min(1, (plant.skill1Timer || 0) / skillInterval));
      this.drawGalioSkillBar(ctx, -16, -37, 32, 4, skillRatio);
      if (isDamaged) {
        this.drawHealthBar(ctx, -20, -45, 40, 5, plant.hp / plant.maxHp, '#ff1744');
      }
    } else if (plant.type === 'jhinplant' && !plant.isIcon) {
      this.drawJhinAmmoHud(ctx, plant);
      if (isDamaged) {
        this.drawHealthBar(ctx, -20, -47, 40, 5, plant.hp / plant.maxHp, '#ff1744');
      }
    } else if (isDamaged) {
      this.drawHealthBar(ctx, -20, -38, 40, 5, plant.hp / plant.maxHp, '#ff1744');
    }

    ctx.restore();

    // Vẽ Đám mây sấm sét Plant Food của Sậy Sét (Lightning Reed)
    if (plant.stormCloud) {
      this.drawStormCloud(ctx, plant.stormCloud);
    }
  }

  drawPlantBody(ctx, plant) {
    if (plant.type === 'sunflower') {
      this.drawSunflowerGraphics(ctx, plant);
    } else if (plant.type === 'peashooter') {
      this.drawPeashooterGraphics(ctx, plant);
    } else if (plant.type === 'snow_pea') {
      this.drawSnowPeaGraphics(ctx, plant);
    } else if (plant.type === 'repeater') {
      this.drawRepeaterGraphics(ctx, plant);
    } else if (plant.type === 'cabbage_pult') {
      this.drawCabbagePultGraphics(ctx, plant);
    } else if (plant.type === 'melon_pult') {
      this.drawMelonPultGraphics(ctx, plant);
    } else if (plant.type === 'bonk_choy') {
      this.drawBonkChoyGraphics(ctx, plant);
    } else if (plant.type === 'snapdragon') {
      this.drawSnapdragonGraphics(ctx, plant);
    } else if (plant.type === 'wall_nut') {
      this.drawWallNutGraphics(ctx, plant);
    } else if (plant.type === 'cherry_bomb') {
      this.drawCherryBombGraphics(ctx, plant);
    } else if (plant.type === 'chomper') {
      this.drawChomperGraphics(ctx, plant);
    } else if (plant.type === 'lightning_reed') {
      this.drawLightningReedGraphics(ctx, plant);
    } else if (plant.type === 'stunion') {
      this.drawStunionGraphics(ctx, plant);
    } else if (plant.type === 'infi_nut') {
      this.drawInfiNutGraphics(ctx, plant);
    } else if (plant.type === 'sun_shroom') {
      this.drawSunShroomGraphics(ctx, plant);
    } else if (plant.type === 'goo_peashooter') {
      this.drawGooPeashooterGraphics(ctx, plant);
    } else if (plant.type === 'hypno_shroom') {
      this.drawHypnoShroomGraphics(ctx, plant);
    } else if (plant.type === 'potato_mine') {
      this.drawPotatoMineGraphics(ctx, plant);
    } else if (plant.type === 'magnet_shroom') {
      this.drawMagnetShroomGraphics(ctx, plant);
    } else if (plant.type === 'tall_nut') {
      this.drawTallNutGraphics(ctx, plant);
    } else if (plant.type === 'kernel_pult') {
      this.drawKernelPultGraphics(ctx, plant);
    } else if (plant.type === 'spikeweed') {
      this.drawSpikeweedGraphics(ctx, plant);
    } else if (plant.type === 'spring_bean') {
      this.drawSpringBeanGraphics(ctx, plant);
    } else if (plant.type === 'iceberg_lettuce') {
      this.drawIcebergLettuceGraphics(ctx, plant);
    } else if (plant.type === 'fume_shroom') {
      this.drawFumeShroomGraphics(ctx, plant);
    } else if (plant.type === 'laser_bean') {
      this.drawLaserBeanGraphics(ctx, plant);
    } else if (plant.type === 'squash') {
      this.drawSquashGraphics(ctx, plant);
    } else if (plant.type === 'galio') {
      this.drawGalioGraphics(ctx, plant);
    } else if (plant.type === 'jhinplant') {
      this.drawJhinplantGraphics(ctx, plant);
    } else {
      this.drawGenericPlantGraphics(ctx, plant);
    }
  }

  drawStormCloud(ctx, cloud) {
    ctx.save();
    ctx.translate(cloud.x, cloud.y);
    // Đám mây giông bão xám đậm
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(-16, 0, 14, 0, Math.PI * 2);
    ctx.arc(0, -6, 18, 0, Math.PI * 2);
    ctx.arc(16, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Viền sấm sét phát sáng cyan
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tia chớp nhỏ dưới đáy mây giật sét
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(2, 14); ctx.lineTo(-1, 14); ctx.lineTo(3, 20);
    ctx.lineTo(-2, 16); ctx.lineTo(0, 16); ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 1. Sậy Sét (Lightning Reed - PvZ 2 Style)
  drawLightningReedGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 4.0;
    const sway = Math.sin(time) * 1.8;
    const isAttacking = plant.state === 'shooting';

    // Rễ cây lá cỏ tươi tốt bám đất
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(-8, 20, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(8, 20, 8, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 3 thân sậy mảnh mai màu xanh lục tươi
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';

    // Nhánh trái
    ctx.beginPath();
    ctx.moveTo(-3, 20);
    ctx.quadraticCurveTo(-10, 6, -8 + sway * 0.7, -4);
    ctx.stroke();

    // Nhánh phải
    ctx.beginPath();
    ctx.moveTo(3, 20);
    ctx.quadraticCurveTo(10, 6, 8 + sway * 0.7, -4);
    ctx.stroke();

    // Thân chính giữa
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(sway * 0.5, 4, sway, -14);
    ctx.stroke();

    // Bông sậy điện & chỏm tích điện phát sáng cyan
    ctx.fillStyle = '#e0f7fa';
    ctx.beginPath();
    ctx.arc(sway, -16, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Cuộn dây kim loại dẫn sét màu vàng kim
    ctx.strokeStyle = '#fbc02d';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(sway, -16, 12, -0.8, 0.8);
    ctx.stroke();

    // Quả cầu năng lượng sấm sét phát sáng rực rỡ
    const pulse = 1.0 + Math.sin(time * 2) * 0.15;
    ctx.fillStyle = isAttacking ? '#00e5ff' : '#18ffff';
    ctx.beginPath();
    ctx.arc(sway, -16, 5.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Tia sét nhỏ crackling trên đỉnh đầu
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sway - 2, -26);
    ctx.lineTo(sway + 3, -20);
    ctx.lineTo(sway, -20);
    ctx.lineTo(sway + 4, -14);
    ctx.stroke();

    // Đôi mắt hoạt hình dễ thương
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sway - 3, -16, 2.8, 0, Math.PI * 2);
    ctx.arc(sway + 3, -16, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#006064';
    ctx.beginPath();
    ctx.arc(sway - 2.5, -16, 1.5, 0, Math.PI * 2);
    ctx.arc(sway + 3.5, -16, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sway - 3, -17, 0.8, 0, Math.PI * 2);
    ctx.arc(sway + 3, -17, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Hành Choáng (Stunion - PvZ 2 Style)
  drawStunionGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const squish = Math.sin(time) * 0.06;

    ctx.save();
    ctx.scale(1 + squish, 1 - squish);

    // Rễ củ hành nhỏ bám đất
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-5, 18); ctx.lineTo(-7, 24);
    ctx.moveTo(0, 18); ctx.lineTo(0, 25);
    ctx.moveTo(5, 18); ctx.lineTo(7, 24);
    ctx.stroke();

    // Củ hành tròn múp míp màu vàng ấm
    const onionGrad = ctx.createRadialGradient(-3, 2, 3, 0, 4, 18);
    onionGrad.addColorStop(0, '#fff59d');
    onionGrad.addColorStop(0.5, '#fbc02d');
    onionGrad.addColorStop(1, '#f57f17');
    ctx.fillStyle = onionGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Các đường vân múi hành cong tự nhiên
    ctx.strokeStyle = 'rgba(230, 81, 0, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(-6, 4, 7, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(6, 4, 7, 16, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Chùm lá mầm xanh non tươi tắn trên đỉnh đầu
    ctx.fillStyle = '#7cb342';
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.quadraticCurveTo(-10, -26, -5, -28);
    ctx.quadraticCurveTo(-2, -18, 0, -13);
    ctx.quadraticCurveTo(2, -18, 5, -28);
    ctx.quadraticCurveTo(10, -26, 0, -13);
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Má hồng đáng yêu
    ctx.fillStyle = 'rgba(255, 112, 67, 0.55)';
    ctx.beginPath();
    ctx.arc(-9, 7, 3, 0, Math.PI * 2);
    ctx.arc(9, 7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt to tròn ngái ngủ ngộ nghĩnh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-5, 2, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(5, 2, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Con ngươi to đen láy
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(-4, 2.5, 2.5, 0, Math.PI * 2);
    ctx.arc(6, 2.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Đốm sáng long lanh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, 1.5, 1.0, 0, Math.PI * 2);
    ctx.arc(5, 1.5, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Miệng cười nhỏ chúm chím
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 9, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();
  }

  // 3. Hạt Dẻ Hologram (Infi-nut - PvZ 2 Sci-Fi Style)
  drawInfiNutGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const pulse = Math.sin(time) * 0.08;

    // Bệ máy chiếu công nghệ tương lai bằng kim loại titan
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.roundRect(-18, 16, 36, 10, 4);
    ctx.fill();
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Đèn LED hiển thị trạng thái
    ctx.fillStyle = plant.isRecharging ? '#ffca28' : '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, 21, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (plant.isRecharging) {
      // Đang tái nạp: Vòng xoay nạp hologram 15s hồi sinh
      const remainingSec = Math.max(1, Math.ceil(plant.rechargeTimer || 0));
      const progress = 1 - Math.max(0, Math.min(1, (plant.rechargeTimer || 0) / 15.0));

      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 6, 16, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();

      // Nón tia chiếu hologram nhẹ
      ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.beginPath();
      ctx.moveTo(-12, 16); ctx.lineTo(12, 16); ctx.lineTo(16, -2); ctx.lineTo(-16, -2);
      ctx.closePath();
      ctx.fill();

      // Đồng hồ đếm ngược 15s
      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${remainingSec}s`, 0, -6);
      ctx.restore();
      return;
    }

    // Hologram Hạt Dẻ màu xanh ngọc Cyan trong suốt
    ctx.save();
    ctx.globalAlpha = 0.82 + pulse;

    // Luồng ánh sáng phát chiếu từ bệ máy
    const beamGrad = ctx.createLinearGradient(0, 16, 0, -18);
    beamGrad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
    beamGrad.addColorStop(1, 'rgba(0, 229, 255, 0.08)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-14, 16); ctx.lineTo(14, 16); ctx.lineTo(18, -18); ctx.lineTo(-18, -18);
    ctx.closePath();
    ctx.fill();

    // Thân hạt dẻ Hologram phát quang
    ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.beginPath();
    ctx.roundRect(-15, -18, 30, 34, 12);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Các đường quét scanline kỹ thuật số
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-12, -10 + Math.sin(time * 4) * 8);
    ctx.lineTo(12, -10 + Math.sin(time * 4) * 8);
    ctx.moveTo(-12, -2 + Math.sin(time * 4) * 8);
    ctx.lineTo(12, -2 + Math.sin(time * 4) * 8);
    ctx.stroke();

    // Mắt hologram vui vẻ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -6, 3, 0, Math.PI * 2);
    ctx.arc(5, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#006064';
    ctx.beginPath();
    ctx.arc(-4.5, -6, 1.8, 0, Math.PI * 2);
    ctx.arc(5.5, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Nụ cười hologram
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -1, 3.5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.restore();
  }

  // 4. Nấm Mặt Trời (Sun-shroom - PvZ 2 Style)
  drawSunShroomGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const sway = Math.sin(time) * 1.1;
    const stage = plant.stage || 1;
    const scale = stage === 1 ? 0.78 : (stage === 2 ? 1.0 : 1.22);

    ctx.save();
    ctx.scale(scale, scale);

    // Hào quang vàng ấm áp khi sắp sản xuất mặt trời
    if (plant.glow && plant.glow > 0) {
      ctx.fillStyle = `rgba(255, 235, 59, ${plant.glow * 0.5})`;
      ctx.beginPath();
      ctx.arc(sway, -2, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chân cuống nấm mũm mĩm màu kem ngà
    const stalkGrad = ctx.createLinearGradient(-9, 0, 9, 22);
    stalkGrad.addColorStop(0, '#fffde7');
    stalkGrad.addColorStop(0.6, '#fff3cd');
    stalkGrad.addColorStop(1, '#ffe082');
    ctx.fillStyle = stalkGrad;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.quadraticCurveTo(-11, 14, -8, 21);
    ctx.quadraticCurveTo(0, 23, 8, 21);
    ctx.quadraticCurveTo(11, 14, 8, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9822b';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Mặt dưới vành mũ nấm (Bóng gân nấm màu cam ấm)
    ctx.fillStyle = '#e69500';
    ctx.beginPath();
    ctx.ellipse(sway, 1, 20, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b26a00';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Mũ nấm hình ô loe lượn sóng màu vàng rực rỡ
    const capGrad = ctx.createRadialGradient(sway - 4, -12, 2, sway, -4, 23);
    capGrad.addColorStop(0, '#ffff8d');
    capGrad.addColorStop(0.45, '#ffd54f');
    capGrad.addColorStop(0.85, '#ffb300');
    capGrad.addColorStop(1, '#f57c00');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.moveTo(sway - 21, 1);
    ctx.bezierCurveTo(sway - 22, -16, sway - 10, -21, sway, -21);
    ctx.bezierCurveTo(sway + 10, -21, sway + 22, -16, sway + 21, 1);
    ctx.bezierCurveTo(sway + 12, 4, sway + 5, 2, sway, 3);
    ctx.bezierCurveTo(sway - 5, 2, sway - 12, 4, sway - 21, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Các đốm tròn kem sáng ấm trên mũ nấm
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.ellipse(sway - 10, -6, 3.6, 2.8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(sway + 10, -6, 3.6, 2.8, 0.3, 0, Math.PI * 2);
    ctx.arc(sway - 1, -13, 3.3, 0, Math.PI * 2);
    ctx.arc(sway + 6, -12, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt (Stage 1: Mắt lim dim ngái ngủ; Stage 2+: Mắt mở to sáng rạng rỡ)
    if (stage === 1) {
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sway - 4.2, 10, 2.8, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sway + 4.2, 10, 2.8, 0.15, Math.PI - 0.15);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(sway - 4.2, 10, 3.3, 4.2, 0, 0, Math.PI * 2);
      ctx.ellipse(sway + 4.2, 10, 3.3, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(sway - 3.6, 10, 2.0, 0, Math.PI * 2);
      ctx.arc(sway + 4.8, 10, 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sway - 4.5, 8.8, 1.0, 0, Math.PI * 2);
      ctx.arc(sway + 3.9, 8.8, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Má hồng và nụ cười nhỏ
    ctx.fillStyle = 'rgba(255, 112, 67, 0.45)';
    ctx.beginPath();
    ctx.arc(sway - 7.5, 13.5, 2.0, 0, Math.PI * 2);
    ctx.arc(sway + 7.5, 13.5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sway, 14.5, 2.6, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.restore();
  }

  // 5. Đậu Độc (Goo Peashooter - PvZ 2 Style)
  drawGooPeashooterGraphics(ctx, plant) {
    const isShooting = plant.state === 'shooting';
    const squishX = isShooting ? 1.25 : 1.0;
    const squishY = isShooting ? 0.82 : 1.0;
    const time = (plant.animTime || 0) * 3.5;
    const sway = Math.sin(time) * 1.5;

    // Rễ cây lá tím uốn lượn mềm mại
    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7b1fa2';
    ctx.beginPath();
    ctx.ellipse(-10, 21, 8, 4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 21, 8, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây màu tím đậm
    ctx.strokeStyle = '#6a1b9a';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(-4, 8, sway * 0.5, -2);
    ctx.stroke();

    // Đầu Đậu Độc màu tím bóng bẩy
    ctx.save();
    ctx.translate(sway, -6);
    ctx.scale(squishX, squishY);

    // Chiếc lá cong điệu đà sau gáy
    ctx.fillStyle = '#9c27b0';
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.quadraticCurveTo(-22, -12, -18, 0);
    ctx.quadraticCurveTo(-14, 2, -8, 2);
    ctx.closePath();
    ctx.fill();

    // Đầu tròn tím bóng mượt
    const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
    headGrad.addColorStop(0, '#ce93d8');
    headGrad.addColorStop(0.5, '#ab47bc');
    headGrad.addColorStop(1, '#6a1b9a');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a148c';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Nòng bắn màu xanh nõn chuối ngọc phát quang (Toxic Lime Spout)
    const snoutGrad = ctx.createLinearGradient(10, -8, 22, 8);
    snoutGrad.addColorStop(0, '#b2ff59');
    snoutGrad.addColorStop(1, '#64dd17');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(15, 0, 6.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Họng súng sâu
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.ellipse(15, 0, 3.5, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Giọt chất độc xanh lá bóng rỉ ở mép họng
    ctx.fillStyle = '#76ff03';
    ctx.beginPath();
    ctx.arc(19, 5 + Math.sin(time * 3) * 1.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt to tròn hoạt hình ngộ nghĩnh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, -5, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#311b92';
    ctx.beginPath();
    ctx.arc(4, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.5, -6, 1.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. Hướng Dương (Sunflower - PvZ 2 Style)
  drawSunflowerGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const sway = Math.sin(time) * 1.5;

    // Rễ và lá cỏ xanh mướt bám đất
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(-10, 21, 9, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 21, 9, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây xanh mềm mại đung đưa
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(sway * 0.5, 10, sway, 0);
    ctx.stroke();

    // Hai chiếc lá xanh mượt hai bên thân
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(sway - 7, 12, 7, 3.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(sway + 7, 12, 7, 3.5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Hào quang vàng óng ả khi chuẩn bị sinh mặt trời
    if (plant.glow && plant.glow > 0) {
      ctx.save();
      ctx.globalAlpha = plant.glow * 0.55;
      const sunGlow = ctx.createRadialGradient(sway, -2, 4, sway, -2, 32);
      sunGlow.addColorStop(0, '#fff59d');
      sunGlow.addColorStop(0.6, '#ffd54f');
      sunGlow.addColorStop(1, 'rgba(255, 179, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sway, -2, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 16 Cánh hoa vàng rực rỡ xếp tròn đều quanh nhụy
    const petalCount = 16;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i * Math.PI * 2) / petalCount + Math.sin(time * 0.8) * 0.05;
      const px = sway + Math.cos(angle) * 17;
      const py = -2 + Math.sin(angle) * 17;

      // Cánh hoa bầu tròn với gradient vàng tươi
      ctx.fillStyle = i % 2 === 0 ? '#fbc02d' : '#fdd835';
      ctx.beginPath();
      ctx.arc(px, py, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // Nhụy hoa tròn màu nâu ấm áp (Warm caramel seed disc)
    const faceGrad = ctx.createRadialGradient(sway - 3, -5, 2, sway, -2, 14);
    faceGrad.addColorStop(0, '#8d6e63');
    faceGrad.addColorStop(0.7, '#6d4c41');
    faceGrad.addColorStop(1, '#4e342e');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(sway, -2, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Hai đốm má hồng cam dễ thương
    ctx.fillStyle = 'rgba(255, 138, 101, 0.6)';
    ctx.beginPath();
    ctx.arc(sway - 7, 2, 2.8, 0, Math.PI * 2);
    ctx.arc(sway + 7, 2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt to tròn đen láy với đốm sáng long lanh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(sway - 4, -3, 3.2, 4.2, 0, 0, Math.PI * 2);
    ctx.ellipse(sway + 4, -3, 3.2, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(sway - 3.8, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(sway + 4.2, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Đốm sáng tinh nghịch
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sway - 4.5, -4, 1.1, 0, Math.PI * 2);
    ctx.arc(sway + 3.5, -4, 1.1, 0, Math.PI * 2);
    ctx.arc(sway - 3.2, -2, 0.6, 0, Math.PI * 2);
    ctx.arc(sway + 4.8, -2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Nụ cười tươi rói thân thiện
    ctx.strokeStyle = '#271005';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(sway, 2, 3.8, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // 7. Đậu Bắn Súng (Peashooter - PvZ 2 Style)
  drawPeashooterGraphics(ctx, plant) {
    const isShooting = plant.state === 'shooting';
    const squishX = isShooting ? 1.28 : 1.0;
    const squishY = isShooting ? 0.82 : 1.0;
    const time = (plant.animTime || 0) * 3.5;
    const sway = Math.sin(time) * 1.5;

    // Rễ cây bám đất
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(-10, 21, 9, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 21, 9, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây xanh bóng uốn lượn
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(-4, 10, sway * 0.5, -2);
    ctx.stroke();

    // Đầu hạt đậu tròn trịa
    ctx.save();
    ctx.translate(sway, -6);
    ctx.scale(squishX, squishY);

    // Chiếc lá nhỏ cong vuốt sau gáy
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.quadraticCurveTo(-22, -14, -18, 0);
    ctx.quadraticCurveTo(-14, 2, -8, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đầu tròn màu xanh nõn chuối mượt mà
    const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
    headGrad.addColorStop(0, '#81c784');
    headGrad.addColorStop(0.5, '#4caf50');
    headGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Nòng bắn hình trụ tròn
    const snoutGrad = ctx.createLinearGradient(10, -8, 22, 8);
    snoutGrad.addColorStop(0, '#66bb6a');
    snoutGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(15, 0, 6.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Miệng nòng sâu bên trong
    ctx.fillStyle = '#0f3a14';
    ctx.beginPath();
    ctx.ellipse(15, 0, 3.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt to tròn hoạt hình ngộ nghĩnh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, -5, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(4, -5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    // Đốm sáng phản chiếu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.5, -6, 1.1, 0, Math.PI * 2);
    ctx.arc(4.8, -4, 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 8. Đậu Băng (Snow Pea - PvZ 2 Style) ---
  drawSnowPeaGraphics(ctx, plant) {
    const isShooting = plant.state === 'shooting';
    const squishX = isShooting ? 1.28 : 1.0;
    const squishY = isShooting ? 0.82 : 1.0;
    const time = (plant.animTime || 0) * 3.5;
    const sway = Math.sin(time) * 1.5;

    // Rễ cây bám đất
    ctx.fillStyle = '#006064';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00838f';
    ctx.beginPath();
    ctx.ellipse(-10, 21, 9, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 21, 9, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây xanh băng lạnh
    ctx.strokeStyle = '#00acc1';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(-4, 10, sway * 0.5, -2);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway, -6);
    ctx.scale(squishX, squishY);

    // Chùm gai băng pha lê sắc nhọn phía sau gáy
    ctx.fillStyle = '#b2ebf2';
    ctx.beginPath();
    ctx.moveTo(-10, -14); ctx.lineTo(-24, -20); ctx.lineTo(-14, -8);
    ctx.moveTo(-8, -6); ctx.lineTo(-22, -6); ctx.lineTo(-10, 2);
    ctx.moveTo(-8, 2); ctx.lineTo(-18, 8); ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đầu hình cầu băng ngọc xanh biếc rực rỡ
    const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
    headGrad.addColorStop(0, '#e0f7fa');
    headGrad.addColorStop(0.5, '#4dd0e1');
    headGrad.addColorStop(1, '#00838f');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#006064';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Nòng bắn đạn băng pha lê
    const snoutGrad = ctx.createLinearGradient(10, -8, 22, 8);
    snoutGrad.addColorStop(0, '#80deea');
    snoutGrad.addColorStop(1, '#00acc1');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(15, 0, 6.5, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#006064';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Họng súng băng sâu
    ctx.fillStyle = '#004d40';
    ctx.beginPath();
    ctx.ellipse(15, 0, 3.8, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt xanh băng sáng long lanh
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, -5, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#006064';
    ctx.beginPath();
    ctx.arc(4, -5, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#80deea';
    ctx.beginPath();
    ctx.arc(3.5, -6, 1.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- 9. Đậu Nòng Đôi (Repeater - PvZ 2 Style) ---
  drawRepeaterGraphics(ctx, plant) {
    const isShooting = plant.state === 'shooting';
    const squishX = isShooting ? 1.28 : 1.0;
    const squishY = isShooting ? 0.82 : 1.0;
    const time = (plant.animTime || 0) * 3.5;
    const sway = Math.sin(time) * 1.5;

    // Rễ cây bám đất
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.ellipse(0, 22, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(-10, 21, 9, 4.5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(10, 21, 9, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Thân cây xanh lục đậm
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(-4, 10, sway * 0.5, -2);
    ctx.stroke();

    ctx.save();
    ctx.translate(sway, -6);
    ctx.scale(squishX, squishY);

    // 2 chiếc lá mào gập nhọn ngầu phía sau (Iconic Repeater Mohawk)
    ctx.fillStyle = '#388e3c';
    ctx.beginPath();
    ctx.moveTo(-10, -14); ctx.lineTo(-24, -22); ctx.lineTo(-12, -8);
    ctx.moveTo(-8, -6); ctx.lineTo(-22, -10); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Đầu hạt đậu màu xanh ngọc bích đậm
    const headGrad = ctx.createRadialGradient(-3, -3, 3, 0, 0, 16);
    headGrad.addColorStop(0, '#66bb6a');
    headGrad.addColorStop(0.5, '#2e7d32');
    headGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d3813';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Nòng bắn kép kiên cố
    const snoutGrad = ctx.createLinearGradient(10, -8, 24, 8);
    snoutGrad.addColorStop(0, '#4caf50');
    snoutGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(16, 0, 7.5, 9.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d3813';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Họng súng sâu
    ctx.fillStyle = '#061d09';
    ctx.beginPath();
    ctx.ellipse(16, 0, 4.2, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt kiên định, tự tin ngầu lòi
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(3, -5, 4, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.arc(4, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.5, -6, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Lông mày nghiêm nghị, quyết đoán
    ctx.strokeStyle = '#0d3813';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, -8);
    ctx.stroke();

    ctx.restore();
  }

  // --- 10. Bắp Cải (Cabbage-pult - PvZ 2 Style) ---
  drawCabbagePultGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const isShooting = plant.state === 'shooting';
    const armAngle = isShooting ? 0.55 : -0.15 + Math.sin(time) * 0.06;
    const bob = Math.sin(time) * 1.0;

    ctx.save();

    // 1. Đài lá bắp cải xòe xanh đậm bám đất
    ctx.fillStyle = '#2e7d32';
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.5;
    for (const leaf of [{ x: -13, y: 17, rx: 11, ry: 5.5, a: -0.35 }, { x: 13, y: 17, rx: 11, ry: 5.5, a: 0.35 }, { x: 0, y: 19, rx: 13, ry: 5.5, a: 0 }]) {
      ctx.beginPath();
      ctx.ellipse(leaf.x, leaf.y, leaf.rx, leaf.ry, leaf.a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. Cuống dây leo máy bắn đá vươn lên từ sau thân bắp cải
    ctx.save();
    ctx.translate(-4, 4 + bob);
    ctx.rotate(armAngle);

    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(-14, -10, -14, -24);
    ctx.stroke();

    // Đài lá đỡ bắp cải trên đầu cần bắn
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(-14, -22, 10, 4.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Quả bắp cải đạn nằm gọn trong chén lá (giống hệt đạn bắp cải)
    const ammoGrad = ctx.createRadialGradient(-16, -29, 1.5, -14, -27, 9);
    ammoGrad.addColorStop(0, '#e8f5e9');
    ammoGrad.addColorStop(0.5, '#81c784');
    ammoGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = ammoGrad;
    ctx.beginPath();
    ctx.arc(-14, -27, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Đường gân lá cuộn tròn trên quả bắp cải đạn
    ctx.strokeStyle = '#c8e6c9';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-15, -27, 5, -0.5, 2.4);
    ctx.moveTo(-10, -31); ctx.quadraticCurveTo(-14, -26, -19, -29);
    ctx.stroke();

    ctx.restore();

    // 3. Thân chính: Bắp Cải tròn múp nhiều tầng lá xanh non cuộn chặt
    ctx.save();
    ctx.translate(2, 6 + bob);

    const cabGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, 17);
    cabGrad.addColorStop(0, '#c8e6c9');
    cabGrad.addColorStop(0.55, '#81c784');
    cabGrad.addColorStop(1, '#388e3c');
    ctx.fillStyle = cabGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // Lớp lá bắp cải cuộn ôm 2 bên & gân lá trắng xanh nhạt đặc trưng
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-5, 2, -6, 13);
    ctx.moveTo(14, -3); ctx.quadraticCurveTo(6, 2, 7, 13);
    ctx.stroke();

    ctx.strokeStyle = '#e8f5e9';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-4, -12, 3, -10);
    ctx.moveTo(-12, 2); ctx.quadraticCurveTo(-8, 6, -5, 11);
    ctx.stroke();

    // Chỏm lá xoăn trên đỉnh đầu bắp cải
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.ellipse(-2, -13, 6, 3.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đôi mắt to tròn thân thiện nhìn sang phải
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-1, -1, 3.4, 4.2, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -1, 3.4, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.fillStyle = '#1b2621';
    ctx.beginPath();
    ctx.arc(0, -1, 1.9, 0, Math.PI * 2);
    ctx.arc(8, -1, 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-0.8, -2.2, 0.9, 0, Math.PI * 2);
    ctx.arc(7.2, -2.2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Nụ cười tự tin
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(3.5, 4.5, 3.2, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  // --- 11. Dưa Hấu (Melon-pult - PvZ 2 Style) ---
  drawMelonPultGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 2.8;
    const isShooting = plant.state === 'shooting';
    const armAngle = isShooting ? 0.55 : -0.14 + Math.sin(time) * 0.05;
    const bob = Math.sin(time) * 0.9;

    ctx.save();

    // 1. Đế lá dưa hấu bản to xanh thẫm bám đất
    ctx.fillStyle = '#1b5e20';
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 1.5;
    for (const leaf of [{ x: -15, y: 18, rx: 12, ry: 5, a: -0.3 }, { x: 15, y: 18, rx: 12, ry: 5, a: 0.3 }, { x: 0, y: 20, rx: 14, ry: 5, a: 0 }]) {
      ctx.beginPath();
      ctx.ellipse(leaf.x, leaf.y, leaf.rx, leaf.ry, leaf.a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 2. Cần dây leo chắc khỏe phía sau nâng quả dưa hấu đạn
    ctx.save();
    ctx.translate(-5, 3 + bob);
    ctx.rotate(armAngle);

    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.quadraticCurveTo(-15, -10, -14, -24);
    ctx.stroke();

    // Giá đỡ lá & gỗ nhỏ
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.ellipse(-14, -22, 11, 4.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Quả dưa hấu đạn to tròn có sọc xanh đậm rõ rệt
    const ammoMelonGrad = ctx.createRadialGradient(-16, -30, 2, -14, -28, 12);
    ammoMelonGrad.addColorStop(0, '#a5d6a7');
    ammoMelonGrad.addColorStop(0.45, '#43a047');
    ammoMelonGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = ammoMelonGrad;
    ctx.beginPath();
    ctx.ellipse(-14, -28, 11.5, 9, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Sọc zíc-zắc dưa hấu đậm nét trên đạn
    ctx.strokeStyle = '#0d3b12';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-22, -29); ctx.quadraticCurveTo(-14, -34, -6, -30);
    ctx.moveTo(-23, -26); ctx.quadraticCurveTo(-14, -26, -5, -27);
    ctx.moveTo(-21, -23); ctx.quadraticCurveTo(-14, -20, -7, -24);
    ctx.stroke();

    ctx.restore();

    // 3. Thân chính: Quả Dưa Hấu khổng lồ múp míp có sọc vằn đặc trưng
    ctx.save();
    ctx.translate(2, 6 + bob);

    const bodyGrad = ctx.createRadialGradient(-5, -5, 3, 0, 0, 20);
    bodyGrad.addColorStop(0, '#81c784');
    bodyGrad.addColorStop(0.5, '#388e3c');
    bodyGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // Các dải sọc dọc đậm đặc trưng của quả dưa hấu
    ctx.strokeStyle = '#0d3b12';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, -11); ctx.quadraticCurveTo(-15, 0, -11, 12);
    ctx.moveTo(-4, -14); ctx.quadraticCurveTo(-6, -1, -3, 14);
    ctx.moveTo(5, -14); ctx.quadraticCurveTo(3, -1, 6, 14);
    ctx.moveTo(13, -10); ctx.quadraticCurveTo(16, 0, 12, 11);
    ctx.stroke();

    // Đốm sáng bóng trên vỏ dưa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-6, -9, 6, 2.4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Khuôn mặt ngầu lòi điềm tĩnh trên thân dưa hấu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -1, 3.6, 4.3, 0, 0, Math.PI * 2);
    ctx.ellipse(9, -1, 3.6, 4.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Lông mày điềm tĩnh hơi nhíu
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-4, -6); ctx.lineTo(3, -4.5);
    ctx.moveTo(13, -6); ctx.lineTo(6, -4.5);
    ctx.stroke();

    ctx.fillStyle = '#1b2621';
    ctx.beginPath();
    ctx.arc(1.2, -0.8, 2.0, 0, Math.PI * 2);
    ctx.arc(10.2, -0.8, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0.4, -2.0, 0.9, 0, Math.PI * 2);
    ctx.arc(9.4, -2.0, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Miệng mỉm tự tin
    ctx.strokeStyle = '#0a330e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, 6);
    ctx.quadraticCurveTo(5.5, 8, 9, 5.5);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  // --- 12. Đấm Bốc (Bonk Choy - PvZ 2 Style) ---
  drawBonkChoyGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 4.0;
    const isPunching = plant.state === 'shooting' || (plant.punchAnimTimer && plant.punchAnimTimer > 0);
    const punchPhase = Math.sin(time * 3);
    const jabProgress = plant.punchAnimTimer > 0 ? Math.min(1, plant.punchAnimTimer / 0.16) : 0;
    const jabBoost = jabProgress > 0 ? Math.sin(jabProgress * Math.PI) * 15 : 0;
    const frontOffset = (isPunching ? (punchPhase > 0 ? 13 : -3) : Math.sin(time) * 1.5) + jabBoost;
    const backOffset = isPunching ? (punchPhase <= 0 ? 12 : -3) : -Math.sin(time) * 1.5;

    ctx.save();
    if (plant.punchDir === -1) {
      ctx.scale(-1, 1);
    }

    // 1. Hai lá gốc xòe bám đất
    ctx.fillStyle = '#388e3c';
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(-10, 20, 9, 4, -0.25, 0, Math.PI * 2);
    ctx.ellipse(10, 20, 9, 4, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Nắm đấm tay sau (găng tay đấm bốc xanh lá vung phía sau / trái)
    ctx.save();
    ctx.translate(-14 + backOffset * 0.6, 2);
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.quadraticCurveTo(2, 5, -2, 0);
    ctx.stroke();

    // Cổ tay lá & găng đấm
    ctx.fillStyle = '#43a047';
    ctx.beginPath();
    ctx.ellipse(-3, 0, 7.5, 6.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // Ngón cái găng đấm
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.ellipse(1, -4, 3.2, 2.4, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Tán lá cải thìa xòe dựng đứng trên đỉnh đầu (Bok Choy Leaf Crown)
    const crestLeaves = [
      { x: -11, y: -15, rx: 6.5, ry: 11, rot: -0.45, c: '#2e7d32' },
      { x: 11, y: -15, rx: 6.5, ry: 11, rot: 0.45, c: '#2e7d32' },
      { x: -5, y: -18, rx: 6.5, ry: 12, rot: -0.18, c: '#43a047' },
      { x: 5, y: -18, rx: 6.5, ry: 12, rot: 0.18, c: '#43a047' },
      { x: 0, y: -19, rx: 6.5, ry: 12.5, rot: 0, c: '#66bb6a' }
    ];
    for (const lf of crestLeaves) {
      ctx.save();
      ctx.translate(lf.x, lf.y);
      ctx.rotate(lf.rot);
      ctx.fillStyle = lf.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, lf.rx, lf.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Gân lá sáng
      ctx.strokeStyle = '#a5d6a7';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, -7);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Thân bẹ cải thìa (thân bầu màu xanh nõn chuối -> xanh lá)
    const bodyGrad = ctx.createLinearGradient(0, -14, 0, 21);
    bodyGrad.addColorStop(0, '#66bb6a');
    bodyGrad.addColorStop(0.45, '#aed581');
    bodyGrad.addColorStop(1, '#dce775');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-11, -11);
    ctx.quadraticCurveTo(-15, 6, -10, 20);
    ctx.quadraticCurveTo(0, 23, 10, 20);
    ctx.quadraticCurveTo(15, 6, 11, -11);
    ctx.quadraticCurveTo(0, -14, -11, -11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Đường gân bẹ cải dọc thân
    ctx.strokeStyle = 'rgba(27, 94, 32, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-7, 14, -5, 20);
    ctx.moveTo(6, 6); ctx.quadraticCurveTo(7, 14, 5, 20);
    ctx.stroke();

    // 5. Đôi mắt & chân mày đấu sĩ quyết tâm
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4.5, -2, 3.6, 4.3, 0, 0, Math.PI * 2);
    ctx.ellipse(5.5, -2, 3.6, 4.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.fillStyle = '#1b2621';
    ctx.beginPath();
    ctx.arc(-3.6, -1.8, 2.0, 0, Math.PI * 2);
    ctx.arc(6.4, -1.8, 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.3, -3.0, 0.9, 0, Math.PI * 2);
    ctx.arc(5.7, -3.0, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Lông mày xếch quyết chiến
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 2.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8.5, -7); ctx.lineTo(-1, -4.5);
    ctx.moveTo(9.5, -7); ctx.lineTo(2, -4.5);
    ctx.stroke();

    // Miệng cười nhếch tự tin
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2.5, 5.5);
    ctx.quadraticCurveTo(2, 7.5, 6, 4.5);
    ctx.stroke();

    // 6. Nắm đấm tay trước (Găng đấm bốc lá to rõ phía trước / phải)
    ctx.save();
    ctx.translate(15 + frontOffset, 3);
    // Cánh tay nối
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10 - frontOffset * 0.5, 3);
    ctx.lineTo(-4, 1);
    ctx.stroke();

    // Khối găng đấm bốc to tròn chắc nịch
    const fistGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 10);
    fistGrad.addColorStop(0, '#a5d6a7');
    fistGrad.addColorStop(0.6, '#66bb6a');
    fistGrad.addColorStop(1, '#2e7d32');
    ctx.fillStyle = fistGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9.2, 8.2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ngón cái & đường chia khớp đốt ngón tay
    ctx.fillStyle = '#81c784';
    ctx.beginPath();
    ctx.ellipse(-2, -5.5, 4.2, 2.8, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b5e20';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3, -4); ctx.lineTo(3, 5);
    ctx.moveTo(6, -3); ctx.lineTo(6, 4);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // --- 13. Rồng Lửa (Snapdragon - PvZ 2 Style) ---
  drawSnapdragonGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 4.0;
    const isAttacking = plant.state === 'shooting';
    const sway = Math.sin(time) * 1.5;

    ctx.save();
    // Gốc rễ lá bám đất
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cổ rồng xanh lá mướt
    ctx.strokeStyle = '#43a047';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.quadraticCurveTo(-4, 6, sway * 0.5, -6);
    ctx.stroke();

    // Cánh rồng lá xanh 2 bên
    ctx.fillStyle = '#66bb6a';
    ctx.beginPath();
    ctx.ellipse(-10, 6, 8, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(10, 6, 8, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đầu hoa rồng lửa màu cam đỏ rực rỡ
    ctx.save();
    ctx.translate(sway, -8);

    // Mào gai rồng màu đỏ rực phía trên
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(-8, -12); ctx.lineTo(-14, -24); ctx.lineTo(-4, -16);
    ctx.lineTo(2, -26); ctx.lineTo(6, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đầu rồng màu cam lửa ấm áp
    const headGrad = ctx.createRadialGradient(-2, -4, 2, 0, 0, 16);
    headGrad.addColorStop(0, '#ffa726');
    headGrad.addColorStop(0.6, '#f57c00');
    headGrad.addColorStop(1, '#d84315');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Miệng rồng mở rộng phun lửa
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(12, 2, 7, -Math.PI / 3, Math.PI / 3);
    ctx.fill();

    // Hàng răng trắng nhỏ dễ thương
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(11, -3); ctx.lineTo(13, 0); ctx.lineTo(15, -3);
    ctx.moveTo(11, 5); ctx.lineTo(13, 2); ctx.lineTo(15, 5);
    ctx.fill();

    // Mắt rồng màu vàng rực sáng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(1, -4, 3.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.arc(1.5, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(2, -4, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Ánh lửa rực sáng trong khoang miệng khi chuẩn bị / đang phun lửa 3 hàng
    if (isAttacking) {
      const mouthGlow = ctx.createRadialGradient(13, 2, 1, 15, 2, 11);
      mouthGlow.addColorStop(0, '#fffde7');
      mouthGlow.addColorStop(0.45, '#ffca28');
      mouthGlow.addColorStop(1, 'rgba(255, 87, 34, 0)');
      ctx.fillStyle = mouthGlow;
      ctx.beginPath();
      ctx.arc(14, 2, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  // --- 8. Wall-nut (Hạt Dẻ Phòng Thủ 4000 HP - Chuẩn Hoạt Họa PvZ 2) ---
  drawWallNutGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 2.0;
    const hpRatio = Math.max(0, plant.hp / plant.maxHp);
    const isBadlyDamaged = hpRatio < 0.35;
    const isLightlyDamaged = hpRatio < 0.70;

    // Rung lắc nhẹ khi bị cắn / nguy cấp
    const shake = isBadlyDamaged ? (Math.sin(time * 6) * 1.5) : (Math.sin(time) * 0.8);
    ctx.save();
    ctx.translate(shake, 0);

    // 1. Thân củ hạt dẻ nâu bóng bẩy đặc trưng PvZ 2
    const nutGrad = ctx.createLinearGradient(-16, -24, 16, 22);
    nutGrad.addColorStop(0, '#d79551');
    nutGrad.addColorStop(0.45, '#b86d2d');
    nutGrad.addColorStop(1, '#7a3c10');

    ctx.fillStyle = nutGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -22, 32, 44, [16, 16, 13, 13]);
    ctx.fill();

    ctx.strokeStyle = '#4e2307';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Vệt sáng bóng phản chiếu ở gò đầu hạt dẻ
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-7, -13, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vết nứt vỏ quả theo nấc máu
    if (isLightlyDamaged) {
      ctx.strokeStyle = '#3d1b05';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-7, 4);
      ctx.stroke();
    }
    if (isBadlyDamaged) {
      ctx.strokeStyle = '#3d1b05';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(6, -12);
      ctx.lineTo(12, -4);
      ctx.lineTo(8, 6);
      ctx.lineTo(11, 14);
      ctx.stroke();

      // Giọt nước mắt sợ sệt hài hước
      ctx.fillStyle = '#64b5f6';
      ctx.beginPath();
      ctx.ellipse(-10, 2, 2.5, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Đôi mắt to tròn ngộ nghĩnh PvZ 2
    // Tròng trắng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-6, -6, 4.5, 6.2, 0.05, 0, Math.PI * 2);
    ctx.ellipse(6, -6, 4.5, 6.2, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4e2307';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Con ngươi đen nhìn sang phải
    ctx.fillStyle = '#1a0d05';
    ctx.beginPath();
    ctx.ellipse(-4.5, -5.5, 2.6, 3.8, 0, 0, Math.PI * 2);
    ctx.ellipse(7.5, -5.5, 2.6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng long lanh trong mắt
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.5, -7, 1.3, 0, Math.PI * 2);
    ctx.arc(6.5, -7, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // 4. Khuôn miệng biểu cảm
    ctx.strokeStyle = '#4e2307';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (isBadlyDamaged) {
      // Mếu máo
      ctx.arc(0, 11, 4.5, Math.PI * 1.15, Math.PI * 1.85);
    } else if (isLightlyDamaged) {
      // Bối rối
      ctx.moveTo(-3, 8);
      ctx.lineTo(3, 7);
    } else {
      // Cười mỉm tự tin
      ctx.arc(0, 5, 4.5, 0.15 * Math.PI, 0.85 * Math.PI);
    }
    ctx.stroke();

    // 5. Giáp sắt hiệp sĩ (Knight Armor) khi kích hoạt Plant Food (8000 HP)
    if (plant.hasArmor && plant.armorHp > 0) {
      // Thân giáp sắt viền vàng
      const armorGrad = ctx.createLinearGradient(-18, -24, 18, 24);
      armorGrad.addColorStop(0, '#eceff1');
      armorGrad.addColorStop(0.5, '#b0bec5');
      armorGrad.addColorStop(1, '#546e7a');

      ctx.fillStyle = armorGrad;
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-18, -24, 36, 48, 11);
      ctx.stroke();

      // Mũ giáp sắt hiệp sĩ có vành che trán
      ctx.beginPath();
      ctx.arc(0, -16, 18, Math.PI, 0);
      ctx.lineTo(18, -8);
      ctx.lineTo(-18, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Khe kính nhìn mắt giáp màu đen sâu thẳm
      ctx.fillStyle = '#1c2429';
      ctx.beginPath();
      ctx.roundRect(-12, -12, 24, 4, 2);
      ctx.fill();

      // Ánh mắt kiên cường phát sáng vàng bên trong khe kính
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(-5, -10, 1.5, 0, Math.PI * 2);
      ctx.arc(5, -10, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Huy hiệu kim loại vàng kim hoàng gia trên đỉnh trán
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#b78103';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -20, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- 9. Cherry Bomb (Quả Cherry Nổ 1800 DMG - PvZ 2 Sôi Động) ---
  drawCherryBombGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 12.0;
    const pulse = 1.0 + Math.sin(time) * 0.12;

    ctx.save();
    ctx.scale(pulse, pulse);

    // Cuống đôi màu xanh lá cây bóng uốn lượn nối 2 quả
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -2);
    ctx.quadraticCurveTo(-4, -20, 0, -26);
    ctx.moveTo(11, -1);
    ctx.quadraticCurveTo(4, -20, 0, -26);
    ctx.stroke();

    // Chiếc lá xanh mơn mởn ở đỉnh cuống
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(5, -28, 6, 3, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Ngòi nổ tia lửa điện bùng nổ trên đỉnh cuống
    const sparkRadius = 4 + Math.sin(time * 2) * 2;
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(0, -27, sparkRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(0, -27, sparkRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Quả cherry trái (Đỏ tươi mọng nước)
    const cherryGradLeft = ctx.createRadialGradient(-14, 0, 2, -11, 4, 14);
    cherryGradLeft.addColorStop(0, '#ff5252');
    cherryGradLeft.addColorStop(0.65, '#d50000');
    cherryGradLeft.addColorStop(1, '#880e4f');

    ctx.fillStyle = cherryGradLeft;
    ctx.beginPath();
    ctx.arc(-11, 4, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a0a20';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Quả cherry phải (Tức giận đồng pha)
    const cherryGradRight = ctx.createRadialGradient(8, 2, 2, 11, 6, 14);
    cherryGradRight.addColorStop(0, '#ff5252');
    cherryGradRight.addColorStop(0.65, '#d50000');
    cherryGradRight.addColorStop(1, '#880e4f');

    ctx.fillStyle = cherryGradRight;
    ctx.beginPath();
    ctx.arc(11, 6, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a0a20';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Vệt sáng bóng trên 2 quả cherry
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-15, 0, 3.5, 2.2, -0.4, 0, Math.PI * 2);
    ctx.ellipse(7, 2, 3.5, 2.2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Mắt cherry trái dữ dội
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-13, 3, 3.2, 0, Math.PI * 2);
    ctx.arc(-7, 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0006';
    ctx.beginPath();
    ctx.arc(-12, 3, 1.6, 0, Math.PI * 2);
    ctx.arc(-6.5, 3, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Chân mày nhăn nhó giận dữ trái
    ctx.strokeStyle = '#3e0310';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.lineTo(-6, 2);
    ctx.stroke();

    // Mắt cherry phải dữ dội
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 5, 2.6, 0, Math.PI * 2);
    ctx.arc(14, 5, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a0006';
    ctx.beginPath();
    ctx.arc(8.5, 5, 1.4, 0, Math.PI * 2);
    ctx.arc(13, 5, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Chân mày nhăn nhó phải
    ctx.strokeStyle = '#3e0310';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(6, 4); ctx.lineTo(16, 2);
    ctx.stroke();

    ctx.restore();
  }

  // --- 10. Chomper (Cây Ăn Thịt Nuốt Trọn 2400 DMG - PvZ 2 Sống Động) ---
  drawChomperGraphics(ctx, plant) {
    const isChewing = plant.isChewing;
    const time = (plant.animTime || 0) * (isChewing ? 5.5 : 2.5);
    const jawOpen = isChewing ? (Math.abs(Math.sin(time)) * 8) : 13;

    ctx.save();

    // 1. Đài hoa & lá xanh xòe rộng dưới gốc
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(-12, 18, 9, 4, -0.2, 0, Math.PI * 2);
    ctx.ellipse(12, 18, 9, 4, 0.2, 0, Math.PI * 2);
    ctx.ellipse(0, 20, 11, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Thân cây uốn lượn uyển chuyển
    const sway = Math.sin(time * 0.8) * 3;
    ctx.strokeStyle = '#388e3c';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(-6 + sway, 4, 2 + sway, -8);
    ctx.stroke();

    // 3. Đầu cây ăn thịt màu tím rực rỡ đặc trưng
    ctx.translate(2 + sway, -8);

    // Môi trên màu tím đậm
    const topHeadGrad = ctx.createRadialGradient(2, -8, 2, 4, -6, 17);
    topHeadGrad.addColorStop(0, '#ab47bc');
    topHeadGrad.addColorStop(0.65, '#7b1fa2');
    topHeadGrad.addColorStop(1, '#4a148c');

    ctx.fillStyle = topHeadGrad;
    ctx.beginPath();
    ctx.arc(4, -8, 16, -Math.PI * 0.55, Math.PI * 0.28);
    ctx.lineTo(2, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Môi dưới cử động khi há miệng / nhai ngấu nghiến
    const botHeadGrad = ctx.createRadialGradient(2, -6 + jawOpen, 2, 4, -4 + jawOpen, 16);
    botHeadGrad.addColorStop(0, '#ba68c8');
    botHeadGrad.addColorStop(0.65, '#8e24aa');
    botHeadGrad.addColorStop(1, '#4a148c');

    ctx.fillStyle = botHeadGrad;
    ctx.beginPath();
    ctx.arc(4, -8 + jawOpen, 15, -Math.PI * 0.25, Math.PI * 0.55);
    ctx.lineTo(2, -4 + jawOpen);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Hàng răng trắng ngà nhọn sắc bén
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    // Răng trên
    ctx.moveTo(4, -7); ctx.lineTo(8, -2); ctx.lineTo(12, -7);
    ctx.moveTo(12, -7); ctx.lineTo(16, -1); ctx.lineTo(19, -5);
    // Răng dưới
    ctx.moveTo(4, -7 + jawOpen); ctx.lineTo(8, -12 + jawOpen); ctx.lineTo(12, -7 + jawOpen);
    ctx.moveTo(12, -7 + jawOpen); ctx.lineTo(16, -13 + jawOpen); ctx.lineTo(19, -6 + jawOpen);
    ctx.fill();

    // Đôi mắt to tò mò trên đỉnh đầu
    ctx.fillStyle = '#fbc02d';
    ctx.beginPath();
    ctx.ellipse(-2, -14, 3.5, 4.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.fillStyle = '#1a237e';
    ctx.beginPath();
    ctx.arc(-1.5, -14, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-2, -15, 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 17. Nấm Thôi Miên (Hypno-shroom - PvZ 2 Psychedelic Style)
  drawHypnoShroomGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const pulse = 1.0 + Math.sin(time) * 0.04;

    ctx.save();
    ctx.scale(pulse, pulse);

    // 1. Thân nấm màu tím oải hương nhạt múp míp
    const stalkGrad = ctx.createLinearGradient(-9, 1, 9, 22);
    stalkGrad.addColorStop(0, '#f3e5f5');
    stalkGrad.addColorStop(0.6, '#e1bee7');
    stalkGrad.addColorStop(1, '#ce93d8');
    ctx.fillStyle = stalkGrad;
    ctx.beginPath();
    ctx.moveTo(-8, 1);
    ctx.quadraticCurveTo(-11, 14, -8, 21);
    ctx.quadraticCurveTo(0, 23, 8, 21);
    ctx.quadraticCurveTo(11, 14, 8, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6a1b9a';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 2. Đôi mắt xoáy thôi miên đặc trưng
    for (const ex of [-4.2, 4.2]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, 10.5, 3.6, 4.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6a1b9a';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Vòng xoáy thôi miên màu hồng tím bên trong mắt
      ctx.strokeStyle = '#d500f9';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ex, 10.5, 2.3, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.arc(ex, 10.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Miệng nhỏ mơ màng
    ctx.strokeStyle = '#7b1fa2';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 16, 2.0, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 3. Vành dưới mũ nấm
    ctx.fillStyle = '#7b1fa2';
    ctx.beginPath();
    ctx.ellipse(0, 1, 20, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Mũ nấm hình vòm ảo giác nhiều dải màu rực rỡ (Tím / Hồng / Cyan)
    const capGrad = ctx.createRadialGradient(0, -10, 2, 0, -4, 22);
    capGrad.addColorStop(0, '#ff80ab');
    capGrad.addColorStop(0.45, '#d500f9');
    capGrad.addColorStop(0.8, '#8e24aa');
    capGrad.addColorStop(1, '#4a148c');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.moveTo(-21, 1);
    ctx.bezierCurveTo(-22, -16, -11, -22, 0, -22);
    ctx.bezierCurveTo(11, -22, 22, -16, 21, 1);
    ctx.bezierCurveTo(10, 4, -10, 4, -21, 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Các vòng sóng thôi miên màu hồng/vàng/cyan phát sáng trên mũ nấm
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -6, 13, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Đốm phát sáng Cyan & Vàng chanh
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(-11, -5, 2.6, 0, Math.PI * 2);
    ctx.arc(11, -5, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(-6, -13, 2.3, 0, Math.PI * 2);
    ctx.arc(6, -13, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // 5. Vòng xoáy thôi miên xoay giữa mũ nấm
    ctx.save();
    ctx.translate(0, -8);
    ctx.rotate(time * 0.8);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 3.2; a += 0.3) {
      const r = a * 1.05;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // 6. Hào quang Super Hypno (nằm thẳng đứng phía trên đỉnh mũ, ngoài khối xoay)
    if (plant.isSuperHypno) {
      ctx.save();
      ctx.translate(0, -28);
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // 18. Mìn Khoai Tây (Potato Mine)
  drawPotatoMineGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;

    // Mô đất xới xung quanh
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.ellipse(0, 16, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.ellipse(0, 16, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (!plant.armed) {
      // TRƯỚC 5S: CHƯA NHÔ LÊN (Chỉ có chỏm đầu nhô lên mặt đất)
      const bob = Math.sin(time * 1.5) * 1.0;

      // Chỏm đầu khoai nhỏ
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.arc(0, 14 + bob, 10, Math.PI, 0, false);
      ctx.fill();
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Đèn tín hiệu nhấp nháy đỏ trên đầu
      const blink = 0.3 + 0.7 * Math.abs(Math.sin((plant.armTimer || 0) * 4));
      ctx.fillStyle = `rgba(255, 23, 68, ${blink})`;
      ctx.beginPath();
      ctx.arc(0, 3 + bob, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Cột đèn nhỏ
      ctx.strokeStyle = '#424242';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 6 + bob);
      ctx.lineTo(0, 14 + bob);
      ctx.stroke();

      // Mắt nhắm he hé dưới đất
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-4, 13 + bob); ctx.lineTo(-2, 14 + bob);
      ctx.moveTo(4, 13 + bob); ctx.lineTo(2, 14 + bob);
      ctx.stroke();
    } else {
      // SAU 5S: ĐÃ NHÔ LÊN HOÀN TOÀN (Sẵn sàng nổ SPUDOW)
      const sway = Math.sin(time * 2) * 1.2;

      ctx.save();
      ctx.translate(0, sway);

      // Thân củ khoai tây tròn trịa múp míp
      ctx.fillStyle = '#8d6e63';
      ctx.beginPath();
      ctx.ellipse(0, 6, 15, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Đốm vỏ khoai tây
      ctx.fillStyle = '#795548';
      ctx.beginPath();
      ctx.arc(-8, 8, 1.8, 0, Math.PI * 2);
      ctx.arc(7, 10, 1.5, 0, Math.PI * 2);
      ctx.arc(-4, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Mắt to tròn mở to cảnh giác
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-5, 4, 4, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(5, 4, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(-4, 4, 2, 0, Math.PI * 2);
      ctx.arc(4, 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Má hồng
      ctx.fillStyle = 'rgba(255, 138, 128, 0.6)';
      ctx.beginPath();
      ctx.arc(-10, 8, 2.5, 0, Math.PI * 2);
      ctx.arc(10, 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Cần ăng-ten đèn đỏ trên đầu sẵn sàng nổ
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -15);
      ctx.stroke();

      // Đèn đỏ phát sáng rực rỡ
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(0, -16, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawZombie(ctx, zombie) {
    ctx.save();
    if (zombie.isHypnotized) {
      // Đảo chiều zombie quay mặt sang phải
      ctx.translate(zombie.x, zombie.y);
      ctx.scale(-1, 1);
      ctx.translate(-zombie.x, -zombie.y);
    }

    if (zombie.type === 'ice_block') {
      this.drawIceBlock(ctx, zombie);
    } else if (zombie.type === 'troglobite') {
      this.drawTroglobite(ctx, zombie);
    } else if (zombie.type === 'yeti_imp') {
      this.drawYetiImp(ctx, zombie);
    } else if (zombie.type === 'tombstone' || zombie.isObstacle) {
      this.drawTombstone(ctx, zombie);
    } else if (zombie.type === 'zombot_dark_dragon') {
      this.drawZombotDarkDragon(ctx, zombie);
    } else if (zombie.type === 'imp_dragon') {
      this.drawImpDragon(ctx, zombie);
    } else if (zombie.type === 'conehead') {
      this.drawConeheadZombie(ctx, zombie);
    } else if (zombie.type === 'buckethead') {
      this.drawBucketheadZombie(ctx, zombie);
    } else if (zombie.type === 'pole_vaulting') {
      this.drawPoleVaultingZombie(ctx, zombie);
    } else if (zombie.type === 'gargantuar') {
      this.drawGargantuar(ctx, zombie);
    } else if (zombie.type === 'imp') {
      this.drawImp(ctx, zombie);
    } else if (zombie.type === 'jurassic_bully') {
      this.drawJurassicBully(ctx, zombie);
    } else if (zombie.type === 'turquoise_skull') {
      this.drawTurquoiseSkull(ctx, zombie);
    } else if (zombie.type === 'lang_khach') {
      this.drawLangKhachZombie(ctx, zombie);
    } else {
      this.drawRegularZombie(ctx, zombie);
    }

    // Hiệu ứng Băng Giá Làm Chậm (Ice Slow Frost Overlay & Particles)
    if (zombie.alive && zombie.slowTimer > 0) {
      this.drawFrostSlowOverlay(ctx, zombie);
    }

    ctx.restore();

    // Hào quang thôi miên xoay trên đầu
    if (zombie.isHypnotized && zombie.alive) {
      this.drawHypnotizedHalo(ctx, zombie);
    }
  }

  // Hiệu ứng bao phủ băng tuyết & tinh thể băng khi zombie bị làm chậm
  drawFrostSlowOverlay(ctx, zombie) {
    const time = performance.now() * 0.003;
    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    // 1. Lớp phủ sương giá băng thanh màu Cyan trong suốt bao bọc toàn thân zombie
    ctx.fillStyle = 'rgba(0, 229, 255, 0.32)';
    ctx.strokeStyle = 'rgba(128, 216, 255, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Chông băng sắc nhọn dưới chân zombie
    ctx.fillStyle = 'rgba(178, 235, 242, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-16, 28); ctx.lineTo(-12, 18); ctx.lineTo(-8, 28);
    ctx.moveTo(-6, 28); ctx.lineTo(-2, 16); ctx.lineTo(2, 28);
    ctx.moveTo(4, 28); ctx.lineTo(8, 20); ctx.lineTo(12, 28);
    ctx.fill();

    // 3. Tinh thể băng tuyết xoay lơ lửng xung quanh (Frost Ice Shards)
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) + time * 1.5;
      const dist = 16 + Math.sin(time * 3 + i) * 3;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * (dist * 1.2) - 4;

      ctx.fillStyle = i % 2 === 0 ? '#00e5ff' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px, py + 4);
      ctx.lineTo(px - 3, py);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  drawHypnotizedHalo(ctx, zombie) {
    ctx.save();
    ctx.translate(zombie.x, zombie.y - 48);
    const rot = performance.now() * 0.004;
    ctx.rotate(rot);

    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = 2 + a * 2.5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(Math.cos(rot * 2) * 12, Math.sin(rot * 2) * 12, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- Bia Mộ Vật Cản (Tombstone - HP 500) ---
  drawTombstone(ctx, zombie) {
    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    // Bóng bia mộ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 26, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khối đá bia mộ
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.roundRect(-16, -18, 32, 44, [8, 8, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Thánh giá chạm trổ
    ctx.strokeStyle = '#cbd5e0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(0, 10);
    ctx.moveTo(-6, -4); ctx.lineTo(6, -4);
    ctx.stroke();

    // Thanh máu nếu bị đạn bắn
    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -28, 36, 5, zombie.hp / zombie.maxHp, '#ff1744');
    }
    ctx.restore();
  }

  // --- Conehead Zombie (Zombie Đội Nón Giao Thông - Chuẩn PvZ 2) ---
  drawConeheadZombie(ctx, zombie) {
    this.drawRegularZombie(ctx, zombie);
    if (!zombie.alive) return;

    // Nón giao thông màu cam rực rỡ đặc trưng PvZ 2 trên đầu
    ctx.save();
    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = !zombie.isEating ? Math.sin(cycle) * 2.8 : 0;
    ctx.translate(zombie.x, zombie.y - 34 + walkY);

    // Đế hình vuông nón bảo hộ giao thông
    ctx.fillStyle = '#e65100';
    ctx.beginPath();
    ctx.ellipse(0, 9, 13, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Thân nón hình nón cam tươi sáng
    const coneGrad = ctx.createLinearGradient(-10, 8, 10, -20);
    coneGrad.addColorStop(0, '#ff9100');
    coneGrad.addColorStop(0.5, '#ff6d00');
    coneGrad.addColorStop(1, '#e65100');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-2, -20);
    ctx.quadraticCurveTo(0, -22, 2, -20);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#bf360c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vệt phản quang trắng đôi chuẩn quốc tế
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-6, 2); ctx.lineTo(-4, -5); ctx.lineTo(4, -5); ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-3, -9); ctx.lineTo(-2, -14); ctx.lineTo(2, -14); ctx.lineTo(3, -9);
    ctx.closePath();
    ctx.fill();

    // Vết nứt sứt mẻ nếu nón bị tấn công
    if (zombie.armorHp <= 180) {
      ctx.strokeStyle = '#bf360c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-2, -12); ctx.lineTo(3, -4); ctx.lineTo(1, 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- Buckethead Zombie (Zombie Đội Thùng Sắt 1290 HP - Chuẩn PvZ 2) ---
  drawBucketheadZombie(ctx, zombie) {
    this.drawRegularZombie(ctx, zombie);
    if (!zombie.alive) return;
    // Nếu thùng sắt đã bị Nấm Nam Châm hút hoặc bắn nát (armorHp <= 0), không vẽ thùng sắt nữa!
    if (zombie.armorHp <= 0) return;

    ctx.save();
    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = !zombie.isEating ? Math.sin(cycle) * 2.8 : 0;
    ctx.translate(zombie.x, zombie.y - 33 + walkY);

    // Thùng kim loại mạ kẽm (Galvanized Steel Bucket)
    const bucketGrad = ctx.createLinearGradient(-13, -15, 13, 10);
    bucketGrad.addColorStop(0, '#eceff1');
    bucketGrad.addColorStop(0.3, '#cfd8dc');
    bucketGrad.addColorStop(0.7, '#90a4ae');
    bucketGrad.addColorStop(1, '#546e7a');

    ctx.fillStyle = bucketGrad;
    ctx.beginPath();
    ctx.roundRect(-13, -16, 26, 24, [3, 3, 5, 5]);
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Gờ vành cuộn tròn miệng thùng
    ctx.fillStyle = '#b0bec5';
    ctx.beginPath();
    ctx.ellipse(0, 8, 13, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Quai xách thùng sắt vắt cong ngược ra sau
    ctx.strokeStyle = '#eceff1';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, -14, 9, Math.PI * 0.9, Math.PI * 0.1, false);
    ctx.stroke();

    // Đinh tán cố định quai thùng 2 bên
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(-11, -8, 1.8, 0, Math.PI * 2);
    ctx.arc(11, -8, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Vết lồi lõm rỉ sét móp méo khi bị đạn bắn
    if (zombie.armorHp <= 600) {
      ctx.fillStyle = '#784e2d';
      ctx.beginPath();
      ctx.ellipse(-5, -4, 4, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4, 2, 5, 2.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Pole Vaulting Zombie (Zombie Nhảy Sào) ---
  drawPoleVaultingZombie(ctx, zombie) {
    const time = zombie.animTime || 0;
    const isVaulting = zombie.isVaulting;
    const hasVaulted = zombie.hasVaulted;

    // Bóng tử khí
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 28, 22, 8, time, zombie.isEating, false);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.2);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating ? Math.sin(cycle * 1.5) * 3.5 : 0;
    const legAngle = zombie.alive && !zombie.isEating ? Math.sin(cycle * 1.5) * 0.75 : 0;

    // --- A. Đôi chân vận động viên điền kinh đang chạy nước rút ---
    // Chân sau
    ctx.strokeStyle = '#689f38'; // Da chân xanh zombie
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 12 + walkY);
    ctx.lineTo(4 + Math.sin(legAngle) * 14, 28);
    ctx.stroke();
    // Giày thể thao sau đỏ trắng
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(2 + Math.sin(legAngle) * 14, 27, 8, 4);

    // Chân trước gập cao chạy nước rút
    ctx.strokeStyle = '#7cb342';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-4, 12 + walkY);
    ctx.lineTo(-4 - Math.sin(legAngle) * 14, 28);
    ctx.stroke();
    // Giày thể thao trước
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-8 - Math.sin(legAngle) * 14, 27, 10, 4.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8 - Math.sin(legAngle) * 14, 29, 10, 1.5);

    // Quần đùi thể thao trắng viền đỏ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-10, 6 + walkY, 20, 10, [0, 0, 3, 3]);
    ctx.fill();
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cổ nối đầu & thân
    ctx.fillStyle = '#556b2f';
    ctx.fillRect(-4, -6 + walkY, 8, 6);

    // --- B. Thân áo ba lỗ thể thao màu cam rực rỡ ---
    ctx.fillStyle = '#ef6c00'; // Áo vận động viên cam đậm nổi bật
    ctx.beginPath();
    ctx.roundRect(-11, -3 + walkY, 22, 16, 3);
    ctx.fill();
    ctx.strokeStyle = '#b23c00';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Sọc trắng thể thao dọc áo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-8, -3 + walkY, 3, 16);
    ctx.fillRect(5, -3 + walkY, 3, 16);

    // Số áo '01' trên ngực
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('01', 0, 9 + walkY);

    // Cánh tay cầm sào
    ctx.strokeStyle = '#689f38';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-6, 2 + walkY);
    ctx.lineTo(-14, 6 + walkY);
    ctx.stroke();

    // --- C. Đầu Zombie & Băng đô thể thao đỏ ---
    ctx.fillStyle = '#556b2f';
    ctx.beginPath();
    ctx.arc(0, -15 + walkY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e3d16';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Băng đô đỏ thể thao quấn trán
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-13, -20 + walkY, 26, 4.5);
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 1;
    ctx.strokeRect(-13, -20 + walkY, 26, 4.5);

    // Đôi mắt trợn trừng
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -15 + walkY, 3, 0, Math.PI * 2);
    ctx.arc(4, -15 + walkY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-4.5, -15 + walkY, 1.5, 0, Math.PI * 2);
    ctx.arc(4.5, -15 + walkY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Hàm răng sắc nhọn
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(-4, -9 + walkY, 3, 2.5);
    ctx.fillRect(1, -9 + walkY, 3, 2.5);

    // --- D. Cây sào dài ---
    if (!hasVaulted) {
      ctx.strokeStyle = '#fbc02d'; // Cây sào gỗ vàng sáng
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (isVaulting) {
        ctx.moveTo(10, 25); ctx.lineTo(-18, -32);
      } else {
        ctx.moveTo(-38, 10 + walkY); ctx.lineTo(26, -18 + walkY);
      }
      ctx.stroke();
      ctx.strokeStyle = '#f57f17';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    this.drawZombieStatus(ctx, zombie, walkY, -45, -32);

    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -38, 36, 5, zombie.hp / zombie.maxHp, '#ff1744');
    }
    ctx.restore();
  }

  // ==========================================
  // LÃNG KHÁCH ZOMBIE (Yasuo Zombie)
  // Nón lá rách bươm, tóc bạc che 1 mắt, áo rách lãng khách,
  // kiếm gỗ tạc từ khúc xương, lá phong xoay vòng dưới chân
  // ==========================================
  drawLangKhachZombie(ctx, zombie) {
    const time = zombie.animTime || 0;
    const isInvuln = zombie.invulnerableTimer && zombie.invulnerableTimer > 0;
    const isDashing = !!zombie.isDashing;
    const isSlashing = isDashing || (zombie.slashAnimTimer && zombie.slashAnimTimer > 0);

    // Bóng tử khí dưới chân
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 28, 22, 8, time, zombie.isEating, false);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.2);
      this.drawHorrorDissolution(ctx, zombie);
    }

    // Dư ảnh lướt gió (Skill 1)
    if (isDashing) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#80deea';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(12 + i * 6, -12 + i * 11);
        ctx.lineTo(38 + i * 10, -12 + i * 11);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Luồng gió & lá phong xoay vòng dưới chân (luôn tồn tại khi sống)
    if (zombie.alive) {
      ctx.save();
      ctx.strokeStyle = 'rgba(178, 235, 242, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 27, 23, 7, 0, (time * 3.5) % (Math.PI * 2), (time * 3.5) % (Math.PI * 2) + Math.PI * 1.35);
      ctx.stroke();

      const leafColors = ['#e53935', '#ff7043', '#ffb300', '#d84315'];
      for (let i = 0; i < 4; i++) {
        const ang = time * 3.4 + i * (Math.PI / 2);
        const lx = Math.cos(ang) * 21;
        const ly = 26 + Math.sin(ang) * 6.5;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang + 0.8);
        ctx.fillStyle = leafColors[i % leafColors.length];
        // Hình lá phong nhỏ 3 cánh sắc nét
        ctx.beginPath();
        ctx.moveTo(0, -4.5);
        ctx.lineTo(2, -1);
        ctx.lineTo(4.5, -1.5);
        ctx.lineTo(1.8, 1.4);
        ctx.lineTo(0, 4);
        ctx.lineTo(-1.8, 1.4);
        ctx.lineTo(-4.5, -1.5);
        ctx.lineTo(-2, -1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating && !isDashing ? Math.sin(cycle * 1.3) * 2.5 : 0;
    const legAngle = zombie.alive && !zombie.isEating && !isDashing ? Math.sin(cycle * 1.3) * 0.5 : 0;

    // --- 1. Đôi chân & quần rách lãng khách ---
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4, 11 + walkY);
    ctx.lineTo(4 + Math.sin(legAngle) * 11, 27);
    ctx.stroke();

    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 6.2;
    ctx.beginPath();
    ctx.moveTo(-4, 11 + walkY);
    ctx.lineTo(-4 - Math.sin(legAngle) * 11, 27);
    ctx.stroke();

    // Xà cạp rách & dép cỏ
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(1 + Math.sin(legAngle) * 11, 25, 7, 3.5);
    ctx.fillRect(-7 - Math.sin(legAngle) * 11, 25, 7, 3.5);

    // --- 2. Khăn choàng rách bay trong gió phía sau ---
    const scarfWave = Math.sin(time * 5.2) * 4;
    ctx.fillStyle = '#37474f';
    ctx.strokeStyle = '#1c262b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, -5 + walkY);
    ctx.quadraticCurveTo(18, -4 + scarfWave, 26, 4 + scarfWave);
    ctx.lineTo(22, 7 + scarfWave);
    ctx.lineTo(27, 10 + scarfWave * 0.6);
    ctx.lineTo(8, 5 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // --- 3. Bộ đồ rách rưới phong cách lãng khách ---
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#102027';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-11, -5 + walkY);
    ctx.lineTo(11, -5 + walkY);
    ctx.lineTo(14, 16 + walkY);
    // Gấu áo rách tua rua
    ctx.lineTo(8, 13 + walkY);
    ctx.lineTo(4, 18 + walkY);
    ctx.lineTo(-1, 13 + walkY);
    ctx.lineTo(-6, 17 + walkY);
    ctx.lineTo(-13, 14 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vạt áo chéo kiểu kiếm sĩ & đai lưng xộc xệch
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-9, -4 + walkY);
    ctx.lineTo(7, 8 + walkY);
    ctx.stroke();

    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-11, 6 + walkY, 22, 4);
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(-11, 9 + walkY, 4, 5); // Mảnh đai rách thả xuống

    // Giáp vai rách bên phải
    ctx.fillStyle = '#455a64';
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(9, -4 + walkY, 7, 4.5, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // --- 4. Đầu Zombie + Tóc bạc dựng ngược che 1 bên mắt + Nón lá rách bươm ---
    ctx.fillStyle = '#689f38';
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -15 + walkY, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt trái (phía hướng đi) phát sáng sắc lạnh; mắt phải bị tóc bạc che khuất
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.5, -14.5 + walkY, 2.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(-5, -14.5 + walkY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Miệng nhe răng
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(-4.5, -8.5 + walkY, 2.5, 2);
    ctx.fillRect(0, -8.5 + walkY, 2.5, 2);

    // Tóc bạc dựng ngược tung bay và rủ che 1 bên mắt (bên phải khuôn mặt)
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    // Chỏm tóc dựng ngược phía sau/trên
    ctx.moveTo(-2, -25 + walkY);
    ctx.lineTo(6, -33 + walkY);
    ctx.lineTo(8, -26 + walkY);
    ctx.lineTo(15, -31 + walkY);
    ctx.lineTo(12, -22 + walkY);
    ctx.lineTo(17, -18 + walkY);
    ctx.lineTo(11, -14 + walkY);
    // Lọn tóc bạc rủ dài che phủ một bên mắt
    ctx.lineTo(7, -8 + walkY);
    ctx.lineTo(2, -9 + walkY);
    ctx.lineTo(1, -18 + walkY);
    ctx.lineTo(-4, -22 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nón lá rách bươm đội nghiêng
    ctx.save();
    ctx.translate(0, -22 + walkY);
    ctx.rotate(-0.14);
    const hatGrad = ctx.createLinearGradient(-22, -8, 22, 6);
    hatGrad.addColorStop(0, '#d7ccc8');
    hatGrad.addColorStop(0.5, '#c5a86b');
    hatGrad.addColorStop(1, '#8d6e63');
    ctx.fillStyle = hatGrad;
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(23, 3);
    // Vành nón lá rách bươm nham nhở
    ctx.lineTo(16, 4);
    ctx.lineTo(13, 0);
    ctx.lineTo(9, 4.5);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-8, 5);
    ctx.lineTo(-12, 1);
    ctx.lineTo(-17, 4.5);
    ctx.lineTo(-24, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các nan tre & lỗ rách trên nón lá
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(-9, 3.5);
    ctx.moveTo(0, -14); ctx.lineTo(4, 3.5);
    ctx.moveTo(0, -14); ctx.lineTo(14, 2);
    ctx.stroke();
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.ellipse(-7, -3, 2.4, 1.3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 5. Tay & Khúc xương hình thanh kiếm gỗ ---
    const slashSwing = isSlashing ? -0.95 : Math.sin(time * 3.0) * 0.08;
    ctx.save();
    ctx.translate(-6, 1 + walkY);
    ctx.rotate(slashSwing);

    // Cánh tay zombie đưa kiếm về phía trước
    ctx.strokeStyle = '#689f38';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, 3);
    ctx.stroke();

    // Khúc xương được gọt thành dáng thanh kiếm gỗ (hướng mũi về phía trước - trái)
    ctx.save();
    ctx.translate(-9, 3);
    ctx.rotate(-0.35);

    // Đuôi chuôi xương 2 đầu tròn đặc trưng của khúc xương
    ctx.fillStyle = '#fff8e1';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(6, -1.5, 2.5, 0, Math.PI * 2);
    ctx.arc(6, 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Chuôi cầm
    ctx.fillStyle = '#bcaaa4';
    ctx.fillRect(-3, -2, 9, 4);
    ctx.strokeRect(-3, -2, 9, 4);

    // Chắn kiếm gỗ buộc dây
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-5, -5, 3, 10);

    // Lưỡi kiếm khúc xương trắng ngà dáng kiếm gỗ cong nhẹ
    ctx.fillStyle = '#fffde7';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-5, -2.5);
    ctx.quadraticCurveTo(-18, -4.5, -31, -1.5);
    ctx.lineTo(-34, 0.5);
    ctx.quadraticCurveTo(-20, 2.5, -5, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vệt chém kiếm khi lướt / vung kiếm
    if (isSlashing) {
      ctx.strokeStyle = 'rgba(128, 222, 234, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-18, 0, 18, Math.PI * 0.72, Math.PI * 1.35);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    // --- 6. Skill 2: Hào quang Bất Tử 3s (HP < 50%) ---
    if (isInvuln && zombie.alive) {
      const pulse = 0.65 + Math.sin(time * 12) * 0.25;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(0, -2 + walkY, 24, 30, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.ellipse(0, -2 + walkY, 27, 33, 0, time * 4, time * 4 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // --- 7. Chỉ báo số lần lướt (0/3, 1/3, 2/3) cho Skill 3 ---
    if (zombie.alive) {
      const stacks = zombie.dashCount || 0;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < stacks ? '#00e5ff' : 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(-7 + i * 7, -45, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    this.drawZombieStatus(ctx, zombie, walkY, -54, -40);

    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -39, 36, 5, zombie.hp / zombie.maxHp, isInvuln ? '#ffd54f' : '#ff1744');
    }
    ctx.restore();
  }

  // ==========================================
  // HỆ THỐNG HIỆU ỨNG & ĐỒ HỌA ZOMBIE PVZ 2 CHUẨN
  // ==========================================

  // Bóng đổ mặt đất tự nhiên, mượt mà dưới chân zombie
  drawHorrorShadow(ctx, x, y, rx, ry, animTime, isEating, isLowHp) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Hiệu ứng biến mất hoạt hình nhẹ nhàng khi zombie tử trận
  drawHorrorDissolution(ctx, zombie) {
    const p = Math.min(1.0, zombie.deathTimer / 1.1);
    const starCount = 5;
    ctx.save();
    for (let i = 0; i < starCount; i++) {
      const angle = (i * Math.PI * 2) / starCount + (zombie.animTime || 0);
      const dist = p * 22 + (i * 2);
      const starX = Math.cos(angle) * dist;
      const starY = -p * 24 - Math.sin(angle) * 6;
      const alpha = Math.max(0, 1 - p);

      ctx.fillStyle = `rgba(255, 235, 59, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(starX, starY, 2.2 * (1 - p * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 1. Zombie Thường (Regular Zombie / Browncoat - Phong Cách Hoạt Họa PvZ 2 Chính Gốc)
  drawRegularZombie(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;

    // Bóng đổ mặt cỏ mượt mà
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 28, 20, 7, zombie.animTime || 0, zombie.isEating, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.2);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating ? Math.sin(cycle) * 2.8 : 0;
    const legAngle = zombie.alive && !zombie.isEating ? Math.sin(cycle) * 0.45 : 0;

    // --- A. Đôi chân và Quần Tây Xanh Xám (PvZ 2 Trousers) ---
    // Chân sau
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(3, 12 + walkY);
    ctx.lineTo(3 + Math.sin(legAngle) * 9, 28);
    ctx.stroke();
    // Giày tây đen sau
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.roundRect(1 + Math.sin(legAngle) * 9, 26, 9, 4.5, 2);
    ctx.fill();

    // Chân trước (gần camera hơn)
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 12 + walkY);
    ctx.lineTo(-4 - Math.sin(legAngle) * 9, 28);
    ctx.stroke();
    // Ống quần rách gấu đặc trưng PvZ
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7 - Math.sin(legAngle) * 9, 25);
    ctx.lineTo(-1 - Math.sin(legAngle) * 9, 25);
    ctx.stroke();

    // Giày tây đen trước bóng bẩy
    ctx.fillStyle = '#1e1e1e';
    ctx.beginPath();
    ctx.roundRect(-8 - Math.sin(legAngle) * 9, 26, 11, 5, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(-6 - Math.sin(legAngle) * 9, 27, 4, 1.5);

    // --- B. Cổ nối đầu & thân ---
    ctx.fillStyle = '#7da06d';
    ctx.fillRect(-3.5, -8 + walkY, 7, 6);

    // --- C. Áo khoác vest nâu & Áo sơ mi trắng & Cà vạt đỏ tươi ---
    // Thân áo vest nâu
    const suitGrad = ctx.createLinearGradient(-12, -4 + walkY, 12, 16 + walkY);
    suitGrad.addColorStop(0, '#8d6e63');
    suitGrad.addColorStop(0.5, '#795548');
    suitGrad.addColorStop(1, '#5d4037');

    ctx.fillStyle = suitGrad;
    ctx.beginPath();
    ctx.roundRect(-12, -4 + walkY, 24, 20, 4);
    ctx.fill();
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Ve cổ áo vest
    ctx.fillStyle = '#a1887f';
    ctx.beginPath();
    ctx.moveTo(-11, -4 + walkY); ctx.lineTo(-4, 4 + walkY); ctx.lineTo(-10, 12 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(11, -4 + walkY); ctx.lineTo(4, 4 + walkY); ctx.lineTo(10, 12 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Áo sơ mi trắng lộ ở cổ
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.moveTo(-4, -4 + walkY);
    ctx.lineTo(0, 4 + walkY);
    ctx.lineTo(4, -4 + walkY);
    ctx.closePath();
    ctx.fill();

    // Cà vạt đỏ tươi PvZ 2
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(-2.5, -2 + walkY);
    ctx.lineTo(2.5, -2 + walkY);
    ctx.lineTo(3.5, 8 + walkY);
    ctx.lineTo(0, 13 + walkY);
    ctx.lineTo(-3.5, 8 + walkY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Khuy cúc áo vàng
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(0, 12 + walkY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // --- D. Cánh tay Zombie vươn dài ra phía trước chuẩn tư thế PvZ ---
    const armReachX = zombie.isEating ? -24 : -21;
    const armReachY = zombie.isEating ? (Math.sin((zombie.animTime || 0) * 12) * 4) : (1 + walkY);

    // Cánh tay sau
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(8, 0 + walkY);
    ctx.lineTo(13, 7 + walkY);
    ctx.stroke();
    // Bàn tay xanh sau
    ctx.fillStyle = '#7da06d';
    ctx.beginPath();
    ctx.arc(13, 7 + walkY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cánh tay trước (vươn thẳng ngang ngực về phía trước)
    // Ống tay áo vest nâu
    ctx.strokeStyle = '#795548';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 1 + walkY);
    ctx.lineTo(-13, 1 + walkY);
    ctx.stroke();

    // Cẳng tay da xanh thối rữa hoạt hình
    ctx.strokeStyle = '#7da06d';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(-13, 1 + walkY);
    ctx.lineTo(armReachX, armReachY);
    ctx.stroke();

    // Bàn tay hoạt họa với các ngón tay xòe ra nắm bắt
    ctx.fillStyle = '#7da06d';
    ctx.beginPath();
    ctx.arc(armReachX, armReachY, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4e6d3f';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    // Ngón tay hoạt họa ngộ nghĩnh
    ctx.fillStyle = '#7da06d';
    ctx.beginPath();
    ctx.ellipse(armReachX - 3.5, armReachY - 1.5, 2.2, 1.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(armReachX - 4.0, armReachY + 0.8, 2.2, 1.2, 0, 0, Math.PI * 2);
    ctx.ellipse(armReachX - 3.2, armReachY + 2.8, 2.2, 1.2, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // --- E. Đầu Zombie Ngộ Nghĩnh Hài Hước Đặc Trưng PvZ 2 ---
    const headTilt = zombie.isEating 
      ? (Math.sin((zombie.animTime || 0) * 10) * 0.14) 
      : 0.04;

    ctx.save();
    ctx.translate(0, -18 + walkY);
    ctx.rotate(headTilt);

    // Hộp sọ màu xanh rêu / olive tươi sáng chuẩn PvZ 2
    const headGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 16);
    headGrad.addColorStop(0, '#92b781');
    headGrad.addColorStop(0.7, '#7da06d');
    headGrad.addColorStop(1, '#5a784d');

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#445e39';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Sợi tóc xoăn ngộ nghĩnh trên đỉnh đầu
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(1, -15);
    ctx.quadraticCurveTo(5, -20, 2, -22);
    ctx.stroke();

    // ĐÔI MẮT BẤT ĐỐI XỨNG HÀI HƯỚC KINH ĐIỂN CỦA PVZ
    // Mắt phải (to tròn ngơ ngác)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.5, -3, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33492a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Con ngươi mắt phải lệch ngộ nghĩnh
    ctx.fillStyle = '#1c211a';
    ctx.beginPath();
    ctx.arc(-6.5, -2.8, 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Đốm sáng phản chiếu
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-7.2, -3.5, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Mắt trái (nhỏ hơn, hơi lé hài hước)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4.8, -3, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33492a';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Con ngươi mắt trái
    ctx.fillStyle = '#1c211a';
    ctx.beginPath();
    ctx.arc(3.8, -2.8, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(3.2, -3.4, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // KHUÔN MIỆNG VẨU RĂNG ĐẶC TRƯNG PVZ 2 (Underbite cartoon mouth)
    const mouthOpen = zombie.isEating ? 7 : 3.5;
    ctx.fillStyle = '#3a2024';
    ctx.beginPath();
    ctx.ellipse(zombie.isEating ? -7 : -6, 5, zombie.isEating ? 6 : 4.5, mouthOpen, 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#271216';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Hàng răng cửa vuông vức trắng ngà hoạt hình
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.rect(-9, 4, 3, 3);
    ctx.rect(-5, 4, 3, 3);
    ctx.rect(-8, 7, 3, 3);
    ctx.fill();
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-9, 4, 3, 3);
    ctx.strokeRect(-5, 4, 3, 3);
    ctx.strokeRect(-8, 7, 3, 3);

    // Mẩu thức ăn xanh văng ra khi đang ngoạm cây vui nhộn
    if (zombie.isEating) {
      ctx.fillStyle = '#4caf50';
      ctx.beginPath();
      ctx.arc(-14, 4 + Math.sin(zombie.animTime * 15) * 3, 1.3, 0, Math.PI * 2);
      ctx.arc(-12, 8 + Math.cos(zombie.animTime * 12) * 3, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    this.drawZombieStatus(ctx, zombie, walkY, -48, -34);

    if (zombie.alive && zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -42, 36, 4, zombie.hp / zombie.maxHp, '#d50000');
    }

    ctx.restore();
  }

  // 2. Gargantuar — Khổng Lồ Quái Vật Bất Tử (Horror Abomination Juggernaut)
  drawGargantuar(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;

    // Bóng ma quái khổng lồ với tử khí cuồn cuộn
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 36, 38, 13, zombie.animTime || 0, zombie.isSmashing, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.scale(1.18, 1.18); // Tăng kích thước thêm 18% tạo vóc dáng khổng lồ uy lực lấn át

    // Hào quang tử khí & cuồng nộ đỏ rực quanh vai
    if (zombie.alive) {
      ctx.save();
      ctx.fillStyle = isLowHp ? 'rgba(255, 23, 68, 0.25)' : 'rgba(183, 28, 28, 0.14)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.0);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isSmashing ? Math.sin(cycle) * 2.5 : 0;
    const legAngle = zombie.alive && !zombie.isSmashing ? Math.sin(cycle) * 0.35 : 0;

    // --- A. Giỏ đựng Imp bằng gỗ mục đóng đinh sắt & xích máu (Backpack) ---
    ctx.save();
    ctx.translate(15, -14 + walkY);

    // Thùng gỗ đen mục với thanh sắt rỉ sét
    ctx.fillStyle = '#2d1f1b';
    ctx.beginPath();
    ctx.roundRect(-4, -6, 22, 28, 4);
    ctx.fill();
    ctx.strokeStyle = '#140c0a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dây xích sắt đen siết ngang ngực
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(-18, 9);
    ctx.stroke();

    // Imp Quỷ Lùn trong giỏ (nếu chưa ném)
    if (!zombie.hasThrownImp) {
      ctx.save();
      ctx.translate(7, -11);

      // Đầu Imp quỷ dị với tai nhọn dơi
      ctx.fillStyle = '#455a64';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Tai nhọn quỷ dơi
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.moveTo(-6, -4); ctx.lineTo(-13, -9); ctx.lineTo(-5, 1);
      ctx.closePath();
      ctx.fill();

      // Mắt quỷ đỏ rực trong đêm tối
      ctx.fillStyle = '#0a0d0b';
      ctx.beginPath();
      ctx.arc(-2.5, -1.5, 3.2, 0, Math.PI * 2);
      ctx.arc(3.0, -1.5, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(-2.5, -1.5, 1.8, 0, Math.PI * 2);
      ctx.arc(3.0, -1.5, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Răng nanh quỷ nhọn
      ctx.fillStyle = '#fff59d';
      ctx.beginPath();
      ctx.moveTo(-4, 3); ctx.lineTo(-2, 6); ctx.lineTo(0, 3);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();

    // --- B. Đôi chân hộ pháp gân guốc bọc giáp sắt nát ---
    ctx.strokeStyle = '#1c2529';
    ctx.lineWidth = 10;
    // Chân sau
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(8 + Math.sin(legAngle) * 12, 36);
    ctx.stroke();
    // Bàn chân quái vật to lớn đạp vỡ đất
    ctx.fillStyle = '#10171a';
    ctx.fillRect(8 + Math.sin(legAngle) * 12 - 7, 34, 16, 6);

    // Chân trước
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.lineTo(-8 - Math.sin(legAngle) * 12, 36);
    ctx.stroke();
    ctx.fillRect(-8 - Math.sin(legAngle) * 12 - 11, 34, 18, 6);

    // Xích sắt quấn quanh cổ chân
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-8 - Math.sin(legAngle) * 12 - 5, 28, 10, 4);

    // --- C. Thân hình khổng lồ chắp vá, gân máu đỏ rực & đinh ghim kim loại ---
    ctx.fillStyle = '#37474f'; // Thịt xác chết xám đậm
    ctx.beginPath();
    ctx.roundRect(-19, -12 + walkY, 36, 32, 8);
    ctx.fill();

    // Gân máu đỏ tím phồng rộp trên lồng ngực
    ctx.strokeStyle = 'rgba(213, 0, 0, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, -4 + walkY); ctx.lineTo(-6, 2 + walkY); ctx.lineTo(-10, 8 + walkY);
    ctx.moveTo(4, -6 + walkY); ctx.lineTo(10, 0 + walkY); ctx.lineTo(6, 6 + walkY);
    ctx.stroke();

    // Vết khâu kim loại / Ghim sắt dập trên da thịt (Iron Staples)
    ctx.strokeStyle = '#cfd8dc';
    ctx.lineWidth = 2;
    for (let s = -8; s <= 6; s += 5) {
      ctx.beginPath();
      ctx.moveTo(s - 1, -8 + walkY);
      ctx.lineTo(s + 2, -8 + walkY);
      ctx.stroke();
      ctx.fillStyle = '#111111';
      ctx.fillRect(s - 2, -9 + walkY, 1.5, 2);
      ctx.fillRect(s + 2, -9 + walkY, 1.5, 2);
    }

    // Áo gi-lê da thuộc cũ nát đẫm máu
    ctx.fillStyle = '#271813';
    ctx.beginPath();
    ctx.roundRect(-17, -10 + walkY, 14, 28, 4);
    ctx.roundRect(4, -10 + walkY, 12, 28, 4);
    ctx.fill();

    // Vết máu bắn loang lổ trên áo
    ctx.fillStyle = '#6a0a16';
    ctx.beginPath();
    ctx.arc(-8, 4 + walkY, 4, 0, Math.PI * 2);
    ctx.arc(10, 8 + walkY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Thắt lưng sắt to bản có đầu lâu nhỏ
    ctx.fillStyle = '#151515';
    ctx.fillRect(-17, 12 + walkY, 34, 7);
    ctx.fillStyle = '#90a4ae';
    ctx.strokeRect(-7, 11 + walkY, 14, 9);

    // --- D. Đầu Gargantuar Dị Dạng Khát Máu ---
    ctx.save();
    ctx.translate(-6, -26 + walkY);

    // Hộp sọ đồ sộ méo mó
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.ellipse(0, 0, 21, 19, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Bu-lông sắt tán xuyên qua thái dương
    ctx.fillStyle = '#78909c';
    ctx.fillRect(-20, -8, 5, 7);
    ctx.fillRect(17, -8, 5, 7);
    ctx.fillStyle = '#263238';
    ctx.fillRect(-22, -6, 2, 3);
    ctx.fillRect(22, -6, 2, 3);

    // Hàm dưới bạnh ra nhô về phía trước
    ctx.fillStyle = '#2e3b42';
    ctx.beginPath();
    ctx.roundRect(-17, 6, 28, 13, 5);
    ctx.fill();

    // Răng nanh đại quỷ nhọn hoắt dính đầy máu tươi
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.moveTo(-13, 6); ctx.lineTo(-10, 0); ctx.lineTo(-7, 6);
    ctx.moveTo(-4, 6); ctx.lineTo(-1, 0); ctx.lineTo(2, 6);
    ctx.moveTo(5, 6); ctx.lineTo(7, 1); ctx.lineTo(10, 6);
    ctx.fill();

    // Máu tươi nhỏ giọt từ khóe hàm
    ctx.fillStyle = '#b71c1c';
    ctx.beginPath();
    ctx.arc(-10, 3, 2, 0, Math.PI * 2);
    ctx.arc(-1, 3, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phải: ĐỒNG TỬ ĐỎ RỰC TỎA LỬA ĐỊA NGỤC (Cyclopean Hellfire Eye)
    ctx.fillStyle = '#0a0d0b';
    ctx.beginPath();
    ctx.arc(-8, -4, 6.2, 0, Math.PI * 2);
    ctx.fill();

    // Quầng lửa đỏ ma quỷ
    ctx.fillStyle = 'rgba(255, 61, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(-8, -4, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(-8, -4, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffea00';
    ctx.beginPath();
    ctx.arc(-8.5, -4.5, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Mắt trái: Bị khâu chéo bằng ghim sắt rỉ sét tàn bạo
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(3, -8); ctx.lineTo(12, 0);
    ctx.moveTo(12, -8); ctx.lineTo(3, 0);
    ctx.stroke();
    // Máu đông quanh vết khâu mắt
    ctx.fillStyle = '#4a0810';
    ctx.beginPath();
    ctx.arc(7.5, -4, 4.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- E. CỘT ĐIỆN QUÁI VẬT BỌC DÂY KẼM GAI & ĐINH SẮT (Horror Smash Pole) ---
    ctx.save();
    ctx.translate(-10, -4 + walkY);

    let poleAngle = -0.35;
    if (zombie.isSmashing) {
      const cycleTime = zombie.attackTimer || 0;
      const windup = zombie.smashWindup || 1.1;

      if (cycleTime < windup) {
        const p = cycleTime / windup;
        poleAngle = -0.35 - p * 1.15; // Vung cực cao về sau
      } else {
        const strikeProgress = Math.min(1.0, (cycleTime - windup) / 0.22);
        poleAngle = -1.5 + strikeProgress * 2.3; // Giáng sấm sét chẻ đôi mặt đất
      }
    } else if (zombie.isThrowingImp) {
      poleAngle = -0.75;
    }

    ctx.rotate(poleAngle);

    // Thân cột gỗ đen mục nát
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.roundRect(-8, -50, 16, 66, 3);
    ctx.fill();
    ctx.strokeStyle = '#21130d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Máu tươi vấy đẫm ở đầu cột điện đập
    ctx.fillStyle = '#6a0a16';
    ctx.fillRect(-8, -50, 16, 24);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(-8, -48, 16, 8);

    // Thanh xà ngang bằng gỗ
    ctx.fillStyle = '#2d1c16';
    ctx.fillRect(-20, -48, 40, 8);

    // Các quả sứ cách điện nứt vỡ
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.arc(-15, -50, 4, 0, Math.PI * 2);
    ctx.arc(15, -50, 4, 0, Math.PI * 2);
    ctx.fill();

    // Dây kẽm gai sắc nhọn quấn quanh thân cột (Barbed Wire)
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 1.6;
    for (let wy = -36; wy <= 6; wy += 10) {
      ctx.beginPath();
      ctx.moveTo(-10, wy);
      ctx.lineTo(10, wy + 4);
      ctx.stroke();
      // Gai nhọn chĩa ra
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(-12, wy - 1, 3, 2);
      ctx.fillRect(9, wy + 3, 3, 2);
    }

    // Đinh đường sắt khổng lồ đóng xuyên qua cột
    ctx.fillStyle = '#546e7a';
    ctx.fillRect(-12, -20, 24, 4);
    ctx.fillRect(-11, -2, 22, 4);

    ctx.restore();

    // Cánh tay hộ pháp gân guốc ghì chặt thân cột
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(-10, -6 + walkY);
    ctx.lineTo(-24, 4 + walkY);
    ctx.stroke();

    // Vòng sắt có gai quanh cổ tay
    ctx.fillStyle = '#212121';
    ctx.fillRect(-24, 0 + walkY, 6, 7);
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(-25, 2 + walkY, 2, 3);

    // HIỆU ỨNG RUNG CHUYỂN NỨT ĐẤT KHI ĐẬP (Ground Shatter Fissure FX)
    if (zombie.isSmashing && zombie.attackTimer >= (zombie.smashWindup || 1.1)) {
      ctx.save();
      // Vệt nứt toác mặt đất màu đỏ máu & than đen
      ctx.strokeStyle = 'rgba(183, 28, 28, 0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-35, 34); ctx.lineTo(-55, 38); ctx.lineTo(-70, 32);
      ctx.moveTo(-45, 36); ctx.lineTo(-58, 44);
      ctx.stroke();

      // Bụi đất và tia lửa ma quỷ bắn tung tóe
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.arc(-55, 32, 2.5, 0, Math.PI * 2);
      ctx.arc(-65, 26, 2.0, 0, Math.PI * 2);
      ctx.arc(-42, 28, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawZombieStatus(ctx, zombie, walkY, -64, -50);

    if (zombie.alive && zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -26, -58 + walkY, 52, 6, zombie.hp / zombie.maxHp, '#d50000');
    }

    ctx.restore();
  }

  // 3. Imp — Chú Zombie Nhí Nhanh Nhẹn (Chuẩn Hoạt Họa PvZ 2)
  drawImp(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;

    // Bóng đổ mượt mà dưới chân Imp
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 18, 13, 5.0, zombie.animTime || 0, zombie.isEating, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.scale(0.72, 0.72);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.5);
      this.drawHorrorDissolution(ctx, zombie);
    }

    // Bước chạy lon ton siêu nhanh của Imp
    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating ? Math.sin(cycle * 1.8) * 3.5 : 0;
    const legAngle = zombie.alive && !zombie.isEating ? Math.sin(cycle * 1.8) * 0.65 : 0;

    // Đôi chân bé xíu mặc quần short xanh tím
    ctx.strokeStyle = '#5e35b1';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 10 + walkY);
    ctx.lineTo(-4 - Math.sin(legAngle) * 9, 23);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 10 + walkY);
    ctx.lineTo(4 + Math.sin(legAngle) * 9, 23);
    ctx.stroke();

    // Giày sneaker thể thao nhỏ màu đỏ trắng
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.roundRect(-7 - Math.sin(legAngle) * 9, 21, 7, 4, 1.5);
    ctx.roundRect(2 + Math.sin(legAngle) * 9, 21, 7, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7 - Math.sin(legAngle) * 9, 23, 7, 1.5);
    ctx.fillRect(2 + Math.sin(legAngle) * 9, 23, 7, 1.5);

    // Thân bé xíu mặc áo tím năng động
    const bodyGrad = ctx.createLinearGradient(-8, -4 + walkY, 8, 14 + walkY);
    bodyGrad.addColorStop(0, '#7e57c2');
    bodyGrad.addColorStop(1, '#512da8');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -4 + walkY, 16, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Dây đeo yếm / cổ áo vàng cam
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.arc(0, 4 + walkY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Cánh tay nhỏ vươn ra
    const armX = zombie.isEating ? -16 : -13;
    const armY = zombie.isEating ? (Math.sin((zombie.animTime || 0) * 16) * 4) : (-1 + walkY);

    ctx.strokeStyle = '#7da06d';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 0 + walkY);
    ctx.lineTo(armX, armY);
    ctx.stroke();

    // Bàn tay xanh tròn nhỏ
    ctx.fillStyle = '#7da06d';
    ctx.beginPath();
    ctx.arc(armX, armY, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // --- Đầu Imp Quá Khổ Dễ Thương ---
    const headTilt = zombie.isEating 
      ? Math.sin((zombie.animTime || 0) * 12) * 0.14 
      : 0.05;

    ctx.save();
    ctx.translate(0, -14 + walkY);
    ctx.rotate(headTilt);

    // Hộp sọ màu xanh rêu sáng PvZ 2
    const headGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 14);
    headGrad.addColorStop(0, '#9ccc65');
    headGrad.addColorStop(0.65, '#8bc34a');
    headGrad.addColorStop(1, '#689f38');

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Đôi mắt to tròn ngộ nghĩnh không cân xứng
    // Mắt phải (to tròn)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.5, -2, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(-5.2, -1.8, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5.8, -2.4, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Mắt trái (nhỏ hơn ngộ nghĩnh)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4.2, -2, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(3.4, -1.8, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2.8, -2.4, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Miệng cười nhăn nhở / há ngoạm
    const mouthW = zombie.isEating ? 5.5 : 3.5;
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.ellipse(zombie.isEating ? -5 : -4, 4.5, zombie.isEating ? 5.8 : 4.5, mouthW, 0, 0, Math.PI * 2);
    ctx.fill();

    // Răng sún ngộ nghĩnh của Imp
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.rect(-6, 3.5, 2.5, 2.5);
    ctx.rect(-2, 3.5, 2.5, 2.5);
    ctx.fill();
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-6, 3.5, 2.5, 2.5);
    ctx.strokeRect(-2, 3.5, 2.5, 2.5);

    // Chỏm tóc dựng đứng trên đỉnh đầu
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -13); ctx.quadraticCurveTo(-2, -19, -4, -22);
    ctx.moveTo(1, -13); ctx.quadraticCurveTo(3, -18, 5, -21);
    ctx.stroke();

    ctx.restore();

    this.drawZombieStatus(ctx, zombie, walkY, -40, -28);

    if (zombie.alive && zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -14, -34, 28, 3.5, zombie.hp / zombie.maxHp, '#d50000');
    }

    ctx.restore();
  }

  // 4. Jurassic Bully — Quái Thú Tiền Sử Đột Biến (Horror Apex Beast Brute)
  drawJurassicBully(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;

    // Bóng tử khí mặt đất
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 30, 29, 9.5, zombie.animTime || 0, zombie.isEating, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.2);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating ? Math.sin(cycle) * 2.2 : 0;
    const legAngle = zombie.alive && !zombie.isEating ? Math.sin(cycle) * 0.32 : 0;

    // --- A. Chân to hộ pháp có vảy gai bò sát ---
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.moveTo(-7, 12);
    ctx.lineTo(-7 - Math.sin(legAngle) * 9, 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(7, 12);
    ctx.lineTo(7 + Math.sin(legAngle) * 9, 30);
    ctx.stroke();

    // Móng vuốt thú săn mồi sắc lẹm
    ctx.fillStyle = '#10171a';
    ctx.fillRect(-11 - Math.sin(legAngle) * 9, 28, 9, 4.5);
    ctx.fillRect(4 + Math.sin(legAngle) * 9, 28, 9, 4.5);

    // Váy da thú hổ báo rách rưới đẫm máu
    ctx.fillStyle = '#b26a00';
    ctx.beginPath();
    ctx.roundRect(-15, 8 + walkY, 30, 13, 3);
    ctx.fill();
    // Vết cào & đốm đen thú dữ
    ctx.fillStyle = '#211202';
    ctx.fillRect(-9, 11 + walkY, 4, 3);
    ctx.fillRect(2, 13 + walkY, 4, 3);
    ctx.fillRect(8, 10 + walkY, 4, 3);

    // --- B. Thân hình vạm vỡ cuồn cuộn với giáp vảy đen & sẹo cào rợn người ---
    ctx.fillStyle = '#455a64'; // Lớp da xác sống bò sát
    ctx.beginPath();
    ctx.roundRect(-17, -10 + walkY, 34, 23, 6);
    ctx.fill();

    // Các mảng giáp vảy rồng/khủng long đen sần sùi trên lưng
    ctx.fillStyle = '#21272b';
    ctx.fillRect(10, -8 + walkY, 6, 18);
    ctx.fillRect(6, -6 + walkY, 4, 14);

    // Vết cào thú khổng lồ rách toác ngực ứa máu
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-12, -6 + walkY); ctx.lineTo(-2, 4 + walkY);
    ctx.moveTo(-8, -8 + walkY); ctx.lineTo(2, 2 + walkY);
    ctx.moveTo(-4, -10 + walkY); ctx.lineTo(6, 0 + walkY);
    ctx.stroke();

    // Vòng xuyến xương thú sắc nhọn vắt chéo ngực
    ctx.strokeStyle = '#fff9c4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -10 + walkY);
    ctx.lineTo(16, 10 + walkY);
    ctx.stroke();

    // Tay to lực lưỡng với nắm đấm bọc đá gai (Bone Knuckledusters)
    const armReach = zombie.isEating ? -24 : -16;
    const armY = zombie.isEating ? (Math.sin((zombie.animTime || 0) * 12) * 6) : (6 + walkY);

    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-12, -4 + walkY);
    ctx.lineTo(armReach, armY);
    ctx.stroke();

    // Khớp xương & gai đá bọc tay đấm
    ctx.fillStyle = '#fffde7';
    ctx.fillRect(armReach - 4, armY - 3, 7, 6);
    ctx.fillStyle = '#212121';
    ctx.fillRect(armReach - 6, armY - 2, 3, 4);

    // --- C. Đầu Bully Tiền Sử Hung Bạo Đầy Sát Khí ---
    ctx.save();
    ctx.translate(-4, -22 + walkY);

    // Hộp sọ to bạnh
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16.5, 14.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tóc bờm thú đen xơ xác dựng ngược
    ctx.fillStyle = '#141414';
    ctx.beginPath();
    ctx.arc(0, -10, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-13, -15, 26, 8);

    // Gờ trán nhô ra đanh thép hung tợn
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-13, -5, 26, 4.5);

    // MẮT THÚ SĂN MỒI RỰC LỬA CAM ĐỎ (Predatory Amber-Red Eyes)
    ctx.fillStyle = '#0a0d0b';
    ctx.beginPath();
    ctx.arc(-6, -1, 4.2, 0, Math.PI * 2);
    ctx.arc(4, -1, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Tròng mắt hổ phách đỏ rực
    ctx.fillStyle = '#ff6d00';
    ctx.beginPath();
    ctx.arc(-6, -1, 2.4, 0, Math.PI * 2);
    ctx.arc(4, -1, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Đồng tử khe dọc dã thú
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.fillRect(-6.5, -3, 1.2, 4);
    ctx.fillRect(3.5, -3, 1.0, 4);

    // Xương xỏ qua vách mũi dính máu
    ctx.strokeStyle = '#fffde7';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.lineTo(7, 4);
    ctx.stroke();
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(-4, 3, 3, 2.5);

    // Miệng rộng ngoác với 2 răng kiếm nanh hổ tiền sử (Sabertooth Fangs)
    const mouthDepth = zombie.isEating ? 6 : 4;
    ctx.fillStyle = '#100508';
    ctx.beginPath();
    ctx.ellipse(zombie.isEating ? -4 : -3, 8, zombie.isEating ? 5.5 : 4, mouthDepth, 0, 0, Math.PI * 2);
    ctx.fill();

    // Răng kiếm dài nhọn hoắt chĩa ngược lên
    ctx.fillStyle = '#fffde7';
    ctx.beginPath();
    ctx.moveTo(-6, 9); ctx.lineTo(-4, 1); ctx.lineTo(-2, 9);
    ctx.moveTo(1, 9); ctx.lineTo(3, 2); ctx.lineTo(5, 9);
    ctx.fill();

    // Máu tươi văng ra khi cắn 100 HP/s
    if (zombie.isEating) {
      ctx.fillStyle = '#d50000';
      ctx.beginPath();
      ctx.arc(-9, 8 + Math.sin(zombie.animTime * 14) * 3, 1.8, 0, Math.PI * 2);
      ctx.arc(-11, 5 + Math.cos(zombie.animTime * 12) * 2, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Huy hiệu Kháng Đẩy Lùi Kiểu Khiên Đá Sắt Cổ Đại (Runic Knockback Barrier)
    if (zombie.alive) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 179, 0, 0.95)';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡️ KHÁNG ĐẨY LÙI', 0, -36 + walkY);
      ctx.restore();
    }

    this.drawZombieStatus(ctx, zombie, walkY, -54, -44);

    if (zombie.alive && zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -20, -42, 40, 4.5, zombie.hp / zombie.maxHp, '#ff6d00');
    }

    ctx.restore();
  }

  // 5. Turquoise Skull Zombie — Linh Mục Tử Thần Sọ Ngọc Bích (Horror Necromancer Lich)
  drawTurquoiseSkull(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;

    // Bóng tử khí hắc ám ngọc bích
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 28, 23, 7.8, zombie.animTime || 0, zombie.isChargingLaser, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.3);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const walkY = zombie.alive && !zombie.isEating && !zombie.isChargingLaser ? Math.sin(cycle) * 2.5 : 0;
    const legAngle = zombie.alive && !zombie.isEating && !zombie.isChargingLaser ? Math.sin(cycle) * 0.35 : 0;

    // Chân xác ướp gầy guộc
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(-5 - Math.sin(legAngle) * 8, 28);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(5, 12);
    ctx.lineTo(5 + Math.sin(legAngle) * 8, 28);
    ctx.stroke();

    // Áo choàng tử thần bóng tối (Death Cultist Shroud)
    ctx.fillStyle = '#00251a';
    ctx.beginPath();
    ctx.roundRect(-12, -8 + walkY, 24, 23, 4);
    ctx.fill();

    // Viền thêu phù chú ngọc bích ma thuật
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-11, 4 + walkY, 22, 10);

    // Ký tự cổ ngữ phát sáng trên áo
    ctx.fillStyle = '#18ffff';
    ctx.fillRect(-6, 7 + walkY, 3, 4);
    ctx.fillRect(3, 7 + walkY, 3, 4);

    // Thân hình khô đét như xác ướp
    ctx.fillStyle = '#455a64';
    ctx.beginPath();
    ctx.roundRect(-8, -6 + walkY, 16, 18, 3);
    ctx.fill();

    // --- Đầu Linh Mục Tử Thần ---
    ctx.save();
    ctx.translate(-2, -20 + walkY);

    // Mũ lông quạ đen & ngọc bích ma quái
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.moveTo(-8, -10); ctx.lineTo(-14, -24); ctx.lineTo(-4, -12);
    ctx.moveTo(0, -10); ctx.lineTo(0, -28); ctx.lineTo(4, -10);
    ctx.moveTo(6, -10); ctx.lineTo(12, -23); ctx.lineTo(8, -11);
    ctx.fill();

    // Lông quạ đen ở viền mũ
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(-10, -10); ctx.lineTo(-18, -18); ctx.lineTo(-7, -13);
    ctx.moveTo(8, -10); ctx.lineTo(16, -17); ctx.lineTo(6, -13);
    ctx.fill();

    // Hộp sọ xác ướp khô đét
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.fill();

    // Hốc mắt đen sâu hoắm bốc khói ngọc bích
    ctx.fillStyle = '#00141a';
    ctx.beginPath();
    ctx.arc(-4, -1, 3.6, 0, Math.PI * 2);
    ctx.arc(4, -1, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // ĐỐM LỬA LINH HỒN NGỌC BÍCH LE LÓI TRONG HỐC MẮT (Spectral Cyan Soulflames)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(-4, -1, 1.6, 0, Math.PI * 2);
    ctx.arc(4, -1, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4.2, -1.2, 0.7, 0, Math.PI * 2);
    ctx.arc(3.8, -1.2, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Miệng khô đen lộ răng
    ctx.fillStyle = '#111111';
    ctx.fillRect(-4, 5, 8, 3);
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(-3, 5, 2, 2);
    ctx.fillRect(1, 5, 2, 2);

    ctx.restore();

    // --- SỌ NGỌC BÍCH MA THUẬT (CURSED TURQUOISE SKULL ARTIFACT) ---
    ctx.save();
    const skullPulse = zombie.isChargingLaser ? Math.sin((zombie.animTime || 0) * 16) * 3.0 : 0;
    const skullFloatY = Math.sin((zombie.animTime || 0) * 4) * 2;
    ctx.translate(-15, -6 + walkY + skullFloatY);

    // Cánh tay gầy trơ xương nâng sọ
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(9, -2);
    ctx.lineTo(0, 4);
    ctx.stroke();

    // KHI ĐANG TỤ LỰC LASER: Vòng tròn ma pháp & sấm sét ngọc bích (Occult Charge Vortex)
    if (zombie.isChargingLaser) {
      const chargeRatio = Math.min(1.0, (zombie.laserTimer || 0) / (zombie.laserChargeDuration || 5.0));

      // 1. Quầng hào quang năng lượng tà ác bùng phát
      ctx.save();
      ctx.fillStyle = `rgba(0, 229, 255, ${0.25 + chargeRatio * 0.55})`;
      ctx.beginPath();
      ctx.arc(0, 0, 18 + chargeRatio * 18 + skullPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Vòng tròn ma pháp xung kích
      ctx.strokeStyle = '#18ffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 15 + chargeRatio * 15, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Các tia chớp ma quỷ crackling xung quanh sọ
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        const sparkAng = (zombie.animTime * 12 + i * Math.PI * 0.5);
        const sx = Math.cos(sparkAng) * (12 + chargeRatio * 10);
        const sy = Math.sin(sparkAng) * (12 + chargeRatio * 10);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Khối Sọ Ngọc Bích Cổ Đại (Turquoise Skull)
    // Hào quang ma mị
    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -2, 12 + (skullPulse ? 1.5 : 0), 0, Math.PI * 2);
    ctx.fill();

    // Khối sọ ngọc bích
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(0, -2, 9.5 + (skullPulse ? 1 : 0), 0, Math.PI * 2);
    ctx.fill();

    // Hàm dưới sọ
    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.roundRect(-5.5, 4.5, 11, 6.5, 2);
    ctx.fill();

    // Hốc mắt đen thăm thẳm của sọ
    ctx.fillStyle = '#00252b';
    ctx.beginPath();
    ctx.arc(-3.8, -2, 2.8, 0, Math.PI * 2);
    ctx.arc(3.8, -2, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Tia sáng trắng tinh khiết lóe lên từ mắt sọ
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3.2, -2.5, 1.2, 0, Math.PI * 2);
    ctx.arc(4.2, -2.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Thanh tiến trình tụ lực Laser (5.0s) phong cách Ma Pháp Hắc Ám
    if (zombie.alive && zombie.isChargingLaser) {
      const chargeRatio = Math.min(1.0, (zombie.laserTimer || 0) / (zombie.laserChargeDuration || 5.0));
      const remainingSec = Math.max(0, (zombie.laserChargeDuration - zombie.laserTimer)).toFixed(1);

      ctx.save();
      ctx.fillStyle = '#18ffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ MA QUẢNG LASER: ${remainingSec}s`, 0, -42 + walkY);

      // Khung thanh năng lượng tà đạo
      ctx.fillStyle = 'rgba(0, 20, 25, 0.85)';
      ctx.fillRect(-20, -37 + walkY, 40, 5);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(-20, -37 + walkY, 40 * chargeRatio, 5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-20, -37 + walkY, 40, 5);
      ctx.restore();
    }

    this.drawZombieStatus(ctx, zombie, walkY, -52, -42);

    if (zombie.alive && zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -16, -34, 32, 4, zombie.hp / zombie.maxHp, '#00e5ff');
    }

    ctx.restore();
  }

  // 6.1. Khối Băng Chứa Yeti Imp (Ice Block - Frostbite Caves)
  drawIceBlock(ctx, zombie) {
    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 2.0);
    }

    // Bóng đổ trên mặt đất
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 24, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Khối băng tinh thể 3D bán trong suốt
    const hpRatio = Math.max(0, zombie.hp / zombie.maxHp);
    const iceGrad = ctx.createLinearGradient(-22, -26, 22, 26);
    iceGrad.addColorStop(0, 'rgba(224, 247, 250, 0.95)');
    iceGrad.addColorStop(0.3, 'rgba(128, 222, 234, 0.88)');
    iceGrad.addColorStop(0.7, 'rgba(38, 198, 218, 0.85)');
    iceGrad.addColorStop(1, 'rgba(0, 151, 167, 0.9)');

    ctx.fillStyle = iceGrad;
    ctx.beginPath();
    ctx.roundRect(-22, -26, 44, 52, 8);
    ctx.fill();

    ctx.strokeStyle = '#b2ebf2';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Bóng hình mờ của Yeti Imp bị đông cứng bên trong khối băng
    ctx.fillStyle = 'rgba(236, 239, 241, 0.65)';
    ctx.beginPath();
    ctx.arc(0, -6, 10, 0, Math.PI * 2); // Đầu imp
    ctx.roundRect(-8, 3, 16, 15, 4);    // Thân imp
    ctx.fill();

    // 2 sừng băng nhỏ của Yeti Imp lờ mờ bên trong
    ctx.fillStyle = 'rgba(0, 172, 193, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-7, -13); ctx.lineTo(-12, -20); ctx.lineTo(-4, -14);
    ctx.moveTo(7, -13); ctx.lineTo(12, -20); ctx.lineTo(4, -14);
    ctx.fill();

    // Mắt đỏ phát sáng lấp ló trong băng
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(-3, -7, 1.8, 0, Math.PI * 2);
    ctx.arc(3, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Vệt nứt trên tảng băng khi mất máu
    if (hpRatio < 0.75) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-14, -18); ctx.lineTo(-6, -6); ctx.lineTo(-12, 6);
      ctx.stroke();
    }
    if (hpRatio < 0.45) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(12, -15); ctx.lineTo(4, -2); ctx.lineTo(10, 12);
      ctx.moveTo(-4, -24); ctx.lineTo(2, -12); ctx.lineTo(-2, 18);
      ctx.stroke();
    }

    // Tia sáng lấp lánh phản chiếu bề mặt băng
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-16, -20); ctx.lineTo(-6, -24); ctx.lineTo(-12, -16);
    ctx.closePath();
    ctx.fill();

    // Thanh máu nếu bị thương
    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -34, 36, 4.5, hpRatio, '#00e5ff');
    }

    ctx.restore();
  }

  // 6.2. Zombie Người Tiền Sử Đẩy Băng (Troglobite - Frostbite Caves)
  drawTroglobite(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 24, 22, 7.5, zombie.animTime || 0, false, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.5);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const isMoving = zombie.alive && !zombie.isEating;
    const walkY = isMoving ? Math.sin(cycle) * 2.0 : 0;
    const legAngle = isMoving ? Math.sin(cycle) * 0.35 : 0;

    // Chân và bàn chân người tiền sử
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    // Chân trái
    ctx.save();
    ctx.translate(-5, 12);
    ctx.rotate(legAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 14); ctx.stroke();
    ctx.restore();
    // Chân phải
    ctx.save();
    ctx.translate(6, 12);
    ctx.rotate(-legAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1, 14); ctx.stroke();
    ctx.restore();

    // Thân áo da thú tiền sử (Fur Tunic)
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.moveTo(-13, -8 + walkY);
    ctx.lineTo(13, -8 + walkY);
    ctx.lineTo(15, 14 + walkY);
    ctx.lineTo(9, 10 + walkY);
    ctx.lineTo(3, 15 + walkY);
    ctx.lineTo(-4, 11 + walkY);
    ctx.lineTo(-10, 16 + walkY);
    ctx.lineTo(-14, 11 + walkY);
    ctx.closePath();
    ctx.fill();

    // Đốm họa tiết da báo tiền sử
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(-5, 0 + walkY, 2.5, 0, Math.PI * 2);
    ctx.arc(5, 4 + walkY, 2.2, 0, Math.PI * 2);
    ctx.arc(1, -4 + walkY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Dây đai xương chéo qua ngực
    ctx.strokeStyle = '#d7ccc8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-11, -8 + walkY);
    ctx.lineTo(11, 10 + walkY);
    ctx.stroke();

    // Đầu người tiền sử với trán vồ và tóc rối
    ctx.fillStyle = '#558b2f';
    ctx.beginPath();
    ctx.arc(0, -18 + walkY, 11, 0, Math.PI * 2);
    ctx.fill();

    // Tóc bờm đen tiền sử bù xù
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, -22 + walkY, 13, Math.PI, 0);
    ctx.lineTo(12, -14 + walkY);
    ctx.lineTo(9, -10 + walkY);
    ctx.lineTo(-9, -10 + walkY);
    ctx.lineTo(-12, -14 + walkY);
    ctx.closePath();
    ctx.fill();

    // Khúc xương gài trên tóc
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.roundRect(-10, -25 + walkY, 20, 4, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-10, -25 + walkY, 3, 0, Math.PI * 2);
    ctx.arc(10, -25 + walkY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mắt hung tợn và miệng nhe răng
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(-4, -18 + walkY, 2.8, 0, Math.PI * 2);
    ctx.arc(4, -18 + walkY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(-4, -18 + walkY, 1.4, 0, Math.PI * 2);
    ctx.arc(4, -18 + walkY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Hai cánh tay dang rộng vươn về phía trước đẩy tảng băng!
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -4 + walkY);
    ctx.lineTo(-20, -6 + walkY);
    ctx.lineTo(-26, -3 + walkY);

    ctx.moveTo(6, -4 + walkY);
    ctx.lineTo(-14, 2 + walkY);
    ctx.lineTo(-24, 4 + walkY);
    ctx.stroke();

    // Thanh máu nếu bị thương
    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -18, -35 + walkY, 36, 4.5, zombie.hp / zombie.maxHp, '#ff1744');
    }

    ctx.restore();
  }

  // 6.3. Yeti Imp Nhanh Nhẹn (Frostbite Caves)
  drawYetiImp(ctx, zombie) {
    const isLowHp = zombie.hp < zombie.maxHp * 0.5;
    if (zombie.alive) {
      this.drawHorrorShadow(ctx, zombie.x, zombie.y + 20, 16, 5.5, zombie.animTime || 0, false, isLowHp);
    }

    ctx.save();
    ctx.translate(zombie.x, zombie.y);

    if (!zombie.alive) {
      ctx.globalAlpha = Math.max(0, 1 - zombie.deathTimer * 1.6);
      this.drawHorrorDissolution(ctx, zombie);
    }

    const cycle = Number.isFinite(zombie.walkCycle) ? zombie.walkCycle : 0;
    const isMoving = zombie.alive && !zombie.isEating;
    const runCycle = cycle * 1.5;
    const walkY = isMoving ? Math.sin(runCycle) * 2.2 : 0;
    const legAngle = isMoving ? Math.sin(runCycle) * 0.55 : 0;

    // Chân Yeti tí hon chạy thoăn thoắt
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.save();
    ctx.translate(-4, 10);
    ctx.rotate(legAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-2, 10); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(4, 10);
    ctx.rotate(-legAngle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1, 10); ctx.stroke();
    ctx.restore();

    // Thân lông xù trắng muốt của Yeti (Fluffy White Body)
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.roundRect(-9, -2 + walkY, 18, 15, 6);
    ctx.fill();
    ctx.strokeStyle = '#b0bec5';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Đầu Yeti Imp to tròn phủ đầy lông trắng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -11 + walkY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Khuôn mặt da xanh băng giá
    ctx.fillStyle = '#80deea';
    ctx.beginPath();
    ctx.ellipse(0, -10 + walkY, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hai sừng băng xanh ngọc cong nhọn trên đầu
    ctx.fillStyle = '#00acc1';
    ctx.beginPath();
    ctx.moveTo(-6, -18 + walkY); ctx.lineTo(-12, -26 + walkY); ctx.lineTo(-2, -20 + walkY);
    ctx.moveTo(6, -18 + walkY); ctx.lineTo(12, -26 + walkY); ctx.lineTo(2, -20 + walkY);
    ctx.fill();

    // Đôi mắt đỏ hung tợn của quỷ tuyết
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.arc(-3, -11 + walkY, 2.5, 0, Math.PI * 2);
    ctx.arc(3, -11 + walkY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(-3, -11 + walkY, 1.3, 0, Math.PI * 2);
    ctx.arc(3, -11 + walkY, 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Miệng nhe răng nanh nhọn hoắt
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(0, -6 + walkY, 3, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -6 + walkY, 1.2, 2);
    ctx.fillRect(1, -6 + walkY, 1.2, 2);

    // Hai tay lông xù vung vẩy khi chạy
    ctx.strokeStyle = '#eceff1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-8, -2 + walkY);
    ctx.lineTo(-14, 4 + walkY);
    ctx.moveTo(8, -2 + walkY);
    ctx.lineTo(14, 4 + walkY);
    ctx.stroke();

    // Thanh máu nếu bị thương
    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -14, -28 + walkY, 28, 3.5, zombie.hp / zombie.maxHp, '#ff1744');
    }

    ctx.restore();
  }

  // 6. Tia Laser Ma Thuật Hư Vô của Turquoise Skull (Eldritch Void-Beam FX)
  drawLaserBeams(ctx, laserBeams) {
    for (const beam of laserBeams) {
      if (beam.timer <= 0) continue;
      const alpha = Math.min(1.0, beam.timer / 0.16);

      ctx.save();
      // 1. Quầng năng lượng Plasma ngọc bích ma quái tỏa rộng
      ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.85})`;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      // 2. Luồng sấm sét ngọc bích dao động cuồng bạo
      ctx.strokeStyle = `rgba(24, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      // 3. Lõi hủy diệt trắng tinh khiết xuyên phá (4000 damage)
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(beam.fromX, beam.fromY);
      ctx.lineTo(beam.toX, beam.toY);
      ctx.stroke();

      // 4. Vòng tròn nổ xung kích tàn phá tại tâm điểm cây mục tiêu
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(beam.toX, beam.toY, 22, 0, Math.PI * 2);
      ctx.fill();

      // Lõi nổ trắng lóa
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(beam.toX, beam.toY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Vòng hào quang xung kích mở rộng
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(beam.toX, beam.toY, 28 * (1.1 - alpha * 0.1), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // 7. Vẽ Imp đang bay theo quỹ đạo parabol trên không trung (Horror Flying Imp)
  drawFlyingImps(ctx, flyingImps) {
    for (const fImp of flyingImps) {
      if (!fImp.alive) continue;

      const heightAboveLawn = Math.max(0, fImp.targetY - fImp.y);
      const shadowScale = Math.max(0.35, 1 - heightAboveLawn / 120);

      // Bóng tử khí đổ trên sân cỏ
      ctx.save();
      ctx.fillStyle = 'rgba(6, 3, 10, 0.45)';
      ctx.beginPath();
      ctx.ellipse(fImp.x, fImp.targetY + 28, 14 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Imp quỷ dữ nhào lộn
      ctx.save();
      ctx.translate(fImp.x, fImp.y);
      ctx.rotate(fImp.rotation);
      ctx.scale(0.68, 0.68);

      // Thân yếm tím đen
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.roundRect(-8, -4, 16, 16, 3);
      ctx.fill();

      // Tay chân quỷ giang rộng với móng vuốt nhọn
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-6, -2); ctx.lineTo(-14, -10);
      ctx.moveTo(6, -2); ctx.lineTo(14, -10);
      ctx.moveTo(-4, 10); ctx.lineTo(-10, 18);
      ctx.moveTo(4, 10); ctx.lineTo(10, 18);
      ctx.stroke();

      // Móng vuốt đen
      ctx.fillStyle = '#111111';
      ctx.fillRect(-15, -12, 4, 3);
      ctx.fillRect(13, -12, 4, 3);

      // Đầu Imp quỷ với mắt đỏ rực và tai dơi
      ctx.fillStyle = '#546e7a';
      ctx.beginPath();
      ctx.arc(0, -12, 12.5, 0, Math.PI * 2);
      ctx.fill();

      // Tai nhọn dơi
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.moveTo(-7, -14); ctx.lineTo(-16, -21); ctx.lineTo(-5, -8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, -14); ctx.lineTo(16, -21); ctx.lineTo(5, -8);
      ctx.closePath();
      ctx.fill();

      // Mắt trợn trừng đỏ rực khi đang bay
      ctx.fillStyle = '#0a0d0b';
      ctx.beginPath();
      ctx.arc(-3.5, -12, 4.2, 0, Math.PI * 2);
      ctx.arc(3.5, -12, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(-3.5, -12, 2.5, 0, Math.PI * 2);
      ctx.arc(3.5, -12, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Miệng cười điên dại với răng kim
      ctx.fillStyle = '#fffde7';
      ctx.fillRect(-4, -6, 2, 2.5);
      ctx.fillRect(0, -6, 2, 2.5);

      ctx.restore();
    }
  }

  // Vẽ các biểu tượng trạng thái phong cách Horror (Choáng, Chậm, Độc)
  drawZombieStatus(ctx, zombie, walkY, stunY, debuffY) {
    // 1. Choáng (Stun): Vòng xoáy sao phù thủy & hào quang vàng
    if (zombie.stunTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💫 CHOÁNG', 0, stunY + walkY);
      ctx.restore();
    }

    // 2. Chậm (Slow): Huy hiệu băng tuyết nổi bật & làm chậm 50%
    if (zombie.slowTimer > 0) {
      ctx.save();
      const badgeY = debuffY + walkY;
      ctx.fillStyle = 'rgba(0, 40, 60, 0.85)';
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-32, badgeY - 10, 64, 13, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#80d8ff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❄️ BĂNG (-50%)', 0, badgeY);
      ctx.restore();
    }

    // 3. Độc Dược Ăn Mòn (Poison): Đầu lâu hóa chất tím & bong bóng độc
    if (zombie.poisonStacks > 0) {
      ctx.save();
      ctx.fillStyle = '#ea80fc';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`☣️ ĐỘC x${zombie.poisonStacks}`, 16, debuffY + walkY);
      ctx.restore();
    }
  }

  drawProjectile(ctx, proj) {
    // 1. Bóng đổ ma quái trên bãi đất mộ
    const shadowY = CONFIG.GRID_OFFSET_Y + proj.row * CONFIG.CELL_HEIGHT + 72;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(proj.x, shadowY, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Viên đạn bay trên không mang phong cách Eldritch Horror
    ctx.save();
    ctx.translate(proj.x, proj.y);

    if (proj.isRollingPoisonBoulder) {
      // Tảng đá độc khổng lồ lăn dọc hàng (Goo Peashooter Plant Food)
      const rollAngle = (proj.x / 18) * Math.PI * 2;
      ctx.rotate(rollAngle);

      const boulderGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, 22);
      boulderGrad.addColorStop(0, '#ea80fc');
      boulderGrad.addColorStop(0.4, '#aa00ff');
      boulderGrad.addColorStop(0.8, '#4a148c');
      boulderGrad.addColorStop(1, '#1a0033');

      ctx.fillStyle = boulderGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 3.0;
      ctx.stroke();

      // Bong bóng độc phát sáng xoay tròn theo đá
      ctx.fillStyle = '#76ff03';
      ctx.beginPath();
      ctx.arc(-8, -8, 4, 0, Math.PI * 2);
      ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
      ctx.arc(-5, 11, 4.5, 0, Math.PI * 2);
      ctx.arc(7, 9, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return;
    }

    if (proj.type === 'galio_wave' || proj.isEnergyWave) {
      if (proj.isGiant) {
        ctx.scale(1.4, 1.4);
      }
      // Sóng năng lượng trăng khuyết vàng-lục bảo của Galio
      ctx.fillStyle = 'rgba(0, 229, 255, 0.32)';
      ctx.beginPath();
      ctx.arc(-4, 0, 26, -Math.PI * 0.44, Math.PI * 0.44);
      ctx.quadraticCurveTo(4, 0, -4, -26 * Math.sin(Math.PI * 0.44));
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(4, -22);
      ctx.quadraticCurveTo(22, 0, 4, 22);
      ctx.quadraticCurveTo(10, 0, 4, -22);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fff59d';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(6, -18);
      ctx.quadraticCurveTo(20, 0, 6, 18);
      ctx.stroke();

      ctx.restore();
      return;
    }

    if (proj.isGiant) {
      ctx.scale(2.2, 2.2);
    }

    if (proj.type === 'goo_pea') {
      // Bào tử huyết độc ăn mòn (Caustic Nether-Ichor Orb)
      ctx.fillStyle = '#4a148c';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e040fb';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(213, 0, 249, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-7, 0, 5, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(-12, 1, 3, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'ice_pea') {
      // Băng tinh cầu (Snow Pea Frozen Crystal)
      // Vệt khói sương băng lạnh
      ctx.fillStyle = 'rgba(128, 222, 234, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-8, 0, 7, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cầu băng xanh ngọc
      ctx.fillStyle = '#00b4d8';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      // Lõi băng trắng lóa
      ctx.fillStyle = '#caf0f8';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Tâm pha lê băng
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'cabbage') {
      // Quả bắp cải tươi cuộn nhiều lớp lá xanh non
      const cabProjGrad = ctx.createRadialGradient(-2, -2, 1.5, 0, 0, 10);
      cabProjGrad.addColorStop(0, '#e8f5e9');
      cabProjGrad.addColorStop(0.5, '#81c784');
      cabProjGrad.addColorStop(1, '#2e7d32');
      ctx.fillStyle = cabProjGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Gân lá bắp cải cuộn xoắn
      ctx.strokeStyle = '#c8e6c9';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(-1, -1, 5.5, -0.4, 2.3);
      ctx.moveTo(5, -5); ctx.quadraticCurveTo(0, 0, -6, -3);
      ctx.stroke();
    } else if (proj.type === 'melon') {
      // Quả dưa hấu nặng ký sọc xanh đậm đặc trưng
      const melProjGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
      melProjGrad.addColorStop(0, '#a5d6a7');
      melProjGrad.addColorStop(0.45, '#43a047');
      melProjGrad.addColorStop(1, '#1b5e20');
      ctx.fillStyle = melProjGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 13.5, 10.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a330e';
      ctx.lineWidth = 1.7;
      ctx.stroke();

      // Kẻ sọc dọc đặc trưng dưa hấu
      ctx.strokeStyle = '#0d3b12';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-11, -4); ctx.quadraticCurveTo(0, -7, 11, -4);
      ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, 1, 12, 0);
      ctx.moveTo(-11, 4); ctx.quadraticCurveTo(0, 7, 11, 4);
      ctx.stroke();
    } else if (proj.type === 'jhin_bullet' || proj.isJhinBullet) {
      if (proj.isFourthShot) {
        // Viên thứ 4: Đạn nghệ thuật tử thần đỏ-vàng rực rỡ
        ctx.fillStyle = 'rgba(255, 23, 68, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-14, 0, 16, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e040fb';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -7.5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-8, 7.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff59d';
        ctx.beginPath();
        ctx.arc(2, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Viên 1-3: Đạn xuyên tím-đỏ sắc bén
        ctx.fillStyle = 'rgba(206, 147, 216, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-9, 0, 9, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7b1fa2';
        ctx.strokeStyle = '#ff5252';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Bào tử axit ăn mòn quái vật (Luminescent Acid Spore - Peashooter / Repeater)
      ctx.fillStyle = 'rgba(100, 221, 23, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-7, 0, 6, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(-13, 0, 3.5, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1b5e20';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#76ff03';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2.2, -2.2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#003300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
      ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Vẽ hàng rào toàn ảnh (Infi-nut Plant Food)
  drawBarriers(ctx, barriers) {
    for (const b of barriers) {
      if (!b.alive) continue;
      const topY = CONFIG.GRID_OFFSET_Y;
      const height = CONFIG.ROWS * CONFIG.CELL_HEIGHT;

      ctx.save();
      // Luồng bức xạ huyết ấn ma thuật / laser hư không bảo vệ qua 5 hàng
      ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.fillRect(b.x - 14, topY, 28, height);

      // Cột laser chính giữa phát sáng rực rỡ
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(b.x, topY);
      ctx.lineTo(b.x, topY + height);
      ctx.stroke();

      // Cột phụ huyết ngọc rực đỏ song hành
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(b.x - 4, topY);
      ctx.lineTo(b.x - 4, topY + height);
      ctx.moveTo(b.x + 4, topY);
      ctx.lineTo(b.x + 4, topY + height);
      ctx.stroke();

      // Lưới cổ ngữ bảo hộ thần bí
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      for (let y = topY; y < topY + height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(b.x - 12, y);
        ctx.lineTo(b.x + 12, y);
        ctx.stroke();
      }

      // Thanh máu của hàng rào 10.000 HP
      if (b.hp < b.maxHp) {
        this.drawHealthBar(ctx, b.x - 25, topY - 14, 50, 6, b.hp / b.maxHp, '#00e5ff');
      }

      ctx.restore();
    }
  }

  // Vẽ các tia sét zig-zag của Sậy Sét Hư Không
  drawLightningArcs(ctx, arcs) {
    for (const arc of arcs) {
      if (arc.timer <= 0) continue;
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3.5;

      const segments = 4;
      const dx = (arc.toX - arc.fromX) / segments;
      const dy = (arc.toY - arc.fromY) / segments;

      ctx.beginPath();
      ctx.moveTo(arc.fromX, arc.fromY);
      for (let i = 1; i < segments; i++) {
        const jitter = (Math.random() - 0.5) * 18;
        ctx.lineTo(arc.fromX + dx * i + jitter, arc.fromY + dy * i + jitter);
      }
      ctx.lineTo(arc.toX, arc.toY);
      ctx.stroke();

      // Lõi tia sét trắng - tím hư không
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Vẽ đám mây tử khí kinh hoàng của Mandrake Stunion (Banshee Necrotic Miasma)
  drawGasClouds(ctx, clouds) {
    for (const cloud of clouds) {
      const progress = cloud.timer / cloud.maxDuration;
      const alpha = Math.max(0, 1 - progress);
      const radius = 25 + progress * 38;

      ctx.save();
      ctx.globalAlpha = alpha * 0.75;
      
      // Hào quang sương mù tử khí xanh lục lân tinh pha tím
      ctx.fillStyle = 'rgba(100, 255, 218, 0.35)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Lớp khói u ám độc tố bên trong
      ctx.fillStyle = 'rgba(118, 255, 3, 0.4)';
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, radius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Các đốm linh hồn oán than xoay vòng
      ctx.fillStyle = '#b9f6ca';
      for (let i = 0; i < 6; i++) {
        const angle = i * (Math.PI * 2 / 6) + cloud.timer * 3.5;
        const ox = Math.cos(angle) * (radius * 0.72);
        const oy = Math.sin(angle) * (radius * 0.72);
        ctx.beginPath();
        ctx.arc(cloud.x + ox, cloud.y + oy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Vẽ vùng đánh dấu phạm vi tấn công gọn, sắc nét trên mặt cỏ (không che khuất cây/zombie)
  drawAttackRangeZones(ctx, effects) {
    for (const eff of effects) {
      const duration = Math.max(0.05, eff.duration || 0.35);
      const progress = Math.min(1, Math.max(0, (eff.timer || 0) / duration));
      const alpha = Math.pow(1 - progress, 0.85);
      if (alpha <= 0.02) continue;

      const minRow = Math.max(0, eff.minRow !== undefined ? eff.minRow : eff.row);
      const maxRow = Math.min(CONFIG.ROWS - 1, eff.maxRow !== undefined ? eff.maxRow : eff.row);
      const topY = CONFIG.GRID_OFFSET_Y + minRow * CONFIG.CELL_HEIGHT + 4;
      const bottomY = CONFIG.GRID_OFFSET_Y + (maxRow + 1) * CONFIG.CELL_HEIGHT - 4;
      const zoneX = eff.startX;
      const zoneW = Math.max(12, eff.endX - eff.startX);
      const zoneH = Math.max(12, bottomY - topY);

      let fillCol = 'rgba(255, 193, 7, 0.16)';
      let borderCol = 'rgba(255, 171, 64, 0.72)';

      if (eff.kind === 'snapdragon_flame') {
        fillCol = 'rgba(255, 87, 34, 0.18)';
        borderCol = 'rgba(255, 152, 0, 0.78)';
      } else if (eff.kind === 'bonk_choy_punch' || eff.kind === 'bonk_choy_flurry') {
        fillCol = 'rgba(118, 255, 3, 0.14)';
        borderCol = 'rgba(178, 255, 89, 0.72)';
      } else if (eff.kind === 'chomper_bite' || eff.kind === 'chomper_burp') {
        fillCol = 'rgba(213, 0, 249, 0.15)';
        borderCol = 'rgba(234, 128, 252, 0.75)';
      } else if (eff.kind === 'stunion_gas') {
        fillCol = 'rgba(0, 230, 118, 0.16)';
        borderCol = 'rgba(105, 240, 174, 0.75)';
      } else if (eff.kind === 'galio_strike' || eff.kind === 'galio_vortex') {
        fillCol = 'rgba(0, 229, 255, 0.14)';
        borderCol = 'rgba(255, 215, 64, 0.78)';
      } else if (eff.kind === 'lang_khach_dash' || eff.kind === 'lang_khach_tornado') {
        fillCol = 'rgba(128, 222, 234, 0.16)';
        borderCol = 'rgba(229, 57, 53, 0.75)';
      } else if (eff.kind === 'blast_3x3') {
        fillCol = 'rgba(255, 23, 68, 0.20)';
        borderCol = eff.color || 'rgba(255, 82, 82, 0.8)';
      } else if (eff.kind === 'lotus_2x2') {
        fillCol = 'rgba(224, 64, 251, 0.22)';
        borderCol = 'rgba(255, 23, 68, 0.88)';
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      // Một lớp phủ nhẹ và một viền liền mảnh duy nhất để nhìn rõ đúng ô phạm vi
      ctx.fillStyle = fillCol;
      ctx.beginPath();
      ctx.roundRect(zoneX, topY, zoneW, zoneH, 6);
      ctx.fill();

      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Vẽ hiệu ứng đòn đánh gọn gàng, rõ hướng và đúng ranh giới tầm đánh
  drawAttackEffectVfx(ctx, effects) {
    for (const eff of effects) {
      const duration = Math.max(0.05, eff.duration || 0.35);
      const p = Math.min(1, Math.max(0, (eff.timer || 0) / duration));
      const fade = Math.pow(1 - p, 0.85);
      if (fade <= 0.02) continue;

      const minRow = Math.max(0, eff.minRow !== undefined ? eff.minRow : eff.row);
      const maxRow = Math.min(CONFIG.ROWS - 1, eff.maxRow !== undefined ? eff.maxRow : eff.row);
      const topY = CONFIG.GRID_OFFSET_Y + minRow * CONFIG.CELL_HEIGHT + 4;
      const bottomY = CONFIG.GRID_OFFSET_Y + (maxRow + 1) * CONFIG.CELL_HEIGHT - 4;
      const zoneW = Math.max(12, eff.endX - eff.startX);

      ctx.save();
      ctx.globalAlpha = fade;

      if (eff.kind === 'snapdragon_flame') {
        const originX = eff.x + 14;
        const originY = eff.y - 6;
        const reachRatio = Math.min(1, p * 2.8);
        const curEndX = eff.x + (eff.endX - eff.x) * reachRatio;

        for (let r = minRow; r <= maxRow; r++) {
          const rowCenterY = CONFIG.GRID_OFFSET_Y + (r + 0.5) * CONFIG.CELL_HEIGHT;
          const midX = originX + (curEndX - originX) * 0.5;
          const midY = originY + (rowCenterY - originY) * 0.65;
          const halfThick = eff.isPlantFood ? 14 : 10;

          // Luồng lửa thon gọn trong suốt vừa đủ thấy 3 hàng mà không che zombie
          const flameGrad = ctx.createLinearGradient(originX, originY, curEndX, rowCenterY);
          flameGrad.addColorStop(0, 'rgba(255, 238, 88, 0.82)');
          flameGrad.addColorStop(0.45, 'rgba(255, 111, 0, 0.62)');
          flameGrad.addColorStop(1, 'rgba(229, 57, 53, 0.08)');

          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(originX, originY - 2.5);
          ctx.quadraticCurveTo(midX, midY - halfThick, curEndX, rowCenterY - halfThick * 0.35);
          ctx.quadraticCurveTo(curEndX + 8, rowCenterY, curEndX, rowCenterY + halfThick * 0.35);
          ctx.quadraticCurveTo(midX, midY + halfThick, originX, originY + 2.5);
          ctx.closePath();
          ctx.fill();

          // Tia lửa mảnh ở tâm hàng
          ctx.strokeStyle = 'rgba(255, 253, 231, 0.65)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(originX + 4, originY);
          ctx.quadraticCurveTo(midX, midY, curEndX - 6, rowCenterY);
          ctx.stroke();
        }
      } else if (eff.kind === 'bonk_choy_punch') {
        const reach = Math.min(1, p * 3.4);
        const dir = eff.punchDir === -1 ? -1 : 1;
        const leftReachX = eff.x - (eff.x - eff.startX) * reach;
        const rightReachX = eff.x + (eff.endX - eff.x) * reach;

        // Vệt sóng cung đấm gọn nhẹ ở 2 mép tầm đánh, nhấn mạnh phía đang đấm
        for (const targetEdgeX of [leftReachX, rightReachX]) {
          const isLeft = targetEdgeX < eff.x;
          const isPrimary = (dir === -1 && isLeft) || (dir === 1 && !isLeft) || eff.punchDir === 0;

          ctx.strokeStyle = isPrimary ? 'rgba(178, 255, 89, 0.9)' : 'rgba(178, 255, 89, 0.45)';
          ctx.lineWidth = isPrimary ? 2.8 : 1.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (isLeft) {
            ctx.arc(targetEdgeX + 8, eff.y, 16, Math.PI * 0.68, Math.PI * 1.32);
          } else {
            ctx.arc(targetEdgeX - 8, eff.y, 16, -Math.PI * 0.32, Math.PI * 0.32);
          }
          ctx.stroke();

          if (isPrimary) {
            // Một vệt lướt ngắn từ tay tới điểm va chạm
            ctx.strokeStyle = 'rgba(255, 255, 141, 0.72)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(eff.x + (isLeft ? -14 : 14), eff.y);
            ctx.lineTo(targetEdgeX + (isLeft ? 8 : -8), eff.y);
            ctx.stroke();
          }
        }
      } else if (eff.kind === 'bonk_choy_flurry') {
        const cx = (eff.startX + eff.endX) / 2;
        const cy = (topY + bottomY) / 2;
        const halfW = zoneW / 2;
        const halfH = (bottomY - topY) / 2;
        const rp = Math.min(1, p * 1.8);

        ctx.strokeStyle = 'rgba(178, 255, 89, 0.85)';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(12, halfW * rp), Math.max(12, halfH * rp), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eff.kind === 'chomper_bite') {
        const biteX = eff.targetX || (eff.startX + zoneW * 0.65);
        const snap = Math.sin(Math.min(1, p * 2.2) * Math.PI);
        const jawGap = 18 * (1 - snap * 0.85);

        ctx.strokeStyle = 'rgba(234, 128, 252, 0.88)';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(biteX, eff.y - jawGap, 20, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(biteX, eff.y + jawGap, 20, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();
      } else if (eff.kind === 'chomper_burp') {
        for (let w = 0; w < 2; w++) {
          const wp = Math.min(1, Math.max(0, p * 1.4 - w * 0.2));
          if (wp <= 0) continue;
          const wx = eff.x + (eff.endX - eff.x) * wp;
          ctx.strokeStyle = w === 0 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(234, 128, 252, 0.72)';
          ctx.lineWidth = 3 - w;
          ctx.beginPath();
          ctx.arc(wx - 12, eff.y, 20, -Math.PI * 0.36, Math.PI * 0.36);
          ctx.stroke();
        }
      } else if (eff.kind === 'stunion_gas') {
        const cx = (eff.startX + eff.endX) / 2;
        const cy = (topY + bottomY) / 2;
        const rx = (zoneW / 2) * Math.min(1, p * 2.4);
        const ry = ((bottomY - topY) / 2) * Math.min(1, p * 2.4);

        ctx.strokeStyle = 'rgba(105, 240, 174, 0.82)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(10, rx), Math.max(10, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eff.kind === 'galio_strike') {
        const reach = Math.min(1, p * 3.4);
        const dir = eff.punchDir === -1 ? -1 : 1;
        const leftReachX = eff.x - (eff.x - eff.startX) * reach;
        const rightReachX = eff.x + (eff.endX - eff.x) * reach;

        for (const targetEdgeX of [leftReachX, rightReachX]) {
          const isLeft = targetEdgeX < eff.x;
          const isPrimary = (dir === -1 && isLeft) || (dir === 1 && !isLeft) || eff.punchDir === 0;
          ctx.strokeStyle = isPrimary ? 'rgba(0, 229, 255, 0.92)' : 'rgba(0, 229, 255, 0.42)';
          ctx.lineWidth = isPrimary ? 2.8 : 1.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (isLeft) {
            ctx.arc(targetEdgeX + 8, eff.y, 17, Math.PI * 0.68, Math.PI * 1.32);
          } else {
            ctx.arc(targetEdgeX - 8, eff.y, 17, -Math.PI * 0.32, Math.PI * 0.32);
          }
          ctx.stroke();

          if (isPrimary) {
            ctx.strokeStyle = 'rgba(255, 215, 64, 0.78)';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(eff.x + (isLeft ? -14 : 14), eff.y);
            ctx.lineTo(targetEdgeX + (isLeft ? 8 : -8), eff.y);
            ctx.stroke();
          }
        }
      } else if (eff.kind === 'galio_vortex') {
        // Vòng xoáy hút trọng lực & tia kéo 5 zombie về ô Galio
        const ringR = 16 + Math.sin(p * Math.PI) * 26;
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(eff.x, eff.y, ringR, ringR * 0.72, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(eff.x, eff.y, ringR * 0.58, ringR * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();

        if (Array.isArray(eff.pulledPaths)) {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
          ctx.lineWidth = 2.2;
          for (const path of eff.pulledPaths) {
            ctx.beginPath();
            ctx.moveTo(path.fromX, path.fromY);
            ctx.lineTo(path.toX, path.toY);
            ctx.stroke();
          }
        }
      } else if (eff.kind === 'lang_khach_dash') {
        const dashX = eff.endX - (eff.endX - eff.startX) * Math.min(1, p * 1.6);
        ctx.strokeStyle = 'rgba(128, 222, 234, 0.9)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(eff.endX, eff.y);
        ctx.lineTo(dashX, eff.y);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(eff.endX, eff.y - 8);
        ctx.lineTo(dashX, eff.y - 8);
        ctx.stroke();
      } else if (eff.kind === 'lang_khach_tornado') {
        const cx = eff.endX - (eff.endX - eff.startX) * Math.min(1, p * 1.15);
        for (let ring = 0; ring < 5; ring++) {
          const ry = eff.y + 22 - ring * 11;
          const rx = 10 + ring * 5;
          const spin = p * 18 + ring;
          ctx.strokeStyle = ring % 2 === 0 ? 'rgba(178, 235, 242, 0.9)' : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.ellipse(cx + Math.sin(spin) * 4, ry, rx, 6.5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (let l = 0; l < 6; l++) {
          const la = p * 16 + l * 1.05;
          const lx = cx + Math.cos(la) * (14 + (l % 3) * 6);
          const ly = eff.y + 18 - ((l * 9 + p * 30) % 44);
          ctx.fillStyle = l % 2 === 0 ? '#e53935' : '#ff9800';
          ctx.beginPath();
          ctx.arc(lx, ly, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (eff.kind === 'blast_3x3') {
        const cx = (eff.startX + eff.endX) / 2;
        const cy = (topY + bottomY) / 2;
        const expRatio = Math.min(1, p * 2.4);
        const rx = (zoneW / 2) * expRatio;
        const ry = ((bottomY - topY) / 2) * expRatio;

        ctx.strokeStyle = eff.color || 'rgba(255, 82, 82, 0.85)';
        ctx.lineWidth = 3.2 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(12, rx), Math.max(12, ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (eff.kind === 'lotus_2x2') {
        const cx = (eff.startX + eff.endX) / 2;
        const cy = (topY + bottomY) / 2;
        const expRatio = Math.min(1, p * 1.9);
        const maxR = Math.min(zoneW, bottomY - topY) * 0.52 * expRatio;

        // Cánh hoa sen tím-đỏ nở tung trong vùng nổ 2x2
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4 + p * 0.9;
          const px = cx + Math.cos(ang) * maxR * 0.65;
          const py = cy + Math.sin(ang) * maxR * 0.65;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(224, 64, 251, 0.72)' : 'rgba(255, 23, 68, 0.75)';
          ctx.beginPath();
          ctx.ellipse(px, py, Math.max(6, maxR * 0.35), Math.max(4, maxR * 0.16), ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255, 215, 64, 0.88)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(8, maxR * 0.4), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Vẽ Tinh Hồn Hắc Ám (Soul Orb / Ethereal Nether Flame) thay thế mặt trời hoạt hình
  drawSun(ctx, sun) {
    ctx.save();
    const bob = Math.sin(sun.floatTimer) * 4;
    ctx.translate(sun.x, sun.y + bob);

    // Độ mờ khi gần biến mất
    if (!sun.collected && sun.lifetime > CONFIG.NATURAL_SUN_LIFETIME - 2.0) {
      const remaining = CONFIG.NATURAL_SUN_LIFETIME - sun.lifetime;
      ctx.globalAlpha = Math.max(0.2, remaining / 2.0);
    }

    // 1. Quầng hào quang huyết ấn & linh hồn ma quỷ (Crimson & Nether Flame Halo)
    ctx.fillStyle = 'rgba(255, 23, 68, 0.32)';
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vòng xoáy 8 tia linh hồn quỷ dữ xoay quanh tâm
    const rayCount = 8;
    const rot = sun.rotTimer || 0;
    ctx.fillStyle = '#ff5252';
    for (let i = 0; i < rayCount; i++) {
      const angle = rot + (i * Math.PI * 2) / rayCount;
      const rx = Math.cos(angle) * 16;
      const ry = Math.sin(angle) * 16;
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Quả cầu Tinh Hồn Huyết Ngọc (Soul Orb Core)
    const orbGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 15);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.3, '#ff8a80');
    orbGrad.addColorStop(0.7, '#d50000');
    orbGrad.addColorStop(1, '#3e0404');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // 4. Đồng tử quỷ / Cổ ngữ ma thuật trung tâm phát sáng
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Điểm sáng lóe mắt quỷ
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(0, -1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHealthBar(ctx, x, y, width, height, ratio, color) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, width * ratio), height);
  }

  drawGalioSkillBar(ctx, x, y, width, height, ratio) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 18, 28, 0.78)';
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 1, y - 1, width + 2, height + 2, 2.5);
    ctx.fill();
    ctx.stroke();

    if (ratio > 0.001) {
      const barGrad = ctx.createLinearGradient(x, y, x + width, y);
      barGrad.addColorStop(0, '#00b0ff');
      barGrad.addColorStop(0.7, '#00e5ff');
      barGrad.addColorStop(1, '#ffd54f');
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(2, width * ratio), height, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawScorchedTiles(ctx, scorchedTiles) {
    const time = performance.now() * 0.003;
    for (const st of scorchedTiles) {
      if (st.timer <= 0) continue;
      const x = CONFIG.GRID_OFFSET_X + st.col * CONFIG.CELL_WIDTH;
      const y = CONFIG.GRID_OFFSET_Y + st.row * CONFIG.CELL_HEIGHT;
      const w = CONFIG.CELL_WIDTH;
      const h = CONFIG.CELL_HEIGHT;
      const alpha = Math.min(1.0, st.timer / 1.5) * 0.88;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Nền đất cháy đen tro tàn
      ctx.fillStyle = '#1c0905';
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Các vết nứt dung nham nóng đỏ
      ctx.strokeStyle = '#ff3d00';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 14);
      ctx.lineTo(x + w * 0.45, y + h * 0.5);
      ctx.lineTo(x + w * 0.82, y + h * 0.28);
      ctx.moveTo(x + w * 0.45, y + h * 0.5);
      ctx.lineTo(x + w * 0.32, y + h * 0.85);
      ctx.moveTo(x + w * 0.45, y + h * 0.5);
      ctx.lineTo(x + w * 0.78, y + h * 0.78);
      ctx.stroke();

      // Lõi dung nham vàng rực phát sáng
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Đốm lửa tro tàn bập bùng
      const emberFlicker = Math.sin(time * 6 + st.row * 3 + st.col) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 87, 34, ${0.4 * emberFlicker})`;
      ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

      // Icon đốm lửa nhỏ ở góc
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#ff6d00';
      ctx.fillText('🔥', x + w - 22, y + 18);

      // Đếm ngược thời gian còn lại
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(st.timer)}s`, x + w / 2, y + h - 8);

      ctx.restore();
    }
  }

  drawFireballs(ctx, fireballs) {
    const time = performance.now() * 0.005;
    for (const fb of fireballs) {
      if (!fb.alive) continue;
      const p = Math.max(0, Math.min(1, fb.progress));
      const curX = fb.startX + (fb.targetX - fb.startX) * p;
      const arc = 4 * fb.arcHeight * p * (1 - p);
      const curY = fb.startY + (fb.targetY - fb.startY) * p - arc;

      ctx.save();
      ctx.translate(curX, curY);

      // Vệt khói lửa phía sau
      const trailAngle = Math.atan2((fb.targetY - fb.startY), (fb.targetX - fb.startX));
      for (let i = 1; i <= 3; i++) {
        const trDist = i * 12;
        ctx.fillStyle = i === 1 ? 'rgba(255, 61, 0, 0.6)' : (i === 2 ? 'rgba(255, 145, 0, 0.4)' : 'rgba(66, 66, 66, 0.3)');
        ctx.beginPath();
        ctx.arc(-Math.cos(trailAngle) * trDist, -Math.sin(trailAngle) * trDist, 14 - i * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Quả cầu lửa dung nham rực cháy
      const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 18);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#ffd600');
      grad.addColorStop(0.6, '#ff3d00');
      grad.addColorStop(1, '#bf360c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Gai lửa bốc cháy xoay tròn
      ctx.fillStyle = '#ffab00';
      for (let j = 0; j < 5; j++) {
        const flameAng = time * 3 + (j * Math.PI * 2) / 5;
        const fx = Math.cos(flameAng) * 21;
        const fy = Math.sin(flameAng) * 21;
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawFireBreath(ctx, boss) {
    if (!boss || !boss.alive) return;
    const rows = boss.breathRows || [boss.bossRow, boss.bossRow + 1];
    const time = performance.now() * 0.005;

    // 1. Khi đang tụ chiêu (isWindupBreath): Chiếu tia cảnh báo đỏ rực trên 2 hàng
    if (boss.isWindupBreath) {
      const pulse = Math.sin(time * 12) * 0.2 + 0.3;
      for (const r of rows) {
        if (r < 0 || r >= CONFIG.ROWS) continue;
        const y = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT;
        const h = CONFIG.CELL_HEIGHT;
        const w = boss.x - CONFIG.GRID_OFFSET_X;

        ctx.save();
        ctx.fillStyle = `rgba(255, 23, 68, ${pulse})`;
        ctx.fillRect(CONFIG.GRID_OFFSET_X, y, w, h);

        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2;
        ctx.setLineDash([12, 8]);
        ctx.strokeRect(CONFIG.GRID_OFFSET_X, y, w, h);

        // Chữ cảnh báo
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 14px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ CẢNH BÁO: HƠI THỞ LỬA SẮP CÀN QUÉT! (DÙNG PLANT FOOD ĐỂ NGẮT CHIÊU)', CONFIG.GRID_OFFSET_X + w / 2, y + h / 2 + 5);
        ctx.restore();
      }
      return;
    }

    // 2. Khi đang khạc lửa (isBreathingFire): Luồng lửa khổng lồ quét qua 2 hàng
    if (boss.isBreathingFire) {
      const startX = boss.x - 40;
      const endX = CONFIG.GRID_OFFSET_X;
      const startRow = Math.min(...rows);
      const startY = CONFIG.GRID_OFFSET_Y + startRow * CONFIG.CELL_HEIGHT;
      const breathHeight = CONFIG.CELL_HEIGHT * 2;

      ctx.save();
      // Lớp lửa đỏ ngoài
      const gradFire = ctx.createLinearGradient(startX, 0, endX, 0);
      gradFire.addColorStop(0, 'rgba(255, 214, 0, 0.95)');
      gradFire.addColorStop(0.3, 'rgba(255, 109, 0, 0.9)');
      gradFire.addColorStop(0.7, 'rgba(255, 61, 0, 0.85)');
      gradFire.addColorStop(1, 'rgba(191, 54, 12, 0.7)');

      ctx.fillStyle = gradFire;
      ctx.beginPath();
      ctx.moveTo(startX, boss.y - 10);
      // Sóng lửa bập bùng
      for (let x = startX; x >= endX; x -= 40) {
        const wave = Math.sin(time * 8 + x * 0.05) * 16;
        ctx.lineTo(x, startY + wave);
      }
      ctx.lineTo(endX, startY + breathHeight);
      for (let x = endX; x <= startX; x += 40) {
        const wave = Math.cos(time * 8 + x * 0.05) * 16;
        ctx.lineTo(x, startY + breathHeight + wave);
      }
      ctx.closePath();
      ctx.fill();

      // Lõi lửa vàng trắng cực nóng ở giữa
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.moveTo(startX, boss.y - 5);
      ctx.lineTo(endX, startY + breathHeight * 0.35 + Math.sin(time * 10) * 8);
      ctx.lineTo(endX, startY + breathHeight * 0.65 + Math.cos(time * 10) * 8);
      ctx.closePath();
      ctx.fill();

      // Khói tro tàn bay cuồn cuộn
      for (let k = 0; k < 6; k++) {
        const smokeX = startX - ((k * 80 + time * 120) % (startX - endX));
        const smokeY = startY + (k * 25) % breathHeight;
        ctx.fillStyle = 'rgba(66, 66, 66, 0.4)';
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, 20 + (k % 3) * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawZombotDarkDragon(ctx, zombie) {
    const time = performance.now() * 0.003;
    const x = zombie.x;
    const y = zombie.y;
    const bob = Math.sin(zombie.bobbingAnim || 0) * 6;

    ctx.save();
    ctx.translate(x, y + bob);

    // 1. Cánh máy cơ khí khổng lồ phía sau (Mechanical Dragon Wings)
    const wingAngle = Math.sin(time * 4) * 0.25;
    ctx.save();
    ctx.translate(30, -30);
    ctx.rotate(wingAngle);
    // Khung kim loại cánh
    ctx.fillStyle = '#263238';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(55, -60);
    ctx.lineTo(95, -50);
    ctx.lineTo(125, -20);
    ctx.lineTo(90, 10);
    ctx.lineTo(40, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Màng cánh da rách hắc ám
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.quadraticCurveTo(55, -45, 95, -40);
    ctx.quadraticCurveTo(75, -10, 85, 5);
    ctx.quadraticCurveTo(45, 10, 10, -10);
    ctx.fill();
    ctx.restore();

    // 2. Thân mình bọc thép rồng máy (Armored Body)
    ctx.fillStyle = '#1e272c';
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(35, 10, 45, 60, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đinh tán & khớp nối thép trên thân
    ctx.fillStyle = '#78909c';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(20 + i * 10, -25 + i * 18, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ống khói động cơ phía sau nhả khói
    ctx.fillStyle = '#263238';
    ctx.fillRect(55, -45, 18, 25);
    ctx.fillStyle = 'rgba(66, 66, 66, 0.5)';
    ctx.beginPath();
    ctx.arc(64 + Math.sin(time * 3) * 5, -55, 12, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cổ rồng nhiều đốt kim loại uốn lượn vươn về phía trước
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.moveTo(20, -20);
    ctx.quadraticCurveTo(-15, -40, -45, -35);
    ctx.lineTo(-45, 10);
    ctx.quadraticCurveTo(-10, 15, 25, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Đốt vảy gai nhọn trên sống cổ
    ctx.fillStyle = '#cfd8dc';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(-10 - k * 14, -38 + k * 4);
      ctx.lineTo(-14 - k * 14, -54 + k * 4);
      ctx.lineTo(-5 - k * 14, -36 + k * 4);
      ctx.fill();
    }

    // 4. Đầu rồng máy bọc thép hắc ám (Dragon Head)
    ctx.save();
    ctx.translate(-45, -25);

    // Sừng rồng kim loại sắc nhọn cong vút
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.moveTo(10, -15);
    ctx.quadraticCurveTo(35, -45, 55, -55);
    ctx.quadraticCurveTo(30, -35, 5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hộp sọ đầu bọc thép
    ctx.fillStyle = '#1c2429';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, -15);
    ctx.lineTo(-45, -5);
    ctx.lineTo(-65, 15);
    ctx.lineTo(-20, 30);
    ctx.lineTo(20, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hàm dưới kim loại (răng nanh cưa sắt)
    ctx.fillStyle = '#263238';
    const jawDrop = (zombie.isBreathingFire || zombie.isRoaring || zombie.isPreparingFireball) ? 14 : 0;
    ctx.beginPath();
    ctx.moveTo(-20, 25 + jawDrop);
    ctx.lineTo(-55, 20 + jawDrop);
    ctx.lineTo(-65, 32 + jawDrop);
    ctx.lineTo(-15, 36 + jawDrop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Răng cưa nhọn kim loại
    ctx.fillStyle = '#eceff1';
    for (let r = 0; r < 5; r++) {
      ctx.beginPath();
      ctx.moveTo(-58 + r * 8, 14);
      ctx.lineTo(-54 + r * 8, 22);
      ctx.lineTo(-50 + r * 8, 14);
      ctx.fill();
    }

    // Lửa trong vòm họng khi gầm hoặc chuẩn bị lửa
    if (zombie.isBreathingFire || zombie.isPreparingFireball || zombie.isWindupBreath) {
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.arc(-45, 20, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.arc(-47, 20, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mắt rồng máy đỏ rực phát quang
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.ellipse(-25, -2, 7, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-26, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Hiệu ứng bị ngắt chiêu & Choáng 3s bởi Plant Food
    if (zombie.stunTimer > 0) {
      ctx.fillStyle = '#ffd600';
      ctx.font = 'bold 22px sans-serif';
      const starRot = time * 8;
      for (let s = 0; s < 3; s++) {
        const sa = starRot + (s * Math.PI * 2) / 3;
        const sx = Math.cos(sa) * 35 - 30;
        const sy = Math.sin(sa) * 15 - 70;
        ctx.fillText('💫', sx, sy);
      }
    }

    ctx.restore();
  }

  drawImpDragon(ctx, zombie) {
    const time = performance.now() * 0.004;
    const walkBob = Math.sin(time * 6) * 3;
    const x = zombie.x;
    const y = zombie.y + walkBob;

    ctx.save();
    ctx.translate(x, y);

    // 1. Cánh rồng con nhỏ xíu vỗ phành phạch
    const wingFlap = Math.sin(time * 10) * 0.3;
    ctx.save();
    ctx.translate(8, -12);
    ctx.rotate(wingFlap);
    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(16, -18);
    ctx.lineTo(24, -10);
    ctx.lineTo(16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Thân thể có vảy bò sát màu tím hắc ám
    ctx.fillStyle = '#311b92';
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Bụng vảy vàng cam chống lửa
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.ellipse(-3, 6, 6, 11, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Đuôi rồng nhỏ ngoe nguẩy
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(6, 12);
    ctx.quadraticCurveTo(16, 18 + Math.sin(time * 8) * 4, 22, 14);
    ctx.stroke();

    // 3. Đầu đội mũ rồng sừng nhỏ
    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.ellipse(-2, -12, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sừng rồng cam nhọn
    ctx.fillStyle = '#ff6d00';
    ctx.beginPath();
    ctx.moveTo(2, -18);
    ctx.lineTo(8, -27);
    ctx.lineTo(12, -17);
    ctx.closePath();
    ctx.fill();

    // Mắt Imp tinh nghịch rực lửa
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(-7, -13, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d50000';
    ctx.beginPath();
    ctx.arc(-8, -13, 2, 0, Math.PI * 2);
    ctx.fill();

    // Miệng ngậm lửa nhỏ
    ctx.fillStyle = '#ff3d00';
    ctx.beginPath();
    ctx.arc(-11, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Thanh máu nếu bị thương
    if (zombie.hp < zombie.maxHp) {
      this.drawHealthBar(ctx, -14, -28, 28, 4, zombie.hp / zombie.maxHp, '#ff1744');
    }

    ctx.restore();
  }

  drawMagnetShroomGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const breathe = Math.sin(time * 2.5) * 1.2;

    ctx.save();

    // 1. Thân nấm màu kem xám nhạt múp míp chuẩn PvZ 2
    const stalkGrad = ctx.createLinearGradient(-9, 2, 9, 22);
    stalkGrad.addColorStop(0, '#f5f5f5');
    stalkGrad.addColorStop(0.6, '#e0e0e0');
    stalkGrad.addColorStop(1, '#b0bec5');
    ctx.fillStyle = stalkGrad;
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.quadraticCurveTo(-11, 14, -8, 22);
    ctx.quadraticCurveTo(0, 24, 8, 22);
    ctx.quadraticCurveTo(11, 14, 8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Đôi mắt nghiêm nghị & lông mày cau
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-3.8, 12, 3.0, 3.6, 0, 0, Math.PI * 2);
    ctx.ellipse(3.8, 12, 3.0, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.fillStyle = '#1c2429';
    ctx.beginPath();
    ctx.arc(-3.2, 12, 1.7, 0, Math.PI * 2);
    ctx.arc(4.4, 12, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 8); ctx.lineTo(-1, 9.5);
    ctx.moveTo(7, 8); ctx.lineTo(1, 9.5);
    ctx.stroke();

    // 2. Mũ nấm hình Nam Châm Móng Ngựa Đỏ - Đầu Bạc (PvZ 2 Classic Magnet-shroom)
    ctx.save();
    ctx.translate(0, -10 + breathe);

    // Thân nam châm hình chữ U lộn ngược (Vòm đỏ rực ở trên, 2 đầu bạc hướng lên hoặc xuống? Nam châm PvZ 2 vòm ở dưới nối cuống, 2 cực bạc chĩa lên trên!)
    // Dùng dáng móng ngựa mở lên trên (chữ U) như Magnet-shroom PvZ 2 rất dễ nhận biết!
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI, false);
    ctx.lineTo(-19, -12);
    ctx.lineTo(-10, -12);
    ctx.arc(0, 0, 10, Math.PI, 0, true);
    ctx.lineTo(19, -12);
    ctx.closePath();

    const magGrad = ctx.createLinearGradient(-19, -12, 19, 19);
    magGrad.addColorStop(0, '#ff5252');
    magGrad.addColorStop(0.55, '#e53935');
    magGrad.addColorStop(1, '#b71c1c');
    ctx.fillStyle = magGrad;
    ctx.fill();
    ctx.strokeStyle = '#7f0000';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Hai đầu cực kim loại bạc sáng loáng
    const tipGradLeft = ctx.createLinearGradient(-19, -13, -10, -5);
    tipGradLeft.addColorStop(0, '#ffffff');
    tipGradLeft.addColorStop(0.6, '#cfd8dc');
    tipGradLeft.addColorStop(1, '#78909c');
    ctx.fillStyle = tipGradLeft;
    ctx.fillRect(-19, -12, 9, 8);
    ctx.fillRect(10, -12, 9, 8);

    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-19, -12, 9, 8);
    ctx.strokeRect(10, -12, 9, 8);

    // Sóng từ trường màu xanh Cyan tỏa ra giữa 2 cực nam châm
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -11, 7, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, -11, 11, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();

    // Nếu đang hút/giữ vật phẩm kim loại (xô sắt / nón hiệp sĩ)
    if (plant.hasItem || plant.attractedArmor || (plant.attractTimer > 0)) {
      ctx.save();
      ctx.translate(0, -18);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.roundRect(-11, -11, 22, 18, 3);
      ctx.fill();
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Quai xách xô sắt
      ctx.strokeStyle = '#cfd8dc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -11, 7, Math.PI, 0);
      ctx.stroke();

      // Tia điện từ trường giật lách tách
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-13, 0); ctx.lineTo(-17, -4);
      ctx.moveTo(13, 0); ctx.lineTo(17, -4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  // =========================================================================
  // ĐỒ HỌA CÁC LOẠI CÂY BĂNG CHUYỀN (CONVEYOR BELT PLANTS)
  // =========================================================================

  // 1. Hạt Dẻ Cao (Tall-nut) — Tường thành 4000 HP chặn đứng mọi bước nhảy sào
  drawTallNutGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 1.5;
    const isWounded = plant.hp < plant.maxHp * 0.65;
    const isCritical = plant.hp < plant.maxHp * 0.35;

    // Vỏ hạt dẻ khổng lồ cao sừng sững
    const nutGrad = ctx.createLinearGradient(-18, -35, 18, 25);
    nutGrad.addColorStop(0, '#6d4c41');
    nutGrad.addColorStop(0.5, '#4e342e');
    nutGrad.addColorStop(1, '#271406');
    ctx.fillStyle = nutGrad;
    ctx.strokeStyle = '#1a0c02';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-18, -35, 36, 62, 16);
    ctx.fill();
    ctx.stroke();

    // Tán lông/chỏm tóc gỗ trên đầu
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(0, -35, 6, 0, Math.PI, true);
    ctx.fill();

    // Đôi mắt kiên định, nghiêm nghị nhìn thẳng
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-7, -12, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(7, -12, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mí mắt trĩu nặng nghiêm nghị
    ctx.fillStyle = '#4e342e';
    ctx.beginPath();
    ctx.roundRect(-12, -18, 10, 5, 2);
    ctx.roundRect(2, -18, 10, 5, 2);
    ctx.fill();

    // Con ngươi đen hướng thẳng về trước
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5.5, -11, 2.5, 0, Math.PI * 2);
    ctx.arc(8.5, -11, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Vết nứt vỡ khi bị cắn thương tích
    if (isWounded) {
      ctx.strokeStyle = '#1a0c02';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 5); ctx.lineTo(-4, 12); ctx.lineTo(-12, 18);
      ctx.moveTo(8, -2); ctx.lineTo(14, 6);
      ctx.stroke();
    }
    // Giọt nước mắt cảm động khi sắp vỡ
    if (isCritical) {
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.ellipse(-10, -5, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Bắp Ngô (Kernel-pult) — Phóng bơ và hạt ngô
  drawKernelPultGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3;
    const sway = Math.sin(time) * 1.5;

    // Lá bẹ bắp ngô xòe quanh chân
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(-14, 18, 12, 6, -0.3, 0, Math.PI * 2);
    ctx.ellipse(14, 18, 12, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bắp ngô vàng óng
    ctx.fillStyle = '#fbc02d';
    ctx.strokeStyle = '#f57f17';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Râu bắp ngô màu nâu vàng trên đỉnh
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.lineTo(sway - 3, -30);
    ctx.moveTo(2, -22); ctx.lineTo(sway + 4, -28);
    ctx.stroke();

    // Đôi mắt to tròn
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-4, -6, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -6, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Muỗng bắn nạp sẵn viên bơ vàng béo ngậy
    ctx.save();
    ctx.translate(-12, -8);
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-2, -14, 4, 18);
    // Bơ vàng béo ngậy vuông vắn
    ctx.fillStyle = '#fff176';
    ctx.strokeStyle = '#fbc02d';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-6, -20, 12, 10, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 3. Gai Cỏ (Spikeweed) — Chông gai sắc nhọn đâm xuyên chân
  drawSpikeweedGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 4;

    // Nền thảm rễ gai bám mặt đất
    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.ellipse(0, 20, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cụm chông gai nhọn hoắt bằng đá và kim loại
    ctx.fillStyle = '#455a64';
    ctx.strokeStyle = '#263238';
    ctx.lineWidth = 1.5;
    const spikeOffsets = [-20, -12, -4, 4, 12, 20];
    for (let i = 0; i < spikeOffsets.length; i++) {
      const sx = spikeOffsets[i];
      const h = (i % 2 === 0 ? 16 : 22) + Math.sin(time + i) * 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - 4, 22);
      ctx.lineTo(sx, 22 - h);
      ctx.lineTo(sx + 4, 22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Đầu nhọn kim loại sáng bóng
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.moveTo(sx - 2, 22 - h + 6);
      ctx.lineTo(sx, 22 - h);
      ctx.lineTo(sx + 2, 22 - h + 6);
      ctx.fill();
      ctx.fillStyle = '#455a64';
    }

    // Mắt hung tợn ẩn nấp giữa các bụi gai
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(-3, 14, 2.5, 0, Math.PI * 2);
    ctx.arc(5, 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Đậu Bật Nhảy (Spring Bean) — Bật nảy đẩy lùi zombie
  drawSpringBeanGraphics(ctx, plant) {
    const isSleeping = (plant.sleepTimer || 0) > 0;
    const bounceY = isSleeping ? 6 : Math.abs(Math.sin((plant.animTime || 0) * 4)) * 3;

    // Lò xo thép cuộn tròn ở dưới đáy
    ctx.strokeStyle = '#78909c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-10, 24);
    ctx.bezierCurveTo(-14, 18, 14, 16, 10, 10);
    ctx.bezierCurveTo(6, 4, -8, 2, -4, -2 + bounceY);
    ctx.stroke();

    // Thân hạt đậu xanh mướt mọng nước
    ctx.save();
    ctx.translate(0, -6 + bounceY);
    ctx.fillStyle = isSleeping ? '#689f38' : '#7cb342';
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 13, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mắt nếu đang ngủ (nhắm nghiền zZz) hoặc đang thức (mở to lanh lợi)
    if (isSleeping) {
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-6, -1, 3.5, 0, Math.PI, false);
      ctx.arc(6, -1, 3.5, 0, Math.PI, false);
      ctx.stroke();

      // Chữ zZz bay lên
      ctx.fillStyle = '#b0bec5';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('z', 12, -12);
      ctx.fillText('Z', 16, -18);
    } else {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -3, 1, 0, Math.PI * 2);
      ctx.arc(4, -3, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Xà Lách Băng (Iceberg Lettuce) — Pha lê tuyết đóng băng
  drawIcebergLettuceGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3;
    const pulse = 1.0 + Math.sin(time) * 0.08;

    ctx.save();
    ctx.scale(pulse, pulse);

    // Hào quang băng giá tỏa sương mù lạnh
    ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 2, 22, 0, Math.PI * 2);
    ctx.fill();

    // Các cánh lá bắp cải băng pha lê trong suốt
    const iceGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 18);
    iceGrad.addColorStop(0, '#ffffff');
    iceGrad.addColorStop(0.5, '#b2ebf2');
    iceGrad.addColorStop(1, '#00b0ff');
    ctx.fillStyle = iceGrad;
    ctx.strokeStyle = '#80d8ff';
    ctx.lineWidth = 1.8;

    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 9, 13, a, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Đôi mắt băng ngây thơ dễ thương
    ctx.fillStyle = '#01579b';
    ctx.beginPath();
    ctx.ellipse(-4, -1, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(4, -1, 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-5, -2, 1.2, 0, Math.PI * 2);
    ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 6. Nấm Khói (Fume-shroom) — Phun luồng khói bào tử tím xuyên thấu
  drawFumeShroomGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3;

    // Chân nấm tím mọng
    ctx.fillStyle = '#4a148c';
    ctx.beginPath();
    ctx.roundRect(-9, 4, 18, 18, 5);
    ctx.fill();

    // Mũ nấm hình phễu loe hướng sang phải
    const capGrad = ctx.createLinearGradient(-14, -18, 18, 0);
    capGrad.addColorStop(0, '#6a1b9a');
    capGrad.addColorStop(0.7, '#ab47bc');
    capGrad.addColorStop(1, '#e1bee7');
    ctx.fillStyle = capGrad;
    ctx.strokeStyle = '#38006b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(2, -6, 17, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Miệng phễu phun khói mở to sang phải
    ctx.fillStyle = '#12005e';
    ctx.beginPath();
    ctx.ellipse(14, -4, 5, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đôi mắt lim dim tím huyền ảo
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-4, -6, 3, 4, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-3, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Bọt khói tím bay lập lờ trước mũi
    ctx.fillStyle = 'rgba(186, 104, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(22 + Math.sin(time) * 3, -4, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Đậu Laser (Laser Bean) — Đậu vũ trụ bắn tia laser xuyên hàng
  drawLaserBeanGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 4;

    // Thân hạt đậu vũ trụ màu ngọc bích khí động học
    const beanGrad = ctx.createLinearGradient(-12, -18, 12, 18);
    beanGrad.addColorStop(0, '#00e676');
    beanGrad.addColorStop(0.7, '#00b0ff');
    beanGrad.addColorStop(1, '#1a237e');
    ctx.fillStyle = beanGrad;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 20, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kính bảo hộ Cybernetic Laser Visor màu xanh neon (sắc nét, không dùng shadowBlur gây drop FPS)
    ctx.fillStyle = '#00e5ff';
    ctx.strokeStyle = '#e0f7fa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-10, -8, 22, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Vạch quét laser đỏ/trắng chạy qua kính
    const scanX = -6 + ((time * 6) % 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(scanX, -7, 3, 7);

    // Cổng dẫn năng lượng sau lưng
    ctx.fillStyle = '#37474f';
    ctx.fillRect(-15, -4, 4, 8);
  }

  // 8. Bí Đè (Squash) — Nhảy đè nát zombie
  drawSquashGraphics(ctx, plant) {
    const jumpOffset = plant.isSquashing ? -Math.sin((plant.squashTimer || 0) * Math.PI) * 28 : 0;

    ctx.save();
    ctx.translate(0, jumpOffset);

    // Thân bí xanh khổng lồ bạnh gân guốc
    const squashGrad = ctx.createLinearGradient(-18, -25, 18, 22);
    squashGrad.addColorStop(0, '#558b2f');
    squashGrad.addColorStop(0.6, '#33691e');
    squashGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = squashGrad;
    ctx.strokeStyle = '#0b3200';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cuống bí xoắn trên đầu
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(-4, -28, 4, -30);
    ctx.stroke();

    // Đôi mắt siêu cau có gắt gỏng
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.ellipse(-6, -6, 4.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(6, -6, 4.5, 3.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-5, -6, 2, 0, Math.PI * 2);
    ctx.arc(5, -6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Lông mày cau lại giận dữ
    ctx.strokeStyle = '#0b3200';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-11, -12); ctx.lineTo(-2, -8);
    ctx.moveTo(11, -12); ctx.lineTo(2, -8);
    ctx.stroke();

    // Miệng trề cau có
    ctx.beginPath();
    ctx.arc(0, 8, 8, Math.PI * 1.15, Math.PI * 1.85, false);
    ctx.stroke();

    ctx.restore();
  }

  // --- Galio (Vệ Thần Kháng Ma Thạch Trắng-Vàng-Lục Bảo) ---
  drawGalioGraphics(ctx, plant) {
    const time = (plant.animTime || 0) * 3.0;
    const isPunching = (plant.punchAnimTimer && plant.punchAnimTimer > 0) || plant.state === 'shooting';
    const isCastingWave = plant.skill1AnimTimer && plant.skill1AnimTimer > 0;
    const jabProgress = plant.punchAnimTimer > 0 ? Math.min(1, plant.punchAnimTimer / 0.16) : 0;
    const jabBoost = jabProgress > 0 ? Math.sin(jabProgress * Math.PI) * 14 : 0;
    const hover = Math.sin(time) * 1.4;

    ctx.save();
    if (plant.punchDir === -1) {
      ctx.scale(-1, 1);
    }
    ctx.translate(0, hover);

    // 1. Đôi cánh đá cẩm thạch viền vàng sau vai
    const wingFlap = isCastingWave ? -0.25 : Math.sin(time * 0.8) * 0.08;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(wingFlap);
      ctx.fillStyle = isCastingWave ? '#e0f7fa' : '#cfd8dc';
      ctx.strokeStyle = '#ffa000';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(24, -18);
      ctx.lineTo(26, -5);
      ctx.lineTo(19, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Vân vàng trên cánh
      ctx.strokeStyle = '#ffca28';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(11, -3);
      ctx.lineTo(22, -13);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Chân đế đá vững chãi
    ctx.fillStyle = '#90a4ae';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-10, 14, 8, 9, 3);
    ctx.roundRect(2, 14, 8, 9, 3);
    ctx.fill();
    ctx.stroke();

    // 3. Thân giáp kháng ma thạch trắng ngà + viền vàng kim
    const bodyGrad = ctx.createLinearGradient(-13, -12, 13, 18);
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.55, '#eceff1');
    bodyGrad.addColorStop(1, '#b0bec5');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(14, -10);
    ctx.lineTo(10, 15);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Khung giáp vai vàng kim
    ctx.fillStyle = '#ffca28';
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(-13, -7, 6.5, 5.5, -0.25, 0, Math.PI * 2);
    ctx.ellipse(13, -7, 6.5, 5.5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lõi năng lượng ngọc lam trước ngực (sáng mạnh khi sắp hoặc đang bắn Skill 1)
    const chargeRatio = plant.skill1Interval ? Math.min(1, (plant.skill1Timer || 0) / plant.skill1Interval) : 0;
    ctx.fillStyle = isCastingWave ? '#ffffff' : (chargeRatio > 0.75 ? '#84ffff' : '#00e5ff');
    ctx.strokeStyle = '#ffa000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 2, isCastingWave ? 6 : 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Đầu mũ giáp có sừng vàng và đôi mắt ngọc sáng
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-8.5, -24, 17, 14, 4);
    ctx.fill();
    ctx.stroke();

    // Mão vương miện vàng
    ctx.fillStyle = '#ffb300';
    ctx.beginPath();
    ctx.moveTo(-7, -23);
    ctx.lineTo(-10, -31);
    ctx.lineTo(-3, -24);
    ctx.lineTo(0, -30);
    ctx.lineTo(3, -24);
    ctx.lineTo(10, -31);
    ctx.lineTo(7, -23);
    ctx.closePath();
    ctx.fill();

    // Mắt sáng xanh lam
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.ellipse(-3.5, -17, 2.2, 1.5, 0.15, 0, Math.PI * 2);
    ctx.ellipse(3.5, -17, 2.2, 1.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 5. Nắm đấm đá khổng lồ phía trước (vung ra khi đánh thường / bắn sóng)
    const fistX = 14 + (isPunching ? 6 : 0) + jabBoost;
    ctx.fillStyle = '#eceff1';
    ctx.strokeStyle = '#ffca28';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(fistX, 4, 8, 7, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Bẫy Hoa Sen Tử Vong (Jhinplant Skill): chặn đặt cây & nổ 444 DMG AoE 2x2
  drawLotusTraps(ctx, traps) {
    for (const trap of traps) {
      if (!trap.alive) continue;
      const t = trap.animTime || 0;
      const pulse = 1 + Math.sin(t * 4.5) * 0.06;

      ctx.save();
      ctx.translate(trap.x, trap.y + 4);
      ctx.scale(pulse, pulse);

      // Vòng ấn tử vong dưới mặt cỏ (báo hiệu ô đã có bẫy)
      ctx.fillStyle = 'rgba(74, 20, 140, 0.36)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 28, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 23, 68, 0.78)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.ellipse(0, 4, 26, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 8 cánh hoa sen góc cạnh tím-đỏ
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + t * 0.4;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = i % 2 === 0 ? '#6a1b9a' : '#880e4f';
        ctx.strokeStyle = '#ea80fc';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(7, -15);
        ctx.lineTo(0, -21);
        ctx.lineTo(-7, -15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Nhụy hoa sen phát sáng đỏ rực
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff59d';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Thanh hiển thị 4 viên đạn / nạp đạn 4s trên đầu Jhinplant
  drawJhinAmmoHud(ctx, plant) {
    ctx.save();
    if (plant.isReloading) {
      const total = plant.reloadDuration || 4.0;
      const progress = Math.max(0, Math.min(1, 1 - (plant.reloadTimer || 0) / total));
      ctx.fillStyle = 'rgba(10, 6, 16, 0.85)';
      ctx.strokeStyle = '#ce93d8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-18, -39, 36, 5, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.roundRect(-17, -38, 34 * progress, 3, 1.5);
      ctx.fill();
    } else {
      const ammo = plant.ammo !== undefined ? plant.ammo : 4;
      const fired = 4 - ammo;
      for (let i = 0; i < 4; i++) {
        const px = -12 + i * 8;
        const py = -37;
        const available = i >= fired;
        const isFourth = i === 3;
        ctx.fillStyle = !available
          ? 'rgba(40, 28, 52, 0.85)'
          : (isFourth ? '#ff1744' : '#e040fb');
        ctx.strokeStyle = available ? '#ffffff' : '#5e4375';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, isFourth ? 3.2 : 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Jhinplant (Hoa Súng Tử Vong): Thược dược tím góc cạnh + mặt nạ nghệ thuật + ống ngắm la-de đỏ rực
  drawJhinplantGraphics(ctx, plant) {
    const t = plant.animTime || 0;
    const isFourthReady = !plant.isReloading && plant.ammo === 1;
    const recoil = (plant.state === 'shooting') ? -4 : 0;
    const sway = Math.sin(t * 2.2) * 1.6;

    ctx.save();
    if (plant.flashTimer > 0) {
      ctx.filter = 'brightness(1.5)';
    }

    // 1. Thân & lá góc cạnh tím thẫm
    ctx.fillStyle = '#2d0b45';
    ctx.strokeStyle = '#7b1fa2';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-4, 22);
    ctx.lineTo(-20, 12);
    ctx.lineTo(-7, 13);
    ctx.lineTo(0, 22);
    ctx.lineTo(18, 13);
    ctx.lineTo(6, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3c1053';
    ctx.beginPath();
    ctx.moveTo(-3.5, 22);
    ctx.lineTo(-2.5, -2);
    ctx.lineTo(3.5, -2);
    ctx.lineTo(4, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(recoil + sway * 0.35, -7);

    // 2. Cánh hoa thược dược / hoa súng tím thẫm góc cạnh (8 cánh nhọn hiện đại)
    const petalColors = ['#38006b', '#5e178c', '#4a148c', '#7b1fa2'];
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = petalColors[i % petalColors.length];
      ctx.strokeStyle = isFourthReady && i % 2 === 0 ? '#ff5252' : '#ce93d8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6.5, -16);
      ctx.lineTo(0, -23);
      ctx.lineTo(-6.5, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Lớp cánh trong sắc nét
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = '#1f0836';
      ctx.strokeStyle = '#ba68c8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(5, -12);
      ctx.lineTo(0, -17);
      ctx.lineTo(-5, -12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Trung tâm mặt nạ nghệ thuật lạnh lùng (Asymmetric Theatre Mask)
    ctx.fillStyle = '#f3e5f5';
    ctx.strokeStyle = '#240b36';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, -6);
    ctx.lineTo(8, 8);
    ctx.lineTo(0, 12);
    ctx.lineTo(-9, 7);
    ctx.lineTo(-10, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nửa bóng tối nghệ thuật bên trái mặt nạ
    ctx.fillStyle = 'rgba(49, 27, 146, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-10, -6);
    ctx.lineTo(-9, 7);
    ctx.lineTo(0, 12);
    ctx.closePath();
    ctx.fill();

    // Khe mắt lạnh lùng + con mắt ngắm đỏ rực
    ctx.fillStyle = '#1a0826';
    ctx.beginPath();
    ctx.moveTo(-7, -3);
    ctx.lineTo(-2, -1);
    ctx.lineTo(-5, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isFourthReady ? '#ff1744' : '#d500f9';
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(8, -4);
    ctx.lineTo(6, 1.5);
    ctx.closePath();
    ctx.fill();

    // Nét khắc miệng lạnh lùng trên mặt nạ
    ctx.strokeStyle = '#311b92';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, 5.5);
    ctx.quadraticCurveTo(0, 7.5, 5, 5);
    ctx.stroke();

    // 4. Ống ngắm la-de màu đỏ rực trên đầu hoa
    ctx.fillStyle = '#212121';
    ctx.strokeStyle = '#ff1744';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-5, -20, 17, 6, 2);
    ctx.fill();
    ctx.stroke();

    // Thấu kính la-de đỏ rực
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(11, -17, isFourthReady ? 3.2 : 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffebee';
    ctx.beginPath();
    ctx.arc(11, -17, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Tia ngắm la-de đỏ rực phóng về phía trước
    if (!plant.isReloading) {
      const beamAlpha = isFourthReady ? (0.75 + Math.sin(t * 14) * 0.2) : 0.45;
      const beamLen = plant.isIcon ? 18 : (isFourthReady ? 140 : 88);
      ctx.strokeStyle = `rgba(255, 23, 68, ${beamAlpha})`;
      ctx.lineWidth = isFourthReady ? 2.2 : 1.3;
      ctx.beginPath();
      ctx.moveTo(13, -17);
      ctx.lineTo(13 + beamLen, -17);
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }

  // 9. Cây Tổng Quát Fallback — Đảm bảo không bao giờ bị tàng hình
  drawGenericPlantGraphics(ctx, plant) {
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#76ff03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chữ cái viết tắt
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const initial = (plant.type || 'P').charAt(0).toUpperCase();
    ctx.fillText(initial, 0, 4);
  }

  drawBossHealthBar(ctx, boss) {
    if (!boss || !boss.alive) return;
    const barW = 380;
    const barH = 22;
    const x = (CONFIG.CANVAS_WIDTH - barW) / 2;
    const y = 38;
    const ratio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

    ctx.save();
    // Khung viền đá hắc ám
    ctx.fillStyle = 'rgba(10, 8, 12, 0.9)';
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, barW + 8, barH + 8, 6);
    ctx.fill();
    ctx.stroke();

    // Lớp máu gradient rực lửa
    const hpGrad = ctx.createLinearGradient(x, 0, x + barW, 0);
    hpGrad.addColorStop(0, '#d50000');
    hpGrad.addColorStop(0.5, '#ff3d00');
    hpGrad.addColorStop(1, '#ff9100');
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW * ratio, barH, 4);
    ctx.fill();

    // Văn bản tên Boss & HP chi tiết (Hiển thị chính xác theo boss.maxHp)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🐲 ZOMBOT DARK DRAGON: ${Math.ceil(boss.hp).toLocaleString()} / ${Math.ceil(boss.maxHp).toLocaleString()} HP`, CONFIG.CANVAS_WIDTH / 2, y + 15);

    ctx.restore();
  }

  static getPlantIconCanvas(plantType, size = 88) {
    if (typeof document === 'undefined') return null;
    if (!GameRenderer._iconCanvasCache) GameRenderer._iconCanvasCache = {};
    const cacheKey = `${plantType}:${size}`;
    if (GameRenderer._iconCanvasCache[cacheKey]) {
      return GameRenderer._iconCanvasCache[cacheKey];
    }

    const iconCanvas = document.createElement('canvas');
    iconCanvas.width = size;
    iconCanvas.height = size;
    const iconCtx = iconCanvas.getContext('2d');

    if (!GameRenderer._iconRenderer) {
      GameRenderer._iconRenderer = new GameRenderer(iconCanvas);
    }

    const scale = size / 68;
    iconCtx.save();
    iconCtx.translate(size / 2, size / 2 + 4 * scale);
    iconCtx.scale(scale, scale);

    const dummyPlant = {
      type: plantType,
      x: 0,
      y: 0,
      animTime: 0,
      flashTimer: 0,
      state: 'idle',
      glow: 0,
      stage: plantType === 'sun_shroom' ? 2 : 1,
      armed: true,
      sleepTimer: 0,
      isIcon: true,
      hp: 300,
      maxHp: 300
    };
    GameRenderer._iconRenderer.drawPlantBody(iconCtx, dummyPlant);
    iconCtx.restore();

    GameRenderer._iconCanvasCache[cacheKey] = iconCanvas;
    return iconCanvas;
  }

  static getPlantIconDataURL(plantType, size = 88) {
    if (typeof document === 'undefined') return '';
    if (!GameRenderer._iconUrlCache) GameRenderer._iconUrlCache = {};
    const cacheKey = `${plantType}:${size}`;
    if (GameRenderer._iconUrlCache[cacheKey]) {
      return GameRenderer._iconUrlCache[cacheKey];
    }
    const canvas = GameRenderer.getPlantIconCanvas(plantType, size);
    if (!canvas) return '';
    const url = canvas.toDataURL('image/png');
    GameRenderer._iconUrlCache[cacheKey] = url;
    return url;
  }
}

if (typeof window !== 'undefined') {
  window.GameRenderer = GameRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameRenderer;
}
