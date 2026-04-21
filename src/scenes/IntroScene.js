// IntroScene – title menu plus multi-screen Chapter 1 onboarding.

import { Scene } from "../engine/Scene.js";

const W = 800;
const H = 512;

const MENU_ITEMS = [
  { id: "start", label: "Start Game" },
  { id: "continue", label: "Continue" },
  { id: "settings", label: "Settings" },
];

const STORY_PAGES = [
  { it: "Arrivi in Italia.", en: "You arrive in Italy." },
  { it: "Vuoi imparare l'italiano.", en: "You want to learn Italian." },
  { it: "Ma non vuoi studiare solo dai libri.", en: "But you do not want to study only from books." },
  { it: "Vuoi vivere la lingua.", en: "You want to live the language." },
  { it: "A Bologna, senti una storia.", en: "In Bologna, you hear a story." },
  { it: "Il ragù perfetto esiste.", en: "The perfect ragù exists." },
  { it: "Ma nessuno dice la verità.", en: "But no one tells the truth." },
  { it: "Ogni persona dice qualcosa di diverso.", en: "Everyone says something different." },
  { it: "Parli con le persone.", en: "You talk to people." },
  { it: "Ascolti.", en: "You listen." },
  { it: "Fai domande.", en: "You ask questions." },
  { it: "Impari poco a poco.", en: "You learn little by little." },
  { it: "Nel gioco, scegli le frasi.", en: "In the game, you choose sentences." },
  { it: "Parla in italiano.", en: "Speak in Italian." },
  { it: "Più parli, più impari.", en: "The more you speak, the more you learn." },
  { it: "Oggi sei in Piazza Maggiore.", en: "Today you are in Piazza Maggiore." },
  { it: "Qualcuno può aiutarti.", en: "Someone can help you." },
  {
    it: "Inizia da Marco.",
    en: "Start with Marco.",
    badge: "Quest Started · Sussurri del Mercato",
    note: "Hai un taccuino. Scrivi qui quello che scopri.",
  },
];

export class IntroScene extends Scene {
  constructor() {
    super();
    this._blink = 0;
    this._mode = "menu";
    this._pageIndex = 0;
    this._menuIndex = 0;
    this._hasSave = false;
    this._voiceEnabled = true;
    this._btnRects = {
      menu: [],
      back: null,
      next: null,
      settingsBack: null,
      voice: null,
    };
  }

  enter(game) {
    this._game = game;
    this._blink = 0;
    this._mode = "menu";
    this._pageIndex = 0;
    this._hasSave = !!game.context._hasSave;
    this._voiceEnabled = !game.context.voice?.muted;
    this._menuIndex = this._hasSave ? 1 : 0;
    this._updatePanels();
  }

  update(dt) {
    this._blink = (this._blink + dt) % 1.2;
  }

  handleInput(event) {
    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart" || event.type === "click";
    if (!isKey && !isTap) return;

    if (isTap && event.canvasX !== undefined && event.canvasY !== undefined && this._hit(event, this._btnRects.voice)) {
      this._toggleVoice();
      return;
    }

    if (this._mode === "menu") {
      this._handleMenuInput(event, isKey, isTap);
      return;
    }

    if (this._mode === "settings") {
      this._handleSettingsInput(event, isKey, isTap);
      return;
    }

    this._handleStoryInput(event, isKey, isTap);
  }

  _handleMenuInput(event, isKey, isTap) {
    if (isTap && event.canvasX !== undefined && event.canvasY !== undefined) {
      for (let i = 0; i < this._btnRects.menu.length; i += 1) {
        const rect = this._btnRects.menu[i];
        if (this._hit(event, rect)) {
          this._menuIndex = i;
          this._activateMenuItem(MENU_ITEMS[i].id);
          return;
        }
      }
      return;
    }

    if (!isKey) return;

    if (event.key === "ArrowUp") {
      this._menuIndex = (this._menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
      this._updatePanels();
      return;
    }

    if (event.key === "ArrowDown") {
      this._menuIndex = (this._menuIndex + 1) % MENU_ITEMS.length;
      this._updatePanels();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      this._activateMenuItem(MENU_ITEMS[this._menuIndex].id);
    }
  }

  _handleSettingsInput(event, isKey, isTap) {
    if (isTap && event.canvasX !== undefined && event.canvasY !== undefined && this._hit(event, this._btnRects.settingsBack)) {
      this._mode = "menu";
      this._updatePanels();
      return;
    }

    if (isKey && (event.key === "Escape" || event.key === "Backspace" || event.key === "Enter" || event.key === " ")) {
      this._mode = "menu";
      this._updatePanels();
    }
  }

  _handleStoryInput(event, isKey, isTap) {
    if (isKey && (event.key === "v" || event.key === "V")) {
      this._toggleVoice();
      return;
    }

    if (isTap && event.canvasX !== undefined && event.canvasY !== undefined) {
      if (this._hit(event, this._btnRects.back)) {
        this._goBack();
        return;
      }
      if (this._hit(event, this._btnRects.next)) {
        this._goNext();
        return;
      }
      this._goNext();
      return;
    }

    if (!isKey) return;

    if (event.key === "Escape") {
      this._mode = "menu";
      this._updatePanels();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      this._goBack();
      return;
    }

    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      this._goNext();
    }
  }

