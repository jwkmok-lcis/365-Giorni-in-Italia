// DynamicDifficultySystem – manages adaptive Italian dialogue based on player skill scores.
// Each dialogue has 3 versions: A1 (simple), A1+ (extended), A2 (complex)
// System chooses version based on skill performance and provides simplification on failures.

export class DynamicDifficultySystem {
  constructor() {
    this.skillScores = {
      // Basic grammar skills (0-100)
      basicSentences: 0,    // Subject + verb + noun
      presentTense: 0,      // Correct verb usage
      pastTense: 0,         // ho/ha detto, parlato
      connectors: 0,        // perché, ma, quindi
      modals: 0,           // voglio, posso, devo
      pronouns: 0,         // lo, la, li, le
      infinitives: 0,      // parlare, mangiare
      complexCombinations: 0 // Multi-skill sentences
    };

    this.consecutiveFailures = {}; // Track failures per skill for simplification
    this.maxConsecutiveFailures = 2; // After 2 failures, simplify
  }

  // Get difficulty level for a skill or combination
  getDifficultyLevel(skillKey) {
    const score = this.skillScores[skillKey] || 0;

    if (score <= 40) return 'A1';
    if (score <= 70) return 'A1+';
    return 'A2';
  }

  // Get dialogue version based on required skills
  getDialogueVersion(dialogueNode, requiredSkills = []) {
    if (!dialogueNode.versions) {
      // Fallback to original single version
      return dialogueNode;
    }

    // Check if player has failed recently for any required skill
    const hasRecentFailures = requiredSkills.some(skill =>
      (this.consecutiveFailures[skill] || 0) >= this.maxConsecutiveFailures
    );

    if (hasRecentFailures) {
      // Force A1 version due to recent failures
      return dialogueNode.versions.A1 || dialogueNode;
    }

    // Determine level based on average skill score
    const avgScore = requiredSkills.length > 0
      ? requiredSkills.reduce((sum, skill) => sum + (this.skillScores[skill] || 0), 0) / requiredSkills.length
      : 50; // Default medium level

    if (avgScore <= 40) return dialogueNode.versions.A1 || dialogueNode;
    if (avgScore <= 70) return dialogueNode.versions.A1Plus || dialogueNode.versions.A1 || dialogueNode;
    return dialogueNode.versions.A2 || dialogueNode.versions.A1Plus || dialogueNode;
  }

  // Update skill score based on player performance
  updateSkillScore(skillKey, performance, maxScore = 100) {
    const currentScore = this.skillScores[skillKey] || 0;
    const improvement = (performance / maxScore) * 20; // Max 20 points per update

    this.skillScores[skillKey] = Math.min(maxScore, currentScore + improvement);

    // Reset consecutive failures on success
    if (performance > 0) {
      this.consecutiveFailures[skillKey] = 0;
    } else {
      this.consecutiveFailures[skillKey] = (this.consecutiveFailures[skillKey] || 0) + 1;
    }
  }

  // Record choice performance for skill tracking
  recordChoicePerformance(choice, wasCorrect = true) {
    if (!choice.skills) return;

    choice.skills.forEach(skill => {
      const performance = wasCorrect ? 10 : 0; // Simple success/failure for now
      this.updateSkillScore(skill, performance);
    });
  }

  // Get all skill scores for UI display
  getSkillScores() {
    return { ...this.skillScores };
  }

  // Check if player can access advanced content
  canAccessAdvancedContent() {
    const avgScore = Object.values(this.skillScores).reduce((sum, score) => sum + score, 0) / Object.keys(this.skillScores).length;
    return avgScore >= 60; // Need 60+ average for advanced content
  }

  // Reset consecutive failures (call when player succeeds after failures)
  resetConsecutiveFailures(skillKey) {
    this.consecutiveFailures[skillKey] = 0;
  }

  // Get simplification message for failed attempts
  getSimplificationMessage(skillKey) {
    const failures = this.consecutiveFailures[skillKey] || 0;
    if (failures >= this.maxConsecutiveFailures) {
      return "Non capisco. Proviamo più semplice.";
    }
    return null;
  }
}