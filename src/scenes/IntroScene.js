// IntroScene – first chapter introduction and onboarding screen.

import { Scene } from "../engine/Scene.js";

export class IntroScene extends Scene {
  constructor() {
    super();
    this._blink = 0;
  }

  enter(game) {
    this._game = game;
    this._blink = 0;
    const quest = this._game.context.quest.activeQuest;
    const chapterTitle = quest ? quest.title : "Sussurri del Mercato";
    this._title = "Capitolo 1";
    this._subtitle = chapterTitle;
    this._lines = [
      "Sei uno studente appena arrivato a Bologna.",
      "Marco ti ha chiesto aiuto per capire il vero ragù bolognese.",
      "Ascolta, leggi e rispondi a frasi semplici.",
      "In questa avventura userai italiano A1 mentre esplori la città.",
      "Prima fai la lezione del giorno, poi parla con le persone in mappa.",
    ];
    this._hint = "Premi INVIO o tocca lo schermo per iniziare.";
    this._game.context.eventFeed.push(`Capitolo 1: ${chapterTitle}`);
  }

  update(dt) {
    this._blink = (this._blink + dt) % 1.2;
  }

  handleInput(event) {
    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart" || event.type === "click";
    if (!isKey && !isTap) return;

    if (isKey && event.key !== "Enter" && event.key !== " ") return;

    const nextScene = this._game.context.day.canExplore() ? "map" : "lesson";
    this._game.context.scenes.go(nextScene, this._game);
  }

  render(ctx) {
    const W = 800;
    const H = 512;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1b2632");
    grad.addColorStop(1, "#111922");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Soft vignette
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 420);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Title block
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(40, 44, W - 80, 220);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40.5, 44.5, W - 81, 219);

    ctx.fillStyle = "#f5e7cf";
    ctx.font = "700 44px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this._title, W / 2, 96);

    ctx.fillStyle = "#e0c37e";
    ctx.font = "600 28px Arial, sans-serif";
    ctx.fillText(this._subtitle, W / 2, 142);

    ctx.fillStyle = "#d4c8a8";
    ctx.font = "400 18px Arial, sans-serif";
    ctx.textAlign = "left";
    const lineStartY = 190;
    for (let i = 0; i < this._lines.length; i += 1) {
      ctx.fillText(this._lines[i], 60, lineStartY + i * 30);
    }

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(40, 322, W - 80, 152);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.strokeRect(40.5, 322.5, W - 81, 151);

    ctx.fillStyle = "#bcd4e6";
    ctx.font = "500 18px Arial, sans-serif";
    ctx.fillText("Cosa fare in questo capitolo:", 60, 352);
    ctx.font = "400 16px Arial, sans-serif";
    ctx.fillText("- Parla con Marco e poi con Lucia in città.", 60, 382);
    ctx.fillText("- Usa il pulsante V nella conversazione per ascoltare.", 60, 408);
    ctx.fillText("- Usa il pulsante T per vedere la traduzione.", 60, 434);

    const hintAlpha = 0.4 + Math.abs(Math.sin(this._blink * Math.PI)) * 0.6;
    ctx.fillStyle = `rgba(240, 224, 200, ${hintAlpha})`;
    ctx.font = "600 20px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this._hint, W / 2, 490);
  }
}
