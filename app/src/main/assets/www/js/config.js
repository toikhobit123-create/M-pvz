/**
 * PVZ Tower Defense 2D - Configuration & Registries
 * BẮT BUỘC: Tách riêng DATA và LOGIC TẤN CÔNG (ATK) của Cây và Zombie thành các Object độc lập
 * Code xử lý game (bắn đạn, cắn, trừ máu) chỉ đọc thông số từ các Object này ra để tính toán
 */

// ============================================================================
// 1. CẤU HÌNH DATA CÂY (PLANT_CONFIG)
// ============================================================================
const PLANT_CONFIG = {
  // [NHÓM 1: BẮN THẲNG - Straight]
  // Chuẩn PvZ gốc: Tốc độ bắn 1.425s/lần (~14 DPS). Đạn bị chặn bởi vật cản.
  peashooter: {
    id: 'peashooter',
    name: 'Peashooter',
    group: 'straight',
    cost: 100,
    hp: 300,
    atkSpeed: 1.425, // Chuẩn PvZ gốc: 20 sát thương, bắn mỗi 1.425s (~14 DPS)
    shootInterval: 1.425,
    damage: 20,
    projectileType: 'pea',
    projectileSpeed: 6.5,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },
  snow_pea: {
    id: 'snow_pea',
    name: 'Snow Pea',
    group: 'straight',
    cost: 175,
    hp: 300,
    atkSpeed: 1.425, // Chuẩn PvZ gốc: bắn mỗi 1.425s
    shootInterval: 1.425,
    damage: 20,
    projectileType: 'ice_pea',
    projectileSpeed: 6.5,
    slowFactor: 0.5, // Làm chậm 50%
    slowDuration: 10.0, // Trong 10s
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },
  repeater: {
    id: 'repeater',
    name: 'Repeater',
    group: 'straight',
    cost: 200,
    hp: 300,
    atkSpeed: 1.425, // Chuẩn PvZ gốc: 40 mỗi lượt (2 viên x 20), bắn mỗi 1.425s (~28 DPS)
    shootInterval: 1.425,
    damage: 20,
    burstCount: 2, // Bắn 2 hạt (20x2)
    burstInterval: 0.15,
    projectileType: 'pea',
    projectileSpeed: 6.5,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },

  // [NHÓM 2: BẮN CẦU VỒNG - Lobbed]
  // Chuẩn PvZ gốc: Tốc độ bắn 2.925s/lần. Bỏ qua vật cản.
  cabbage_pult: {
    id: 'cabbage_pult',
    name: 'Cabbage-pult',
    group: 'lobbed',
    cost: 100,
    hp: 300,
    atkSpeed: 2.925, // Chuẩn PvZ gốc: 40 sát thương, bắn mỗi 2.925s (~14 DPS)
    shootInterval: 2.925,
    damage: 40,
    projectileType: 'cabbage',
    splashDamage: 0, // Cabbage-pult gốc chỉ gây đơn mục tiêu trực tiếp
    splashRadiusCells: 0,
    arcHeight: 90,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },
  melon_pult: {
    id: 'melon_pult',
    name: 'Melon-pult',
    group: 'lobbed',
    cost: 300,
    hp: 300,
    atkSpeed: 2.925, // Chuẩn PvZ gốc: 80 trực tiếp + 30 lan, bắn mỗi 2.925s (~27 DPS)
    shootInterval: 2.925,
    damage: 80,
    projectileType: 'melon',
    splashDamage: 30, // Chuẩn PvZ gốc: 30 sát thương lan AoE 3x3
    splashRadiusCells: 1.5,
    arcHeight: 110,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },

  // [NHÓM 3: CẬN CHIẾN - Melee]
  // Tốc độ đánh (atkSpeed): 1.0s/lần. Đánh xuyên, nhiều mục tiêu.
  bonk_choy: {
    id: 'bonk_choy',
    name: 'Bonk Choy',
    group: 'melee',
    cost: 150,
    hp: 300,
    atkSpeed: 0.5, // 0.5s mỗi đòn
    damage: 20,    // 20 damage mỗi lần đấm
    rangeCols: 2.0, // Tầm 2 ô phía trước và đằng sau lưng
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },
  snapdragon: {
    id: 'snapdragon',
    name: 'Snapdragon',
    group: 'melee',
    cost: 200,
    hp: 300,
    atkSpeed: 1.0,
    damage: 30,
    rangeCols: 2.2, // Tầm 1x3 ô phía trước (hàng trên, hàng hiện tại, hàng dưới)
    rangeRows: 1,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },
  galio: {
    id: 'galio',
    name: 'Galio',
    nameEn: 'Galio',
    group: 'melee',
    cost: 200,
    hp: 250,
    atkSpeed: 0.5, // Basic attack: 50 sát thương / 0.5s
    damage: 50,
    rangeCols: 2.0, // Tầm 2 ô tính từ bản thân
    skill1Interval: 5.0, // Skill 1: mỗi 5s bắn sóng năng lượng trước mặt
    skill1Damage: 500,
    skill1Speed: 9.0,
    deathFreezeDuration: 1.0, // Skill 2: khi chết dừng thời gian 1s
    deathPullCount: 5, // Hút 5 zombie gần vào nhà nhất về ô Galio
    deathSkillDamage: 1500,
    cooldown: 20.0,
    canAttack: true,
    produceSun: false
  },

  // [NHÓM 4: CHỨC NĂNG]
  sunflower: {
    id: 'sunflower',
    name: 'Sunflower',
    group: 'functional',
    cost: 50,
    hp: 300,
    cooldown: 7.5,
    produceSun: true,
    sunInterval: 24.0, // Sunflower nhả 25 sun / 24s theo yêu cầu
    firstSunDelay: 5.0,
    sunAmount: 25,
    canAttack: false
  },
  wall_nut: {
    id: 'wall_nut',
    name: 'Wall-nut',
    group: 'functional',
    cost: 50,
    hp: 4000, // HP 4000
    cooldown: 20.0,
    canAttack: false,
    produceSun: false
  },
  cherry_bomb: {
    id: 'cherry_bomb',
    name: 'Cherry Bomb',
    group: 'instant',
    cost: 150,
    hp: 300,
    fuseTime: 1.2,
    damage: 1800, // Nổ 3x3, Dmg 1800
    rangeRadiusCells: 1.5,
    cooldown: 35.0,
    isInstant: true,
    canAttack: true,
    produceSun: false
  },
  chomper: {
    id: 'chomper',
    name: 'Chomper',
    group: 'melee_swallow',
    cost: 150,
    hp: 300,
    rangeCols: 1.8, // Phạm vi từ ô của bản thân và 1 ô trước mặt
    swallowDamage: 2400, // Nuốt: 2400 dmg tức thì
    chewDuration: 20.0, // Tiêu hóa 20s
    bossDamage: 200, // Với Boss: Cắn 200 dmg mỗi 1.0s
    bossAtkSpeed: 1.0,
    cooldown: 7.5,
    canAttack: true,
    produceSun: false
  },

  // Hỗ trợ tương thích các cây đã có
  lightning_reed: {
    id: 'lightning_reed',
    name: 'Sậy Sét',
    group: 'straight',
    cost: 125,
    hp: 300,
    cooldown: 7.5,
    canAttack: true,
    attackInterval: 1.4,
    atkSpeed: 1.4,
    directDamage: 10,
    chainDamage: 10,
    damage: 10,
    maxTargets: 3, // Sát thương lan tối đa 3 mục tiêu (1 mục tiêu chính + 2 mục tiêu lan)
    maxChainRangeCells: 3.0, // Khoảng cách từ mục tiêu chính tới mục tiêu lan không quá 3 ô
    rowRange: 1
  },
  stunion: {
    id: 'stunion',
    name: 'Hành Tây Choáng',
    group: 'instant',
    cost: 25,
    hp: 300,
    cooldown: 15.0,
    isInstant: true,
    stunDuration: 12.0,
    gasRangeCols: 1.8
  },
  infi_nut: {
    id: 'infi_nut',
    name: 'Hạt Dẻ Toàn Ảnh',
    group: 'functional',
    cost: 75,
    hp: 2000,
    cooldown: 15.0,
    isDefensive: true,
    regenDelay: 15.0,
    regenRate: 160.0,
    barrierHp: 10000
  },
  sun_shroom: {
    id: 'sun_shroom',
    name: 'Nấm Mặt Trời',
    group: 'functional',
    cost: 25,
    hp: 300,
    cooldown: 7.5,
    produceSun: true,
    sunInterval: 32.0,
    firstSunDelay: 8.0,
    stage1Sun: 25,
    stage2Sun: 50,
    stage3Sun: 75,
    stage2Time: 40.0,
    stage3Time: 85.0
  },
  goo_peashooter: {
    id: 'goo_peashooter',
    name: 'Đậu Độc',
    group: 'straight',
    cost: 125,
    hp: 300,
    cooldown: 7.5,
    canAttack: true,
    shootInterval: 1.4,
    atkSpeed: 1.4,
    baseDamage: 30,
    damage: 30,
    poisonDmgPerSec: 15.0, // 15 sát thương độc mỗi giây
    maxPoisonStacks: 3,    // Cộng dồn tối đa 3 lần
    poisonDuration: 4.0,
    slowFactor: 1.0,       // Không làm chậm
    slowDuration: 0,       // Không làm chậm
    projectileSpeed: 6.0
  },

  // [NHÓM 5: THẢO MỘC ĐẶC BIỆT THEO YÊU CẦU]
  // Nấm Thôi Miên (Hypno-shroom):
  // CHI PHÍ MẶT TRỜI: 100, SẠC LẠI: 20s, SỰ BỀN BỈ: 50, Đơn mục tiêu
  // Khi thây ma ăn nấm thôi miên, chúng sẽ quay lại và chiến đấu cho bạn
  hypno_shroom: {
    id: 'hypno_shroom',
    name: 'Nấm Thôi Miên',
    nameEn: 'Hypno-shroom',
    group: 'functional_hypno',
    cost: 100,
    hp: 50,
    cooldown: 20.0,
    canAttack: false,
    produceSun: false,
    singleTarget: true,
    desc: 'Khi thây ma ăn nấm thôi miên, chúng sẽ quay lại và chiến đấu cho bạn.'
  },

  // Mìn Khoai Tây (Potato Mine):
  // CHI PHÍ MẶT TRỜI: 50, SẠC LẠI: 25s, SỰ BỀN BỈ: 300, HƯ HẠI: 2700
  // THỜI GIAN nhô lên: 5s sau khi đặt xuống. Nếu chưa nhô lên mà bị zom ăn sẽ bị mất luôn.
  // Nổ gây sát thương 3x3 ô.
  potato_mine: {
    id: 'potato_mine',
    name: 'Mìn Khoai Tây',
    nameEn: 'Potato Mine',
    group: 'instant_mine',
    cost: 50,
    hp: 300,
    damage: 2700,
    armDuration: 5.0,
    cooldown: 25.0,
    splashRadiusCells: 1.5,
    canAttack: true,
    produceSun: false,
    desc: '5s sau khi đặt xuống sẽ nhô lên. Nếu chưa nhô lên mà bị zom ăn sẽ bị mất luôn. Nổ gây 2700 sát thương phạm vi 3x3 ô.'
  },

  // Nấm Nam Châm (Magnet-shroom):
  // Hút xô sắt, nón sắt, xích sắt của zombie. Ưu tiên hàng đầu bị rồng nhắm cầu lửa!
  magnet_shroom: {
    id: 'magnet_shroom',
    name: 'Nấm Nam Châm',
    nameEn: 'Magnet-shroom',
    group: 'functional_magnet',
    cost: 100,
    hp: 300,
    cooldown: 15.0,
    canAttack: false,
    produceSun: false,
    attractInterval: 10.0,
    desc: 'Hút các vật kim loại (thùng sắt, nón sắt, xích sắt). Luôn là mục tiêu ưu tiên số 1 của Zombot Dark Dragon!'
  },

};

