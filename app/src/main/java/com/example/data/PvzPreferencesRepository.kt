package com.example.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.model.CampaignProgress
import com.example.model.GameSettings
import com.example.model.PvzCatalog
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.pvzDataStore: DataStore<Preferences> by preferencesDataStore(name = "pvz_preferences")

data class PersistedAppState(
  val progress: CampaignProgress,
  val settings: GameSettings
)

class PvzPreferencesRepository(private val context: Context) {

  private object Keys {
    val UNLOCKED_LEVEL = intPreferencesKey("unlocked_level")
    val COMPLETED_LEVELS = stringSetPreferencesKey("completed_levels")
    val SELECTED_DECK = stringPreferencesKey("selected_deck")

    val MASTER_VOLUME = floatPreferencesKey("master_volume")
    val BGM_VOLUME = floatPreferencesKey("bgm_volume")
    val SFX_VOLUME = floatPreferencesKey("sfx_volume")
    val IS_MUTED = booleanPreferencesKey("is_muted")

    val DEFAULT_SPEED = intPreferencesKey("default_speed")
    val HUD_ON_RIGHT = booleanPreferencesKey("hud_on_right")
    val CONFIRM_SHOVEL = booleanPreferencesKey("confirm_shovel")
    val RESPECT_CUTOUT = booleanPreferencesKey("respect_cutout_insets")
  }

  val persistedState: Flow<PersistedAppState> = context.pvzDataStore.data.map { prefs ->
    val unlocked = (prefs[Keys.UNLOCKED_LEVEL] ?: 6).coerceIn(1, 6)
    val completed = (prefs[Keys.COMPLETED_LEVELS] ?: emptySet())
      .mapNotNull { it.toIntOrNull() }
      .filter { it in 1..6 }
      .toSet()

    val rawDeck = prefs[Keys.SELECTED_DECK]
    val validDeck = if (!rawDeck.isNullOrBlank()) {
      rawDeck.split(",")
        .map { it.trim() }
        .filter { PvzCatalog.plantById.containsKey(it) }
        .distinct()
        .take(7)
        .ifEmpty { CampaignProgress.DEFAULT_DECK }
    } else {
      CampaignProgress.DEFAULT_DECK
    }

    val settings = GameSettings(
      masterVolume = (prefs[Keys.MASTER_VOLUME] ?: 0.75f).coerceIn(0f, 1f),
      bgmVolume = (prefs[Keys.BGM_VOLUME] ?: 0.45f).coerceIn(0f, 1f),
      sfxVolume = (prefs[Keys.SFX_VOLUME] ?: 0.85f).coerceIn(0f, 1f),
      isMuted = prefs[Keys.IS_MUTED] ?: false,
      defaultSpeed = if ((prefs[Keys.DEFAULT_SPEED] ?: 2) == 1) 1 else 2,
      hudOnRight = prefs[Keys.HUD_ON_RIGHT] ?: false,
      confirmShovel = prefs[Keys.CONFIRM_SHOVEL] ?: false,
      respectCutoutInsets = prefs[Keys.RESPECT_CUTOUT] ?: true
    )

    PersistedAppState(
      progress = CampaignProgress(
        unlockedLevel = unlocked,
        completedLevels = completed,
        selectedDeck = validDeck
      ),
      settings = settings
    )
  }

  suspend fun saveSelectedDeck(deck: List<String>) {
    val clean = deck.filter { PvzCatalog.plantById.containsKey(it) }.distinct().take(7)
    context.pvzDataStore.edit { prefs ->
      prefs[Keys.SELECTED_DECK] = clean.joinToString(",")
    }
  }

  suspend fun recordLevelVictory(level: Int) {
    context.pvzDataStore.edit { prefs ->
      val currentCompleted = prefs[Keys.COMPLETED_LEVELS] ?: emptySet()
      prefs[Keys.COMPLETED_LEVELS] = currentCompleted + level.toString()
      val currentUnlocked = prefs[Keys.UNLOCKED_LEVEL] ?: 6
      if (level < 6) {
        prefs[Keys.UNLOCKED_LEVEL] = maxOf(currentUnlocked, level + 1)
      }
    }
  }

  suspend fun resetCampaignProgress() {
    context.pvzDataStore.edit { prefs ->
      prefs[Keys.UNLOCKED_LEVEL] = 6
      prefs[Keys.COMPLETED_LEVELS] = emptySet()
    }
  }

  suspend fun updateSettings(settings: GameSettings) {
    context.pvzDataStore.edit { prefs ->
      prefs[Keys.MASTER_VOLUME] = settings.masterVolume.coerceIn(0f, 1f)
      prefs[Keys.BGM_VOLUME] = settings.bgmVolume.coerceIn(0f, 1f)
      prefs[Keys.SFX_VOLUME] = settings.sfxVolume.coerceIn(0f, 1f)
      prefs[Keys.IS_MUTED] = settings.isMuted
      prefs[Keys.DEFAULT_SPEED] = if (settings.defaultSpeed == 1) 1 else 2
      prefs[Keys.HUD_ON_RIGHT] = settings.hudOnRight
      prefs[Keys.CONFIRM_SHOVEL] = settings.confirmShovel
      prefs[Keys.RESPECT_CUTOUT] = settings.respectCutoutInsets
    }
  }
}
