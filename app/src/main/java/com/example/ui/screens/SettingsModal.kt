package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.model.CampaignProgress
import com.example.model.GameSettings
import com.example.ui.components.GothicActionButton
import com.example.ui.components.HudIconChip
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
import com.example.ui.theme.ToxicLime
import kotlin.math.roundToInt

@Composable
fun SettingsModal(
  settings: GameSettings,
  progress: CampaignProgress,
  onUpdateSettings: (GameSettings) -> Unit,
  onResetProgress: () -> Unit,
  onDismiss: () -> Unit
) {
  var showResetConfirm by remember { mutableStateOf(false) }

  val insetsModifier = if (settings.respectCutoutInsets) {
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
        // Header
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .background(PlumSurfaceElevated)
            .padding(horizontal = 16.dp, vertical = 10.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically
        ) {
          Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Icon(Icons.Filled.Settings, contentDescription = null, tint = AmberGold)
            Text(
              text = "CÀI ĐẶT, ĐIỀU KHIỂN & DỮ LIỆU LƯU",
              style = MaterialTheme.typography.titleMedium,
              color = AmberGold
            )
          }

          HudIconChip(
            onClick = onDismiss,
            icon = Icons.Filled.Close,
            contentDescription = "Đóng cài đặt",
            label = "Đóng",
            modifier = Modifier.testTag("settings_close_btn")
          )
        }

        // 2-Column Landscape Content
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .weight(1f)
            .padding(14.dp),
          horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
          // Column 1: Audio Settings
          Surface(
            modifier = Modifier
              .weight(1f)
              .fillMaxHeight(),
            shape = RoundedCornerShape(12.dp),
            color = PlumSurfaceCard,
            border = BorderStroke(1.dp, BorderSubtle)
          ) {
            Column(
              modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(14.dp),
              verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Icon(Icons.Filled.VolumeUp, contentDescription = null, tint = ToxicLime)
                Text("Âm Thanh (Web Audio Synth)", style = MaterialTheme.typography.titleSmall, color = ToxicLime)
              }

              SettingSwitchRow(
                title = "Tắt toàn bộ âm thanh (Mute)",
                subtitle = "Ngắt cả nhạc nền và hiệu ứng chiến đấu",
                checked = settings.isMuted,
                onCheckedChange = { onUpdateSettings(settings.copy(isMuted = it)) },
                testTag = "settings_mute_switch"
              )

              VolumeSliderRow(
                label = "Âm lượng tổng (Master)",
                value = settings.masterVolume,
                enabled = !settings.isMuted,
                onValueChange = { onUpdateSettings(settings.copy(masterVolume = it)) }
              )

              VolumeSliderRow(
                label = "Nhạc nền (BGM)",
                value = settings.bgmVolume,
                enabled = !settings.isMuted,
                onValueChange = { onUpdateSettings(settings.copy(bgmVolume = it)) }
              )

              VolumeSliderRow(
                label = "Hiệu ứng chiến đấu (SFX)",
                value = settings.sfxVolume,
                enabled = !settings.isMuted,
                onValueChange = { onUpdateSettings(settings.copy(sfxVolume = it)) }
              )
            }
          }

          // Column 2: Controls, Landscape Layout & Save Data
          Surface(
            modifier = Modifier
              .weight(1f)
              .fillMaxHeight(),
            shape = RoundedCornerShape(12.dp),
            color = PlumSurfaceCard,
            border = BorderStroke(1.dp, BorderSubtle)
          ) {
            Column(
              modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(14.dp),
              verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
              Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
              ) {
                Icon(Icons.Filled.Speed, contentDescription = null, tint = AmberGold)
                Text("Điều Khiển & Bố Cục Ngang", style = MaterialTheme.typography.titleSmall, color = AmberGold)
              }

              // Default Game Speed
              Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Tốc độ mặc định vào trận", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                  SegmentedButton(
                    selected = settings.defaultSpeed == 1,
                    onClick = { onUpdateSettings(settings.copy(defaultSpeed = 1)) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                    colors = SegmentedButtonDefaults.colors(
                      activeContainerColor = CrimsonDark,
                      activeContentColor = TextPrimary
                    )
                  ) {
                    Text("1X Tiêu Chuẩn")
                  }
                  SegmentedButton(
                    selected = settings.defaultSpeed == 2,
                    onClick = { onUpdateSettings(settings.copy(defaultSpeed = 2)) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                    colors = SegmentedButtonDefaults.colors(
                      activeContainerColor = CrimsonDark,
                      activeContentColor = TextPrimary
                    )
                  ) {
                    Text("2X Nhanh")
                  }
                }
              }

              // HUD Side selector
              Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Vị trí thanh chọn cây (HUD)", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                  SegmentedButton(
                    selected = !settings.hudOnRight,
                    onClick = { onUpdateSettings(settings.copy(hudOnRight = false)) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                    colors = SegmentedButtonDefaults.colors(
                      activeContainerColor = CrimsonDark,
                      activeContentColor = TextPrimary
                    )
                  ) {
                    Text("Cạnh Trái (Mặc định)")
                  }
                  SegmentedButton(
                    selected = settings.hudOnRight,
                    onClick = { onUpdateSettings(settings.copy(hudOnRight = true)) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                    colors = SegmentedButtonDefaults.colors(
                      activeContainerColor = CrimsonDark,
                      activeContentColor = TextPrimary
                    )
                  ) {
                    Text("Cạnh Phải (Ngón Cái)")
                  }
                }
              }

              SettingSwitchRow(
                title = "Hỏi xác nhận trước khi Xẻng nhổ cây",
                subtitle = "Tránh nhổ nhầm cây chủ lực khi chạm màn hình",
                checked = settings.confirmShovel,
                onCheckedChange = { onUpdateSettings(settings.copy(confirmShovel = it)) },
                testTag = "settings_confirm_shovel_switch"
              )

              SettingSwitchRow(
                title = "Chừa vùng an toàn tai thỏ (Cutout)",
                subtitle = "Đẩy HUD ra khỏi camera đục lỗ và thanh cử chỉ",
                checked = settings.respectCutoutInsets,
                onCheckedChange = { onUpdateSettings(settings.copy(respectCutoutInsets = it)) },
                testTag = "settings_cutout_switch"
              )

              // Save Data Summary & Reset
              Surface(
                color = ObsidianBg.copy(alpha = 0.55f),
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, BorderSubtle)
              ) {
                Row(
                  modifier = Modifier
                    .fillMaxWidth()
                    .padding(10.dp),
                  horizontalArrangement = Arrangement.SpaceBetween,
                  verticalAlignment = Alignment.CenterVertically
                ) {
                  Column(modifier = Modifier.weight(1f)) {
                    Text("Dữ Liệu Lưu (DataStore)", style = MaterialTheme.typography.labelLarge, color = ToxicLime)
                    Text(
                      text = "Đã qua ${progress.completedLevels.size}/6 màn · Đội hình ${progress.selectedDeck.size} cây",
                      style = MaterialTheme.typography.bodySmall,
                      color = TextSecondary
                    )
                  }
                  GothicActionButton(
                    onClick = { showResetConfirm = true },
                    containerColor = CrimsonDark,
                    borderColor = CrimsonSoul,
                    modifier = Modifier.testTag("settings_reset_progress_btn")
                  ) {
                    Icon(Icons.Filled.DeleteForever, contentDescription = null)
                    Text("Đặt Lại")
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (showResetConfirm) {
    AlertDialog(
      onDismissRequest = { showResetConfirm = false },
      containerColor = PlumSurface,
      titleContentColor = AmberGold,
      textContentColor = TextPrimary,
      title = { Text("Xóa tiến trình chiến dịch?") },
      text = { Text("Thao tác này sẽ xóa toàn bộ sao hoàn thành các màn chơi đã lưu trong DataStore.") },
      confirmButton = {
        TextButton(
          onClick = {
            showResetConfirm = false
            onResetProgress()
          },
          colors = ButtonDefaults.textButtonColors(contentColor = CrimsonSoul)
        ) {
          Text("Xóa Tiến Trình")
        }
      },
      dismissButton = {
        TextButton(onClick = { showResetConfirm = false }) {
          Text("Hủy", color = TextSecondary)
        }
      }
    )
  }
}

@Composable
private fun VolumeSliderRow(
  label: String,
  value: Float,
  enabled: Boolean,
  onValueChange: (Float) -> Unit
) {
  Column {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Text(label, style = MaterialTheme.typography.bodySmall, color = if (enabled) TextPrimary else TextSecondary)
      Text("${(value * 100).roundToInt()}%", style = MaterialTheme.typography.labelSmall, color = AmberGold)
    }
    Slider(
      value = value,
      onValueChange = onValueChange,
      enabled = enabled,
      colors = SliderDefaults.colors(
        thumbColor = CrimsonSoul,
        activeTrackColor = CrimsonSoul,
        inactiveTrackColor = BorderSubtle
      )
    )
  }
}

@Composable
private fun SettingSwitchRow(
  title: String,
  subtitle: String,
  checked: Boolean,
  onCheckedChange: (Boolean) -> Unit,
  testTag: String
) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
  ) {
    Column(modifier = Modifier.weight(1f).padding(end = 8.dp)) {
      Text(title, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
      Text(subtitle, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
    }
    Switch(
      checked = checked,
      onCheckedChange = onCheckedChange,
      modifier = Modifier.testTag(testTag),
      colors = SwitchDefaults.colors(
        checkedThumbColor = ObsidianBg,
        checkedTrackColor = ToxicLime
      )
    )
  }
}
