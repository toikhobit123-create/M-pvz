package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RestartAlt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.model.MatchResult
import com.example.model.PvzCatalog
import com.example.model.ShovelConfirmRequest
import com.example.ui.components.GothicActionButton
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
import com.example.ui.theme.ToxicForest
import com.example.ui.theme.ToxicLime

@Composable
fun PauseOverlayModal(
  isSandbox: Boolean,
  currentLevel: Int,
  onResume: () -> Unit,
  onRestart: () -> Unit,
  onOpenSettings: () -> Unit,
  onOpenWorldMap: () -> Unit,
  onReturnToMenu: () -> Unit
) {
  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBg.copy(alpha = 0.80f))
      .clickable(
        interactionSource = remember { MutableInteractionSource() },
        indication = null,
        onClick = {}
      ),
    contentAlignment = Alignment.Center
  ) {
    Surface(
      modifier = Modifier
        .widthIn(min = 320.dp, max = 420.dp)
        .padding(16.dp),
      shape = RoundedCornerShape(16.dp),
      color = PlumSurface,
      border = BorderStroke(1.8.dp, BorderMauve),
      shadowElevation = 16.dp
    ) {
      Column(
        modifier = Modifier.padding(18.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          Icon(Icons.Filled.Pause, contentDescription = null, tint = AmberGold)
          Text(
            text = if (isSandbox) "TẠM DỪNG SANDBOX" else "TẠM DỪNG · CẤP $currentLevel",
            style = MaterialTheme.typography.titleMedium,
            color = AmberGold
          )
        }

        GothicActionButton(
          onClick = onResume,
          modifier = Modifier.fillMaxWidth().testTag("pause_resume_btn"),
          containerColor = ToxicForest,
          borderColor = ToxicLime
        ) {
          Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = ToxicLime)
          Spacer(Modifier.width(6.dp))
          Text("Tiếp Tục Chiến Đấu", color = TextPrimary)
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          GothicActionButton(
            onClick = onRestart,
            modifier = Modifier.weight(1f).testTag("pause_restart_btn"),
            containerColor = PlumSurfaceElevated,
            borderColor = AmberGold
          ) {
            Icon(Icons.Filled.RestartAlt, contentDescription = null, tint = AmberGold, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(4.dp))
            Text("Chơi Lại")
          }
          GothicActionButton(
            onClick = onOpenSettings,
            modifier = Modifier.weight(1f).testTag("pause_settings_btn"),
            containerColor = PlumSurfaceElevated,
            borderColor = BorderMauve
          ) {
            Icon(Icons.Filled.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(4.dp))
            Text("Cài Đặt")
          }
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          GothicActionButton(
            onClick = onOpenWorldMap,
            modifier = Modifier.weight(1f).testTag("pause_world_map_btn"),
            containerColor = PlumSurfaceElevated,
            borderColor = BorderMauve
          ) {
            Icon(Icons.Filled.Map, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(4.dp))
            Text("Bản Đồ")
          }
          GothicActionButton(
            onClick = onReturnToMenu,
            modifier = Modifier.weight(1f).testTag("pause_main_menu_btn"),
            containerColor = CrimsonDark,
            borderColor = CrimsonSoul
          ) {
            Icon(Icons.Filled.Home, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(4.dp))
            Text("Menu Chính")
          }
        }
      }
    }
  }
}

