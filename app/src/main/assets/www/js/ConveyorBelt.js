/**
 * CONVEYOR BELT SYSTEM (HỆ THỐNG BĂNG CHUYỀN PVZ 2)
 * Module độc lập quản lý logic sinh cây tự động, nghẽn băng chuyền, và kéo thả vật phẩm.
 */
class ConveyorBelt {
  constructor(config) {
    this.config = config || (typeof CONFIG !== 'undefined' ? CONFIG.conveyor : null) || {
      enabled: true,
      capacity: 8,
      spawnInterval: 5000,
      initialSpawn: 5,
      plantFoodWeight: 15,
      plantPool: [
        { plantId: "wall_nut", weight: 30 },
        { plantId: "peashooter", weight: 30 },
        { plantId: "cabbage_pult", weight: 30 },
        { plantId: "snow_pea", weight: 30 },
        { plantId: "repeater", weight: 12 },
        { plantId: "cherry_bomb", weight: 8 }
      ]
    };

    this.items = []; // Lưu trữ vật phẩm hiện có trên băng
    this.timer = 0;

    // Trạng thái Drag & Drop
    this.draggedItem = null;
    this.dragIndex = -1;

    // Tiền tính toán tổng trọng số của Plant
    this.totalPlantWeight = (this.config.plantPool && this.config.plantPool.length > 0)
      ? this.config.plantPool.reduce((sum, p) => sum + p.weight, 0)
      : 100;

    // Tọa độ và kích thước ô băng chuyền
    this.startX = 8;
    this.startY = 52;
    this.slotSize = 54;
    this.spacing = 3;
  }

  init() {
    this.items = [];
    this.timer = 0;
    this.draggedItem = null;
    this.dragIndex = -1;

    // Tính lại tổng trọng số phòng khi cấu hình thay đổi
    if (this.config && this.config.plantPool && this.config.plantPool.length > 0) {
      this.totalPlantWeight = this.config.plantPool.reduce((sum, p) => sum + p.weight, 0);
    }

    // Sinh vật phẩm khởi đầu
    const spawnCount = Math.min(this.config.initialSpawn || 5, this.config.capacity || 8);
    for (let i = 0; i < spawnCount; i++) {
      this.forceSpawnItem();
    }
  }

  update(deltaTime) {
    // Cơ chế nghẽn: Nếu băng đầy, dừng đếm giờ
    const capacity = this.config.capacity || 8;
    if (this.items.length >= capacity) {
      this.timer = 0;
      return;
    }

    // Đồng bộ thời gian: hỗ trợ cả deltaTime tính bằng giây (0.016s) và mili-giây
    const dtMs = deltaTime < 1.0 ? (deltaTime * 1000) : deltaTime;
    this.timer += dtMs;

    const interval = this.config.spawnInterval || 5000;
    if (this.timer >= interval) {
      this.forceSpawnItem();
      // Khởi động lại bộ đếm từ 0 để tránh sinh dồn (không tích lũy timer thừa)
      this.timer = 0;
    }
  }

  forceSpawnItem() {
    const capacity = this.config.capacity || 8;
    if (this.items.length >= capacity) return;

    const pfWeight = this.config.plantFoodWeight !== undefined ? this.config.plantFoodWeight : 15;
    const totalWeight = (this.totalPlantWeight || 100) + pfWeight;
    let randomVal = Math.random() * totalWeight;

    const newItem = {
      instanceId: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      createdAt: Date.now(),
      isDragging: false,
      x: 0,
      y: 0
    };

    // Weighted Random Selection
    if (randomVal < pfWeight) {
      newItem.type = 'plantFood';
    } else {
      randomVal -= pfWeight;
      let selectedPlantId = (this.config.plantPool && this.config.plantPool[0]) ? this.config.plantPool[0].plantId : 'peashooter';

      if (this.config.plantPool) {
        for (const p of this.config.plantPool) {
          randomVal -= p.weight;
          if (randomVal <= 0) {
            selectedPlantId = p.plantId;
            break;
          }
        }
      }
      newItem.type = 'plant';
      newItem.plantId = selectedPlantId;
    }

    this.items.push(newItem);
  }

