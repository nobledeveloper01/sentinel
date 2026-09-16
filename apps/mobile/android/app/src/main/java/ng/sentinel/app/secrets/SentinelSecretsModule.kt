package ng.sentinel.app.secrets

import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * The device keys (ADR-0004), in EncryptedSharedPreferences under a Keystore
 * master key rather than in a plain file. Every method resolves: a store that
 * refuses is a thing the app tells the person about.
 */
class SentinelSecretsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "SentinelSecrets"

  private val prefs by lazy {
    val master = MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build()
    EncryptedSharedPreferences.create(
      context,
      "ng.sentinel.app.keys",
      master,
      EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
      EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )
  }

  @ReactMethod
  fun setSecret(key: String, value: String, promise: Promise) {
    promise.resolve(runCatching { prefs.edit().putString(key, value).commit() }.getOrDefault(false))
  }

  @ReactMethod
  fun getSecret(key: String, promise: Promise) {
    promise.resolve(runCatching { prefs.getString(key, null) }.getOrNull())
  }

  @ReactMethod
  fun removeSecret(key: String, promise: Promise) {
    promise.resolve(runCatching { prefs.edit().remove(key).commit() }.getOrDefault(false))
  }
}
