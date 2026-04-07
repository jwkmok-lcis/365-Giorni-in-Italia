// DialogueScene – renders NPC conversations and multiple-choice responses.

import { Scene } from "../engine/Scene.js";

export class DialogueScene extends Scene {
  constructor() {
    super();
    this._statusPanel = null;
    this._promptPanel = null;
    this._session = null;
    this._choiceIndex = 0;
    this._cooldownFrames = 0;
    this._returnScene = "map";
    this._returnParams = undefined;
  }

  enter(game, params = {}) {
    this._game = game;
    this._statusPanel = document.getElementById("statusPanel");
    this._promptPanel = document.getElementById("promptPanel");

    this._returnScene = params.returnScene ?? "map";
    this._returnParams = params.returnParams;
    this._session = game.context.dialogue.startDialogue(params.npcId);
    this._choiceIndex = 0;
    this._cooldownFrames = 8;

    this._updatePanels();
  }

  update() {
    if (this._cooldownFrames > 0) {
      this._cooldownFrames -= 1;
    }
  }

  handleInput(event) {
    if (event.type !== "keydown") return;
    if (this._cooldownFrames > 0) return;

    const node = this._game.context.dialogue.getCurrentNode(this._session);

    if (event.key === "ArrowUp") {
      this._choiceIndex = (this._choiceIndex - 1 + node.choices.length) % node.choices.length;
      this._updatePanels();
      return;
    }

    if (event.key === "ArrowDown") {
      this._choiceIndex = (this._choiceIndex + 1) % node.choices.length;
      this._updatePanels();
      return;
    }

    if (event.key === "Enter") {
      const result = this._game.context.dialogue.choose(this._session, this._choiceIndex, this._game.context);
      this._choiceIndex = 0;

      if (result.ended) {
        this._game.context.scenes.go(this._returnScene, this._game, this._returnParams);
        return;
      }

      this._updatePanels();
    }
  }

  render(ctx) {
    const { width, height } = ctx.canvas;
    const node = this._game.context.dialogue.getCurrentNode(this._session);

    ctx.fillStyle = "#191f29";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#efe8d8";
    ctx.font = "700 34px Georgia";
    ctx.fillText("Dialogo", 40, 64);

    ctx.fillStyle = "#c7d8e5";
    ctx.font = "600 22px Georgia";
    ctx.fillText(node.speaker, 40, 118);

    ctx.fillStyle = "#f3f2eb";
    ctx.font = "400 24px Georgia";
    this._drawWrappedText(ctx, node.text, 40, 166, 720, 34);

    let y = 340;
    ctx.font = "400 21px Georgia";
    node.choices.forEach((choice, index) => {
      const selected = index === this._choiceIndex;
      ctx.fillStyle = selected ? "#b8df94" : "#d9e6ee";
      ctx.fillText(`${selected ? ">" : " "} ${choice.text}`, 52, y);
      y += 44;
    });

    if (this._session.clueHint) {
      ctx.fillStyle = "#e4c88f";
      ctx.font = "400 17px Georgia";
      this._drawWrappedText(ctx, `Hint: ${this._session.clueHint}`, 40, 520, 720, 24);
    }
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let row = y;

    for (const word of words) {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trimEnd(), x, row);
        row += lineHeight;
        line = `${word} `;
      } else {
        line = test;
      }
    }

    if (line) {
      ctx.fillText(line.trimEnd(), x, row);
    }
  }

  _updatePanels() {
    if (!this._statusPanel || !this._promptPanel) return;

    const clueCount = this._game.context.quest.getUnlockedClues().length;
    this._statusPanel.textContent = `Talking with ${this._session.npcName}`;
    this._promptPanel.textContent = `Arrow keys choose an option, Enter confirms. | Clues unlocked: ${clueCount}`;
  }
}
