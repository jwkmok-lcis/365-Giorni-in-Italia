import { SkillTreeSystem } from "./src/systems/SkillTreeSystem.js";
import { DIALOGUES } from "./src/content/dialogues.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const skillTree = new SkillTreeSystem();

const basicChoice = {
  text: "Sì, cerco il ragù.",
  skills: ["basicSentences"],
  grammarAccuracy: 0.9,
  complexity: 1.0,
};

const pastChoice = {
  text: "Sì, ho parlato con lui.",
  skills: ["pastTense"],
  grammarAccuracy: 0.9,
  complexity: 1.3,
};

const comboChoice = {
  text: "L'ho finito ma lo devo controllare?",
  skills: ["pastTense", "connectors", "pronouns", "modals"],
  grammarAccuracy: 0.9,
  complexity: 1.8,
};

const scriptedChoice = {
  text: "Sì, ho parlato con lui e voglio entrare.",
  skills: ["connectors", "pastTense", "modals"],
  skillTags: ["S7", "S9"],
  xp: 15,
  xpMode: "production",
  grammarAccuracy: 0.9,
  complexity: 1.7,
};

const incorrectChoice = {
  text: "Sì, Giorgio.",
  skills: ["pastTense"],
  skillTags: ["S6"],
  xp: 10,
  xpMode: "production",
  grammarAccuracy: 0.4,
  complexity: 1.0,
};

const basicXP = skillTree.calculateXP(basicChoice, true, basicChoice.grammarAccuracy, basicChoice.complexity, { day: 1 });
const pastXP = skillTree.calculateXP(pastChoice, true, pastChoice.grammarAccuracy, pastChoice.complexity, { day: 4 });
const comboXP = skillTree.calculateXP(comboChoice, true, comboChoice.grammarAccuracy, comboChoice.complexity, { day: 29 });
const scriptedXP = skillTree.calculateXP(scriptedChoice, true, scriptedChoice.grammarAccuracy, scriptedChoice.complexity, { day: 7 });
const incorrectXP = skillTree.calculateXP(incorrectChoice, true, incorrectChoice.grammarAccuracy, incorrectChoice.complexity, { day: 4 });

assert(basicXP === 5, `Expected day-1 S1 survival-phrase choice XP to be 5, got ${basicXP}`);
assert(pastXP === 13, `Expected day-4 past tense choice XP to be 13, got ${pastXP}`);
assert(comboXP === 24, `Expected day-29 combo choice XP to be 24, got ${comboXP}`);
assert(scriptedXP === 15, `Expected explicit scripted XP override to be 15, got ${scriptedXP}`);
assert(incorrectXP === 0, `Expected incorrect grammar choice XP to be 0, got ${incorrectXP}`);
assert(JSON.stringify(skillTree.resolveSkillTags(scriptedChoice, scriptedChoice.skills)) === JSON.stringify(["S7", "S9"]), "Expected explicit script tags to be preserved");
assert(JSON.stringify(skillTree.resolveSkillTags({ skills: ["modals", "infinitives"] }, ["modals", "infinitives"])) === JSON.stringify(["S9", "S10"]), "Expected runtime skills to derive script tags");

const luciaRetryNode = DIALOGUES.lucia_ferrante.nodes.day4_lucia_retry_prompt;
assert(!!luciaRetryNode, "Expected Lucia day-4 retry prompt node to exist");
assert(luciaRetryNode.choices[0].next === "day4_past_reveal", "Expected Lucia retry branch to return to the correct past-tense node");

const contiRetryNode = DIALOGUES.prof_conti.nodes.day6_modal_retry_prompt;
assert(!!contiRetryNode, "Expected Conti day-6 retry prompt node to exist");
assert(contiRetryNode.choices[0].next === "day6_modal_must", "Expected Conti retry branch to return to the modal follow-up node");

const luciaSignatureRetryNode = DIALOGUES.lucia_ferrante.nodes.day8_lucia_signature_retry;
assert(!!luciaSignatureRetryNode, "Expected Lucia day-8 retry prompt node to exist");
assert(luciaSignatureRetryNode.choices[0].next === "day8_lucia_pause", "Expected Lucia day-8 retry branch to return to the signature reveal node");

const contiFadedRetryNode = DIALOGUES.prof_conti.nodes.day10_conti_retry_prompt;
assert(!!contiFadedRetryNode, "Expected Conti day-10 retry prompt node to exist");
assert(contiFadedRetryNode.choices[0].next === "day10_conti_reveal", "Expected Conti day-10 retry branch to return to the faded-line reveal node");

const acceptableXP = skillTree.calculateXP(basicChoice, true, 0.7, basicChoice.complexity, { day: 1 });
assert(acceptableXP === 2, `Expected acceptable accuracy XP to be halved to 2, got ${acceptableXP}`);

const basicTags = skillTree.resolveTrackedSkills(basicChoice, basicChoice.skills);
const pastTags = skillTree.resolveTrackedSkills(pastChoice, pastChoice.skills);

skillTree.awardXP(basicXP, basicTags, {
  day: 1,
  accuracyTier: "full",
  choiceText: basicChoice.text,
});
skillTree.awardXP(basicXP, basicTags, {
  day: 1,
  accuracyTier: "full",
  choiceText: basicChoice.text,
});
const repetitionResult = skillTree.awardXP(basicXP, basicTags, {
  day: 1,
  accuracyTier: "full",
  choiceText: basicChoice.text,
});

assert(repetitionResult.bonusXP >= 10, `Expected repetition bonus on third correct use, got ${repetitionResult.bonusXP}`);

const varietyResult = skillTree.awardXP(pastXP, pastTags, {
  day: 4,
  accuracyTier: "full",
  choiceText: pastChoice.text,
});
skillTree.awardXP(pastXP, pastTags, {
  day: 4,
  accuracyTier: "full",
  choiceText: "Ha detto sei ore.",
});

assert(varietyResult.totalAwarded >= pastXP, "Expected base XP award to succeed for past tense skill");

assert(skillTree.skillTree.S1.currentXP > 0, "Expected S1 XP to increase after repeated survival-phrase awards");
assert(skillTree.skillTree.S6.currentXP > 0, "Expected S6 XP to increase after passato prossimo awards");

const snapshot = skillTree.toJSON();
const restored = new SkillTreeSystem();
restored.fromJSON(snapshot);

assert(restored.totalXP === skillTree.totalXP, "Expected serialized total XP to round-trip");
assert(restored.skillTree.S1.currentXP === skillTree.skillTree.S1.currentXP, "Expected S1 XP to round-trip");

console.log("Grammar skill XP tests passed.");