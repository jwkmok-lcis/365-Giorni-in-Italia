// LessonScene - runs the daily lesson flow (content + quiz + result).

import { Scene } from "../engine/Scene.js";

const W = 800;
const H = 512;

export class LessonScene extends Scene {
  constructor() {
    super();
    this._statusPanel = null;
    this._promptPanel = null;
    this._phase = "intro"; // intro | quiz | result
    this._lesson = null;
    this._qIndex = 0;
    this._choiceIndex = 0;
    this._answers = [];
    this._result = null;
    this._cooldownFrames = 0;
    this._tapPulse = null;

    this._btnRects = {
      back: null,
      start: null,
      prev: null,
      next: null,
      choices: [],
      retry: null,
      continue: null,
    };
  }

  enter(game) {
    this._game = game;
    this._statusPanel = document.getElementById("statusPanel");
    this._promptPanel = document.getElementById("promptPanel");

    const day = game.context.day.currentDay;
    this._lesson = game.context.lesson.getLessonForDay(day);
    this._phase = "intro";
    this._qIndex = 0;
    this._choiceIndex = 0;
    this._answers = new Array(this._lesson.quiz.length).fill(null);
    this._result = null;
    this._cooldownFrames = 10;

    this._updatePanels();
  }

  update() {
    if (this._cooldownFrames > 0) {
      this._cooldownFrames -= 1;
    }

    if (this._tapPulse) {
      this._tapPulse.life -= 1;
      if (this._tapPulse.life <= 0) this._tapPulse = null;
    }
  }

  handleInput(event) {
    if (this._cooldownFrames > 0) return;

    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart";
    if (!isKey && !isTap) return;

    if (isTap && event.canvasY !== undefined) {
      this._handleTap(event);
      return;
    }

    this._handleKey(event);
  }

  _handleTap(event) {
    if (this._phase === "intro") {
      if (this._hit(event, this._btnRects.back)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._game.context.scenes.go("map", this._game);
        return;
      }
      if (this._hit(event, this._btnRects.start)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._phase = "quiz";
        this._qIndex = 0;
        this._choiceIndex = this._answers[0] ?? 0;
        this._cooldownFrames = 6;
        this._updatePanels();
      }
      return;
    }

    if (this._phase === "quiz") {
      if (this._hit(event, this._btnRects.prev)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._goPreviousQuestion();
        return;
      }

      for (let i = 0; i < this._btnRects.choices.length; i++) {
        if (this._hit(event, this._btnRects.choices[i])) {
          this._setTapPulse(event.canvasX, event.canvasY);
          this._choiceIndex = i;
          this._updatePanels();
          return;
        }
      }

      if (this._hit(event, this._btnRects.next)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._goNextQuestion();
      }
      return;
    }

    if (this._phase === "result") {
      if (this._result.passed && this._hit(event, this._btnRects.continue)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._game.context.scenes.go("map", this._game);
        return;
      }
      if (!this._result.passed && this._hit(event, this._btnRects.retry)) {
        this._setTapPulse(event.canvasX, event.canvasY);
        this._restartQuiz();
      }
    }
  }

  _handleKey(event) {
    if (this._phase === "intro") {
      if (event.key === "Escape") {
        this._game.context.scenes.go("map", this._game);
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        this._phase = "quiz";
        this._qIndex = 0;
        this._choiceIndex = this._answers[0] ?? 0;
        this._updatePanels();
      }
      return;
    }

    if (this._phase === "quiz") {
      const q = this._lesson.quiz[this._qIndex];
      if (event.key === "ArrowUp") {
        this._choiceIndex = (this._choiceIndex - 1 + q.choices.length) % q.choices.length;
        this._updatePanels();
        return;
      }
      if (event.key === "ArrowDown") {
        this._choiceIndex = (this._choiceIndex + 1) % q.choices.length;
        this._updatePanels();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "Backspace") {
        this._goPreviousQuestion();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        this._goNextQuestion();
      }
      return;
    }

    if (this._phase === "result" && (event.key === "Enter" || event.key === " ")) {
      if (this._result.passed) {
        this._game.context.scenes.go("map", this._game);
      } else {
        this._restartQuiz();
      }
    }
  }

  _goPreviousQuestion() {
    if (this._qIndex === 0) {
      this._phase = "intro";
      this._updatePanels();
      return;
    }

    this._answers[this._qIndex] = this._choiceIndex;
    this._qIndex -= 1;
    this._choiceIndex = this._answers[this._qIndex] ?? 0;
    this._cooldownFrames = 4;
    this._updatePanels();
  }

