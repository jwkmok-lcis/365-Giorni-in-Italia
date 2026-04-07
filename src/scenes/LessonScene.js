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
    if (event.type !== "keydown") return;

    if (this._phase === "intro") {
      if (event.key === "Enter" || event.key === " ") {
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
      if (event.key === "Enter") {
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
      if (event.key === "Enter") {
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

    const { width, height } = ctx.canvas;
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
    ctx.fillText(this._lesson.title, 40, 130);

    ctx.font = "400 20px Georgia";
    ctx.fillText("Vocabolario", 40, 180);

    ctx.font = "400 18px Georgia";
    let y = 215;
    this._lesson.vocab.forEach((v) => {
      ctx.fillText(`- ${v.it} = ${v.en}`, 56, y);
      y += 30;
    });

    ctx.font = "400 20px Georgia";
    ctx.fillText(`Frase: ${this._lesson.phrase.it}  (${this._lesson.phrase.en})`, 40, 340);
    ctx.fillText(`Grammar: ${this._lesson.grammar.topic} - ${this._lesson.grammar.note}`, 40, 380);

    ctx.fillStyle = "#9ec0cf";
    ctx.fillText("Press Enter to begin quiz", 40, 470);
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
    ctx.fillText("Arrow keys to select, Enter to confirm", 40, 500);
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
      ctx.fillText("Press Enter to continue exploring.", 40, 390);
    } else {
      ctx.fillStyle = "#f0b5a5";
      ctx.fillText("Not enough correct answers.", 40, 330);
      ctx.fillStyle = "#9ec0cf";
      ctx.fillText("Press Enter to retry the lesson.", 40, 390);
    }
  }

  _renderCampaignComplete(ctx, day) {
    const { width, height } = ctx.canvas;
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
      this._promptPanel.textContent = "Review vocab and phrase, then press Enter.";
    } else if (this._phase === "quiz") {
      this._statusPanel.textContent = `Lesson quiz: question ${this._qIndex + 1}/${this._lesson.quiz.length}`;
      this._promptPanel.textContent = "Arrow keys to pick an answer, Enter to lock it in.";
    } else {
      this._statusPanel.textContent = this._result.passed ? "Lesson passed" : "Lesson retry required";
      this._promptPanel.textContent = this._result.passed
        ? "Press Enter to return to the map."
        : "Press Enter to retake the quiz.";
    }
  }
}
