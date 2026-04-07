// LessonScene – runs the daily lesson flow (content + quiz + result).

import { Scene } from "../engine/Scene.js";

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
    this._answers = [];
    this._result = null;
    this._cooldownFrames = 8;

    this._updatePanels();
  }

  update() {
    if (this._cooldownFrames > 0) {
      this._cooldownFrames -= 1;
    }
  }

  handleInput(event) {
    if (this._cooldownFrames > 0) return;
    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart" || event.type === "click";
    const isConfirm = (isKey && (event.key === "Enter" || event.key === " ")) || isTap;

    if (!isKey && !isTap) return;

    if (this._phase === "intro") {
      if (isConfirm) {
        this._phase = "quiz";
        this._updatePanels();
      }
      return;
    }

    if (this._phase === "quiz") {
      const q = this._lesson.quiz[this._qIndex];
      if (event.key === "ArrowUp") {
        this._choiceIndex = (this._choiceIndex - 1 + q.choices.length) % q.choices.length;
      }
      if (event.key === "ArrowDown") {
        this._choiceIndex = (this._choiceIndex + 1) % q.choices.length;
      }

      // Tap directly on a quiz choice to select + confirm
      if (isTap && event.canvasY !== undefined) {
        const baseY = 270;
        let tapped = false;
        for (let i = 0; i < q.choices.length; i++) {
          const top = baseY + i * 44 - 22;
          const bottom = top + 44;
          if (event.canvasY >= top && event.canvasY < bottom) {
            this._choiceIndex = i;
            tapped = true;
            break;
          }
        }
        if (!tapped) {
          this._updatePanels();
          return; // tap missed all choices; don't confirm
        }
      }

      if (isConfirm) {
        this._answers[this._qIndex] = this._choiceIndex;
        this._qIndex += 1;
        this._choiceIndex = 0;

        if (this._qIndex >= this._lesson.quiz.length) {
          this._result = this._game.context.lesson.evaluate(this._lesson, this._answers);
          this._phase = "result";

          if (this._result.passed) {
            this._game.context.day.completeLesson(this._game.context.bus);
          }
        }
      }
      this._updatePanels();
      return;
    }

    if (this._phase === "result") {
      if (isConfirm) {
        if (this._result.passed) {
          this._game.context.scenes.go("map", this._game);
        } else {
          this._phase = "quiz";
          this._qIndex = 0;
          this._choiceIndex = 0;
          this._answers = [];
          this._result = null;
          this._updatePanels();
        }
      }
    }
  }

  render(ctx, alpha, game) {
    if (game.context.day.gameComplete) {
      this._renderCampaignComplete(ctx, game.context.day.currentDay);
      return;
    }

    const width = 800;
    const height = 512;
    ctx.fillStyle = "#141f2b";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 36px Georgia";
    ctx.textAlign = "left";
    ctx.fillText(`Giorno ${game.context.day.currentDay} · Lezione`, 40, 70);

    if (this._phase === "intro") {
      this._renderIntro(ctx);
    } else if (this._phase === "quiz") {
      this._renderQuiz(ctx);
    } else {
      this._renderResult(ctx);
    }
  }

  _renderIntro(ctx) {
    ctx.fillStyle = "#f2efe7";
    ctx.font = "600 28px Georgia";
    let y = this._drawWrappedText(ctx, this._lesson.title, 40, 130, 720, 34);

    ctx.font = "400 20px Georgia";
    y += 18;
    ctx.fillText("Vocabolario", 40, y);

    ctx.font = "400 18px Georgia";
    y += 35;
    this._lesson.vocab.forEach((v) => {
      y = this._drawWrappedText(ctx, `- ${v.it} = ${v.en}`, 56, y, 700, 28);
      y += 4;
    });

    y += 16;
    ctx.font = "400 20px Georgia";
    y = this._drawWrappedText(
      ctx,
      `Frase: ${this._lesson.phrase.it} (${this._lesson.phrase.en})`,
      40,
      y,
      720,
      30
    );
    y += 10;
    y = this._drawWrappedText(
      ctx,
      `Grammar: ${this._lesson.grammar.topic} - ${this._lesson.grammar.note}`,
      40,
      y,
      720,
      30
    );

    ctx.fillStyle = "#9ec0cf";
    ctx.font = "600 20px Georgia";
    const hintY = Math.min(512 - 24, y + 46);
    ctx.fillText("Press Enter or tap to begin quiz", 40, hintY);
  }

  _renderQuiz(ctx) {
    const q = this._lesson.quiz[this._qIndex];

    ctx.fillStyle = "#f2efe7";
    ctx.font = "600 25px Georgia";
    ctx.fillText(`Question ${this._qIndex + 1} / ${this._lesson.quiz.length}`, 40, 140);

    ctx.font = "400 22px Georgia";
    ctx.fillText(q.prompt, 40, 200);

    ctx.font = "400 20px Georgia";
    let y = 270;
    q.choices.forEach((choice, idx) => {
      const selected = idx === this._choiceIndex;
      ctx.fillStyle = selected ? "#b7df8f" : "#d7e3ea";
      ctx.fillText(`${selected ? ">" : " "} ${choice}`, 60, y);
      y += 44;
    });

    ctx.fillStyle = "#9ec0cf";
    ctx.font = "400 18px Georgia";
    ctx.fillText("Arrow keys to select, Enter or tap to confirm", 40, 500);
  }

  _renderResult(ctx) {
    ctx.fillStyle = "#f2efe7";
    ctx.font = "600 30px Georgia";
    ctx.fillText("Lesson Result", 40, 150);

    ctx.font = "400 22px Georgia";
    ctx.fillText(`Score: ${this._result.score}%`, 40, 220);
    ctx.fillText(`Correct: ${this._result.correct} / ${this._result.total}`, 40, 260);

    if (this._result.passed) {
      ctx.fillStyle = "#b7df8f";
      ctx.fillText("Passed. Map unlocked for today.", 40, 330);
      ctx.fillStyle = "#9ec0cf";
      ctx.fillText("Press Enter or tap to continue exploring.", 40, 390);
    } else {
      ctx.fillStyle = "#f0b5a5";
      ctx.fillText("Not enough correct answers.", 40, 330);
      ctx.fillStyle = "#9ec0cf";
      ctx.fillText("Press Enter or tap to retry the lesson.", 40, 390);
    }
  }

  _renderCampaignComplete(ctx, day) {
    const width = 800;
    const height = 512;
    ctx.fillStyle = "#121a22";
    ctx.fillRect(0, 0, width, height);

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
      this._promptPanel.textContent = "Review vocab and phrase, then press Enter or tap.";
    } else if (this._phase === "quiz") {
      this._statusPanel.textContent = `Lesson quiz: question ${this._qIndex + 1}/${this._lesson.quiz.length}`;
      this._promptPanel.textContent = "Arrow keys to pick an answer, Enter or tap to lock it in.";
    } else {
      this._statusPanel.textContent = this._result.passed ? "Lesson passed" : "Lesson retry required";
      this._promptPanel.textContent = this._result.passed
        ? "Press Enter or tap to return to the map."
        : "Press Enter or tap to retake the quiz.";
    }
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
