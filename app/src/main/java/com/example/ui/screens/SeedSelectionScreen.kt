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
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AutoFixHigh
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.WbSunny
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.model.PlantCatalogItem
import com.example.model.PvzCatalog
import com.example.ui.components.GothicActionButton
import com.example.ui.components.HudIconChip
import com.example.ui.components.PlantIconView
import com.example.ui.theme.AmberDeep
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
fun SeedSelectionScreen(
  level: Int,
  selectedDeck: List<String>,
  plantIcons: Map<String, ImageBitmap>,
  respectCutoutInsets: Boolean,
  onTogglePlant: (String) -> Unit,
  onRemovePlant: (String) -> Unit,
  onAutoPick: () -> Unit,
  onClearDeck: () -> Unit,
  onStartBattle: () -> Unit,
  onBackToMap: () -> Unit
) {
  val levelInfo = remember(level) {
    PvzCatalog.levels.find { it.level == level } ?: PvzCatalog.levels.first()
  }
  var previewPlantId by remember { mutableStateOf(selectedDeck.firstOrNull() ?: "peashooter") }
  val previewPlant = PvzCatalog.plantById[previewPlantId] ?: PvzCatalog.plants.first()

  val insetsModifier = if (respectCutoutInsets) {
    Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
  } else {
    Modifier
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(Brush.verticalGradient(listOf(Color(0xFF171122), ObsidianBg)))
      .then(insetsModifier)
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 12.dp, vertical = 8.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      // Top Header
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(10.dp),
          modifier = Modifier.weight(1f)
        ) {
          HudIconChip(
            onClick = onBackToMap,
            icon = Icons.AutoMirrored.Filled.ArrowBack,
            contentDescription = "Quay lại bản đồ",
            label = "Bản Đồ",
            modifier = Modifier.testTag("seed_back_to_map_btn")
          )
          Column {
            Text(
              text = "CẤP ${levelInfo.level}: ${levelInfo.title.uppercase()}",
              style = MaterialTheme.typography.titleMedium,
              color = AmberGold,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis
            )
            Text(
              text = levelInfo.subtitle,
              style = MaterialTheme.typography.bodySmall,
              color = TextSecondary,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis
            )
          }
        }

        Surface(
          color = PlumSurfaceElevated,
          shape = RoundedCornerShape(10.dp),
          border = BorderStroke(1.2.dp, if (selectedDeck.size == 7) ToxicLime else AmberGold)
        ) {
          Text(
            text = "ĐỘI HÌNH: ${selectedDeck.size} / 7",
            style = MaterialTheme.typography.labelLarge,
            color = if (selectedDeck.size == 7) ToxicLime else AmberGold,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
          )
        }
      }

      // Main 3-Pane Landscape Studio
      Row(
        modifier = Modifier
          .fillMaxWidth()
          .weight(1f),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
      ) {
        // Pane 1 (Left): Selected 7 Deck Slots
        Surface(
          modifier = Modifier
            .width(92.dp)
            .fillMaxHeight(),
          shape = RoundedCornerShape(12.dp),
          color = PlumSurface.copy(alpha = 0.92f),
          border = BorderStroke(1.2.dp, BorderSubtle)
        ) {
          LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(6.dp),
            verticalArrangement = Arrangement.spacedBy(5.dp)
          ) {
            items(7) { index ->
              val plantId = selectedDeck.getOrNull(index)
              val plant = plantId?.let { PvzCatalog.plantById[it] }
              if (plant != null) {
                Box(
                  modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(ToxicForest.copy(alpha = 0.35f))
                    .border(1.2.dp, ToxicLime.copy(alpha = 0.8f), RoundedCornerShape(8.dp))
                    .clickable {
                      previewPlantId = plant.id
                      onRemovePlant(plant.id)
                    }
                    .padding(horizontal = 4.dp)
                    .testTag("deck_slot_${index}"),
                  contentAlignment = Alignment.Center
                ) {
                  Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                  ) {
                    PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 30.dp)
                    Column {
                      Text(
                        text = "${plant.cost}",
                        style = MaterialTheme.typography.labelSmall,
                        color = AmberGold
                      )
                      Icon(
                        imageVector = Icons.Filled.Close,
                        contentDescription = "Gỡ ${plant.shortName}",
                        tint = CrimsonSoul,
                        modifier = Modifier.size(12.dp)
                      )
                    }
                  }
                }
              } else {
                Box(
                  modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(ObsidianBg.copy(alpha = 0.55f))
                    .border(1.dp, BorderSubtle, RoundedCornerShape(8.dp)),
                  contentAlignment = Alignment.Center
                ) {
                  Text(
                    text = "+ Ô ${index + 1}",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary.copy(alpha = 0.6f)
                  )
                }
              }
            }
          }
        }

        // Pane 2 (Center): Plant Showcase Strip + 20-Plant Pool + Quick Tools
        Column(
          modifier = Modifier
            .weight(1f)
            .fillMaxHeight(),
          verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          // Showcase Banner
          PlantShowcaseStrip(
            plant = previewPlant,
            inDeck = selectedDeck.contains(previewPlant.id),
            plantIcons = plantIcons,
            onToggleDeck = { onTogglePlant(previewPlant.id) }
          )

          // 20-Plant Selection Grid
          Surface(
            modifier = Modifier
              .fillMaxWidth()
              .weight(1f),
            shape = RoundedCornerShape(12.dp),
            color = PlumSurface.copy(alpha = 0.85f),
            border = BorderStroke(1.2.dp, BorderSubtle)
          ) {
            LazyVerticalGrid(
              columns = GridCells.Adaptive(minSize = 66.dp),
              contentPadding = PaddingValues(6.dp),
              horizontalArrangement = Arrangement.spacedBy(5.dp),
              verticalArrangement = Arrangement.spacedBy(5.dp)
            ) {
              items(PvzCatalog.plants, key = { it.id }) { plant ->
                val inDeck = selectedDeck.contains(plant.id)
                val isPreview = previewPlantId == plant.id
                val border = when {
                  isPreview -> IceCyan
                  inDeck -> ToxicLime
                  else -> BorderSubtle
                }
                Box(
                  modifier = Modifier
                    .defaultMinSize(minHeight = 58.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(
                      if (inDeck) ToxicForest.copy(alpha = 0.35f) else PlumSurfaceElevated
                    )
                    .border(if (isPreview || inDeck) 1.6.dp else 1.dp, border, RoundedCornerShape(8.dp))
                    .clickable {
                      previewPlantId = plant.id
                      onTogglePlant(plant.id)
                    }
                    .padding(4.dp)
                    .testTag("pool_plant_${plant.id}")
                ) {
                  Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(2.dp)
                  ) {
                    PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 30.dp)
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
                  if (inDeck) {
                    Box(
                      modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(ToxicLime),
                      contentAlignment = Alignment.Center
                    ) {
                      Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = "Đã chọn",
                        tint = ObsidianBg,
                        modifier = Modifier.size(11.dp)
                      )
                    }
                  }
                }
              }
            }
          }

          // Quick Deck Tools
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            HudIconChip(
              onClick = onAutoPick,
              icon = Icons.Filled.AutoFixHigh,
              contentDescription = "Tự động chọn đội hình",
              label = "Tự Động Chọn",
              tint = ToxicLime,
              modifier = Modifier.testTag("btn_auto_pick_deck")
            )
            HudIconChip(
              onClick = onClearDeck,
              icon = Icons.Filled.DeleteSweep,
              contentDescription = "Xóa hết đội hình",
              label = "Xóa Hết",
              tint = CrimsonSoul,
              modifier = Modifier.testTag("btn_clear_deck")
            )
          }
        }

        // Pane 3 (Right): Upcoming Zombies + Tactical Tip + Let's Rock CTA
        Column(
          modifier = Modifier
            .width(220.dp)
            .fillMaxHeight(),
          verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Surface(
            modifier = Modifier
              .fillMaxWidth()
              .weight(1f),
            shape = RoundedCornerShape(12.dp),
            color = PlumSurface.copy(alpha = 0.92f),
            border = BorderStroke(1.2.dp, BorderSubtle)
          ) {
            Column(
              modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
              verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
              Text(
                text = "ZOMBIE SẮP TỚI",
                style = MaterialTheme.typography.labelLarge,
                color = CrimsonSoul
              )

              LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(5.dp)
              ) {
                items(levelInfo.zombieIds) { zId ->
                  val zombie = PvzCatalog.zombieById[zId]
                  if (zombie != null) {
                    Surface(
                      shape = RoundedCornerShape(8.dp),
                      color = if (zombie.isBoss) CrimsonDark.copy(alpha = 0.45f) else PlumSurfaceElevated,
                      border = BorderStroke(1.dp, if (zombie.isBoss) CrimsonSoul else BorderSubtle)
                    ) {
                      Row(
                        modifier = Modifier
                          .fillMaxWidth()
                          .padding(horizontal = 8.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                      ) {
                        Text(text = zombie.avatarEmoji, style = MaterialTheme.typography.titleMedium)
                        Column(modifier = Modifier.weight(1f)) {
                          Text(
                            text = zombie.name,
                            style = MaterialTheme.typography.labelSmall,
                            color = TextPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                          )
                          Text(
                            text = zombie.hpText,
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFFFF8A80),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                          )
                        }
                      }
                    }
                  }
                }
              }

              Surface(
                color = Color(0xFF1A2242),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, Color(0xFF3F51B5))
              ) {
                Text(
                  text = "Mẹo: ${levelInfo.tacticalTip}",
                  style = MaterialTheme.typography.bodySmall,
                  color = Color(0xFFE8EAF6),
                  maxLines = 3,
                  overflow = TextOverflow.Ellipsis,
                  modifier = Modifier.padding(6.dp)
                )
              }
            }
          }

          GothicActionButton(
            onClick = onStartBattle,
            modifier = Modifier
              .fillMaxWidth()
              .testTag("btn_lets_rock"),
            containerColor = AmberDeep,
            borderColor = AmberGold
          ) {
            Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(6.dp))
            Text("VÀO TRẬN!", style = MaterialTheme.typography.labelLarge)
          }
        }
      }
    }
  }
}

