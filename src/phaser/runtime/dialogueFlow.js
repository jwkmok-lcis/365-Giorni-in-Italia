export function createDialogueState(runtime, npcId, returnSceneKey, returnData) {
  return {
    session: runtime.dialogue.startDialogue(npcId, runtime),
    returnSceneKey,
    returnData,
    selectedIndex: 0,
    showTranslation: window.innerWidth <= 840,
  };
}

export function getDialogueNode(runtime, dialogueState) {
  return runtime.dialogue.getCurrentNode(dialogueState.session, runtime);
}

export function applyDialogueChoice(runtime, dialogueState, choiceIndex) {
  return runtime.dialogue.choose(dialogueState.session, choiceIndex, runtime);
}
