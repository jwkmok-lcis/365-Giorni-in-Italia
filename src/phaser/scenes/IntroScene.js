import * as Phaser from "../../vendor/phaser.esm.js";

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
    this.runtime.setHeaderHidden(false);
    this.runtime.setStatus(this.runtime.loaded ? "Resume your Bologna investigation or start a fresh day." : "Begin Chapter 1: Bologna.");
    this.runtime.setPrompt("Arrow keys move selection. Enter confirms.");

    this.mode = "menu";
    this.pageIndex = 0;
    this.menuIndex = this.runtime.loaded ? 1 : 0;
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

  drawBackdrop() {
    const sky = this.add.rectangle(400, 256, 800, 512, 0x102031);
    const glow = this.add.circle(110, 90, 160, 0xb86f38, 0.18);
    const plaza = this.add.rectangle(400, 390, 740, 170, 0xceb98e, 0.9).setStrokeStyle(3, 0xe8d8ba, 0.5);
    const route = this.add.rectangle(400, 325, 760, 40, 0x8b7358, 0.28);
    const arch = this.add.rectangle(400, 160, 620, 86, 0x4f3d2d, 0.9).setStrokeStyle(2, 0xdbc08c, 0.35);
    this.root.add([sky, glow, plaza, route, arch]);
  }

  refresh() {
    this.root.removeAll(true);
    this.drawBackdrop();

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
    const title = this.add.text(400, 88, "365 Giorni in Italia", {
      fontFamily: "Georgia, serif",
      fontSize: "40px",
      color: "#f4ead2",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const subtitle = this.add.text(400, 126, "A Bologna mystery told through dialogue, clues, and grammar choices.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#d7c8b3",
      align: "center",
      wordWrap: { width: 540 },
    }).setOrigin(0.5);
    this.root.add([title, subtitle]);

    MENU_ITEMS.forEach((item, index) => {
      const enabled = item.id !== "continue" || this.runtime.loaded;
      const button = this.createButton(400, 214 + index * 76, 280, 54, item.label, {
        active: this.menuIndex === index,
        disabled: !enabled,
        onClick: () => {
          if (!enabled) return;
          this.menuIndex = index;
          this.activateMenuItem(item.id);
        },
      });
      this.root.add(button);
    });

    const footer = this.add.text(400, 446, this.runtime.loaded ? "A save is available for this browser." : "No save found. Start a new investigation.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#cdbb9f",
    }).setOrigin(0.5);
    this.root.add(footer);
  }

  buildSettings() {
    const panel = this.add.rectangle(400, 256, 520, 260, 0x142535, 0.92).setStrokeStyle(2, 0xd5b375, 0.5);
    const title = this.add.text(400, 168, "Settings", {
      fontFamily: "Georgia, serif",
      fontSize: "32px",
      color: "#f2e7cf",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const voiceState = this.runtime.voice.muted ? "Muted" : "Enabled";
    const voiceButton = this.createButton(400, 246, 320, 54, `Voice: ${voiceState}`, {
      active: true,
      onClick: () => {
        this.runtime.voice.toggleMuted();
        this.refresh();
      },
    });
    const summary = this.runtime.voice.isSupported()
      ? "Italian voice playback uses the browser speech engine."
      : "Voice playback is unavailable in this browser.";
    const copy = this.add.text(400, 312, summary, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "17px",
      color: "#d4c5b1",
      align: "center",
      wordWrap: { width: 400 },
    }).setOrigin(0.5);

    const backButton = this.createButton(400, 376, 200, 46, "Back", {
      active: false,
      onClick: () => {
        this.mode = "menu";
        this.refresh();
      },
    });

    this.root.add([panel, title, voiceButton, copy, backButton]);
  }

  buildStory() {
    const page = STORY_PAGES[this.pageIndex];
    const panel = this.add.rectangle(400, 256, 620, 318, 0x162737, 0.92).setStrokeStyle(2, 0xe5bf7c, 0.45);
    const badge = page.badge
      ? this.add.text(400, 150, page.badge, {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "15px",
          color: "#112331",
          backgroundColor: "#d9be73",
          padding: { left: 12, right: 12, top: 6, bottom: 6 },
        }).setOrigin(0.5)
      : null;
    const it = this.add.text(400, 222, page.it, {
      fontFamily: "Georgia, serif",
      fontSize: "34px",
      color: "#f4ead5",
      align: "center",
      wordWrap: { width: 520 },
    }).setOrigin(0.5);
    const en = this.add.text(400, 288, page.en, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#c8d0d7",
      align: "center",
      wordWrap: { width: 520 },
    }).setOrigin(0.5);
    const note = page.note
      ? this.add.text(400, 344, page.note, {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "16px",
          color: "#cbb998",
          align: "center",
        }).setOrigin(0.5)
      : null;
    const progress = this.add.text(400, 392, `${this.pageIndex + 1} / ${STORY_PAGES.length}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "14px",
      color: "#aeb6bc",
    }).setOrigin(0.5);
    const back = this.createButton(260, 444, 160, 42, "Back", {
      active: false,
      disabled: this.pageIndex === 0,
      onClick: () => {
        if (this.pageIndex === 0) return;
        this.pageIndex -= 1;
        this.refresh();
        this.speakCurrentPage();
      },
    });
    const nextLabel = this.pageIndex === STORY_PAGES.length - 1 ? "Begin Day 1 Lesson" : "Next";
    const next = this.createButton(540, 444, 220, 42, nextLabel, {
      active: true,
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

    this.root.add([panel, it, en, progress, back, next]);
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
    if (this.mode === "menu") {
      if (event.key === "ArrowUp") {
        this.menuIndex = (this.menuIndex - 1 + MENU_ITEMS.length) % MENU_ITEMS.length;
        this.refresh();
      }
      if (event.key === "ArrowDown") {
        this.menuIndex = (this.menuIndex + 1) % MENU_ITEMS.length;
        this.refresh();
      }
      if (event.key === "Enter" || event.key === " ") {
        this.activateMenuItem(MENU_ITEMS[this.menuIndex].id);
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
    const fill = disabled ? 0x43515a : options.active ? 0xb64c33 : 0x244056;
    const stroke = options.active ? 0xf0d8a3 : 0xb8c4cc;
    const rect = this.add.rectangle(x, y, width, height, fill, disabled ? 0.45 : 0.94).setStrokeStyle(2, stroke, disabled ? 0.2 : 0.65);
    const text = this.add.text(x, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "20px",
      color: disabled ? "#a5aaaf" : "#f7f1e4",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    if (!disabled) {
      zone.on("pointerdown", options.onClick);
    }
    return this.add.container(0, 0, [rect, text, zone]);
  }
}