  _goNextQuestion() {
    this._answers[this._qIndex] = this._choiceIndex;

    if (this._qIndex < this._lesson.quiz.length - 1) {
      this._qIndex += 1;
      this._choiceIndex = this._answers[this._qIndex] ?? 0;
      this._cooldownFrames = 4;
      this._updatePanels();
      return;
    }

    this._result = this._game.context.lesson.evaluate(this._lesson, this._answers);
    this._phase = "result";

    if (this._result.passed) {
      this._game.context.day.completeLesson(this._game.context.bus);
    }

    this._cooldownFrames = 6;
    this._updatePanels();
  }

  _restartQuiz() {
    this._phase = "quiz";
    this._qIndex = 0;
    this._choiceIndex = 0;
    this._answers = new Array(this._lesson.quiz.length).fill(null);
    this._result = null;
    this._cooldownFrames = 6;
    this._updatePanels();
  }

  render(ctx, alpha, game) {
    if (game.context.day.gameComplete) {
      this._renderCampaignComplete(ctx, game.context.day.currentDay);
      return;
    }

    this._btnRects = {
      back: null,
      start: null,
      prev: null,
      next: null,
      choices: [],
      retry: null,
      continue: null,
    };

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#0f1b2b");
    grad.addColorStop(1, "#1b2e44");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.fillRect(0, 0, W, 54);

    ctx.fillStyle = "#d4c8a8";
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.fillText("LEZIONE", 22, 34);

    ctx.fillStyle = "#93a8bc";
    ctx.font = "400 14px 'Segoe UI', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Giorno ${game.context.day.currentDay}`, W - 20, 34);
    ctx.textAlign = "left";

    if (this._phase === "intro") {
      this._renderIntro(ctx);
    } else if (this._phase === "quiz") {
      this._renderQuiz(ctx);
    } else {
      this._renderResult(ctx);
    }

    this._renderTapPulse(ctx);
  }

  _renderIntro(ctx) {
    this._drawCard(ctx, 24, 72, W - 48, 380, 16, "rgba(255,255,255,0.06)");

    ctx.fillStyle = "#eef3f7";
    ctx.font = "700 28px 'Segoe UI', sans-serif";
    let y = this._drawWrappedText(ctx, this._lesson.title, 46, 122, W - 92, 34);

    ctx.fillStyle = "#89b5c9";
    ctx.font = "700 16px 'Segoe UI', sans-serif";
    y += 12;
    ctx.fillText("VOCABOLARIO", 46, y);

    ctx.fillStyle = "#d8e3ec";
    ctx.font = "500 20px 'Segoe UI', sans-serif";
    y += 34;
    this._lesson.vocab.forEach((v) => {
      y = this._drawWrappedText(ctx, `${v.it}  -  ${v.en}`, 46, y, W - 92, 30);
    });

    y += 8;
    ctx.fillStyle = "#9ec8db";
    ctx.font = "600 15px 'Segoe UI', sans-serif";
    y = this._drawWrappedText(ctx, `Frase: ${this._lesson.phrase.it} (${this._lesson.phrase.en})`, 46, y, W - 92, 24);

    y += 4;
    ctx.fillStyle = "#8cb4c9";
    ctx.font = "500 14px 'Segoe UI', sans-serif";
    this._drawWrappedText(
      ctx,
      `Grammar: ${this._lesson.grammar.topic} - ${this._lesson.grammar.note}`,
      46,
      y,
      W - 92,
      22
    );

    this._btnRects.back = this._drawButton(ctx, 44, H - 56, 180, 40, "Back To Map", "ghost");
    this._btnRects.start = this._drawButton(ctx, W - 264, H - 56, 220, 40, "Start Quiz", "primary");
  }

  _renderQuiz(ctx) {
    const q = this._lesson.quiz[this._qIndex];

    this._drawCard(ctx, 24, 72, W - 48, 382, 16, "rgba(255,255,255,0.06)");

    ctx.fillStyle = "#9ec8db";
    ctx.font = "600 14px 'Segoe UI', sans-serif";
    ctx.fillText(`Question ${this._qIndex + 1} / ${this._lesson.quiz.length}`, 46, 112);

    ctx.fillStyle = "#f1f6fa";
    ctx.font = "600 25px 'Segoe UI', sans-serif";
    this._drawWrappedText(ctx, q.prompt, 46, 154, W - 92, 34);

    let y = 200;
    this._btnRects.choices = [];

    for (let i = 0; i < q.choices.length; i++) {
      const selected = i === this._choiceIndex;
      const rect = { x: 44, y, w: W - 88, h: 58 };
      const bg = selected ? "rgba(120,210,140,0.18)" : "rgba(255,255,255,0.05)";
      const border = selected ? "rgba(132,220,152,0.88)" : "rgba(255,255,255,0.14)";

      this._drawCard(ctx, rect.x, rect.y, rect.w, rect.h, 12, bg, border);

      ctx.fillStyle = selected ? "#dff4e5" : "#d4e0e8";
      ctx.font = "500 19px 'Segoe UI', sans-serif";
      ctx.fillText(q.choices[i], rect.x + 20, rect.y + 36);

      this._btnRects.choices.push(rect);
      y += 68;
    }

    const leftLabel = this._qIndex === 0 ? "Back To Lesson" : "Previous";
    this._btnRects.prev = this._drawButton(ctx, 44, H - 56, 190, 40, leftLabel, "ghost");
    this._btnRects.next = this._drawButton(ctx, W - 284, H - 56, 240, 40, "Check & Next", "primary");
  }

