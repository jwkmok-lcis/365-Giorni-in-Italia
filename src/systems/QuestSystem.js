// QuestSystem – tracks objectives and unlocks clues when quests complete.

import { QUESTS, CLUES } from "../content/quests.js";
import { Events } from "../engine/EventBus.js";

function cloneQuestTemplate(template) {
  return {
    ...template,
    objectives: template.objectives.map((o) => ({ ...o }))
  };
}

export class QuestSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.quests = {};
    Object.values(QUESTS).forEach((template) => {
      const q = cloneQuestTemplate(template);
      this.quests[q.id] = q;
    });
    this.completedQuestIds = [];
    this.unlockedClueIds = [];
    this.activeQuestId = null;
    this.syncActiveQuest(1);
  }

  get activeQuest() {
    return this.quests[this.activeQuestId] ?? null;
  }

  getUnlockedClues() {
    return this.unlockedClueIds.map((id) => CLUES[id]).filter(Boolean);
  }

  syncActiveQuest(day = 1) {
    const currentQuest = this.activeQuest;
    if (currentQuest && !this.completedQuestIds.includes(currentQuest.id)) {
      if (currentQuest.dayMin <= day && currentQuest.dayMax >= day) {
        return currentQuest;
      }
    }

    const quests = Object.values(this.quests);
    const exactMatch = quests.find(
      (quest) => !this.completedQuestIds.includes(quest.id) && quest.dayMin <= day && quest.dayMax >= day,
    );
    const overdueMatch = quests.find(
      (quest) => !this.completedQuestIds.includes(quest.id) && quest.dayMin <= day,
    );
    this.activeQuestId = exactMatch?.id ?? overdueMatch?.id ?? null;
    return this.activeQuest;
  }

  recordNpcTalk(npcId, context) {
    const quest = this.activeQuest;
    if (!quest) return;

    let progressed = false;
    quest.objectives.forEach((obj) => {
      if (!obj.completed && obj.type === "talkToNpc" && obj.npcId === npcId) {
        obj.completed = true;
        progressed = true;
      }
    });

    if (!progressed) return;

    context.bus.emit(Events.QUEST_OBJECTIVE_PROGRESS, {
      questId: quest.id,
      npcId,
      completedObjectives: quest.objectives.filter((o) => o.completed).length,
      totalObjectives: quest.objectives.length
    });

    if (quest.objectives.every((o) => o.completed)) {
      this._completeQuest(quest, context);
    }
  }

  _completeQuest(quest, context) {
    if (this.completedQuestIds.includes(quest.id)) return;

    this.completedQuestIds.push(quest.id);
    context.player.languageXP += quest.rewards.xp ?? 0;

    context.bus.emit(Events.QUEST_COMPLETED, {
      questId: quest.id,
      title: quest.title,
      xp: quest.rewards.xp ?? 0
    });

    if (quest.rewards.clueId && !this.unlockedClueIds.includes(quest.rewards.clueId)) {
      this.unlockedClueIds.push(quest.rewards.clueId);
      context.bus.emit(Events.CLUE_UNLOCKED, {
        clueId: quest.rewards.clueId,
        clue: CLUES[quest.rewards.clueId]
      });
    }

    const currentDay = typeof context?.day === "number"
      ? context.day
      : context?.day?.currentDay ?? 1;
    this.syncActiveQuest(currentDay);
  }

  getQuestSummary() {
    const quest = this.activeQuest;
    if (!quest) {
      return "No active quest";
    }

    const done = quest.objectives.filter((o) => o.completed).length;
    return `${quest.title}: ${done}/${quest.objectives.length}`;
  }

  toJSON() {
    return {
      activeQuestId: this.activeQuestId,
      quests: this.quests,
      completedQuestIds: this.completedQuestIds,
      unlockedClueIds: this.unlockedClueIds
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.activeQuestId = data.activeQuestId ?? this.activeQuestId;
    this.quests = data.quests ?? this.quests;
    this.completedQuestIds = data.completedQuestIds ?? this.completedQuestIds;
    this.unlockedClueIds = data.unlockedClueIds ?? this.unlockedClueIds;
  }
}