// ============================================================================
// 2. CẤU HÌNH THÔNG SỐ CHIẾN ĐẤU CHUYÊN BIỆT CỦA ZOMBIE (ZOMBIE_COMBAT_STATS)
// ============================================================================
const ZOMBIE_COMBAT_STATS = {
  // Chỉ số cắn chung (Bite Stats)
  global: {
    biteDamage: 50,
    biteInterval: 0.5,
    biteDps: 100
  },

  // Chỉ số chiến đấu chuyên biệt từng loại Zombie (Specialized Combat Mechanics)
  specialized: {
    pole_vaulting: {
      fastSpeedPerCell: 3.0,
      slowSpeedPerCell: 5.5,
      vaultDistanceCells: 1.2
    },
    gargantuar: {
      damage: 500, // damage: 1500
      smashInterval: 2.0,
      smashWindup: 1.0,
      impThrowThreshold: 1500, // impThrowThreshold: 1800
      impThrowCells: 3
    },
    zombot_dark_dragon: {
      collisionDamage: 111,
      damage: 99999, // Hơi thở lửa oneshot cây
      roarCooldown: 14.0,     // Gầm triệu hồi lính Dark Ages mỗi 14s
      fireballCooldown: 9.0,  // Nhổ cầu lửa mỗi 9s
      breathCooldown: 22.0,   // Hơi thở lửa càn quét 2 hàng mỗi 22s
      knockbackImmune: true
    },
    imp_dragon: {
      isFireImmune: true // Miễn nhiễm sát thương lửa
    },
    tombstone: {
      isObstacle: true,
      damage: 0,
      atkSpeed: 999999
    },
    jurassic_bully: {
      damagePerSec: 100,
      knockbackImmune: true
    },
    turquoise_skull: {
      damagePerSec: 100,
      laserDamage: 4000,
      laserChargeDuration: 5.0,
      laserRangeCells: 4,
      laserCooldown: 2.5
    },
    troglobite: {
      damage: 100,
      attackInterval: 0.5,
      freezeImmune: true,
      slowImmune: true
    },
    yeti_imp: {
      damage: 100,
      attackInterval: 0.5,
      freezeImmune: true,
      slowImmune: true
    },
    ice_block: {
      isObstacle: true,
      damage: 0,
      atkSpeed: 999999,
      freezeImmune: true,
      slowImmune: true,
      knockbackImmune: true
    },
    lang_khach: {
      damage: 50,
      attackInterval: 0.5,
      dashRangeCells: 3.0,
      dashDamage: 100,
      invulnDuration: 3.0,
      tornadoThreshold: 3,
      tornadoDamage: 1800,
      tornadoRangeCells: 2.0
    }
  }
};

