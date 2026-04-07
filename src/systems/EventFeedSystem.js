// EventFeedSystem – subscribes to EventBus and stores recent activity lines.
// This gives the UI a decoupled way to display what just happened.

import { Events } from "../engine/EventBus.js";

export class EventFeedSystem {
  constructor(limit = 8) {
    this.limit = limit;
    this.messages = [];
    this._handlers = [];
  }

  attach(bus) {
    this.detach(bus);

    this._on(bus, Events.LESSON_COMPLETED, (data) => {
      this.push(`Lesson completed for day ${data.day}.`);
    });

    this._on(bus, Events.DIALOGUE_CHOICE_SELECTED, (data) => {
      this.push(`Talked to ${data.npcId}.`);
    });

    this._on(bus, Events.QUEST_OBJECTIVE_PROGRESS, (data) => {
      this.push(`Quest progress: ${data.completedObjectives}/${data.totalObjectives}.`);
    });

    this._on(bus, Events.QUEST_COMPLETED, (data) => {
      this.push(`Quest complete: ${data.title}. +${data.xp} XP`);
    });

    this._on(bus, Events.CLUE_UNLOCKED, (data) => {
      this.push(`Clue unlocked: ${data.clue.title}.`);
    });

    this._on(bus, Events.DAY_STARTED, (data) => {
      this.push(`Day ${data.day} started.`);
    });

    this._on(bus, Events.DAY_ENDED, (data) => {
      this.push(`Day ${data.day} ended.`);
    });
  }

  detach(bus) {
    this._handlers.forEach(({ event, handler }) => bus.off(event, handler));
    this._handlers = [];
  }

  _on(bus, event, handler) {
    bus.on(event, handler);
    this._handlers.push({ event, handler });
  }

  push(message) {
    this.messages.unshift(message);
    if (this.messages.length > this.limit) {
      this.messages.length = this.limit;
    }
  }

  latest() {
    return this.messages[0] ?? "";
  }
}