@Composable
fun MatchResultModal(
  result: MatchResult,
  onNextLevel: () -> Unit,
  onReplay: () -> Unit,
  onOpenWorldMap: () -> Unit
) {
  val accent = if (result.victory) AmberGold else CrimsonSoul
  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBg.copy(alpha = 0.84f))
      .clickable(
        interactionSource = remember { MutableInteractionSource() },
        indication = null,
        onClick = {}
      ),
    contentAlignment = Alignment.Center
  ) {
    Surface(
      modifier = Modifier
        .widthIn(min = 320.dp, max = 440.dp)
        .padding(16.dp),
      shape = RoundedCornerShape(16.dp),
      color = PlumSurface,
      border = BorderStroke(2.dp, accent),
      shadowElevation = 18.dp
    ) {
      Column(
        modifier = Modifier.padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(10.dp)
      ) {
        Icon(
          imageVector = if (result.victory) Icons.Filled.EmojiEvents else Icons.Filled.Warning,
          contentDescription = null,
          tint = accent,
          modifier = Modifier.size(44.dp)
        )

        Text(
          text = if (result.victory) "CHIẾN THẮNG CẤP ${result.level}!" else "THẤT BẠI · ZOMBIE ĐÃ VÀO NHÀ",
          style = MaterialTheme.typography.headlineSmall,
          color = accent,
          textAlign = TextAlign.Center
        )

        Text(
          text = if (result.victory) {
            if (result.level >= 6) "Chúc mừng! Bạn đã đánh bại Zombot Dark Dragon và bảo vệ toàn bộ khu vườn!"
            else "Tuyệt vời! Bạn đã đẩy lùi toàn bộ đợt tấn công ở Cấp ${result.level}."
          } else {
            "Đừng nản chí! Hãy điều chỉnh lại đội hình cây trồng hoặc tận dụng Plant Food đúng lúc."
          },
          style = MaterialTheme.typography.bodyMedium,
          color = TextSecondary,
          textAlign = TextAlign.Center
        )

        if (result.victory && result.level < 6) {
          GothicActionButton(
            onClick = onNextLevel,
            modifier = Modifier.fillMaxWidth().testTag("result_next_level_btn"),
            containerColor = AmberDeep,
            borderColor = AmberGold
          ) {
            Icon(Icons.Filled.PlayArrow, contentDescription = null)
            Spacer(Modifier.width(6.dp))
            Text("Tiến Tới Cấp ${result.level + 1}")
          }
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
          GothicActionButton(
            onClick = onReplay,
            modifier = Modifier.weight(1f).testTag("result_replay_btn"),
            containerColor = if (result.victory) PlumSurfaceElevated else CrimsonSoul,
            borderColor = if (result.victory) ToxicLime else Color(0xFFFF8A9B)
          ) {
            Icon(Icons.Filled.RestartAlt, contentDescription = null)
            Spacer(Modifier.width(4.dp))
            Text("Chơi Lại")
          }
          GothicActionButton(
            onClick = onOpenWorldMap,
            modifier = Modifier.weight(1f).testTag("result_world_map_btn"),
            containerColor = PlumSurfaceElevated,
            borderColor = BorderMauve
          ) {
            Icon(Icons.Filled.Map, contentDescription = null)
            Spacer(Modifier.width(4.dp))
            Text("Bản Đồ")
          }
        }
      }
    }
  }
}

@Composable
fun ShovelConfirmDialog(
  request: ShovelConfirmRequest,
  onConfirm: () -> Unit,
  onCancel: () -> Unit
) {
  val plantName = PvzCatalog.plantById[request.plantType]?.fullName ?: request.plantType
  AlertDialog(
    onDismissRequest = onCancel,
    containerColor = PlumSurface,
    titleContentColor = AmberGold,
    textContentColor = TextPrimary,
    title = { Text("Xác nhận nhổ cây?") },
    text = {
      Text("Bạn có chắc muốn dùng Xẻng nhổ $plantName ở Hàng ${request.row + 1}, Cột ${request.col + 1} không?")
    },
    confirmButton = {
      TextButton(
        onClick = onConfirm,
        modifier = Modifier.testTag("shovel_confirm_yes"),
        colors = ButtonDefaults.textButtonColors(contentColor = CrimsonSoul)
      ) {
        Text("Nhổ Cây")
      }
    },
    dismissButton = {
      TextButton(
        onClick = onCancel,
        modifier = Modifier.testTag("shovel_confirm_no")
      ) {
        Text("Giữ Lại", color = TextSecondary)
      }
    }
  )
}
