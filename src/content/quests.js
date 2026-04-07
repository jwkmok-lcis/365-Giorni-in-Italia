// quests.js – quest definitions and recipe clue fragments for Days 1–3.

export const CLUES = {
  clue_pane_del_ragu: {
    id: "clue_pane_del_ragu",
    title: "Il Pane del Ragù",
    text: "Marco abbassa la voce: \"Un vero bolognese capisce il ragù attraverso il pane locale. Non per mangiarlo — per leggere la cultura dietro.\"",
    source: "Marco Verdini"
  },
  clue_soffritto_base: {
    id: "clue_soffritto_base",
    title: "La Base del Ragù",
    text: "Lucia è sicura: \"Cipolla, carota, sedano — sempre tutti e tre. Chi ne omette uno non fa ragù bolognese. Fa qualcos'altro.\"",
    source: "Lucia Ferrante"
  },
  clue_tempo_contraddittorio: {
    id: "clue_tempo_contraddittorio",
    title: "Una Contraddizione",
    text: "Donna Rosa dice tre ore minimo. Giorgio insiste su sei. Entrambi sembrano sinceri — e nessuno cede. Qualcosa non torna.",
    source: "Donna Rosa / Giorgio Neri"
  },
  clue_archivio_chiuso: {
    id: "clue_archivio_chiuso",
    title: "L'Archivio Segreto",
    text: "Il Prof. Conti conferma: esiste un documento originale alla Biblioteca Salaborsa. L'archivio storico è chiuso al pubblico. Ci vuole qualcuno con l'accesso giusto.",
    source: "Prof. Conti"
  }
};

// Quests are declared in progression order.
// QuestSystem activates them sequentially as each is completed.
export const QUESTS = {
  q_day1_market_whispers: {
    id: "q_day1_market_whispers",
    title: "Sussurri del Mercato",
    description: "Marco di Piazza Maggiore potrebbe sapere qualcosa sul ragù autentico. Parlagli — e poi vai da Lucia al mercato.",
    dayMin: 1,
    dayMax: 2,
    objectives: [
      { type: "talkToNpc", npcId: "marco_verdini", completed: false },
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false }
    ],
    rewards: {
      clueId: "clue_soffritto_base",
      xp: 20
    }
  },
  q_day2_conflicting_voices: {
    id: "q_day2_conflicting_voices",
    title: "Voci Contraddittorie",
    description: "Donna Rosa ha sentito qualcosa di strano sull'osteria. Trovala in piazza — poi confronta la versione con Giorgio al Sole.",
    dayMin: 2,
    dayMax: 3,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false }
    ],
    rewards: {
      clueId: "clue_tempo_contraddittorio",
      xp: 25
    }
  },
  q_day3_locked_archive: {
    id: "q_day3_locked_archive",
    title: "L'Archivio Chiuso",
    description: "Si dice che la Biblioteca Salaborsa conservi documenti antichi sulla cucina bolognese. Il Prof. Conti di Via Zamboni sa come entrarci?",
    dayMin: 3,
    dayMax: 4,
    objectives: [
      { type: "talkToNpc", npcId: "prof_conti", completed: false }
    ],
    rewards: {
      clueId: "clue_archivio_chiuso",
      xp: 30
    }
  }
};
