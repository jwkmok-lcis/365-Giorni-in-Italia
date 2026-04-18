// SkillTreeSystem – manages XP, skill progression, and unlockable content.
// Provides visible progress tracking and motivational rewards.

export class SkillTreeSystem {
  constructor() {
    this.totalXP = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;

    // Skill tree structure
    this.skillTree = {
      basicSentences: {
        name: "Frasi Base",
        description: "Soggetto + verbo + nome",
        unlocked: true,
        unlockDay: 1,
        currentXP: 0,
        maxXP: 100,
        level: 1,
        example: "Cerco il ragù"
      },
      presentTense: {
        name: "Presente",
        description: "Uso corretto dei verbi",
        unlocked: false,
        unlockDay: 2,
        currentXP: 0,
        maxXP: 150,
        level: 0,
        example: "Parlo con Giorgio",
        prerequisites: ["basicSentences"]
      },
      pastTense: {
        name: "Passato",
        description: "ho/ha detto, parlato",
        unlocked: false,
        unlockDay: 4,
        currentXP: 0,
        maxXP: 200,
        level: 0,
        example: "Ho parlato con lui",
        prerequisites: ["presentTense"]
      },
      connectors: {
        name: "Connettori",
        description: "perché, ma, quindi",
        unlocked: false,
        unlockDay: 5,
        currentXP: 0,
        maxXP: 180,
        level: 0,
        example: "Perché voglio imparare",
        prerequisites: ["basicSentences"]
      },
      modals: {
        name: "Modali",
        description: "voglio, posso, devo",
        unlocked: false,
        unlockDay: 6,
        currentXP: 0,
        maxXP: 170,
        level: 0,
        example: "Devo parlare italiano",
        prerequisites: ["presentTense"]
      },
      pronouns: {
        name: "Pronomi",
        description: "lo, la, li, le",
        unlocked: false,
        unlockDay: 8,
        currentXP: 0,
        maxXP: 160,
        level: 0,
        example: "Lo vedo ogni giorno",
        prerequisites: ["presentTense", "connectors"]
      },
      infinitives: {
        name: "Infinitivi",
        description: "parlare, mangiare",
        unlocked: false,
        unlockDay: 10,
        currentXP: 0,
        maxXP: 190,
        level: 0,
        example: "Voglio imparare a parlare",
        prerequisites: ["modals"]
      },
      complexCombinations: {
        name: "Combinazioni Complesse",
        description: "Frasi con più elementi",
        unlocked: false,
        unlockDay: 12,
        currentXP: 0,
        maxXP: 250,
        level: 0,
        example: "Ho dovuto parlare con lui perché...",
        prerequisites: ["pastTense", "pronouns", "infinitives"]
      }
    };

    this.rewards = {
      dialogueOptions: false,    // Unlocked at presentTense level 2
      fasterTrust: false,       // Unlocked at connectors level 2
      secretClues: false,       // Unlocked at complexCombinations level 1
      advancedNPCs: false       // Unlocked at complexCombinations level 3
    };
  }

  // Calculate XP from choice performance
  calculateXP(choice, wasCorrect = true, grammarAccuracy = 1.0, complexity = 1.0) {
    if (!choice || !wasCorrect) return 0;

    let baseXP = 5;
    let grammarBonus = Math.floor(grammarAccuracy * 10); // 0-10
    let complexityBonus = Math.floor((complexity - 1) * 5); // 0-5 based on complexity multiplier
    let streakBonus = Math.min(this.currentStreak, 10); // Max 10 from streak

    return baseXP + grammarBonus + complexityBonus + streakBonus;
  }

  // Award XP and update skills
  awardXP(amount, skillsUsed = []) {
    this.totalXP += amount;
    this.currentStreak += 1;
    this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

    // Distribute XP to relevant skills
    if (skillsUsed.length > 0) {
      const xpPerSkill = Math.floor(amount / skillsUsed.length);
      skillsUsed.forEach(skillKey => {
        if (this.skillTree[skillKey]) {
          this.skillTree[skillKey].currentXP += xpPerSkill;
          this.checkSkillLevelUp(skillKey);
        }
      });
    }

    // Check for new unlocks
    this.checkUnlocks();

    return {
      totalXP: this.totalXP,
      streak: this.currentStreak,
      skillsUpdated: skillsUsed
    };
  }

  // Reset streak on failure
  resetStreak() {
    this.currentStreak = 0;
  }

  // Check if skill can level up
  checkSkillLevelUp(skillKey) {
    const skill = this.skillTree[skillKey];
    if (!skill) return false;

    const newLevel = Math.floor(skill.currentXP / 50) + 1; // 50 XP per level
    if (newLevel > skill.level) {
      skill.level = newLevel;
      this.checkPrerequisites(skillKey);
      return true;
    }
    return false;
  }

  // Check if prerequisites are met for skill unlocks
  checkPrerequisites(skillKey) {
    const skill = this.skillTree[skillKey];
    if (!skill.prerequisites) return;

    const allMet = skill.prerequisites.every(prereq => {
      const prereqSkill = this.skillTree[prereq];
      return prereqSkill && prereqSkill.level >= 1;
    });

    if (allMet && !skill.unlocked) {
      skill.unlocked = true;
    }
  }

  // Check for reward unlocks
  checkUnlocks() {
    const presentTense = this.skillTree.presentTense;
    const connectors = this.skillTree.connectors;
    const complex = this.skillTree.complexCombinations;

    if (presentTense.level >= 2 && !this.rewards.dialogueOptions) {
      this.rewards.dialogueOptions = true;
    }

    if (connectors.level >= 2 && !this.rewards.fasterTrust) {
      this.rewards.fasterTrust = true;
    }

    if (complex.level >= 1 && !this.rewards.secretClues) {
      this.rewards.secretClues = true;
    }

    if (complex.level >= 3 && !this.rewards.advancedNPCs) {
      this.rewards.advancedNPCs = true;
    }
  }

  // Get skill progress for UI
  getSkillProgress(skillKey) {
    const skill = this.skillTree[skillKey];
    if (!skill) return null;

    return {
      name: skill.name,
      description: skill.description,
      currentXP: skill.currentXP,
      maxXP: skill.maxXP,
      level: skill.level,
      unlocked: skill.unlocked,
      progress: skill.currentXP / skill.maxXP,
      example: skill.example
    };
  }

  // Get all skills for skill tree UI
  getAllSkills() {
    const skills = {};
    Object.keys(this.skillTree).forEach(key => {
      skills[key] = this.getSkillProgress(key);
    });
    return skills;
  }

  // Get current rewards status
  getRewards() {
    return { ...this.rewards };
  }

  // Get player stats for UI
  getPlayerStats() {
    return {
      totalXP: this.totalXP,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak,
      unlockedSkills: Object.values(this.skillTree).filter(s => s.unlocked).length,
      totalSkills: Object.keys(this.skillTree).length
    };
  }

  // Check if skill is available for use
  isSkillAvailable(skillKey) {
    const skill = this.skillTree[skillKey];
    return skill && skill.unlocked;
  }
}