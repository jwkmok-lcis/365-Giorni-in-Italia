import { QUESTS } from "./src/content/quests.js";
import { DIALOGUES } from "./src/content/dialogues.js";

const lateGameQuests = Object.values(QUESTS).filter((quest) => quest.dayMin >= 20);
const errors = [];

for (const quest of lateGameQuests) {
  for (const objective of quest.objectives) {
    if (objective.type !== "talkToNpc") {
      continue;
    }

    const script = DIALOGUES[objective.npcId];
    if (!script) {
      errors.push(`${quest.id}: missing dialogue script for NPC ${objective.npcId}`);
      continue;
    }

    const supportedDays = Object.keys(script.dayStarts ?? {}).map(Number);
    const matchingDays = supportedDays.filter((day) => day >= quest.dayMin && day <= quest.dayMax);

    if (matchingDays.length === 0) {
      const fallbackDay = supportedDays.filter((day) => day < quest.dayMin).sort((a, b) => b - a)[0];
      const fallbackLabel = fallbackDay === undefined ? "base start node only" : `stale day ${fallbackDay} node`;
      errors.push(
        `${quest.id}: objective NPC ${objective.npcId} has no quest-window-specific dialogue for days ${quest.dayMin}-${quest.dayMax} (${fallbackLabel})`
      );
    }
  }
}

if (errors.length > 0) {
  console.error("Late-game storyline audit failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Late-game storyline audit passed for ${lateGameQuests.length} quests.`);
}