  _activateMenuItem(id) {
    if (id === "continue") {
      if (!this._hasSave) return;
      const nextScene = this._game.context._resumeScene ?? (this._game.context.day.canExplore() ? "map" : "lesson");
      this._game.context.scenes.go(nextScene, this._game);
      return;
    }

    if (id === "settings") {
      this._mode = "settings";
      this._updatePanels();
      return;
    }

    this._startNewGame();
    this._mode = "story";
    this._pageIndex = 0;
    this._speakCurrentPage();
    this._updatePanels();
  }

  _startNewGame() {
    const { day, player, quest, save, eventFeed } = this._game.context;
    day.reset();
    player.reset();
    quest.reset();
    save.clear();
    this._game.context._hasSave = false;
    this._game.context._resumeScene = "map";

    if (eventFeed) {
      eventFeed.messages = [];
      eventFeed.push("Benvenuto a Bologna.");
      eventFeed.push("Hai ricevuto un taccuino.");
      eventFeed.push("Obiettivo: parla con Marco.");
    }
  }

  _goBack() {
    if (this._pageIndex > 0) {
      this._pageIndex -= 1;
      this._speakCurrentPage();
      this._updatePanels();
      return;
    }
    this._mode = "menu";
    this._updatePanels();
  }

  _goNext() {
    if (this._pageIndex < STORY_PAGES.length - 1) {
      this._pageIndex += 1;
      this._speakCurrentPage();
      this._updatePanels();
      return;
    }

    if (!this._game.context.day.canExplore()) {
      this._game.context.day.completeLesson(this._game.context.bus);
    }
    this._game.context.save?.save(this._game.context);
    this._game.context.scenes.go("map", this._game);
  }

  render(ctx) {
    this._btnRects = { menu: [], back: null, next: null, settingsBack: null, voice: null };

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1b2632");
    grad.addColorStop(1, "#111922");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, 140, W / 2, H / 2, 420);
    vignette.addColorStop(0, "rgba(255,255,255,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (this._mode === "menu") {
      this._renderMenu(ctx);
      return;
    }

    if (this._mode === "settings") {
      this._renderSettings(ctx);
      return;
    }

