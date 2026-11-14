package com.example.model

import androidx.compose.ui.graphics.Color
import com.example.ui.theme.AmberGold
import com.example.ui.theme.CrimsonSoul
import com.example.ui.theme.IceCyan
import com.example.ui.theme.ToxicLime

sealed interface AppScreen {
  data object MainMenu : AppScreen
  data object WorldMap : AppScreen
  data class SeedSelection(val level: Int) : AppScreen
  data object InGame : AppScreen
}

data class PlantCatalogItem(
  val id: String,
  val shortName: String,
  val fullName: String,
  val group: String,
  val cost: Int,
  val damageText: String,
  val rateText: String,
  val cooldownText: String,
  val hpText: String,
  val description: String,
  val accentColor: Color
)

data class ZombieCatalogItem(
  val id: String,
  val name: String,
  val avatarEmoji: String,
  val hpText: String,
  val speedText: String,
  val damageText: String,
  val description: String,
  val isBoss: Boolean = false
)

data class LevelInfo(
  val level: Int,
  val title: String,
  val subtitle: String,
  val description: String,
  val zombieIds: List<String>,
  val tacticalTip: String,
  val isBoss: Boolean = false,
  val isConveyor: Boolean = false
)

data class GameSettings(
  val masterVolume: Float = 0.75f,
  val bgmVolume: Float = 0.45f,
  val sfxVolume: Float = 0.85f,
  val isMuted: Boolean = false,
  val defaultSpeed: Int = 2,
  val hudOnRight: Boolean = false,
  val confirmShovel: Boolean = false,
  val respectCutoutInsets: Boolean = true
)

data class CampaignProgress(
  val unlockedLevel: Int = 6,
  val completedLevels: Set<Int> = emptySet(),
  val selectedDeck: List<String> = DEFAULT_DECK
) {
  companion object {
    val DEFAULT_DECK = listOf(
      "sunflower",
      "peashooter",
      "snow_pea",
      "wall_nut",
      "cabbage_pult",
      "repeater",
      "cherry_bomb"
    )
  }
}

data class HudSnapshot(
  val sun: Int = 50,
  val plantFood: Int = 3,
  val isPlantFoodActive: Boolean = false,
  val isShovelActive: Boolean = false,
  val selectedPlantType: String = "",
  val gameSpeed: Int = 2,
  val isPaused: Boolean = false,
  val isSandbox: Boolean = false,
  val sandboxNoCooldown: Boolean = false,
  val gameMode: String = "normal",
  val currentLevel: Int = 1,
  val waveProgress: Float = 0f,
  val currentWave: Int = 1,
  val totalWaves: Int = 5,
  val waveStatusTitle: String = "",
  val waveStatusSub: String = "",
  val isBossLevel: Boolean = false,
  val bossHp: Int = 27000,
  val bossMaxHp: Int = 27000,
  val selectedDeck: List<String> = CampaignProgress.DEFAULT_DECK,
  val cooldowns: Map<String, Float> = emptyMap()
)

data class MatchResult(
  val victory: Boolean,
  val level: Int
)

data class ShovelConfirmRequest(
  val plantType: String,
  val row: Int,
  val col: Int
)

data class PvzUiState(
  val currentScreen: AppScreen = AppScreen.MainMenu,
  val engineReady: Boolean = false,
  val progress: CampaignProgress = CampaignProgress(),
  val settings: GameSettings = GameSettings(),
  val hud: HudSnapshot = HudSnapshot(),
  val showAlmanac: Boolean = false,
  val showSettings: Boolean = false,
  val showSandboxDrawer: Boolean = false,
  val matchResult: MatchResult? = null,
  val pendingShovelConfirm: ShovelConfirmRequest? = null
)

