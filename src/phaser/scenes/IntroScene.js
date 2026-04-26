import * as Phaser from "../../vendor/phaser.esm.js";

const PALETTE = {
  skyTop: 0xf6d7a3,
  skyMid: 0xf0bc74,
  skyBottom: 0xcd7a49,
  stone: 0xf0ddb8,
  stoneShade: 0xe0c89a,
  olive: 0x697033,
  terracotta: 0xa94a2c,
  terracottaDark: 0x7e311d,
  ink: 0x37231a,
  muted: 0x6a583f,
  water: 0x58737b,
  waterShadow: 0x334852,
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

  create() {
    this.runtime = this.registry.get("runtime");
    this.runtime.setHeaderHidden(true);
    this.runtime.setInfoDrawerHidden(true);
    this.runtime.clearUi();

    this.mode = "menu";
    this.pageIndex = 0;
    this.menuIndex = 0;
    this.root = this.add.container(0, 0);
    this.drawBackdrop();
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
    items.push({ id: "settings", label: "Audio settings", variant: "tertiary" });
    return items;
  }

  drawBackdrop() {
    const graphics = this.add.graphics();
    graphics.fillStyle(PALETTE.skyTop, 1);
    graphics.fillRect(0, 0, 800, 170);
    graphics.fillStyle(PALETTE.skyMid, 1);
    graphics.fillRect(0, 170, 800, 130);
    graphics.fillStyle(PALETTE.skyBottom, 1);
    graphics.fillRect(0, 300, 800, 212);
    graphics.fillStyle(0xfaf0cf, 0.3);
    graphics.fillCircle(130, 115, 72);
    graphics.fillStyle(0xf3d9a9, 0.42);
    graphics.fillEllipse(400, 286, 800, 180);
    graphics.fillStyle(0x8c5231, 1);
    graphics.fillRect(0, 256, 800, 86);
    graphics.fillStyle(0xb5673c, 1);
    graphics.fillRect(0, 282, 800, 58);
    graphics.fillStyle(PALETTE.water, 1);
    graphics.fillRect(0, 342, 800, 88);
    graphics.fillStyle(PALETTE.waterShadow, 0.46);
    graphics.fillRect(0, 384, 800, 30);
    graphics.fillStyle(0xc97d49, 1);
    graphics.fillRect(0, 430, 800, 82);
    graphics.fillStyle(0x8b4b2f, 1);
    graphics.fillRect(0, 474, 800, 38);
    graphics.fillStyle(0x3c2d23, 0.9);
    graphics.fillRect(0, 0, 68, 512);
    graphics.fillRect(732, 0, 68, 512);
    graphics.fillStyle(0x2d4a2a, 0.98);
    graphics.fillRect(46, 0, 16, 206);
    graphics.fillEllipse(58, 92, 132, 114);
    graphics.fillEllipse(72, 138, 112, 92);
    graphics.fillStyle(0x4d301f, 1);
    graphics.fillRect(706, 56, 10, 156);
    graphics.fillStyle(0x1f1b18, 1);
    graphics.fillRect(690, 204, 88, 308);

    const skyline = this.add.graphics();
    skyline.fillStyle(0x935734, 1);
    skyline.fillRect(108, 230, 58, 70);
    skyline.fillRect(172, 214, 42, 86);
    skyline.fillRect(214, 226, 54, 74);
    skyline.fillRect(528, 220, 48, 80);
    skyline.fillRect(584, 202, 44, 98);
    skyline.fillRect(632, 214, 54, 86);
    skyline.fillStyle(0x7b472c, 1);
    skyline.fillRect(198, 176, 12, 38);
    skyline.fillRect(600, 168, 14, 34);
    skyline.fillRect(650, 160, 12, 54);

    const bridge = this.add.graphics();
    bridge.fillStyle(0x6e4530, 1);
    bridge.fillRect(118, 306, 564, 18);
    bridge.fillRect(118, 324, 20, 56);
    bridge.fillRect(216, 324, 20, 56);
    bridge.fillRect(314, 324, 20, 56);
    bridge.fillRect(412, 324, 20, 56);
    bridge.fillRect(510, 324, 20, 56);
    bridge.fillRect(608, 324, 20, 56);
    bridge.fillStyle(0x5b3726, 1);
    bridge.fillRoundedRect(138, 324, 78, 34, 14);
    bridge.fillRoundedRect(236, 324, 78, 34, 14);
    bridge.fillRoundedRect(334, 324, 78, 34, 14);
    bridge.fillRoundedRect(432, 324, 78, 34, 14);
    bridge.fillRoundedRect(530, 324, 78, 34, 14);

    const table = this.add.graphics();
    table.fillStyle(0x5a3626, 1);
    table.fillRoundedRect(640, 432, 92, 12, 6);
    table.fillRect(684, 442, 7, 60);
    table.fillStyle(0x8a593d, 1);
    table.fillCircle(686, 419, 34);

    const lamp = this.add.graphics();
    lamp.fillStyle(0x1f1713, 1);
    lamp.fillRect(694, 82, 4, 90);
    lamp.fillRect(674, 80, 26, 4);
    lamp.fillStyle(0xf5c26b, 0.9);
    lamp.fillRoundedRect(676, 88, 18, 28, 5);

    this.root.add([graphics, skyline, bridge, table, lamp]);
  }

  refresh() {
    this.root.removeAll(true);
    this.drawBackdrop();
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
    const cardShadow = this.add.rectangle(404, 258, 308, 394, 0x6f4128, 0.28).setOrigin(0.5);
    const card = this.add.rectangle(400, 252, 308, 394, PALETTE.stone, 0.98)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0x8e6440, 0.9);
    const inner = this.add.rectangle(400, 252, 292, 378, 0x000000, 0)
      .setOrigin(0.5)
      .setStrokeStyle(1, 0xcfb283, 0.8);
    const crest = this.add.text(400, 82, "365", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "46px",
      color: "#a4452b",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const flourishes = this.add.text(400, 83, "❧            ❧", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "22px",
      color: "#788245",
    }).setOrigin(0.5);
    const title = this.add.text(400, 132, "Giorni in Italia", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "34px",
      color: "#56602c",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const oliveRule = this.add.rectangle(364, 167, 58, 4, PALETTE.olive).setOrigin(0.5);
    const terracottaRule = this.add.rectangle(436, 167, 58, 4, PALETTE.terracotta).setOrigin(0.5);
    const copy = this.add.text(400, 232, "Travel city by city.\nUncover hidden stories.\n\nYour Italian grows with\nevery choice you make.", {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "15px",
      color: "#382721",
      align: "center",
      lineSpacing: 7,
    }).setOrigin(0.5);
    const divider = this.add.text(400, 188, "- - -o- - -", {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "14px",
      color: "#bda47f",
    }).setOrigin(0.5);
    const footerMark = this.add.text(400, 470, "-o-", {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "14px",
      color: "#9a8b6d",
    }).setOrigin(0.5);

    this.root.add([cardShadow, card, inner, flourishes, crest, title, oliveRule, terracottaRule, divider, copy, footerMark]);

    const menuItems = this.getMenuItems();
    menuItems.forEach((item, index) => {
      const y = item.variant === "tertiary" ? 394 : 322 + index * 68;
      const width = item.variant === "tertiary" ? 240 : 254;
      const height = item.variant === "tertiary" ? 42 : 52;
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

    const saveNote = this.runtime.loaded ? "Save available on this browser." : "Your first day starts here.";
    const footer = this.add.text(400, 438, saveNote, {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "11px",
      color: "#8f7a5d",
    }).setOrigin(0.5);
    this.root.add(footer);
  }

  buildSettings() {
    const shadow = this.add.rectangle(404, 258, 348, 248, 0x6f4128, 0.28).setOrigin(0.5);
    const panel = this.add.rectangle(400, 252, 348, 248, PALETTE.stone, 0.98).setOrigin(0.5).setStrokeStyle(3, 0x8e6440, 0.9);
    const title = this.add.text(400, 168, "Settings", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "34px",
      color: "#5a612f",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const voiceState = this.runtime.voice.muted ? "Muted" : "Enabled";
    const voiceButton = this.createButton(400, 244, 250, 48, `Voice: ${voiceState}`, {
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
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "13px",
      color: "#4a372a",
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
    const shadow = this.add.rectangle(404, 258, 414, 338, 0x6f4128, 0.24).setOrigin(0.5);
    const panel = this.add.rectangle(400, 252, 414, 338, PALETTE.stone, 0.98).setOrigin(0.5).setStrokeStyle(3, 0x8e6440, 0.9);
    const badge = page.badge
      ? this.add.text(400, 150, page.badge, {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "12px",
          color: "#fff8eb",
          backgroundColor: "#6d7434",
          padding: { left: 10, right: 10, top: 6, bottom: 6 },
        }).setOrigin(0.5)
      : null;
    const it = this.add.text(400, 222, page.it, {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: "34px",
      color: "#3d291f",
      align: "center",
      wordWrap: { width: 300 },
    }).setOrigin(0.5);
    const en = this.add.text(400, 288, page.en, {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: "15px",
      color: "#4c3a2d",
      align: "center",
      wordWrap: { width: 300 },
      lineSpacing: 6,
    }).setOrigin(0.5);
    const note = page.note
      ? this.add.text(400, 344, page.note, {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "12px",
          color: "#7b674a",
          align: "center",
        }).setOrigin(0.5)
      : null;
    const progress = this.add.text(400, 392, `${this.pageIndex + 1} / ${STORY_PAGES.length}`, {
      fontFamily: '"IBM Plex Mono", monospace',
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
        fill: PALETTE.stone,
        stroke: 0x9f825c,
        text: "#34231b",
      },
      tertiary: {
        fill: 0xf2e1c0,
        stroke: 0xb4946c,
        text: "#4e392d",
      },
    }[variant];
    const fill = disabled ? 0xd1c4b0 : styles.fill;
    const stroke = disabled ? 0xc0b19b : options.active ? PALETTE.terracotta : styles.stroke;
    const alpha = disabled ? 0.55 : 0.98;
    const rect = this.add.rectangle(x, y, width, height, fill, alpha).setStrokeStyle(2, stroke, 1);
    const text = this.add.text(x, y, label, {
      fontFamily: variant === "primary" ? '"IBM Plex Mono", monospace' : '"Nunito Sans", sans-serif',
      fontSize: variant === "tertiary" ? "16px" : "18px",
      color: disabled ? "#8d7f71" : styles.text,
      fontStyle: "bold",
    }).setOrigin(0.5);
    const marker = options.active
      ? this.add.text(x - width / 2 + 18, y, "▸", {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "18px",
          color: variant === "primary" ? "#fff0cb" : "#8a3a22",
        }).setOrigin(0.5)
      : null;
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    if (!disabled) {
      zone.on("pointerdown", options.onClick);
    }
    return this.add.container(0, 0, marker ? [rect, text, marker, zone] : [rect, text, zone]);
  }
}