const ZOMBIE_COMBAT_DEFAULTS = ZOMBIE_COMBAT_STATS.global;

// ============================================================================
// CHỈ SỐ CƠ BẢN CỦA TỪNG LOẠI ZOMBIE (ZOMBIE_BASE_STATS)
// ============================================================================
const ZOMBIE_BASE_STATS = {
  basic: {
    id: 'basic',
    name: 'Basic Zombie',
    hp: 190,
    baseHp: 190,
    speedPerCell: 6.0,
    speed: 0.222,
    atkSpeed: 0.5,
    damage: 50,
    isBoss: false,
    hasShield: false,
    resistanceKnockback: 0
  },

  conehead: {
    id: 'conehead',
    name: 'Conehead Zombie',
    hp: 560,
    armorHp: 370,
    baseHp: 190,
    speedPerCell: 6.0,
    speed: 0.222,
    atkSpeed: 0.5,
    damage: 50,
    isBoss: false,
    hasShield: true,
    resistanceKnockback: 0
  },

  buckethead: {
    id: 'buckethead',
    name: 'Buckethead Zombie',
    hp: 1290,
    armorHp: 1100,
    baseHp: 190,
    speedPerCell: 6.0,
    speed: 0.222,
    atkSpeed: 0.5,
    damage: 50,
    isBoss: false,
    hasShield: true,
    resistanceKnockback: 0
  },

  pole_vaulting: {
    id: 'pole_vaulting',
    name: 'Pole Vaulting Zombie',
    hp: 500,
    baseHp: 500,
    speedPerCell: 3.0,
    speed: 0.444,
    atkSpeed: 0.5,
    damage: 50,
    isBoss: false,
    hasShield: false,
    resistanceKnockback: 0
  },

  gargantuar: {
    id: 'gargantuar',
    name: 'Gargantuar BOSS',
    hp: 3000, // hp: 3600
    baseHp: 3000,
    speedPerCell: 8.5,
    speed: 0.157,
    speedCellsPerSec: 0.24,
    damage: 500,
    isBoss: true,
    hasShield: false,
    resistanceKnockback: 1.0
  },

  zombot_dark_dragon: {
    id: 'zombot_dark_dragon',
    name: 'Zombot Dark Dragon',
    hp: 27000,
    maxHp: 27000,
    baseHp: 27000,
    isBoss: true,
    speed: 0,
    speedPerCell: 999999,
    attackInterval: 1.0,
    knockbackImmune: true,
    resistanceKnockback: 1.0,
    hasShield: false
  },

  imp_dragon: {
    id: 'imp_dragon',
    name: 'Imp Dragon Zombie',
    hp: 190,
    baseHp: 190,
    speed: 0.65,
    speedPerCell: 2.8,
    damage: 20,
    attackInterval: 0.5,
    atkSpeed: 0.5,
    hasShield: false,
    resistanceKnockback: 0.2
  },

  tombstone: {
    id: 'tombstone',
    name: 'Tombstone (Vật cản)',
    hp: 500,
    baseHp: 500,
    isObstacle: true,
    speedPerCell: 999999,
    speed: 0,
    damage: 0,
    atkSpeed: 999999,
    resistanceKnockback: 1.0
  },

  regular: {
    id: 'regular',
    name: 'Zombie Thường',
    hp: 200,
    baseHp: 200,
    speed: 0.35,
    speedPerCell: 5.0,
    damage: 20,
    attackInterval: 0.5,
    atkSpeed: 0.5,
    hasShield: false,
    resistanceKnockback: 0
  },

  imp: {
    id: 'imp',
    name: 'Imp',
    hp: 100,
    baseHp: 100,
    speed: 0.70,
    speedPerCell: 2.5,
    damage: 20,
    attackInterval: 0.5,
    atkSpeed: 0.5,
    hasShield: false,
    resistanceKnockback: 0
  },

  jurassic_bully: {
    id: 'jurassic_bully',
    name: 'Jurassic Bully',
    hp: 1100,
    baseHp: 1100,
    speed: 0.2133,
    speedCellsPerSec: 0.16,
    speedPerCell: 6.25,
    damage: 25,
    attackInterval: 0.25,
    resistanceKnockback: 1.0,
    hasShield: false
  },

    turquoise_skull: {
    id: 'turquoise_skull',
    name: 'Turquoise Skull Zombie',
    hp: 250,
    baseHp: 250,
    speed: 0.2467,
    speedCellsPerSec: 0.185,
    speedPerCell: 5.4,
    damage: 25,
    attackInterval: 0.25,
    resistanceKnockback: 0,
    hasShield: false
  },

  troglobite: {
    id: 'troglobite',
    name: 'Troglobite với một khối',
    hp: 470,
    baseHp: 470,
    armorHp: 0,
    speed: 0.2467,
    speedCellsPerSec: 0.185,
    speedPerCell: 5.4,
    damage: 100,
    attackInterval: 0.5,
    freezeImmune: true,
    slowImmune: true,
    isBoss: false,
    hasShield: false,
    resistanceKnockback: 0.4
  },

  yeti_imp: {
    id: 'yeti_imp',
    name: 'Yeti Imp',
    hp: 190,
    baseHp: 190,
    armorHp: 0,
    speed: 0.444,
    speedCellsPerSec: 0.33,
    speedPerCell: 3.0,
    damage: 100,
    attackInterval: 0.5,
    freezeImmune: true,
    slowImmune: true,
    isBoss: false,
    hasShield: false,
    resistanceKnockback: 0
  },

  ice_block: {
    id: 'ice_block',
    name: 'Khối Băng (Yeti Imp)',
    hp: 450,
    baseHp: 450,
    armorHp: 0,
    isObstacle: true,
    speed: 0,
    speedPerCell: 999999,
    damage: 0,
    freezeImmune: true,
    slowImmune: true,
    knockbackImmune: true,
    hasShield: false,
    resistanceKnockback: 1.0
  },

  lang_khach: {
    id: 'lang_khach',
    name: 'Lãng Khách Zombie',
    hp: 600,
    baseHp: 600,
    armorHp: 0,
    speed: 0.278,
    speedPerCell: 4.8,
    damage: 50,
    attackInterval: 0.5,
    atkSpeed: 0.5,
    isBoss: false,
    hasShield: false,
    resistanceKnockback: 0
  }
};

