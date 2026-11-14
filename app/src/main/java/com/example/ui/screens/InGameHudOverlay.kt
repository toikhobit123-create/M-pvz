package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Construction
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.Whatshot
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.model.HudSnapshot
import com.example.model.PlantCatalogItem
import com.example.model.PvzCatalog
import com.example.model.PvzUiState
import com.example.ui.components.HudIconChip
import com.example.ui.components.PlantIconView
import com.example.ui.theme.AmberDeep
import com.example.ui.theme.AmberGold
import com.example.ui.theme.BorderMauve
import com.example.ui.theme.BorderSubtle
import com.example.ui.theme.CrimsonDark
import com.example.ui.theme.CrimsonSoul
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.PlumSurface
import com.example.ui.theme.PlumSurfaceCard
import com.example.ui.theme.PlumSurfaceElevated
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.ToxicForest
import com.example.ui.theme.ToxicLime

@Composable
fun InGameHudOverlay(
  uiState: PvzUiState,
  plantIcons: Map<String, ImageBitmap>,
  onSelectCard: (String) -> Unit,
  onToggleShovel: () -> Unit,
  onTogglePlantFood: () -> Unit,
  onToggleSpeed: () -> Unit,
  onTogglePause: () -> Unit,
  onToggleMute: () -> Unit,
  onOpenAlmanac: () -> Unit,
  onOpenSettings: () -> Unit,
  onToggleSandboxDrawer: () -> Unit,
  onCloseSandboxDrawer: () -> Unit,
  onRestartBattle: () -> Unit,
  onOpenWorldMap: () -> Unit,
  onReturnToMenu: () -> Unit,
  onNextLevel: () -> Unit,
  onResolveShovelConfirm: (Boolean) -> Unit,
  onSandboxAddSun: (Int) -> Unit,
  onSandboxSetSun: (Int) -> Unit,
  onSandboxToggleNoCooldown: () -> Unit,
  onSandboxSpawnZombie: (String, Int) -> Unit,
  onSandboxClearZombies: () -> Unit,
  onSandboxClearAll: () -> Unit
) {
  val hud = uiState.hud
  val settings = uiState.settings
  val isConveyor = hud.gameMode == "conveyor"

  val insetsModifier = if (settings.respectCutoutInsets) {
    Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
  } else {
    Modifier
  }

  Box(modifier = Modifier.fillMaxSize()) {
    // Interactive HUD Layer (leaves Canvas lawn untouched everywhere else)
    Box(
      modifier = Modifier
        .fillMaxSize()
        .then(insetsModifier)
        .padding(horizontal = 6.dp, vertical = 6.dp)
    ) {
      // 1. Vertical HUD Rail (hidden on Level 6 Conveyor mode so Canvas belt on left is free)
      if (!isConveyor) {
        val railAlignment = if (settings.hudOnRight) Alignment.CenterEnd else Alignment.CenterStart
        VerticalSeedRail(
          hud = hud,
          plantIcons = plantIcons,
          onSelectCard = onSelectCard,
          onToggleShovel = onToggleShovel,
          onTogglePlantFood = onTogglePlantFood,
          modifier = Modifier.align(railAlignment)
        )
      }

      // 2. Top Gutter Bar (Wave / Boss Progress + Quick Controls)
      val gutterStartPad = if (!isConveyor && !settings.hudOnRight) 94.dp else 0.dp
      val gutterEndPad = if (!isConveyor && settings.hudOnRight) 94.dp else 0.dp
      TopGutterBar(
        hud = hud,
        isMuted = settings.isMuted,
        isConveyor = isConveyor,
        onToggleShovel = onToggleShovel,
        onTogglePlantFood = onTogglePlantFood,
        onToggleSpeed = onToggleSpeed,
        onToggleSandboxDrawer = onToggleSandboxDrawer,
        onToggleMute = onToggleMute,
        onOpenAlmanac = onOpenAlmanac,
        onOpenSettings = onOpenSettings,
        onTogglePause = onTogglePause,
        modifier = Modifier
          .align(Alignment.TopCenter)
          .fillMaxWidth()
          .padding(start = gutterStartPad, end = gutterEndPad)
      )
    }

    // 3. Sandbox Right Studio Drawer
    if (hud.isSandbox) {
      SandboxDrawer(
        visible = uiState.showSandboxDrawer,
        hud = hud,
        respectCutoutInsets = settings.respectCutoutInsets,
        onAddSun = onSandboxAddSun,
        onSetSun = onSandboxSetSun,
        onToggleNoCooldown = onSandboxToggleNoCooldown,
        onToggleSpeed = onToggleSpeed,
        onSpawnZombie = onSandboxSpawnZombie,
        onClearZombies = onSandboxClearZombies,
        onClearAll = onSandboxClearAll,
        onResetMatch = onRestartBattle,
        onClose = onCloseSandboxDrawer,
        modifier = Modifier.align(Alignment.CenterEnd)
      )
    }

    // 4. Shovel Confirm Dialog
    uiState.pendingShovelConfirm?.let { req ->
      ShovelConfirmDialog(
        request = req,
        onConfirm = { onResolveShovelConfirm(true) },
        onCancel = { onResolveShovelConfirm(false) }
      )
    }

    // 5. Match Result Modal (Victory / Defeat)
    uiState.matchResult?.let { result ->
      MatchResultModal(
        result = result,
        onNextLevel = onNextLevel,
        onReplay = onRestartBattle,
        onOpenWorldMap = onOpenWorldMap
      )
    }

    // 6. Pause Overlay Modal
    if (
      hud.isPaused &&
      uiState.matchResult == null &&
      uiState.pendingShovelConfirm == null &&
      !uiState.showSettings &&
      !uiState.showAlmanac
    ) {
      PauseOverlayModal(
        isSandbox = hud.isSandbox,
        currentLevel = hud.currentLevel,
        onResume = onTogglePause,
        onRestart = onRestartBattle,
        onOpenSettings = onOpenSettings,
        onOpenWorldMap = onOpenWorldMap,
        onReturnToMenu = onReturnToMenu
      )
    }
  }
}

