package com.example.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.minimumInteractiveComponentSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.model.PvzCatalog
import com.example.ui.theme.BorderMauve
import com.example.ui.theme.PlumSurfaceCard
import com.example.ui.theme.PlumSurfaceElevated
import com.example.ui.theme.TextPrimary

@Composable
fun PlantIconView(
  plantId: String,
  plantIcons: Map<String, ImageBitmap>,
  modifier: Modifier = Modifier,
  size: Dp = 36.dp
) {
  val bitmap = plantIcons[plantId]
  val plant = PvzCatalog.plantById[plantId]
  val accent = plant?.accentColor ?: MaterialTheme.colorScheme.secondary

  Box(
    modifier = modifier.size(size),
    contentAlignment = Alignment.Center
  ) {
    if (bitmap != null) {
      Image(
        bitmap = bitmap,
        contentDescription = plant?.fullName ?: plantId,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Fit
      )
    } else {
      Box(
        modifier = Modifier
          .fillMaxSize()
          .clip(RoundedCornerShape(8.dp))
          .background(accent.copy(alpha = 0.2f)),
        contentAlignment = Alignment.Center
      ) {
        Icon(
          imageVector = Icons.Filled.Eco,
          contentDescription = plant?.fullName ?: plantId,
          tint = accent,
          modifier = Modifier.size(size * 0.65f)
        )
      }
    }
  }
}

@Composable
fun GothicActionButton(
  onClick: () -> Unit,
  modifier: Modifier = Modifier,
  containerColor: Color = MaterialTheme.colorScheme.primary,
  borderColor: Color = containerColor.copy(alpha = 0.85f),
  contentColor: Color = TextPrimary,
  contentPadding: PaddingValues = PaddingValues(horizontal = 16.dp, vertical = 10.dp),
  content: @Composable RowScope.() -> Unit
) {
  Button(
    onClick = onClick,
    modifier = modifier
      .minimumInteractiveComponentSize()
      .defaultMinSize(minHeight = 48.dp),
    shape = RoundedCornerShape(10.dp),
    colors = ButtonDefaults.buttonColors(
      containerColor = containerColor,
      contentColor = contentColor
    ),
    border = BorderStroke(1.5.dp, borderColor),
    contentPadding = contentPadding,
    content = content
  )
}

@Composable
fun HudIconChip(
  onClick: () -> Unit,
  icon: ImageVector,
  contentDescription: String,
  modifier: Modifier = Modifier,
  label: String? = null,
  containerColor: Color = PlumSurfaceElevated.copy(alpha = 0.92f),
  borderColor: Color = BorderMauve,
  tint: Color = TextPrimary
) {
  Surface(
    modifier = modifier
      .minimumInteractiveComponentSize()
      .defaultMinSize(minWidth = 48.dp, minHeight = 42.dp)
      .clip(RoundedCornerShape(10.dp))
      .clickable(onClick = onClick),
    shape = RoundedCornerShape(10.dp),
    color = containerColor,
    border = BorderStroke(1.2.dp, borderColor),
    shadowElevation = 4.dp
  ) {
    Row(
      modifier = Modifier.padding(horizontal = if (label != null) 10.dp else 8.dp, vertical = 6.dp),
      verticalAlignment = Alignment.CenterVertically,
      horizontalArrangement = Arrangement.spacedBy(4.dp, Alignment.CenterHorizontally)
    ) {
      Icon(
        imageVector = icon,
        contentDescription = contentDescription,
        tint = tint,
        modifier = Modifier.size(18.dp)
      )
      if (!label.isNullOrEmpty()) {
        Text(
          text = label,
          style = MaterialTheme.typography.labelLarge,
          fontWeight = FontWeight.ExtraBold,
          color = tint
        )
      }
    }
  }
}

@Composable
fun GothicPanelSurface(
  modifier: Modifier = Modifier,
  borderColor: Color = BorderMauve,
  content: @Composable () -> Unit
) {
  Box(
    modifier = modifier
      .clip(RoundedCornerShape(16.dp))
      .background(
        Brush.verticalGradient(
          colors = listOf(PlumSurfaceCard, PlumSurfaceElevated)
        )
      )
      .border(1.5.dp, borderColor, RoundedCornerShape(16.dp))
  ) {
    content()
  }
}