// ============================================================================
// HỢP NHẤT DANH MỤC ZOMBIE (ZOMBIE_CONFIG) - CHỈ CHỨA CÁC ĐỐI TƯỢNG LOẠI ZOMBIE
// Object.keys(ZOMBIE_CONFIG) 100% không bị va chạm hay ô nhiễm bởi biteDamage/biteInterval
// ============================================================================
const ZOMBIE_CONFIG = {};
for (const [id, base] of Object.entries(ZOMBIE_BASE_STATS)) {
  ZOMBIE_CONFIG[id] = {
    ...base,
    ...(ZOMBIE_COMBAT_STATS.specialized[id] || {})
  };
}

// Aliases cho cấu trúc code trước
const PLANT_REGISTRY = PLANT_CONFIG;
const ZOMBIE_REGISTRY = ZOMBIE_CONFIG;

// ============================================================================
// 3. CƠ CHẾ GAME CỐT LÕI (CORE CONFIG)
// ============================================================================
const CONFIG = {
  // Lưới 9 cột x 5 hàng. Kích thước ô 80x100 chuẩn
  ROWS: 5,
  COLS: 9,
  CANVAS_WIDTH: 960,
  CANVAS_HEIGHT: 540,

  GRID_OFFSET_X: 140, // Chừa mép trái cho khay hạt giống dọc (72px) và máy cắt cỏ (95px)
  GRID_OFFSET_Y: 60,  // Chừa mép trên cho thanh wave & nút chức năng (35px), hàng 1 hoàn toàn không bị che!
  CELL_WIDTH: 80,     // 80px x 9 cột = 720px
  CELL_HEIGHT: 90,    // 90px x 5 hàng = 450px

  // Kinh tế Sun
  INITIAL_SUN: 50,       // Ban đầu 50 Sun theo yêu cầu
  SANDBOX_SUN: 9999,     // Sandbox: 9999 Sun
  SUN_VALUE: 25,
  SUN_AUTO_COLLECT_DELAY: 0.5, // Tự động nhặt sau khi rơi 0.5s (có thể click tay)
  NATURAL_SUN_INTERVAL: 8.5,
  NATURAL_SUN_LIFETIME: 10.0,

  // Tốc độ game mặc định là 2.0 (hỗ trợ bật/tắt x1 và x2)
  GAME_SPEED: 2.0,

  // Máy cắt cỏ: 5 máy (1/hàng) ở mép trái. Tự chạy khi zombie chạm nhà, nghiền nát mọi zombie trên hàng
  USE_LAWNMOWERS: true,
  LAWNMOWER_SPEED: 8.5,

  // Tham chiếu cấu hình Zombie
  zombieBase: ZOMBIE_BASE_STATS,
  zombieCombat: ZOMBIE_COMBAT_STATS,

  // Giới hạn dt tối đa trong game loop: scaledDt = Math.min(dt * timeScale, 0.1) chống xuyên tường
  MAX_SCALED_DT: 0.1,

  // --- CẤU HÌNH HỆ THỐNG CONVEYOR BELT (BĂNG CHUYỀN) ---
  conveyor: {
    enabled: true,
    capacity: 8,              // Số ô tối đa trên băng chuyền (8 ô)
    spawnInterval: 4500,      // Thời gian sinh cây mới (4.5s)
    initialSpawn: 5,          // Số lượng vật phẩm sinh ra ngay khi bắt đầu màn
    plantFoodWeight: 14,      // Trọng số xuất hiện của Plant Food
    
    // Plant Pool CHỈ GỒM CÁC CÂY NGƯỜI CHƠI ĐÃ CÓ TRONG GAME (Tuyệt đối không thêm cây lạ)
    plantPool: [
      // [Phòng thủ kiên cố]
      { plantId: "wall_nut", weight: 26 },
      { plantId: "infi_nut", weight: 22 },
      
      // [Tấn công cơ bản & tầm xa]
      { plantId: "peashooter", weight: 26 },
      { plantId: "cabbage_pult", weight: 26 },
      { plantId: "snow_pea", weight: 22 },
      { plantId: "repeater", weight: 18 },
      { plantId: "lightning_reed", weight: 20 },
      { plantId: "goo_peashooter", weight: 18 },
      { plantId: "melon_pult", weight: 14 },
      
      // [Cận chiến & diện rộng]
      { plantId: "bonk_choy", weight: 18 },
      { plantId: "snapdragon", weight: 18 },
      { plantId: "chomper", weight: 15 },
      { plantId: "galio", weight: 14 },
      
      // [Khống chế & khắc chế Zombie / Boss]
      { plantId: "magnet_shroom", weight: 25 },
      { plantId: "stunion", weight: 18 },
      { plantId: "potato_mine", weight: 20 },
      { plantId: "hypno_shroom", weight: 15 },
      { plantId: "cherry_bomb", weight: 10 }
    ]
  }
};