object PvzCatalog {
  val plants: List<PlantCatalogItem> = listOf(
    PlantCatalogItem(
      id = "sunflower",
      shortName = "Hướng Dương",
      fullName = "Hướng Dương (Sunflower)",
      group = "Kinh Tế",
      cost = 50,
      damageText = "0 (Không bắn)",
      rateText = "25 Sun / 24s",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Cung cấp 25 Mặt Trời mỗi 24 giây. Nền tảng kinh tế tối quan trọng để xây dựng phòng tuyến.",
      accentColor = AmberGold
    ),
    PlantCatalogItem(
      id = "peashooter",
      shortName = "Đậu Quỷ",
      fullName = "Đậu Quỷ (Peashooter)",
      group = "Bắn Thẳng",
      cost = 100,
      damageText = "20 DMG",
      rateText = "1.425s / phát",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn hạt đậu cơ bản gây 20 sát thương mỗi 1.425s. Chiến binh tuyến đầu tiêu chuẩn.",
      accentColor = ToxicLime
    ),
    PlantCatalogItem(
      id = "snow_pea",
      shortName = "Đậu Băng",
      fullName = "Đậu Băng (Snow Pea)",
      group = "Làm Chậm",
      cost = 175,
      damageText = "20 DMG + Băng",
      rateText = "1.425s / phát",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn đậu băng gây 20 sát thương và làm chậm 50% tốc độ di chuyển và cắn của Zombie trong 10s.",
      accentColor = IceCyan
    ),
    PlantCatalogItem(
      id = "repeater",
      shortName = "Đậu Đôi",
      fullName = "Đậu Nòng Đôi (Repeater)",
      group = "Bắn Thẳng x2",
      cost = 200,
      damageText = "40 DMG (2x20)",
      rateText = "1.425s (~28 DPS)",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn liên thanh 2 hạt đậu mỗi lượt gây 40 sát thương, tăng gấp đôi hỏa lực phá giáp.",
      accentColor = ToxicLime
    ),
    PlantCatalogItem(
      id = "wall_nut",
      shortName = "Hạt Dẻ",
      fullName = "Hạt Dẻ (Wall-nut)",
      group = "Phòng Thủ",
      cost = 50,
      damageText = "0 (Khiên chắn)",
      rateText = "Bất động",
      cooldownText = "20.0s",
      hpText = "4000 HP",
      description = "Lớp vỏ siêu dày chịu đựng tới 4000 sát thương, cản bước zombie cho tuyến sau xả đạn.",
      accentColor = AmberGold
    ),
    PlantCatalogItem(
      id = "potato_mine",
      shortName = "Mìn Khoai",
      fullName = "Mìn Khoai Tây (Potato Mine)",
      group = "Cạm Bẫy Nổ",
      cost = 50,
      damageText = "2700 DMG (3x3)",
      rateText = "Kích nổ khi dẫm",
      cooldownText = "25.0s",
      hpText = "300 HP",
      description = "Cần 5s nhô lên mặt đất. Khi kích hoạt, dẫm phải sẽ nổ tung 2700 sát thương phạm vi 3x3 ô.",
      accentColor = CrimsonSoul
    ),
    PlantCatalogItem(
      id = "hypno_shroom",
      shortName = "Nấm Miên",
      fullName = "Nấm Thôi Miên (Hypno-shroom)",
      group = "Thôi Miên",
      cost = 100,
      damageText = "Thôi miên kẻ địch",
      rateText = "Tác dụng khi bị ăn",
      cooldownText = "20.0s",
      hpText = "50 HP",
      description = "Khi zombie cắn phải nấm thôi miên, chúng sẽ quay lưng lại và chiến đấu bảo vệ khu vườn cho bạn.",
      accentColor = Color(0xFFCE93D8)
    ),
    PlantCatalogItem(
      id = "cabbage_pult",
      shortName = "Bắp Cải",
      fullName = "Bắp Cải (Cabbage-pult)",
      group = "Cầu Vồng",
      cost = 100,
      damageText = "40 DMG",
      rateText = "2.925s (~14 DPS)",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn bắp cải theo đường cầu vồng, vượt qua mọi Bia Mộ và vật cản để đánh trúng Zombie.",
      accentColor = ToxicLime
    ),
    PlantCatalogItem(
      id = "melon_pult",
      shortName = "Dưa Hấu",
      fullName = "Dưa Hấu (Melon-pult)",
      group = "Cầu Vồng AoE",
      cost = 300,
      damageText = "80 (+30 AoE)",
      rateText = "2.925s (~27 DPS)",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn dưa hấu hạng nặng cầu vồng qua Bia Mộ. Gây 80 sát thương trực tiếp và 30 sát thương lan 3x3.",
      accentColor = ToxicLime
    ),
    PlantCatalogItem(
      id = "bonk_choy",
      shortName = "Đấm Bốc",
      fullName = "Đấm Bốc (Bonk Choy)",
      group = "Cận Chiến",
      cost = 150,
      damageText = "20 DMG / 0.5s",
      rateText = "0.5s / đấm",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Võ sĩ cận chiến tung đòn đấm nhanh 20 sát thương mỗi 0.5s trong phạm vi 2 ô trước và sau.",
      accentColor = ToxicLime
    ),
    PlantCatalogItem(
      id = "snapdragon",
      shortName = "Rồng Lửa",
      fullName = "Rồng Lửa (Snapdragon)",
      group = "Phun Lửa 3 Hàng",
      cost = 200,
      damageText = "30 DMG (3 hàng)",
      rateText = "1.0s / lần",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Phun luồng lửa ma quái hình nón bao phủ 3 hàng liền kề, thiêu rụi nhiều mục tiêu cùng lúc.",
      accentColor = CrimsonSoul
    ),
    PlantCatalogItem(
      id = "chomper",
      shortName = "Hoa Đớp",
      fullName = "Hoa Ăn Thịt (Chomper)",
      group = "Nuốt Chửng",
      cost = 150,
      damageText = "2400 DMG (Nuốt)",
      rateText = "Tiêu hóa 20s",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Nuốt trọn 1 Zombie trong phạm vi 1 ô trước mặt. Cắn Boss gây 200 DMG mỗi giây.",
      accentColor = Color(0xFFBA68C8)
    ),
    PlantCatalogItem(
      id = "cherry_bomb",
      shortName = "Bom Đào",
      fullName = "Bom Anh Đào (Cherry Bomb)",
      group = "Nổ Tức Thời",
      cost = 150,
      damageText = "1800 DMG (3x3)",
      rateText = "Nổ sau 1.2s",
      cooldownText = "35.0s",
      hpText = "300 HP",
      description = "Phát nổ hủy diệt phạm vi 3x3 ô với 1800 sát thương, xóa sổ ngay đàn zombie dày đặc.",
      accentColor = CrimsonSoul
    ),
    PlantCatalogItem(
      id = "lightning_reed",
      shortName = "Sậy Sét",
      fullName = "Sậy Sét (Lightning Reed)",
      group = "Giật Sét",
      cost = 125,
      damageText = "10 DMG x 3 mục tiêu",
      rateText = "1.4s / tia",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Giật tia lôi điện xuyên qua tối đa 3 mục tiêu trong phạm vi lan 3 ô, khắc chế bầy Imp đông đúc.",
      accentColor = IceCyan
    ),
    PlantCatalogItem(
      id = "stunion",
      shortName = "Hành Choáng",
      fullName = "Hành Choáng (Stunion)",
      group = "Khí Choáng",
      cost = 25,
      damageText = "Choáng 12 Giây",
      rateText = "Tức thời",
      cooldownText = "15.0s",
      hpText = "300 HP",
      description = "Thổi luồng khí cực nồng làm tê liệt hoàn toàn mọi zombie trong 1.8 ô suốt 12 giây.",
      accentColor = Color(0xFFBA68C8)
    ),
    PlantCatalogItem(
      id = "infi_nut",
      shortName = "Dẻ Holo",
      fullName = "Hạt Dẻ Hologram (Infi-nut)",
      group = "Khiên Hồi Phục",
      cost = 75,
      damageText = "0 (Tự hồi máu)",
      rateText = "Bất động",
      cooldownText = "15.0s",
      hpText = "2000 HP",
      description = "Chiếu lá chắn toàn ảnh 2000 HP. Khi không bị cắn sẽ tự tái tạo lại hoàn toàn.",
      accentColor = IceCyan
    ),
    PlantCatalogItem(
      id = "sun_shroom",
      shortName = "Nấm Sun",
      fullName = "Nấm Mặt Trời (Sun Shroom)",
      group = "Kinh Tế Tiến Hóa",
      cost = 25,
      damageText = "0 (Kinh tế)",
      rateText = "25 → 50 → 75 Sun",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Cây kinh tế giá rẻ 25 Sun. Lớn dần qua 3 giai đoạn để nhả tới 75 Mặt Trời mỗi đợt.",
      accentColor = AmberGold
    ),
    PlantCatalogItem(
      id = "goo_peashooter",
      shortName = "Đậu Độc",
      fullName = "Đậu Độc (Goo Pea)",
      group = "Độc Xuyên Giáp",
      cost = 125,
      damageText = "30 DMG + 15 Độc/s",
      rateText = "1.4s / phát",
      cooldownText = "7.5s",
      hpText = "300 HP",
      description = "Bắn hạt đậu độc xuyên giáp nón/xô, cộng dồn tối đa 3 lớp độc gây 15 DMG mỗi giây.",
      accentColor = Color(0xFFCE93D8)
    ),
    PlantCatalogItem(
      id = "magnet_shroom",
      shortName = "Nam Châm",
      fullName = "Nấm Nam Châm (Magnet-shroom)",
      group = "Hút Kim Loại",
      cost = 100,
      damageText = "Hút giáp sắt",
      rateText = "10s / lần",
      cooldownText = "15.0s",
      hpText = "300 HP",
      description = "Hút thùng sắt của Buckethead và luôn là mục tiêu ưu tiên số 1 bị Zombot Dark Dragon nhắm cầu lửa.",
      accentColor = IceCyan
    ),
    PlantCatalogItem(
      id = "galio",
      shortName = "Galio",
      fullName = "Vệ Thần Galio",
      group = "Cận Chiến & Khống Chế",
      cost = 200,
      damageText = "50 / Sóng 500 / Chết 1500",
      rateText = "0.5s / đấm · 5s sóng",
      cooldownText = "20.0s",
      hpText = "250 HP",
      description = "Đánh cận chiến 2 ô. Tích 5s bắn sóng năng lượng 500 DMG. Khi chết ngưng đọng thời gian 1s, hút 5 zombie và nổ 1500 DMG.",
      accentColor = AmberGold
    ),
    PlantCatalogItem(
      id = "jhinplant",
      shortName = "Jhinplant",
      fullName = "Jhinplant (Hoa Súng Tử Vong)",
      group = "Xạ Thủ Nhịp 4",
      cost = 140,
      damageText = "125 · Viên IV: 500 · Sen: 444",
      rateText = "1.0s/viên (4 viên) · Nạp 4s",
      cooldownText = "4.0s",
      hpText = "440 HP",
      description = "Hoa thược dược tím thẫm đeo mặt nạ cùng ống ngắm la-de đỏ. Bắn 4 phát nhịp 1s (125 DMG), viên thứ 4 gây x4 sát thương (500 DMG) rồi nạp đạn 4s. Khi viên thứ 4 hạ gục Zombie sẽ đặt Bẫy Hoa Sen (chặn trồng cây lên ô đó), phát nổ 444 DMG AoE 2×2 ô khi Zombie bước vào.",
      accentColor = Color(0xFFBA68C8)
    )
  )

