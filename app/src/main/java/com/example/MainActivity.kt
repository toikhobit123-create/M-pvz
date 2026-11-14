package com.example

import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.bridge.PvzWebBridge
import com.example.model.AppScreen
import com.example.ui.screens.AlmanacModal
import com.example.ui.screens.InGameHudOverlay
import com.example.ui.screens.MainMenuScreen
import com.example.ui.screens.SeedSelectionScreen
import com.example.ui.screens.SettingsModal
import com.example.ui.screens.WorldMapScreen
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.ObsidianBg
import com.example.viewmodel.PvzViewModel
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : ComponentActivity() {

  private val viewModel: PvzViewModel by viewModels()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Lock sensor landscape for optimal 9x5 battlefield ergonomics
    requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE

    // Render edge-to-edge behind display cutouts while Compose protects interactive controls via WindowInsets.safeDrawing
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      window.attributes = window.attributes.apply {
        layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      }
    }

    WindowCompat.setDecorFitsSystemWindows(window, false)
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.hide(WindowInsetsCompat.Type.systemBars())
    controller.systemBarsBehavior =
      WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

    setContent {
      MyApplicationTheme {
        PvzAppRoot(
          viewModel = viewModel,
          onExitApp = { moveTaskToBack(true) }
        )
      }
    }
  }

  override fun onPause() {
    super.onPause()
    viewModel.onAppPaused()
  }
}

