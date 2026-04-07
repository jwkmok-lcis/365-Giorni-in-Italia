// DialogueScene – visual-novel style NPC conversations.

import { Scene } from "../engine/Scene.js";

// ── NPC portrait palette (colour + emoji stand-in) ───────────────────────────
const NPC_STYLE = {
  "Marco":       { color: "#4a8c5c", accent: "#6aad7a", icon: "👨‍🌾" },
  "Lucia":       { color: "#8c5c4a", accent: "#ad7a6a", icon: "👩‍🍳" },
  "Donna Rosa":  { color: "#7a4a8c", accent: "#9a6aad", icon: "👵" },
  "Giorgio":     { color: "#8c6a4a", accent: "#ad8a6a", icon: "🧔" },
  "Prof. Conti": { color: "#4a6a8c", accent: "#6a8aad", icon: "👨‍🏫" },
  "Elena":       { color: "#8c4a6a", accent: "#ad6a8a", icon: "👩‍💼" },
};
const DEFAULT_STYLE = { color: "#4a6a7c", accent: "#6a8a9c", icon: "🗣️" };

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
    this._showTranslation = false;
    this._btnRects = { voice: null, translate: null, choices: [] };
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
    this._showTranslation = false;
    this._voiceFlash = 0;
    this._transFlash = 0;

    this._updatePanels();
  }

  update() {
    if (this._cooldownFrames > 0) this._cooldownFrames -= 1;
    if (this._voiceFlash > 0) this._voiceFlash -= 1;
    if (this._transFlash > 0) this._transFlash -= 1;
  }

  // ── Input ──────────────────────────────────────────────────────────────

  handleInput(event) {
    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart" || event.type === "click";
    if (!isKey && !isTap) return;
    if (this._cooldownFrames > 0) return;

    const node = this._game.context.dialogue.getCurrentNode(this._session);

    if (isTap && event.canvasY !== undefined) {
      // Voice button
      if (this._hitTest(event, this._btnRects.voice)) {
        this._voiceFlash = 12;
        this._speakCurrentNode();
        return;
      }
      // Translate button
      if (this._hitTest(event, this._btnRects.translate)) {
        this._transFlash = 12;
        this._showTranslation = !this._showTranslation;
        return;
      }
      // Tap a choice
      for (let i = 0; i < this._btnRects.choices.length; i++) {
        if (this._hitTest(event, this._btnRects.choices[i])) {
          this._choiceIndex = i;
          this._confirmChoice();
          return;
        }
      }
      return;
    }

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
    if (event.key === "t" || event.key === "T") {
      this._showTranslation = !this._showTranslation;
      return;
    }
    if (event.key === "v" || event.key === "V") {
      this._speakCurrentNode();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      this._confirmChoice();
    }
  }

  _confirmChoice() {
    const result = this._game.context.dialogue.choose(this._session, this._choiceIndex, this._game.context);
    this._choiceIndex = 0;

    if (result.ended) {
      this._game.context.voice?.stop();
      this._game.context.scenes.go(this._returnScene, this._game, this._returnParams);
      return;
    }

    this._speakCurrentNode();
    this._updatePanels();
  }

  _speakCurrentNode() {
    const voice = this._game.context.voice;
    if (!voice) return;
    voice.unlockFromGesture();
    const node = this._game.context.dialogue.getCurrentNode(this._session);
    const result = voice.speak(node.text, { requireUnlock: false });
    if (!result?.ok) {
      this._promptPanel.textContent = `Voice unavailable: ${result.reason}. Try keyboard V or check browser speech settings.`;
      return;
    }
    // Post-check real runtime status (some browsers fail silently).
    setTimeout(() => {
      const status = voice.getLastStatus?.();
      if (!status || status.ok) return;
      this._promptPanel.textContent = `Voice failed (${status.reason}). Check browser/site audio + speech settings.`;
    }, 900);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  render(ctx) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const node = this._game.context.dialogue.getCurrentNode(this._session);
    const style = NPC_STYLE[node.speaker] ?? DEFAULT_STYLE;

    this._btnRects.choices = [];

    // ── Background gradient ──────────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0e1a28");
    grad.addColorStop(1, "#1a2940");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── Subtle top bar ───────────────────────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, 52);

    ctx.fillStyle = "#d4c8a8";
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DIALOGO", 20, 33);

    // Clue count on the right
    const clueCount = this._game.context.quest.getUnlockedClues().length;
    ctx.fillStyle = "#8a9ab0";
    ctx.font = "400 14px 'Segoe UI', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${clueCount} clue${clueCount !== 1 ? "s" : ""}`, W - 20, 33);
    ctx.textAlign = "left";

    // ── NPC portrait area ────────────────────────────────────────────
    const portraitX = 28;
    const portraitY = 72;
    const portraitSize = 72;

    // Portrait circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize / 2 + 3, 0, Math.PI * 2);
    ctx.fillStyle = style.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = style.color;
    ctx.fill();
    ctx.restore();

    // Emoji icon
    ctx.font = "36px serif";
    ctx.textAlign = "center";
    ctx.fillText(style.icon, portraitX + portraitSize / 2, portraitY + portraitSize / 2 + 12);
    ctx.textAlign = "left";

    // NPC name
    ctx.fillStyle = style.accent;
    ctx.font = "700 22px 'Segoe UI', sans-serif";
    ctx.fillText(node.speaker, portraitX + portraitSize + 16, portraitY + 28);

    // ── Action buttons (voice + translate) ───────────────────────────
    const btnY = portraitY + 46;
    const btnStartX = portraitX + portraitSize + 16;

    // Voice button — flash bright when tapped, show speaking state
    const speaking = this._game.context.voice?.isSpeaking() ?? false;
    const voiceLabel = speaking ? "🔊 Playing…" : "🔊 Voice";
    const voiceBg = this._voiceFlash > 0 ? "#4a8ac0" : (speaking ? "#2a5a70" : "#2a4a60");
    const voiceFg = this._voiceFlash > 0 ? "#ffffff" : "#7ec8e3";
    this._btnRects.voice = this._drawPill(ctx, voiceLabel, btnStartX, btnY, voiceBg, voiceFg);

    // Translate button — flash bright when tapped
    const transLabel = this._showTranslation ? "🌐 EN ✓" : "🌐 EN";
    const transBg = this._transFlash > 0 ? "#4ac060" : (this._showTranslation ? "#2a5a3a" : "#2a4a60");
    const transFg = this._transFlash > 0 ? "#ffffff" : (this._showTranslation ? "#7ee3a0" : "#7ec8e3");
    this._btnRects.translate = this._drawPill(ctx, transLabel, btnStartX + 130, btnY, transBg, transFg);

    // ── Speech bubble ────────────────────────────────────────────────
    const bubbleX = 20;
    const bubbleY = 160;
    const bubbleW = W - 40;
    const bubbleR = 14;

    // Calculate text height first
    ctx.font = "400 20px 'Segoe UI', Georgia, sans-serif";
    const italianLines = this._getWrappedLines(ctx, node.text, bubbleW - 40, 28);
    let totalLines = italianLines.length;

    let enLines = [];
    if (this._showTranslation && node.en) {
      ctx.font = "italic 400 17px 'Segoe UI', sans-serif";
      enLines = this._getWrappedLines(ctx, node.en, bubbleW - 40, 24);
      totalLines += enLines.length + 0.5; // gap
    }

    const bubbleH = Math.max(80, totalLines * 28 + 36);

    // Draw bubble
    this._drawRoundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, bubbleR, "rgba(255,255,255,0.07)");

    // Left accent bar
    ctx.fillStyle = style.accent;
    this._drawRoundedRect(ctx, bubbleX, bubbleY, 5, bubbleH, bubbleR, style.accent);

    // Italian text
    ctx.fillStyle = "#eae6dc";
    ctx.font = "400 20px 'Segoe UI', Georgia, sans-serif";
    let textY = bubbleY + 28;
    for (const line of italianLines) {
      ctx.fillText(line, bubbleX + 24, textY);
      textY += 28;
    }

    // English translation
    if (this._showTranslation && enLines.length) {
      textY += 6;
      ctx.fillStyle = "#8ab8c8";
      ctx.font = "italic 400 17px 'Segoe UI', sans-serif";
      for (const line of enLines) {
        ctx.fillText(line, bubbleX + 24, textY);
        textY += 24;
      }
    }

    // ── Choices ──────────────────────────────────────────────────────
    let choiceY = bubbleY + bubbleH + 18;
    ctx.font = "500 18px 'Segoe UI', sans-serif";


    node.choices.forEach((choice, idx) => {
      const selected = idx === this._choiceIndex;
      const cW = W - 60;
      const cH = 42;
      const cX = 30;

      // Choice card
      const bg = selected ? "rgba(120,210,140,0.18)" : "rgba(255,255,255,0.05)";
      const border = selected ? style.accent : "rgba(255,255,255,0.08)";
      this._drawRoundedRect(ctx, cX, choiceY, cW, cH, 10, bg);

      // Border highlight for selected
      if (selected) {
        ctx.save();
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        this._roundRectPath(ctx, cX, choiceY, cW, cH, 10);
        ctx.stroke();
        ctx.restore();
      }

      // Arrow indicator
      ctx.fillStyle = selected ? "#b8e8c0" : "#6a7a8a";
      ctx.font = "600 16px 'Segoe UI', sans-serif";
      ctx.fillText(selected ? "▸" : " ", cX + 12, choiceY + 27);

      // Choice text
      ctx.fillStyle = selected ? "#d8f0dc" : "#b0bec8";
      ctx.font = "400 17px 'Segoe UI', sans-serif";
      ctx.fillText(choice.text, cX + 32, choiceY + 27);

      this._btnRects.choices.push({ x: cX, y: choiceY, w: cW, h: cH });
      choiceY += cH + 8;
    });

    // ── Hint bar ─────────────────────────────────────────────────────
    if (this._session.clueHint) {
      const hintY = H - 36;
      ctx.fillStyle = "rgba(228,200,143,0.12)";
      ctx.fillRect(0, hintY - 16, W, 36);
      ctx.fillStyle = "#e4c88f";
      ctx.font = "italic 400 14px 'Segoe UI', sans-serif";
      ctx.fillText(`💡 ${this._session.clueHint}`, 20, hintY + 4);
    }

    // ── Bottom toolbar hint ──────────────────────────────────────────
    ctx.fillStyle = "#4a5a6a";
    ctx.font = "400 12px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("V = voice  ·  T = translate  ·  ↑↓ = select  ·  Enter / tap = confirm", W / 2, H - 8);
    ctx.textAlign = "left";
  }

  // ── Drawing helpers ────────────────────────────────────────────────────

  _drawPill(ctx, label, x, y, bg, fg) {
    ctx.font = "600 15px 'Segoe UI', sans-serif";
    const w = ctx.measureText(label).width + 32;
    const h = 34;
    // Pill background
    this._drawRoundedRect(ctx, x, y, w, h, h / 2, bg);
    // Subtle border to make it look clickable
    ctx.save();
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this._roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.stroke();
    ctx.restore();
    // Label
    ctx.fillStyle = fg;
    ctx.fillText(label, x + 16, y + 22);
    return { x, y, w, h };
  }

  _drawRoundedRect(ctx, x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    this._roundRectPath(ctx, x, y, w, h, r);
    ctx.fill();
  }

  _roundRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _getWrappedLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  _hitTest(event, rect) {
    if (!rect) return false;
    return (
      event.canvasX >= rect.x &&
      event.canvasX <= rect.x + rect.w &&
      event.canvasY >= rect.y &&
      event.canvasY <= rect.y + rect.h
    );
  }

  _updatePanels() {
    if (!this._statusPanel || !this._promptPanel) return;
    const clueCount = this._game.context.quest.getUnlockedClues().length;
    this._statusPanel.textContent = `Talking with ${this._session.npcName}`;
    this._promptPanel.textContent = `V = voice · T = translate · Arrows/tap choose · Enter/tap confirm | Clues: ${clueCount}`;
  }
}
