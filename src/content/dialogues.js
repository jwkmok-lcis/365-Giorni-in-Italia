// dialogues.js – branching NPC conversations for Bologna locations.
// Each node has: speaker, text, choices[]
// A choice can have: text, next, end, effects
// Italian is the game language. clueHint appears in English as a learning aid.
// NEW: Adaptive difficulty with versions (A1, A1+, A2) based on player skill

const LEGACY_SKILL_TAGS = {
  basicSentences: ["S1"],
  presentTense: ["S2"],
  articleGender: ["S3"],
  simpleQuestions: ["S4"],
  vocabulary: ["S5"],
  vocabularyRecognition: ["S5"],
  pastTense: ["S6"],
  connectors: ["S7"],
  pronouns: ["S8"],
  modals: ["S9"],
  infinitives: ["S10"],
  complexCombinations: ["S6", "S7", "S8", "S9", "S10"],
};

const DAILY_SCRIPT_FOCUS = {
  1: ["S5"],
  2: ["S5"],
  3: ["S5", "S4"],
  4: ["S6"],
  5: ["S7"],
  6: ["S9"],
  7: ["S7", "S9"],
  8: ["S8"],
  9: ["S6", "S8"],
  10: ["S7", "S8"],
  11: ["S8", "S9"],
  12: ["S6", "S7", "S8"],
  13: ["S9", "S10"],
  14: ["S7", "S9", "S10"],
  15: ["S8", "S9"],
  16: ["S6", "S7", "S8"],
  17: ["S9", "S10"],
  18: ["S7", "S9", "S10"],
  19: ["S8"],
  20: ["S6", "S8"],
  21: ["S7", "S8"],
  22: ["S8", "S9"],
  23: ["S6", "S7", "S8"],
  24: ["S9", "S10"],
  25: ["S7", "S9", "S10"],
  26: ["S5", "S6", "S7", "S8"],
  27: ["S6", "S9"],
  28: ["S7", "S8", "S9"],
  29: ["S6", "S7", "S8", "S9"],
  30: ["S10"],
};