@Composable
private fun PlantShowcaseStrip(
  plant: PlantCatalogItem,
  inDeck: Boolean,
  plantIcons: Map<String, ImageBitmap>,
  onToggleDeck: () -> Unit
) {
  Surface(
    modifier = Modifier.fillMaxWidth(),
    shape = RoundedCornerShape(12.dp),
    color = PlumSurfaceCard,
    border = BorderStroke(1.2.dp, BorderMauve)
  ) {
    Row(
      modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Box(
        modifier = Modifier
          .size(46.dp)
          .clip(RoundedCornerShape(10.dp))
          .background(ObsidianBg)
          .border(1.dp, plant.accentColor.copy(alpha = 0.7f), RoundedCornerShape(10.dp)),
        contentAlignment = Alignment.Center
      ) {
        PlantIconView(plantId = plant.id, plantIcons = plantIcons, size = 38.dp)
      }

      Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
          Text(
            text = plant.fullName,
            style = MaterialTheme.typography.titleSmall,
            color = TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
          Surface(color = AmberDeep, shape = RoundedCornerShape(6.dp)) {
            Row(
              modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              Icon(Icons.Filled.WbSunny, contentDescription = null, tint = AmberGold, modifier = Modifier.size(11.dp))
              Spacer(Modifier.width(2.dp))
              Text("${plant.cost}", style = MaterialTheme.typography.labelSmall, color = TextPrimary)
            }
          }
        }
        Text(
          text = plant.description,
          style = MaterialTheme.typography.bodySmall,
          color = TextSecondary,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis
        )
        Text(
          text = "${plant.damageText} · ${plant.rateText} · Hồi ${plant.cooldownText}",
          style = MaterialTheme.typography.labelSmall,
          color = AmberGold,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis
        )
      }

      Surface(
        modifier = Modifier
          .minimumInteractiveComponentSize()
          .clip(RoundedCornerShape(8.dp))
          .clickable(onClick = onToggleDeck)
          .testTag("showcase_toggle_btn"),
        color = if (inDeck) CrimsonDark else ToxicForest,
        border = BorderStroke(1.dp, if (inDeck) CrimsonSoul else ToxicLime),
        shape = RoundedCornerShape(8.dp)
      ) {
        Row(
          modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
          Icon(
            imageVector = if (inDeck) Icons.Filled.Close else Icons.Filled.Add,
            contentDescription = null,
            tint = TextPrimary,
            modifier = Modifier.size(16.dp)
          )
          Text(
            text = if (inDeck) "Bỏ" else "Chọn",
            style = MaterialTheme.typography.labelLarge,
            color = TextPrimary
          )
        }
      }
    }
  }
}
