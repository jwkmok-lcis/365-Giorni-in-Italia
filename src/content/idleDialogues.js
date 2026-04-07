// idleDialogues.js – rotating greetings for NPCs when they have no quest-relevant dialogue.
// Each NPC has an array of { it, en } greetings that cycle.
// Used when the player talks to an NPC who is NOT the current quest objective.

export const IDLE_DIALOGUES = {
  marco_verdini: [
    { it: "Ciao! Oggi il mercato è pieno di gente.",           en: "Hi! The market is full of people today." },
    { it: "Buongiorno! Hai bisogno di qualcosa?",              en: "Good morning! Do you need something?" },
    { it: "Bello vederti. Fai un giro per la piazza?",         en: "Nice to see you. Taking a stroll around the square?" },
    { it: "Ti piace Bologna? C'è sempre qualcosa da scoprire.", en: "Do you like Bologna? There's always something to discover." },
    { it: "Io sto qui ogni mattina. Se hai domande, chiedi.",   en: "I'm here every morning. If you have questions, ask." },
  ],
  lucia_ferrante: [
    { it: "Ciao! Oggi abbiamo verdure bellissime.",             en: "Hi! We have beautiful vegetables today." },
    { it: "Buongiorno! Il mercato non dorme mai.",              en: "Good morning! The market never sleeps." },
    { it: "Vuoi vedere le mele? Sono freschissime.",            en: "Want to see the apples? They're super fresh." },
    { it: "Al mercato si impara sempre qualcosa.",              en: "You always learn something at the market." },
    { it: "Che bella giornata per fare la spesa!",              en: "What a beautiful day to do the shopping!" },
  ],
  donna_rosa: [
    { it: "Buongiorno, cara. Come stai?",                      en: "Good morning, dear. How are you?" },
    { it: "La piazza è tranquilla oggi.",                       en: "The square is quiet today." },
    { it: "Hai mangiato bene oggi?",                            en: "Did you eat well today?" },
    { it: "A Bologna, il cibo è una cosa seria.",               en: "In Bologna, food is a serious thing." },
    { it: "Stai imparando bene l'italiano!",                    en: "You're learning Italian well!" },
  ],
  giorgio_neri: [
    { it: "Bentornato. Oggi l'osteria è tranquilla.",           en: "Welcome back. The osteria is quiet today." },
    { it: "Vuoi un bicchiere d'acqua?",                         en: "Want a glass of water?" },
    { it: "Io cucino da quarant'anni. Se vuoi un consiglio, chiedi.", en: "I've cooked for forty years. If you want advice, ask." },
    { it: "Non disturbare troppo Donna Rosa, eh!",               en: "Don't bother Donna Rosa too much, eh!" },
    { it: "Il ragù ha bisogno di pazienza.",                     en: "Ragù needs patience." },
  ],
  prof_conti: [
    { it: "Buongiorno. La biblioteca è sempre un buon posto.",   en: "Good morning. The library is always a good place." },
    { it: "Stai studiando bene? L'italiano richiede pratica.",   en: "Are you studying well? Italian requires practice." },
    { it: "I libri vecchi nascondono molti segreti.",             en: "Old books hide many secrets." },
    { it: "Se vuoi fare un esercizio, vai in biblioteca.",        en: "If you want an exercise, go to the library." },
    { it: "La conoscenza apre le porte.",                         en: "Knowledge opens doors." },
  ],
  elena_bianchi: [
    { it: "Ciao! Oggi ho organizzato gli scaffali.",             en: "Hi! I organized the shelves today." },
    { it: "L'archivio ha sempre qualcosa di nuovo.",              en: "The archive always has something new." },
    { it: "Hai bisogno di aiuto con qualcosa?",                   en: "Do you need help with something?" },
    { it: "Buongiorno! Sei venuto a leggere?",                    en: "Good morning! Did you come to read?" },
    { it: "I documenti vecchi sono delicati. Mani pulite!",       en: "Old documents are delicate. Clean hands!" },
  ],
};

// A counter per NPC so we rotate greetings (not random — deterministic cycle)
const _counters = {};

/** Get the next idle greeting for an NPC. Cycles through the array. */
export function getIdleGreeting(npcId) {
  const greetings = IDLE_DIALOGUES[npcId];
  if (!greetings || greetings.length === 0) return null;
  if (!_counters[npcId]) _counters[npcId] = 0;
  const idx = _counters[npcId] % greetings.length;
  _counters[npcId] += 1;
  return greetings[idx];
}