@Composable
private fun VerticalSeedRail(
  hud: HudSnapshot,
  plantIcons: Map<String, ImageBitmap>,
  onSelectCard: (String) -> Unit,
  onToggleShovel: () -> Unit,
  onTogglePlantFood: () -> Unit,
  modifier: Modifier = Modifier
) {
  val cardItems: List<PlantCatalogItem> = if (hud.isSandbox) {
    PvzCatalog.plants
  } else {
    hud.selectedDeck.mapNotNull { PvzCatalog.plantById[it] }
  }

  Surface(
    modifier = modifier
      .width(86.dp)
      .fillMaxHeight(),
    shape = RoundedCornerShape(14.dp),
    color = PlumSurface.copy(alpha = 0.88f),
    border = BorderStroke(1.3.dp, BorderMauve),
    shadowElevation = 8.dp
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(5.dp),
      verticalArrangement = Arrangement.spacedBy(5.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      // Sun / Soul Counter Pill
      Surface(
        modifier = Modifier
          .fillMaxWidth()
          .testTag("hud_sun_counter"),
        shape = RoundedCornerShape(9.dp),
        color = AmberDeep.copy(alpha = 0.9f),
        border = BorderStroke(1.dp, AmberGold)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 6.dp, vertical = 5.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.Center
        ) {
          Icon(
            imageVector = Icons.Filled.WbSunny,
            contentDescription = "Mặt Trời",
            tint = AmberGold,
            modifier = Modifier.size(15.dp)
          )
          Spacer(Modifier.width(3.dp))
          Text(
            text = "${hud.sun}",
            style = MaterialTheme.typography.labelLarge,
            fontWeight = FontWeight.ExtraBold,
            color = TextPrimary,
            maxLines = 1
          )
        }
      }

      // Scrollable Seed Cards
      LazyColumn(
        modifier = Modifier
          .fillMaxWidth()
          .weight(1f),
        contentPadding = PaddingValues(vertical = 2.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp)
      ) {
        items(cardItems, key = { it.id }) { plant ->
          val cdFraction = (hud.cooldowns[plant.id] ?: 0f).coerceIn(0f, 1f)
          val canAfford = hud.sun >= plant.cost
          val isSelected = hud.selectedPlantType == plant.id
          val isReady = cdFraction <= 0.001f && canAfford

          val borderColor = when {
            isSelected -> ToxicLime
            isReady -> BorderMauve
            else -> BorderSubtle
          }

          Box(
            modifier = Modifier
              .fillMaxWidth()
              .height(52.dp)
              .clip(RoundedCornerShape(9.dp))
              .background(if (isSelected) ToxicForest.copy(alpha = 0.65f) else PlumSurfaceCard)
              .border(if (isSelected) 2.dp else 1.dp, borderColor, RoundedCornerShape(9.dp))
              .alpha(if (canAfford) 1f else 0.48f)
              .clickable { onSelectCard(plant.id) }
              .testTag("hud_card_${plant.id}")
          ) {
            Row(
              modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 4.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 30.dp)
              Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.Center
              ) {
                Text(
                  text = "${plant.cost}",
                  style = MaterialTheme.typography.labelMedium,
                  fontWeight = FontWeight.ExtraBold,
                  color = AmberGold
                )
                Text(
                  text = plant.shortName,
                  style = MaterialTheme.typography.labelSmall,
                  color = TextSecondary,
                  maxLines = 1,
                  overflow = TextOverflow.Ellipsis,
                  modifier = Modifier.widthIn(max = 38.dp)
                )
              }
            }

            // Cooldown progress veil from top down
            if (cdFraction > 0.001f) {
              Box(
                modifier = Modifier
                  .fillMaxWidth()
                  .fillMaxHeight(cdFraction)
                  .align(Alignment.TopCenter)
                  .background(ObsidianBg.copy(alpha = 0.68f))
              )
            }
          }
        }
      }

      // Shovel & Plant Food Controls (48dp touch targets)
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
      ) {
        Surface(
          modifier = Modifier
            .weight(1f)
            .minimumInteractiveComponentSize()
            .height(44.dp)
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onToggleShovel)
            .testTag("hud_shovel_btn"),
          shape = RoundedCornerShape(8.dp),
          color = if (hud.isShovelActive) CrimsonSoul else PlumSurfaceElevated,
          border = BorderStroke(1.2.dp, if (hud.isShovelActive) Color(0xFFFF8A9B) else BorderMauve)
        ) {
          Box(contentAlignment = Alignment.Center) {
            Icon(
              imageVector = Icons.Filled.Construction,
              contentDescription = "Xẻng nhổ cây",
              tint = if (hud.isShovelActive) TextPrimary else AmberGold,
              modifier = Modifier.size(19.dp)
            )
          }
        }

        Surface(
          modifier = Modifier
            .weight(1f)
            .minimumInteractiveComponentSize()
            .height(44.dp)
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onTogglePlantFood)
            .testTag("hud_plant_food_btn"),
          shape = RoundedCornerShape(8.dp),
          color = if (hud.isPlantFoodActive) ToxicForest else PlumSurfaceElevated,
          border = BorderStroke(1.2.dp, if (hud.isPlantFoodActive) ToxicLime else BorderMauve)
        ) {
          Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
          ) {
            Icon(
              imageVector = Icons.Filled.Bolt,
              contentDescription = "Lá Plant Food",
              tint = ToxicLime,
              modifier = Modifier.size(16.dp)
            )
            Text(
              text = "${hud.plantFood}",
              style = MaterialTheme.typography.labelSmall,
              color = TextPrimary
            )
          }
        }
      }
    }
  }
}

