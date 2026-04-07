// DialogueSystem – runs branching dialogue trees and applies choice effects.

import { DIALOGUES } from "../content/dialogues.js";
import { Events } from "../engine/EventBus.js";

export class DialogueSystem {
  startDialogue(npcId) {
    const script = DIALOGUES[npcId];
    if (!script) {
      throw new Error(`Dialogue not found for npc: ${npcId}`);
    }

    return {
      npcId,
      npcName: script.npcName,
      nodeId: script.start,
      ended: false,
      clueHint: null
    };
  }

  getCurrentNode(session) {
    const script = DIALOGUES[session.npcId];
    return script.nodes[session.nodeId];
  }

  choose(session, choiceIndex, context) {
    if (session.ended) {
      return { ended: true };
    }

    const node = this.getCurrentNode(session);
    const choice = node.choices[choiceIndex];
    if (!choice) {
      return { ended: false, node: this.getCurrentNode(session) };
    }

    this._applyEffects(session, choice.effects, context);
    context.quest.recordNpcTalk(session.npcId, context);
    context.bus.emit(Events.DIALOGUE_CHOICE_SELECTED, {
      npcId: session.npcId,
      nodeId: session.nodeId,
      choiceIndex
    });

    if (choice.end) {
      session.ended = true;
      return { ended: true };
    }

    session.nodeId = choice.next;
    return { ended: false, node: this.getCurrentNode(session) };
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