  _renderResult(ctx) {
    this._drawCard(ctx, 120, 120, W - 240, 270, 16, "rgba(255,255,255,0.08)");

    ctx.fillStyle = "#f1f6fa";
    ctx.font = "700 30px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Lesson Result", W / 2, 176);

    ctx.font = "500 22px 'Segoe UI', sans-serif";
    ctx.fillText(`Score ${this._result.score}%`, W / 2, 222);
    ctx.fillText(`Correct ${this._result.correct} / ${this._result.total}`, W / 2, 256);

    if (this._result.passed) {
      ctx.fillStyle = "#bfe8c8";
      ctx.fillText("Passed. You can explore the map now.", W / 2, 298);
      this._btnRects.continue = this._drawButton(ctx, W / 2 - 120, 326, 240, 42, "Continue To Map", "primary");
    } else {
      ctx.fillStyle = "#f4c0b2";
      ctx.fillText("You need a higher score.", W / 2, 298);
      this._btnRects.retry = this._drawButton(ctx, W / 2 - 96, 326, 192, 42, "Retry Quiz", "primary");
    }

    ctx.textAlign = "left";
  }

  _renderCampaignComplete(ctx, day) {
    ctx.fillStyle = "#121a22";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 36px Georgia";
    ctx.fillText("Campagna Completata", 40, 140);

    ctx.font = "400 22px Georgia";
    ctx.fillStyle = "#d8e4eb";
    ctx.fillText(`Hai raggiunto il giorno ${day}.`, 40, 210);
    ctx.fillText("Hai ricostruito gli indizi della ricetta leggendaria.", 40, 250);

    ctx.fillStyle = "#9ec0cf";
    ctx.fillText("Ricarica la pagina per una nuova indagine.", 40, 330);
  }

  _updatePanels() {
    if (!this._statusPanel || !this._promptPanel) return;

    if (this._phase === "intro") {
      this._statusPanel.textContent = "Daily lesson briefing";
      this._promptPanel.textContent = "Review vocab and grammar, then start quiz.";
      return;
    }

    if (this._phase === "quiz") {
      this._statusPanel.textContent = `Lesson quiz: question ${this._qIndex + 1}/${this._lesson.quiz.length}`;
      this._promptPanel.textContent = "Tap an answer, then tap Check and Next. Use Previous to go back.";
      return;
    }

    this._statusPanel.textContent = this._result.passed ? "Lesson passed" : "Lesson retry required";
    this._promptPanel.textContent = this._result.passed
      ? "Continue to return to map."
      : "Retry quiz to pass the lesson.";
  }

  _drawCard(ctx, x, y, w, h, r, fill, border = "rgba(255,255,255,0.1)") {
    this._roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    this._roundedRect(ctx, x, y, w, h, r);
    ctx.stroke();
  }

  _drawButton(ctx, x, y, w, h, label, variant) {
    const isPrimary = variant === "primary";
    const fill = isPrimary ? "rgba(108, 191, 134, 0.3)" : "rgba(255,255,255,0.06)";
    const border = isPrimary ? "rgba(142, 226, 166, 0.9)" : "rgba(255,255,255,0.2)";
    const fg = isPrimary ? "#e7f7eb" : "#d4e0e8";

    this._drawCard(ctx, x, y, w, h, 10, fill, border);
    ctx.fillStyle = fg;
    ctx.font = "600 16px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + 26);
    ctx.textAlign = "left";

    return { x, y, w, h };
  }

  _roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
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

  _hit(event, rect) {
    if (!rect) return false;
    return event.canvasX >= rect.x && event.canvasX <= rect.x + rect.w && event.canvasY >= rect.y && event.canvasY <= rect.y + rect.h;
  }

  _setTapPulse(x, y) {
    this._tapPulse = { x, y, life: 12 };
  }

  _renderTapPulse(ctx) {
    if (!this._tapPulse) return;

    const t = this._tapPulse.life / 12;
    const radius = 16 + (1 - t) * 26;
    ctx.save();
    ctx.strokeStyle = `rgba(174, 228, 193, ${0.08 + t * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this._tapPulse.x, this._tapPulse.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = testLine;
      }
    });

    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }

    return y;
  }
}
