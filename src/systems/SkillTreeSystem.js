// SkillTreeSystem – manages XP, skill progression, and unlockable content.
// Dialogue choices now resolve against the storyline script's native grammar
// tags (S1-S10), while still accepting older internal skill keys.

const SKILL_TREE_TEMPLATE = {
  S1: {
    name: "S1 · Survival Phrases",
    description: "Basic survival phrases and short useful responses",
    unlocked: true,
    unlockDay: 1,
    currentXP: 0,
    maxXP: 100,
    level: 1,
    example: "Sì. Grazie. Va bene."
  },
  S2: {
    name: "S2 · Present Tense",
    description: "Present tense conjugation",
    unlocked: true,
    unlockDay: 1,
    currentXP: 0,
    maxXP: 120,
    level: 1,
    example: "Cerco il ragù"
  },
  S3: {
    name: "S3 · Articles & Gender",
    description: "Articles and gender agreement",
    unlocked: false,
    unlockDay: 1,
    currentXP: 0,
    maxXP: 110,
    level: 0,
    example: "il mercato, una carota",
    prerequisites: ["S1"]
  },
  S4: {
    name: "S4 · Simple Questions",
    description: "Dove? Quando? Quanto? Perché?",
    unlocked: false,
    unlockDay: 3,
    currentXP: 0,
    maxXP: 130,
    level: 0,
    example: "Perché? Dove compro...",
    prerequisites: ["S1"]
  },
  S5: {
    name: "S5 · Vocabulary",
    description: "Vocabulary repetition and recognition",
    unlocked: true,
    unlockDay: 1,
    currentXP: 0,
    maxXP: 140,
    level: 1,
    example: "ragù, soffritto, fuoco basso"
  },
  S6: {
    name: "S6 · Passato Prossimo",
    description: "Past tense production and recognition",
    unlocked: false,
    unlockDay: 4,
    currentXP: 0,
    maxXP: 180,
    level: 0,
    example: "Ho parlato con lui",
    prerequisites: ["S2"]
  },
  S7: {
    name: "S7 · Connectors",
    description: "ma, perché, quindi, se",
    unlocked: false,
    unlockDay: 5,
    currentXP: 0,
    maxXP: 160,
    level: 0,
    example: "Ma voglio capire perché",
    prerequisites: ["S1"]
  },
  S8: {
    name: "S8 · Object Pronouns",
    description: "lo, la, li, le, mi, ti",
    unlocked: false,
    unlockDay: 8,
    currentXP: 0,
    maxXP: 170,
    level: 0,
    example: "L'ho trovata. Lo conosco.",
    prerequisites: ["S2"]
  },
  S9: {
    name: "S9 · Modal Verbs",
    description: "posso, devo, voglio",
    unlocked: false,
    unlockDay: 6,
    currentXP: 0,
    maxXP: 170,
    level: 0,
    example: "Voglio vederlo. Devo parlare.",
    prerequisites: ["S2"]
  },
  S10: {
    name: "S10 · Infinitives",
    description: "Infinitives after modals",
    unlocked: false,
    unlockDay: 13,
    currentXP: 0,
    maxXP: 190,
    level: 0,
    example: "Voglio parlare. Devo capirlo.",
    prerequisites: ["S9"]
  }
};

const REWARDS_TEMPLATE = {
  dialogueOptions: false,
  fasterTrust: false,
  secretClues: false,
  advancedNPCs: false
};

const SKILL_WEIGHTS = {
  S1: -3,
  S2: -2,
  S3: -1,
  S4: -1,
  S5: -2,
  S6: 2,
  S7: 0,
  S8: 2,
  S9: 2,
  S10: 4,
};

const LEGACY_SKILL_TAGS = {
  basicSentences: ["S1"],
  presentTense: ["S2"],
  articleGender: ["S3"],
  simpleQuestions: ["S4"],
  vocabulary: ["S5"],
  vocabularyRecognition: ["S5"],
  pastTense: ["S6"],
  connectors: ["S7"],
  pronouns: ["S8"],
  modals: ["S9"],
  infinitives: ["S10"],
  complexCombinations: ["S6", "S7", "S8", "S9", "S10"],
};

const DAILY_FOCUS = {
  1: ["S5"],
  2: ["S5"],
  3: ["S5", "S4"],
  4: ["S6"],
  5: ["S7"],
  6: ["S9"],
  7: ["S7", "S9"],
  8: ["S8"],
  9: ["S6", "S8"],
  10: ["S7", "S8"],
  11: ["S8", "S9"],
  12: ["S6", "S7", "S8"],
  13: ["S9", "S10"],
  14: ["S7", "S9", "S10"],
  15: ["S8", "S9"],
  16: ["S6", "S7", "S8"],
  17: ["S9", "S10"],
  18: ["S7", "S9", "S10"],
  19: ["S8"],
  20: ["S6", "S8"],
  21: ["S7", "S8"],
  22: ["S8", "S9"],
  23: ["S6", "S7", "S8"],
  24: ["S9", "S10"],
  25: ["S7", "S9", "S10"],
  26: ["S5", "S6", "S7", "S8"],
  27: ["S6", "S9"],
  28: ["S7", "S8", "S9"],
  29: ["S6", "S7", "S8", "S9"],
  30: ["S10"]
};

