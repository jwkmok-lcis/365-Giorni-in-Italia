// LessonSystem – serves daily lesson content and validates quiz answers.

import { LESSONS } from "../content/lessons.js";

export class LessonSystem {
  getLessonForDay(day) {
    return LESSONS[day] ?? LESSONS[1];
  }

  evaluate(lesson, selectedAnswers) {
    const total = lesson.quiz.length;
    let correct = 0;

    for (let i = 0; i < total; i += 1) {
      if (selectedAnswers[i] === lesson.quiz[i].answerIndex) {
        correct += 1;
      }
    }

    const score = Math.round((correct / total) * 100);
    return {
      total,
      correct,
      incorrect: total - correct,
      score,
      passed: correct >= Math.ceil(total * 0.67)
    };
  }
}