  val plantById: Map<String, PlantCatalogItem> = plants.associateBy { it.id }

  val zombies: List<ZombieCatalogItem> = listOf(
    ZombieCatalogItem("basic", "Zombie Cơ Bản", "🧟", "190 HP", "6.0s / ô", "50 DMG (100 DPS)", "Kẻ thù tiêu chuẩn không giáp. Dễ bị tiêu diệt bởi Peashooter."),
    ZombieCatalogItem("imp", "Quỷ Lùn Imp", "🦹", "100 HP", "2.5s / ô", "20 DMG", "Nhỏ con nhưng chạy rất nhanh, thường bị Gargantuar ném vào sâu phòng tuyến."),
    ZombieCatalogItem("conehead", "Zombie Nón Giao Thông", "🪖", "560 HP (370 Giáp)", "6.0s / ô", "50 DMG", "Đội nón bảo hộ tăng gần gấp 3 lần sức chịu đựng."),
    ZombieCatalogItem("buckethead", "Zombie Thùng Sắt", "🪣", "1290 HP (1100 Giáp)", "6.0s / ô", "50 DMG", "Bọc thùng thép siêu dày! Khắc chế tốt bằng Nấm Nam Châm, Đậu Độc hoặc Cherry Bomb."),
    ZombieCatalogItem("pole_vaulting", "Zombie Cầm Sào", "🏃", "500 HP", "3.0s / ô", "50 DMG", "Chạy nhanh và phóng sào nhảy qua cây đầu tiên trên hàng!"),
    ZombieCatalogItem("tombstone", "Bia Mộ Cổ (Vật Cản)", "🪦", "500 HP", "Bất động", "0 DMG", "Chắn đứng mọi đạn bắn thẳng. Dùng Bắp Cải hoặc Dưa Hấu ném cầu vồng vượt qua."),
    ZombieCatalogItem("turquoise_skull", "Đầu Lâu Ngọc (Laser)", "💀", "250 HP", "5.4s / ô", "Laser 4000 DMG", "Tích tụ năng lượng trong 5s rồi bắn tia laser thiêu rụi cây trước mặt."),
    ZombieCatalogItem("jurassic_bully", "Kẻ Bắt Nạt Tiền Sử", "🦣", "1100 HP", "6.25s / ô", "100 DPS", "Thể hình hộ pháp miễn nhiễm hoàn toàn hiệu ứng đẩy lùi."),
    ZombieCatalogItem("troglobite", "Troglobite (Đẩy Băng)", "🧊", "470 HP", "5.4s / ô", "100 DMG", "Miễn nhiễm làm chậm và đẩy khối băng chứa Yeti Imp nghiền nát cây."),
    ZombieCatalogItem("yeti_imp", "Yeti Imp", "❄️", "190 HP", "3.0s / ô", "100 DMG", "Xuất hiện khi khối băng vỡ, chạy nhanh và miễn nhiễm làm chậm."),
    ZombieCatalogItem("lang_khach", "Lãng Khách Zombie", "🌪️", "600 HP", "4.8s / ô", "Lướt 100 / Lốc 1800", "Lướt xuyên cây cách 3 ô, bất tử 3s khi dưới 50% HP và phóng lốc xoáy sau 3 lần lướt."),
    ZombieCatalogItem("gargantuar", "BOSS Khổng Lồ Gargantuar", "👹", "3000 HP", "8.5s / ô", "Đập 1-hit diệt cây", "Đập chày hủy diệt mọi cây phòng thủ và ném Imp vào sâu hậu phương khi mất nửa máu.", isBoss = true),
    ZombieCatalogItem("imp_dragon", "Imp Dragon Zombie", "🦎", "190 HP", "2.8s / ô", "20 DMG", "Ấp nở từ cầu lửa của Zombot Dark Dragon, miễn nhiễm sát thương lửa."),
    ZombieCatalogItem("zombot_dark_dragon", "TRÙM ZOMBOT DARK DRAGON", "🐲", "27.000 HP", "Cố định (2 Hàng)", "Khạc Lửa Hủy Diệt", "Trùm Rồng Cơ Giới Dark Ages: Gầm triệu hồi quân, nhổ cầu lửa thiêu đất 10s, khạc lửa 2 hàng (dùng Plant Food để ngắt đòn!).", isBoss = true)
  )