@Composable
fun PvzAppRoot(
  viewModel: PvzViewModel,
  onExitApp: () -> Unit
) {
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()
  val plantIcons by viewModel.plantIcons.collectAsStateWithLifecycle()

  val allowCanvasTouch = uiState.currentScreen == AppScreen.InGame &&
    !uiState.showAlmanac &&
    !uiState.showSettings &&
    !uiState.hud.isPaused &&
    uiState.matchResult == null &&
    uiState.pendingShovelConfirm == null

  BackHandler(enabled = true) {
    if (!viewModel.handleBackPress()) {
      onExitApp()
    }
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ObsidianBg)
  ) {
    // Persistent Canvas Gameplay Engine hosted once in WebView
    PvzCanvasWebView(
      bridge = viewModel.bridge,
      allowCanvasTouch = allowCanvasTouch
    )

    // Native Jetpack Compose Screens & In-Game HUD
    AnimatedContent(
      targetState = uiState.currentScreen,
      transitionSpec = { fadeIn() togetherWith fadeOut() },
      label = "pvz_screen_transition"
    ) { screen ->
      when (screen) {
        AppScreen.MainMenu -> {
          MainMenuScreen(
            progress = uiState.progress,
            plantIcons = plantIcons,
            respectCutoutInsets = uiState.settings.respectCutoutInsets,
            onOpenWorldMap = { viewModel.openWorldMap() },
            onQuickPlayLevel = { lvl -> viewModel.openSeedSelection(lvl) },
            onStartSandbox = { viewModel.startSandbox() },
            onOpenAlmanac = { viewModel.openAlmanac() },
            onOpenSettings = { viewModel.openSettings() }
          )
        }

        AppScreen.WorldMap -> {
          WorldMapScreen(
            progress = uiState.progress,
            respectCutoutInsets = uiState.settings.respectCutoutInsets,
            onSelectLevel = { lvl -> viewModel.openSeedSelection(lvl) },
            onResetProgress = { viewModel.resetCampaignProgress() },
            onOpenAlmanac = { viewModel.openAlmanac() },
            onOpenSettings = { viewModel.openSettings() },
            onBack = { viewModel.openMainMenu() }
          )
        }

        is AppScreen.SeedSelection -> {
          SeedSelectionScreen(
            level = screen.level,
            selectedDeck = uiState.progress.selectedDeck,
            plantIcons = plantIcons,
            respectCutoutInsets = uiState.settings.respectCutoutInsets,
            onTogglePlant = { id -> viewModel.togglePlantInDeck(id) },
            onRemovePlant = { id -> viewModel.removePlantFromDeck(id) },
            onAutoPick = { viewModel.autoPickDeck() },
            onClearDeck = { viewModel.clearDeck() },
            onStartBattle = { viewModel.startBattleWithDeck(screen.level) },
            onBackToMap = { viewModel.openWorldMap() }
          )
        }

        AppScreen.InGame -> {
          InGameHudOverlay(
            uiState = uiState,
            plantIcons = plantIcons,
            onSelectCard = { id -> viewModel.selectCard(id) },
            onToggleShovel = { viewModel.toggleShovel() },
            onTogglePlantFood = { viewModel.togglePlantFood() },
            onToggleSpeed = { viewModel.toggleSpeed() },
            onTogglePause = { viewModel.togglePause() },
            onToggleMute = { viewModel.toggleMuteQuick() },
            onOpenAlmanac = { viewModel.openAlmanac() },
            onOpenSettings = { viewModel.openSettings() },
            onToggleSandboxDrawer = { viewModel.toggleSandboxDrawer() },
            onCloseSandboxDrawer = { viewModel.closeSandboxDrawer() },
            onRestartBattle = { viewModel.restartCurrentBattle() },
            onOpenWorldMap = { viewModel.openWorldMap() },
            onReturnToMenu = { viewModel.openMainMenu() },
            onNextLevel = { viewModel.goToNextLevelFromVictory() },
            onResolveShovelConfirm = { ok -> viewModel.resolveShovelConfirm(ok) },
            onSandboxAddSun = { amt -> viewModel.sandboxAddSun(amt) },
            onSandboxSetSun = { amt -> viewModel.sandboxSetSun(amt) },
            onSandboxToggleNoCooldown = { viewModel.sandboxToggleNoCooldown() },
            onSandboxSpawnZombie = { type, row -> viewModel.sandboxSpawnZombie(type, row) },
            onSandboxClearZombies = { viewModel.sandboxClearZombies() },
            onSandboxClearAll = { viewModel.sandboxClearAll() }
          )
        }
      }
    }

    // Global Modals (accessible from Main Menu, World Map, or In-Game)
    if (uiState.showAlmanac) {
      AlmanacModal(
        plantIcons = plantIcons,
        respectCutoutInsets = uiState.settings.respectCutoutInsets,
        onDismiss = { viewModel.closeAlmanac() }
      )
    }

    if (uiState.showSettings) {
      SettingsModal(
        settings = uiState.settings,
        progress = uiState.progress,
        onUpdateSettings = { updated -> viewModel.updateSettings(updated) },
        onResetProgress = { viewModel.resetCampaignProgress() },
        onDismiss = { viewModel.closeSettings() }
      )
    }
  }
}

@SuppressLint("SetJavaScriptEnabled", "ClickableViewAccessibility")
@Composable
private fun PvzCanvasWebView(
  bridge: PvzWebBridge,
  allowCanvasTouch: Boolean
) {
  val touchEnabledRef = remember { AtomicBoolean(allowCanvasTouch) }
  touchEnabledRef.set(allowCanvasTouch)

  AndroidView(
    modifier = Modifier.fillMaxSize(),
    factory = { context ->
      WebView(context).apply {
        layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        setBackgroundColor(android.graphics.Color.TRANSPARENT)
        setLayerType(View.LAYER_TYPE_HARDWARE, null)

        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          useWideViewPort = true
          loadWithOverviewMode = true
          setSupportZoom(false)
          builtInZoomControls = false
          displayZoomControls = false
          cacheMode = WebSettings.LOAD_DEFAULT
          allowFileAccess = true
        }

        setOnTouchListener { _, _ -> !touchEnabledRef.get() }

        addJavascriptInterface(bridge, "PvzAndroidBridge")
        bridge.attachWebView(this)

        webViewClient = object : WebViewClient() {}
        webChromeClient = object : WebChromeClient() {}

        loadUrl("file:///android_asset/www/index.html")
      }
    },
    update = { webView ->
      bridge.attachWebView(webView)
      touchEnabledRef.set(allowCanvasTouch)
    }
  )
}
