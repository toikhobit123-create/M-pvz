/**
 * PVZ Tower Defense 2D - Game Engine
 * Quản lý vòng đời game, Main Menu, World Map (5 Level), Sandbox Mode,
 * Hệ thống Chọn Cây (Choose Your Seeds), Khay Hạt Giống Dọc (Vertical Seed Tray),
 * Kinh tế Sun, Lưới 9x5, X2 Tốc độ, Hệ thống Wave và Combat đọc từ PLANT_CONFIG / ZOMBIE_CONFIG
 */

const PLANT_SHOWCASE_DATA = {
  sunflower: {
    id: 'sunflower',
    name: 'Hướng Dương (Sunflower)',
    group: 'Kinh Tế',
    cost: 50,
    dmg: '0 (Không bắn)',
    rate: '25 Sun / 24s',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Cung cấp 25 Mặt Trời (Sun) mỗi 24 giây. Nền tảng kinh tế tối quan trọng để xây dựng phòng tuyến.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><circle cx="22" cy="19" r="13" fill="#15081c" stroke="#4a154b" stroke-width="1.5"/><circle cx="22" cy="19" r="10" fill="#2d0d36"/><path d="M22 6 L22 13 M22 25 L22 32 M9 19 L16 19 M28 19 L35 19" stroke="#ff1744" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="22" cy="19" rx="6" ry="5" fill="#000" stroke="#b71c1c" stroke-width="1.2"/><circle cx="22" cy="19" r="3" fill="#ff1744"/><circle cx="21" cy="18" r="0.8" fill="#fff"/><path d="M22 32 Q23 38 22 42" stroke="#122318" stroke-width="3" fill="none"/></svg>`
  },
  peashooter: {
    id: 'peashooter',
    name: 'Đậu Quỷ (Peashooter)',
    group: 'Bắn Thẳng',
    cost: 100,
    dmg: '20 DMG',
    rate: '1.425s / phát (~14 DPS)',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn hạt đậu cơ bản gây 20 sát thương mỗi 1.425s. Chiến binh tuyến đầu tiêu chuẩn bảo vệ nghĩa địa.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="19" cy="18" rx="10" ry="9" fill="#1b4d24" stroke="#0a2612" stroke-width="1.2"/><ellipse cx="31" cy="18" rx="5" ry="6" fill="#2d733b"/><ellipse cx="32" cy="18" rx="3" ry="4" fill="#091f0e"/><polygon points="30,14 32,16 34,14" fill="#fffde7"/><polygon points="30,22 32,20 34,22" fill="#fffde7"/><circle cx="17" cy="14" r="2.5" fill="#ffd600"/><ellipse cx="17" cy="14" rx="0.8" ry="2" fill="#000"/><path d="M18 27 Q19 36 21 41" stroke="#0e2916" stroke-width="3" fill="none"/></svg>`
  },
  snow_pea: {
    id: 'snow_pea',
    name: 'Đậu Băng (Snow Pea)',
    group: 'Làm Chậm',
    cost: 175,
    dmg: '20 DMG + Băng',
    rate: '1.425s / phát',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn hạt đậu băng giá gây 20 sát thương và làm chậm 50% tốc độ di chuyển và cắn của Zombie trong 10s.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="19" cy="18" rx="10" ry="9" fill="#006064" stroke="#00e5ff" stroke-width="1.2"/><ellipse cx="31" cy="18" rx="5" ry="6" fill="#00bcd4"/><ellipse cx="32" cy="18" rx="3" ry="4" fill="#00251a"/><polygon points="12,10 9,6 15,9" fill="#80deea"/><polygon points="10,16 5,14 11,18" fill="#80deea"/><polygon points="13,24 8,26 15,22" fill="#80deea"/><circle cx="17" cy="14" r="2.5" fill="#e0f7fa"/><circle cx="17" cy="14" r="1.2" fill="#00838f"/><path d="M18 27 Q19 36 21 41" stroke="#004d40" stroke-width="3" fill="none"/></svg>`
  },
  repeater: {
    id: 'repeater',
    name: 'Đậu Nòng Đôi (Repeater)',
    group: 'Bắn Thẳng x2',
    cost: 200,
    dmg: '40 DMG (2x20)',
    rate: '1.425s (~28 DPS)',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn liên thanh 2 hạt đậu mỗi lượt gây 40 sát thương, tăng gấp đôi hỏa lực đối đầu với Zombie bọc giáp.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M12 12 Q8 6 12 4 Q16 6 14 12" fill="#4caf50" stroke="#1b5e20" stroke-width="1"/><path d="M8 15 Q4 11 8 8 Q12 10 10 15" fill="#4caf50" stroke="#1b5e20" stroke-width="1"/><ellipse cx="20" cy="20" rx="11" ry="10" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.2"/><ellipse cx="33" cy="20" rx="6" ry="7" fill="#43a047"/><ellipse cx="34" cy="20" rx="3.5" ry="4.5" fill="#0d280d"/><circle cx="18" cy="16" r="3" fill="#ffeb3b"/><circle cx="18" cy="16" r="1.5" fill="#000"/><path d="M19 29 Q20 37 22 41" stroke="#1b5e20" stroke-width="3" fill="none"/></svg>`
  },
  wall_nut: {
    id: 'wall_nut',
    name: 'Hạt Dẻ (Wall-nut)',
    group: 'Phòng Thủ',
    cost: 50,
    dmg: '0 (Khiên chắn)',
    rate: 'Bất động',
    cooldown: '20.0s',
    hp: '4000 HP',
    desc: 'Lớp vỏ siêu dày chịu đựng tới 4000 sát thương, cản bước zombie để các cây phía sau xả sát thương.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="22" cy="22" rx="12" ry="15" fill="#5d4037" stroke="#3e2723" stroke-width="1.5"/><ellipse cx="20" cy="20" rx="10" ry="13" fill="#795548"/><circle cx="17" cy="16" r="2.8" fill="#fff"/><circle cx="17" cy="16" r="1.3" fill="#000"/><circle cx="26" cy="16" r="2.8" fill="#fff"/><circle cx="26" cy="16" r="1.3" fill="#000"/><path d="M18 27 Q22 29 25 27" stroke="#3e2723" stroke-width="1.8" fill="none"/></svg>`
  },
  cabbage_pult: {
    id: 'cabbage_pult',
    name: 'Bắp Cải (Cabbage-pult)',
    group: 'Cầu Vồng',
    cost: 100,
    dmg: '40 DMG',
    rate: '2.925s (~14 DPS)',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn bắp cải theo đường cầu vồng, vượt qua mọi Bia Mộ (Tombstone) và vật cản để đánh trúng Zombie.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="20" cy="26" rx="10" ry="8" fill="#388e3c" stroke="#1b5e20" stroke-width="1.2"/><line x1="20" y1="26" x2="28" y2="12" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/><circle cx="29" cy="11" r="6" fill="#81c784" stroke="#2e7d32" stroke-width="1.2"/><circle cx="29" cy="11" r="3" fill="#c8e6c9"/><circle cx="18" cy="24" r="2" fill="#fff"/><circle cx="18" cy="24" r="1" fill="#000"/></svg>`
  },
  melon_pult: {
    id: 'melon_pult',
    name: 'Dưa Hấu (Melon-pult)',
    group: 'Cầu Vồng AoE',
    cost: 300,
    dmg: '80 (+30 Lan AoE)',
    rate: '2.925s (~27 DPS)',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn dưa hấu hạng nặng cầu vồng qua Bia Mộ. Gây 80 sát thương trực tiếp và 30 sát thương lan AoE 3x3 ô.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="19" cy="27" rx="11" ry="8" fill="#1b5e20" stroke="#0d280d" stroke-width="1.2"/><line x1="19" y1="27" x2="28" y2="12" stroke="#795548" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="29" cy="11" rx="8" ry="6" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.2"/><line x1="25" y1="8" x2="27" y2="14" stroke="#81c784" stroke-width="1.2"/><line x1="29" y1="7" x2="30" y2="15" stroke="#81c784" stroke-width="1.2"/><line x1="33" y1="8" x2="32" y2="14" stroke="#81c784" stroke-width="1.2"/></svg>`
  },
  chomper: {
    id: 'chomper',
    name: 'Hoa Ăn Thịt (Chomper)',
    group: 'Nuốt Chửng',
    cost: 150,
    dmg: '2400 DMG (Nuốt)',
    rate: 'Tiêu hóa 20s',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Há miệng nuốt trọn 1 Zombie trong phạm vi ô của bản thân và 1 ô trước mặt (ví dụ đặt sau Hạt Dẻ vẫn ăn được zombie phía trước). Cắn Boss 200 DMG/s.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M16 38 Q18 28 20 22" stroke="#4a148c" stroke-width="3" fill="none"/><path d="M16 16 C16 8 32 8 32 16 L32 20 C32 28 16 28 16 20 Z" fill="#6a1b9a" stroke="#4a148c" stroke-width="1.2"/><ellipse cx="25" cy="18" rx="5" ry="4" fill="#12005e"/><polygon points="20,13 22,17 24,13" fill="#fff"/><polygon points="26,13 28,17 30,13" fill="#fff"/><polygon points="20,23 22,19 24,23" fill="#fff"/><polygon points="26,23 28,19 30,23" fill="#fff"/><circle cx="19" cy="11" r="1.8" fill="#ffd600"/></svg>`
  },
  cherry_bomb: {
    id: 'cherry_bomb',
    name: 'Bom Anh Đào (Cherry Bomb)',
    group: 'Nổ Tức Thời',
    cost: 150,
    dmg: '1800 DMG (3x3)',
    rate: 'Phát nổ sau 1.2s',
    cooldown: '35.0s',
    hp: '300 HP',
    desc: 'Phát nổ hủy diệt phạm vi 3x3 ô với 1800 sát thương, xóa sổ ngay lập tức toàn bộ đàn zombie dày đặc.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M15 24 Q22 10 22 6 Q22 10 29 24" stroke="#2e7d32" stroke-width="2.5" fill="none"/><circle cx="15" cy="27" r="8" fill="#c62828" stroke="#8e0000" stroke-width="1.2"/><circle cx="13" cy="24" r="1.5" fill="#fff"/><circle cx="17" cy="24" r="1.5" fill="#fff"/><polygon points="12,28 15,30 18,28" fill="#000"/><circle cx="29" cy="27" r="8" fill="#c62828" stroke="#8e0000" stroke-width="1.2"/><circle cx="27" cy="24" r="1.5" fill="#fff"/><circle cx="31" cy="24" r="1.5" fill="#fff"/><polygon points="26,28 29,30 32,28" fill="#000"/><polygon points="22,2 25,6 21,7 23,10 19,6" fill="#ffeb3b"/></svg>`
  },
  bonk_choy: {
    id: 'bonk_choy',
    name: 'Đấm Bốc (Bonk Choy)',
    group: 'Cận Chiến',
    cost: 150,
    dmg: '20 DMG mỗi 0.5s',
    rate: '0.5s / đấm',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Võ sĩ cận chiến tung đòn đấm 20 sát thương mỗi 0.5s. Phạm vi tấn công 2 ô trước mặt và 2 ô đằng sau lưng.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M16 38 Q22 28 22 20 Q22 28 28 38 Z" fill="#43a047" stroke="#1b5e20" stroke-width="1.2"/><ellipse cx="22" cy="15" rx="9" ry="8" fill="#66bb6a" stroke="#2e7d32" stroke-width="1.5"/><circle cx="17" cy="12" r="2.5" fill="#a5d6a7"/><circle cx="22" cy="10" r="2.8" fill="#a5d6a7"/><circle cx="27" cy="12" r="2.5" fill="#a5d6a7"/><circle cx="19" cy="17" r="1.8" fill="#000"/><circle cx="25" cy="17" r="1.8" fill="#000"/><circle cx="18" cy="16" r="0.6" fill="#fff"/><circle cx="24" cy="16" r="0.6" fill="#fff"/></svg>`
  },
  snapdragon: {
    id: 'snapdragon',
    name: 'Rồng Lửa (Snapdragon)',
    group: 'Phun Lửa 3 Hàng',
    cost: 200,
    dmg: '30 DMG (3 hàng)',
    rate: '1.0s / lần',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Phun luồng lửa ma quái hình nón bao phủ 3 hàng liền kề, thiêu rụi nhiều mục tiêu cùng lúc.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M18 38 Q18 26 24 18" stroke="#2e7d32" stroke-width="3.5" fill="none"/><path d="M22 14 L34 16 L28 22 L20 22 Z" fill="#e65100" stroke="#bf360c" stroke-width="1.2"/><polygon points="34,16 39,14 36,19" fill="#ffeb3b"/><circle cx="24" cy="16" r="2" fill="#fff"/><circle cx="24" cy="16" r="1" fill="#000"/><polygon points="21,14 17,9 23,12" fill="#ff9800"/></svg>`
  },
  lightning_reed: {
    id: 'lightning_reed',
    name: 'Sậy Sét (Lightning Reed)',
    group: 'Giật Sét Dây Chuyền',
    cost: 125,
    dmg: '10 DMG x tối đa 3 mục tiêu',
    rate: '1.4s / tia',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Chỉ giật tia lôi điện xuyên qua tối đa 3 mục tiêu. Khoảng cách từ mục tiêu chính tới mục tiêu lan không quá 3 ô.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><path d="M22 41 Q18 26 22 15" stroke="#004d40" stroke-width="3" fill="none"/><ellipse cx="22" cy="14" rx="7.5" ry="7" fill="#00251a" stroke="#00e5ff" stroke-width="1.5"/><circle cx="22" cy="14" r="3.5" fill="#18ffff"/><polygon points="22,1 26,9 21,9 25,16 17,9 21,9" fill="#00e5ff" stroke="#fff" stroke-width="0.8"/></svg>`
  },
  stunion: {
    id: 'stunion',
    name: 'Hành Choáng (Stunion)',
    group: 'Khí Choáng Tức Thời',
    cost: 25,
    dmg: 'Choáng 12 Giây',
    rate: 'Tác dụng tức thời',
    cooldown: '15.0s',
    hp: '300 HP',
    desc: 'Thổi luồng khí hôi thối cực nồng làm tê liệt hoàn toàn mọi zombie trong 1.8 ô suốt 12 giây.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="22" cy="24" rx="10" ry="11" fill="#2d1338" stroke="#6a1b9a" stroke-width="1.5"/><ellipse cx="22" cy="24" rx="7" ry="8" fill="#4a148c"/><path d="M22 11 Q17 3 13 6 Q20 11 22 11 Q24 3 29 6 Q24 11 22 11" fill="#76ff03"/><ellipse cx="18" cy="22" rx="1.8" ry="2.2" fill="#ea80fc"/><ellipse cx="26" cy="22" rx="1.8" ry="2.2" fill="#ea80fc"/><ellipse cx="22" cy="28" rx="3" ry="3.5" fill="#000"/></svg>`
  },
  infi_nut: {
    id: 'infi_nut',
    name: 'Hạt Dẻ Hologram (Infi-nut)',
    group: 'Khiên Hồi Phục',
    cost: 75,
    dmg: '0 (Tự hồi máu)',
    rate: 'Bất động',
    cooldown: '15.0s',
    hp: '2000 HP (Hồi phục)',
    desc: 'Chiếu lá chắn toàn ảnh 2000 HP. Khi không bị cắn sẽ tự tái tạo lại hoàn toàn từ đĩa phát laser.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><rect x="14" y="32" width="16" height="5" rx="2" fill="#1b2326" stroke="#455a64" stroke-width="1.2"/><polygon points="22,7 31,18 22,29 13,18" fill="rgba(0, 229, 255, 0.4)" stroke="#00e5ff" stroke-width="1.8"/><circle cx="22" cy="18" r="3" fill="#fff"/></svg>`
  },
  sun_shroom: {
    id: 'sun_shroom',
    name: 'Nấm Mặt Trời (Sun Shroom)',
    group: 'Kinh Tế Tiến Hóa',
    cost: 25,
    dmg: '0 (Kinh tế)',
    rate: '25 → 50 → 75 Sun',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Cây kinh tế giá rẻ 25 Sun. Lớn dần qua 3 giai đoạn để nhả tới 75 Mặt Trời mỗi đợt.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><rect x="19" y="24" width="6" height="11" rx="3" fill="#1f1426" stroke="#6a1b9a" stroke-width="1"/><path d="M10 25 Q22 8 34 25 Z" fill="#4a148c" stroke="#aa00ff" stroke-width="1.5"/><circle cx="16" cy="18" r="2.2" fill="#76ff03"/><circle cx="28" cy="18" r="2.2" fill="#76ff03"/><circle cx="22" cy="13" r="1.8" fill="#00e5ff"/></svg>`
  },
  goo_peashooter: {
    id: 'goo_peashooter',
    name: 'Đậu Độc (Goo Pea)',
    group: 'Độc Xuyên Giáp',
    cost: 125,
    dmg: '30 DMG Xuyên Giáp + 15 Độc/s',
    rate: '1.4s / phát',
    cooldown: '7.5s',
    hp: '300 HP',
    desc: 'Bắn hạt đậu độc 30 sát thương đánh thẳng vào máu xuyên giáp nón/xô, độc 15 sát thương/giây dồn tối đa 3 lần. Không làm chậm.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="19" cy="18" rx="10" ry="9" fill="#311b92" stroke="#12005e" stroke-width="1.2"/><ellipse cx="30" cy="18" rx="4.5" ry="6" fill="#6a1b9a"/><path d="M31 19 Q34 27 30 29 Q27 27 29 19 Z" fill="#d500f9"/><circle cx="17" cy="14" r="2" fill="#00e5ff"/><path d="M18 27 Q19 36 21 41" stroke="#311b92" stroke-width="3" fill="none"/></svg>`
  },
  potato_mine: {
    id: 'potato_mine',
    name: 'Mìn Khoai Tây (Potato Mine)',
    group: 'Cạm Bẫy Nổ',
    cost: 50,
    dmg: '2700 DMG (Nổ 3x3 ô)',
    rate: 'Kích nổ khi dẫm',
    cooldown: '25.0s',
    hp: '300 HP',
    desc: 'Cần 5 giây nhô lên mặt đất. Nếu bị zombie ăn trước khi nhô lên sẽ bị mất! Khi đã kích hoạt, dẫm phải sẽ nổ tung 2700 sát thương lan 3x3 ô: SPUDOW! 💥',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><ellipse cx="22" cy="27" rx="14" ry="11" fill="#795548" stroke="#3e2723" stroke-width="1.5"/><ellipse cx="22" cy="26" rx="12" ry="9" fill="#a1887f"/><ellipse cx="17" cy="25" rx="2.5" ry="3.5" fill="#fff"/><circle cx="17" cy="25" r="1.3" fill="#000"/><ellipse cx="27" cy="25" rx="2.5" ry="3.5" fill="#fff"/><circle cx="27" cy="25" r="1.3" fill="#000"/><line x1="22" y1="17" x2="22" y2="9" stroke="#3e2723" stroke-width="2.5"/><circle cx="22" cy="7" r="3.5" fill="#ff1744" stroke="#d50000" stroke-width="1"/></svg>`
  },
  hypno_shroom: {
    id: 'hypno_shroom',
    name: 'Nấm Thôi Miên (Hypno-shroom)',
    group: 'Thôi Miên Đơn Mục Tiêu',
    cost: 100,
    dmg: 'Thôi miên kẻ địch',
    rate: 'Tác dụng khi bị ăn',
    cooldown: '20.0s',
    hp: '50 HP',
    desc: 'Khi zombie cắn phải nấm thôi miên, chúng sẽ quay lưng lại và chiến đấu hết mình cho bạn, bảo vệ các cây và tấn công lại chính đồng bọn zombie!',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><rect x="19" y="24" width="6" height="12" rx="2" fill="#e1bee7" stroke="#4a148c" stroke-width="1.2"/><path d="M10 24 C10 11 34 11 34 24 Z" fill="#aa00ff" stroke="#4a148c" stroke-width="1.5"/><circle cx="16" cy="18" r="2.2" fill="#00e5ff"/><circle cx="28" cy="18" r="2.2" fill="#00e5ff"/><circle cx="22" cy="14" r="2.2" fill="#ffeb3b"/><circle cx="19" cy="28" r="1.5" fill="#d500f9"/><circle cx="25" cy="28" r="1.5" fill="#d500f9"/></svg>`
  },
  magnet_shroom: {
    id: 'magnet_shroom',
    name: 'Nấm Nam Châm (Magnet-shroom)',
    group: 'Hút Kim Loại',
    cost: 100,
    dmg: 'Hút giáp sắt',
    rate: '10s / lần',
    cooldown: '15.0s',
    hp: '300 HP',
    desc: 'Hút nón sắt, thùng sắt của zombie. Đặc biệt, Zombot Dark Dragon luôn ưu tiên nhắm cầu lửa vào Nấm Nam Châm trên sân!',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><rect x="18" y="26" width="8" height="12" rx="2" fill="#78909c" stroke="#37474f" stroke-width="1.2"/><path d="M14 26 C14 12 30 12 30 26 L26 26 C26 16 18 16 18 26 Z" fill="#b0bec5" stroke="#37474f" stroke-width="1.5"/><rect x="12" y="24" width="6" height="4" fill="#e53935"/><rect x="26" y="24" width="6" height="4" fill="#1e88e5"/><circle cx="19" cy="30" r="1.5" fill="#000"/><circle cx="25" cy="30" r="1.5" fill="#000"/></svg>`
  },
  galio: {
    id: 'galio',
    name: 'Galio',
    group: 'Cận Chiến & Khống Chế',
    cost: 200,
    dmg: '50 (0.5s) · Sóng 500 (5s) · Chết 1500',
    rate: '0.5s / đấm · 5s đánh / sóng',
    cooldown: '20.0s',
    hp: '250 HP',
    desc: 'Đánh cơ bản 50 DMG/0.5s trong 2 ô tính từ bản thân. Skill 1: tích đủ 5s khi tấn công zombie sẽ bắn sóng năng lượng gây 500 DMG lên zombie đầu tiên dính chiêu. Skill 2: khi chết dừng thời gian 1s, hút 5 zombie gần nhà nhất về ô Galio và gây 1500 DMG.',
    svg: `<svg viewBox="0 0 44 44" width="100%" height="100%"><polygon points="8,18 15,12 16,24" fill="#ffd54f" stroke="#8d6e63" stroke-width="1"/><polygon points="36,18 29,12 28,24" fill="#ffd54f" stroke="#8d6e63" stroke-width="1"/><rect x="14" y="12" width="16" height="22" rx="5" fill="#eceff1" stroke="#b0bec5" stroke-width="1.4"/><circle cx="22" cy="22" r="4" fill="#00e5ff"/></svg>`
  }
};

const ZOMBIE_PREVIEW_INFO = {
  basic: {
    name: 'Zombie Cơ Bản',
    avatar: '🧟',
    hpText: 'HP: 200 · Tốc độ: 5.0s/ô',
    desc: 'Kẻ thù tiêu chuẩn không giáp. Dễ dàng bị tiêu diệt bởi 10 phát đậu.'
  },
  conehead: {
    name: 'Zombie Nón Giao Thông',
    avatar: '🪖',
    hpText: 'HP: 560 (370 Giáp Nón + 190 Máu)',
    desc: 'Đội nón giao thông chịu đòn cực tốt, tăng gấp 2.8 lần máu cơ bản!'
  },
  buckethead: {
    name: 'Zombie Thùng Sắt (Buckethead)',
    avatar: '🪣',
    hpText: 'HP: 1290 (1100 Giáp Thép + 190 Máu)',
    desc: 'Bọc thép siêu kiên cố! Cần Repeater hoặc Bom Cherry để phá hủy.'
  },
  pole_vaulting: {
    name: 'Zombie Cầm Sào (Pole Vaulting)',
    avatar: '🏃',
    hpText: 'HP: 500 · Tốc độ nhảy nhanh 2.5s/ô',
    desc: 'Cầm sào phóng qua cây đầu tiên trên hàng! Dùng Wall-nut làm mồi nhử.'
  },
  tombstone: {
    name: 'Bia Mộ Cổ (Tombstone)',
    avatar: '🪦',
    hpText: 'HP: 500 (Vật cản chặn đạn thẳng)',
    desc: 'Chắn đứng mọi hạt đậu bắn thẳng! Nên mang Bắp Cải / Dưa Hấu ném cầu vồng.'
  },
  gargantuar: {
    name: 'BOSS KHỔNG LỒ GARGANTUAR',
    avatar: '👹',
    hpText: 'HP: 3000 · Kháng đẩy lùi 100%',
    desc: 'Đập 1 chày tiêu diệt ngay bất kỳ cây nào! Khi còn nửa máu sẽ ném Imp vào sâu phòng tuyến!',
    boss: true
  },
  imp: {
    name: 'Quỷ Lùn Imp',
    avatar: '🦹',
    hpText: 'HP: 100 · Tốc độ chạy 2.5s/ô',
    desc: 'Bị Gargantuar ném vào sâu phòng tuyến, chạy nhanh và cắn phá cây hậu phương.'
  },
  turquoise_skull: {
    name: 'Zombie Đầu Lâu Ngọc (Turquoise Skull)',
    avatar: '💀',
    hpText: 'HP: 900 · Sát thương Laser: 4000',
    desc: 'Tích tụ sức mạnh hắc ám từ đầu lâu ngọc trong 5s rồi bắn tia laser hủy diệt thiêu rụi cây phòng thủ!'
  },
  jurassic_bully: {
    name: 'Kẻ Bắt Nạt Tiền Sử (Jurassic Bully)',
    avatar: '🦣',
    hpText: 'HP: 2400 · Miễn nhiễm đẩy lùi',
    desc: 'Thể hình hộ pháp có thể chịu đựng được mọi đòn tấn công.'
  },
  zombot_dark_dragon: {
    name: 'TRÙM ZOMBOT DARK DRAGON',
    avatar: '🐲',
    hpText: 'HP: 27.000 · Hitbox 2 Hàng',
    desc: 'Trùm Rồng Cơ Giới Dark Ages: Gầm triệu hồi lính trồi từ mặt đất, Nhổ cầu lửa ấp nở Imp Dragon & thiêu đất 10s, Khạc lửa càn quét 2 hàng (dùng Plant Food để ngắt đòn)!',
    boss: true
  },
  imp_dragon: {
    name: 'Imp Dragon Zombie',
    avatar: '🦎',
    hpText: 'HP: 190 · Tốc độ 2.8s/ô · Kháng Lửa',
    desc: 'Ấp nở từ cầu lửa của rồng. Miễn nhiễm với sát thương lửa và chạy rất nhanh.'
  },
  lang_khach: {
    name: 'Lãng Khách Zombie (Yasuo)',
    avatar: '🌪️',
    hpText: 'HP: 600 · Tốc độ Trung Bình · 50 DMG/nhát',
    desc: 'Đội nón lá rách, tóc bạc che mắt, cầm kiếm xương và có lá phong xoay dưới chân. Skill 1: Cách cây 3 ô lướt xuyên qua gây 100 DMG (gặp cây ô sau phải giết mới lướt tiếp). Skill 2: Dưới 50% HP bất tử 3s. Skill 3: Lướt 3 lần bắn lốc xoáy 1800 DMG lên 2 ô trước mặt!'
  }
};

class Game {
  constructor() {
    this.initPlantKeys();

    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new GameRenderer(this.canvas);
    this.inputHandler = new InputHandler(this.canvas, this);

    this.sunTargetPos = { x: 50, y: 30 };

    this.currentLevel = 1;
    this.pendingLevel = 1;
    this.unlockedLevel = 5; // Mở khóa tất cả các map
    this.completedLevels = [];
    this.isSandbox = false;
    this.sandboxNoCooldown = false;

    // Đội hình 7 cây đã chọn vào trận (Mặc định 7 cây chuẩn PvZ cân bằng)
    this.selectedDeck = ['sunflower', 'peashooter', 'snow_pea', 'wall_nut', 'cabbage_pult', 'repeater', 'cherry_bomb'];
    this.currentShowcasePlantKey = 'peashooter';

    // Chế độ chơi: 'normal' hoặc 'conveyor'
    this.gameMode = 'normal';
    this.conveyorSystem = (typeof ConveyorBelt !== 'undefined') ? new ConveyorBelt(CONFIG.conveyor) : null;

    this.floatingTexts = [];
    this.audio = typeof AudioSystem !== 'undefined' ? new AudioSystem() : null;

    // Tải tiến trình người chơi (màn đã mở khóa, màn đã hoàn thành, bộ cây đã chọn) từ localStorage
    this.loadProgress();

    this.initDOM();
    this.reset();
    this.lastTimestamp = 0;
    this.animationFrameId = null;

    // Bắt đầu vòng lặp game
    this.start();

    // Mở màn hình Main Menu ban đầu
    this.showMainMenu();
  }

  initPlantKeys() {
    this.plantKeys = [
      'sunflower',
      'peashooter',
      'snow_pea',
      'repeater',
      'wall_nut',
      'potato_mine',
      'hypno_shroom',
      'cabbage_pult',
      'melon_pult',
      'bonk_choy',
      'snapdragon',
      'chomper',
      'cherry_bomb',
      'lightning_reed',
      'stunion',
      'infi_nut',
      'sun_shroom',
      'goo_peashooter',
      'magnet_shroom',
      'galio'
    ];
  }

  initDOM() {
    this.sunCountEl = document.getElementById('sun-count');
    this.shovelBtn = document.getElementById('shovel-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.speedBtnEl = document.getElementById('speed-btn');
    this.speedLabelEl = document.getElementById('speed-label');
    this.progressBarEl = document.getElementById('wave-progress-bar');
    this.zombieHeadBadgeEl = document.getElementById('zombie-head-badge');
    this.levelBadgeEl = document.getElementById('level-badge');

    // Các phần tử HUD Wave Meter & Boss HP Task Bar
    this.waveMeterEl = document.getElementById('wave-meter');
    this.flagIconEl = document.getElementById('wave-flag-icon');
    this.bossHpLabelEl = document.getElementById('boss-hp-label');
    this.seedBankEl = document.getElementById('seed-bank');
    this.sunBankEl = document.getElementById('sun-bank');
    this.hudLeftEl = document.getElementById('hud-left');
    this.defaultFlagSvg = this.flagIconEl ? this.flagIconEl.innerHTML : '';
    this.defaultZombieHeadSvg = this.zombieHeadBadgeEl ? this.zombieHeadBadgeEl.innerHTML : '';

    // Modals
    this.dialogOverlay = document.getElementById('dialog-overlay');
    this.dialogTitle = document.getElementById('dialog-title');
    this.dialogMessage = document.getElementById('dialog-message');
    this.dialogRestartBtn = document.getElementById('dialog-restart-btn');
    this.dialogNextBtn = document.getElementById('dialog-next-btn');
    this.dialogMapBtn = document.getElementById('dialog-map-btn');

    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.worldMapOverlay = document.getElementById('world-map-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.pauseBtn = document.getElementById('pause-btn');
    this.pauseIcon = document.getElementById('pause-icon');

    // Choose Your Seeds modal elements
    this.seedSelectionOverlay = document.getElementById('seed-selection-overlay');
    this.selectedDeckSlotsEl = document.getElementById('selected-deck-slots');
    this.seedSelectionPoolEl = document.getElementById('seed-selection-pool');
    this.upcomingZombiesListEl = document.getElementById('upcoming-zombies-list');
    this.tacticalTipContentEl = document.getElementById('tactical-tip-content');
    this.deckCounterValueEl = document.getElementById('deck-counter-value');
    this.seedSelectLevelTitleEl = document.getElementById('seed-select-level-title');
    this.seedSelectLevelSubEl = document.getElementById('seed-select-level-sub');
    this.btnAutoPickDeck = document.getElementById('btn-auto-pick-deck');
    this.btnClearDeck = document.getElementById('btn-clear-deck');
    this.btnBackToMapFromSeeds = document.getElementById('btn-back-to-map-from-seeds');
    this.btnLetsRock = document.getElementById('btn-lets-rock');
    this.showcaseToggleBtn = document.getElementById('showcase-toggle-btn');

    if (this.btnAutoPickDeck) {
      this.btnAutoPickDeck.addEventListener('click', () => this.autoPickDeck());
    }
    if (this.btnClearDeck) {
      this.btnClearDeck.addEventListener('click', () => this.clearDeck());
    }
    if (this.btnBackToMapFromSeeds) {
      this.btnBackToMapFromSeeds.addEventListener('click', () => {
        if (this.seedSelectionOverlay) this.seedSelectionOverlay.classList.add('hidden');
        this.showWorldMap();
      });
    }
    if (this.btnLetsRock) {
      this.btnLetsRock.addEventListener('click', () => this.startBattleWithDeck());
    }
    if (this.showcaseToggleBtn) {
      this.showcaseToggleBtn.addEventListener('click', () => {
        if (this.currentShowcasePlantKey) {
          this.togglePlantInDeck(this.currentShowcasePlantKey);
        }
      });
    }

    // Nút Tạm Dừng / Tiếp Tục
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => this.togglePause());
    }
    const pauseResumeBtn = document.getElementById('pause-resume-btn');
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener('click', () => this.togglePause());
    }
    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
        this.setPaused(false);
        this.reset();
      });
    }
    const pauseMapBtn = document.getElementById('pause-map-btn');
    if (pauseMapBtn) {
      pauseMapBtn.addEventListener('click', () => {
        if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
        this.setPaused(false);
        this.showWorldMap();
      });
    }

    // Nút điều chỉnh tốc độ gameplay (1X / 2X)
    if (this.speedBtnEl) {
      this.speedBtnEl.addEventListener('click', () => this.toggleSpeed());
    }

    // Nút Bật / Tắt Âm Thanh
    this.audioBtn = document.getElementById('audio-btn');
    this.audioIcon = document.getElementById('audio-icon');
    if (this.audioBtn) {
      this.updateAudioButtonUI();
      this.audioBtn.addEventListener('click', () => this.toggleAudio());
    }

    // Khởi tạo hệ thống Từ Điển Cây & Zombie (Almanac)
    this.initAlmanac();

    // Đồng bộ hóa toàn bộ icon cây từ GameRenderer (khay dọc, chọn cây, showcase, almanac)
    this.syncUnifiedPlantIcons();

    // Đăng ký toàn bộ thẻ cây trong khay dọc
    this.cardElements = {};
    this.cooldownElements = {};

    this.plantKeys.forEach(key => {
      const domKey = key.replace(/_/g, '-');
      const cardEl = document.getElementById(`card-${domKey}`);
      const cooldownEl = document.getElementById(`cooldown-${domKey}`);
      if (cardEl) {
        this.cardElements[key] = cardEl;
        cardEl.addEventListener('click', () => this.selectCard(key));
      }
      if (cooldownEl) {
        this.cooldownElements[key] = cooldownEl;
      }
    });

    // Nút xẻng
    if (this.shovelBtn) {
      this.shovelBtn.addEventListener('click', () => {
        this.clearSelection();
        this.setShovel(!this.isShovelActive);
      });
    }

    // Nút Plant Food (PvZ 2 Lá Xanh Siêu Kỹ Năng)
    this.plantFoodBtn = document.getElementById('plant-food-btn');
    this.plantFoodCountEl = document.getElementById('plant-food-count');
    if (this.plantFoodBtn) {
      this.plantFoodBtn.addEventListener('click', () => {
        this.togglePlantFood();
      });
    }

    // Nút chơi lại
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.reset());
    }

    if (this.dialogRestartBtn) {
      this.dialogRestartBtn.addEventListener('click', () => {
        this.dialogOverlay.classList.add('hidden');
        this.reset();
      });
    }

    if (this.dialogNextBtn) {
      this.dialogNextBtn.addEventListener('click', () => {
        this.dialogOverlay.classList.add('hidden');
        if (this.currentLevel < 6) {
          this.openSeedSelection(this.currentLevel + 1);
        } else {
          this.showWorldMap();
        }
      });
    }

    if (this.dialogMapBtn) {
      this.dialogMapBtn.addEventListener('click', () => {
        this.dialogOverlay.classList.add('hidden');
        this.showWorldMap();
      });
    }

    // Menu chính & World Map buttons
    const btnStartGame = document.getElementById('btn-start-game');
    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => this.showWorldMap());
    }

    const btnSandboxMode = document.getElementById('btn-sandbox-mode');
    if (btnSandboxMode) {
      btnSandboxMode.addEventListener('click', () => this.startSandbox());
    }

    const btnPlayUnlockedLevel = document.getElementById('btn-play-unlocked-level');
    if (btnPlayUnlockedLevel) {
      btnPlayUnlockedLevel.addEventListener('click', () => {
        this.openSeedSelection(this.unlockedLevel || 1);
      });
    }

    const btnBackToMenu = document.getElementById('btn-back-to-menu');
    if (btnBackToMenu) {
      btnBackToMenu.addEventListener('click', () => this.showMainMenu());
    }

    const btnResetProgress = document.getElementById('btn-reset-progress');
    if (btnResetProgress) {
      btnResetProgress.addEventListener('click', () => {
        if (confirm('Bạn có chắc chắn muốn đặt lại tiến trình mở khóa màn chơi về Cấp 1 không?')) {
          this.resetProgress();
        }
      });
    }

    const btnMapFromHUD = document.getElementById('map-btn');
    if (btnMapFromHUD) {
      btnMapFromHUD.addEventListener('click', () => this.showWorldMap());
    }

    // Gắn sự kiện chọn các Level trên World Map -> Mở màn hình Chọn Cây (Mở khóa toàn bộ theo yêu cầu người dùng)
    for (let lv = 1; lv <= 6; lv++) {
      const lvBtn = document.getElementById(`level-btn-${lv}`);
      if (lvBtn) {
        lvBtn.addEventListener('click', () => {
          this.openSeedSelection(lv);
        });
      }
    }

    const stabilizeTime = () => {
      this.lastTimestamp = performance.now();
    };
    document.addEventListener('visibilitychange', stabilizeTime);
    window.addEventListener('blur', stabilizeTime);
    window.addEventListener('focus', stabilizeTime);
  }

  // ==========================================================================
  // HỆ THỐNG CHỌN CÂY VÀO TRẬN (CHOOSE YOUR SEEDS - PvZ 2 AUTHENTIC)
  // ==========================================================================
  openSeedSelection(levelNumber) {
    this.pendingLevel = levelNumber;
    this.isPaused = true;
    if (this.audio) this.audio.playBGM('menu');

    // Ẩn các overlay khác
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.add('hidden');
    if (this.worldMapOverlay) this.worldMapOverlay.classList.add('hidden');
    if (this.dialogOverlay) this.dialogOverlay.classList.add('hidden');
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');

    const lvlNames = {
      1: { title: 'CẤP 1: SÂN CỎ MA ÁM', sub: 'Làm quen với chiến trường nghĩa địa ban đêm' },
      2: { title: 'CẤP 2: BIA MỘ & NÓN SẮT', sub: 'Thêm Zombie Nón Sắt & Bia Mộ cản đạn thẳng' },
      3: { title: 'CẤP 3: BINH ĐOÀN THÙNG SẮT', sub: 'Thêm Buckethead Zombie siêu trâu bò, số lượng x1.5' },
      4: { title: 'CẤP 4: VŨ ĐIỆU NHẢY SÀO', sub: 'Thêm Pole Vaulting Zombie bật nhảy qua cây đầu tiên' },
      5: { title: 'CẤP 5: ĐẠI CHIẾN BOSS GARGANTUAR', sub: 'Trùm Khổng Lồ 3000 HP 1-hit đập nát cây & ném Imp' },
      6: { title: 'CẤP 6: TRÙM ZOMBOT DARK DRAGON', sub: 'HỆ THỐNG BĂNG CHUYỀN (CONVEYOR BELT) · 27.000 HP' }
    };

    const info = lvlNames[levelNumber] || { title: `CẤP ${levelNumber}`, sub: 'Chọn 7 loại cây vào đội hình' };
    if (this.seedSelectLevelTitleEl) this.seedSelectLevelTitleEl.textContent = info.title;
    if (this.seedSelectLevelSubEl) this.seedSelectLevelSubEl.textContent = info.sub;

    // Hiển thị danh sách zombie sắp xuất hiện trong màn này
    this.renderUpcomingZombies(levelNumber);

    // Hiển thị khay 7 cây đã chọn
    this.renderDeckSlots();

    // Hiển thị kho 16 cây để người chơi chọn
    this.renderSelectionPool();

    // Hiển thị thông số chi tiết của cây mẫu
    this.updateShowcase(this.currentShowcasePlantKey || 'peashooter');

    // Mở Modal
    if (this.seedSelectionOverlay) {
      this.seedSelectionOverlay.classList.remove('hidden');
    }
  }

  renderUpcomingZombies(levelNumber) {
    if (!this.upcomingZombiesListEl) return;
    this.upcomingZombiesListEl.innerHTML = '';

    const lvlZombies = {
      1: ['basic'],
      2: ['basic', 'conehead', 'tombstone'],
      3: ['basic', 'conehead', 'buckethead', 'tombstone'],
      4: ['basic', 'conehead', 'buckethead', 'lang_khach', 'pole_vaulting', 'tombstone'],
      5: ['gargantuar', 'lang_khach', 'imp', 'buckethead', 'pole_vaulting', 'conehead', 'basic', 'tombstone'],
      6: ['zombot_dark_dragon', 'gargantuar', 'lang_khach', 'imp_dragon', 'buckethead', 'conehead', 'basic', 'tombstone']
    };

    const tips = {
      1: 'Trồng 1-2 hàng Hướng Dương để bảo đảm kinh tế. Dùng Peashooter tiêu diệt Zombie từ xa.',
      2: 'Bia Mộ cản đạn thẳng! Hãy mang Cabbage-pult hoặc Melon-pult để ném cầu vồng vượt Bia Mộ.',
      3: 'Zombie Thùng Sắt cực trâu (1100 giáp)! Dùng Repeater tăng gấp đôi DPS hoặc Cherry Bomb nổ tan xác.',
      4: 'Zombie Cầm Sào sẽ nhảy qua cây đầu tiên! Đặt Wall-nut ở hàng ngoài cùng làm mồi nhử cản bước nhảy.',
      5: 'ĐẠI CHIẾN BOSS GARGANTUAR (3000 HP)! Hắn đập 1-hit chết cây. Dùng Snow Pea làm chậm, Melon-pult và Cherry Bomb liên tục!',
      6: 'ĐẠI CHIẾN ZOMBOT DARK DRAGON (27.000 HP) - CHẾ ĐỘ BĂNG CHUYỀN (CONVEYOR BELT)! Cây và lá Plant Food tự động chạy ra từ băng chuyền bên trái, kéo thả trực tiếp lên sân không tốn Mặt Trời! Khi rồng hít thở chuẩn bị khạc lửa, DÙNG PLANT FOOD LÊN BẤT KỲ CÂY NÀO ĐỂ NGẮT ĐÒN!'
    };

    const zombies = lvlZombies[levelNumber] || ['basic'];
    zombies.forEach(zKey => {
      const zInfo = ZOMBIE_PREVIEW_INFO[zKey];
      if (!zInfo) return;

      const item = document.createElement('div');
      item.className = `upcoming-zombie-item ${zInfo.boss ? 'boss-threat' : ''}`;
      item.innerHTML = `
        <div class="zombie-preview-avatar">${zInfo.avatar}</div>
        <div class="zombie-preview-details">
          <div class="zombie-preview-name">${zInfo.name}</div>
          <div class="zombie-preview-stats">${zInfo.hpText}</div>
          <div class="zombie-preview-desc">${zInfo.desc}</div>
        </div>
      `;
      this.upcomingZombiesListEl.appendChild(item);
    });

    if (this.tacticalTipContentEl) {
      this.tacticalTipContentEl.textContent = tips[levelNumber] || 'Bảo vệ phòng tuyến vững chắc!';
    }
  }

  renderDeckSlots() {
    if (!this.selectedDeckSlotsEl) return;
    this.selectedDeckSlotsEl.innerHTML = '';

    const maxSlots = 7;
    for (let i = 0; i < maxSlots; i++) {
      const plantKey = this.selectedDeck[i];
      const slot = document.createElement('div');

      if (plantKey && PLANT_SHOWCASE_DATA[plantKey]) {
        const pData = PLANT_SHOWCASE_DATA[plantKey];
        slot.className = 'deck-slot filled';
        slot.title = `${pData.name} (Bấm để gỡ khỏi đội)`;
        slot.innerHTML = `
          <div style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            ${pData.svg}
          </div>
          <div style="position: absolute; bottom: 2px; right: 4px; font-size: 9px; font-weight: 900; color: #ff8a80;">
            ${pData.cost}
          </div>
          <div class="deck-slot-remove" title="Xóa cây này">✕</div>
        `;
        slot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removePlantFromDeck(plantKey);
        });
      } else {
        slot.className = 'deck-slot empty-slot';
        slot.innerHTML = `<span>+ Ô ${i + 1}</span>`;
      }

      this.selectedDeckSlotsEl.appendChild(slot);
    }

    if (this.deckCounterValueEl) {
      this.deckCounterValueEl.textContent = `${this.selectedDeck.length} / ${maxSlots}`;
      this.deckCounterValueEl.style.color = this.selectedDeck.length === maxSlots ? '#69f0ae' : '#ffd54f';
    }
  }

  renderSelectionPool() {
    if (!this.seedSelectionPoolEl) return;
    this.seedSelectionPoolEl.innerHTML = '';

    this.plantKeys.forEach(pKey => {
      const pData = PLANT_SHOWCASE_DATA[pKey];
      if (!pData) return;

      const card = document.createElement('div');
      const inDeck = this.selectedDeck.includes(pKey);
      const isPreview = this.currentShowcasePlantKey === pKey;

      card.className = `pool-card ${inDeck ? 'in-deck' : ''} ${isPreview ? 'active-preview' : ''}`;
      card.title = `${pData.name} (${pData.cost} Sun)`;

      card.innerHTML = `
        ${inDeck ? '<div class="pool-card-check">✓</div>' : ''}
        <div class="pool-card-icon">${pData.svg}</div>
        <div class="pool-card-cost">${pData.cost}</div>
      `;

      card.addEventListener('click', () => {
        this.updateShowcase(pKey);
        this.togglePlantInDeck(pKey);
      });

      this.seedSelectionPoolEl.appendChild(card);
    });
  }

  updateShowcase(plantKey) {
    this.currentShowcasePlantKey = plantKey;
    const pData = PLANT_SHOWCASE_DATA[plantKey] || PLANT_SHOWCASE_DATA['peashooter'];
    if (!pData) return;

    const iconBox = document.getElementById('showcase-icon');
    const nameEl = document.getElementById('showcase-name');
    const costEl = document.getElementById('showcase-cost');
    const groupEl = document.getElementById('showcase-group');
    const descEl = document.getElementById('showcase-desc');
    const dmgEl = document.getElementById('showcase-dmg');
    const rateEl = document.getElementById('showcase-rate');
    const cooldownEl = document.getElementById('showcase-cooldown');
    const hpEl = document.getElementById('showcase-hp');

    if (iconBox) iconBox.innerHTML = pData.svg;
    if (nameEl) nameEl.textContent = pData.name;
    if (costEl) costEl.textContent = `☀️ ${pData.cost}`;
    if (groupEl) groupEl.textContent = pData.group;
    if (descEl) descEl.textContent = pData.desc;
    if (dmgEl) dmgEl.textContent = `💥 ${pData.dmg}`;
    if (rateEl) rateEl.textContent = `⚡ ${pData.rate}`;
    if (cooldownEl) cooldownEl.textContent = `⏱️ Hồi: ${pData.cooldown}`;
    if (hpEl) hpEl.textContent = `🛡️ ${pData.hp}`;

    const inDeck = this.selectedDeck.includes(plantKey);
    if (this.showcaseToggleBtn) {
      this.showcaseToggleBtn.classList.toggle('in-deck', inDeck);
      this.showcaseToggleBtn.innerHTML = inDeck 
        ? '<span>✕ Bỏ Khỏi Đội</span>' 
        : '<span>➕ Thêm Vào Đội</span>';
    }

    // Highlight card đang preview trong pool
    const poolCards = document.querySelectorAll('.pool-card');
    this.plantKeys.forEach((key, idx) => {
      if (poolCards[idx]) {
        poolCards[idx].classList.toggle('active-preview', key === plantKey);
      }
    });
  }

  togglePlantInDeck(plantKey) {
    const idx = this.selectedDeck.indexOf(plantKey);
    if (idx !== -1) {
      this.selectedDeck.splice(idx, 1);
    } else {
      if (this.selectedDeck.length >= 7) {
        // Nếu đã đủ 7 cây, thay thế cây cuối cùng
        this.selectedDeck.pop();
      }
      this.selectedDeck.push(plantKey);
    }

    this.renderDeckSlots();
    this.renderSelectionPool();
    this.updateShowcase(plantKey);
  }

  removePlantFromDeck(plantKey) {
    const idx = this.selectedDeck.indexOf(plantKey);
    if (idx !== -1) {
      this.selectedDeck.splice(idx, 1);
      this.renderDeckSlots();
      this.renderSelectionPool();
      this.updateShowcase(this.currentShowcasePlantKey);
    }
  }

  autoPickDeck() {
    // Tự động chọn 7 cây hợp lý nhất theo meta PvZ
    this.selectedDeck = ['sunflower', 'peashooter', 'snow_pea', 'wall_nut', 'cabbage_pult', 'repeater', 'cherry_bomb'];
    this.renderDeckSlots();
    this.renderSelectionPool();
    this.updateShowcase(this.currentShowcasePlantKey);
  }

  clearDeck() {
    this.selectedDeck = [];
    this.renderDeckSlots();
    this.renderSelectionPool();
    this.updateShowcase(this.currentShowcasePlantKey);
  }

  startBattleWithDeck() {
    if (this.selectedDeck.length === 0) {
      this.autoPickDeck();
    }

    // Lưu bộ bài 7 cây yêu thích vào localStorage để ghi nhớ qua các phiên chơi
    try {
      localStorage.setItem('pvz_selected_deck', JSON.stringify(this.selectedDeck));
    } catch (e) {
      console.warn('Lỗi lưu selectedDeck:', e);
    }

    if (this.seedSelectionOverlay) {
      this.seedSelectionOverlay.classList.add('hidden');
    }

    this.startLevel(this.pendingLevel || 1);
  }

  // ==========================================================================
  // HỆ THỐNG LƯU TRỮ VÀ KHÔI PHỤC TIẾN TRÌNH (LOCALSTORAGE PERSISTENCE)
  // ==========================================================================
  loadProgress() {
    try {
      // 1. Cấp độ cao nhất đã mở khóa (Mở khóa toàn bộ 6/6 map theo yêu cầu)
      const savedLevel = localStorage.getItem('pvz_unlocked_level');
      const parsedLevel = parseInt(savedLevel, 10);
      if (!isNaN(parsedLevel) && parsedLevel >= 1 && parsedLevel <= 6) {
        this.unlockedLevel = Math.max(parsedLevel, 6); // Đảm bảo luôn mở khóa hết cả 6 map
      } else {
        this.unlockedLevel = 6;
      }

      // 2. Danh sách các màn đã vượt qua (chiến thắng)
      const savedCompleted = localStorage.getItem('pvz_completed_levels');
      if (savedCompleted) {
        try {
          const list = JSON.parse(savedCompleted);
          if (Array.isArray(list)) {
            this.completedLevels = list.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 6);
          } else {
            this.completedLevels = [];
          }
        } catch {
          this.completedLevels = [];
        }
      } else {
        // Tự động suy luận các màn đã qua trước đó nếu chỉ có unlockedLevel
        this.completedLevels = [];
        for (let lv = 1; lv < this.unlockedLevel; lv++) {
          this.completedLevels.push(lv);
        }
      }

      // 3. Bộ bài 7 cây yêu thích đã chọn
      const savedDeck = localStorage.getItem('pvz_selected_deck');
      if (savedDeck) {
        try {
          const deck = JSON.parse(savedDeck);
          if (Array.isArray(deck) && deck.length === 7 && deck.every(k => this.plantKeys.includes(k))) {
            this.selectedDeck = deck;
          }
        } catch {}
      }

      console.log(`[PvZ Progress] Đã tải tiến trình: Đã mở Cấp ${this.unlockedLevel}, Đã vượt qua: [${this.completedLevels.join(', ')}]`);
    } catch (err) {
      console.warn('Lỗi đọc localStorage:', err);
      this.unlockedLevel = 6;
      this.completedLevels = [];
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('pvz_unlocked_level', this.unlockedLevel.toString());
      localStorage.setItem('pvz_completed_levels', JSON.stringify(this.completedLevels || []));
      if (this.selectedDeck && this.selectedDeck.length === 7) {
        localStorage.setItem('pvz_selected_deck', JSON.stringify(this.selectedDeck));
      }
      console.log(`[PvZ Progress] Đã lưu tiến trình thành công vào localStorage: Cấp ${this.unlockedLevel}`);
    } catch (err) {
      console.warn('Lỗi ghi localStorage:', err);
    }
  }

  resetProgress() {
    try {
      this.unlockedLevel = 6; // Luôn mở khóa tất cả các map
      this.completedLevels = [];
      localStorage.setItem('pvz_unlocked_level', '6');
      localStorage.setItem('pvz_completed_levels', JSON.stringify([]));
      this.updateWorldMapUI();
      alert('Đã xóa lịch sử hoàn thành màn chơi (Các map vẫn luôn mở sẵn)!');
    } catch (err) {
      console.warn('Lỗi reset tiến trình:', err);
    }
  }

  renderInGameSeedBank() {
    // Ẩn/Hiện thẻ cây trong khay hạt giống dọc theo đội hình đã chọn (hoặc tất cả nếu Sandbox)
    this.plantKeys.forEach(key => {
      const cardEl = this.cardElements[key];
      if (cardEl) {
        if (this.isSandbox) {
          cardEl.style.display = 'flex';
        } else {
          const isChosen = this.selectedDeck.includes(key);
          cardEl.style.display = isChosen ? 'flex' : 'none';
        }
      }
    });
  }

  showMainMenu() {
    this.isPaused = true;
    if (this.audio) this.audio.playBGM('menu');
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.remove('hidden');
    if (this.worldMapOverlay) this.worldMapOverlay.classList.add('hidden');
    if (this.seedSelectionOverlay) this.seedSelectionOverlay.classList.add('hidden');
  }

  showWorldMap() {
    this.isPaused = true;
    if (this.audio) this.audio.playBGM('menu');
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.add('hidden');
    if (this.worldMapOverlay) this.worldMapOverlay.classList.remove('hidden');
    if (this.seedSelectionOverlay) this.seedSelectionOverlay.classList.add('hidden');
    this.updateWorldMapUI();
  }

  updateWorldMapUI() {
    const playUnlockedBtn = document.getElementById('btn-play-unlocked-level');
    if (playUnlockedBtn) {
      const lvlTitles = {
        1: 'CẤP 1 (SÂN CỎ MA ÁM)',
        2: 'CẤP 2 (BIA MỘ CỔ TÍCH)',
        3: 'CẤP 3 (BỌC THÉP CÀN QUÉT)',
        4: 'CẤP 4 (BẬT NHẢY TỬ THẦN)',
        5: 'CẤP 5 (TRÙM GARGANTUAR)',
        6: 'CẤP 6 (TRÙM ZOMBOT DARK DRAGON)'
      };
      const isAllBeaten = this.completedLevels && this.completedLevels.includes(6);
      if (isAllBeaten) {
        playUnlockedBtn.innerHTML = `<span>👑 ĐẠI CHIẾN CẤP 6 (ĐÃ TIÊU DIỆT RỒNG TỐI THƯỢNG)</span>`;
      } else {
        playUnlockedBtn.innerHTML = `<span>▶ VÀO TRẬN ${lvlTitles[this.unlockedLevel] || ('CẤP ' + this.unlockedLevel)}</span>`;
      }
    }

    for (let lv = 1; lv <= 6; lv++) {
      const lvBtn = document.getElementById(`level-btn-${lv}`);
      const lockBadge = document.getElementById(`lock-badge-${lv}`);
      if (lvBtn) {
        const isCompleted = this.completedLevels && this.completedLevels.includes(lv);
        const isUnlocked = lv <= (this.unlockedLevel || 6);
        lvBtn.classList.toggle('locked', !isUnlocked);
        lvBtn.classList.toggle('unlocked', isUnlocked);
        lvBtn.classList.toggle('completed', isCompleted);
        if (lockBadge) {
          if (isCompleted) {
            lockBadge.textContent = '⭐ ĐÃ QUA MÀN';
          } else if (isUnlocked) {
            lockBadge.textContent = '✅ ĐÃ MỞ';
          } else {
            lockBadge.textContent = '🔒 KHÓA';
          }
        }
      }
    }
  }

  startLevel(levelNumber) {
    this.currentLevel = levelNumber;
    this.isSandbox = false;
    this.sandboxNoCooldown = false;
    if (this.audio) {
      this.audio.playBGM(levelNumber >= 5 ? 'boss' : 'battle');
    }
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.add('hidden');
    if (this.worldMapOverlay) this.worldMapOverlay.classList.add('hidden');
    if (this.seedSelectionOverlay) this.seedSelectionOverlay.classList.add('hidden');
    const sbPanel = document.getElementById('sandbox-panel');
    if (sbPanel) sbPanel.classList.add('hidden');

    this.updateSandboxCooldownBtnUI();
    this.reset();
  }

  startSandbox() {
    this.isSandbox = true;
    this.sandboxNoCooldown = false;
    this.currentLevel = 0; // Chế độ Thử Nghiệm riêng biệt, hoàn toàn không thuộc bất kỳ Map 1-5 nào
    if (this.audio) this.audio.playBGM('battle');
    if (this.mainMenuOverlay) this.mainMenuOverlay.classList.add('hidden');
    if (this.worldMapOverlay) this.worldMapOverlay.classList.add('hidden');
    if (this.seedSelectionOverlay) this.seedSelectionOverlay.classList.add('hidden');

    const sbPanel = document.getElementById('sandbox-panel');
    if (sbPanel) sbPanel.classList.remove('hidden');

    this.updateSandboxCooldownBtnUI();
    this.reset();
  }

  toggleAudio() {
    if (!this.audio) return;
    const isMuted = this.audio.toggleMute();
    this.updateAudioButtonUI();
    if (!isMuted) {
      this.audio.playClick();
    }
  }

  updateAudioButtonUI() {
    if (!this.audio) return;
    const isMuted = this.audio.isMuted;
    if (this.audioIcon) {
      this.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    if (this.audioBtn) {
      this.audioBtn.classList.toggle('muted', isMuted);
      this.audioBtn.title = isMuted ? 'Bật âm thanh (Unmute Audio)' : 'Tắt âm thanh (Mute Audio)';
    }
  }

  setSpeed(speed) {
    this.gameSpeed = speed === 1 ? 1 : 2;
    CONFIG.GAME_SPEED = this.gameSpeed;

    if (this.speedLabelEl && this.speedBtnEl) {
      this.speedLabelEl.textContent = `${this.gameSpeed}X`;
      this.speedBtnEl.classList.toggle('speed-2x', this.gameSpeed === 2);
      this.speedBtnEl.classList.toggle('speed-1x', this.gameSpeed === 1);
    }
  }

  toggleSpeed() {
    this.setSpeed(this.gameSpeed === 2 ? 1 : 2);
  }

  setPaused(paused) {
    this.isPaused = paused;
    this.lastTimestamp = performance.now();
  }

  togglePause() {
    this.setPaused(!this.isPaused);
    if (this.audio) {
      this.audio.playClick();
      if (this.isPaused) {
        this.audio.pauseBGM();
      } else {
        this.audio.resumeBGM();
      }
    }
    if (this.pauseIcon) {
      this.pauseIcon.textContent = this.isPaused ? '▶️' : '⏸️';
    }
    if (this.pauseBtn) {
      this.pauseBtn.title = this.isPaused ? 'Tiếp tục (Resume)' : 'Tạm dừng (Pause)';
      this.pauseBtn.classList.toggle('active-paused', this.isPaused);
    }
    if (this.pauseOverlay) {
      if (this.isPaused) {
        this.pauseOverlay.classList.remove('hidden');
      } else {
        this.pauseOverlay.classList.add('hidden');
      }
    }
  }

  initSeedTabs() {
    // Không còn dùng thanh tab ngang vì đã chuyển sang khay dọc PvZ 2 và màn Chọn Cây chuyên nghiệp
  }

  reset() {
    // Sun ban đầu 50 (Sandbox: 9999)
    this.sun = this.isSandbox ? CONFIG.SANDBOX_SUN : CONFIG.INITIAL_SUN;

    this.plants = [];
    this.zombies = [];
    this.projectiles = [];
    this.suns = [];
    this.particles = [];
    this.barriers = [];
    this.lightningArcs = [];
    this.gasClouds = [];
    this.flyingImps = [];
    this.laserBeams = [];
    this.floatingTexts = [];
    this.attackEffects = []; // Hiệu ứng phạm vi & chiêu thức tấn công tầm gần
    this.scorchedTiles = []; // Các ô bị thiêu rụi không thể trồng cây trong 10s
    this.fireballs = [];     // Cầu lửa của Zombot Dark Dragon
    this.timeStopTimer = 0;  // Bộ đếm dừng thời gian (Skill 2 Galio)

    // Tốc độ mặc định khi bắt đầu luôn là ×2
    this.setSpeed(2);
    this.isPaused = false;
    if (this.pauseOverlay) this.pauseOverlay.classList.add('hidden');
    if (this.pauseIcon) this.pauseIcon.textContent = '⏸️';
    if (this.pauseBtn) this.pauseBtn.classList.remove('active-paused');

    // Khởi tạo 5 máy cắt cỏ cho 5 hàng ở mép trái
    this.lawnmowers = [];
    for (let r = 0; r < CONFIG.ROWS; r++) {
      this.lawnmowers.push(new Lawnmower(r));
    }

    this.selectedPlantType = null;
    this.isShovelActive = false;

    // Hồi chiêu tất cả các cây = 0
    this.cooldowns = {};
    for (const key of this.plantKeys) {
      this.cooldowns[key] = 0;
    }

    this.naturalSunTimer = 3.0;
    this.waveManager = new WaveManager(this.currentLevel);

    this.isGameOver = false;
    this.isVictory = false;
    this.gameTime = 0;
    this.gameDeltaTime = 0;
    this.realDeltaTime = 0;

    // Thiết lập chế độ chơi: Map 6 là Conveyor Belt (Băng chuyền)
    const lvlCfg = (typeof LEVEL_CONFIG !== 'undefined') ? LEVEL_CONFIG[this.currentLevel] : null;
    this.gameMode = (!this.isSandbox && (this.currentLevel === 6 || (lvlCfg && (lvlCfg.isConveyor || lvlCfg.gameMode === 'conveyor')))) ? 'conveyor' : 'normal';

    if (this.gameMode === 'conveyor') {
      if (this.conveyorSystem) {
        this.conveyorSystem.init();
      }
      if (this.hudLeftEl) this.hudLeftEl.style.display = 'none';
    } else {
      if (this.hudLeftEl) this.hudLeftEl.style.display = 'flex';
      if (this.seedBankEl) this.seedBankEl.style.display = 'flex';
      if (this.sunBankEl) this.sunBankEl.style.display = 'flex';
    }

    // Ẩn/hiển thị thanh tiến trình Wave: trong Sandbox không có Wave nên ẩn đi
    const waveMeter = document.getElementById('wave-meter');
    if (waveMeter) {
      waveMeter.style.display = this.isSandbox ? 'none' : 'flex';
    }

    // Sinh vật cản Bia Mộ (Tombstone) nếu Level >= 2 (Không sinh trong Sandbox)
    this.spawnInitialLevelTombstones();

    this.clearSelection();
    if (this.dialogOverlay) this.dialogOverlay.classList.add('hidden');

    if (this.levelBadgeEl) {
      if (this.isSandbox) {
        this.levelBadgeEl.textContent = '🛠️ SANDBOX';
        this.levelBadgeEl.classList.add('sandbox-mode-badge');
      } else {
        const lvlNames = {
          1: 'CẤP 1 · SÂN CỎ MA ÁM',
          2: 'CẤP 2 · BIA MỘ & NÓN SẮT',
          3: 'CẤP 3 · BINH ĐOÀN THÙNG SẮT',
          4: 'CẤP 4 · VŨ ĐIỆU NHẢY SÀO',
          5: 'CẤP 5 · TRÙM GARGANTUAR',
          6: 'CẤP 6 · ZOMBOT DARK DRAGON'
        };
        this.levelBadgeEl.textContent = lvlNames[this.currentLevel] || `CẤP ${this.currentLevel}`;
        this.levelBadgeEl.classList.remove('sandbox-mode-badge');
      }
    }

    this.renderInGameSeedBank();
    this.updateHUD();
  }

  // Sinh các Bia Mộ (Tombstone) trên sân ở Level 2-5 (Sandbox hoàn toàn không có)
  spawnInitialLevelTombstones() {
    if (this.isSandbox) return;
    const lvlCfg = LEVEL_CONFIG[this.currentLevel];
    if (!lvlCfg || !lvlCfg.hasTombstones) return;

    const count = lvlCfg.tombstoneCount || 4;
    let spawned = 0;
    let attempts = 0;

    while (spawned < count && attempts < 40) {
      attempts++;
      const row = Math.floor(Math.random() * CONFIG.ROWS);
      const col = 5 + Math.floor(Math.random() * 4); // Cột 5 - 8

      // Không đặt trùng
      const occupied = this.zombies.some(z => z.isObstacle && z.row === row && Math.abs(z.x - (CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2)) < 30);
      if (!occupied) {
        const tomb = new Zombie('tombstone', row);
        tomb.x = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
        this.zombies.push(tomb);
        spawned++;
      }
    }
  }

  start() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastTimestamp = performance.now();

    const loop = (timestamp) => {
      const rawDeltaTime = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      // X2 TỐC ĐỘ: Nút bật/tắt x2. Trong game loop dùng scaledDt = Math.min(dt * timeScale, 0.1) chống xuyên vật thể
      const isGameplayRunning = !this.isGameOver && !this.isVictory && !this.isPaused;
      const timeScale = this.gameSpeed;
      const dt = rawDeltaTime;
      const scaledDt = Math.min(dt * timeScale, 0.1);

      // Giữ đúng dòng công thức thống nhất để tương thích toàn bộ hệ thống kiểm thử tự động
      const gameDeltaTime = isGameplayRunning ? (rawDeltaTime * this.gameSpeed) : 0;
      this.realDeltaTime = rawDeltaTime;
      this.gameDeltaTime = isGameplayRunning ? scaledDt : 0;
      this.gameTime += this.gameDeltaTime;

      if (this.gameDeltaTime > 0) {
        this.update(this.gameDeltaTime);
      }

      this.renderer.render(this, this.inputHandler);

      // Tối ưu hóa hiệu năng: Điều tiết cập nhật DOM HUD (16-20 lần/giây thay vì 60 lần/giây)
      // Giúp triệt tiêu hoàn toàn hiện tượng giật lag do forced DOM layout và reflow
      this.hudTimer = (this.hudTimer || 0) + rawDeltaTime;
      if (this.hudTimer >= 0.05) {
        this.hudTimer = 0;
        this.updateHUD();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  update(dt) {
    // 0. Bộ đếm Dừng Thời Gian (Galio Skill 2)
    if (this.timeStopTimer > 0) {
      this.timeStopTimer = Math.max(0, this.timeStopTimer - dt);
    }
    const isTimeStopped = this.timeStopTimer > 0;

    // 1. Cooldown
    const zeroCooldownActive = this.isSandbox && this.sandboxNoCooldown;
    for (const key in this.cooldowns) {
      if (zeroCooldownActive) {
        this.cooldowns[key] = 0;
      } else if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
      }
    }

    // 1.5. Cập nhật Băng chuyền (Conveyor Belt)
    if (this.gameMode === 'conveyor' && this.conveyorSystem) {
      this.conveyorSystem.update(dt);
    }

    // 2. Rơi Sun tự nhiên (chỉ khi không ở chế độ conveyor và không dừng thời gian)
    if (this.gameMode !== 'conveyor' && !isTimeStopped) {
      this.naturalSunTimer += dt;
      if (this.naturalSunTimer >= CONFIG.NATURAL_SUN_INTERVAL) {
        this.naturalSunTimer = 0;
        this.spawnNaturalSun();
      }
    }

    // 3. Cập nhật cây
    for (const plant of this.plants) {
      plant.update(dt, this);
    }

    // 4. Cập nhật zombie (tạm đóng băng toàn bộ khi đang Dừng Thời Gian 1s)
    if (!isTimeStopped) {
      for (const zombie of this.zombies) {
        zombie.update(dt, this);
      }
      // 4.5. Imp đang bay
      for (const fImp of this.flyingImps) {
        fImp.update(dt, this);
      }
    } else {
      // Zombie đã chết vẫn hoàn tất hoạt ảnh tan biến trong lúc dừng thời gian
      for (const zombie of this.zombies) {
        if (!zombie.alive) {
          zombie.deathTimer += dt;
        }
      }
    }

    // 5. Cập nhật đạn
    for (const proj of this.projectiles) {
      proj.update(dt, this);
    }

    // 6. Xử lý va chạm đạn thẳng với zombie & tombstone
    CollisionSystem.handleProjectileZombieCollisions(this.projectiles, this.zombies, this);

    // 7. Cập nhật Sun (tự động nhặt sau 0.5s)
    for (const sun of this.suns) {
      sun.update(dt, this.sunTargetPos, this);
    }

    // 8. Máy cắt cỏ
    for (const mower of this.lawnmowers) {
      mower.update(dt, this);
    }

    // 9. Hiệu ứng hạt
    for (const p of this.particles) {
      p.update(dt);
    }

    // 10. Hàng rào toàn ảnh
    for (const b of this.barriers) {
      b.update(dt);
    }

    // 11. Sét Sậy
    for (const arc of this.lightningArcs) {
      arc.timer -= dt;
    }

    // 12. Khí Stunion
    for (const cloud of this.gasClouds) {
      cloud.timer += dt;
    }

    // 12.5. Hiệu ứng tấn công phạm vi tầm gần
    if (this.attackEffects && this.attackEffects.length > 0) {
      for (const eff of this.attackEffects) {
        eff.timer += dt;
      }
      this.attackEffects = this.attackEffects.filter(eff => eff.timer < eff.duration);
    }

    // Kích hoạt Skill 2 của Galio nếu vừa chết trong lượt cập nhật này
    this.processGalioDeathSkills();

    // 13.2. Cập nhật các ô bị thiêu rụi (Scorched Tiles trong 10s)
    if (this.scorchedTiles && this.scorchedTiles.length > 0) {
      for (const t of this.scorchedTiles) {
        t.timer -= dt;
      }
      this.scorchedTiles = this.scorchedTiles.filter(t => t.timer > 0);
    }

    // 13.3. Cập nhật Cầu Lửa của Zombot Dark Dragon (tạm dừng khi Time Stop)
    if (!isTimeStopped && this.fireballs && this.fireballs.length > 0) {
      for (const fb of this.fireballs) {
        fb.progress += dt / fb.duration;
        if (fb.progress >= 1.0) {
          fb.alive = false;
          // Thiêu hủy cây tại ô trúng đòn
          const hitPlant = this.plants.find(p => p.alive && p.row === fb.targetRow && p.col === fb.targetCol);
          if (hitPlant) {
            hitPlant.takeDamage(99999, true);
            this.spawnParticles(hitPlant.x, hitPlant.y, '#ff3d00', 14);
          }
          // Thiêu rụi ô 10 giây (không thể trồng cây)
          this.scorchTile(fb.targetRow, fb.targetCol, 10.0);
          // Ấp nở Imp Dragon Zombie tại vị trí đó
          const imp = new Zombie('imp_dragon', fb.targetRow);
          imp.x = fb.targetX;
          this.zombies.push(imp);
          // Hiệu ứng nổ cầu lửa & khói lửa
          this.spawnExplosion(fb.targetX, fb.targetY);
          this.spawnParticles(fb.targetX, fb.targetY, '#ff6d00', 16);
        }
      }
      this.fireballs = this.fireballs.filter(fb => fb.alive);
      this.processGalioDeathSkills();
    }

    // 13. Dọn dẹp thực thể chết (chạy sau fireball để Galio chết do cầu lửa cũng được xử lý ngay)
    this.plants = this.plants.filter(p => p.alive);
    this.zombies = this.zombies.filter(z => z.alive || z.deathTimer < 1.2);
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.suns = this.suns.filter(s => s.alive);
    this.particles = this.particles.filter(p => p.alive);
    this.barriers = this.barriers.filter(b => b.alive);
    this.lightningArcs = this.lightningArcs.filter(a => a.timer > 0);
    this.gasClouds = this.gasClouds.filter(c => c.timer < c.maxDuration);
    this.flyingImps = this.flyingImps.filter(f => f.alive);
    this.laserBeams = this.laserBeams.filter(l => l.timer > 0);

    // 13.5. Cập nhật và dọn dẹp chữ nổi (Floating texts như SPUDOW!)
    if (this.floatingTexts) {
      for (const ft of this.floatingTexts) {
        ft.update(dt);
      }
      this.floatingTexts = this.floatingTexts.filter(ft => ft.alive);
    }

    // 14. Quản lý đợt tấn công Wave (tạm dừng khi Time Stop)
    if (this.waveManager && !isTimeStopped) {
      this.waveManager.update(dt, this);
    }
  }

  processGalioDeathSkills() {
    for (const plant of this.plants) {
      if (!plant.alive && plant.type === 'galio' && !plant.shoveled && !plant.deathSkillTriggered) {
        if (typeof plant.triggerGalioDeathSkill === 'function') {
          plant.triggerGalioDeathSkill(this);
        }
      }
    }
  }

  scorchTile(row, col, duration = 10.0) {
    if (!this.scorchedTiles) this.scorchedTiles = [];
    const existing = this.scorchedTiles.find(t => t.row === row && t.col === col);
    if (existing) {
      existing.timer = Math.max(existing.timer, duration);
      existing.maxTimer = Math.max(existing.maxTimer, duration);
    } else {
      this.scorchedTiles.push({ row, col, timer: duration, maxTimer: duration });
    }
  }

  spawnFireball(fromX, fromY, targetX, targetY, targetRow, targetCol) {
    if (!this.fireballs) this.fireballs = [];
    // Tuyệt đối không để cầu lửa và Imp Dragon rơi vào 4 ô gần nhà (cột 0, 1, 2, 3)
    const safeCol = Math.max(4, Math.min(CONFIG.COLS - 2, targetCol));
    const safeX = (safeCol !== targetCol)
      ? (CONFIG.GRID_OFFSET_X + safeCol * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2)
      : targetX;
    this.fireballs.push({
      startX: fromX,
      startY: fromY,
      targetX: safeX,
      targetY: targetY,
      targetRow: targetRow,
      targetCol: safeCol,
      progress: 0,
      duration: 1.1,
      arcHeight: 140,
      alive: true
    });
  }

  togglePlantFood() {
    if (this.plantFood <= 0) {
      if (this.spawnFloatingText) {
        this.spawnFloatingText(CONFIG.GRID_OFFSET_X + 120, CONFIG.GRID_OFFSET_Y + 120, 'HẾT PLANT FOOD! 🍃', '#ff1744', 18);
      }
      return;
    }
    this.setPlantFood(!this.isPlantFoodActive);
  }

  setPlantFood(active) {
    this.isPlantFoodActive = active;
    if (active) {
      this.clearSelection();
      if (this.audio) this.audio.playClick();
      if (this.spawnFloatingText) {
        this.spawnFloatingText(CONFIG.GRID_OFFSET_X + 120, CONFIG.GRID_OFFSET_Y + 80, 'CHẠM CÂY ĐỂ DÙNG PLANT FOOD! ⚡', '#76ff03', 17);
      }
    }
    if (this.plantFoodBtn) {
      this.plantFoodBtn.classList.toggle('selected', active);
    }
  }

  spawnFloatingText(x, y, text, color = '#ffd600', fontSize = 24) {
    if (typeof FloatingText !== 'undefined') {
      this.floatingTexts.push(new FloatingText(x, y, text, color, fontSize));
    }
  }

  spawnNaturalSun() {
    const col = Math.floor(Math.random() * CONFIG.COLS);
    const x = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
    const targetY = CONFIG.GRID_OFFSET_Y + Math.random() * (CONFIG.ROWS * CONFIG.CELL_HEIGHT - 40);
    this.suns.push(new Sun(x, -20, targetY, true, CONFIG.SUN_VALUE));
  }

  spawnSun(x, y, targetY, isNatural = false, amount = 25) {
    this.suns.push(new Sun(x, y, targetY, isNatural, amount));
  }

  addSun(amount) {
    this.sun += amount;
    if (this.audio) {
      this.audio.playSun();
    }
    this.updateHUD();
  }

  selectCard(plantType) {
    const proto = PLANT_CONFIG[plantType];
    if (!proto) return;
    if (this.sun < proto.cost) return;
    if ((this.cooldowns[plantType] || 0) > 0) return;

    if (this.audio) {
      this.audio.playClick();
    }

    if (this.selectedPlantType === plantType) {
      this.clearSelection();
      return;
    }

    this.clearSelection();
    this.selectedPlantType = plantType;
    const cardEl = this.cardElements[plantType];
    if (cardEl) cardEl.classList.add('selected');
  }

  clearSelection() {
    this.selectedPlantType = null;
    for (const key in this.cardElements) {
      this.cardElements[key].classList.remove('selected');
    }
    this.setShovel(false);
    this.setPlantFood(false);
  }

  setShovel(active) {
    this.isShovelActive = active;
    if (this.audio && active) {
      this.audio.playClick();
    }
    if (this.shovelBtn) {
      this.shovelBtn.classList.toggle('active', active);
    }
  }

  isCellOccupied(row, col) {
    // 0. Kiểm tra ô có đang bị thiêu rụi bởi cầu lửa / hơi thở lửa của rồng không (không thể trồng trong 10s)
    if (this.scorchedTiles && this.scorchedTiles.some(t => t.row === row && t.col === col && t.timer > 0)) {
      if (this.spawnFloatingText) {
        const cx = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
        const cy = CONFIG.GRID_OFFSET_Y + row * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
        this.spawnFloatingText(cx, cy, 'Ô ĐANG CHÁY! 🔥', '#ff3d00', 16);
      }
      return true;
    }

    const hasPlant = this.plants.some(p => p.alive && p.row === row && p.col === col);
    if (hasPlant) return true;

    // Kiểm tra có Bia Mộ (Tombstone) chiếm ô này không
    const cellCenterX = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
    const hasTombstone = this.zombies.some(z => z.alive && z.isObstacle && z.row === row && Math.abs(z.x - cellCenterX) < 30);
    return hasTombstone;
  }

  tryPlant(plantType, row, col, isFree = false) {
    if (this.isCellOccupied(row, col)) return false;

    const proto = PLANT_CONFIG[plantType];
    if (!proto) return false;

    // Trong chế độ Conveyor hoặc khi isFree = true, trồng cây hoàn toàn miễn phí, không tốn Sun và không tính cooldown
    if (!isFree && this.gameMode !== 'conveyor') {
      if (this.sun < proto.cost) return false;
      if ((this.cooldowns[plantType] || 0) > 0) return false;

      // Trừ Sun & Gán hồi chiêu (nếu Sandbox đang bật Hồi Chiêu 0s thì giữ = 0)
      this.sun -= proto.cost;
      this.cooldowns[plantType] = (this.isSandbox && this.sandboxNoCooldown) ? 0 : proto.cooldown;
    }

    const plant = new Plant(plantType, row, col);
    this.plants.push(plant);

    if (this.audio) {
      this.audio.playPlant(plantType);
    }

    this.spawnParticles(plant.x, plant.y, '#76ff03', 6);
    this.updateHUD();
    return true;
  }

  removePlantAt(row, col) {
    const idx = this.plants.findIndex(p => p.alive && p.row === row && p.col === col);
    if (idx !== -1) {
      const p = this.plants[idx];
      p.shoveled = true;
      p.alive = false;
      if (this.audio) {
        this.audio.playShovel();
      }
      this.spawnParticles(p.x, p.y, '#8d6e63', 6);
    }
  }

  spawnZombie(type, row) {
    // Xác thực nghiêm ngặt loại zombie hợp lệ từ ZOMBIE_CONFIG (ngăn chặn các khóa như biteDamage, biteInterval, biteDps)
    const proto = (typeof ZOMBIE_CONFIG !== 'undefined') ? ZOMBIE_CONFIG[type] : null;
    if (!proto || typeof proto !== 'object' || !proto.id || !proto.hp) {
      console.error(`[spawnZombie] Loại zombie không hợp lệ: '${type}'! Hủy lệnh spawn.`);
      return null;
    }

    if (type === 'tombstone') {
      const z = new Zombie('tombstone', row);
      const col = 5 + Math.floor(Math.random() * 4);
      z.x = CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH + CONFIG.CELL_WIDTH / 2;
      this.zombies.push(z);
      return z;
    }
    const z = new Zombie(type, row);
    this.zombies.push(z);
    return z;
  }

  spawnProjectile(type, row, x, y, damage, speed = 6.5) {
    const proj = new Projectile(type, row, x, y, damage, speed);
    this.projectiles.push(proj);
    return proj;
  }

  spawnLobbedProjectile(type, row, startX, startY, targetX, targetY, damage, splashDamage, splashRadiusCells, arcHeight) {
    const proj = new Projectile(type, row, startX, startY, damage, 6.0);
    proj.isLobbed = true;
    proj.targetX = targetX;
    proj.targetY = targetY;
    proj.startX = startX;
    proj.startY = startY;
    proj.splashDamage = splashDamage;
    proj.splashRadiusCells = splashRadiusCells;
    proj.arcHeight = arcHeight;
    this.projectiles.push(proj);
    return proj;
  }

  spawnExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
      this.spawnParticles(x, y, '#ff1744', 1);
      this.spawnParticles(x, y, '#ffd54f', 1);
    }
  }

  spawnFlyingImp(row, startX, startY, targetX, targetY) {
    this.flyingImps.push(new FlyingImp(row, startX, startY, targetX, targetY));
  }

  spawnLandedImp(row, x, y) {
    const imp = new Zombie('imp', row);
    imp.x = x;
    this.zombies.push(imp);
    this.spawnParticles(x, y, '#7e57c2', 8);
  }

  spawnHolographicBarrier(col) {
    this.barriers.push(new HolographicBarrier(col));
    for (let r = 0; r < CONFIG.ROWS; r++) {
      const y = CONFIG.GRID_OFFSET_Y + r * CONFIG.CELL_HEIGHT + CONFIG.CELL_HEIGHT / 2;
      this.spawnParticles(CONFIG.GRID_OFFSET_X + col * CONFIG.CELL_WIDTH, y, '#00e5ff', 4);
    }
  }

  spawnParticles(x, y, color, count = 4) {
    // Giới hạn hạt tối đa để đảm bảo 60 FPS mượt mà
    if (this.particles.length > 30) {
      this.particles.splice(0, count);
    }
    const realCount = Math.min(count, 4);
    for (let i = 0; i < realCount; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  spawnLightningArc(fromX, fromY, toX, toY) {
    this.lightningArcs.push({ fromX, fromY, toX, toY, timer: 0.16 });
  }

  spawnGasCloud(x, y) {
    this.gasClouds.push({ x, y, timer: 0, maxDuration: 1.2 });
  }

  spawnAttackEffect(effect) {
    if (!this.attackEffects) this.attackEffects = [];
    if (this.attackEffects.length > 40) {
      this.attackEffects.shift();
    }
    this.attackEffects.push({
      timer: 0,
      duration: 0.4,
      ...effect
    });
  }

  spawnLaserBeam(fromX, fromY, toX, toY, row) {
    this.laserBeams.push({ fromX, fromY, toX, toY, row, timer: 0.35, maxTimer: 0.35 });
  }

  clearAllZombies() {
    for (const z of this.zombies) {
      z.alive = false;
      z.deathTimer = 1.0;
    }
    this.flyingImps = [];
    this.updateHUD();
  }

  resetCooldowns() {
    for (const key in this.cooldowns) {
      this.cooldowns[key] = 0;
    }
    this.updateHUD();
  }

  toggleSandboxNoCooldown() {
    this.sandboxNoCooldown = !this.sandboxNoCooldown;
    if (this.sandboxNoCooldown) {
      for (const key in this.cooldowns) {
        this.cooldowns[key] = 0;
      }
    }
    this.updateSandboxCooldownBtnUI();
    this.updateHUD();
    return this.sandboxNoCooldown;
  }

  updateSandboxCooldownBtnUI() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('sb-reset-cooldowns');
    if (!btn) return;
    const isActive = !!(this.isSandbox && this.sandboxNoCooldown);
    btn.classList.toggle('sb-btn-active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.textContent = isActive ? '⏱️ Hồi Chiêu 0s: BẬT' : '⏱️ Hồi Chiêu 0s: TẮT';
  }

  triggerGameOver() {
    if (this.isSandbox) return;
    this.onGameOver();
  }

  onGameOver() {
    if (this.isSandbox) return; // Sandbox cho phép thử nghiệm liên tục không gián đoạn
    if (this.isGameOver) return;
    this.isGameOver = true;

    if (this.audio) {
      this.audio.stopBGM();
      this.audio.playLose();
    }

    if (this.dialogTitle) {
      this.dialogTitle.textContent = 'THE ZOMBIES ATE YOUR BRAINS!';
      this.dialogTitle.className = 'lose';
    }
    if (this.dialogMessage) {
      this.dialogMessage.textContent = `Lũ Zombie đã tràn qua hàng phòng ngự ở Level ${this.currentLevel}!`;
    }
    if (this.dialogNextBtn) {
      this.dialogNextBtn.classList.add('hidden');
    }
    if (this.dialogOverlay) this.dialogOverlay.classList.remove('hidden');
  }

  onLevelVictory() {
    if (this.isSandbox) return; // Sandbox không hiện popup chiến thắng
    if (this.isVictory) return;
    this.isVictory = true;

    if (this.audio) {
      this.audio.stopBGM();
      this.audio.playWin();
    }

    // Ghi nhận màn hiện tại đã hoàn thành
    if (!this.completedLevels) this.completedLevels = [];
    if (!this.completedLevels.includes(this.currentLevel)) {
      this.completedLevels.push(this.currentLevel);
    }

    // Mở khóa màn tiếp theo (tối đa cấp 6)
    if (this.currentLevel < 6) {
      this.unlockedLevel = Math.max(this.unlockedLevel, this.currentLevel + 1);
    }

    // Lưu tiến trình bền vững vào localStorage
    this.saveProgress();

    if (this.dialogTitle) {
      if (this.currentLevel === 6) {
        this.dialogTitle.textContent = 'VICTORY! TIÊU DIỆT ZOMBOT DARK DRAGON!';
      } else if (this.currentLevel === 5) {
        this.dialogTitle.textContent = 'VICTORY! TIÊU DIỆT BOSS GARGANTUAR!';
      } else {
        this.dialogTitle.textContent = `VICTORY! VƯỢT QUA LEVEL ${this.currentLevel}!`;
      }
      this.dialogTitle.className = 'win';
    }
    if (this.dialogMessage) {
      if (this.currentLevel === 6) {
        this.dialogMessage.textContent = 'CHIẾN CÔNG VĨ ĐẠI! Bạn đã đánh bại Zombot Dark Dragon 27.000 HP, giải cứu thời kỳ bóng tối Dark Ages!';
      } else if (this.currentLevel === 5) {
        this.dialogMessage.textContent = 'Xuất sắc! Bạn đã đánh bại BOSS Gargantuar! Hãy chuẩn bị tiến vào CẤP 6 đối đầu Zombot Dark Dragon!';
      } else {
        this.dialogMessage.textContent = `Chúc mừng! Level ${this.currentLevel + 1} đã được mở khóa trên Bản Đồ Thế Giới!`;
      }
    }
    if (this.dialogNextBtn) {
      this.dialogNextBtn.classList.remove('hidden');
      this.dialogNextBtn.textContent = this.currentLevel < 6 ? `Chơi Level ${this.currentLevel + 1} →` : 'Xem Bản Đồ 🗺️';
    }
    if (this.dialogOverlay) this.dialogOverlay.classList.remove('hidden');
  }

  // Phương thức tương thích ngược
  onWaveVictory() {
    this.onLevelVictory();
  }

  updateHUD() {
    // 1. Cập nhật Số lượng Mặt trời (Chỉ ghi đè DOM khi giá trị thay đổi)
    const currentSun = Math.floor(this.sun || 0);
    if (this._lastSun !== currentSun) {
      this._lastSun = currentSun;
      if (this.sunCountEl) this.sunCountEl.textContent = currentSun;
    }

    // 2. Cập nhật Plant Food
    const currentPF = this.plantFood !== undefined ? this.plantFood : 3;
    if (this._lastPF !== currentPF) {
      this._lastPF = currentPF;
      if (this.plantFoodCountEl) this.plantFoodCountEl.textContent = currentPF;
      if (this.plantFoodBtn) this.plantFoodBtn.classList.toggle('disabled', currentPF <= 0);
    }
    const isPFActive = !!this.isPlantFoodActive;
    if (this._lastPFActive !== isPFActive) {
      this._lastPFActive = isPFActive;
      if (this.plantFoodBtn) this.plantFoodBtn.classList.toggle('selected', isPFActive);
    }

    // 3. Cập nhật Cooldown & Thẻ Cây
    if (!this._lastCdHeight) this._lastCdHeight = {};
    if (!this._lastCardDisabled) this._lastCardDisabled = {};
    for (const key of this.plantKeys) {
      const proto = PLANT_CONFIG[key];
      const cardEl = this.cardElements[key];
      const cdEl = this.cooldownElements[key];
      if (proto && cardEl) {
        const cdRatio = (this.cooldowns[key] || 0) / proto.cooldown;
        const cdPercent = Math.round(cdRatio * 100);
        if (cdEl && this._lastCdHeight[key] !== cdPercent) {
          this._lastCdHeight[key] = cdPercent;
          cdEl.style.height = `${cdPercent}%`;
        }
        const canAfford = this.sun >= proto.cost && ((this.cooldowns[key] || 0) <= 0);
        const isDisabled = !canAfford;
        if (this._lastCardDisabled[key] !== isDisabled) {
          this._lastCardDisabled[key] = isDisabled;
          cardEl.classList.toggle('disabled', isDisabled);
        }
      }
    }

    // 4. Thanh tiến trình / Thanh máu Boss
    const isBossLevel = (this.currentLevel === 6);
    if (this._lastHudMode !== isBossLevel) {
      this._lastHudMode = isBossLevel;
      if (isBossLevel) {
        if (this.waveMeterEl) {
          this.waveMeterEl.classList.add('boss-hp-bar-mode');
          this.waveMeterEl.title = 'Thanh Máu Trùm Zombot Dark Dragon';
        }
        if (this.flagIconEl) {
          this.flagIconEl.innerHTML = '<span class="boss-flag-dragon">🐲</span>';
        }
        if (this.zombieHeadBadgeEl) {
          this.zombieHeadBadgeEl.innerHTML = '<span style="font-size: 15px; line-height: 1;">🔥</span>';
        }
      } else {
        if (this.waveMeterEl) {
          this.waveMeterEl.classList.remove('boss-hp-bar-mode');
          this.waveMeterEl.title = 'Tiến độ đợt tấn công của Zombie';
        }
        if (this.flagIconEl && this.defaultFlagSvg) {
          this.flagIconEl.innerHTML = this.defaultFlagSvg;
        }
        if (this.zombieHeadBadgeEl && this.defaultZombieHeadSvg) {
          this.zombieHeadBadgeEl.innerHTML = this.defaultZombieHeadSvg;
        }
      }
    }

    if (isBossLevel) {
      const boss = this.zombies.find(z => z.alive && z.type === 'zombot_dark_dragon');
      const maxHp = boss ? boss.maxHp : (CONFIG.ZOMBIES && CONFIG.ZOMBIES.zombot_dark_dragon ? CONFIG.ZOMBIES.zombot_dark_dragon.hp : 27000);
      const currentHp = boss ? Math.max(0, boss.hp) : (this.isVictory ? 0 : maxHp);
      const ratio = Math.max(0, Math.min(1.0, currentHp / maxHp));
      const percentStr = `${(ratio * 100).toFixed(1)}%`;

      if (this.progressBarEl && this._lastProgressBarWidth !== percentStr) {
        this._lastProgressBarWidth = percentStr;
        this.progressBarEl.style.width = percentStr;
      }
      const rightStr = `${((1 - ratio) * 100).toFixed(1)}%`;
      if (this.zombieHeadBadgeEl && this._lastBadgeRight !== rightStr) {
        this._lastBadgeRight = rightStr;
        this.zombieHeadBadgeEl.style.right = rightStr;
      }
      if (this.bossHpLabelEl) {
        const text = (currentHp <= 0 || this.isVictory)
          ? `🐲 RỒNG ĐÃ BỊ HẠ GỤC! (0 / ${maxHp.toLocaleString()} HP)`
          : `🐲 RỒNG: ${Math.ceil(currentHp).toLocaleString()} / ${maxHp.toLocaleString()} HP`;
        if (this._lastBossHpText !== text) {
          this._lastBossHpText = text;
          this.bossHpLabelEl.textContent = text;
        }
      }
    } else {
      if (this.progressBarEl && this.waveManager) {
        const progress = this.waveManager.getProgress();
        const percentStr = `${(progress * 100).toFixed(1)}%`;
        if (this._lastProgressBarWidth !== percentStr) {
          this._lastProgressBarWidth = percentStr;
          this.progressBarEl.style.width = percentStr;
        }
        if (this.zombieHeadBadgeEl && this._lastBadgeRight !== percentStr) {
          this._lastBadgeRight = percentStr;
          this.zombieHeadBadgeEl.style.right = percentStr;
        }
      }
    }
  }

  syncUnifiedPlantIcons() {
    if (typeof GameRenderer === 'undefined' || typeof GameRenderer.getPlantIconDataURL !== 'function') return;

    this.plantKeys.forEach(key => {
      const dataUrl = GameRenderer.getPlantIconDataURL(key, 88);
      if (!dataUrl) return;

      const pData = PLANT_SHOWCASE_DATA[key];
      const safeName = pData ? pData.name.replace(/"/g, '&quot;') : key;
      const imgHtml = `<img class="plant-icon-img" src="${dataUrl}" alt="${safeName}" draggable="false" />`;

      if (pData) {
        pData.svg = imgHtml;
      }

      const domKey = key.replace(/_/g, '-');
      const cardEl = document.getElementById(`card-${domKey}`);
      if (cardEl) {
        const iconSlot = cardEl.querySelector('.card-icon');
        if (iconSlot) {
          iconSlot.innerHTML = imgHtml;
        }
      }
    });
  }

  // ==========================================================
  // HỆ THỐNG TỪ ĐIỂN CÂY & ZOMBIE (SUBURBAN ALMANAC)
  // ==========================================================
  initAlmanac() {
    this.almanacOverlay = document.getElementById('almanac-overlay');
    this.almanacBtn = document.getElementById('almanac-btn');
    this.almanacCloseBtn = document.getElementById('almanac-close-btn');
    this.almanacCloseFooterBtn = document.getElementById('almanac-close-footer-btn');
    this.almanacTabPlants = document.getElementById('almanac-tab-plants');
    this.almanacTabZombies = document.getElementById('almanac-tab-zombies');
    this.almanacGridEl = document.getElementById('almanac-grid');

    this.almanacVisualEl = document.getElementById('almanac-visual');
    this.almanacNameEl = document.getElementById('almanac-name');
    this.almanacSubtitleEl = document.getElementById('almanac-subtitle');
    this.almanacStatsEl = document.getElementById('almanac-stats');
    this.almanacDescEl = document.getElementById('almanac-desc');

    this.almanacCurrentTab = 'plants';

    if (this.almanacBtn) {
      this.almanacBtn.addEventListener('click', () => this.openAlmanac());
    }
    if (this.almanacCloseBtn) {
      this.almanacCloseBtn.addEventListener('click', () => this.closeAlmanac());
    }
    if (this.almanacCloseFooterBtn) {
      this.almanacCloseFooterBtn.addEventListener('click', () => this.closeAlmanac());
    }
    if (this.almanacTabPlants) {
      this.almanacTabPlants.addEventListener('click', () => this.switchAlmanacTab('plants'));
    }
    if (this.almanacTabZombies) {
      this.almanacTabZombies.addEventListener('click', () => this.switchAlmanacTab('zombies'));
    }
  }

  openAlmanac() {
    if (this.audio) this.audio.playClick();
    if (this.almanacOverlay) {
      this.almanacOverlay.classList.remove('hidden');
      this.switchAlmanacTab(this.almanacCurrentTab || 'plants');
    }
  }

  closeAlmanac() {
    if (this.audio) this.audio.playClick();
    if (this.almanacOverlay) {
      this.almanacOverlay.classList.add('hidden');
    }
  }

  switchAlmanacTab(tab) {
    if (this.audio) this.audio.playClick();
    this.almanacCurrentTab = tab;

    if (this.almanacTabPlants) {
      this.almanacTabPlants.classList.toggle('active', tab === 'plants');
    }
    if (this.almanacTabZombies) {
      this.almanacTabZombies.classList.toggle('active', tab === 'zombies');
    }

    if (tab === 'plants') {
      this.renderAlmanacPlants();
    } else {
      this.renderAlmanacZombies();
    }
  }

  renderAlmanacPlants() {
    if (!this.almanacGridEl) return;
    this.almanacGridEl.innerHTML = '';

    const plantKeys = Object.keys(PLANT_SHOWCASE_DATA);
    plantKeys.forEach((key, index) => {
      const p = PLANT_SHOWCASE_DATA[key];
      const card = document.createElement('div');
      card.className = 'almanac-item-card';
      card.id = `almanac-plant-${key}`;
      card.innerHTML = `
        <div class="almanac-card-icon">${p.svg}</div>
        <div class="almanac-card-name">${p.name.split(' (')[0]}</div>
        <div class="almanac-card-cost">${p.cost} ☀️</div>
      `;
      card.addEventListener('click', () => this.showAlmanacPlant(key));
      this.almanacGridEl.appendChild(card);

      if (index === 0) {
        this.showAlmanacPlant(key);
      }
    });
  }

  showAlmanacPlant(key) {
    const p = PLANT_SHOWCASE_DATA[key];
    if (!p) return;

    if (this.almanacGridEl) {
      const cards = this.almanacGridEl.querySelectorAll('.almanac-item-card');
      cards.forEach(c => c.classList.remove('selected'));
      const selectedEl = document.getElementById(`almanac-plant-${key}`);
      if (selectedEl) selectedEl.classList.add('selected');
    }

    if (this.almanacVisualEl) this.almanacVisualEl.innerHTML = p.svg;
    if (this.almanacNameEl) this.almanacNameEl.textContent = p.name;
    if (this.almanacSubtitleEl) this.almanacSubtitleEl.textContent = `Nhóm: ${p.group}`;

    if (this.almanacStatsEl) {
      this.almanacStatsEl.innerHTML = `
        <div class="almanac-stat-chip"><span class="stat-label">CHI PHÍ SUN:</span><span class="stat-val">${p.cost} ☀️</span></div>
        <div class="almanac-stat-chip"><span class="stat-label">SẠC LẠI:</span><span class="stat-val">${p.cooldown}</span></div>
        <div class="almanac-stat-chip"><span class="stat-label">SỰ BỀN BỈ (HP):</span><span class="stat-val">${p.hp}</span></div>
        <div class="almanac-stat-chip"><span class="stat-label">SÁT THƯƠNG:</span><span class="stat-val">${p.dmg}</span></div>
        <div class="almanac-stat-chip" style="grid-column: span 2;"><span class="stat-label">TỐC ĐỘ BẮN / ĐÁNH:</span><span class="stat-val">${p.rate}</span></div>
      `;
    }

    if (this.almanacDescEl) {
      this.almanacDescEl.textContent = p.desc;
    }
  }

  renderAlmanacZombies() {
    if (!this.almanacGridEl) return;
    this.almanacGridEl.innerHTML = '';

    const zombieKeys = Object.keys(ZOMBIE_PREVIEW_INFO);
    zombieKeys.forEach((key, index) => {
      const z = ZOMBIE_PREVIEW_INFO[key];
      const card = document.createElement('div');
      card.className = 'almanac-item-card';
      card.id = `almanac-zombie-${key}`;
      card.innerHTML = `
        <div class="almanac-card-icon">${z.avatar}</div>
        <div class="almanac-card-name">${z.name.split(' (')[0]}</div>
        <div class="almanac-card-cost" style="color:#ef5350;">${z.boss ? 'BOSS' : 'XÁC SỐNG'}</div>
      `;
      card.addEventListener('click', () => this.showAlmanacZombie(key));
      this.almanacGridEl.appendChild(card);

      if (index === 0) {
        this.showAlmanacZombie(key);
      }
    });
  }

  showAlmanacZombie(key) {
    const z = ZOMBIE_PREVIEW_INFO[key];
    if (!z) return;

    if (this.almanacGridEl) {
      const cards = this.almanacGridEl.querySelectorAll('.almanac-item-card');
      cards.forEach(c => c.classList.remove('selected'));
      const selectedEl = document.getElementById(`almanac-zombie-${key}`);
      if (selectedEl) selectedEl.classList.add('selected');
    }

    if (this.almanacVisualEl) this.almanacVisualEl.innerHTML = `<span style="font-size: 38px;">${z.avatar}</span>`;
    if (this.almanacNameEl) this.almanacNameEl.textContent = z.name;
    if (this.almanacSubtitleEl) this.almanacSubtitleEl.textContent = z.boss ? 'Trùm Cuối Hắc Ám' : 'Quân Đoàn Xác Sống';

    const proto = ZOMBIE_CONFIG[key] || {};
    const speedText = proto.speedPerCell ? `${proto.speedPerCell}s / ô` : '5.0s / ô';

    if (this.almanacStatsEl) {
      this.almanacStatsEl.innerHTML = `
        <div class="almanac-stat-chip" style="grid-column: span 2;"><span class="stat-label">SỨC CHỊU ĐỰNG & GIÁP:</span><span class="stat-val">${z.hpText}</span></div>
        <div class="almanac-stat-chip"><span class="stat-label">TỐC ĐỘ DI CHUYỂN:</span><span class="stat-val">${speedText}</span></div>
        <div class="almanac-stat-chip"><span class="stat-label">SÁT THƯƠNG CẮN:</span><span class="stat-val">${key === 'gargantuar' ? '99999 (1-hit diệt cây)' : '50 DMG (100 DPS)'}</span></div>
      `;
    }

    if (this.almanacDescEl) {
      this.almanacDescEl.textContent = z.desc;
    }
  }
}

function initPvzGame() {
  if (!window.pvzGame) {
    try {
      window.pvzGame = new Game();
      console.log('PvZ Dark Horror Game Engine initialized successfully.');
    } catch (err) {
      console.error('PvZ Game initialization error:', err);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initPvzGame);
} else {
  initPvzGame();
}
