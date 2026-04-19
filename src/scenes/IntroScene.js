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

    // Simple test: fill with red to see if rendering works
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, W, H);

    // Add some text
    ctx.fillStyle = "white";
    ctx.font = "48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Intro Scene Loading...", W / 2, H / 2);
}
