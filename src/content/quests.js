// quests.js – quest definitions and recipe clue fragments for Days 1–30.

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
  },
  clue_parola_chiave: {
    id: "clue_parola_chiave",
    title: "La Parola Chiave",
    text: "Elena Bianchi svela la parola: \"Ferrante\". Con questa si apre il secondo fascicolo dell'archivio storico.",
    source: "Elena Bianchi"
  },
  clue_mf_sigla: {
    id: "clue_mf_sigla",
    title: "La Sigla M.F.",
    text: "Nell'archivio compare la sigla M.F. accanto alla ricetta originale. Qualcuno di importante l'ha scritta.",
    source: "Archivio Salaborsa"
  },
  clue_maria_ferrante: {
    id: "clue_maria_ferrante",
    title: "Maria Ferrante",
    text: "Lucia smette di lavorare. Il nome pesa: M.F. era sua nonna, Maria Ferrante. Lei ha scritto la ricetta vera. La famiglia l'ha custodita per generazioni in silenzio.",
    source: "Lucia Ferrante"
  },
  clue_due_ragu: {
    id: "clue_due_ragu",
    title: "Due Ragù",
    text: "Giorgio lo ammette: esistono due versioni del ragù bolognese. Uno antico, uno moderno. Il moderno è stato creato da Maria Ferrante.",
    source: "Giorgio Neri"
  },
  clue_segreto_latte: {
    id: "clue_segreto_latte",
    title: "Il Segreto: Latte",
    text: "Prof. Conti decifra la riga sbiadita: 'aggiungi latte fresco'. Il latte è una traccia importante della ricetta di Maria Ferrante, ma da solo non spiega ancora tutto il metodo.",
    source: "Prof. Conti / Archivio"
  },
  clue_pomodoro_fresco: {
    id: "clue_pomodoro_fresco",
    title: "Il Pomodoro",
    text: "Lucia e Donna Rosa concordano: il pomodoro si aggiunge insieme alla carne, non dopo. Fresco, non in scatola.",
    source: "Lucia Ferrante / Donna Rosa"
  },
  clue_soffritto_ordine: {
    id: "clue_soffritto_ordine",
    title: "L'Ordine del Soffritto",
    text: "Giorgio e Lucia confermano lo stesso ordine: cipolla prima, poi carota, poi sedano. La cipolla deve sudare per dieci minuti prima degli altri.",
    source: "Giorgio Neri / Lucia Ferrante"
  },
  clue_vino_bianco: {
    id: "clue_vino_bianco",
    title: "Vino Bianco — o Latte?",
    text: "Lucia usa vino bianco. Giorgio non lo usa. Donna Rosa ammette che il vero nodo non è scegliere solo tra vino e latte, ma capire quando il ragù chiede l'uno o l'altro gesto.",
    source: "Donna Rosa"
  },
  clue_nota_marginale: {
    id: "clue_nota_marginale",
    title: "Nota Marginale",
    text: "Elena trova una nota marginale nel fascicolo Ferrante: 'lascia riposare due ore'. Accanto, una frase quasi sparita: 'non guardare l'orologio, guarda il sugo'.",
    source: "Elena Bianchi / Archivio"
  },
  clue_confessione_donna_rosa: {
    id: "clue_confessione_donna_rosa",
    title: "La Confessione",
    text: "Donna Rosa abbassa la voce: lei e Maria Ferrante erano amiche. Maria le ha dato la ricetta vera con il segreto dentro. E chiarisce il litigio dei tempi: tre ore erano il minimo, sei solo nei giorni lunghi.",
    source: "Donna Rosa"
  },
  clue_confronto_giorgio: {
    id: "clue_confronto_giorgio",
    title: "Il Confronto",
    text: "Giorgio ferma il giocatore in piazza. Avverte di non toccare la storia dei Ferrante — poi crolla: 'L'ho vista cucinare una volta. Non dimentico.' Ha portato questo in silenzio per anni.",
    source: "Giorgio Neri"
  },
  clue_fiamma_bassa: {
    id: "clue_fiamma_bassa",
    title: "La Fiamma Bassa",
    text: "Giorgio e Donna Rosa concordano: la fiamma deve essere bassissima durante tutta la cottura. Ma Maria giudicava il momento giusto dal sugo, non dal numero segnato sull'orologio.",
    source: "Giorgio Neri / Donna Rosa"
  },
  clue_pentola_pesante: {
    id: "clue_pentola_pesante",
    title: "La Pentola Pesante",
    text: "Giorgio insiste: la pentola deve essere pesante. Mantiene il calore uniforme — senza una pentola giusta, il ragù non può riuscire.",
    source: "Giorgio Neri"
  },
  clue_brodo_finale: {
    id: "clue_brodo_finale",
    title: "Il Brodo",
    text: "Marco rivela: il brodo si aggiunge alla fine, un po' alla volta, e si fa evaporare leggermente. Senza brodo il sugo secca.",
    source: "Marco Verdini"
  },
  clue_riposo_due_ore: {
    id: "clue_riposo_due_ore",
    title: "Il Riposo",
    text: "Donna Rosa e Marco confermano: dopo la cottura, due ore di riposo minimo. I sapori si mescolano solo nel silenzio.",
    source: "Donna Rosa / Marco Verdini"
  },
  clue_tagliatelle: {
    id: "clue_tagliatelle",
    title: "Le Tagliatelle",
    text: "Lucia è netta: niente spaghetti, niente penne. Solo tagliatelle all'uovo, al dente. Le tagliatelle assorbono il sugo senza rompersi.",
    source: "Lucia Ferrante"
  },
  clue_proporzioni_finali: {
    id: "clue_proporzioni_finali",
    title: "Le Proporzioni Finali",
    text: "Giorgio e il Prof. Conti confermano le proporzioni: carne grassa e magra in parti uguali, soffritto abbondante, latte come traccia decisiva, ma sempre dentro una tecnica guidata da colore, odore e pazienza.",
    source: "Giorgio Neri / Prof. Conti"
  },
  clue_quaderno_ferrante: {
    id: "clue_quaderno_ferrante",
    title: "Il Quaderno Ferrante",
    text: "Il Prof. Conti trova un quaderno secondario di Maria Ferrante nell'archivio. Contiene proporzioni, ma anche istruzioni sensoriali: odore, colore, pazienza. Non una formula fredda, ma una pratica viva.",
    source: "Prof. Conti"
  },
  clue_formula_finale: {
    id: "clue_formula_finale",
    title: "La Formula Finale",
    text: "Elena, Conti e Lucia scrivono la formula completa: soffritto, carne, pomodoro fresco, latte come traccia finale, due ore di riposo, tagliatelle al dente. Ma il vero centro resta uno: guardare il sugo, non soltanto i numeri.",
    source: "Elena / Prof. Conti / Lucia"
  },
  clue_ricetta_completa: {
    id: "clue_ricetta_completa",
    title: "La Ricetta di Maria Ferrante",
    text: "Donna Rosa posa sul tavolo la carta scritta a mano di Maria. Dopo trent'anni, la ricetta torna alla luce in piazza Maggiore. Il momento giusto era questo.",
    source: "Donna Rosa"
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
  },
  q_day4_library_card: {
    id: "q_day4_library_card",
    title: "Il Permesso",
    description: "Elena Bianchi ha l'accesso. Ma vuole sapere cosa cerchi esattamente prima di aiutarti.",
    dayMin: 4,
    dayMax: 5,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false }
    ],
    rewards: { clueId: "clue_parola_chiave", xp: 25 }
  },
  q_day5_keyword_hunt: {
    id: "q_day5_keyword_hunt",
    title: "La Parola Chiave",
    description: "Elena ha bisogno di una parola chiave per aprire il fascicolo. Potrebbe venire dal mercato.",
    dayMin: 5,
    dayMax: 6,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false }
    ],
    rewards: { clueId: "clue_tempo_contraddittorio", xp: 25 }
  },
  q_day6_open_archive: {
    id: "q_day6_open_archive",
    title: "Apri il Fascicolo",
    description: "Con la parola chiave, Elena può aprire l'archivio. Il Prof. Conti vuole essere presente.",
    dayMin: 6,
    dayMax: 7,
    objectives: [
      { type: "talkToNpc", npcId: "prof_conti", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { clueId: "clue_mf_sigla", xp: 30 }
  },
  q_day7_signature_trail: {
    id: "q_day7_signature_trail",
    title: "La Sigla M.F.",
    description: "Nel documento compare una sigla: M.F. Chi o cosa è? Marco potrebbe sapere qualcosa.",
    dayMin: 7,
    dayMax: 8,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "prof_conti", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { clueId: "clue_mf_sigla", xp: 30 }
  },
  q_day8_name_of_mf: {
    id: "q_day8_name_of_mf",
    title: "Il Nome di M.F.",
    description: "La sigla porta a Lucia. Ma sembra che la risposta la colpisca profondamente. Parla con lei — e poi con Marco.",
    dayMin: 8,
    dayMax: 9,
    objectives: [
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { clueId: "clue_maria_ferrante", xp: 40 }
  },
  q_day9_two_ragus: {
    id: "q_day9_two_ragus",
    title: "Due Ragù",
    description: "Donna Rosa e Giorgio parlano di due versioni del ragù. Cosa sanno esattamente?",
    dayMin: 9,
    dayMax: 10,
    objectives: [
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "donna_rosa", completed: false }
    ],
    rewards: { clueId: "clue_due_ragu", xp: 30 }
  },
  q_day10_milk_note: {
    id: "q_day10_milk_note",
    title: "La Nota sul Latte",
    description: "Elena ha trovato un secondo fascicolo con una riga sbiadita sul latte. Il Prof. Conti può leggerla meglio, ma forse non basta ancora per capire il segreto.",
    dayMin: 10,
    dayMax: 11,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "prof_conti", completed: false }
    ],
    rewards: { clueId: "clue_segreto_latte", xp: 45 }
  },
  q_day11_second_dossier: {
    id: "q_day11_second_dossier",
    title: "Il Pomodoro",
    description: "Lucia e Donna Rosa possono confermare quando aggiungere il pomodoro. Le loro risposte dovrebbero coincidere.",
    dayMin: 11,
    dayMax: 12,
    objectives: [
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false },
      { type: "talkToNpc", npcId: "donna_rosa", completed: false }
    ],
    rewards: { clueId: "clue_pomodoro_fresco", xp: 30 }
  },
  q_day12_faded_ink: {
    id: "q_day12_faded_ink",
    title: "Il Taglio della Carne",
    description: "Marco e Giorgio non sono d'accordo sul taglio della carne. Scopri entrambe le versioni.",
    dayMin: 12,
    dayMax: 13,
    objectives: [
      { type: "talkToNpc", npcId: "marco_verdini", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false }
    ],
    rewards: { xp: 30 }
  },
  q_day13_mystery_ingredient: {
    id: "q_day13_mystery_ingredient",
    title: "Il Vino o Qualcos'Altro?",
    description: "Donna Rosa pianta un seme: forse il segreto non è il vino. Parla con lei e con Lucia.",
    dayMin: 13,
    dayMax: 14,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false }
    ],
    rewards: { clueId: "clue_vino_bianco", xp: 35 }
  },
  q_day14_verify_sources: {
    id: "q_day14_verify_sources",
    title: "La Fiamma e il Brodo",
    description: "Giorgio spiega la fiamma. Marco spiega il brodo. Entrambe le informazioni servono.",
    dayMin: 14,
    dayMax: 15,
    objectives: [
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { xp: 30 }
  },
  q_day15_confrontation: {
    id: "q_day15_confrontation",
    title: "Il Confronto",
    description: "Giorgio ti ferma in piazza. L'indagine ha toccato qualcosa di personale. Poi parla con Marco.",
    dayMin: 15,
    dayMax: 16,
    objectives: [
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { clueId: "clue_confronto_giorgio", xp: 45 }
  },
  q_day16_meat_cut_check: {
    id: "q_day16_meat_cut_check",
    title: "L'Ordine del Soffritto",
    description: "Giorgio e Lucia concordano sull'ordine. Verifica con entrambi.",
    dayMin: 16,
    dayMax: 17,
    objectives: [
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false }
    ],
    rewards: { clueId: "clue_soffritto_ordine", xp: 30 }
  },
  q_day17_soffritto_order: {
    id: "q_day17_soffritto_order",
    title: "Il Vino e il Segreto",
    description: "Lucia e Donna Rosa parlano di vino e latte, ma nessuna delle due tratta la nota come una risposta completa. Segui l'indizio senza chiudere il mistero troppo presto.",
    dayMin: 17,
    dayMax: 18,
    objectives: [
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false },
      { type: "talkToNpc", npcId: "donna_rosa", completed: false }
    ],
    rewards: { clueId: "clue_vino_bianco", xp: 40 }
  },
  q_day18_wine_debate: {
    id: "q_day18_wine_debate",
    title: "La Nota Marginale",
    description: "Elena ha trovato una nota marginale sul fascicolo. Il Prof. Conti la aiuta a leggerla.",
    dayMin: 18,
    dayMax: 19,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "prof_conti", completed: false }
    ],
    rewards: { clueId: "clue_nota_marginale", xp: 35 }
  },
  q_day19_marginal_note: {
    id: "q_day19_marginal_note",
    title: "La Verifica Finale",
    description: "Elena chiede di fare una verifica finale con tutti. Parla con Marco, poi torna da Elena.",
    dayMin: 19,
    dayMax: 20,
    objectives: [
      { type: "talkToNpc", npcId: "marco_verdini", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { xp: 30 }
  },
  q_day20_confession: {
    id: "q_day20_confession",
    title: "La Confessione",
    description: "Donna Rosa ha qualcosa da dire — qualcosa che non ha detto a nessuno. Questa volta spiega anche il vero senso della disputa tra tre ore e sei.",
    dayMin: 20,
    dayMax: 21,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false }
    ],
    rewards: { clueId: "clue_confessione_donna_rosa", xp: 50 }
  },
  q_day21_low_flame_rule: {
    id: "q_day21_low_flame_rule",
    title: "La Pentola",
    description: "Giorgio spiega la pentola pesante. Marco conferma.",
    dayMin: 21,
    dayMax: 22,
    objectives: [
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { clueId: "clue_pentola_pesante", xp: 30 }
  },
  q_day22_right_pot: {
    id: "q_day22_right_pot",
    title: "Il Brodo",
    description: "Marco spiega il brodo. Elena indica un'altra visita all'archivio.",
    dayMin: 22,
    dayMax: 23,
    objectives: [
      { type: "talkToNpc", npcId: "marco_verdini", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { clueId: "clue_brodo_finale", xp: 30 }
  },
  q_day23_broth_control: {
    id: "q_day23_broth_control",
    title: "Il Tempo",
    description: "Elena e Donna Rosa discutono del tempo di cottura. Confronta numeri, colore e giudizio pratico.",
    dayMin: 23,
    dayMax: 24,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "donna_rosa", completed: false }
    ],
    rewards: { xp: 25 }
  },
  q_day24_time_identity: {
    id: "q_day24_time_identity",
    title: "Il Riposo",
    description: "Donna Rosa e Marco concordano: dopo la cottura, due ore di riposo. Scopri perché è fondamentale.",
    dayMin: 24,
    dayMax: 25,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "marco_verdini", completed: false }
    ],
    rewards: { clueId: "clue_riposo_due_ore", xp: 30 }
  },
  q_day25_resting_phase: {
    id: "q_day25_resting_phase",
    title: "Le Tagliatelle",
    description: "Lucia indica la pasta giusta. Donna Rosa conferma.",
    dayMin: 25,
    dayMax: 26,
    objectives: [
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false },
      { type: "talkToNpc", npcId: "donna_rosa", completed: false }
    ],
    rewards: { clueId: "clue_tagliatelle", xp: 30 }
  },
  q_day26_pasta_pairing: {
    id: "q_day26_pasta_pairing",
    title: "Le Proporzioni",
    description: "Donna Rosa e Giorgio rivelano le misure definitive. Scrivile.",
    dayMin: 26,
    dayMax: 27,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false }
    ],
    rewards: { clueId: "clue_proporzioni_finali", xp: 35 }
  },
  q_day27_balance_ratios: {
    id: "q_day27_balance_ratios",
    title: "Il Quaderno Ferrante",
    description: "Il Prof. Conti ha trovato un quaderno secondario di Maria Ferrante. Elena lo aiuta a leggere: non contiene solo misure, ma anche il modo di interpretarle.",
    dayMin: 27,
    dayMax: 28,
    objectives: [
      { type: "talkToNpc", npcId: "prof_conti", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { clueId: "clue_quaderno_ferrante", xp: 45 }
  },
  q_day28_ferrante_notebook: {
    id: "q_day28_ferrante_notebook",
    title: "La Formula",
    description: "Marco, Lucia ed Elena scrivono la formula finale insieme. I pezzi tecnici devono diventare una voce sola.",
    dayMin: 28,
    dayMax: 29,
    objectives: [
      { type: "talkToNpc", npcId: "marco_verdini", completed: false },
      { type: "talkToNpc", npcId: "lucia_ferrante", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { clueId: "clue_formula_finale", xp: 50 }
  },
  q_day29_final_formula: {
    id: "q_day29_final_formula",
    title: "L'Approvazione",
    description: "Elena porta il dossier a Donna Rosa, Marco e Giorgio per l'approvazione finale. Non devono solo approvarlo: devono riconoscere che è davvero la ricetta di Maria.",
    dayMin: 29,
    dayMax: 30,
    objectives: [
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false },
      { type: "talkToNpc", npcId: "prof_conti", completed: false }
    ],
    rewards: { xp: 40 }
  },
  q_day30_chapter_one_finale: {
    id: "q_day30_chapter_one_finale",
    title: "La Ricetta di Maria",
    description: "Donna Rosa raduna tutti in piazza Maggiore. Ha qualcosa da condividere — qualcosa che aspettava il momento giusto.",
    dayMin: 30,
    dayMax: 30,
    objectives: [
      { type: "talkToNpc", npcId: "donna_rosa", completed: false },
      { type: "talkToNpc", npcId: "giorgio_neri", completed: false },
      { type: "talkToNpc", npcId: "elena_bianchi", completed: false }
    ],
    rewards: { clueId: "clue_ricetta_completa", xp: 100 }
  }
};