  draw(ctx, pointerX = 0, pointerY = 0) {
    if (!ctx) return;

    const startX = this.startX;
    const startY = this.startY;
    const slotSize = this.slotSize;
    const spacing = this.spacing;
    const capacity = this.config.capacity || 8;
    const totalHeight = capacity * (slotSize + spacing);

    ctx.save();

    // 1. Vẽ khung nền băng chuyền kim loại Dark Fantasy
    ctx.fillStyle = 'rgba(15, 10, 18, 0.92)';
    ctx.strokeStyle = '#4e342e';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(startX - 4, startY - 20, slotSize + 8, totalHeight + 24, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(startX - 4, startY - 20, slotSize + 8, totalHeight + 24);
      ctx.strokeRect(startX - 4, startY - 20, slotSize + 8, totalHeight + 24);
    }

    // 2. Vẽ Tiêu đề / Sức chứa Băng chuyền
    ctx.fillStyle = '#ffecb3';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`BĂNG: ${this.items.length}/${capacity}`, startX + slotSize / 2, startY - 7);

    // 3. Vẽ các rãnh Slot trống trên băng chuyền
    for (let i = 0; i < capacity; i++) {
      const slotY = startY + i * (slotSize + spacing);

      // Nền ô băng chuyền kim loại
      ctx.fillStyle = 'rgba(28, 20, 24, 0.85)';
      ctx.fillRect(startX, slotY, slotSize, slotSize);

      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(startX, slotY, slotSize, slotSize);

      // Các con lăn cơ khí ở 2 bên ô
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(startX - 2, slotY + 2, 2, slotSize - 4);
      ctx.fillRect(startX + slotSize, slotY + 2, 2, slotSize - 4);
    }

    // 4. Vẽ các vật phẩm đang nằm trên băng
    this.items.forEach((item, index) => {
      if (item.isDragging) return; // Nếu đang bị chuột/tay kéo thì không vẽ ở vị trí khe

      item.x = startX;
      item.y = startY + index * (slotSize + spacing);

      this.renderItemCard(ctx, item, item.x, item.y, slotSize, 1.0);
    });

