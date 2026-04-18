// test-adaptive-systems.js – Simple test to verify the new adaptive learning systems work

import { DynamicDifficultySystem } from "./src/systems/DynamicDifficultySystem.js";
import { SkillTreeSystem } from "./src/systems/SkillTreeSystem.js";
import { VoicePronunciationSystem } from "./src/systems/VoicePronunciationSystem.js";

console.log("Testing Adaptive Learning Systems...");

// Test DynamicDifficultySystem
console.log("1. Testing DynamicDifficultySystem");
const difficultySystem = new DynamicDifficultySystem();
difficultySystem.updateSkillScore('presentTense', 80);
difficultySystem.updateSkillScore('pastTense', 30);
console.log("Skill scores:", difficultySystem.getSkillScores());
console.log("Present tense difficulty level:", difficultySystem.getDifficultyLevel('presentTense'));

// Test SkillTreeSystem
console.log("\n2. Testing SkillTreeSystem");
const skillTreeSystem = new SkillTreeSystem();
const xpResult = skillTreeSystem.awardXP(15, ['presentTense']);
console.log("XP awarded:", xpResult);
console.log("Skill tree:", skillTreeSystem.getAllSkills());

// Test VoicePronunciationSystem
console.log("\n3. Testing VoicePronunciationSystem");
const voiceSystem = new VoicePronunciationSystem();
console.log("Voice system available:", voiceSystem.isAvailable());
console.log("Supported languages:", voiceSystem.getSupportedLanguages());

console.log("\nAll systems initialized successfully!");