const ACKNOWLEDGEMENT_RE = /^(grazie|capito|bene\.?|interessante\.?|a presto|milano\?|due ore\?|al dente\?|qualcos'altro\?|maria… chi\?|sapore\?|forse\.?|sì\.?|no\.?|un po\.?|ottima idea\.)/i;

function inferNodeDay(nodeId) {
  const match = String(nodeId).match(/^day(\d+)_/);
  return match ? Number(match[1]) : 1;
}

function inferSkillTags(choice, nodeDay) {
  if (Array.isArray(choice.skillTags) && choice.skillTags.length > 0) {
    return [...new Set(choice.skillTags)];
  }

  if (Array.isArray(choice.skills) && choice.skills.length > 0) {
    const mapped = choice.skills.flatMap((skillKey) => LEGACY_SKILL_TAGS[skillKey] ?? []);
    if (mapped.length > 0) {
      return [...new Set(mapped)];
    }
  }

  return [...(DAILY_SCRIPT_FOCUS[nodeDay] ?? ["S5"])];
}

function inferXpMode(choice, skillTags) {
  if (choice.xpMode) {
    return choice.xpMode;
  }

  if (skillTags.length === 0) {
    return "comprehension";
  }

  return ACKNOWLEDGEMENT_RE.test(choice.text ?? "") ? "comprehension" : "production";
}

function inferXp(choice, skillTags, xpMode) {
  if (choice.xp !== undefined) {
    return choice.xp;
  }

  if ((choice.grammarAccuracy ?? 0.85) < 0.65) {
    return 0;
  }

  if (xpMode === "comprehension") {
    return Math.max(2, skillTags.length >= 2 ? 5 : 2);
  }

  if (skillTags.length >= 4) return 22;
  if (skillTags.length >= 3) return 20;
  if (skillTags.length === 2) return 15;
  if (skillTags.includes("S6")) return 10;
  if (skillTags.includes("S5")) return 5;
  return 8;
}

function enrichDialogueMetadata(dialogues) {
  Object.values(dialogues).forEach((script) => {
    Object.entries(script.nodes).forEach(([nodeId, node]) => {
      const nodeDay = inferNodeDay(nodeId);
      (node.choices ?? []).forEach((choice) => {
        const skillTags = inferSkillTags(choice, nodeDay);
        choice.skillTags ??= skillTags;
        choice.xpMode ??= inferXpMode(choice, skillTags);
        choice.xp ??= inferXp(choice, skillTags, choice.xpMode);
        choice.grammarAccuracy ??= skillTags.length === 0 ? 1 : 0.85;
        choice.complexity ??= 1 + Math.max(0, skillTags.length - 1) * 0.15;
      });
    });
  });
}

export const DIALOGUES = {
  // ── Day 1 NPCs ──────────────────────────────────────────────────────────
  marco_verdini: {
    npcName: "Marco Verdini",
    start: "start",
    dayStarts: {
      4: "day4_marco_start",
      7: "day7_marco_synthesis",
      8: "day8_marco_ferrante",
      12: "day12_marco_meat",
      14: "day14_marco_broth",
      15: "day15_marco_after",
      19: "day19_marco_verify",
      21: "day21_marco_confirm",
      22: "day22_marco_broth",
      24: "day24_marco_rest",
      28: "day28_marco_formula"
    },
    nodes: {
      start: {
        speaker: "Marco",
        requiredSkills: ["basicSentences"],
        versions: {
          A1: {
            text: "Buongiorno! Cerchi qualcosa?",
            en: "Good morning! Are you looking for something?",
            choices: [
              {
                text: "Sì.",
                next: "ragu_hook",
                effects: { relationDelta: 1 },
                skills: ["basicSentences"],
                grammarAccuracy: 0.8,
                complexity: 1.0
              },
              {
                text: "No.",
                next: "casual",
                effects: { relationDelta: 0 },
                skills: ["basicSentences"],
                grammarAccuracy: 0.8,
                complexity: 1.0
              }
            ]
          },
          A1Plus: {
            text: "Buongiorno! Stai cercando qualcosa di speciale?",
            en: "Good morning! Are you looking for something special?",
            choices: [
              {
                text: "Sì, cerco il ragù.",
                next: "ragu_hook",
                effects: { relationDelta: 1 },
                skills: ["basicSentences", "presentTense"],
                grammarAccuracy: 0.9,
                complexity: 1.2
              },
              {
                text: "Sto solo esplorando.",
                next: "casual",
                effects: { relationDelta: 0 },
                skills: ["basicSentences", "presentTense"],
                grammarAccuracy: 0.9,
                complexity: 1.2
              }
            ]
          },
          A2: {
            text: "Buongiorno! Stai cercando qualcosa di speciale in questa piazza?",
            en: "Good morning! Are you looking for something special in this square?",
            choices: [
              {
                text: "Sì — cerco il ragù leggendario di Bologna.",
                next: "ragu_hook",
                effects: { relationDelta: 1 },
                skills: ["basicSentences", "presentTense", "connectors"],
                grammarAccuracy: 1.0,
                complexity: 1.5
              },
              {
                text: "Sto solo esplorando la città.",
                next: "casual",
                effects: { relationDelta: 0 },
                skills: ["basicSentences", "presentTense"],
                grammarAccuracy: 0.95,
                complexity: 1.3
              }
            ]
          }
        }
      },
      ragu_hook: {
        speaker: "Marco",
        text: "Abbassa la voce. Chi fa troppe domande sul ragù... ha nemici. Ma se vuoi davvero capire, inizia dal pane.",
        en: "Lower your voice. Too many questions about ragù can make enemies. But if you really want to know, start with the bread.",
        choices: [
          {
            text: "Dal pane? Spiegami meglio.",
            next: "pane_clue",
            effects: { relationDelta: 1, clueHint: "Clue unlocked: the bread of a region reveals its ragù. Go to Lucia at the market." }
          },
          {
            text: "Nemici? Stai esagerando.",
            next: "dismissal",
            effects: { relationDelta: -1 }
          }
        ]
      },
      pane_clue: {
        speaker: "Marco",
        text: "Il pane bolognese — morbido dentro, crosta leggera. Un ragù fatto bene lo assorbe senza rompersi. È tutta una questione di equilibrio. Vai da Lucia al mercato. Chiedile del soffritto. Non dire che ti mando io.",
        en: "Bolognese bread — soft inside, light crust. A good ragù is absorbed without it falling apart. It's all about balance. Go to Lucia at the market. Ask about the soffritto. Don't say I sent you.",
        choices: [
          {
            text: "Capito. Grazie mille, Marco.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },
      dismissal: {
        speaker: "Marco",
        text: "Vabbè. Torna quando sei pronto a prendere sul serio la cucina bolognese.",
        en: "Fine. Come back when you're ready to take Bolognese cooking seriously.",
        choices: [
          {
            text: "Scusa — hai ragione. Dal pane, dicevi?",
            next: "pane_clue",
            effects: { relationDelta: 0 }
          }
        ]
      },
      casual: {
        speaker: "Marco",
        text: "Ci mancherebbe. Sono qui ogni mattina. Se trovi qualcosa di interessante, torna a dirmelo.",
        en: "Of course. I'm here every morning. If you find something interesting, come back and tell me.",
        choices: [
          {
            text: "A presto, Marco.",
            end: true,
            effects: { relationDelta: 0 }
          }
        ]
      },

      // ── Day 4: passato prossimo intro ────────────────────────────────────
      day4_marco_start: {
        speaker: "Marco",
        text: "Allora? Hai trovato qualcosa in biblioteca?",
        en: "So? Have you found anything at the library?",
        choices: [
          {
            text: "Sì, ho trovato informazioni.",
            next: "day4_marco_follow",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "No, cerco ancora.",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 5,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day4_marco_follow: {
        speaker: "Marco",
        text: "Bene. La ricerca è importante. Continua.",
        en: "Good. The research matters. Keep going.",
        choices: [
          { text: "Grazie.", end: true, effects: { relationDelta: 1 }, skillTags: ["S5"], xp: 2, xpMode: "comprehension", skills: ["basicSentences"], grammarAccuracy: 0.8, complexity: 1.0 }
        ]
      },

      // ── Day 7: sentence synthesis ────────────────────────────────────────
      day7_marco_synthesis: {
        speaker: "Marco",
        text: "Allora? Sai qualcosa di più?",
        en: "So? Do you know anything more?",
        choices: [
          {
            text: "Sì, ma è difficile.",
            next: "day7_marco_close",
            effects: { relationDelta: 0 },
            skillTags: ["S7", "S5"],
            xp: 12,
            xpMode: "production",
            skills: ["connectors", "basicSentences"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          },
          {
            text: "No, ma ho trovato informazioni.",
            next: "day7_marco_close",
            effects: { relationDelta: 1 },
            skillTags: ["S7", "S6"],
            xp: 14,
            xpMode: "production",
            skills: ["connectors", "pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          }
        ]
      },
      day7_marco_close: {
        speaker: "Marco",
        text: "Bravissimo. Continua così.",
        en: "Very good. Keep going like this.",
        choices: [
          { text: "Grazie.", end: true, effects: { relationDelta: 1 }, skillTags: ["S5"], xp: 2, xpMode: "comprehension", skills: ["basicSentences"], grammarAccuracy: 0.8, complexity: 1.0 }
        ]
      },

      // ── Day 8: after Lucia's M.F. revelation ─────────────────────────────
      day8_marco_ferrante: {
        speaker: "Marco",
        text: "I Ferrante? Li conosco da anni. Maria Ferrante la sapeva lunga — lei ha creato il ragù moderno come lo conosciamo.",
        en: "The Ferrantas? I've known them for years. Maria Ferrante was sharp — she created the modern ragù as we know it.",
        choices: [
          {
            text: "L'hai incontrata?",
            next: "day8_marco_reveal",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.4
          },
          {
            text: "Li hai visti spesso?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day8_marco_reveal: {
        speaker: "Marco",
        text: "(Pausa.) Una volta, sì. Al mercato, tanti anni fa. Non parlava molto. Ma quando cucinava... tutti si fermavano.",
        en: "(Pause.) Once, yes. At the market, many years ago. She didn't say much. But when she cooked... everyone stopped.",
        choices: [
          { text: "Grazie, Marco.", end: true, effects: { relationDelta: 1, clueHint: "Marco confirmed Maria Ferrante was known at the market. Her recipe carries real history." } }
        ]
      },

      // ── Day 12: meat cut debate ───────────────────────────────────────────
      day12_marco_meat: {
        speaker: "Marco",
        text: "Il taglio della carne? La devi fare sottile — assorbe meglio il sugo. L'ho provato molte volte.",
        en: "The cut of the meat? You must make it thin — it absorbs the sauce better. I've tried it many times.",
        choices: [
          {
            text: "L'hai provato e ti piace?",
            next: "day12_marco_explain",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Ma Giorgio dice diverso.",
            next: "day12_marco_explain",
            effects: { relationDelta: 0 },
            skills: ["connectors", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.4
          }
        ]
      },
      day12_marco_explain: {
        speaker: "Marco",
        text: "Giorgio ha i suoi metodi. Io ho i miei. La carne sottile e il sugo si capiscono.",
        en: "Giorgio has his methods. I have mine. Thin meat and sauce understand each other.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 14: broth and archive ─────────────────────────────────────────
      day14_marco_broth: {
        speaker: "Marco",
        text: "Il brodo? Lo devi aggiungere alla fine, piano piano. E l'archivio — lo devi visitare con Conti. Ha le risposte.",
        en: "The broth? You must add it at the end, slowly. And the archive — you must visit it with Conti. It has the answers.",
        choices: [
          {
            text: "Lo devo visitare quando?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },

      // ── Day 15: after Giorgio confrontation ──────────────────────────────
      day15_marco_after: {
        speaker: "Marco",
        text: "Giorgio ti ha parlato? È un uomo complicato. Ma sa tutto sul ragù.",
        en: "Giorgio spoke to you? He's a complicated man. But he knows everything about ragù.",
        choices: [
          {
            text: "Sì, ha parlato ma non ha spiegato.",
            next: "day15_marco_context",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Lo conosci bene?",
            next: "day15_marco_context",
            effects: { relationDelta: 0 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day15_marco_context: {
        speaker: "Marco",
        text: "Lui e Maria Ferrante… una storia vecchia. Non chiedermi di più.",
        en: "Him and Maria Ferrante… an old story. Don't ask me more.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1, clueHint: "Marco confirmed a history between Giorgio and Maria Ferrante. It's old and unresolved." } }
        ]
      },

      // ── Day 19: final verification ────────────────────────────────────────
      day19_marco_verify: {
        speaker: "Marco",
        text: "La verifica finale? La facciamo insieme. Sì, la devi completare — poi la porti a Donna Rosa.",
        en: "The final verification? We do it together. Yes, you must complete it — then bring it to Donna Rosa.",
        choices: [
          {
            text: "La devo portare dove?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      },

      // ── Day 21: heavy pot ─────────────────────────────────────────────────
      day21_marco_confirm: {
        speaker: "Marco",
        text: "Sì, la pentola pesante è giusta — Giorgio la conferma. La devi portare in cucina e usarla sempre.",
        en: "Yes, the heavy pot is right — Giorgio confirms it. You must bring it to the kitchen and always use it.",
        choices: [
          {
            text: "La devo portare ma dove?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 22: broth quantity ────────────────────────────────────────────
      day22_marco_broth: {
        speaker: "Marco",
        text: "Il brodo alla fine — lo devi aggiungere piano, un po' alla volta. Lo fai evaporare leggermente.",
        en: "The broth at the end — you must add it slowly, a little at a time. You make it evaporate slightly.",
        choices: [
          {
            text: "Lo devo far evaporare come?",
            next: "day22_marco_explain",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma è necessario?",
            next: "day22_marco_explain",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day22_marco_explain: {
        speaker: "Marco",
        text: "Sì, è necessario. Senza brodo il ragù diventa secco. Il sugo deve essere vivo.",
        en: "Yes, it's necessary. Without broth the ragù dries out. The sauce must be alive.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 24: resting phase ─────────────────────────────────────────────
      day24_marco_rest: {
        speaker: "Marco",
        text: "Il riposo finale? Lo devi fare sempre. Lo lasci riposare, poi lo servi con la pasta.",
        en: "The final rest? You must always do it. You let it rest, then you serve it with pasta.",
        choices: [
          {
            text: "Devo servire come?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      },

      // ── Day 28: final formula ─────────────────────────────────────────────
      day28_marco_formula: {
        speaker: "Marco",
        text: "La formula finale? La devi completare con tutti — Conti, Lucia ed Elena. La scriviamo insieme.",
        en: "The final formula? You must complete it with everyone — Conti, Lucia and Elena. We write it together.",
        choices: [
          {
            text: "La scriviamo ma dove?",
            next: "day28_marco_explain",
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Bene.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day28_marco_explain: {
        speaker: "Marco",
        text: "In biblioteca, con Elena e Conti. Poi la portiamo a Donna Rosa per l'approvazione finale.",
        en: "At the library, with Elena and Conti. Then we bring it to Donna Rosa for final approval.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      }
    }
  },

  lucia_ferrante: {
    npcName: "Lucia Ferrante",
    start: "start",
    dayStarts: {
      4: "day4_lucia_start",
      8: "day8_lucia_signature",
      11: "day11_lucia_confirm",
      13: "day13_lucia_soffritto",
      16: "day16_lucia_confirm",
      17: "day17_lucia_wine",
      25: "day25_lucia_pasta",
      28: "day28_lucia_formula"
    },
    nodes: {
      start: {
        speaker: "Lucia",
        text: "Eccoti! Scommetto che Marco ti ha mandato. Il solito... Al mercato si sa già tutto.",
        en: "There you are! I bet Marco sent you. Typical. Everyone at the market already knows.",
        choices: [
          {
            text: "Sì. Mi ha detto di chiederti del soffritto.",
            next: "soffritto_reveal",
            effects: { relationDelta: 1 }
          },
          {
            text: "No, sono qui per conto mio. Cerco il ragù leggendario.",
            next: "soffritto_reveal",
            effects: { relationDelta: 0 }
          }
        ]
      },
      soffritto_reveal: {
        speaker: "Lucia",
        text: "Finalmente qualcuno che fa le domande giuste. Cipolla, carota, sedano — sempre tutti e tre. Chi ne omette uno è un impostore. Punto.",
        en: "Finally someone asking the right questions. Onion, carrot, celery — always all three. Anyone who skips one is a fraud. Period.",
        choices: [
          {
            text: "E la carne? Quando si aggiunge?",
            next: "meat_follow",
            effects: { relationDelta: 1, clueHint: "The soffritto base is non-negotiable: onion, carrot, celery. All three." }
          },
          {
            text: "Dove compro le verdure migliori?",
            next: "fresh_tip",
            effects: { relationDelta: 1 }
          }
        ]
      },
      meat_follow: {
        speaker: "Lucia",
        text: "La carne viene dopo. Prima il soffritto. Lo fai sudare piano, fuoco basso, almeno venti minuti. La fretta uccide il ragù — ricordatelo.",
        en: "The meat comes after. First the soffritto. Let it sweat slowly, low heat, at least twenty minutes. Rushing kills the ragù — remember that.",
        choices: [
          {
            text: "Grazie, Lucia. Hai già detto tutto.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },
      fresh_tip: {
        speaker: "Lucia",
        text: "Qui al mercato, ovviamente! Ma stai attenta — non tutti vendono roba buona. Io te le scelgo io. E non comprare mai le carote già tagliate.",
        en: "Here at the market, obviously! But be careful — not everyone sells good produce. I'll pick them for you. And never buy pre-cut carrots.",
        choices: [
          {
            text: "Grazie mille, Lucia.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },

      // ── Day 4: passato prossimo ───────────────────────────────────────────
      day4_lucia_start: {
        speaker: "Lucia",
        text: "Ciao! Sei tornato. Hai parlato con Giorgio?",
        en: "Hi! You're back. Did you talk to Giorgio?",
        choices: [
          {
            text: "Sì, ho parlato con lui.",
            next: "day4_past_reveal",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "No, non ancora.",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 5,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          },
          {
            text: "Sì, Giorgio.",
            next: "day4_lucia_retry_prompt",
            effects: { relationDelta: 0 },
            retryPrompt: "Non capisco. Prova con il passato completo.",
            retryCorrection: "Sì, ho parlato con lui.",
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.4,
            complexity: 1.0
          }
        ]
      },
      day4_lucia_retry_prompt: {
        speaker: "Lucia",
        text: "Non capisco. Intendi dire: 'Sì, ho parlato con lui?'",
        en: "I don't understand. Do you mean: 'Yes, I spoke with him?'",
        choices: [
          {
            text: "Sì, ho parlato con lui.",
            next: "day4_past_reveal",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Non ancora.",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 3,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day4_past_reveal: {
        speaker: "Lucia",
        text: "E cosa ha detto?",
        en: "And what did he say?",
        choices: [
          {
            text: "Ha detto 'sei ore'.",
            next: "day4_reinforce",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "comprehension",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Non ricordo.",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 5,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day4_reinforce: {
        speaker: "Lucia",
        text: "Interessante… io ho sempre fatto tre ore. Qualcosa non torna.",
        en: "Interesting… I've always made it three hours. Something doesn't add up.",
        choices: [
          {
            text: "Ho una domanda.",
            end: true,
            effects: { relationDelta: 1 },
            skillTags: ["S5"],
            xp: 8,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 0, clueHint: "Lucia has always used three hours. Giorgio insists six. The contradiction deepens." },
            skillTags: ["S6"],
            xp: 3,
            xpMode: "comprehension",
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.0
          }
        ]
      },

      // ── Day 8: M.F. revelation (IMPROVED) ────────────────────────────────
      day8_lucia_signature: {
        speaker: "Lucia",
        text: "M.F.?\n[Lucia smette di lavorare. Mette giù le verdure. Ti guarda.]\nDove hai letto questa sigla?",
        en: "M.F.?\n[Lucia stops working. She puts down the vegetables. She looks at you.]\nWhere did you read this signature?",
        choices: [
          {
            text: "L'ho trovata nell'archivio.",
            next: "day8_lucia_pause",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "In biblioteca.",
            next: "day8_lucia_pause",
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 5,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          },
          {
            text: "Trovata archivio.",
            next: "day8_lucia_signature_retry",
            effects: { relationDelta: 0 },
            retryPrompt: "Non capisco. Usa il pronome e il passato completo.",
            retryCorrection: "L'ho trovata nell'archivio.",
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.4,
            complexity: 1.0
          }
        ]
      },
      day8_lucia_signature_retry: {
        speaker: "Lucia",
        text: "Non capisco. Intendi dire: 'L'ho trovata nell'archivio?'",
        en: "I don't understand. Do you mean: 'I found it in the archive?'",
        choices: [
          {
            text: "L'ho trovata nell'archivio.",
            next: "day8_lucia_pause",
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 10,
            xpMode: "production",
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "In biblioteca.",
            next: "day8_lucia_pause",
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 5,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day8_lucia_pause: {
        speaker: "Lucia",
        text: "[Silenzio. Poi, piano:]\nÈ mia nonna.\nMaria Ferrante.\n[Un altro silenzio. Come se il nome pesasse.]",
        en: "[Silence. Then, quietly:]\nIt's my grandmother.\nMaria Ferrante.\n[Another silence. As though the name carries weight.]",
        choices: [
          {
            text: "Maria… chi?",
            next: "day8_lucia_story",
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          },
          {
            text: "La conosci bene?",
            next: "day8_lucia_story",
            effects: { relationDelta: 1 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day8_lucia_story: {
        speaker: "Lucia",
        text: "Lei ha scritto la ricetta. Quella vera. La famiglia Ferrante l'ha custodita per generazioni. Non ne parliamo spesso.",
        en: "She wrote the recipe. The real one. The Ferrante family has guarded it for generations. We don't often speak of it.",
        choices: [
          {
            text: "Perché l'avete custodita?",
            end: true,
            effects: { relationDelta: 1, clueHint: "REVELATION: M.F. = Maria Ferrante, Lucia's grandmother. She wrote the original recipe. It has been kept secret within the family." },
            skills: ["pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Non lo sapevo.",
            end: true,
            effects: { relationDelta: 1, clueHint: "REVELATION: M.F. = Maria Ferrante, Lucia's grandmother. She wrote the original recipe." },
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      },

      // ── Day 11: tomato ────────────────────────────────────────────────────
      day11_lucia_confirm: {
        speaker: "Lucia",
        text: "Il pomodoro? Sì, lo mettiamo sempre. Il pomodoro fresco lo trovi qui — lo devi scegliere bene.",
        en: "The tomato? Yes, we always put it. You find fresh tomato here — you must choose it well.",
        choices: [
          {
            text: "Lo posso vedere?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Devo comprarlo ora?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },

      // ── Day 13: soffritto order ───────────────────────────────────────────
      day13_lucia_soffritto: {
        speaker: "Lucia",
        text: "L'ordine del soffritto? Prima cipolla, poi carota, poi sedano. Sempre. La cipolla deve sudare prima — la devi cuocere dieci minuti.",
        en: "The order of soffritto? First onion, then carrot, then celery. Always. The onion must sweat first — you must cook it ten minutes.",
        choices: [
          {
            text: "Lo devo fare sempre così?",
            next: "day13_lucia_explain",
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma Marco dice diverso.",
            next: "day13_lucia_explain",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day13_lucia_explain: {
        speaker: "Lucia",
        text: "Marco sbaglia sull'ordine. La cipolla prima — non si discute.",
        en: "Marco is wrong about the order. The onion first — it's not up for debate.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 16: soffritto confirmation ────────────────────────────────────
      day16_lucia_confirm: {
        speaker: "Lucia",
        text: "Sì, l'ordine è importante. Li devi cuocere dieci minuti — perché la cipolla deve sudare prima. Li ho provati molte volte.",
        en: "Yes, the order is important. You must cook them ten minutes — because the onion must sweat first. I've tried it many times.",
        choices: [
          {
            text: "Li hai provati e funziona?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      },

      // ── Day 17: white wine ────────────────────────────────────────────────
      day17_lucia_wine: {
        speaker: "Lucia",
        text: "Il vino bianco? Lo devi aggiungere sempre — un bicchiere dopo il soffritto. Lo fai evaporare completamente.",
        en: "The white wine? You must always add it — one glass after the soffritto. You make it evaporate completely.",
        choices: [
          {
            text: "Lo devo aggiungere quando?",
            next: "day17_lucia_amount",
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma Giorgio dice no vino.",
            next: "day17_lucia_amount",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day17_lucia_amount: {
        speaker: "Lucia",
        text: "Giorgio non usa vino. È la sua scelta. Nonna Maria usava vino — e qualcos'altro. (Si ferma.) Vai da Donna Rosa. Lei sa.",
        en: "Giorgio doesn't use wine. It's his choice. Nonna Maria used wine — and something else. (She stops.) Go to Donna Rosa. She knows.",
        choices: [
          { text: "Qualcos'altro?", end: true, effects: { relationDelta: 1, clueHint: "Lucia hinted that Maria used wine AND something else. Donna Rosa may know what it was." } }
        ]
      },

      // ── Day 25: pasta pairing ─────────────────────────────────────────────
      day25_lucia_pasta: {
        speaker: "Lucia",
        text: "La pasta giusta? Devi scegliere tagliatelle — perché assorbono il sugo bene. Le devi cuocere al dente.",
        en: "The right pasta? You must choose tagliatelle — because they absorb the sauce well. You must cook them al dente.",
        choices: [
          {
            text: "Le devo cuocere ma come?",
            next: "day25_lucia_explain",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals", "infinitives", "connectors"],
            grammarAccuracy: 0.9,
            complexity: 1.7
          },
          {
            text: "Al dente?",
            next: "day25_lucia_explain",
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day25_lucia_explain: {
        speaker: "Lucia",
        text: "Al dente: cotta ma ancora con un po' di resistenza. Poi le porti a Donna Rosa per conferma.",
        en: "Al dente: cooked but still with a little resistance. Then bring them to Donna Rosa for confirmation.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 28: formula ───────────────────────────────────────────────────
      day28_lucia_formula: {
        speaker: "Lucia",
        text: "La formula? La dobbiamo scrivere precisa. Sì, la dobbiamo seguire sempre — poi la portiamo a Donna Rosa.",
        en: "The formula? We must write it precisely. Yes, we must always follow it — then we bring it to Donna Rosa.",
        choices: [
          {
            text: "La portiamo ma quando?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      }
    }
  },

  // ── Day 2 NPCs ──────────────────────────────────────────────────────────
  donna_rosa: {
    npcName: "Donna Rosa",
    start: "start",
    dayStarts: {
      5: "day5_connector_start",
      9: "day9_donna_contrast",
      11: "day11_donna_verify",
      13: "day13_donna_wine",
      17: "day17_donna_wine_debate",
      20: "day20_donna_confession",
      23: "day23_donna_time",
      24: "day24_donna_rest",
      25: "day25_donna_confirm",
      26: "day26_donna_ratios",
      30: "day30_donna_card"
    },
    nodes: {
      start: {
        speaker: "Donna Rosa",
        text: "Non mi sorprende che tu sia qui. Bologna ha una lunga memoria. La storia del ragù risale più indietro di quanto pensi.",
        en: "It doesn't surprise me that you're here. Bologna has a long memory. The ragù story goes back further than you think.",
        choices: [
          {
            text: "Hai sentito qualcosa di strano sull'osteria?",
            next: "osteria_rumor",
            effects: { relationDelta: 1 }
          },
          {
            text: "Quanto tempo ci vuole per un ragù autentico?",
            next: "cooking_time",
            effects: { relationDelta: 0 }
          }
        ]
      },
      osteria_rumor: {
        speaker: "Donna Rosa",
        text: "Giorgio al Sole è nervoso ultimamente. Prima parlava della ricetta con chiunque. Adesso schiva l'argomento. Vai a parlargli — ma ascolta anche quello che non dice.",
        en: "Giorgio at the Osteria del Sole has been nervous lately. He used to talk about the recipe with anyone. Now he avoids the subject. Go talk to him — but listen to what he doesn't say too.",
        choices: [
          {
            text: "E tu cosa pensi che nasconda?",
            next: "cooking_time",
            effects: { relationDelta: 1, clueHint: "Donna Rosa is suspicious of Giorgio. His story may have recently changed." }
          },
          {
            text: "Grazie per l'avviso. Ci vado.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },
      cooking_time: {
        speaker: "Donna Rosa",
        text: "Il ragù vero vuole almeno tre ore, fuoco bassissimo. Mia nonna diceva: 'Il sugo deve tremare, non bollire.' Tre ore — non un minuto di meno.",
        en: "The real ragù needs at least three hours on very low heat. My grandmother said: 'The sauce should shiver, not boil.' Three hours — not a minute less.",
        choices: [
          {
            text: "Ho sentito qualcuno dire sei ore.",
            next: "contradiction",
            effects: { relationDelta: 0 }
          },
          {
            text: "Capito. Grazie, Donna Rosa.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },
      contradiction: {
        speaker: "Donna Rosa",
        text: "Sei ore? Chi te lo ha detto? Giorgio, scommetto. O esagera per confondere le idee... oppure nasconde qualcos'altro di diverso.",
        en: "Six hours? Who told you that? Giorgio, I bet. Either he exaggerates to confuse people... or he's hiding something else entirely.",
        choices: [
          {
            text: "Interessante. Grazie, ci penso.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },

      // ── Day 5: connectors ─────────────────────────────────────────────────
      day5_connector_start: {
        speaker: "Donna Rosa",
        text: "Tre ore sono giuste… ma dipende dal fuoco. Fuoco basso significa tempo lungo — quindi serve pazienza.",
        en: "Three hours is right… but it depends on the heat. Low heat means long time — so patience is needed.",
        choices: [
          {
            text: "Perché?",
            next: "day5_connector_explain",
            effects: { relationDelta: 1 },
            skillTags: ["S7"],
            xp: 8,
            xpMode: "production",
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          },
          {
            text: "Non capisco.",
            next: "day5_connector_explain",
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 3,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day5_connector_explain: {
        speaker: "Donna Rosa",
        text: "Fuoco alto = sugo bruciato. Non c'è scorciatoia. Ma Giorgio non lo accetta mai.",
        en: "High heat = burnt sauce. There's no shortcut. But Giorgio never accepts it.",
        choices: [
          {
            text: "Capisco.",
            end: true,
            effects: { relationDelta: 1 },
            skillTags: ["S7"],
            xp: 5,
            xpMode: "comprehension",
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          },
          {
            text: "Ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skillTags: ["S6"],
            xp: 7,
            xpMode: "comprehension",
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },

      // ── Day 9: two ragùs ──────────────────────────────────────────────────
      day9_donna_contrast: {
        speaker: "Donna Rosa",
        text: "Giorgio li nasconde — ma io li conosco entrambi. Quello antico l'ho provato da bambina. Quello moderno l'ho scoperto dopo.",
        en: "Giorgio hides them — but I know both. I tried the ancient one as a child. I discovered the modern one later.",
        choices: [
          {
            text: "L'hai scoperto come?",
            next: "day9_donna_explain",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Quale mi consigli?",
            next: "day9_donna_explain",
            effects: { relationDelta: 0 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day9_donna_explain: {
        speaker: "Donna Rosa",
        text: "Il moderno l'ho scoperto attraverso Maria Ferrante. Lei lo aveva creato. Poi è sparito.",
        en: "I discovered the modern one through Maria Ferrante. She had created it. Then it disappeared.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1, clueHint: "Donna Rosa confirmed: the modern ragù was created by Maria Ferrante. It disappeared after her." } }
        ]
      },

      // ── Day 11: tomato timing ─────────────────────────────────────────────
      day11_donna_verify: {
        speaker: "Donna Rosa",
        text: "Il pomodoro lo aggiungiamo dopo la carne. Lo cuociamo piano. Lucia ha ragione — lo mettiamo insieme alla carne.",
        en: "We add the tomato after the meat. We cook it slowly. Lucia is right — we put it in with the meat.",
        choices: [
          {
            text: "L'ho capito ora.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Bene.",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 13: wine (milk mystery planted) ──────────────────────────────
      day13_donna_wine: {
        speaker: "Donna Rosa",
        text: "Il vino bianco? Lo aggiungiamo sempre — un bicchiere. Lo fai evaporare completamente.\n[Pausa.]\nMa forse il segreto non è il vino. Forse è quando smetti di contare.",
        en: "The white wine? We always add it — one glass. You make it evaporate completely.\n[Pause.]\nBut perhaps the secret isn't the wine. Perhaps it's when you stop counting.",
        choices: [
          {
            text: "Lo devo far evaporare come?",
            next: "day13_donna_amount",
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma Giorgio dice no vino — perché?",
            next: "day13_donna_amount",
            effects: { relationDelta: 1 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.4
          }
        ]
      },
      day13_donna_amount: {
        speaker: "Donna Rosa",
        text: "Giorgio rifiuta il vino perché segue un'altra lettura. Maria Ferrante ha lasciato scritto qualcosa — ma senza il resto della ricetta non basta capirlo.",
        en: "Giorgio refuses wine because he follows another reading. Maria Ferrante left something written — but without the rest of the recipe it's not enough to understand it.",
        choices: [
          { text: "Interessante.", end: true, effects: { relationDelta: 1, clueHint: "Donna Rosa: there's a secret ingredient in the library documents. Giorgio uses it instead of wine." } }
        ]
      },

      // ── Day 17: wine debate with milk hook ────────────────────────────────
      day17_donna_wine_debate: {
        speaker: "Donna Rosa",
        text: "Il vino lo mettiamo sempre — dopo il soffritto. Il sapore deve svilupparsi. Lo devi far evaporare piano.\n[Abbassa la voce.]\nMa tu hai trovato qualcosa in biblioteca, vero? Sulla ricetta di Maria.",
        en: "We always put the wine — after the soffritto. The flavor must develop. You must make it evaporate slowly.\n[She lowers her voice.]\nBut you found something in the library, didn't you? About Maria's recipe.",
        choices: [
          {
            text: "Sì, l'ho trovata. Ma manca ancora qualcosa.",
            next: "day17_donna_agree",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Posso dirti qualcosa?",
            next: "day17_donna_agree",
            effects: { relationDelta: 1 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          }
        ]
      },
      day17_donna_agree: {
        speaker: "Donna Rosa",
        text: "(Annuisce lentamente.) Latte, sì. Ma quella nota da sola non basta. Maria lasciava tracce, non scorciatoie. Se vuoi capire davvero, devi continuare.",
        en: "(She nods slowly.) Milk, yes. But that note alone is not enough. Maria left traces, not shortcuts. If you want to truly understand, you have to keep going.",
        choices: [
          { text: "Latte... ma non basta.", end: true, effects: { relationDelta: 1, clueHint: "Milk is part of Maria Ferrante's method, but the note is incomplete without the rest of the recipe." } }
        ]
      },

      // ── Day 20: CONFESSION (IMPROVED) ────────────────────────────────────
      day20_donna_confession: {
        speaker: "Donna Rosa",
        text: "[Voce bassa. Guarda intorno.]\nDevo dirti una cosa. Non l'ho detto a nessuno. Nemmeno a Giorgio.",
        en: "[Low voice. She looks around.]\nI have to tell you something. I haven't told anyone. Not even Giorgio.",
        choices: [
          {
            text: "Ho ascoltato.",
            next: "day20_donna_reveal",
            effects: { relationDelta: 1 },
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          },
          {
            text: "Dimmi.",
            next: "day20_donna_reveal",
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day20_donna_reveal: {
        speaker: "Donna Rosa",
        text: "Conoscevo Maria Ferrante. Non solo per la cucina — eravamo amiche. La ricetta… me l'ha data lei. Quella vera. Con il segreto dentro.",
        en: "I knew Maria Ferrante. Not only for cooking — we were friends. The recipe… she gave it to me. The real one. With the secret inside.",
        choices: [
          {
            text: "L'hai tenuta per anni?",
            next: "day20_donna_secret",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma perché non l'hai mostrata?",
            next: "day20_donna_secret",
            effects: { relationDelta: 1 },
            skills: ["connectors", "pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          }
        ]
      },
      day20_donna_secret: {
        speaker: "Donna Rosa",
        text: "Perché Maria l'ha chiesto. \"Non prima del momento giusto.\" Forse adesso è il momento. Non era mai una guerra tra tre ore e sei. Tre ore erano il minimo. Sei, solo nei giorni lunghi, quando la carne era più dura e la pentola piena.",
        en: "Because Maria asked it of me. \"Not before the right moment.\" Perhaps now is the moment. It was never a war between three hours and six. Three hours were the minimum. Six only on long days, when the meat was tougher and the pot was full.",
        choices: [
          {
            text: "L'hai aspettato e ora lo sai?",
            next: "day20_donna_flame",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.7
          },
          {
            text: "Posso vederla?",
            next: "day20_donna_flame",
            effects: { relationDelta: 1 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          }
        ]
      },
      day20_donna_flame: {
        speaker: "Donna Rosa",
        text: "Prima finisci la ricerca. La fiamma, la carne, il brodo. Poi torna da me.",
        en: "First finish the research. The flame, the meat, the broth. Then come back to me.",
        choices: [
          {
            text: "L'ho quasi completata.",
            next: "day20_donna_explain",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "La devo chiarire come?",
            next: "day20_donna_explain",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          }
        ]
      },
      day20_donna_explain: {
        speaker: "Donna Rosa",
        text: "La fiamma deve essere bassa sempre. L'ho seguita per anni. Maria diceva: \"Ascolta il sugo. Quando cambia voce, cambia gesto.\"",
        en: "The flame must always be low. I've followed it for years. Maria used to say: \"Listen to the sauce. When its voice changes, your hands must change.\"",
        choices: [
          {
            text: "L'hai seguita e funziona?",
            end: true,
            effects: { relationDelta: 1, clueHint: "MAJOR: Donna Rosa explained the contradiction. Three hours was the minimum; six only on long, heavy days. Maria judged the ragù by the sauce, not the clock." },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 23: time ──────────────────────────────────────────────────────
      day23_donna_time: {
        speaker: "Donna Rosa",
        text: "Il tempo del ragù? Lo devi rispettare sempre — perché cambia tutto. L'ho visto molte volte.",
        en: "The time of ragù? You must respect it always — because it changes everything. I've seen it many times.",
        choices: [
          {
            text: "L'hai visto e lo sai?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "L'ho capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          }
        ]
      },

      // ── Day 24: resting phase ─────────────────────────────────────────────
      day24_donna_rest: {
        speaker: "Donna Rosa",
        text: "Dopo la cottura? Devi lasciare riposare — perché i sapori si mescolano. Devi aspettare due ore. È necessario.",
        en: "After cooking? You must let it rest — because the flavors mix. You must wait two hours. It's necessary.",
        choices: [
          {
            text: "Devo lasciare riposare quanto?",
            next: "day24_donna_explain",
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma è necessario?",
            next: "day24_donna_explain",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day24_donna_explain: {
        speaker: "Donna Rosa",
        text: "Due ore minimo. Poi la servi con le tagliatelle calde.",
        en: "Two hours minimum. Then you serve it with hot tagliatelle.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 25: pasta confirmation ────────────────────────────────────────
      day25_donna_confirm: {
        speaker: "Donna Rosa",
        text: "Sì, le tagliatelle sono giuste. Le fai dopo il riposo — poi le servi calde. Lo devi fare sempre così.",
        en: "Yes, tagliatelle is right. You make them after resting — then serve them hot. You must always do it this way.",
        choices: [
          {
            text: "Le devo servire ma come?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals", "infinitives", "connectors"],
            grammarAccuracy: 0.9,
            complexity: 1.7
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 26: final ratios ──────────────────────────────────────────────
      day26_donna_ratios: {
        speaker: "Donna Rosa",
        text: "Le misure finali? Le devi bilanciare bene — no, le devi seguire precise. Le ho provate molte volte.",
        en: "The final measurements? You must balance them well — no, you must follow them precisely. I've tried them many times.",
        choices: [
          {
            text: "Le ho provate e funzionano?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences", "pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Bene.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 30: FINALE — Donna Rosa reveals Maria's card ────────────────
      day30_donna_card: {
        speaker: "Donna Rosa",
        text: "[Tira fuori una carta scritta a mano — la ricetta di Maria.]\nEcco. L'ho tenuta per trent'anni. Maria diceva: \"Quando trovi qualcuno che capisce… dagliele.\" Sei tu.",
        en: "[She pulls out a handwritten card — Maria's recipe.]\nHere. I've kept it for thirty years. Maria used to say: \"When you find someone who understands… give it to them.\" That's you.",
        choices: [
          {
            text: "L'hai tenuta cosi a lungo?",
            end: true,
            effects: {
              relationDelta: 2,
              clueHint: "Donna Rosa finally reveals Maria Ferrante's handwritten recipe card in the piazza finale."
            },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Posso leggerla ad alta voce?",
            end: true,
            effects: { relationDelta: 2 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          }
        ]
      }
    }
  },

  giorgio_neri: {
    npcName: "Giorgio Neri",
    start: "start",
    dayStarts: {
      5: "day5_giorgio_why",
      9: "day9_giorgio_two_ragus",
      12: "day12_giorgio_cut",
      14: "day14_giorgio_flame",
      15: "day15_giorgio_intercept",
      16: "day16_giorgio_soffritto_order",
      20: "day20_giorgio_flame",
      21: "day21_giorgio_pot",
      26: "day26_giorgio_ratios",
      30: "day30_giorgio_finale"
    },
    nodes: {
      start: {
        speaker: "Giorgio",
        text: "Il ragù non si discute. Si mangia. Non lo impari a forza di domande. Lo impari con gli anni.",
        en: "Ragù is not discussed. It's eaten. You can't learn it from questions. You learn it from years of experience.",
        choices: [
          {
            text: "Capisco. Ma quanto tempo ci vuole, esattamente?",
            next: "time_reveal",
            effects: { relationDelta: 0 }
          },
          {
            text: "Ho sentito che bastano tre ore.",
            next: "three_hours_challenge",
            effects: { relationDelta: -1 }
          }
        ]
      },
      time_reveal: {
        speaker: "Giorgio",
        text: "Sei ore minimo. Sul fuoco più basso che hai. Chi ti dice meno non ha mai fatto un ragù vero in vita sua.",
        en: "Six hours minimum. On the lowest flame you have. Anyone who tells you less has never made a real ragù in their life.",
        choices: [
          {
            text: "Sei sicuro? Ho sentito tre ore da qualcuno.",
            next: "three_hours_challenge",
            effects: { relationDelta: 0 }
          },
          {
            text: "Capito. Sei ore sul fuoco basso.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Giorgio insists: six hours, lowest flame. This contradicts Donna Rosa's three hours." }
          }
        ]
      },
      three_hours_challenge: {
        speaker: "Giorgio",
        text: "Tre ore? (ride) Quello è brodo, non ragù. Dimmi chi te l'ha detto e ti spiego perché sbaglia.",
        en: "Three hours? (laughs) That's soup, not ragù. Tell me who said that and I'll tell you why they're wrong.",
        choices: [
          {
            text: "Donna Rosa, in piazza.",
            next: "on_donna_rosa",
            effects: { relationDelta: 0 }
          },
          {
            text: "Non ricordo chi fosse.",
            end: true,
            effects: { relationDelta: 0, clueHint: "Giorgio is adamant: six hours. He reacted strongly to the mention of three hours." }
          }
        ]
      },
      on_donna_rosa: {
        speaker: "Giorgio",
        text: "(La sua espressione si chiude.) Donna Rosa vuole bene a tutti. Ma ha imparato da una tradizione diversa. Non tutto quello che passa di mano in mano è ancora giusto.",
        en: "(His expression closes off.) Donna Rosa means well. But she learned from a different tradition. Not everything passed down is still correct.",
        choices: [
          {
            text: "Una tradizione diversa... da dove?",
            end: true,
            effects: { relationDelta: 1, clueHint: "Giorgio shut down when Donna Rosa was mentioned. There's history between them." }
          }
        ]
      },

      // ── Day 5: connectors / cause ─────────────────────────────────────────
      day5_giorgio_why: {
        speaker: "Giorgio",
        text: "Sei ore, perché il sapore cambia. Non è tre ore. No, no.",
        en: "Six hours, because the flavor changes. It's not three hours. No, no.",
        choices: [
          {
            text: "Capisco.",
            next: "day5_giorgio_but",
            effects: { relationDelta: 0 },
            skillTags: ["S7"],
            xp: 5,
            xpMode: "comprehension",
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.2
          },
          {
            text: "Sapore?",
            next: "day5_giorgio_but",
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 3,
            xpMode: "comprehension",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day5_giorgio_but: {
        speaker: "Giorgio",
        text: "Il sapore si costruisce nel tempo. Non c'è modo di accelerare. La fretta uccide il sugo.",
        en: "Flavor builds over time. There's no way to rush it. Haste kills the sauce.",
        choices: [
          {
            text: "Ma Donna Rosa dice tre ore.",
            end: true,
            effects: { relationDelta: -1, clueHint: "Giorgio is immovable on six hours. Mentions of three hours or Donna Rosa show tension." },
            skillTags: ["S7"],
            xp: 10,
            xpMode: "production",
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.4
          },
          {
            text: "Donna Rosa sbaglia?",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 6,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.1
          }
        ]
      },

      // ── Day 9: two ragùs ──────────────────────────────────────────────────
      day9_giorgio_two_ragus: {
        speaker: "Giorgio",
        text: "Due ragù? Sì, li ho visti entrambi. Uno è antico. L'altro è moderno. Li ho cucinati entrambi.",
        en: "Two ragùs? Yes, I've seen both. One is ancient. The other is modern. I've cooked both.",
        choices: [
          {
            text: "Li hai provati?",
            next: "day9_giorgio_difference",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma quale è migliore?",
            next: "day9_giorgio_difference",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day9_giorgio_difference: {
        speaker: "Giorgio",
        text: "Il moderno è il migliore. Ma non posso dirlo a tutti. (Si ferma.) Non chiedere perché.",
        en: "The modern one is the best. But I can't say that to everyone. (Stops.) Don't ask why.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1, clueHint: "Giorgio privately believes the modern ragù (Maria's) is superior, but won't say it publicly." } }
        ]
      },

      // ── Day 12: meat cut ──────────────────────────────────────────────────
      day12_giorgio_cut: {
        speaker: "Giorgio",
        text: "La carne la taglio grossa. La lascio intera. Perché rilascia sapore lentamente — l'ho imparato da mio padre.",
        en: "I cut the meat thick. I leave it whole. Because it releases flavor slowly — I learned it from my father.",
        choices: [
          {
            text: "L'hai imparato e lo insegni?",
            next: "day12_giorgio_reason",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Lo insegni a me?",
            next: "day12_giorgio_reason",
            effects: { relationDelta: 1 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day12_giorgio_reason: {
        speaker: "Giorgio",
        text: "L'insegno a chi capisce. Forse un giorno.",
        en: "I teach it to those who understand. Maybe one day.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 14: flame and pot ─────────────────────────────────────────────
      day14_giorgio_flame: {
        speaker: "Giorgio",
        text: "La fiamma deve essere bassa. La devi controllare sempre — e la pentola deve essere pesante. La devi scegliere bene.",
        en: "The flame must be low. You must always control it — and the pot must be heavy. You must choose it well.",
        choices: [
          {
            text: "La devo controllare ma come?",
            next: "day14_giorgio_pot",
            effects: { relationDelta: 1 },
            skills: ["connectors", "modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "La posso regolare?",
            next: "day14_giorgio_pot",
            effects: { relationDelta: 0 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          }
        ]
      },
      day14_giorgio_pot: {
        speaker: "Giorgio",
        text: "Sì, la puoi regolare. Ma la pentola pesante è fondamentale — mantiene il calore uniforme.",
        en: "Yes, you can adjust it. But the heavy pot is fundamental — it keeps the heat even.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 15: CONFRONTATION (NEW DRAMATIC BEAT) ─────────────────────────
      day15_giorgio_intercept: {
        speaker: "Giorgio",
        text: "[Ti ferma per un braccio in piazza.]\nHo sentito che parli con Lucia. Di sua nonna. Di Maria.",
        en: "[Stops you by the arm in the piazza.]\nI've heard you're talking to Lucia. About her grandmother. About Maria.",
        choices: [
          {
            text: "Sì, ho parlato con lei.",
            next: "day15_giorgio_warning",
            effects: { relationDelta: -1 },
            skills: ["pastTense"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Sì, ma perché?",
            next: "day15_giorgio_warning",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day15_giorgio_warning: {
        speaker: "Giorgio",
        text: "Non toccare quella storia. Non ti appartiene.",
        en: "Don't touch that story. It doesn't belong to you.",
        choices: [
          {
            text: "Posso sapere perché?",
            next: "day15_giorgio_crack",
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Ma è importante per la ricetta.",
            next: "day15_giorgio_crack",
            effects: { relationDelta: 1 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day15_giorgio_crack: {
        speaker: "Giorgio",
        text: "[Pausa lunga. Abbassa la voce.]\nMaria Ferrante… era la migliore. Io lo so. L'ho vista cucinare una volta sola. Non dimentico.",
        en: "[Long pause. He lowers his voice.]\nMaria Ferrante… she was the best. I know it. I saw her cook, once. I don't forget.",
        choices: [
          {
            text: "L'hai vista e non l'hai detto?",
            next: "day15_giorgio_retreat",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Cosa hai visto?",
            next: "day15_giorgio_retreat",
            effects: { relationDelta: 1 },
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day15_giorgio_retreat: {
        speaker: "Giorgio",
        text: "Basta. Devo andare.",
        en: "Enough. I have to go.",
        choices: [
          {
            text: "Posso chiederti ancora?",
            end: true,
            effects: { relationDelta: 0, clueHint: "TURNING POINT: Giorgio admitted he watched Maria cook once — and never forgot. He has never told anyone. There is deep personal grief here." },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 0, clueHint: "TURNING POINT: Giorgio admitted watching Maria cook once. He carries something unresolved." }
          }
        ]
      },

      // ── Day 16: soffritto order ───────────────────────────────────────────
      day16_giorgio_soffritto_order: {
        speaker: "Giorgio",
        text: "L'ordine del soffritto? Prima cipolla, poi carota, poi sedano. Li metto sempre così — li ho cucinati così per anni.",
        en: "The order of soffritto? First onion, then carrot, then celery. I always put them like this — I've cooked them like this for years.",
        choices: [
          {
            text: "Li hai provati diversi e ti piace questo?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Ma Lucia dice lo stesso.",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },

      // ── Day 20: flame confirmation ────────────────────────────────────────
      day20_giorgio_flame: {
        speaker: "Giorgio",
        text: "La fiamma bassa? Sì, la devi controllare sempre. Non la devi regolare ogni minuto — la devi impostare e lasciare.",
        en: "The low flame? Yes, you must always control it. You don't adjust it every minute — you set it and leave it.",
        choices: [
          {
            text: "La devo controllare come?",
            next: "day20_giorgio_confirm",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Ma è difficile.",
            next: "day20_giorgio_confirm",
            effects: { relationDelta: 0 },
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day20_giorgio_confirm: {
        speaker: "Giorgio",
        text: "No, la devi regolare piano — una volta all'inizio. L'ho fatto molte volte.",
        en: "No, you adjust it slowly — once at the beginning. I've done it many times.",
        choices: [
          { text: "L'hai fatto e sai come?", end: true, effects: { relationDelta: 1 }, skills: ["pastTense", "pronouns"], grammarAccuracy: 0.9, complexity: 1.5 },
          { text: "Bene.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 21: heavy pot ─────────────────────────────────────────────────
      day21_giorgio_pot: {
        speaker: "Giorgio",
        text: "La pentola giusta? La devi scegliere pesante — perché mantiene il calore. La devi usare sempre.",
        en: "The right pot? You must choose a heavy one — because it maintains the heat. You must always use it.",
        choices: [
          {
            text: "La devo usare ma come?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Devo comprarla ora?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          }
        ]
      },

      // ── Day 26: ratios ────────────────────────────────────────────────────
      day26_giorgio_ratios: {
        speaker: "Giorgio",
        text: "Le proporzioni? Le devi rispettare sempre — le ho provate per anni. Sì, le devi scrivere. Poi le porti a Conti.",
        en: "The proportions? You must respect them always — I've tested them for years. Yes, you must write them down. Then bring them to Conti.",
        choices: [
          {
            text: "Le devo portare ma dove?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },

      // ── Day 30: FINALE — Giorgio's first smile ────────────────────────────
      day30_giorgio_finale: {
        speaker: "Giorgio",
        text: "[Primo sorriso. Finalmente.]\nMaria aveva ragione. Io ho preso il giorno più lungo e l'ho scambiato per regola. Donna Rosa ha tenuto il minimo. Maria guardava il fuoco, non il numero.",
        en: "[First smile. Finally.]\nMaria was right. I took the longest day and mistook it for the rule. Donna Rosa kept the minimum. Maria watched the flame, not the number.",
        choices: [
          {
            text: "L'hai capito ora anche tu?",
            next: "day30_giorgio_milan",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Capito.",
            next: "day30_giorgio_milan",
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day30_giorgio_milan: {
        speaker: "Giorgio",
        text: "A Milano ci aspetta qualcosa di diverso. La dobbiamo scoprire insieme. Ma adesso — riposa.",
        en: "Something different awaits us in Milan. We must discover it together. But for now — rest.",
        choices: [
          {
            text: "La dobbiamo scoprire ma quando?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["connectors", "modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Grazie, Giorgio.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      }
    }
  },

  // ── Day 3 NPCs ──────────────────────────────────────────────────────────
  prof_conti: {
    npcName: "Prof. Conti",
    start: "start",
    dayStarts: {
      6: "day6_modal_want",
      10: "day10_conti_faded",
      18: "day18_conti_verify",
      27: "day27_conti_notebook",
      29: "day29_conti_approval"
    },
    nodes: {
      start: {
        speaker: "Prof. Conti",
        text: "Ah, sei il nuovo investigatore culinario di cui tutti parlano. Le ricette antiche spesso nascondono varianti dialettali locali che i libri moderni non riportano.",
        en: "Ah, you must be the new culinary investigator everyone is talking about. Ancient recipes often hide regional dialectical variations you won't find in modern books.",
        choices: [
          {
            text: "Esiste davvero una ricetta originale scritta?",
            next: "document_exists",
            effects: { relationDelta: 1 }
          },
          {
            text: "Dove potrei trovare documenti storici sulla cucina bolognese?",
            next: "archive_hint",
            effects: { relationDelta: 0 }
          }
        ]
      },
      document_exists: {
        speaker: "Prof. Conti",
        text: "Posso confermarlo. Un documento scritto, fine Ottocento, nell'archivio storico della Biblioteca Salaborsa. Però l'archivio è chiuso al pubblico. Ci vuole un accesso speciale.",
        en: "I can confirm it. A written document from the late 1800s, in the historical archive of the Biblioteca Salaborsa. But the archive is closed to the public. Special access is needed.",
        choices: [
          {
            text: "Come si ottiene l'accesso?",
            next: "access_mystery",
            effects: { relationDelta: 1, clueHint: "The original recipe exists. It's in the Salaborsa library archive — but it's locked." }
          },
          {
            text: "Chi ha già visto questo documento?",
            next: "who_saw_it",
            effects: { relationDelta: 1 }
          }
        ]
      },
      archive_hint: {
        speaker: "Prof. Conti",
        text: "La Biblioteca Salaborsa ha un archivio storico che la maggior parte delle persone non sa nemmeno che esiste. Io partirei da lì.",
        en: "The Biblioteca Salaborsa has a historical archive that most people don't even know exists. That's where I'd start.",
        choices: [
          {
            text: "Posso accedervi?",
            next: "document_exists",
            effects: { relationDelta: 0 }
          }
        ]
      },
      access_mystery: {
        speaker: "Prof. Conti",
        text: "Io avevo l'accesso una volta. Le cose sono cambiate. Forse qualcuno alla biblioteca può ancora farti entrare. Hai parlato con Elena Bianchi?",
        en: "I had access once. Things have changed. Maybe someone at the library can still get you in. Have you spoken with Elena Bianchi?",
        choices: [
          {
            text: "No — chi è Elena Bianchi?",
            end: true,
            effects: { relationDelta: 1, clueHint: "Prof. Conti mentions Elena Bianchi. She may have library access. Find her at the Osteria." }
          }
        ]
      },
      who_saw_it: {
        speaker: "Prof. Conti",
        text: "Pochissimi. Io l'ho visto una volta, anni fa. E Giorgio Neri — anche lui era presente. Anche se non l'ha mai ammesso pubblicamente.",
        en: "Very few people. I saw it once, years ago. And Giorgio Neri — he was there too. Though he's never admitted it publicly.",
        choices: [
          {
            text: "Giorgio Neri... di nuovo lui.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Giorgio Neri has seen the original document. He has been hiding this connection." }
          }
        ]
      },

      // ── Day 6: modal verbs ────────────────────────────────────────────────
      day6_modal_want: {
        speaker: "Prof. Conti",
        text: "Vuoi vedere il documento? Non puoi entrare da solo — devi parlare con Elena.",
        en: "Do you want to see the document? You can't enter alone — you must talk to Elena.",
        choices: [
          {
            text: "Sì, voglio vederlo.",
            next: "day6_modal_must",
            effects: { relationDelta: 1 },
            skillTags: ["S9", "S10"],
            xp: 12,
            xpMode: "production",
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Posso entrare?",
            next: "day6_modal_must",
            effects: { relationDelta: 0 },
            skillTags: ["S9"],
            xp: 10,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Sì, voglio.",
            next: "day6_modal_retry_prompt",
            effects: { relationDelta: 0 },
            skillTags: ["S9", "S10"],
            xp: 12,
            xpMode: "production",
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.4,
            complexity: 1.0
          }
        ]
      },
      day6_modal_retry_prompt: {
        speaker: "Prof. Conti",
        text: "Non capisco. Intendi dire: 'Sì, voglio vederlo?'",
        en: "I don't understand. Do you mean: 'Yes, I want to see it?'",
        choices: [
          {
            text: "Sì, voglio vederlo.",
            next: "day6_modal_must",
            effects: { relationDelta: 1 },
            skillTags: ["S9", "S10"],
            xp: 12,
            xpMode: "production",
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Posso entrare?",
            next: "day6_modal_must",
            effects: { relationDelta: 0 },
            skillTags: ["S9"],
            xp: 10,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          }
        ]
      },
      day6_modal_must: {
        speaker: "Prof. Conti",
        text: "Devi andare da Elena. Lei ha la parola chiave.",
        en: "You must go to Elena. She has the keyword.",
        choices: [
          {
            text: "Devo andare da Elena?",
            end: true,
            effects: { relationDelta: 1 },
            skillTags: ["S9"],
            xp: 12,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Capito.",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S9"],
            xp: 3,
            xpMode: "comprehension",
            skills: ["modals"],
            grammarAccuracy: 0.85,
            complexity: 1.0
          }
        ]
      },

      // ── Day 10: milk note (MILK MYSTERY CONFIRMED) ────────────────────────
      day10_conti_faded: {
        speaker: "Prof. Conti",
        text: "La riga sbiadita? La posso leggere meglio con la lente. C'è una nota sul latte — ma il testo non è chiaro.",
        en: "The faded line? I can read it better with the lens. There's a note about milk — but the text isn't clear.",
        choices: [
          {
            text: "La puoi leggere ora?",
            next: "day10_conti_reveal",
            effects: { relationDelta: 1 },
            skillTags: ["S8", "S9"],
            xp: 15,
            xpMode: "production",
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Devo aspettare?",
            next: "day10_conti_reveal",
            effects: { relationDelta: 0 },
            skillTags: ["S9"],
            xp: 10,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.2
          },
          {
            text: "Leggere ora?",
            next: "day10_conti_retry_prompt",
            effects: { relationDelta: 0 },
            skillTags: ["S8", "S9"],
            xp: 15,
            xpMode: "production",
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.4,
            complexity: 1.0
          }
        ]
      },
      day10_conti_retry_prompt: {
        speaker: "Prof. Conti",
        text: "Non capisco. Intendi dire: 'La puoi leggere ora?'",
        en: "I don't understand. Do you mean: 'Can you read it now?'",
        choices: [
          {
            text: "La puoi leggere ora?",
            next: "day10_conti_reveal",
            effects: { relationDelta: 1 },
            skillTags: ["S8", "S9"],
            xp: 15,
            xpMode: "production",
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Devo aspettare?",
            next: "day10_conti_reveal",
            effects: { relationDelta: 0 },
            skillTags: ["S9"],
            xp: 10,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.2
          }
        ]
      },
      day10_conti_reveal: {
        speaker: "Prof. Conti",
        text: "Dice: \"aggiungi latte fresco\". Non vino. Latte.\n[Ti guarda.]\nCapisci cosa significa? Maria Ferrante parlava di latte, non solo di vino. Ma questo non basta ancora.",
        en: "It says: \"add fresh milk\". Not wine. Milk.\n[He looks at you.]\nDo you understand what this means? Maria Ferrante was talking about milk, not only wine. But this still isn't enough.",
        choices: [
          {
            text: "Perché è strano? Lo devo capire.",
            end: true,
            effects: { relationDelta: 1, clueHint: "The archive mentions fresh milk. It's an important clue, but Prof. Conti warns that the note alone does not explain the whole method." },
            skills: ["connectors", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Non l'ho mai sentito.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Fresh milk appears in the faded archive line. The clue is real, but its meaning is still incomplete." },
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },

      // ── Day 18: marginal note ─────────────────────────────────────────────
      day18_conti_verify: {
        speaker: "Prof. Conti",
        text: "La nota marginale? La posso leggere meglio. Dice qualcosa sul riposo — ma c'è anche un'altra riga quasi sparita.",
        en: "The marginal note? I can read it better. It says something about resting — but there's another line that's almost gone.",
        choices: [
          {
            text: "La puoi leggere ora?",
            next: "day18_conti_reveal",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Devo aspettare?",
            next: "day18_conti_reveal",
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.2
          }
        ]
      },
      day18_conti_reveal: {
        speaker: "Prof. Conti",
        text: "Dice: \"lascia riposare due ore\". E accanto c'è una frase quasi persa: \"non guardare l'orologio, guarda il sugo.\"",
        en: "It says: \"let rest two hours\". And beside it there's an almost lost line: \"don't watch the clock, watch the sauce.\"",
        choices: [
          {
            text: "La devo seguire ma perché?",
            end: true,
            effects: { relationDelta: 1, clueHint: "The marginal note adds a second instruction: don't watch the clock, watch the sauce. Maria's method was guided by judgment, not just numbers." },
            skills: ["modals", "infinitives", "connectors"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Due ore?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },

      // ── Day 27: Ferrante notebook ─────────────────────────────────────────
      day27_conti_notebook: {
        speaker: "Prof. Conti",
        text: "Il quaderno Ferrante? L'ho trovato finalmente — lo tengo in biblioteca. Lo devi leggere subito.",
        en: "The Ferrante notebook? I finally found it — I keep it at the library. You must read it immediately.",
        choices: [
          {
            text: "L'hai trovato dove?",
            next: "day27_conti_reveal",
            effects: { relationDelta: 1 },
            skills: ["pastTense"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          },
          {
            text: "Lo posso vedere?",
            next: "day27_conti_reveal",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          }
        ]
      },
      day27_conti_reveal: {
        speaker: "Prof. Conti",
        text: "In un archivio secondario — non l'avevo cercato lì. Elena lo aiuta a leggere. Andate insieme.",
        en: "In a secondary archive — I hadn't looked there. Elena helps read it. Go together.",
        choices: [
          { text: "Devo venire ora?", end: true, effects: { relationDelta: 1 }, skills: ["modals"], grammarAccuracy: 0.9, complexity: 1.3 }
        ]
      },

      // ── Day 29: final approval ────────────────────────────────────────────
      day29_conti_approval: {
        speaker: "Prof. Conti",
        text: "L'approvazione finale? La dobbiamo ricevere tutti insieme — organizza tu.",
        en: "The final approval? We must receive it all together — you organise it.",
        choices: [
          {
            text: "La dobbiamo ricevere ma dove?",
            next: "day29_conti_final",
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Devo organizzare?",
            next: "day29_conti_final",
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          }
        ]
      },
      day29_conti_final: {
        speaker: "Prof. Conti",
        text: "Sì, la organizzi tu. In piazza Maggiore. Poi andiamo a Milano.",
        en: "Yes, you organise it. In Piazza Maggiore. Then we go to Milan.",
        choices: [
          {
            text: "Milano?",
            end: true,
            effects: { relationDelta: 1, clueHint: "Chapter one nearing its end. Final assembly in Piazza Maggiore. Milan awaits after." },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      }
    }
  },

  elena_bianchi: {
    npcName: "Elena Bianchi",
    start: "start",
    dayStarts: {
      6: "day6_elena_modal",
      7: "day7_elena_combine",
      10: "day10_elena_milk",
      18: "day18_elena_marginal",
      19: "day19_elena_synthesis",
      22: "day22_elena_archive",
      23: "day23_elena_time",
      27: "day27_elena_help",
      29: "day29_elena_final",
      30: "day30_end_scene"
    },
    nodes: {
      start: {
        speaker: "Elena",
        text: "Hai già provato a cercare vecchi appunti in biblioteca? Ci sono cose in quell'archivio che cambierebbero la tua indagine completamente.",
        en: "Have you tried looking at old documents in the library? There are things in that archive that would change your investigation completely.",
        choices: [
          {
            text: "Il Prof. Conti mi ha detto che serve un accesso speciale.",
            next: "access_offer",
            effects: { relationDelta: 1 }
          },
          {
            text: "Ottima idea. Ci vado subito.",
            end: true,
            effects: { relationDelta: 0 }
          }
        ]
      },
      access_offer: {
        speaker: "Elena",
        text: "Conti ti ha parlato? Allora sei più avanti di quanto pensassi. Torna da me quando sai esattamente cosa cerchi. L'archivio non rivela i suoi segreti a chi non è pronto.",
        en: "Conti told you? Then you're further along than I thought. Come back when you know exactly what you're looking for. The archive doesn't give up its secrets to the unprepared.",
        choices: [
          {
            text: "Cerco la ricetta originale del ragù bolognese.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Elena Bianchi may be the key to the library archive. She's watching your progress." }
          }
        ]
      },

      // ── Day 6: modals ─────────────────────────────────────────────────────
      day6_elena_modal: {
        speaker: "Elena",
        text: "Posso aiutarti… ma devi sapere cosa cerchi. Quale parola chiave? Sempre la parola chiave.",
        en: "I can help you… but you must know what you're looking for. What keyword? Always the keyword.",
        choices: [
          {
            text: "Voglio la ricetta.",
            next: "day6_elena_require",
            effects: { relationDelta: 1 },
            skillTags: ["S9"],
            xp: 10,
            xpMode: "production",
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.3
          },
          {
            text: "Non sono sicuro.",
            next: "day6_elena_require",
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 6,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day6_elena_require: {
        speaker: "Elena",
        text: "La parola chiave apre il fascicolo. Vai a chiedere — qualcuno al mercato sa qualcosa.",
        en: "The keyword opens the dossier. Go and ask — someone at the market knows something.",
        choices: [
          {
            text: "Quale parola, ma dove?",
            end: true,
            effects: { relationDelta: 1 },
            skillTags: ["S7"],
            xp: 12,
            xpMode: "production",
            skills: ["connectors"],
            grammarAccuracy: 0.85,
            complexity: 1.4
          },
          {
            text: "Quale parola?",
            end: true,
            effects: { relationDelta: 0 },
            skillTags: ["S5"],
            xp: 8,
            xpMode: "production",
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.1
          }
        ]
      },

      // ── Day 7: combining sentences / keyword reveal ───────────────────────
      day7_elena_combine: {
        speaker: "Elena",
        text: "Hai parlato con Conti? Buono. La parola è… \"Ferrante\".",
        en: "Did you talk to Conti? Good. The word is… \"Ferrante\".",
        choices: [
          {
            text: "Sì, ho parlato con lui e voglio entrare.",
            next: "day7_elena_keyword",
            effects: { relationDelta: 1 },
            skillTags: ["S7", "S9"],
            xp: 15,
            xpMode: "production",
            skills: ["connectors", "pastTense", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.7
          },
          {
            text: "No, ma voglio parlare con lui.",
            next: "day7_elena_keyword",
            effects: { relationDelta: 0 },
            skillTags: ["S7", "S6"],
            xp: 12,
            xpMode: "production",
            skills: ["connectors", "modals"],
            grammarAccuracy: 0.85,
            complexity: 1.5
          }
        ]
      },
      day7_elena_keyword: {
        speaker: "Elena",
        text: "Con la parola \"Ferrante\" possiamo aprire il secondo fascicolo. Vai da Conti.",
        en: "With the word \"Ferrante\" we can open the second dossier. Go to Conti.",
        choices: [
          { text: "Ho capito!", end: true, effects: { relationDelta: 1, clueHint: "KEYWORD: \"Ferrante\" is the archive access word. The second dossier can now be opened." }, skillTags: ["S6"], xp: 5, xpMode: "comprehension", skills: ["pastTense"], grammarAccuracy: 0.85, complexity: 1.0 }
        ]
      },

      // ── Day 10: second dossier / milk note ───────────────────────────────
      day10_elena_milk: {
        speaker: "Elena",
        text: "Un secondo fascicolo? Sì, l'ho trovato — ma è difficile da leggere. C'è una nota sul latte — il testo è sbiadito.",
        en: "A second dossier? Yes, I found it — but it's hard to read. There's a note about milk — the text is faded.",
        choices: [
          {
            text: "Perché è difficile? Lo puoi leggere?",
            next: "day10_elena_note",
            effects: { relationDelta: 1 },
            skills: ["connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Latte nel ragù?",
            next: "day10_elena_note",
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day10_elena_note: {
        speaker: "Elena",
        text: "Il testo è sbiadito — Conti può leggerlo meglio. Vai subito da lui.",
        en: "The text is faded — Conti can read it better. Go to him immediately.",
        choices: [
          {
            text: "Lo puoi decifrare tu?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["pronouns", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Vado da Conti.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      },

      // ── Day 18: marginal note ─────────────────────────────────────────────
      day18_elena_marginal: {
        speaker: "Elena",
        text: "Una nota marginale? Sì, l'ho trovata — ma è difficile da leggere. Dice qualcosa sul riposo. La devi leggere con Conti.",
        en: "A marginal note? Yes, I found it — but it's hard to read. It says something about resting. You must read it with Conti.",
        choices: [
          {
            text: "L'ho trovata ma la puoi leggere?",
            next: "day18_elena_note",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.8
          },
          {
            text: "La puoi decifrare?",
            next: "day18_elena_note",
            effects: { relationDelta: 1 },
            skills: ["pronouns"],
            grammarAccuracy: 0.85,
            complexity: 1.3
          }
        ]
      },
      day18_elena_note: {
        speaker: "Elena",
        text: "La devo leggere con Conti — da solo non riesco. Andiamo insieme.",
        en: "I need to read it with Conti — I can't manage alone. Let's go together.",
        choices: [
          {
            text: "La devo leggere ma quando?",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives", "connectors"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Devo andare ora?",
            end: true,
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.2
          }
        ]
      },

      // ── Day 19: synthesis — almost done ──────────────────────────────────
      day19_elena_synthesis: {
        speaker: "Elena",
        text: "Quasi finito! La ricetta è quasi completa — manca la verifica finale. La devi fare con tutti.",
        en: "Almost finished! The recipe is almost complete — the final verification is missing. You must do it with everyone.",
        choices: [
          {
            text: "La devo fare come?",
            next: "day19_elena_verify",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Cosa manca?",
            next: "day19_elena_verify",
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day19_elena_verify: {
        speaker: "Elena",
        text: "Parla con Marco, Lucia e Donna Rosa — poi torna da me. L'ultima firma è la tua.",
        en: "Talk to Marco, Lucia and Donna Rosa — then come back to me. The last signature is yours.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 22: visit archive again ──────────────────────────────────────
      day22_elena_archive: {
        speaker: "Elena",
        text: "L'archivio ha ancora le risposte. Lo devi visitare con Conti — lo apre lui per te.",
        en: "The archive still has answers. You must visit it with Conti — he opens it for you.",
        choices: [
          {
            text: "Lo devo visitare quando?",
            next: "day22_elena_help",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Devo andare ora?",
            next: "day22_elena_help",
            effects: { relationDelta: 0 },
            skills: ["modals"],
            grammarAccuracy: 0.9,
            complexity: 1.2
          }
        ]
      },
      day22_elena_help: {
        speaker: "Elena",
        text: "Sì, lo devi vedere subito.",
        en: "Yes, you must see it immediately.",
        choices: [
          { text: "Vado.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 23: time and comparison ───────────────────────────────────────
      day23_elena_time: {
        speaker: "Elena",
        text: "Il tempo è la chiave — lo devi controllare sempre. Nel quaderno non ci sono solo numeri. C'è scritto come guardare il colore. Lo confronti con Donna Rosa.",
        en: "Time is the key — you must always control it. The notebook doesn't contain only numbers. It says how to watch the color. Compare it with Donna Rosa.",
        choices: [
          {
            text: "L'ho controllato ma è difficile.",
            next: "day23_elena_compare",
            effects: { relationDelta: 0 },
            skills: ["pastTense", "connectors", "pronouns"],
            grammarAccuracy: 0.9,
            complexity: 1.6
          },
          {
            text: "Lo devo controllare come?",
            next: "day23_elena_compare",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          }
        ]
      },
      day23_elena_compare: {
        speaker: "Elena",
        text: "Donna Rosa ti spiega. Lei ha l'esperienza — e sa come i numeri cambiano quando cambia il sugo.",
        en: "Donna Rosa will explain. She has the experience — and she knows how numbers change when the sauce changes.",
        choices: [
          { text: "Vado da Donna Rosa.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 27: help with notebook ────────────────────────────────────────
      day27_elena_help: {
        speaker: "Elena",
        text: "Il quaderno? Lo aiuto a leggere — dice le formule finali. Le devi copiare bene.",
        en: "The notebook? I help read it — it says the final formulas. You must copy them carefully.",
        choices: [
          {
            text: "Lo puoi leggere ora?",
            next: "day27_elena_explain",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          },
          {
            text: "Cosa dice?",
            next: "day27_elena_explain",
            effects: { relationDelta: 0 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      },
      day27_elena_explain: {
        speaker: "Elena",
        text: "Dice le formule finali — carne, soffritto, latte, tempo. Ma non sono formule fredde. Parlano di odore, colore e pazienza.",
        en: "It gives the final formulas — meat, soffritto, milk, time. But they are not cold formulas. They speak about smell, color, and patience.",
        choices: [
          { text: "Le devo copiare come?", end: true, effects: { relationDelta: 1 }, skills: ["basicSentences", "modals", "infinitives"], grammarAccuracy: 0.9, complexity: 1.5 }
        ]
      },

      // ── Day 29: delivery ─────────────────────────────────────────────────
      day29_elena_final: {
        speaker: "Elena",
        text: "Capitolo Bologna quasi chiuso. Lo dobbiamo consegnare ora — a Donna Rosa, Marco e Giorgio.",
        en: "Bologna chapter almost closed. We must deliver it now — to Donna Rosa, Marco and Giorgio.",
        choices: [
          {
            text: "L'ho finito ma lo devo controllare?",
            next: "day29_elena_explain",
            effects: { relationDelta: 1 },
            skills: ["pastTense", "connectors", "pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.8
          },
          {
            text: "Lo posso consegnare dove?",
            next: "day29_elena_explain",
            effects: { relationDelta: 1 },
            skills: ["pronouns", "modals"],
            grammarAccuracy: 0.9,
            complexity: 1.4
          }
        ]
      },
      day29_elena_explain: {
        speaker: "Elena",
        text: "In piazza. Non devono solo approvare. Devono riconoscerla. Solo allora il capitolo si chiude.",
        en: "In the piazza. They do not only have to approve it. They have to recognize it. Only then does the chapter close.",
        choices: [
          { text: "Capito.", end: true, effects: { relationDelta: 1 } }
        ]
      },

      // ── Day 30: FINALE — Elena closes the dossier ─────────────────────────
      day30_end_scene: {
        speaker: "Elena",
        text: "[Elena scrive l'ultima pagina del fascicolo. Lo chiude.]\nCapitolo uno: Bologna.\nLa ricetta del ragù Ferrante.\nRitrovata.",
        en: "[Elena writes the last page of the dossier. She closes it.]\nChapter one: Bologna.\nThe Ferrante ragù recipe.\nRecovered.",
        choices: [
          {
            text: "Devo ricordare tutto.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["modals", "infinitives"],
            grammarAccuracy: 0.9,
            complexity: 1.5
          },
          {
            text: "Grazie a tutti.",
            end: true,
            effects: { relationDelta: 1 },
            skills: ["basicSentences"],
            grammarAccuracy: 0.8,
            complexity: 1.0
          }
        ]
      }
    }
  }
};

enrichDialogueMetadata(DIALOGUES);
