package com.example.bridge

import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import com.example.model.CampaignProgress
import com.example.model.GameSettings
import com.example.model.HudSnapshot
import com.example.model.MatchResult
import com.example.model.ShovelConfirmRequest
import org.json.JSONArray
import org.json.JSONObject

class PvzWebBridge(
  private val onEngineReadyCallback: (Map<String, ImageBitmap>) -> Unit,
  private val onHudSnapshotCallback: (HudSnapshot) -> Unit,
  private val onMatchResultCallback: (MatchResult) -> Unit,
  private val onShovelConfirmCallback: (ShovelConfirmRequest) -> Unit
) {
  private val mainHandler = Handler(Looper.getMainLooper())
  private var webView: WebView? = null

  fun attachWebView(view: WebView) {
    webView = view
  }

  @JavascriptInterface
  fun onEngineReady(iconsJson: String) {
    val iconMap = mutableMapOf<String, ImageBitmap>()
    try {
      val obj = JSONObject(iconsJson)
      val keys = obj.keys()
      while (keys.hasNext()) {
        val key = keys.next()
        val dataUrl = obj.optString(key, "")
        val base64Part = dataUrl.substringAfter("base64,", "")
        if (base64Part.isNotEmpty()) {
          val bytes = Base64.decode(base64Part, Base64.DEFAULT)
          BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.let { bmp ->
            iconMap[key] = bmp.asImageBitmap()
          }
        }
      }
    } catch (_: Exception) {
    }
    mainHandler.post { onEngineReadyCallback(iconMap) }
  }

  @JavascriptInterface
  fun onHudState(hudJson: String) {
    try {
      val obj = JSONObject(hudJson)
      val deckList = mutableListOf<String>()
      val deckArr = obj.optJSONArray("selectedDeck")
      if (deckArr != null) {
        for (i in 0 until deckArr.length()) {
          deckList.add(deckArr.optString(i))
        }
      }

      val cdMap = mutableMapOf<String, Float>()
      val cdObj = obj.optJSONObject("cooldowns")
      if (cdObj != null) {
        val keys = cdObj.keys()
        while (keys.hasNext()) {
          val k = keys.next()
          cdMap[k] = cdObj.optDouble(k, 0.0).toFloat()
        }
      }

      val snapshot = HudSnapshot(
        sun = obj.optInt("sun", 50),
        plantFood = obj.optInt("plantFood", 3),
        isPlantFoodActive = obj.optBoolean("isPlantFoodActive", false),
        isShovelActive = obj.optBoolean("isShovelActive", false),
        selectedPlantType = obj.optString("selectedPlantType", ""),
        gameSpeed = obj.optInt("gameSpeed", 2),
        isPaused = obj.optBoolean("isPaused", false),
        isSandbox = obj.optBoolean("isSandbox", false),
        sandboxNoCooldown = obj.optBoolean("sandboxNoCooldown", false),
        gameMode = obj.optString("gameMode", "normal"),
        currentLevel = obj.optInt("currentLevel", 1),
        waveProgress = obj.optDouble("waveProgress", 0.0).toFloat(),
        currentWave = obj.optInt("currentWave", 1),
        totalWaves = obj.optInt("totalWaves", 5),
        waveStatusTitle = obj.optString("waveStatusTitle", ""),
        waveStatusSub = obj.optString("waveStatusSub", ""),
        isBossLevel = obj.optBoolean("isBossLevel", false),
        bossHp = obj.optInt("bossHp", 27000),
        bossMaxHp = obj.optInt("bossMaxHp", 27000),
        selectedDeck = deckList.ifEmpty { CampaignProgress.DEFAULT_DECK },
        cooldowns = cdMap
      )
      mainHandler.post { onHudSnapshotCallback(snapshot) }
    } catch (_: Exception) {
    }
  }

  @JavascriptInterface
  fun onMatchResult(resultJson: String) {
    try {
      val obj = JSONObject(resultJson)
      val result = MatchResult(
        victory = obj.optBoolean("victory", false),
        level = obj.optInt("level", 1)
      )
      mainHandler.post { onMatchResultCallback(result) }
    } catch (_: Exception) {
    }
  }

  @JavascriptInterface
  fun onShovelConfirmRequested(plantType: String, row: Int, col: Int) {
    mainHandler.post {
      onShovelConfirmCallback(ShovelConfirmRequest(plantType = plantType, row = row, col = col))
    }
  }

  private fun eval(js: String) {
    mainHandler.post {
      webView?.evaluateJavascript(js, null)
    }
  }

  fun startLevel(level: Int, deck: List<String>, defaultSpeed: Int) {
    val arr = JSONArray(deck).toString()
    eval("window.pvzBridge && window.pvzBridge.startLevel($level, ${JSONObject.quote(arr)}, $defaultSpeed);")
  }

  fun startSandbox(defaultSpeed: Int) {
    eval("window.pvzBridge && window.pvzBridge.startSandbox($defaultSpeed);")
  }

  fun selectCard(plantId: String) {
    eval("window.pvzBridge && window.pvzBridge.selectCard(${JSONObject.quote(plantId)});")
  }

  fun toggleShovel() {
    eval("window.pvzBridge && window.pvzBridge.toggleShovel();")
  }

  fun togglePlantFood() {
    eval("window.pvzBridge && window.pvzBridge.togglePlantFood();")
  }

  fun setSpeed(speed: Int) {
    eval("window.pvzBridge && window.pvzBridge.setSpeed($speed);")
  }

  fun setPaused(paused: Boolean) {
    eval("window.pvzBridge && window.pvzBridge.setPaused($paused);")
  }

  fun resetLevel() {
    eval("window.pvzBridge && window.pvzBridge.resetLevel();")
  }

  fun returnToMenu() {
    eval("window.pvzBridge && window.pvzBridge.returnToMenu();")
  }

  fun applySettings(settings: GameSettings) {
    eval(
      "window.pvzBridge && window.pvzBridge.applySettings(" +
        "${settings.masterVolume}, ${settings.bgmVolume}, ${settings.sfxVolume}, " +
        "${settings.isMuted}, ${settings.defaultSpeed}, ${settings.confirmShovel});"
    )
  }

  fun applyProgress(progress: CampaignProgress) {
    val completedJson = JSONArray(progress.completedLevels.toList()).toString()
    val deckJson = JSONArray(progress.selectedDeck).toString()
    eval(
      "window.pvzBridge && window.pvzBridge.applyProgress(" +
        "${progress.unlockedLevel}, ${JSONObject.quote(completedJson)}, ${JSONObject.quote(deckJson)});"
    )
  }

  fun confirmPendingShovel(confirmed: Boolean) {
    eval("window.pvzBridge && window.pvzBridge.confirmPendingShovel($confirmed);")
  }

  fun sandboxAddSun(amount: Int) {
    eval("window.pvzBridge && window.pvzBridge.sandboxAddSun($amount);")
  }

  fun sandboxSetSun(amount: Int) {
    eval("window.pvzBridge && window.pvzBridge.sandboxSetSun($amount);")
  }

  fun sandboxClearAll() {
    eval("window.pvzBridge && window.pvzBridge.sandboxClearAll();")
  }

  fun sandboxClearZombies() {
    eval("window.pvzBridge && window.pvzBridge.sandboxClearZombies();")
  }

  fun sandboxToggleNoCooldown() {
    eval("window.pvzBridge && window.pvzBridge.sandboxToggleNoCooldown();")
  }

  fun sandboxSpawnZombie(type: String, row: Int) {
    eval("window.pvzBridge && window.pvzBridge.sandboxSpawnZombie(${JSONObject.quote(type)}, $row);")
  }
}
