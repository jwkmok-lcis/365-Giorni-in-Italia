import * as Phaser from "../../vendor/phaser.esm.js";

const MENU_BG_TEXTURE_KEY = "menu-bg";
const MENU_BG_URL = "assets/menu-bg-real.png";
const MENU_PANEL_RADIUS = 18;

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
  { it: "Arrivi in Italia. Vuoi imparare l'italiano.", en: "You arrive in Italy. You want to learn Italian." },
  {
    it: "Ma non vuoi studiare solo dai libri. Vuoi vivere la lingua.",
    en: "But you do not want to study only from books. You want to live the language.",
  },
  {
    it: "A Bologna, senti una storia: il ragù perfetto esiste.",
    en: "In Bologna, you hear a story: the perfect ragù exists.",
  },
  {
    it: "Ma nessuno dice la verità. Ogni persona dice qualcosa di diverso.",
    en: "But no one tells the truth. Everyone says something different.",
  },
  {
    it: "Parli con le persone, ascolti e fai domande.",
    en: "You talk to people, listen, and ask questions.",
  },
  {
    it: "Impari poco a poco. Nel gioco, scegli le frasi.",
    en: "You learn little by little. In the game, you choose sentences.",
  },
  {
    it: "Più parli, più impari.",
    en: "The more you speak, the more you learn.",
    location: "Piazza Maggiore",
  },
  {
    it: "Qualcuno può aiutarti. Inizia da Marco.",
    en: "Someone can help you. Start with Marco.",
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
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSwiping = false;
    this.blockStoryTapNav = false;
    this.isStoryTransitioning = false;
    this.bgImage = null;
    this.backgroundElements = [];
    this.forceBackgroundRefresh = false;
    this.bgPanTween = null;
    this.bgPortraitTween = null;
    this.itText = null;
    this.typewriterEvent = null;
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
    this.pointerDownHandler = (pointer) => {
      if (this.mode !== "story") return;
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
      this.isSwiping = true;
    };
    this.pointerMoveHandler = (pointer) => {
      if (!this.isSwiping || this.mode !== "story" || this.isStoryTransitioning) return;
      const dx = pointer.x - this.touchStartX;
      this.root.x = dx * 0.2;
    };
    this.pointerUpHandler = (pointer) => {
      if (!this.isSwiping || this.mode !== "story") return;

      const dx = pointer.x - this.touchStartX;
      const dy = pointer.y - this.touchStartY;
      this.isSwiping = false;
      this.tweens.add({
        targets: this.root,
        x: 0,
        duration: 150,
      });

      if (this.isStoryTransitioning) return;
      if (this.blockStoryTapNav) {
        this.blockStoryTapNav = false;
        return;
      }

      if (Math.abs(dy) > Math.abs(dx)) return;
      const threshold = 50;
      if (dx < -threshold) {
        this.goNextPage();
      } else if (dx > threshold) {
        this.goPrevPage();
      } else {
        this.goNextPage();
      }
    };
    this.input.on("pointerdown", this.pointerDownHandler);
    this.input.on("pointermove", this.pointerMoveHandler);
    this.input.on("pointerup", this.pointerUpHandler);
    this.resizeHandler = () => {
      this.forceBackgroundRefresh = true;
      this.refresh();
      this.forceBackgroundRefresh = false;
    };
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearStoryEffects();
      this.input.keyboard.off("keydown", this.keyHandler);
      this.input.off("pointerdown", this.pointerDownHandler);
      this.input.off("pointermove", this.pointerMoveHandler);
      this.input.off("pointerup", this.pointerUpHandler);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
      this.runtime.voice.stop();
    });
  }

  getScaleFactor() {
    if (this.isPortrait()) {
      return Phaser.Math.Clamp(this.scale.width / 430, 0.7, 1.2);
    }
    return Phaser.Math.Clamp(this.scale.width / 800, 0.72, 1.35);
  }

  isPortrait() {
    return this.scale.height > this.scale.width;
  }

  textPx(size) {
    return `${Math.round(size * this.getScaleFactor())}px`;
  }

  getTopSafeInset() {
    return Math.max(40, this.scale.height * 0.06);
  }

  getMenuLayout(menuCount) {
    if (this.isPortrait()) {
      return this.getPortraitLayout(menuCount);
    }
    return this.getDesktopLayout(menuCount);
  }

  getPortraitLayout(menuCount) {
    const { width, height } = this.scale;
    const scaleFactor = Phaser.Math.Clamp(width / 430, 0.7, 1.2);
    const topSafe = this.getTopSafeInset();
    const panelWidth = width * 0.92;
    const panelHeight = height * 0.78;
    const centerX = width / 2;
    const centerY = height / 2;
    const buttonSpacing = 56 * scaleFactor;

    return {
      scaleFactor,
      panelWidth,
      panelHeight,
      panelX: centerX,
      panelY: centerY,
      crestY: topSafe + 60,
      titleY: topSafe + 100,
      subtitleOneY: topSafe + 150,
      subtitleTwoY: topSafe + 180,
      copyY: topSafe + 230,
      buttonBaseY: height - menuCount * buttonSpacing - 40,
      buttonSpacing,
      speakerX: width - 40,
      speakerY: topSafe + 40,
    };
  }

  getDesktopLayout(menuCount) {
    const { width, height } = this.scale;
    const scaleFactor = this.getScaleFactor();
    const topSafe = this.getTopSafeInset();
    const panelWidth = Math.min(420, width * 0.85);
    const panelHeight = Math.min(360, height * 0.7);
    const yStart = Math.max(height * 0.3, topSafe + 100);
    const gap = 40 * scaleFactor;
    const buttonSpacing = 60 * scaleFactor;
    const maxButtonBaseY = height - topSafe - (menuCount - 1) * buttonSpacing - 52 * scaleFactor;
    const buttonBaseY = Math.min(yStart + gap * 6.7, maxButtonBaseY);

    return {
      scaleFactor,
      panelWidth,
      panelHeight,
      panelX: width / 2,
      panelY: height / 2,
      crestY: yStart,
      titleY: yStart + gap * 1.2,
      subtitleOneY: yStart + gap * 3.2,
      subtitleTwoY: yStart + gap * 3.85,
      copyY: yStart + gap * 5.1,
      buttonBaseY,
      buttonSpacing,
      speakerX: width / 2 + panelWidth / 2 - 26 * scaleFactor,
      speakerY: yStart + 12 * scaleFactor,
    };
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
      this.bgImage = this.add.image(0, 0, MENU_BG_TEXTURE_KEY).setOrigin(0);
      const image = this.bgImage;
      const scaleX = width / image.width;
      const scaleY = height / image.height;
      const scale = Math.max(scaleX, scaleY);
      image.setScale(scale);
      image.setPosition((width - image.width * scale) / 2, (height - image.height * scale) / 2);
      const baseX = image.x;
      this.bgPanTween = this.tweens.add({
        targets: image,
        x: baseX + 10,
        duration: 10000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      if (this.isPortrait()) {
        this.bgPortraitTween = this.tweens.add({
          targets: image,
          scaleX: scale * 1.05,
          scaleY: scale * 1.05,
          duration: 12000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
      const gradient = this.add.graphics();
      gradient.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.06, 0.16, 0.2, 0.1);
      gradient.fillRect(0, 0, width, height);
      const vignetteTop = this.add.rectangle(width / 2, 0, width, 150, 0x000000, 0.08).setOrigin(0.5, 0);
      const vignetteBottom = this.add.rectangle(width / 2, height, width, 190, 0x000000, 0.16).setOrigin(0.5, 1);
      const vignetteLeft = this.add.rectangle(0, height / 2, 110, height, 0x000000, 0.12).setOrigin(0, 0.5);
      const vignetteRight = this.add.rectangle(width, height / 2, 110, height, 0x000000, 0.12).setOrigin(1, 0.5);
      this.backgroundElements = [image, gradient, vignetteTop, vignetteBottom, vignetteLeft, vignetteRight];
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

    this.backgroundElements = [sky, glow, city, river, riverGlow, embankment, leftFrame, rightFrame, vignette];
    this.root.add([sky, glow, city, river, riverGlow, embankment, leftFrame, rightFrame, vignette]);
  }

  refresh() {
    if (this.mode === "story" && this.backgroundElements.length && !this.forceBackgroundRefresh) {
      this.clearStoryPageEffects();
      this.clearForegroundElements();
      this.buildStory();
      return;
    }

    this.clearStoryEffects();
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
    const portrait = this.isPortrait();
    const menuItems = this.getMenuItems();
    const layout = this.getMenuLayout(menuItems.length);
    const panelShadow = portrait
      ? null
      : this.add.rectangle(layout.panelX, layout.panelY + 6 * layout.scaleFactor, layout.panelWidth, layout.panelHeight, 0x000000, 0.08)
          .setOrigin(0.5)
          .setScale(1.02);
    const panelGlow = portrait ? null : this.add.graphics();
    if (panelGlow) {
      panelGlow.fillStyle(0xffffff, 0.06);
      panelGlow.fillRoundedRect(
        layout.panelX - (layout.panelWidth + 20 * layout.scaleFactor) / 2,
        layout.panelY - (layout.panelHeight + 20 * layout.scaleFactor) / 2,
        layout.panelWidth + 20 * layout.scaleFactor,
        layout.panelHeight + 20 * layout.scaleFactor,
        MENU_PANEL_RADIUS + 8
      );
    }
    const panel = this.add.graphics();
    if (portrait) {
      panel.fillStyle(PALETTE.paper, 0.96);
      panel.fillRect(0, 0, this.scale.width, this.scale.height);
    } else {
      panel.fillStyle(PALETTE.paper, 0.88);
      panel.fillRoundedRect(layout.panelX - layout.panelWidth / 2, layout.panelY - layout.panelHeight / 2, layout.panelWidth, layout.panelHeight, MENU_PANEL_RADIUS);
      panel.lineStyle(2, PALETTE.paperEdge, 0.62);
      panel.strokeRoundedRect(layout.panelX - layout.panelWidth / 2, layout.panelY - layout.panelHeight / 2, layout.panelWidth, layout.panelHeight, MENU_PANEL_RADIUS);
    }
    const crest = this.add.text(layout.panelX, layout.crestY, "365", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: this.textPx(48),
      color: "#a94a2c",
      fontStyle: "700",
    }).setOrigin(0.5);
    const title = this.add.text(layout.panelX, layout.titleY, "Giorni in Italia", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: this.textPx(portrait ? 36 : 32),
      color: "#58612f",
      fontStyle: "700",
    }).setOrigin(0.5);
    const oliveRule = this.add.rectangle(layout.panelX - 26 * layout.scaleFactor, layout.titleY + 40 * layout.scaleFactor, 44 * layout.scaleFactor, 4 * layout.scaleFactor, PALETTE.olive).setOrigin(0.5);
    const terracottaRule = this.add.rectangle(layout.panelX + 26 * layout.scaleFactor, layout.titleY + 40 * layout.scaleFactor, 44 * layout.scaleFactor, 4 * layout.scaleFactor, PALETTE.terracotta).setOrigin(0.5);
    const subtitleOne = this.add.text(layout.panelX, layout.subtitleOneY, "Travel city by city.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(portrait ? 18 : 16),
      color: "#333333",
    }).setOrigin(0.5);
    const subtitleTwo = this.add.text(layout.panelX, layout.subtitleTwoY, "Uncover hidden stories.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(portrait ? 18 : 16),
      color: "#333333",
    }).setOrigin(0.5);
    const copy = this.add.text(layout.panelX, layout.copyY, "Your Italian grows with\nevery choice you make.", {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(portrait ? 15 : 14),
      color: "#666666",
      align: "center",
      lineSpacing: Math.round(4 * layout.scaleFactor),
      wordWrap: { width: layout.panelWidth * 0.7 },
    }).setOrigin(0.5);
    const speakerButton = this.createSpeakerButton(layout.speakerX, layout.speakerY, {
      active: this.mode === "settings",
      muted: this.runtime.voice.muted,
      onClick: () => {
        this.runtime.voice.toggleMuted();
        this.refresh();
      },
    });

    this.root.add([panelShadow, panelGlow, panel, crest, title, oliveRule, terracottaRule, subtitleOne, subtitleTwo, copy, speakerButton]);

    const baseY = layout.buttonBaseY;
    const spacing = layout.buttonSpacing;

    menuItems.forEach((item, index) => {
      const y = baseY + index * spacing;
      const width = portrait
        ? this.scale.width * 0.85
        : Math.min(300, this.scale.width * 0.62);
      const height = Math.round(52 * layout.scaleFactor);
      const button = this.createButton(layout.panelX, y, width, height, item.label, {
        active: this.menuIndex === index,
        variant: item.variant,
        onClick: () => {
          this.menuIndex = index;
          this.activateMenuItem(item.id);
        },
      });
      this.root.add(button);
    });

    const elements = [panelShadow, panelGlow, panel, crest, title, oliveRule, terracottaRule, subtitleOne, subtitleTwo, copy, speakerButton].filter(Boolean);
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
    const { width, height } = this.scale;
    const scaleFactor = this.getScaleFactor();
    const panelWidth = Math.min(420, width * 0.86);
    const panelHeight = Math.min(268, height * 0.58);
    const centerX = width / 2;
    const centerY = height / 2;
    const shadow = this.add.rectangle(centerX, centerY + 8 * scaleFactor, panelWidth, panelHeight, 0x000000, 0.18).setOrigin(0.5);
    const panel = this.add.rectangle(centerX, centerY, panelWidth, panelHeight, PALETTE.paper, 0.97).setOrigin(0.5).setStrokeStyle(1, 0x000000, 0.1);
    const title = this.add.text(centerX, centerY - panelHeight * 0.32, "Settings", {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: this.textPx(34),
      color: "#2c2c2c",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const voiceState = this.runtime.voice.muted ? "Muted" : "Enabled";
    const voiceButton = this.createButton(centerX, centerY - panelHeight * 0.03, Math.min(286, panelWidth * 0.75), Math.round(48 * scaleFactor), `Voice: ${voiceState}`, {
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
    const copy = this.add.text(centerX, centerY + panelHeight * 0.22, summary, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(14),
      color: "#444444",
      align: "center",
      wordWrap: { width: panelWidth * 0.64 },
      lineSpacing: Math.round(6 * scaleFactor),
    }).setOrigin(0.5);

    const backButton = this.createButton(centerX, centerY + panelHeight * 0.48, Math.min(184, panelWidth * 0.5), Math.round(42 * scaleFactor), "Back", {
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
    const { width, height } = this.scale;
    const scaleFactor = this.getScaleFactor();
    const page = STORY_PAGES[this.pageIndex];

    const centerX = width / 2;
    const textWidth = width * 0.65;
    const textLeft = centerX - textWidth / 2;

    // Gradient overlay only.
    const overlay = this.add.graphics();
    overlay.fillGradientStyle(
      0x000000, 0x000000,
      0x000000, 0x000000,
      0.0, 0.0,
      0.55, 0.75
    );
    overlay.fillRect(0, 0, width, height);

    const textY = height * 0.42;

    const it = this.add.text(textLeft, textY, page.it, {
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      fontSize: this.textPx(36),
      color: "#ffffff",
      align: "left",
      wordWrap: { width: textWidth },
      lineSpacing: Math.round(10 * scaleFactor),
    }).setOrigin(0, 0.5);

    it.setShadow(0, 3, "#000000", 10, true, true);
    const italianHeight = it.height;
    this.itText = it;

    const en = this.add.text(textLeft, textY + italianHeight / 2 + 18 * scaleFactor, page.en, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(18),
      color: "#f0f0f0",
      align: "left",
      wordWrap: { width: textWidth * 0.85 },
      lineSpacing: Math.round(8 * scaleFactor),
    }).setOrigin(0, 0);

    this.revealText(it, page.it, 28);

    const buttonY = height * 0.9;

    const back = this.createButton(
      centerX - 100 * scaleFactor,
      buttonY,
      140,
      42,
      "Back",
      {
        disabled: this.pageIndex === 0,
        variant: "tertiary",
        onClick: () => this.goPrevPage(),
      }
    );

    const nextLabel = this.pageIndex === STORY_PAGES.length - 1
      ? "Begin Day 1 →"
      : "Next →";

    const next = this.createButton(
      centerX + 100 * scaleFactor,
      buttonY,
      180,
      42,
      nextLabel,
      {
        active: true,
        variant: "primary",
        onClick: () => this.goNextPage(),
      }
    );

    const progress = this.add.text(
      centerX,
      buttonY - 30 * scaleFactor,
      `${this.pageIndex + 1} / ${STORY_PAGES.length}`,
      {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: this.textPx(12),
      color: "#cccccc",
      }
    ).setOrigin(0.5);

    this.root.add([overlay, it, en, progress, back, next]);

    [it, en, progress, back, next].forEach((el) => {
      el.alpha = 0;
      el.y += 20;
    });
    overlay.alpha = 0;

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 320,
      ease: "Power2",
    });
    this.tweens.add({
      targets: [it, en, progress, back, next],
      alpha: 1,
      y: "-=20",
      duration: 400,
      ease: "Power2",
      stagger: 60,
    });
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

  goNextPage() {
    if (this.isStoryTransitioning) return;
    if (this.pageIndex === STORY_PAGES.length - 1) {
      this.scene.start("LessonScene");
      return;
    }
    this.pageIndex += 1;
    this.transitionStory(1);
  }

  goPrevPage() {
    if (this.isStoryTransitioning || this.pageIndex === 0) return;
    this.pageIndex -= 1;
    this.transitionStory(-1);
  }

  transitionStory(direction) {
    if (this.mode !== "story" || this.isStoryTransitioning) return;
    this.isStoryTransitioning = true;
    const oldElements = this.getForegroundElements();
    this.root.x = 0;
    this.tweens.add({
      targets: oldElements,
      x: `+=${direction * -80}`,
      alpha: 0,
      duration: 220,
      ease: "Power2",
      onComplete: () => {
        this.refresh();
        const newElements = this.getForegroundElements();
        newElements.forEach((el) => {
          el.x += direction * 80;
          el.alpha = 0;
        });
        this.tweens.add({
          targets: newElements,
          x: `+=${direction * -80}`,
          alpha: 1,
          duration: 260,
          ease: "Power2",
          onComplete: () => {
            this.isStoryTransitioning = false;
          },
        });
        this.speakCurrentPage();
      },
    });
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
    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      this.goPrevPage();
      return;
    }
    if (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ") {
      this.goNextPage();
    }
  }

  createSpeakerButton(x, y, options) {
    const size = 36 * this.getScaleFactor();
    const frame = this.add.rectangle(x, y, size, size, PALETTE.paper, 0.94)
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

    const zone = this.add.zone(x, y, size, size).setInteractive({ useHandCursor: true });
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

  revealText(textObject, fullText, speed = 35) {
    if (this.typewriterEvent) {
      this.typewriterEvent.remove();
      this.typewriterEvent = null;
    }
    textObject.setText("");
    let i = 0;
    this.typewriterEvent = this.time.addEvent({
      delay: speed,
      repeat: fullText.length - 1,
      callback: () => {
        if (!textObject.active) {
          this.typewriterEvent?.remove();
          this.typewriterEvent = null;
          return;
        }
        textObject.setText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) {
          this.typewriterEvent = null;
        }
      },
    });
  }

  getForegroundElements() {
    const backgroundSet = new Set(this.backgroundElements);
    return this.root.list.filter((el) => !backgroundSet.has(el));
  }

  clearForegroundElements() {
    this.getForegroundElements().forEach((el) => el.destroy());
  }

  clearStoryPageEffects() {
    this.typewriterEvent?.remove();
    this.typewriterEvent = null;
    this.itText = null;
  }

  clearStoryEffects() {
    this.clearStoryPageEffects();
    this.bgPanTween?.stop();
    this.bgPanTween = null;
    this.bgPortraitTween?.stop();
    this.bgPortraitTween = null;
    this.itText = null;
    this.bgImage = null;
    this.backgroundElements = [];
  }

  createButton(x, y, width, height, label, options) {
    const scaleFactor = this.getScaleFactor();
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
      fontSize: this.textPx(variant === "tertiary" ? 16 : 18),
      color: disabled ? "#8d7f71" : styles.text,
      fontStyle: "bold",
    }).setOrigin(0.5);
    const marker = options.active
      ? this.add.text(x - width / 2 + 22 * scaleFactor, y, variant === "primary" ? "▶" : "", {
          fontFamily: '"Nunito Sans", sans-serif',
          fontSize: this.textPx(18),
          color: variant === "primary" ? "#fff0cb" : "#8a3a22",
        }).setOrigin(0.5)
      : null;
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: !disabled });
    if (!disabled) {
      zone.on("pointerdown", () => {
        this.blockStoryTapNav = this.mode === "story";
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