// DaySystem – owns the in-game calendar and day progression logic.
//
// Responsibilities:
//   - Track current day (1..MAX_DAYS)
//   - Track which daily requirements have been met (lesson done, etc.)
//   - Advance to the next day (call endDay()) and emit DAY_STARTED/DAY_ENDED
//   - Expose gating queries used by scenes ("can the player explore today?")
//
// Usage with EventBus:
//   daySystem.endDay(bus);    // emits DAY_ENDED then DAY_STARTED

import { Events } from "../engine/EventBus.js";

export const MAX_DAYS = 30;

export class DaySystem {
  constructor() {
    this.reset();
  }

  // ── State ──────────────────────────────────────────────────────────────

  reset() {
    this.currentDay     = 1;
    this.lessonDone     = false;   // must complete lesson before free explore
    this.explorationOn  = false;   // unlocked after lesson
    this.dayComplete    = false;   // set when player finishes the day
    this.gameComplete   = false;   // set at end of day MAX_DAYS
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Mark today's lesson as complete and open the map for free exploration. */
  completeLesson(bus) {
    if (this.lessonDone) return;
    this.lessonDone    = true;
    this.explorationOn = true;
    bus?.emit(Events.LESSON_COMPLETED, { day: this.currentDay });
  }

  /** Call when the player decides to end the current day. */
  endDay(bus) {
    bus?.emit(Events.DAY_ENDED, { day: this.currentDay });

    if (this.currentDay >= MAX_DAYS) {
      this.gameComplete = true;
      return;
    }

    this.currentDay    += 1;
    this.lessonDone    = false;
    this.explorationOn = false;
    this.dayComplete   = false;

    bus?.emit(Events.DAY_STARTED, { day: this.currentDay });
  }

  // ── Gate queries ───────────────────────────────────────────────────────

  /** True once the player has finished today's lesson. */
  canExplore() {
    return this.explorationOn;
  }

  /** True if this is the last day. */
  isLastDay() {
    return this.currentDay >= MAX_DAYS;
  }

  // ── Serialisation helpers (used by SaveSystem in Step 10) ─────────────

  toJSON() {
    return {
      currentDay:    this.currentDay,
      lessonDone:    this.lessonDone,
      explorationOn: this.explorationOn,
      dayComplete:   this.dayComplete,
      gameComplete:  this.gameComplete,
    };
  }

  fromJSON(data) {
    Object.assign(this, data);
  }
}