function cloneSkillTree() {
  return Object.fromEntries(
    Object.entries(SKILL_TREE_TEMPLATE).map(([key, value]) => [key, { ...value }])
  );
}

function normalizePattern(text = "") {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

function normalizeSkillTag(skillKey) {
  if (!skillKey) return [];
  if (SKILL_TREE_TEMPLATE[skillKey]) return [skillKey];
  return LEGACY_SKILL_TAGS[skillKey] ?? [];
}

export class SkillTreeSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.totalXP = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.skillTree = cloneSkillTree();
    this.rewards = { ...REWARDS_TEMPLATE };
    this.dailyUsage = {};
    this.skillHistory = {};
  }

  getDailyFocus(day = 1) {
    return DAILY_FOCUS[day] ?? DAILY_FOCUS[30];
  }

  getSkillLabel(skillTag) {
    return this.skillTree[skillTag]?.name ?? skillTag;
  }

  getFocusSummary(day = 1) {
    return this.getDailyFocus(day)
      .map((skillTag) => this.getSkillLabel(skillTag))
      .join("  |  ");
  }

  getAccuracyTier(grammarAccuracy = 1.0, wasCorrect = true) {
    if (!wasCorrect) return "incorrect";
    if (grammarAccuracy >= 0.85) return "full";
    if (grammarAccuracy >= 0.65) return "acceptable";
    return "incorrect";
  }

  resolveSkillTags(choice, skillsUsed = []) {
    if (Array.isArray(choice?.skillTags) && choice.skillTags.length > 0) {
      return [...new Set(choice.skillTags.flatMap((skillKey) => normalizeSkillTag(skillKey)))];
    }

    return [...new Set(skillsUsed.flatMap((skillKey) => normalizeSkillTag(skillKey)))];
  }

  resolveTrackedSkills(choice, skillsUsed = []) {
    const resolved = this.resolveSkillTags(choice, skillsUsed);
    if (resolved.length > 0) {
      return resolved;
    }

    return [];
  }

  resolveXpMode(choice, skillsUsed = []) {
    return choice?.xpMode ?? (skillsUsed.length > 0 ? "production" : "comprehension");
  }

  // Calculate XP from choice performance using script-style tiers.
  calculateXP(choice, wasCorrect = true, grammarAccuracy = 1.0, complexity = 1.0, options = {}) {
    if (!choice || !wasCorrect) return 0;

    const accuracyTier = this.getAccuracyTier(grammarAccuracy, wasCorrect);
    if (accuracyTier === "incorrect") {
      return 0;
    }

    const skillsUsed = (options.skillsUsed ?? choice.skills ?? []).flatMap((skillKey) => normalizeSkillTag(skillKey));
    const day = options.day ?? 1;
    const mode = options.mode ?? this.resolveXpMode(choice, skillsUsed);
    const baseXP = mode === "production" ? 8 : 2;
    const highestWeight = skillsUsed.reduce((max, skillKey) => Math.max(max, SKILL_WEIGHTS[skillKey] ?? 0), -3);
    const combinationBonus = Math.max(0, skillsUsed.length - 1) * 3;
    const complexityBonus = Math.max(0, Math.round((complexity - 1) * 4));
    const dailyFocusBonus = skillsUsed.some((skillKey) => this.getDailyFocus(day).includes(skillKey)) ? 2 : 0;
    const scriptedXP = choice.xp?.[mode] ?? choice.xp?.base ?? choice.xp;
    const rawXP = typeof scriptedXP === "number"
      ? scriptedXP
      : Math.max(0, baseXP + highestWeight + combinationBonus + complexityBonus + dailyFocusBonus);

    return accuracyTier === "acceptable" ? Math.floor(rawXP * 0.5) : rawXP;
  }

  ensureTracking(day, skillKey) {
    const dayKey = String(day);
    if (!this.dailyUsage[dayKey]) {
      this.dailyUsage[dayKey] = {};
    }
    if (!this.dailyUsage[dayKey][skillKey]) {
      this.dailyUsage[dayKey][skillKey] = {
        accurateUses: 0,
        patterns: [],
        repetitionBonusAwarded: false,
        varietyBonusAwarded: false
      };
    }
    if (!this.skillHistory[skillKey]) {
      this.skillHistory[skillKey] = {
        accurateUses: 0,
        patterns: [],
        milestoneAwarded: false
      };
    }
    return {
      dayStats: this.dailyUsage[dayKey][skillKey],
      history: this.skillHistory[skillKey]
    };
  }

  _applySkillXP(skillKey, amount) {
    if (!this.skillTree[skillKey] || amount <= 0) return;
    this.skillTree[skillKey].currentXP += amount;
    this.checkSkillLevelUp(skillKey);
  }

  recordSkillUsage(day, skillKey, pattern, accuracyTier) {
    const { dayStats, history } = this.ensureTracking(day, skillKey);
    let bonusXP = 0;
    let milestoneUnlocked = false;

    if (accuracyTier === "full") {
      dayStats.accurateUses += 1;
      history.accurateUses += 1;
    }

    if (pattern) {
      if (!dayStats.patterns.includes(pattern)) {
        dayStats.patterns.push(pattern);
      }
      if (!history.patterns.includes(pattern)) {
        history.patterns.push(pattern);
      }
    }

    if (!dayStats.repetitionBonusAwarded && accuracyTier === "full" && dayStats.accurateUses >= 3) {
      dayStats.repetitionBonusAwarded = true;
      bonusXP += 10;
    } else if (!dayStats.varietyBonusAwarded && accuracyTier !== "incorrect" && dayStats.patterns.length >= 2) {
      dayStats.varietyBonusAwarded = true;
      bonusXP += 8;
    }

    const skill = this.skillTree[skillKey];
    if (
      skill &&
      !history.milestoneAwarded &&
      skill.level >= 3 &&
      history.accurateUses >= 5 &&
      history.patterns.length >= 3
    ) {
      history.milestoneAwarded = true;
      bonusXP += 20;
      milestoneUnlocked = true;
    }

    return { bonusXP, milestoneUnlocked };
  }

  // Award XP and update skills.
  awardXP(amount, skillsUsed = [], options = {}) {
    const accuracyTier = options.accuracyTier ?? "full";
    if (amount <= 0 || accuracyTier === "incorrect") {
      this.resetStreak();
      return {
        awardedXP: 0,
        totalAwarded: 0,
        bonusXP: 0,
        totalXP: this.totalXP,
        streak: this.currentStreak,
        skillsUpdated: skillsUsed,
        milestoneSkills: []
      };
    }

    this.totalXP += amount;
    this.currentStreak += 1;
    this.maxStreak = Math.max(this.maxStreak, this.currentStreak);

    const xpPerSkill = skillsUsed.length > 0 ? Math.max(1, Math.floor(amount / skillsUsed.length)) : 0;
    skillsUsed.forEach((skillKey) => {
      this._applySkillXP(skillKey, xpPerSkill);
    });

    const pattern = normalizePattern(options.pattern ?? options.choiceText);
    let bonusXP = 0;
    const milestoneSkills = [];

    if (skillsUsed.length > 0 && options.day) {
      skillsUsed.forEach((skillKey) => {
        const bonus = this.recordSkillUsage(options.day, skillKey, pattern, accuracyTier);
        if (bonus.bonusXP > 0) {
          bonusXP += bonus.bonusXP;
          this._applySkillXP(skillKey, bonus.bonusXP);
        }
        if (bonus.milestoneUnlocked) {
          milestoneSkills.push(skillKey);
        }
      });
    }

    if (bonusXP > 0) {
      this.totalXP += bonusXP;
    }

    this.checkUnlocks();

    return {
      awardedXP: amount,
      totalAwarded: amount + bonusXP,
      bonusXP,
      totalXP: this.totalXP,
      streak: this.currentStreak,
      skillsUpdated: skillsUsed,
      milestoneSkills
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
    const presentTense = this.skillTree.S2;
    const connectors = this.skillTree.S7;
    const pronouns = this.skillTree.S8;
    const modals = this.skillTree.S9;

    if (presentTense.level >= 2 && !this.rewards.dialogueOptions) {
      this.rewards.dialogueOptions = true;
    }

    if (connectors.level >= 2 && !this.rewards.fasterTrust) {
      this.rewards.fasterTrust = true;
    }

    if (pronouns.level >= 2 && !this.rewards.secretClues) {
      this.rewards.secretClues = true;
    }

    if (modals.level >= 2 && !this.rewards.advancedNPCs) {
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

  toJSON() {
    return {
      totalXP: this.totalXP,
      currentStreak: this.currentStreak,
      maxStreak: this.maxStreak,
      skillTree: this.skillTree,
      rewards: this.rewards,
      dailyUsage: this.dailyUsage,
      skillHistory: this.skillHistory
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.totalXP = data.totalXP ?? this.totalXP;
    this.currentStreak = data.currentStreak ?? this.currentStreak;
    this.maxStreak = data.maxStreak ?? this.maxStreak;
    this.skillTree = data.skillTree ?? this.skillTree;
    this.rewards = data.rewards ?? this.rewards;
    this.dailyUsage = data.dailyUsage ?? this.dailyUsage;
    this.skillHistory = data.skillHistory ?? this.skillHistory;
  }

  syncLegacyPlayerState(player) {
    if (!player) return;
    this.totalXP = Math.max(this.totalXP, player.languageXP ?? 0);
    this.currentStreak = Math.max(this.currentStreak, player.currentStreak ?? 0);
    this.maxStreak = Math.max(this.maxStreak, player.maxStreak ?? 0);
    this.rewards = { ...this.rewards, ...(player.unlockedRewards ?? {}) };
  }
}