    // 5. Vẽ vật phẩm đang bị kéo theo con trỏ chuột/chạm
    if (this.draggedItem) {
      ctx.globalAlpha = 0.88;
      const dragX = pointerX - slotSize / 2;
      const dragY = pointerY - slotSize / 2;
      this.renderItemCard(ctx, this.draggedItem, dragX, dragY, slotSize, 1.15, true);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // Vẽ thẻ vật phẩm (Cây hoặc Lá Plant Food)
  renderItemCard(ctx, item, x, y, size, scale = 1.0, isDragging = false) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    if (scale !== 1.0) ctx.scale(scale, scale);
    ctx.translate(-size / 2, -size / 2);

    if (item.type === 'plantFood') {
      // THẺ PLANT FOOD (LÁ XANH)
      ctx.fillStyle = '#0a230a';
      ctx.strokeStyle = isDragging ? '#76ff03' : '#43a047';
      ctx.lineWidth = 2;
      ctx.fillRect(2, 2, size - 4, size - 4);
      ctx.strokeRect(2, 2, size - 4, size - 4);

      // Biểu tượng lá xanh phát sáng
      ctx.fillStyle = '#76ff03';
      ctx.beginPath();
      ctx.moveTo(size / 2, 10);
      ctx.quadraticCurveTo(size - 10, 14, size / 2, size - 12);
      ctx.quadraticCurveTo(10, 14, size / 2, 10);
      ctx.fill();

      // Gân lá
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(size / 2, 12);
      ctx.lineTo(size / 2, size - 14);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FOOD', size / 2, size - 4);
    } else {
      // THẺ CÂY TRỒNG
      const plantId = item.plantId;
      const pConfig = (typeof PLANT_CONFIG !== 'undefined' && PLANT_CONFIG[plantId]) ? PLANT_CONFIG[plantId] : null;

      // Nền thẻ bài với dải màu đặc trưng theo nhóm cây của người chơi
      const colorThemeMap = {
        peashooter: '#2e7d32', repeater: '#1b5e20', snow_pea: '#0277bd',
        wall_nut: '#4e342e', infi_nut: '#00838f',
        cabbage_pult: '#388e3c', melon_pult: '#1b5e20',
        bonk_choy: '#558b2f', snapdragon: '#d84315', chomper: '#6a1b9a', galio: '#0288d1',
        jhinplant: '#7b1fa2',
        lightning_reed: '#00838f', goo_peashooter: '#512da8',
        potato_mine: '#6d4c41', stunion: '#fbc02d', hypno_shroom: '#7b1fa2',
        cherry_bomb: '#c62828', magnet_shroom: '#37474f'
      };
      const headerColor = colorThemeMap[plantId] || '#1b5e20';

      ctx.fillStyle = isDragging ? '#37474f' : '#1c1917';
      ctx.strokeStyle = isDragging ? '#00e5ff' : '#57534e';
      ctx.lineWidth = isDragging ? 2 : 1.5;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(2, 2, size - 4, size - 4, 4) : ctx.rect(2, 2, size - 4, size - 4);
      ctx.fill();
      ctx.stroke();

      // Dải viền màu đầu thẻ
      ctx.fillStyle = headerColor;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(3, 3, size - 6, 7, [3, 3, 0, 0]) : ctx.fillRect(3, 3, size - 6, 7);
      ctx.fill();

      // Icon cây đồng nhất từ GameRenderer (fallback emoji nếu chưa sẵn sàng)
      const iconCanvas = (typeof GameRenderer !== 'undefined' && GameRenderer.getPlantIconCanvas)
        ? GameRenderer.getPlantIconCanvas(plantId, 72)
        : null;
      if (iconCanvas) {
        const iconDrawSize = size - 18;
        ctx.drawImage(iconCanvas, (size - iconDrawSize) / 2, 10, iconDrawSize, iconDrawSize);
      } else {
        const iconMap = {
          peashooter: '🌱',
          repeater: '🌿',
          snow_pea: '❄️',
          wall_nut: '🌰',
          cabbage_pult: '🥬',
          melon_pult: '🍉',
          cherry_bomb: '🍒',
          potato_mine: '🥔',
          chomper: '🌺',
          snapdragon: '🐉',
          bonk_choy: '🥊',
          galio: '🛡️',
          jhinplant: '🎭',
          lightning_reed: '⚡',
          stunion: '🧅',
          infi_nut: '🔮',
          goo_peashooter: '🧪',
          hypno_shroom: '🌀',
          magnet_shroom: '🧲'
        };

        const icon = iconMap[plantId] || '🌱';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(icon, size / 2, size / 2 + 6);
      }

      // Tên cây rút gọn ở chân thẻ
      const shortName = (pConfig ? pConfig.name : plantId).split(' ')[0].substring(0, 7);
      ctx.fillStyle = '#ffecb3';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shortName, size / 2, size - 4);
    }

    ctx.restore();
  }

  onInputDown(x, y) {
    const startX = this.startX;
    const startY = this.startY;
    const slotSize = this.slotSize;
    const spacing = this.spacing;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const itemY = startY + i * (slotSize + spacing);
      if (x >= startX && x <= startX + slotSize && y >= itemY && y <= itemY + slotSize) {
        this.draggedItem = item;
        this.dragIndex = i;
        item.isDragging = true;
        return true; // Input đã được Băng chuyền xử lý
      }
    }
    return false;
  }

  onInputUp(gridPos, currentPlantOnGrid, placePlantFn, triggerPlantFoodFn) {
    if (!this.draggedItem) return false;

    let success = false;
    const isValidGrid = gridPos !== null && gridPos.row >= 0 && gridPos.col >= 0;

    if (isValidGrid) {
      if (this.draggedItem.type === 'plantFood') {
        if (currentPlantOnGrid && triggerPlantFoodFn) {
          success = triggerPlantFoodFn(currentPlantOnGrid);
        }
      } else {
        if (!currentPlantOnGrid && placePlantFn) {
          // Trong chế độ Conveyor, trồng miễn phí không tốn Sun!
          success = placePlantFn(gridPos.row, gridPos.col, this.draggedItem.plantId);
        }
      }
    }

    if (success) {
      this.items.splice(this.dragIndex, 1); // Đặt thành công -> xóa khỏi băng chuyền
    } else {
      this.draggedItem.isDragging = false; // Thất bại -> hoàn trả về vị trí cũ trên băng
    }

    this.draggedItem = null;
    this.dragIndex = -1;
    return success;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConveyorBelt;
}
