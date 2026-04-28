import * as Phaser from "../../vendor/phaser.esm.js";

export class LessonScene extends Phaser.Scene {
  constructor() {
    super("LessonScene");
    this.phase = "intro";
    this.questionIndex = 0;
    this.choiceIndex = 0;
    this.answers = [];
    this.root = null;
    this.backdropTween = null;
  }

  create() {
    this.runtime = this.registry.get("runtime");
    this.runtime.setHeaderHidden(true);
    this.runtime.setInfoDrawerHidden(false);
    this.lesson = this.runtime.lesson.getLessonForDay(this.runtime.day.currentDay);
    this.phase = this.runtime.day.gameComplete ? "complete" : "intro";
    this.questionIndex = 0;
    this.choiceIndex = 0;
    this.answers = this.lesson ? new Array(this.lesson.quiz.length).fill(null) : [];
    this.result = null;

    this.root = this.add.container(0, 0);
    this.refresh();

    this.keyHandler = (event) => this.handleKey(event);
    this.input.keyboard.on("keydown", this.keyHandler);
    this.resizeHandler = () => this.refresh();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.backdropTween?.stop();
      this.backdropTween = null;
      this.input.keyboard.off("keydown", this.keyHandler);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeHandler);
    });
  }

  drawBackdrop() {
    const { width, height } = this.scale;

    this.backdropTween?.stop();
    this.backdropTween = null;

    const bg = this.textures.exists("menu-bg")
      ? this.add.image(0, 0, "menu-bg").setOrigin(0)
      : this.add.rectangle(0, 0, width, height, 0x0d1824).setOrigin(0);

    if (bg.setDisplaySize) {
      bg.setDisplaySize(width, height);
    }

    this.backdropTween = this.tweens.add({
      targets: bg,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 12000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const overlay = this.add.graphics();
    overlay.fillGradientStyle(
      0x000000, 0x000000,
      0x000000, 0x000000,
      0.1, 0.2,
      0.6, 0.85
    );
    overlay.fillRect(0, 0, width, height);

    this.root.add([bg, overlay]);
  }

  getLayout() {
    const { width, height } = this.scale;
    const portrait = height > width;
    const maxWidth = portrait ? width * 0.92 : Math.min(900, width * 0.75);
    const centerX = width / 2;
    const centerY = height * 0.52;

    return {
      centerX,
      centerY,
      contentWidth: maxWidth,
      isMobile: portrait,
      scale: Phaser.Math.Clamp(width / 900, 0.7, 1.2),
    };
  }

  refresh() {
    this.root.removeAll(true);
    this.drawBackdrop();

    if (this.phase === "complete") {
      this.runtime.setStatus("Chapter One complete");
      this.runtime.setPrompt("Maria Ferrante's recipe has been reconstructed.");
      this.buildCampaignComplete();
      return;
    }

    this.runtime.setStatus(`Day ${this.runtime.day.currentDay} lesson`);
    this.runtime.setPrompt(this.phase === "quiz" ? "Arrow keys move. Enter confirms." : "Complete the lesson to unlock exploration.");

    if (this.phase === "intro") {
      this.buildIntro();
      return;
    }

    if (this.phase === "quiz") {
      this.buildQuiz();
      return;
    }

    this.buildResult();
  }

  buildCampaignComplete() {
    const title = this.add.text(400, 122, "Campagna Completata", {
      fontFamily: "Georgia, serif",
      fontSize: "40px",
      color: "#ead39a",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const summary = this.add.text(400, 214, [
      `Hai raggiunto il giorno ${this.runtime.day.currentDay}.`,
      "Hai ricostruito la ricetta leggendaria di Maria Ferrante.",
      "Bologna ha consegnato i suoi segreti. Milano attende il prossimo capitolo.",
    ].join("\n"), {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "23px",
      color: "#f4ead7",
      align: "center",
      lineSpacing: 12,
      wordWrap: { width: 560 },
    }).setOrigin(0.5);
    const copy = this.add.text(400, 336, "Use Restart Investigation to begin Chapter One again from Day 1.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#cfbea3",
      align: "center",
      wordWrap: { width: 520 },
    }).setOrigin(0.5);

    const restart = this.createButton(400, 420, 280, 46, "Restart Investigation", () => {
      this.runtime.startNewGame();
      this.scene.start("IntroScene");
    }, true);
    this.root.add([title, summary, copy, restart]);
  }

  buildIntro() {
    const L = this.getLayout();
    const { centerX, centerY, contentWidth, scale, isMobile } = L;
    const cardWidth = contentWidth;
    const cardHeight = isMobile ? 420 : 360;

    const card = this.add.rectangle(
      centerX,
      centerY,
      cardWidth,
      cardHeight,
      0x000000,
      0.35
    ).setStrokeStyle(1, 0xffffff, 0.08);

    const title = this.add.text(centerX, centerY - cardHeight * 0.35, this.lesson.title, {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: `${Math.round(36 * scale)}px`,
      color: "#f5ecd9",
      fontStyle: "700",
    }).setOrigin(0.5);
    title.setShadow(0, 2, "#000000", 6, true, true);

    const vocabText = this.lesson.vocab
      .map((v) => `${v.it} — ${v.en}`)
      .join("\n");

    const vocabX = isMobile ? centerX : centerX - cardWidth * 0.25;
    const phraseX = isMobile ? centerX : centerX + cardWidth * 0.25;
    const vocabY = isMobile ? centerY - cardHeight * 0.12 : centerY - 20;
    const phraseY = isMobile ? centerY + cardHeight * 0.11 : centerY - 10;

    const vocab = this.add.text(vocabX, vocabY, vocabText, {
      fontFamily: '"Nunito Sans", sans-serif',
      fontSize: `${Math.round(18 * scale)}px`,
      color: "#e8dcc6",
      lineSpacing: 6,
      align: "center",
      wordWrap: { width: isMobile ? cardWidth * 0.82 : cardWidth * 0.4 },
    }).setOrigin(0.5);

    const phrase = this.add.text(
      phraseX,
      phraseY,
      `${this.lesson.phrase.it}\n${this.lesson.phrase.en}`,
      {
        fontFamily: '"Nunito Sans", sans-serif',
        fontSize: `${Math.round(20 * scale)}px`,
        color: "#ffffff",
        align: "center",
        wordWrap: { width: isMobile ? cardWidth * 0.82 : cardWidth * 0.35 },
      }
    ).setOrigin(0.5);

    const grammar = this.add.text(
      centerX,
      centerY + cardHeight * 0.28,
      `${this.lesson.grammar.topic}\n${this.lesson.grammar.note}`,
      {
        fontFamily: '"Nunito Sans", sans-serif',
        fontSize: `${Math.round(15 * scale)}px`,
        color: "#d6c49e",
        align: "center",
        wordWrap: { width: cardWidth * 0.7 },
      }
    ).setOrigin(0.5);

    const buttonY = centerY + cardHeight * 0.6;
    const backX = isMobile ? centerX - 110 * scale : centerX - 140;
    const startX = isMobile ? centerX + 110 * scale : centerX + 140;

    const back = this.createButton(
      backX,
      buttonY,
      Math.round(200 * scale),
      44,
      "Back",
      () => this.scene.start("IntroScene")
    );

    const start = this.createButton(
      startX,
      buttonY,
      Math.round(220 * scale),
      44,
      "Start Quiz",
      () => {
        this.phase = "quiz";
        this.refresh();
      },
      true
    );

    const introElements = [card, title, vocab, phrase, grammar, back, start];
    this.root.add(introElements);
    introElements.forEach((el) => {
      el.alpha = 0;
      el.y += 10;
    });
    this.tweens.add({
      targets: introElements,
      alpha: 1,
      y: "-=10",
      duration: 400,
      stagger: 40,
      ease: "Power2",
    });
  }

  buildQuiz() {
    const question = this.lesson.quiz[this.questionIndex];
    const header = this.add.text(400, 96, `${this.questionIndex + 1} / ${this.lesson.quiz.length}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#d5c6ac",
    }).setOrigin(0.5);
    const prompt = this.add.text(400, 156, question.prompt, {
      fontFamily: "Georgia, serif",
      fontSize: "29px",
      color: "#f5ead4",
      align: "center",
      wordWrap: { width: 560 },
    }).setOrigin(0.5);
    this.root.add([header, prompt]);

    question.choices.forEach((choice, index) => {
      const button = this.createButton(400, 254 + index * 70, 520, 48, choice, () => {
        this.choiceIndex = index;
        this.goNext();
      }, this.choiceIndex === index);
      this.root.add(button);
    });

    const prev = this.createButton(244, 442, 160, 40, "Previous", () => this.goPrev());
    const next = this.createButton(556, 442, 160, 40, this.questionIndex === this.lesson.quiz.length - 1 ? "Finish" : "Next", () => this.goNext(), true);
    this.root.add([prev, next]);
  }

  buildResult() {
    const title = this.add.text(400, 148, this.result.passed ? "Lesson Complete" : "Try Again", {
      fontFamily: "Georgia, serif",
      fontSize: "36px",
      color: this.result.passed ? "#e9d28d" : "#f2c0b5",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const summary = this.add.text(400, 236, `Score: ${this.result.score}%\nCorrect: ${this.result.correct} / ${this.result.total}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "24px",
      color: "#f3ead9",
      align: "center",
      lineSpacing: 10,
    }).setOrigin(0.5);
    const copy = this.add.text(400, 306, this.result.passed
      ? "The map is now open for exploration. Talk to the next quest NPC in Bologna."
      : "You need at least two thirds correct to open the day. Review the lesson and retry.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "18px",
      color: "#d3c5b2",
      align: "center",
      wordWrap: { width: 520 },
      lineSpacing: 6,
    }).setOrigin(0.5);

    const primary = this.createButton(400, 412, 260, 46, this.result.passed ? "Explore Bologna" : "Retry Quiz", () => {
      if (this.result.passed) {
        this.scene.start("OverworldScene");
        return;
      }
      this.phase = "quiz";
      this.questionIndex = 0;
      this.choiceIndex = 0;
      this.answers = new Array(this.lesson.quiz.length).fill(null);
      this.result = null;
      this.refresh();
    }, true);
    this.root.add([title, summary, copy, primary]);
  }

  handleKey(event) {
    if (this.phase === "intro") {
      if (event.key === "Escape") {
        this.scene.start("IntroScene");
      }
      if (event.key === "Enter" || event.key === " ") {
        this.phase = "quiz";
        this.refresh();
      }
      return;
    }

    if (this.phase === "quiz") {
      const choices = this.lesson.quiz[this.questionIndex].choices;
      if (event.key === "ArrowUp") {
        this.choiceIndex = (this.choiceIndex - 1 + choices.length) % choices.length;
        this.refresh();
      }
      if (event.key === "ArrowDown") {
        this.choiceIndex = (this.choiceIndex + 1) % choices.length;
        this.refresh();
      }
      if (event.key === "ArrowLeft" || event.key === "Backspace") {
        this.goPrev();
      }
      if (event.key === "Enter" || event.key === " ") {
        this.goNext();
      }
      return;
    }

    if (this.phase === "complete") {
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        this.runtime.startNewGame();
        this.scene.start("IntroScene");
      }
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      if (this.result.passed) {
        this.scene.start("OverworldScene");
        return;
      }
      this.phase = "quiz";
      this.questionIndex = 0;
      this.choiceIndex = 0;
      this.answers = new Array(this.lesson.quiz.length).fill(null);
      this.result = null;
      this.refresh();
    }
  }

  goPrev() {
    if (this.questionIndex === 0) {
      this.phase = "intro";
      this.refresh();
      return;
    }
    this.answers[this.questionIndex] = this.choiceIndex;
    this.questionIndex -= 1;
    this.choiceIndex = this.answers[this.questionIndex] ?? 0;
    this.refresh();
  }

  goNext() {
    this.answers[this.questionIndex] = this.choiceIndex;
    if (this.questionIndex < this.lesson.quiz.length - 1) {
      this.questionIndex += 1;
      this.choiceIndex = this.answers[this.questionIndex] ?? 0;
      this.refresh();
      return;
    }

    this.result = this.runtime.lesson.evaluate(this.lesson, this.answers);
    if (this.result.passed) {
      this.runtime.day.completeLesson(this.runtime.bus);
      this.runtime.loaded = true;
      this.runtime.refreshResumeScene();
    }
    this.phase = "result";
    this.refresh();
  }

  createButton(x, y, width, height, label, onClick, active = false) {
    const rect = this.add.rectangle(x, y, width, height, active ? 0xb64c33 : 0x244056, 0.95).setStrokeStyle(2, active ? 0xf0d8a3 : 0xb7c7ce, 0.68);
    const text = this.add.text(x, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "19px",
      color: "#f7efe1",
      align: "center",
      wordWrap: { width: width - 20 },
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    return this.add.container(0, 0, [rect, text, zone]);
  }
}