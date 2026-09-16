import { TurboModuleRegistry, type TurboModule } from 'react-native';

/**
 * Where the device keys live: the Keychain on iOS, EncryptedSharedPreferences
 * on Android, and nothing else. A platform without the module gets keys made
 * for this launch and a privacy card that says so — never a plain file that
 * would look exactly like this gate being closed.
 */
export interface Spec extends TurboModule {
  setSecret(key: string, value: string): Promise<boolean>;
  getSecret(key: string): Promise<string | null>;
  removeSecret(key: string): Promise<boolean>;
}

/** `getEnforcing` in a try/catch: the legacy modules are reached through the interop layer on the enforcing path (Keys learned this). */
function secrets(): Spec | null {
  try {
    return TurboModuleRegistry.getEnforcing<Spec>('SentinelSecrets');
  } catch {
    return null;
  }
}

export default secrets();