@Composable
private fun TopGutterBar(
  hud: HudSnapshot,
  isMuted: Boolean,
  isConveyor: Boolean,
  onToggleShovel: () -> Unit,
  onTogglePlantFood: () -> Unit,
  onToggleSpeed: () -> Unit,
  onToggleSandboxDrawer: () -> Unit,
  onToggleMute: () -> Unit,
  onOpenAlmanac: () -> Unit,
  onOpenSettings: () -> Unit,
  onTogglePause: () -> Unit,
  modifier: Modifier = Modifier
) {
  Row(
    modifier = modifier,
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.Top
  ) {
    // Left / Center Status: Level + Wave or Boss HP + optional Wave Countdown pill
    Row(
      horizontalArrangement = Arrangement.spacedBy(6.dp),
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier.weight(1f, fill = false)
    ) {
      Surface(
        shape = RoundedCornerShape(10.dp),
        color = PlumSurface.copy(alpha = 0.88f),
        border = BorderStroke(1.2.dp, if (hud.isBossLevel) CrimsonSoul else BorderMauve)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Text(
            text = if (hud.isSandbox) "SANDBOX" else "CẤP ${hud.currentLevel}",
            style = MaterialTheme.typography.labelLarge,
            color = if (hud.isSandbox) AmberGold else ToxicLime
          )

          if (hud.isBossLevel) {
            Row(
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Icon(Icons.Filled.Whatshot, contentDescription = null, tint = CrimsonSoul, modifier = Modifier.size(16.dp))
              Column {
                Text(
                  text = "RỒNG ĐEN: ${hud.bossHp} / ${hud.bossMaxHp}",
                  style = MaterialTheme.typography.labelSmall,
                  color = Color(0xFFFFAB91)
                )
                LinearProgressIndicator(
                  progress = { (hud.bossHp.toFloat() / hud.bossMaxHp.coerceAtLeast(1)).coerceIn(0f, 1f) },
                  modifier = Modifier
                    .width(120.dp)
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                  color = CrimsonSoul,
                  trackColor = ObsidianBg
                )
              }
            }
          } else if (!hud.isSandbox) {
            Column {
              Text(
                text = "ĐỢT ${hud.currentWave}/${hud.totalWaves}",
                style = MaterialTheme.typography.labelSmall,
                color = TextPrimary
              )
              LinearProgressIndicator(
                progress = { hud.waveProgress.coerceIn(0f, 1f) },
                modifier = Modifier
                  .width(96.dp)
                  .height(6.dp)
                  .clip(RoundedCornerShape(3.dp)),
                color = ToxicLime,
                trackColor = ObsidianBg
              )
            }
          }
        }
      }

      if (hud.waveStatusTitle.isNotEmpty()) {
        Surface(
          shape = RoundedCornerShape(10.dp),
          color = PlumSurfaceElevated.copy(alpha = 0.9f),
          border = BorderStroke(1.dp, AmberGold.copy(alpha = 0.7f))
        ) {
          Text(
            text = hud.waveStatusTitle,
            style = MaterialTheme.typography.labelSmall,
            color = AmberGold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
          )
        }
      }

      // Conveyor Level 6 keeps Plant Food & Shovel handy in top gutter so Canvas left belt stays untouched
      if (isConveyor) {
        HudIconChip(
          onClick = onTogglePlantFood,
          icon = Icons.Filled.Bolt,
          contentDescription = "Dùng Plant Food",
          label = "PF (${hud.plantFood})",
          containerColor = if (hud.isPlantFoodActive) ToxicForest else PlumSurfaceElevated.copy(alpha = 0.92f),
          borderColor = if (hud.isPlantFoodActive) ToxicLime else BorderMauve,
          tint = ToxicLime,
          modifier = Modifier.testTag("conveyor_plant_food_btn")
        )
        HudIconChip(
          onClick = onToggleShovel,
          icon = Icons.Filled.Construction,
          contentDescription = "Xẻng nhổ cây",
          containerColor = if (hud.isShovelActive) CrimsonSoul else PlumSurfaceElevated.copy(alpha = 0.92f),
          borderColor = if (hud.isShovelActive) Color(0xFFFF8A9B) else BorderMauve,
          tint = if (hud.isShovelActive) TextPrimary else AmberGold,
          modifier = Modifier.testTag("conveyor_shovel_btn")
        )
      }
    }

    // Right Quick Action Strip
    Row(
      horizontalArrangement = Arrangement.spacedBy(5.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      HudIconChip(
        onClick = onToggleSpeed,
        icon = Icons.Filled.Speed,
        contentDescription = "Đổi tốc độ",
        label = "${hud.gameSpeed}X",
        containerColor = if (hud.gameSpeed == 2) CrimsonDark.copy(alpha = 0.92f) else PlumSurfaceElevated.copy(alpha = 0.92f),
        borderColor = if (hud.gameSpeed == 2) AmberGold else BorderMauve,
        tint = if (hud.gameSpeed == 2) AmberGold else TextPrimary,
        modifier = Modifier.testTag("hud_speed_btn")
      )

      if (hud.isSandbox) {
        HudIconChip(
          onClick = onToggleSandboxDrawer,
          icon = Icons.Filled.Build,
          contentDescription = "Bảng Sandbox",
          containerColor = AmberDeep.copy(alpha = 0.92f),
          borderColor = AmberGold,
          tint = AmberGold,
          modifier = Modifier.testTag("hud_sandbox_btn")
        )
      }

      HudIconChip(
        onClick = onToggleMute,
        icon = if (isMuted) Icons.AutoMirrored.Filled.VolumeOff else Icons.AutoMirrored.Filled.VolumeUp,
        contentDescription = if (isMuted) "Bật âm thanh" else "Tắt âm thanh",
        tint = if (isMuted) CrimsonSoul else TextPrimary,
        modifier = Modifier.testTag("hud_mute_btn")
      )

      HudIconChip(
        onClick = onOpenAlmanac,
        icon = Icons.Filled.MenuBook,
        contentDescription = "Từ điển",
        modifier = Modifier.testTag("hud_almanac_btn")
      )

      HudIconChip(
        onClick = onOpenSettings,
        icon = Icons.Filled.Settings,
        contentDescription = "Cài đặt",
        modifier = Modifier.testTag("hud_settings_btn")
      )

      HudIconChip(
        onClick = onTogglePause,
        icon = Icons.Filled.Pause,
        contentDescription = "Tạm dừng",
        borderColor = AmberGold.copy(alpha = 0.7f),
        tint = AmberGold,
        modifier = Modifier.testTag("hud_pause_btn")
      )
    }
  }
}
