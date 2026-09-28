/**
 * Vanguard Core - User Preference Memory
 * Explicit user-declared choices (never confused with machine inference or AI guesses)
 */

export interface UserPreference {
  key: string;
  label: string;
  value: any;
  category: 'gaming' | 'filesystem' | 'system' | 'desktop';
  source: 'USER_PREFERENCE';
  updatedAt: number;
}

export class PreferenceMemory {
  private preferences: Map<string, UserPreference> = new Map();

  constructor() {
    // Default initial user preferences
    this.setPreference('preferred_wine_version', 'wine-cachyos 10.2 (Staging + NTSYNC)', 'gaming', 'Preferred Wine Runtime');
    this.setPreference('preferred_proton_version', 'Proton-GE-9-25-cachyos', 'gaming', 'Preferred Proton Compatibility Tool');
    this.setPreference('preferred_steam_library', '/run/media/cachy/GamesSSD/SteamLibrary', 'gaming', 'Primary Steam Library');
    this.setPreference('preferred_games_mount', '/run/media/cachy/GamesSSD', 'filesystem', 'Primary Gaming Mount Point');
  }

  public getPreference<T = any>(key: string): T | undefined {
    return this.preferences.get(key)?.value;
  }

  public setPreference(key: string, value: any, category: UserPreference['category'], label: string): UserPreference {
    const pref: UserPreference = {
      key,
      value,
      category,
      label,
      source: 'USER_PREFERENCE',
      updatedAt: Date.now()
    };
    this.preferences.set(key, pref);
    return pref;
  }

  public getAllPreferences(): UserPreference[] {
    return Array.from(this.preferences.values());
  }
}
