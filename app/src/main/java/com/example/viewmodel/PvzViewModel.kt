package com.example.viewmodel

import android.app.Application
import androidx.compose.ui.graphics.ImageBitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.bridge.PvzWebBridge
import com.example.data.PvzPreferencesRepository
import com.example.model.AppScreen
import com.example.model.CampaignProgress
import com.example.model.GameSettings
import com.example.model.PvzCatalog
import com.example.model.PvzUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PvzViewModel(application: Application) : AndroidViewModel(application) {

  private val repository = PvzPreferencesRepository(application.applicationContext)

  private val _uiState = MutableStateFlow(PvzUiState())
  val uiState: StateFlow<PvzUiState> = _uiState.asStateFlow()

  private val _plantIcons = MutableStateFlow<Map<String, ImageBitmap>>(emptyMap())
  val plantIcons: StateFlow<Map<String, ImageBitmap>> = _plantIcons.asStateFlow()

  val bridge: PvzWebBridge = PvzWebBridge(
    onEngineReadyCallback = { icons ->
      _plantIcons.value = icons
      _uiState.update { it.copy(engineReady = true) }
      val current = _uiState.value
      bridge.applySettings(current.settings)
      bridge.applyProgress(current.progress)
    },
    onHudSnapshotCallback = { hud ->
      _uiState.update { it.copy(hud = hud) }
    },
    onMatchResultCallback = { result ->
      _uiState.update { it.copy(matchResult = result) }
      if (result.victory) {
        viewModelScope.launch {
          repository.recordLevelVictory(result.level)
        }
      }
    },
    onShovelConfirmCallback = { req ->
      _uiState.update { it.copy(pendingShovelConfirm = req) }
    }
  )

  init {
    viewModelScope.launch {
      repository.persistedState.collect { persisted ->
        _uiState.update { state ->
          state.copy(
            progress = persisted.progress,
            settings = persisted.settings
          )
        }
        if (_uiState.value.engineReady) {
          bridge.applySettings(persisted.settings)
          bridge.applyProgress(persisted.progress)
        }
      }
    }
  }

  // Navigation
  fun openMainMenu() {
    bridge.returnToMenu()
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.MainMenu,
        showSandboxDrawer = false,
        matchResult = null,
        pendingShovelConfirm = null
      )
    }
  }

  fun openWorldMap() {
    bridge.returnToMenu()
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.WorldMap,
        showSandboxDrawer = false,
        matchResult = null,
        pendingShovelConfirm = null
      )
    }
  }

  fun openSeedSelection(level: Int) {
    val info = PvzCatalog.levels.find { it.level == level }
    if (info != null && info.isConveyor) {
      // Level 6 uses Conveyor Belt directly without picking a 7-card deck
      startLevelDirectly(level)
      return
    }
    bridge.returnToMenu()
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.SeedSelection(level),
        showSandboxDrawer = false,
        matchResult = null
      )
    }
  }

  private fun startLevelDirectly(level: Int) {
    val state = _uiState.value
    val deck = state.progress.selectedDeck.ifEmpty { CampaignProgress.DEFAULT_DECK }
    bridge.startLevel(level, deck, state.settings.defaultSpeed)
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.InGame,
        showSandboxDrawer = false,
        matchResult = null,
        pendingShovelConfirm = null
      )
    }
  }

  // Deck Builder
  fun togglePlantInDeck(plantId: String) {
    val current = _uiState.value.progress.selectedDeck.toMutableList()
    if (current.contains(plantId)) {
      current.remove(plantId)
    } else {
      if (current.size >= 7) {
        current.removeAt(current.lastIndex)
      }
      current.add(plantId)
    }
    _uiState.update { state ->
      state.copy(progress = state.progress.copy(selectedDeck = current))
    }
    viewModelScope.launch { repository.saveSelectedDeck(current) }
  }

  fun removePlantFromDeck(plantId: String) {
    val current = _uiState.value.progress.selectedDeck.toMutableList()
    if (current.remove(plantId)) {
      _uiState.update { state ->
        state.copy(progress = state.progress.copy(selectedDeck = current))
      }
      viewModelScope.launch { repository.saveSelectedDeck(current) }
    }
  }

  fun autoPickDeck() {
    val defaultDeck = CampaignProgress.DEFAULT_DECK
    _uiState.update { state ->
      state.copy(progress = state.progress.copy(selectedDeck = defaultDeck))
    }
    viewModelScope.launch { repository.saveSelectedDeck(defaultDeck) }
  }

  fun clearDeck() {
    _uiState.update { state ->
      state.copy(progress = state.progress.copy(selectedDeck = emptyList()))
    }
    viewModelScope.launch { repository.saveSelectedDeck(emptyList()) }
  }

  fun startBattleWithDeck(level: Int) {
    val state = _uiState.value
    val deck = state.progress.selectedDeck.ifEmpty { CampaignProgress.DEFAULT_DECK }
    viewModelScope.launch { repository.saveSelectedDeck(deck) }
    bridge.startLevel(level, deck, state.settings.defaultSpeed)
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.InGame,
        showSandboxDrawer = false,
        matchResult = null,
        pendingShovelConfirm = null
      )
    }
  }

  fun startSandbox() {
    val defaultSpeed = _uiState.value.settings.defaultSpeed
    bridge.startSandbox(defaultSpeed)
    _uiState.update {
      it.copy(
        currentScreen = AppScreen.InGame,
        showSandboxDrawer = true,
        matchResult = null,
        pendingShovelConfirm = null
      )
    }
  }

  // Modals
  fun openAlmanac() = _uiState.update { it.copy(showAlmanac = true) }
  fun closeAlmanac() = _uiState.update { it.copy(showAlmanac = false) }
  fun openSettings() = _uiState.update { it.copy(showSettings = true) }
  fun closeSettings() = _uiState.update { it.copy(showSettings = false) }

  fun updateSettings(newSettings: GameSettings) {
    _uiState.update { it.copy(settings = newSettings) }
    bridge.applySettings(newSettings)
    viewModelScope.launch {
      repository.updateSettings(newSettings)
    }
  }

  fun toggleMuteQuick() {
    val current = _uiState.value.settings
    updateSettings(current.copy(isMuted = !current.isMuted))
  }

  fun resetCampaignProgress() {
    viewModelScope.launch {
      repository.resetCampaignProgress()
      bridge.applyProgress(
        CampaignProgress(
          unlockedLevel = 6,
          completedLevels = emptySet(),
          selectedDeck = _uiState.value.progress.selectedDeck
        )
      )
    }
  }

  // In-game HUD actions
  fun selectCard(plantId: String) = bridge.selectCard(plantId)
  fun toggleShovel() = bridge.toggleShovel()
  fun togglePlantFood() = bridge.togglePlantFood()

  fun toggleSpeed() {
    val next = if (_uiState.value.hud.gameSpeed == 2) 1 else 2
    bridge.setSpeed(next)
  }

  fun setPaused(paused: Boolean) = bridge.setPaused(paused)
  fun togglePause() = bridge.setPaused(!_uiState.value.hud.isPaused)

  fun restartCurrentBattle() {
    _uiState.update { it.copy(matchResult = null, pendingShovelConfirm = null) }
    bridge.resetLevel()
  }

  fun toggleSandboxDrawer() {
    _uiState.update { it.copy(showSandboxDrawer = !it.showSandboxDrawer) }
  }

  fun closeSandboxDrawer() {
    _uiState.update { it.copy(showSandboxDrawer = false) }
  }

  fun resolveShovelConfirm(confirmed: Boolean) {
    _uiState.update { it.copy(pendingShovelConfirm = null) }
    bridge.confirmPendingShovel(confirmed)
  }

  fun goToNextLevelFromVictory() {
    val result = _uiState.value.matchResult ?: return
    _uiState.update { it.copy(matchResult = null) }
    if (result.level < 6) {
      openSeedSelection(result.level + 1)
    } else {
      openWorldMap()
    }
  }

  // Sandbox tools
  fun sandboxAddSun(amount: Int) = bridge.sandboxAddSun(amount)
  fun sandboxSetSun(amount: Int) = bridge.sandboxSetSun(amount)
  fun sandboxClearAll() = bridge.sandboxClearAll()
  fun sandboxClearZombies() = bridge.sandboxClearZombies()
  fun sandboxToggleNoCooldown() = bridge.sandboxToggleNoCooldown()
  fun sandboxSpawnZombie(type: String, row: Int) = bridge.sandboxSpawnZombie(type, row)

  fun onAppPaused() {
    val state = _uiState.value
    if (state.currentScreen == AppScreen.InGame && !state.hud.isPaused) {
      bridge.setPaused(true)
    }
  }

  fun handleBackPress(): Boolean {
    val state = _uiState.value
    return when {
      state.pendingShovelConfirm != null -> {
        resolveShovelConfirm(false)
        true
      }
      state.showSettings -> {
        closeSettings()
        true
      }
      state.showAlmanac -> {
        closeAlmanac()
        true
      }
      state.showSandboxDrawer -> {
        closeSandboxDrawer()
        true
      }
      state.matchResult != null -> {
        openWorldMap()
        true
      }
      state.currentScreen == AppScreen.InGame -> {
        togglePause()
        true
      }
      state.currentScreen is AppScreen.SeedSelection -> {
        openWorldMap()
        true
      }
      state.currentScreen == AppScreen.WorldMap -> {
        openMainMenu()
        true
      }
      else -> false
    }
  }
}