    this._renderStory(ctx);
  }

  _renderMenu(ctx) {
    ctx.fillStyle = "#f5e7cf";
    ctx.font = "700 46px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("365 Giorni in Italia", W / 2, 94);

    ctx.fillStyle = "#e0c37e";
    ctx.font = "600 28px Arial, sans-serif";
    ctx.fillText("Capitolo 1: Bologna", W / 2, 134);

    ctx.fillStyle = "#d4c8a8";
    ctx.font = "400 18px Arial, sans-serif";
    ctx.fillText("Una storia, una città, e il mistero del ragù perfetto.", W / 2, 176);

    let y = 236;
    for (let i = 0; i < MENU_ITEMS.length; i += 1) {
      const item = MENU_ITEMS[i];
      const disabled = item.id === "continue" && !this._hasSave;
      const selected = i === this._menuIndex;
      const label = disabled ? "Continue (No Save)" : item.label;
      this._btnRects.menu.push(this._drawButton(ctx, W / 2 - 130, y, 260, 46, label, selected, disabled));
      y += 62;
    }

    const hintAlpha = 0.45 + Math.abs(Math.sin(this._blink * Math.PI)) * 0.55;
    ctx.fillStyle = `rgba(240, 224, 200, ${hintAlpha})`;
    ctx.font = "600 16px Arial, sans-serif";
    ctx.fillText("Use Arrow keys and Enter, or click a button.", W / 2, 454);
    ctx.font = "400 13px Arial, sans-serif";
    ctx.fillStyle = "#9eb0bf";
    ctx.fillText("Italian A1 story intro · mouse and keyboard supported", W / 2, 480);
    this._renderVoiceToggle(ctx);
    ctx.textAlign = "left";
  }

  _renderSettings(ctx) {
    this._drawPanel(ctx, 72, 54, W - 144, H - 108);

    ctx.fillStyle = "#f5e7cf";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Settings & Controls", W / 2, 104);

    ctx.textAlign = "left";
    ctx.fillStyle = "#d4c8a8";
    ctx.font = "600 18px Arial, sans-serif";
    ctx.fillText("Keyboard", 110, 156);
    ctx.font = "400 16px Arial, sans-serif";
    ctx.fillText("• Arrow keys / WASD: move", 110, 186);
    ctx.fillText("• Enter / Space: confirm or interact", 110, 212);
    ctx.fillText("• Speaker icon: voice on or off", 110, 238);
    ctx.fillText("• T: show English in dialogue", 110, 264);

    ctx.font = "600 18px Arial, sans-serif";
    ctx.fillText("Mouse / Touch", 110, 316);
    ctx.font = "400 16px Arial, sans-serif";
    ctx.fillText("• Click the map to move", 110, 346);
    ctx.fillText("• Click buttons to continue", 110, 372);
    ctx.fillText("• Tap near a person or a door to interact", 110, 398);

    this._btnRects.settingsBack = this._drawButton(ctx, W / 2 - 90, 430, 180, 40, "Back", true, false);
    this._renderVoiceToggle(ctx);
    ctx.textAlign = "left";
  }

  _renderStory(ctx) {
    const page = STORY_PAGES[this._pageIndex];
    this._drawPanel(ctx, 56, 54, W - 112, H - 108);

    ctx.fillStyle = "#e0c37e";
    ctx.font = "700 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Capitolo 1 · Bologna · ${this._pageIndex + 1}/${STORY_PAGES.length}`, W / 2, 100);

    if (page.badge) {
      ctx.fillStyle = "#a8d890";
      ctx.font = "700 16px Arial, sans-serif";
      ctx.fillText(page.badge, W / 2, 150);
    }

    ctx.fillStyle = "#f5e7cf";
    ctx.font = "700 34px Arial, sans-serif";
    this._drawCenteredWrappedText(ctx, page.it, W / 2, page.badge ? 208 : 190, 540, 42);

    ctx.fillStyle = "#9ec8db";
    ctx.font = "400 20px Arial, sans-serif";
    this._drawCenteredWrappedText(ctx, page.en, W / 2, page.badge ? 284 : 266, 520, 30);

    if (page.note) {
      ctx.fillStyle = "#d4c8a8";
      ctx.font = "400 16px Arial, sans-serif";
      this._drawCenteredWrappedText(ctx, page.note, W / 2, 340, 520, 24);
    }

    ctx.fillStyle = "#b8cdda";
    ctx.font = "500 15px Arial, sans-serif";
    ctx.fillText(this._voiceEnabled ? "Speaker is on for all story screens." : "Use the speaker icon to hear Italian.", W / 2, 400);

    this._renderVoiceToggle(ctx);
    this._btnRects.back = this._drawButton(ctx, 110, 430, 150, 40, this._pageIndex === 0 ? "Menu" : "Back", false, false);
    this._btnRects.next = this._drawButton(ctx, W - 260, 430, 150, 40, this._pageIndex === STORY_PAGES.length - 1 ? "Enter Bologna" : "Next", true, false);

    ctx.textAlign = "left";
  }

  _updatePanels() {
    const status = document.getElementById("statusPanel");
    const prompt = document.getElementById("promptPanel");
    if (!status || !prompt) return;

    if (this._mode === "menu") {
      status.textContent = "Welcome to Bologna";
      prompt.textContent = "Choose Start Game, Continue, or Settings.";
      return;
    }

    if (this._mode === "settings") {
      status.textContent = "Controls and accessibility";
      prompt.textContent = "Review the controls, then go back when ready.";
      return;
    }

    status.textContent = `Chapter 1 story screen ${this._pageIndex + 1}/${STORY_PAGES.length}`;
    prompt.textContent = "Enter/click to continue · Backspace/Left Arrow to go back · speaker icon toggles voice";
  }

  _drawPanel(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  _toggleVoice() {
    const voice = this._game.context.voice;
    if (!voice) return;
    voice.unlockFromGesture();
    voice.setMuted(this._voiceEnabled);
    this._voiceEnabled = !voice.muted;
    if (this._voiceEnabled) {
      this._speakCurrentPage();
    }
    this._updatePanels();
  }

  _speakCurrentPage() {
    if (this._mode !== "story" || !this._voiceEnabled) return;
    const page = STORY_PAGES[this._pageIndex];
    this._game.context.voice?.unlockFromGesture();
    this._game.context.voice?.speak(page.it, { requireUnlock: false });
  }

  _renderVoiceToggle(ctx) {
    const label = this._voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off";
    this._btnRects.voice = this._drawButton(ctx, W - 186, 18, 156, 34, label, this._voiceEnabled, false);
  }

  _drawButton(ctx, x, y, w, h, label, selected, disabled) {
    const fill = disabled
      ? "rgba(120,130,140,0.15)"
      : selected
        ? "rgba(120, 210, 140, 0.22)"
        : "rgba(255,255,255,0.06)";
    const border = disabled
      ? "rgba(170,180,190,0.16)"
      : selected
        ? "rgba(132,220,152,0.9)"
        : "rgba(255,255,255,0.12)";

    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = border;
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = disabled ? "#8997a3" : "#eef3f7";
    ctx.font = "700 18px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + 29);
    return { x, y, w, h };
  }

  _drawCenteredWrappedText(ctx, text, centerX, startY, maxWidth, lineHeight) {
    const words = String(text).split(" ");
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

    lines.forEach((entry, index) => {
      ctx.fillText(entry, centerX, startY + index * lineHeight);
    });

    return startY + lines.length * lineHeight;
  }

  _hit(event, rect) {
    if (!rect) return false;
    return event.canvasX >= rect.x && event.canvasX <= rect.x + rect.w && event.canvasY >= rect.y && event.canvasY <= rect.y + rect.h;
  }
}