  val zombieById: Map<String, ZombieCatalogItem> = zombies.associateBy { it.id }

  val levels: List<LevelInfo> = listOf(
    LevelInfo(
      level = 1,
      title = "Sân Cỏ Ma Ám",
      subtitle = "Basic Zombie & Quỷ Lùn Imp",
      description = "Làm quen với chiến trường nghĩa địa ban đêm cùng 5 đợt tấn công cơ bản.",
      zombieIds = listOf("basic", "imp"),
      tacticalTip = "Trồng 1-2 hàng Hướng Dương ở phía sau để đảm bảo Sun, dùng Peashooter tiêu diệt Zombie từ xa."
    ),
    LevelInfo(
      level = 2,
      title = "Bia Mộ & Nón Sắt",
      subtitle = "Conehead, Pole Vault & Bia Mộ",
      description = "Bia Mộ cản đạn thẳng xuất hiện trên sân cùng Zombie Cầm Sào vượt rào.",
      zombieIds = listOf("basic", "conehead", "pole_vaulting", "tombstone"),
      tacticalTip = "Bia Mộ chặn đạn thẳng! Mang theo Cabbage-pult hoặc Melon-pult để bắn cầu vồng và đặt Wall-nut chắn nhảy sào."
    ),
    LevelInfo(
      level = 3,
      title = "Binh Đoàn Thùng Sắt",
      subtitle = "Buckethead & Đầu Lâu Laser",
      description = "Zombie Thùng Sắt 1290 HP và Turquoise Skull phóng tia laser càn quét.",
      zombieIds = listOf("basic", "conehead", "buckethead", "turquoise_skull", "tombstone"),
      tacticalTip = "Dùng Magnet-shroom hút thùng sắt hoặc Đậu Độc xuyên giáp; tiêu diệt Đầu Lâu Ngọc trước khi tích đủ laser!"
    ),
    LevelInfo(
      level = 4,
      title = "Kỷ Băng Hà & Lãng Khách",
      subtitle = "Jurassic Bully, Troglobite & Lãng Khách",
      description = "Troglobite đẩy tảng băng chứa Yeti Imp cùng Lãng Khách Zombie lướt kiếm gió.",
      zombieIds = listOf("basic", "conehead", "buckethead", "lang_khach", "jurassic_bully", "troglobite", "yeti_imp", "tombstone"),
      tacticalTip = "Troglobite và Yeti Imp miễn nhiễm làm chậm — ưu tiên sát thương cao như Repeater, Melon-pult và Galio."
    ),
    LevelInfo(
      level = 5,
      title = "Đại Chiến Gargantuar",
      subtitle = "BOSS Khổng Lồ 3000 HP",
      description = "Hội tụ binh đoàn tinh nhuệ cùng Trùm Gargantuar đập nát hàng phòng thủ.",
      zombieIds = listOf("gargantuar", "imp", "buckethead", "pole_vaulting", "lang_khach", "turquoise_skull", "jurassic_bully", "troglobite", "tombstone"),
      tacticalTip = "Gargantuar đập 1-hit diệt cây! Dùng Snow Pea làm chậm, Cherry Bomb + Potato Mine và Plant Food để dồn sát thương.",
      isBoss = true
    ),
    LevelInfo(
      level = 6,
      title = "Zombot Dark Dragon",
      subtitle = "BOSS Rồng 27.000 HP · Băng Chuyền",
      description = "Chế độ Băng Chuyền miễn phí Sun! Ngắt hơi thở lửa của Rồng bằng lá Plant Food.",
      zombieIds = listOf("zombot_dark_dragon", "imp_dragon", "gargantuar", "lang_khach", "buckethead", "tombstone"),
      tacticalTip = "Chế độ Băng Chuyền: Kéo thả cây trực tiếp từ băng chuyền bên trái. Khi Rồng chuẩn bị khạc lửa, dùng Plant Food lên cây bất kỳ để ngắt đòn!",
      isBoss = true,
      isConveyor = true
    )
  )
}
