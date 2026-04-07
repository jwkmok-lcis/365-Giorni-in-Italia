// EventBus – minimal publish/subscribe for loose coupling between systems.
// Systems emit events; other systems subscribe without importing each other.
//
// Usage:
//   bus.on("LESSON_COMPLETED", (data) => { ... });
//   bus.emit("LESSON_COMPLETED", { score: 80 });
//   bus.off("LESSON_COMPLETED", handler);   // optional cleanup

export class EventBus {
  constructor() {
    // Map<eventName, Set<handler>>
    this._listeners = new Map();
  }

  /** Subscribe to an event. */
  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
  }

  /** Unsubscribe a specific handler. */
  off(event, handler) {
    this._listeners.get(event)?.delete(handler);
  }

  /** Publish an event. All matching handlers are called synchronously. */
  emit(event, data) {
    this._listeners.get(event)?.forEach((fn) => fn(data));
  }

  /** Remove all listeners (useful for test teardown). */
  clear() {
    this._listeners.clear();
  }
}

// Event name constants — single source of truth to avoid typos
export const Events = Object.freeze({
  LESSON_COMPLETED:          "LESSON_COMPLETED",
  DIALOGUE_CHOICE_SELECTED:  "DIALOGUE_CHOICE_SELECTED",
  QUEST_OBJECTIVE_PROGRESS:  "QUEST_OBJECTIVE_PROGRESS",
  QUEST_COMPLETED:           "QUEST_COMPLETED",
  CLUE_UNLOCKED:             "CLUE_UNLOCKED",
  ENERGY_CHANGED:            "ENERGY_CHANGED",
  COINS_CHANGED:             "COINS_CHANGED",
  ITEM_PURCHASED:            "ITEM_PURCHASED",
  DAY_STARTED:               "DAY_STARTED",
  DAY_ENDED:                 "DAY_ENDED",
  GAME_SAVED:                "GAME_SAVED",
  SCENE_CHANGED:             "SCENE_CHANGED",
});
