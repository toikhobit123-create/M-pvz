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
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.model.PvzCatalog
import com.example.ui.components.HudIconChip
import com.example.ui.components.PlantIconView
import com.example.ui.theme.AmberGold
import com.example.ui.theme.BorderMauve
import com.example.ui.theme.BorderSubtle
import com.example.ui.theme.CrimsonDark
import com.example.ui.theme.CrimsonSoul
import com.example.ui.theme.IceCyan
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.PlumSurface
import com.example.ui.theme.PlumSurfaceCard
import com.example.ui.theme.PlumSurfaceElevated
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.ToxicForest
import com.example.ui.theme.ToxicLime

@Composable
fun AlmanacModal(
  plantIcons: Map<String, ImageBitmap>,
  respectCutoutInsets: Boolean,
  onDismiss: () -> Unit
) {
  var showPlants by remember { mutableStateOf(true) }
  var selectedPlantId by remember { mutableStateOf(PvzCatalog.plants.first().id) }
  var selectedZombieId by remember { mutableStateOf(PvzCatalog.zombies.first().id) }

  val insetsModifier = if (respectCutoutInsets) {
    Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
  } else {
    Modifier
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBg.copy(alpha = 0.86f))
      .then(insetsModifier)
      .padding(horizontal = 16.dp, vertical = 12.dp),
    contentAlignment = Alignment.Center
  ) {
    Surface(
      modifier = Modifier.fillMaxSize(),
      shape = RoundedCornerShape(16.dp),
      color = PlumSurface,
      border = BorderStroke(1.6.dp, BorderMauve),
      shadowElevation = 14.dp
    ) {
      Column(modifier = Modifier.fillMaxSize()) {
        // Header with Tabs & Close
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .background(PlumSurfaceElevated)
            .padding(horizontal = 14.dp, vertical = 8.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            HudIconChip(
              onClick = { showPlants = true },
              icon = Icons.Filled.Eco,
              contentDescription = "Thực vật",
              label = "Cây Trồng (${PvzCatalog.plants.size})",
              containerColor = if (showPlants) ToxicForest else PlumSurface,
              borderColor = if (showPlants) ToxicLime else BorderSubtle,
              tint = if (showPlants) ToxicLime else TextSecondary,
              modifier = Modifier.testTag("almanac_tab_plants")
            )
            HudIconChip(
              onClick = { showPlants = false },
              icon = Icons.Filled.Warning,
              contentDescription = "Xác sống",
              label = "Xác Sống (${PvzCatalog.zombies.size})",
              containerColor = if (!showPlants) CrimsonDark else PlumSurface,
              borderColor = if (!showPlants) CrimsonSoul else BorderSubtle,
              tint = if (!showPlants) TextPrimary else TextSecondary,
              modifier = Modifier.testTag("almanac_tab_zombies")
            )
          }

          HudIconChip(
            onClick = onDismiss,
            icon = Icons.Filled.Close,
            contentDescription = "Đóng từ điển",
            label = "Đóng",
            modifier = Modifier.testTag("almanac_close_btn")
          )
        }

        // Body 2-Pane Split
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .padding(12.dp),
          horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
          // Grid Pane
          LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 84.dp),
            modifier = Modifier
              .weight(1.1f)
              .fillMaxHeight(),
            contentPadding = PaddingValues(2.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            if (showPlants) {
              items(PvzCatalog.plants, key = { it.id }) { plant ->
                val isSelected = selectedPlantId == plant.id
                Column(
                  modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSelected) Color(0xFF1B3846) else PlumSurfaceElevated)
                    .border(
                      width = if (isSelected) 1.6.dp else 1.dp,
                      color = if (isSelected) IceCyan else BorderSubtle,
                      shape = RoundedCornerShape(10.dp)
                    )
                    .minimumInteractiveComponentSize()
                    .clickable { selectedPlantId = plant.id }
                    .padding(8.dp),
                  horizontalAlignment = Alignment.CenterHorizontally,
                  verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                  PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 38.dp)
                  Text(
                    text = plant.shortName,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                  )
                  Text(
                    text = "${plant.cost} ☀",
                    style = MaterialTheme.typography.labelSmall,
                    color = AmberGold
                  )
                }
              }
            } else {
              items(PvzCatalog.zombies, key = { it.id }) { zombie ->
                val isSelected = selectedZombieId == zombie.id
                Column(
                  modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (isSelected) Color(0xFF341621) else PlumSurfaceElevated)
                    .border(
                      width = if (isSelected) 1.6.dp else 1.dp,
                      color = if (isSelected) CrimsonSoul else BorderSubtle,
                      shape = RoundedCornerShape(10.dp)
                    )
                    .minimumInteractiveComponentSize()
                    .clickable { selectedZombieId = zombie.id }
                    .padding(8.dp),
                  horizontalAlignment = Alignment.CenterHorizontally,
                  verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                  Text(text = zombie.avatarEmoji, style = MaterialTheme.typography.headlineSmall)
                  Text(
                    text = zombie.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                  )
                  Text(
                    text = if (zombie.isBoss) "BOSS" else "ZOMBIE",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (zombie.isBoss) AmberGold else CrimsonSoul
                  )
                }
              }
            }
          }

          // Detail Pane
          Surface(
            modifier = Modifier
              .weight(0.95f)
              .fillMaxHeight(),
            shape = RoundedCornerShape(12.dp),
            color = PlumSurfaceCard,
            border = BorderStroke(1.2.dp, BorderSubtle)
          ) {
            Column(
              modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(14.dp),
              verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              if (showPlants) {
                val plant = PvzCatalog.plantById[selectedPlantId] ?: PvzCatalog.plants.first()
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(64.dp)
                      .clip(RoundedCornerShape(12.dp))
                      .background(ObsidianBg)
                      .border(1.5.dp, plant.accentColor, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                  ) {
                    PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 50.dp)
                  }
                  Column {
                    Text(plant.fullName, style = MaterialTheme.typography.titleMedium, color = ToxicLime)
                    Text("Nhóm: ${plant.group}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                  }
                }

                AlmanacStatGrid(
                  stats = listOf(
                    "Chi phí Sun" to "${plant.cost} ☀",
                    "Hồi chiêu" to plant.cooldownText,
                    "Độ bền (HP)" to plant.hpText,
                    "Sát thương" to plant.damageText,
                    "Tốc độ đánh" to plant.rateText
                  )
                )

                Surface(
                  color = ObsidianBg.copy(alpha = 0.5f),
                  shape = RoundedCornerShape(10.dp),
                  border = BorderStroke(1.dp, BorderSubtle)
                ) {
                  Text(
                    text = plant.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    modifier = Modifier.padding(10.dp)
                  )
                }
              } else {
                val zombie = PvzCatalog.zombieById[selectedZombieId] ?: PvzCatalog.zombies.first()
                Row(
                  verticalAlignment = Alignment.CenterVertically,
                  horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                  Box(
                    modifier = Modifier
                      .size(64.dp)
                      .clip(RoundedCornerShape(12.dp))
                      .background(ObsidianBg)
                      .border(1.5.dp, if (zombie.isBoss) CrimsonSoul else BorderMauve, RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                  ) {
                    Text(zombie.avatarEmoji, style = MaterialTheme.typography.displaySmall)
                  }
                  Column {
                    Text(zombie.name, style = MaterialTheme.typography.titleMedium, color = if (zombie.isBoss) AmberGold else CrimsonSoul)
                    Text(
                      if (zombie.isBoss) "Trùm Cuối Hắc Ám" else "Quân Đoàn Xác Sống",
                      style = MaterialTheme.typography.bodySmall,
                      color = TextSecondary
                    )
                  }
                }

                AlmanacStatGrid(
                  stats = listOf(
                    "Máu & Giáp" to zombie.hpText,
                    "Tốc độ" to zombie.speedText,
                    "Sát thương" to zombie.damageText
                  )
                )

                Surface(
                  color = ObsidianBg.copy(alpha = 0.5f),
                  shape = RoundedCornerShape(10.dp),
                  border = BorderStroke(1.dp, BorderSubtle)
                ) {
                  Text(
                    text = zombie.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    modifier = Modifier.padding(10.dp)
                  )
                }
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun AlmanacStatGrid(stats: List<Pair<String, String>>) {
  Column(
    modifier = Modifier
      .fillMaxWidth()
      .clip(RoundedCornerShape(10.dp))
      .background(ObsidianBg.copy(alpha = 0.45f))
      .border(1.dp, BorderSubtle, RoundedCornerShape(10.dp))
      .padding(10.dp),
    verticalArrangement = Arrangement.spacedBy(6.dp)
  ) {
    stats.chunked(2).forEach { pair ->
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        pair.forEach { (label, value) ->
          Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
            Text(value, style = MaterialTheme.typography.bodySmall, color = AmberGold)
          }
        }
      }
    }
  }
}
