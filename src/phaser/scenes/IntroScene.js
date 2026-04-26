import * as Phaser from "../../vendor/phaser.esm.js";

const MENU_BG_TEXTURE_KEY = "menu-bg";
const MENU_BG_URL = "assets/menu-bg-real.png";

const PALETTE = {
  skyTop: 0xf4d8a6,
  skyBottom: 0xcd7a49,
  paper: 0xf5ecd9,
  paperEdge: 0xd4c2a5,
  paperShadow: 0x69422d,
  olive: 0x6b7433,
  terracotta: 0xa94a2c,
  ink: 0x2c2c2c,
  muted: 0x4a4138,
  dusk: 0x4d2f25,
  river: 0x506a74,
  foreground: 0x221914,
};

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

export class IntroScene extends Phaser.Scene {
  constructor() {
    super("IntroScene");
    this.mode = "menu";
    this.menuIndex = 0;
    this.pageIndex = 0;
    this.root = null;
  }

  preload() {
    if (!this.textures.exists(MENU_BG_TEXTURE_KEY)) {
      this.load.image(MENU_BG_TEXTURE_KEY, MENU_BG_URL);
    }
  }

  create() {
    this.runtime = this.registry.get("runtime");
    this.runtime.setHeaderHidden(true);
    this.runtime.setInfoDrawerHidden(true);
    this.runtime.clearUi();

    this.mode = "menu";
    this.pageIndex = 0;
    this.menuIndex = 0;
    this.root = this.add.container(0, 0);
    this.refresh();

    this.keyHandler = (event) => this.handleKey(event);
    this.input.keyboard.on("keydown", this.keyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off("keydown", this.keyHandler);
      this.runtime.voice.stop();
    });
  }

  getMenuItems() {
    const items = [];
    if (this.runtime.loaded) {
      items.push({ id: "continue", label: "Resume your journey", variant: "primary" });
      items.push({ id: "start", label: "Start a new day", variant: "secondary" });
    } else {
      items.push({ id: "start", label: "Begin your journey", variant: "primary" });
    }
    return items;
  }

  drawMenuBackground() {
    const { width, height } = this.scale;

    if (this.textures.exists(MENU_BG_TEXTURE_KEY)) {
      const image = this.add.image(width / 2, height / 2, MENU_BG_TEXTURE_KEY).setDisplaySize(width, height);
      this.tweens.add({
        targets: image,
        x: width / 2 + 10,
        duration: 10000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      const gradient = this.add.graphics();
      gradient.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.22, 0.28, 0.14);
      gradient.fillRect(0, 0, width, height);
      const vignetteTop = this.add.rectangle(width / 2, 0, width, 150, 0x000000, 0.08).setOrigin(0.5, 0);
      const vignetteBottom = this.add.rectangle(width / 2, height, width, 190, 0x000000, 0.16).setOrigin(0.5, 1);
      const vignetteLeft = this.add.rectangle(0, height / 2, 110, height, 0x000000, 0.12).setOrigin(0, 0.5);
      const vignetteRight = this.add.rectangle(width, height / 2, 110, height, 0x000000, 0.12).setOrigin(1, 0.5);
      this.root.add([image, gradient, vignetteTop, vignetteBottom, vignetteLeft, vignetteRight]);
      return;
    }

    const sky = this.add.rectangle(width / 2, height / 2, width, height, PALETTE.skyBottom);
    const glow = this.add.ellipse(width / 2, 132, width * 1.05, 220, PALETTE.skyTop, 0.85);
    const city = this.add.graphics();
    city.fillStyle(0x8d5232, 0.92);
    city.fillPoints([
      { x: 0, y: 312 },
      { x: 74, y: 300 },
      { x: 126, y: 282 },
      { x: 186, y: 292 },
      { x: 244, y: 258 },
      { x: 312, y: 274 },
      { x: 392, y: 248 },
      { x: 468, y: 280 },
      { x: 544, y: 256 },
      { x: 610, y: 286 },
      { x: 688, y: 266 },
      { x: 800, y: 304 },
      { x: 800, y: 356 },
      { x: 0, y: 356 },
    ], true);
    city.fillStyle(0x71462f, 1);
    city.fillRect(160, 208, 18, 76);
    city.fillRect(242, 178, 22, 82);
    city.fillRect(612, 188, 18, 96);
    city.fillRect(692, 164, 24, 104);
    const river = this.add.rectangle(width / 2, 388, width, 88, PALETTE.river, 0.95);
    const riverGlow = this.add.rectangle(width / 2, 404, width, 22, 0xf0c98e, 0.1);
    const embankment = this.add.rectangle(width / 2, 470, width, 84, PALETTE.dusk, 0.96);
    const leftFrame = this.add.ellipse(12, 270, 180, 620, PALETTE.foreground, 0.92).setOrigin(0.5);
    const rightFrame = this.add.ellipse(794, 258, 174, 640, PALETTE.foreground, 0.94).setOrigin(0.5);
    const vignette = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.14);

    this.root.add([sky, glow, city, river, riverGlow, embankment, leftFrame, rightFrame, vignette]);
  }

  refresh() {
    this.root.removeAll(true);
    this.drawMenuBackground();
    this.menuIndex = Phaser.Math.Clamp(this.menuIndex, 0, this.getMenuItems().length - 1);

    if (this.mode === "menu") {
      this.buildMenu();
      return;
    }

    if (this.mode === "settings") {
      this.buildSettings();
      return;
    }

    this.buildStory();
  }

  buildMenu() {
    const panelShadow = this.add.rectangle(400, 250, 388, 404, 0x000000, 0.16)
      .setOrigin(0.5)
      .setScale(1.04, 1.02);
    const panel = this.add.rectangle(400, 244, 388, 404, PALETTE.paper, 0.985)
      .setOrigin(0.5)
      .setStrokeStyle(2, PALETTE.paperEdge, 0.62);
    const panelInner = this.add.rectangle(400, 244, 370, 386, 0x000000, 0)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xcbb28a, 0.6);
    const crest = this.add.text(400, 92, "365", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "48px",
      color: "#a94a2c",
      fontStyle: "700",
    }).setOrigin(0.5);
    const title = this.add.text(400, 136, "Giorni in Italia", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "32px",
      color: "#58612f",
      fontStyle: "700",
    }).setOrigin(0.5);
    const oliveRule = this.add.rectangle(374, 170, 44, 4, PALETTE.olive).setOrigin(0.5);
    const terracottaRule = this.add.rectangle(426, 170, 44, 4, PALETTE.terracotta).setOrigin(0.5);
    const subtitleOne = this.add.text(400, 218, "Travel city by city.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "16px",
      color: "#333333",
    }).setOrigin(0.5);
    const subtitleTwo = this.add.text(400, 242, "Uncover hidden stories.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "16px",
      color: "#333333",
    }).setOrigin(0.5);
    const copy = this.add.text(400, 292, "Your Italian grows with\nevery choice you make.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "14px",
      color: "#666666",
      align: "center",
      lineSpacing: 4,
      wordWrap: { width: 250 },
    }).setOrigin(0.5);
    const speakerButton = this.createSpeakerButton(548, 96, {
      active: this.mode === "settings",
      muted: this.runtime.voice.muted,
      onClick: () => {
        this.runtime.voice.toggleMuted();
        this.refresh();
      },
    });

    this.root.add([panelShadow, panel, panelInner, crest, title, oliveRule, terracottaRule, subtitleOne, subtitleTwo, copy, speakerButton]);

    const menuItems = this.getMenuItems();
    const baseY = 354;
    const spacing = 60;

    menuItems.forEach((item, index) => {
      const y = baseY + index * spacing;
      const width = 272;
      const height = 52;
      const button = this.createButton(400, y, width, height, item.label, {
        active: this.menuIndex === index,
        variant: item.variant,
        onClick: () => {
          this.menuIndex = index;
          this.activateMenuItem(item.id);
        },
      });
      this.root.add(button);
    });

    const elements = [panelShadow, panel, panelInner, crest, title, oliveRule, terracottaRule, subtitleOne, subtitleTwo, copy, speakerButton];
    elements.forEach((el) => {
      el.setAlpha(0);
    });
    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 500,
      ease: "Power2",
    });
    this.tweens.add({
      targets: elements.filter((el) => el !== panel),
      alpha: 1,
      delay: 200,
      duration: 600,
      stagger: 80,
      ease: "Power2",
    });
  }

  buildSettings() {
    const shadow = this.add.rectangle(400, 260, 420, 268, 0x000000, 0.18).setOrigin(0.5);
    const panel = this.add.rectangle(400, 252, 420, 268, PALETTE.paper, 0.97).setOrigin(0.5).setStrokeStyle(1, 0x000000, 0.1);
    const title = this.add.text(400, 168, "Settings", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "34px",
      color: "#2c2c2c",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const voiceState = this.runtime.voice.muted ? "Muted" : "Enabled";
    const voiceButton = this.createButton(400, 244, 286, 48, `Voice: ${voiceState}`, {
      active: true,
      variant: "secondary",
      onClick: () => {
        this.runtime.voice.toggleMuted();
        this.refresh();
      },
    });
    const summary = this.runtime.voice.isSupported()
      ? "Italian voice playback uses the browser speech engine."
      : "Voice playback is unavailable in this browser.";
    const copy = this.add.text(400, 312, summary, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "14px",
      color: "#444444",
      align: "center",
      wordWrap: { width: 260 },
      lineSpacing: 6,
    }).setOrigin(0.5);

    const backButton = this.createButton(400, 380, 184, 42, "Back", {
      active: false,
      variant: "tertiary",
      onClick: () => {
        this.mode = "menu";
        this.refresh();
      },
    });

    this.root.add([shadow, panel, title, voiceButton, copy, backButton]);
  }

  buildStory() {
    const page = STORY_PAGES[this.pageIndex];
    const shadow = this.add.rectangle(400, 260, 470, 356, 0x000000, 0.18).setOrigin(0.5);
    const panel = this.add.rectangle(400, 252, 470, 356, PALETTE.paper, 0.97).setOrigin(0.5).setStrokeStyle(1, 0x000000, 0.1);
    const badge = page.badge
      ? this.add.text(400, 150, page.badge, {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "12px",
          color: "#fff8eb",
          backgroundColor: "#6d7434",
          padding: { left: 10, right: 10, top: 6, bottom: 6 },
        }).setOrigin(0.5)
      : null;
    const it = this.add.text(400, 214, page.it, {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "34px",
      color: "#2c2c2c",
      align: "center",
      wordWrap: { width: 340 },
    }).setOrigin(0.5);
    const en = this.add.text(400, 288, page.en, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "16px",
      color: "#444444",
      align: "center",
      wordWrap: { width: 340 },
      lineSpacing: 6,
    }).setOrigin(0.5);
    const note = page.note
      ? this.add.text(400, 344, page.note, {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "12px",
          color: "#7b674a",
          align: "center",
        }).setOrigin(0.5)
      : null;
    const progress = this.add.text(400, 392, `${this.pageIndex + 1} / ${STORY_PAGES.length}`, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: "12px",
      color: "#8b7556",
    }).setOrigin(0.5);
    const back = this.createButton(310, 444, 150, 42, "Back", {
      active: false,
      disabled: this.pageIndex === 0,
      variant: "tertiary",
      onClick: () => {
        if (this.pageIndex === 0) return;
        this.pageIndex -= 1;
        this.refresh();
        this.speakCurrentPage();
      },
    });
    const nextLabel = this.pageIndex === STORY_PAGES.length - 1 ? "Begin Day 1 Lesson" : "Next";
    const next = this.createButton(498, 444, 226, 42, nextLabel, {
      active: true,
      variant: "primary",
      onClick: () => {
        if (this.pageIndex === STORY_PAGES.length - 1) {
          this.scene.start("LessonScene");
          return;
        }
        this.pageIndex += 1;
        this.refresh();
        this.speakCurrentPage();
      },
    });

    this.root.add([shadow, panel, it, en, progress, back, next]);
    if (badge) this.root.add(badge);
    if (note) this.root.add(note);
  }

  activateMenuItem(id) {
    if (id === "start") {
      this.runtime.startNewGame();
      this.mode = "story";
      this.pageIndex = 0;
      this.refresh();
      this.speakCurrentPage();
      return;
    }

    if (id === "continue" && this.runtime.loaded) {
      const sceneKey = this.runtime.refreshResumeScene();
      this.scene.start(sceneKey, this.runtime.getResumeSceneData());
      return;
    }

    if (id === "settings") {
      this.runtime.voice.stop();
      this.mode = "settings";
      this.refresh();
    }
  }

  handleKey(event) {
    const menuItems = this.getMenuItems();

    if (this.mode === "menu") {
      if (event.key.toLowerCase() === "s") {
        this.mode = "settings";
        this.refresh();
        return;
      }
      if (event.key === "ArrowUp") {
        this.menuIndex = (this.menuIndex - 1 + menuItems.length) % menuItems.length;
        this.refresh();
      }
      if (event.key === "ArrowDown") {
        this.menuIndex = (this.menuIndex + 1) % menuItems.length;
        this.refresh();
      }
      if (event.key === "Enter" || event.key === " ") {
        this.activateMenuItem(menuItems[this.menuIndex].id);
      }
      return;
    }
    if (this.mode === "settings") {
      if (event.key === "Escape" || event.key === "Backspace" || event.key === "Enter" || event.key === " ") {
        this.mode = "menu";
        this.refresh();
      }
      return;
    }

    if (event.key === "Escape") {
      this.runtime.voice.stop();
      this.mode = "menu";
      this.refresh();
      return;
    }
    if ((event.key === "ArrowLeft" || event.key === "Backspace") && this.pageIndex > 0) {
      this.pageIndex -= 1;
      this.refresh();
      this.speakCurrentPage();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      if (this.pageIndex === STORY_PAGES.length - 1) {
        this.scene.start("LessonScene");
        return;
      }
      this.pageIndex += 1;
      this.refresh();
      this.speakCurrentPage();
    }
  }

  createSpeakerButton(x, y, options) {
    const frame = this.add.rectangle(x, y, 36, 36, PALETTE.paper, 0.94)
      .setStrokeStyle(1.5, options.active ? PALETTE.terracotta : PALETTE.paperEdge, 0.9);
    const icon = this.add.graphics();
    icon.fillStyle(options.muted ? 0x8d7f71 : PALETTE.muted, 1);
    icon.fillPoints([
      { x: x - 10, y: y - 5 },
      { x: x - 5, y: y - 5 },
      { x: x + 1, y: y - 11 },
      { x: x + 1, y: y + 11 },
      { x: x - 5, y: y + 5 },
      { x: x - 10, y: y + 5 },
    ], true);

    if (options.muted) {
      icon.lineStyle(2, PALETTE.terracotta, 1);
      icon.beginPath();
      icon.moveTo(x + 5, y - 8);
      icon.lineTo(x + 14, y + 8);
      icon.moveTo(x + 14, y - 8);
      icon.lineTo(x + 5, y + 8);
      icon.strokePath();
    } else {
      icon.lineStyle(2, PALETTE.olive, 0.95);
      icon.beginPath();
      icon.arc(x + 4, y, 6, -0.75, 0.75, false);
      icon.strokePath();
      icon.beginPath();
      icon.arc(x + 4, y, 10, -0.72, 0.72, false);
      icon.strokePath();
    }

    const zone = this.add.zone(x, y, 36, 36).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", options.onClick);
    zone.on("pointerover", () => {
      this.tweens.add({
        targets: frame,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 120,
      });
    });
    zone.on("pointerout", () => {
      this.tweens.add({
        targets: frame,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
      });
    });

    return this.add.container(0, 0, [frame, icon, zone]);
  }

  speakCurrentPage() {
    if (this.mode !== "story") {
      return;
    }

    const page = STORY_PAGES[this.pageIndex];
    this.runtime.voice.unlockFromGesture();
    const result = this.runtime.voice.speak(page.it, { requireUnlock: false });

    if (!result?.ok) {
      if (result?.reason === "muted") {
        this.runtime.setPrompt("Voice is muted. Open Settings from the title screen to re-enable it.");
      } else if (result?.reason === "unsupported") {
        this.runtime.setPrompt("Voice-over unavailable: your browser does not expose speech synthesis.");
      }
      return;
    }

    this.runtime.setPrompt("Enter or Right Arrow advances. Backspace or Left Arrow goes back.");
  }

  createButton(x, y, width, height, label, options) {
    const disabled = !!options.disabled;
    const variant = options.variant ?? "secondary";
    const styles = {
      primary: {
        fill: PALETTE.olive,
        stroke: 0x3e441d,
        text: "#fff4d8",
      },
      secondary: {
        fill: PALETTE.paper,
        stroke: 0x9f825c,
        text: "#34231b",
      },
      tertiary: {
        fill: 0xefe2cc,
        stroke: 0xb4946c,
        text: "#4e392d",
      },
    }[variant];
    const fill = disabled ? 0xd1c4b0 : styles.fill;
    const stroke = disabled ? 0xc0b19b : options.active ? PALETTE.terracotta : styles.stroke;
    const alpha = disabled ? 0.55 : 0.98;
    const rect = this.add.rectangle(x, y, width, height, fill, alpha).setStrokeStyle(2, stroke, 1);
    if (variant === "primary" && !disabled) {
      this.tweens.add({
        targets: rect,
        alpha: 1,
        yoyo: true,
        repeat: -1,
        duration: 1200,
        ease: "Sine.easeInOut",
      });
    }
    const text = this.add.text(x, y, label, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: variant === "tertiary" ? "16px" : "18px",
      color: disabled ? "#8d7f71" : styles.text,
      fontStyle: "bold",
    }).setOrigin(0.5);
    const marker = options.active
      ? this.add.text(x - width / 2 + 22, y, variant === "primary" ? "▶" : "", {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: "18px",
          color: variant === "primary" ? "#fff0cb" : "#8a3a22",
        }).setOrigin(0.5)
      : null;
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    if (!disabled) {
      zone.on("pointerdown", () => {
        this.tweens.killTweensOf(rect);
        this.tweens.add({
          targets: rect,
          scaleX: 0.96,
          scaleY: 0.96,
          duration: 80,
          yoyo: true,
        });
        options.onClick();
      });
      zone.on("pointerover", () => {
        this.tweens.killTweensOf(rect);
        this.tweens.add({
          targets: rect,
          scaleX: 1.04,
          scaleY: 1.04,
          duration: 120,
        });
        rect.setStrokeStyle(3, PALETTE.terracotta, 1);
      });
      zone.on("pointerout", () => {
        this.tweens.killTweensOf(rect);
        this.tweens.add({
          targets: rect,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
        });
        rect.setStrokeStyle(2, stroke, 1);
      });
    }
    return this.add.container(0, 0, marker ? [rect, text, marker, zone] : [rect, text, zone]);
  }
}