// lessons.js – daily language lesson content.
// Keep format compact and data-driven so content can scale to 30 days.

export const LESSONS = {
  1: {
    day: 1,
    title: "Saluti e il Mercato",
    // Day 1 — greetings and market basics, priming the player for Marco and Lucia
    vocab: [
      { it: "buongiorno", en: "good morning" },
      { it: "il mercato", en: "the market" },
      { it: "il pane", en: "the bread" },
      { it: "per favore", en: "please" },
      { it: "grazie", en: "thank you" }
    ],
    phrase: {
      it: "Vorrei del pane, per favore.",
      en: "I'd like some bread, please."
    },
    grammar: {
      topic: "Richieste educate con 'vorrei'",
      // 'Vorrei' is the polite form of 'volere' (to want). Use it when ordering or requesting.
      note: "Usa 'vorrei' per fare richieste educate. È più gentile di 'voglio'."
    },
    quiz: [
      {
        prompt: "What does 'buongiorno' mean?",
        choices: ["good evening", "good morning", "good night"],
        answerIndex: 1
      },
      {
        prompt: "Choose the Italian for 'bread'.",
        choices: ["il mercato", "la piazza", "il pane"],
        answerIndex: 2
      },
      {
        prompt: "How do you politely say 'I'd like some bread'?",
        choices: ["Voglio pane!", "Vorrei del pane, per favore.", "Dammi il pane."],
        answerIndex: 1
      },
      {
        prompt: "What does 'per favore' mean?",
        choices: ["thank you", "excuse me", "please"],
        answerIndex: 2
      }
    ]
  },

  2: {
    day: 2,
    title: "Le Direzioni",
    // Day 2 — directions, priming the player to navigate between Piazza and Osteria
    vocab: [
      { it: "sinistra", en: "left" },
      { it: "destra", en: "right" },
      { it: "dritto", en: "straight ahead" },
      { it: "vicino", en: "near / nearby" },
      { it: "lontano", en: "far" }
    ],
    phrase: {
      it: "Gira a sinistra dopo la piazza.",
      en: "Turn left after the square."
    },
    grammar: {
      topic: "Imperativo informale per le direzioni",
      // Direction verbs in Italian use the informal imperative: 'gira' (turn), 'vai' (go), 'continua' (continue).
      note: "Per dare indicazioni stradali usa l'imperativo: 'gira', 'vai', 'continua'."
    },
    quiz: [
      {
        prompt: "What does 'sinistra' mean?",
        choices: ["right", "straight", "left"],
        answerIndex: 2
      },
      {
        prompt: "Choose the Italian for 'straight ahead'.",
        choices: ["destra", "dritto", "lontano"],
        answerIndex: 1
      },
      {
        prompt: "What does 'Gira a destra' mean?",
        choices: ["Go straight ahead", "Turn left", "Turn right"],
        answerIndex: 2
      },
      {
        prompt: "How do you say 'near' in Italian?",
        choices: ["lontano", "vicino", "dritto"],
        answerIndex: 1
      }
    ]
  },

  3: {
    day: 3,
    title: "Segreti e il Passato",
    // Day 3 — secrets/discovery vocab + intro to passato prossimo (ho trovato), priming library storyline
    vocab: [
      { it: "la ricetta", en: "the recipe" },
      { it: "il segreto", en: "the secret" },
      { it: "antico / antica", en: "ancient / old" },
      { it: "nascosto / nascosta", en: "hidden" },
      { it: "ieri", en: "yesterday" }
    ],
    phrase: {
      it: "Ieri ho trovato una ricetta antica.",
      en: "Yesterday I found an ancient recipe."
    },
    grammar: {
      topic: "Introduzione al passato prossimo",
      // The passato prossimo is formed with 'avere' or 'essere' + past participle.
      // 'Ho trovato' = I found (ho = I have, trovato = found).
      note: "Il passato prossimo si forma con 'avere' o 'essere' + participio passato. 'Ho trovato' = I found."
    },
    quiz: [
      {
        prompt: "What does 'la ricetta' mean?",
        choices: ["the secret", "the recipe", "the archive"],
        answerIndex: 1
      },
      {
        prompt: "Choose the Italian for 'hidden'.",
        choices: ["antico", "ieri", "nascosto"],
        answerIndex: 2
      },
      {
        prompt: "What does 'Ieri ho trovato una ricetta antica' mean?",
        choices: [
          "Today I am looking for an old recipe.",
          "Tomorrow I will find an ancient recipe.",
          "Yesterday I found an ancient recipe."
        ],
        answerIndex: 2
      },
      {
        prompt: "In 'ho trovato', what is 'ho'?",
        choices: [
          "The past participle of trovare",
          "The present tense of avere (I have)",
          "The present tense of essere (I am)"
        ],
        answerIndex: 1
      }
    ]
  }
};
