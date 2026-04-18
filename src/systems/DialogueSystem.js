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

    return {
      npcId,
      npcName: script.npcName,
      nodeId: script.start,
      ended: false,
      clueHint: null,
      difficultyLevel: 'A1', // Will be updated by adaptive system
      skillsUsed: []
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

    this._applyEffects(session, choice.effects, context);

    // Award XP based on choice performance
    if (context?.skillTreeSystem && session.skillsUsed.length > 0) {
      const grammarAccuracy = choice.grammarAccuracy || 1.0;
      const complexity = choice.complexity || 1.0;
      const xpAmount = context.skillTreeSystem.calculateXP(choice, true, grammarAccuracy, complexity);
      const xpResult = context.skillTreeSystem.awardXP(xpAmount, session.skillsUsed);

      // Update player skill scores
      if (context?.player) {
        session.skillsUsed.forEach(skill => {
          context.player.updateSkillScore(skill, grammarAccuracy * 10);
        });
      }

      // Emit XP event for UI updates
      context.bus?.emit(Events.XP_AWARDED, {
        amount: xpAmount,
        totalXP: xpResult.totalXP,
        skills: session.skillsUsed,
        streak: xpResult.streak
      });
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
