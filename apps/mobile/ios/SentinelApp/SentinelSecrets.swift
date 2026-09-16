import Foundation
import React
import Security

/**
 The device keys (ADR-0004), in the Keychain rather than in a file.

 `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`: a phone that reboots in a
 pocket during an alert must still be able to seal the next position, and a
 key that travelled in a backup to a phone somebody else now holds would let
 them open envelopes meant for this one. Nothing here asks for Face ID — the
 person holding the phone during an alert may not have a free face — the
 duress PIN is the answer to a coercer, not a biometric.

 Every method resolves; a Keychain that refuses is a thing the app tells the
 person about, not a red screen during an alert.
 */
@objc(SentinelSecrets)
final class SentinelSecrets: NSObject {
  private static let service = "ng.sentinel.app.keys"

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  private static func query(_ key: String) -> [String: Any] {
    [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrAccount as String: key,
    ]
  }

  @objc(setSecret:value:resolver:rejecter:)
  func setSecret(
    _ key: String,
    value: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    guard let data = value.data(using: .utf8) else {
      resolve(false)
      return
    }
    SecItemDelete(Self.query(key) as CFDictionary)
    var attributes = Self.query(key)
    attributes[kSecValueData as String] = data
    attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    resolve(SecItemAdd(attributes as CFDictionary, nil) == errSecSuccess)
  }

  @objc(getSecret:resolver:rejecter:)
  func getSecret(
    _ key: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    var query = Self.query(key)
    query[kSecReturnData as String] = true
    query[kSecMatchLimit as String] = kSecMatchLimitOne
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
      resolve(nil)
      return
    }
    resolve(value)
  }

  @objc(removeSecret:resolver:rejecter:)
  func removeSecret(
    _ key: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter _: @escaping RCTPromiseRejectBlock
  ) {
    let status = SecItemDelete(Self.query(key) as CFDictionary)
    resolve(status == errSecSuccess || status == errSecItemNotFound)
  }
}
