// SaveSystem – LocalStorage persistence with schema versioning.

const STORAGE_KEY = "365-giorni-save";
const SCHEMA_VERSION = 1;

export class SaveSystem {
  save(context) {
    const snapshot = {
      version: SCHEMA_VERSION,
      timestamp: Date.now(),
      day: context.day.toJSON(),
      player: context.player.toJSON(),
      quest: context.quest.toJSON(),
      skillTree: context.skillTreeSystem?.toJSON?.() ?? null,
      ui: {
        resumeSceneKey: context.resumeSceneKey ?? null,
        currentLocationId: context.currentLocationId ?? null,
        currentNpcId: context.currentNpcId ?? null,
      }
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      context.bus.emit("GAME_SAVED", { timestamp: snapshot.timestamp });
    } catch {
      // Non-blocking: gameplay should continue even if persistence is unavailable.
    }
    return snapshot;
  }

  load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SCHEMA_VERSION) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  applySnapshot(snapshot, context) {
    if (!snapshot) return false;
    context.day.fromJSON(snapshot.day);
    context.player.fromJSON(snapshot.player);
    context.quest.fromJSON(snapshot.quest);
    if (snapshot.skillTree) {
      context.skillTreeSystem?.fromJSON?.(snapshot.skillTree);
    } else {
      context.skillTreeSystem?.syncLegacyPlayerState?.(context.player);
    }
    context.resumeSceneKey = snapshot.ui?.resumeSceneKey ?? context.resumeSceneKey;
    context.currentLocationId = snapshot.ui?.currentLocationId ?? null;
    context.currentNpcId = snapshot.ui?.currentNpcId ?? null;
    return true;
  }

  loadIntoContext(context) {
    const snapshot = this.load();
    if (!snapshot) return false;
    return this.applySnapshot(snapshot, context);
  }

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage clear failures.
    }
  }
}
