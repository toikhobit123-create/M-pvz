package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val PvzDarkColorScheme = darkColorScheme(
  primary = CrimsonSoul,
  onPrimary = TextPrimary,
  primaryContainer = CrimsonDark,
  onPrimaryContainer = TextPrimary,
  secondary = ToxicLime,
  onSecondary = ObsidianBg,
  secondaryContainer = ToxicForest,
  onSecondaryContainer = TextPrimary,
  tertiary = AmberGold,
  onTertiary = ObsidianBg,
  background = ObsidianBg,
  onBackground = TextPrimary,
  surface = PlumSurface,
  onSurface = TextPrimary,
  surfaceVariant = PlumSurfaceElevated,
  onSurfaceVariant = TextSecondary,
  outline = BorderMauve,
  outlineVariant = BorderSubtle,
  error = CrimsonSoft
)

@Composable
fun MyApplicationTheme(
  content: @Composable () -> Unit,
) {
  MaterialTheme(
    colorScheme = PvzDarkColorScheme,
    typography = Typography,
    content = content
  )
}