// ============================================================================
// 4. HỆ THỐNG WORLD MAP & ĐỘ KHÓ TĂNG DẦN (5 LEVEL)
// ============================================================================
const LEVEL_CONFIG = {
  1: {
    level: 1,
    title: 'Level 1: Khởi Đầu Nghĩa Địa',
    subtitle: 'Kẻ thù: Basic Zombie & Quỷ Lùn Imp',
    description: 'Làm quen với khu vườn nghĩa địa cùng Basic Zombie và Quỷ Lùn Imp nhanh nhẹn.',
    zombiePool: ['basic', 'imp'],
    hasTombstones: false,
    tombstoneCount: 0,
    spawnMultiplier: 1.0,
    waves: 5
  },
  2: {
    level: 2,
    title: 'Level 2: Bia Mộ & Nón Sắt',
    subtitle: 'Thêm Conehead & Pole Vaulting (Cầm Sào)',
    description: 'Bia Mộ xuất hiện trên sân. Zombie Nón Sắt và Nhảy Sào vượt rào tham chiến!',
    zombiePool: ['basic', 'conehead', 'pole_vaulting'],
    hasTombstones: true,
    tombstoneCount: 4,
    spawnMultiplier: 1.0,
    waves: 5
  },
  3: {
    level: 3,
    title: 'Level 3: Binh Đoàn Thùng Sắt & Đầu Lâu',
    subtitle: 'Thêm Buckethead & Turquoise Skull (Bắn Laser)',
    description: 'Zombie Thùng Sắt trâu bò và Turquoise Skull Zombie phóng tia laser thiêu rụi cây!',
    zombiePool: ['basic', 'conehead', 'buckethead', 'turquoise_skull'],
    hasTombstones: true,
    tombstoneCount: 6,
    spawnMultiplier: 1.5,
    waves: 5
  },
  4: {
    level: 4,
    title: 'Level 4: Kỷ Băng Hà & Jurassic Bully',
    subtitle: 'Thêm Jurassic Bully, Troglobite & Lãng Khách Zombie',
    description: 'Jurassic Bully càn quét, Troglobite đẩy tảng băng chứa Yeti Imp và Lãng Khách Zombie lướt kiếm gió!',
    zombiePool: ['basic', 'conehead', 'buckethead', 'lang_khach', 'jurassic_bully', 'troglobite', 'yeti_imp'],
    hasTombstones: true,
    tombstoneCount: 7,
    spawnMultiplier: 2.0,
    waves: 5
  },
  5: {
    level: 5,
    title: 'Level 5: ĐẠI CHIẾN BOSS GARGANTUAR',
    subtitle: 'Hội Tụ Binh Đoàn & BOSS Khổng Lồ Gargantuar',
    description: 'Tất cả các binh chủng zombie tinh nhuệ tràn vào cùng trùm Khổng Lồ Gargantuar đập nát vườn cây!',
    zombiePool: ['basic', 'imp', 'conehead', 'pole_vaulting', 'buckethead', 'lang_khach', 'jurassic_bully', 'turquoise_skull', 'troglobite', 'yeti_imp', 'gargantuar'],
    hasTombstones: true,
    tombstoneCount: 8,
    spawnMultiplier: 2.5,
    isBossLevel: true,
    waves: 5
  },
  6: {
    level: 6,
    title: 'Level 6: ĐẠI CHIẾN ZOMBOT DARK DRAGON',
    subtitle: 'TRÙM RỒNG HẮC ÁM 27.000 HP (BĂNG CHUYỀN CONVEYOR)',
    description: 'Trùm Rồng phun lửa thiêu rụi 2 hàng, nhổ cầu lửa nở Imp Dragon và tiếng gầm triệu hồi tất cả binh chủng!',
    zombiePool: ['basic', 'imp', 'conehead', 'buckethead', 'pole_vaulting', 'lang_khach', 'jurassic_bully', 'turquoise_skull', 'troglobite', 'yeti_imp', 'gargantuar', 'imp_dragon'],
    hasTombstones: true,
    tombstoneCount: 6,
    spawnMultiplier: 2.0,
    isBossLevel: true,
    isConveyor: true,
    gameMode: 'conveyor',
    bossType: 'zombot_dark_dragon',
    waves: 1 // Trận đấu trùm duy nhất với thanh máu HP 27.000
  }
};

// Cấu hình Wave mặc định
const WAVE_CONFIG = {
  INITIAL_DELAY: 20.0, // Đầu game delay 20s trước khi zombie xuất hiện theo yêu cầu
  REST_DELAY: 15.0,    // Phải diệt sạch 100% zombie của 1 wave, sau đó nghỉ 15s mới tới wave tiếp theo
  TOTAL_WAVES: 5       // 5 wave mỗi màn
};
