// DialogueSystem – runs branching dialogue trees and applies choice effects.
// Now supports adaptive difficulty with multiple dialogue versions.

import { DIALOGUES } from "../content/dialogues.js";
import { Events } from "../engine/EventBus.js";

export class DialogueSystem {
  startDialogue(npcId, context) {
    const script = DIALOGUES[npcId];
    if (!script) {
      throw new Error(`Dialogue not found for npc: ${npcId}`);
    }

    // Resolve the entry node based on current game day.
    // dayStarts maps a day number to a start node; we pick the highest key <= today.
    let startNode = script.start;
    if (script.dayStarts) {
      const day = typeof context?.day === "number"
        ? context.day
        : context?.day?.currentDay ?? 1;
      const bestDay = Object.keys(script.dayStarts)
        .map(Number)
        .filter(d => d <= day)
        .sort((a, b) => b - a)[0];
      if (bestDay !== undefined) {
        startNode = script.dayStarts[bestDay];
      }
    }

    return {
      npcId,
      npcName: script.npcName,
      nodeId: startNode,
      ended: false,
      clueHint: null,
      difficultyLevel: 'A1', // Will be updated by adaptive system
      skillsUsed: [],
      skillTagsUsed: []
    };
  }

  getCurrentNode(session, context) {
    const script = DIALOGUES[session.npcId];
    let node = script.nodes[session.nodeId];

    // Apply adaptive difficulty if systems are available
    if (context?.difficultySystem && node.versions) {
      const requiredSkills = node.requiredSkills || [];
      const adaptedNode = context.difficultySystem.getDialogueVersion(node, requiredSkills);
      if (adaptedNode !== node) {
        // Create a modified node with adapted content
        node = {
          ...node,
          text: adaptedNode.text,
          en: adaptedNode.en,
          choices: adaptedNode.choices || node.choices
        };
        session.difficultyLevel = adaptedNode.level || 'A1';
      }
    }

    // Fallback: if node uses versions but adaptive system didn't resolve,
    // pick the version matching the session difficulty or default to A1.
    if (node.versions && !node.text) {
      const level = session.difficultyLevel || 'A1';
      const version = node.versions[level] || node.versions.A1 || Object.values(node.versions)[0];
      if (version) {
        node = {
          ...node,
          text: version.text,
          en: version.en,
          choices: version.choices || node.choices,
        };
      }
    }

    return node;
  }

  choose(session, choiceIndex, context) {
    if (session.ended) {
      return { ended: true };
    }

    const node = this.getCurrentNode(session, context);
    const choice = node.choices[choiceIndex];
    if (!choice) {
      return { ended: false, node: this.getCurrentNode(session, context) };
    }

    // Track skills used in this choice
    session.skillsUsed = choice.skills || [];
    session.skillTagsUsed = context?.skillTreeSystem?.resolveTrackedSkills(choice, session.skillsUsed) ?? [];

    const grammarAccuracy = choice.grammarAccuracy || 1.0;
    const complexity = choice.complexity || 1.0;
    const accuracyTier = context?.skillTreeSystem?.getAccuracyTier(grammarAccuracy, true) ?? "full";

    if (accuracyTier === "incorrect") {
      if (context?.player) {
        context.player.currentStreak = 0;
      }

      context?.bus?.emit(Events.GRAMMAR_FEEDBACK, {
        type: "retry",
        npcId: session.npcId,
        nodeId: session.nodeId,
        choiceText: choice.text,
        correction: choice.retryCorrection ?? null,
        message: choice.retryPrompt ?? "Non capisco. Riprova con una frase completa.",
        skills: session.skillTagsUsed,
      });

      if (choice.end) {
        session.ended = true;
        return { ended: true, retry: true };
      }

      session.nodeId = choice.next ?? session.nodeId;
      return {
        ended: false,
        retry: true,
        node: this.getCurrentNode(session, context),
      };
    }

    this._applyEffects(session, choice.effects, context);

    // Award XP based on choice performance
    if (context?.skillTreeSystem && session.skillTagsUsed.length > 0) {
      const currentDay = typeof context?.day === "number"
        ? context.day
        : context?.day?.currentDay ?? 1;
      const xpAmount = context.skillTreeSystem.calculateXP(choice, true, grammarAccuracy, complexity, {
        day: currentDay,
        skillsUsed: session.skillTagsUsed,
        mode: context.skillTreeSystem.resolveXpMode(choice, session.skillTagsUsed),
      });
      const xpResult = context.skillTreeSystem.awardXP(xpAmount, session.skillTagsUsed, {
        day: currentDay,
        accuracyTier,
        choiceText: choice.text,
      });

      if (xpResult.totalAwarded > 0 && context?.player) {
        context.player.awardXP(xpResult.totalAwarded);
        context.player.currentStreak = context.skillTreeSystem.currentStreak;
        context.player.maxStreak = context.skillTreeSystem.maxStreak;
        context.player.unlockedRewards = context.skillTreeSystem.getRewards();
      }

      // Update player skill scores
      if (context?.player) {
        session.skillTagsUsed.forEach(skill => {
          context.player.updateSkillScore(skill, grammarAccuracy * 10);
        });
      }

      // Emit XP event for UI updates
      context.bus?.emit(Events.XP_AWARDED, {
        amount: xpResult.totalAwarded,
        baseAmount: xpResult.awardedXP,
        bonusXP: xpResult.bonusXP,
        totalXP: context?.player?.languageXP ?? xpResult.totalXP,
        skills: session.skillTagsUsed,
        skillTags: session.skillTagsUsed,
        streak: xpResult.streak,
        milestones: xpResult.milestoneSkills
      });

      if (xpResult.totalAwarded > 0) {
        const focusSkills = context.skillTreeSystem.getDailyFocus(currentDay);
        context.bus?.emit(Events.GRAMMAR_FEEDBACK, {
          type: "success",
          npcId: session.npcId,
          nodeId: session.nodeId,
          message: xpResult.milestoneSkills.length > 0
            ? `Milestone unlocked in ${xpResult.milestoneSkills.join(", ")}.`
            : `+${xpResult.totalAwarded} XP for ${session.skillTagsUsed.join(", ")}.`,
          skills: session.skillTagsUsed,
          focusSkills,
          milestones: xpResult.milestoneSkills,
        });
      }
    }

    // Record choice for difficulty adaptation
    if (context?.difficultySystem) {
      context.difficultySystem.recordChoicePerformance(choice, true);
    }

    context.quest.recordNpcTalk(session.npcId, context);
    context.bus.emit(Events.DIALOGUE_CHOICE_SELECTED, {
      npcId: session.npcId,
      nodeId: session.nodeId,
      choiceIndex,
      skillsUsed: session.skillsUsed,
      skillTagsUsed: session.skillTagsUsed,
      difficultyLevel: session.difficultyLevel
    });

    if (choice.end) {
      session.ended = true;
      return { ended: true };
    }

    session.nodeId = choice.next;
    return { ended: false, node: this.getCurrentNode(session, context) };
  }

  _applyEffects(session, effects, context) {
    if (!effects) return;

    if (typeof effects.relationDelta === "number") {
      context.player.changeRelation(session.npcId, effects.relationDelta);
    }

    if (effects.clueHint) {
      session.clueHint = effects.clueHint;
    }
  }
}
