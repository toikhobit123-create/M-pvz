package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.model.CampaignProgress
import com.example.ui.components.GothicActionButton
import com.example.ui.components.PlantIconView
import com.example.ui.theme.AmberDeep
import com.example.ui.theme.AmberGold
import com.example.ui.theme.BorderMauve
import com.example.ui.theme.CrimsonDark
import com.example.ui.theme.CrimsonSoul
import com.example.ui.theme.ObsidianBg
import com.example.ui.theme.PlumSurface
import com.example.ui.theme.PlumSurfaceElevated
import com.example.ui.theme.TextPrimary
import com.example.ui.theme.TextSecondary
import com.example.ui.theme.ToxicLime

@Composable
fun MainMenuScreen(
  progress: CampaignProgress,
  plantIcons: Map<String, ImageBitmap>,
  respectCutoutInsets: Boolean,
  onOpenWorldMap: () -> Unit,
  onQuickPlayLevel: (Int) -> Unit,
  onStartSandbox: () -> Unit,
  onOpenAlmanac: () -> Unit,
  onOpenSettings: () -> Unit
) {
  val nextLevel = (1..6).firstOrNull { !progress.completedLevels.contains(it) } ?: 6
  val insetsModifier = if (respectCutoutInsets) {
    Modifier.windowInsetsPadding(WindowInsets.safeDrawing)
  } else {
    Modifier
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBg)
  ) {
    // Full-bleed atmospheric artwork
    Image(
      painter = painterResource(id = R.drawable.img_menu_hero_1794675376210),
      contentDescription = "Dark Horror Graveyard",
      modifier = Modifier.fillMaxSize(),
      contentScale = ContentScale.Crop
    )

    // Scrim gradient for sharp text contrast in landscape split
    Box(
      modifier = Modifier
        .fillMaxSize()
        .background(
          Brush.horizontalGradient(
            colors = listOf(
              ObsidianBg.copy(alpha = 0.88f),
              ObsidianBg.copy(alpha = 0.62f),
              ObsidianBg.copy(alpha = 0.92f)
            )
          )
        )
    )

    Row(
      modifier = Modifier
        .fillMaxSize()
        .then(insetsModifier)
        .padding(horizontal = 20.dp, vertical = 14.dp),
      horizontalArrangement = Arrangement.spacedBy(20.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {
      // Left Hero Column
      Column(
        modifier = Modifier
          .weight(1.15f)
          .fillMaxHeight(),
        verticalArrangement = Arrangement.SpaceBetween
      ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Surface(
            color = CrimsonDark.copy(alpha = 0.85f),
            shape = RoundedCornerShape(50),
            border = BorderStroke(1.dp, CrimsonSoul)
          ) {
            Text(
              text = "DARK HORROR EDITION · LANDSCAPE",
              style = MaterialTheme.typography.labelSmall,
              color = TextPrimary,
              modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
            )
          }

          Text(
            text = "PLANTS VS. ZOMBIES",
            style = MaterialTheme.typography.displaySmall,
            color = TextPrimary,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
          )
          Text(
            text = "Chiến dịch bảo vệ ngôi nhà đêm hắc hóa · Lưới 9×5 · 21 Loại Cây",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
          )
        }

        // Campaign Progress & Saved Deck Preview Card
        Surface(
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(14.dp),
          color = PlumSurface.copy(alpha = 0.90f),
          border = BorderStroke(1.2.dp, BorderMauve)
        ) {
          Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Icon(
                  imageVector = Icons.Filled.Star,
                  contentDescription = null,
                  tint = AmberGold,
                  modifier = Modifier.size(18.dp)
                )
                Text(
                  text = "Tiến trình: ${progress.completedLevels.size}/6 màn hoàn thành",
                  style = MaterialTheme.typography.titleSmall,
                  color = AmberGold
                )
              }
              Text(
                text = "Đội hình đã lưu",
                style = MaterialTheme.typography.labelSmall,
                color = ToxicLime
              )
            }

            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.spacedBy(6.dp),
              verticalAlignment = Alignment.CenterVertically
            ) {
              progress.selectedDeck.take(7).forEach { plantId ->
                Box(
                  modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(PlumSurfaceElevated)
                    .border(1.dp, BorderMauve.copy(alpha = 0.7f), RoundedCornerShape(8.dp))
                    .padding(3.dp),
                  contentAlignment = Alignment.Center
                ) {
                  PlantIconView(
                    plantId = plantId,
                    plantIcons = plantIcons,
                    size = 28.dp
                  )
                }
              }
            }
          }
        }
      }

      // Right Action Rail
      Column(
        modifier = Modifier
          .weight(0.9f)
          .widthIn(max = 360.dp)
          .fillMaxHeight()
          .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterVertically)
      ) {
        GothicActionButton(
          onClick = { onQuickPlayLevel(nextLevel) },
          modifier = Modifier
            .fillMaxWidth()
            .testTag("btn_quick_play"),
          containerColor = CrimsonSoul,
          borderColor = Color(0xFFFF8A9B)
        ) {
          Icon(Icons.Filled.PlayArrow, contentDescription = null, modifier = Modifier.size(22.dp))
          Spacer(Modifier.width(8.dp))
          Text(
            text = if (progress.completedLevels.size >= 6) "ĐẠI CHIẾN TRÙM CẤP 6" else "CHƠI TIẾP CẤP $nextLevel",
            style = MaterialTheme.typography.labelLarge
          )
        }

        GothicActionButton(
          onClick = onOpenWorldMap,
          modifier = Modifier
            .fillMaxWidth()
            .testTag("btn_world_map"),
          containerColor = PlumSurfaceElevated,
          borderColor = ToxicLime
        ) {
          Icon(Icons.Filled.Map, contentDescription = null, tint = ToxicLime, modifier = Modifier.size(20.dp))
          Spacer(Modifier.width(8.dp))
          Text("BẢN ĐỒ CHIẾN DỊCH (6 CẤP)", color = TextPrimary)
        }

        GothicActionButton(
          onClick = onStartSandbox,
          modifier = Modifier
            .fillMaxWidth()
            .testTag("btn_sandbox_mode"),
          containerColor = AmberDeep,
          borderColor = AmberGold
        ) {
          Icon(Icons.Filled.Build, contentDescription = null, tint = AmberGold, modifier = Modifier.size(20.dp))
          Spacer(Modifier.width(8.dp))
          Text("SANDBOX (9999 SUN)", color = TextPrimary)
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          GothicActionButton(
            onClick = onOpenAlmanac,
            modifier = Modifier
              .weight(1f)
              .testTag("btn_open_almanac"),
            containerColor = PlumSurfaceElevated,
            borderColor = BorderMauve
          ) {
            Icon(Icons.Filled.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Từ Điển", maxLines = 1, overflow = TextOverflow.Ellipsis)
          }

          GothicActionButton(
            onClick = onOpenSettings,
            modifier = Modifier
              .weight(1f)
              .testTag("btn_open_settings"),
            containerColor = PlumSurfaceElevated,
            borderColor = BorderMauve
          ) {
            Icon(Icons.Filled.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(6.dp))
            Text("Cài Đặt", maxLines = 1, overflow = TextOverflow.Ellipsis)
          }
        }
      }
    }
  }
}
