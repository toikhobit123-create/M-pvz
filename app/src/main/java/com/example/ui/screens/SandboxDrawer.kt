package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.model.HudSnapshot
import com.example.model.PvzCatalog
import com.example.ui.components.GothicActionButton
import com.example.ui.components.HudIconChip
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
fun SandboxDrawer(
  visible: Boolean,
  hud: HudSnapshot,
  respectCutoutInsets: Boolean,
  onAddSun: (Int) -> Unit,
  onSetSun: (Int) -> Unit,
  onToggleNoCooldown: () -> Unit,
  onToggleSpeed: () -> Unit,
  onSpawnZombie: (String, Int) -> Unit,
  onClearZombies: () -> Unit,
  onClearAll: () -> Unit,
  onResetMatch: () -> Unit,
  onClose: () -> Unit,
  modifier: Modifier = Modifier
) {
  var activeTab by remember { mutableIntStateOf(1) }
  var selectedRow by remember { mutableIntStateOf(-1) }

  val insetsModifier = if (respectCutoutInsets) {
    Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
  } else {
    Modifier
  }

  AnimatedVisibility(
    visible = visible,
    enter = slideInHorizontally(initialOffsetX = { it }),
    exit = slideOutHorizontally(targetOffsetX = { it }),
    modifier = modifier
  ) {
    Surface(
      modifier = Modifier
        .then(insetsModifier)
        .padding(top = 56.dp, end = 10.dp, bottom = 10.dp)
        .width(292.dp)
        .fillMaxHeight()
        .clickable(
          interactionSource = remember { MutableInteractionSource() },
          indication = null,
          onClick = {}
        ),
      shape = RoundedCornerShape(14.dp),
      color = PlumSurface.copy(alpha = 0.96f),
      border = BorderStroke(1.5.dp, AmberGold.copy(alpha = 0.75f)),
      shadowElevation = 14.dp
    ) {
      Column(
        modifier = Modifier
          .fillMaxHeight()
          .padding(10.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        // Drawer Header
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
          ) {
            Icon(Icons.Filled.Build, contentDescription = null, tint = AmberGold, modifier = Modifier.size(18.dp))
            Text("SANDBOX STUDIO", style = MaterialTheme.typography.titleSmall, color = AmberGold)
          }
          HudIconChip(
            onClick = onClose,
            icon = Icons.Filled.Close,
            contentDescription = "Đóng Sandbox",
            modifier = Modifier.testTag("sandbox_close_btn")
          )
        }

        // 3 Compact Tabs
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          val tabs = listOf("Sun & CD", "Triệu Hồi", "Tiện Ích")
          tabs.forEachIndexed { index, title ->
            val selected = activeTab == index
            Surface(
              modifier = Modifier
                .weight(1f)
                .minimumInteractiveComponentSize()
                .clip(RoundedCornerShape(8.dp))
                .clickable { activeTab = index }
                .testTag("sandbox_tab_$index"),
              color = if (selected) AmberDeep else PlumSurfaceElevated,
              border = BorderStroke(1.dp, if (selected) AmberGold else BorderSubtle),
              shape = RoundedCornerShape(8.dp)
            ) {
              Box(
                modifier = Modifier.padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
              ) {
                Text(
                  text = title,
                  style = MaterialTheme.typography.labelSmall,
                  color = if (selected) TextPrimary else TextSecondary,
                  maxLines = 1,
                  overflow = TextOverflow.Ellipsis
                )
              }
            }
          }
        }

        when (activeTab) {
          0 -> {
            // Sun, Cooldown & Speed
            Column(
              modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
              verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              Text("Chỉnh Mặt Trời (Hiện tại: ${hud.sun})", style = MaterialTheme.typography.labelMedium, color = AmberGold)
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                SandboxQuickButton(
                  label = "+100 ☀",
                  onClick = { onAddSun(100) },
                  modifier = Modifier.weight(1f).testTag("sandbox_add_100")
                )
                SandboxQuickButton(
                  label = "+1000 ☀",
                  onClick = { onAddSun(1000) },
                  modifier = Modifier.weight(1f).testTag("sandbox_add_1000")
                )
                SandboxQuickButton(
                  label = "9999 ☀",
                  onClick = { onSetSun(9999) },
                  accent = AmberGold,
                  modifier = Modifier.weight(1f).testTag("sandbox_set_9999")
                )
              }

              Surface(
                shape = RoundedCornerShape(10.dp),
                color = PlumSurfaceCard,
                border = BorderStroke(1.dp, BorderSubtle)
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 6.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Column(modifier = Modifier.weight(1f)) {
                    Text("Hồi chiêu 0s", style = MaterialTheme.typography.labelLarge, color = ToxicLime)
                    Text("Trồng cây liên tục không cần chờ", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                  }
                  Switch(
                    checked = hud.sandboxNoCooldown,
                    onCheckedChange = { onToggleNoCooldown() },
                    modifier = Modifier.testTag("sandbox_no_cd_switch"),
                    colors = SwitchDefaults.colors(
                      checkedThumbColor = ObsidianBg,
                      checkedTrackColor = ToxicLime
                    )
                  )
                }
              }

              GothicActionButton(
                onClick = onToggleSpeed,
                modifier = Modifier.fillMaxWidth().testTag("sandbox_speed_btn"),
                containerColor = PlumSurfaceElevated,
                borderColor = BorderMauve
              ) {
                Icon(Icons.Filled.Speed, contentDescription = null, tint = AmberGold)
                Spacer(Modifier.width(6.dp))
                Text("Đổi Tốc Độ (Hiện tại: ${hud.gameSpeed}X)")
              }
            }
          }

          1 -> {
            // Spawn Zombies Tab
            Column(
              modifier = Modifier.weight(1f),
              verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Text("Chọn hàng xuất hiện:", style = MaterialTheme.typography.labelSmall, color = TextSecondary)
              Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
              ) {
                val rows = listOf(-1 to "Ngẫu", 0 to "H1", 1 to "H2", 2 to "H3", 3 to "H4", 4 to "H5")
                rows.forEach { (rowIdx, label) ->
                  val active = selectedRow == rowIdx
                  Surface(
                    modifier = Modifier
                      .weight(1f)
                      .defaultMinSize(minHeight = 36.dp)
                      .clip(RoundedCornerShape(6.dp))
                      .clickable { selectedRow = rowIdx },
                    color = if (active) CrimsonDark else PlumSurfaceElevated,
                    border = BorderStroke(1.dp, if (active) CrimsonSoul else BorderSubtle),
                    shape = RoundedCornerShape(6.dp)
                  ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 6.dp)) {
                      Text(
                        text = label,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (active) TextPrimary else TextSecondary
                      )
                    }
                  }
                }
              }

              LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(vertical = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                items(PvzCatalog.zombies, key = { it.id }) { zombie ->
                  Surface(
                    modifier = Modifier
                      .fillMaxWidth()
                      .minimumInteractiveComponentSize()
                      .clip(RoundedCornerShape(8.dp))
                      .clickable { onSpawnZombie(zombie.id, selectedRow) }
                      .testTag("sandbox_spawn_${zombie.id}"),
                    color = if (zombie.isBoss) CrimsonDark.copy(alpha = 0.55f) else PlumSurfaceCard,
                    border = BorderStroke(1.dp, if (zombie.isBoss) CrimsonSoul else BorderSubtle),
                    shape = RoundedCornerShape(8.dp)
                  ) {
                    Row(
                      modifier = Modifier.padding(horizontal = 8.dp, vertical = 7.dp),
                      verticalAlignment = Alignment.CenterVertically,
                      horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                      Text(zombie.avatarEmoji, style = MaterialTheme.typography.titleMedium)
                      Text(
                        text = zombie.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextPrimary,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                      )
                    }
                  }
                }
              }
            }
          }

          else -> {
            // Board Cleanup & Reset Utilities
            Column(
              modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState()),
              verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
              GothicActionButton(
                onClick = onClearZombies,
                modifier = Modifier.fillMaxWidth().testTag("sandbox_clear_zombies_btn"),
                containerColor = CrimsonDark,
                borderColor = CrimsonSoul
              ) {
                Icon(Icons.Filled.DeleteSweep, contentDescription = null)
                Spacer(Modifier.width(6.dp))
                Text("Xóa Tất Cả Zombie")
              }

              GothicActionButton(
                onClick = onClearAll,
                modifier = Modifier.fillMaxWidth().testTag("sandbox_clear_all_btn"),
                containerColor = PlumSurfaceElevated,
                borderColor = CrimsonSoul
              ) {
                Icon(Icons.Filled.DeleteSweep, contentDescription = null, tint = CrimsonSoul)
                Spacer(Modifier.width(6.dp))
                Text("Dọn Sạch Sân (Cây + Zombie)")
              }

              GothicActionButton(
                onClick = onResetMatch,
                modifier = Modifier.fillMaxWidth().testTag("sandbox_reset_btn"),
                containerColor = PlumSurfaceElevated,
                borderColor = AmberGold
              ) {
                Icon(Icons.Filled.RestartAlt, contentDescription = null, tint = AmberGold)
                Spacer(Modifier.width(6.dp))
                Text("Chơi Lại Sandbox")
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun SandboxQuickButton(
  label: String,
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  accent: Color = ToxicLime
) {
  Surface(
    modifier = modifier
      .minimumInteractiveComponentSize()
      .height(44.dp)
      .clip(RoundedCornerShape(8.dp))
      .clickable(onClick = onClick),
    color = ToxicForest.copy(alpha = 0.4f),
    border = BorderStroke(1.dp, accent),
    shape = RoundedCornerShape(8.dp)
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 6.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.Center
    ) {
      Icon(Icons.Filled.WbSunny, contentDescription = null, tint = AmberGold, modifier = Modifier.size(14.dp))
      Spacer(Modifier.width(3.dp))
      Text(
        text = label,
        style = MaterialTheme.typography.labelSmall,
        color = TextPrimary,
        textAlign = TextAlign.Center,
        maxLines = 1
      )
    }
  }
}
