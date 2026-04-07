// dialogues.js – branching NPC conversations for Bologna locations.
// Each node has: speaker, text, choices[]
// A choice can have: text, next, end, effects
// Italian is the game language. clueHint appears in English as a learning aid.

export const DIALOGUES = {
  // ── Day 1 NPCs ──────────────────────────────────────────────────────────
  marco_verdini: {
    npcName: "Marco Verdini",
    start: "start",
    nodes: {
      start: {
        speaker: "Marco",
        // Good morning! Looking for something special in this square?
        text: "Buongiorno! Stai cercando qualcosa di speciale in questa piazza?",
        choices: [
          {
            text: "Sì — cerco il ragù leggendario di Bologna.",
            next: "ragu_hook",
            effects: { relationDelta: 1 }
          },
          {
            text: "Sto solo esplorando la città.",
            next: "casual",
            effects: { relationDelta: 0 }
          }
        ]
      },
      ragu_hook: {
        speaker: "Marco",
        // Lower your voice. Too many questions about ragù can make enemies.
        // But if you really want to know, start with the bread.
        text: "Abbassa la voce. Chi fa troppe domande sul ragù... ha nemici. Ma se vuoi davvero capire, inizia dal pane.",
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
        // The soft bread of Bologna absorbs a good ragù without breaking apart.
        // Go to Lucia at the market. Ask about the soffritto. Don't say I sent you.
        text: "Il pane bolognese — morbido dentro, crosta leggera. Un ragù fatto bene lo assorbe senza rompersi. È tutta una questione di equilibrio. Vai da Lucia al mercato. Chiedile del soffritto. Non dire che ti mando io.",
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
        // Fine. Come back when you're ready to take Bolognese cooking seriously.
        text: "Vabbè. Torna quando sei pronto a prendere sul serio la cucina bolognese.",
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
        // Of course. I'm here every morning if you have questions.
        text: "Ci mancherebbe. Sono qui ogni mattina. Se trovi qualcosa di interessante, torna a dirmelo.",
        choices: [
          {
            text: "A presto, Marco.",
            end: true,
            effects: { relationDelta: 0 }
          }
        ]
      }
    }
  },

  lucia_ferrante: {
    npcName: "Lucia Ferrante",
    start: "start",
    nodes: {
      start: {
        speaker: "Lucia",
        // There you are! I bet Marco sent you. Typical.
        // Everyone at the market is talking about your investigation.
        text: "Eccoti! Scommetto che Marco ti ha mandato. Il solito... Al mercato si sa già tutto.",
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
        // Finally someone asking the right questions.
        // Onion, carrot, celery — always all three. Anyone who skips one is a fraud.
        text: "Finalmente qualcuno che fa le domande giuste. Cipolla, carota, sedano — sempre tutti e tre. Chi ne omette uno è un impostore. Punto.",
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
        // That comes after. First let the soffritto sweat slowly over low heat.
        // Rushing kills the ragù.
        text: "La carne viene dopo. Prima il soffritto. Lo fai sudare piano, fuoco basso, almeno venti minuti. La fretta uccide il ragù — ricordatelo.",
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
        // Here at the market, obviously. But be careful — not everyone sells good produce.
        // I'll pick them for you.
        text: "Qui al mercato, ovviamente! Ma stai attenta — non tutti vendono roba buona. Io te le scelgo io. E non comprare mai le carote già tagliate.",
        choices: [
          {
            text: "Grazie mille, Lucia.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      }
    }
  },

  // ── Day 2 NPCs ──────────────────────────────────────────────────────────
  donna_rosa: {
    npcName: "Donna Rosa",
    start: "start",
    nodes: {
      start: {
        speaker: "Donna Rosa",
        // It doesn't surprise me that you're here.
        // Bologna has a long memory. The ragù story goes back further than you think.
        text: "Non mi sorprende che tu sia qui. Bologna ha una lunga memoria. La storia del ragù risale più indietro di quanto pensi.",
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
        // Giorgio at the Osteria del Sole has been nervous lately.
        // He used to be open about the recipe. Now he avoids the subject completely.
        text: "Giorgio al Sole è nervoso ultimamente. Prima parlava della ricetta con chiunque. Adesso schiva l'argomento. Vai a parlargli — ma ascolta anche quello che non dice.",
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
        // The real ragù needs at least three hours over very low heat.
        // My grandmother said the sauce should barely shiver, not boil.
        text: "Il ragù vero vuole almeno tre ore, fuoco bassissimo. Mia nonna diceva: 'Il sugo deve tremare, non bollire.' Tre ore — non un minuto di meno.",
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
        // Six hours? Who told you that? Giorgio again, I'll bet.
        // He exaggerates to confuse people. Or maybe he's hiding something different entirely.
        text: "Sei ore? Chi te lo ha detto? Giorgio, scommetto. O esagera per confondere le idee... oppure nasconde qualcos'altro di diverso.",
        choices: [
          {
            text: "Interessante. Grazie, ci penso.",
            end: true,
            effects: { relationDelta: 1 }
          }
        ]
      }
    }
  },

  giorgio_neri: {
    npcName: "Giorgio Neri",
    start: "start",
    nodes: {
      start: {
        speaker: "Giorgio",
        // The ragù is not discussed. It's eaten.
        // You can't learn it from questions. You learn it from years.
        text: "Il ragù non si discute. Si mangia. Non lo impari a forza di domande. Lo impari con gli anni.",
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
        // Six hours minimum. On the lowest flame you have.
        // Anyone who tells you less has never made a real ragù in their life.
        text: "Sei ore minimo. Sul fuoco più basso che hai. Chi ti dice meno non ha mai fatto un ragù vero in vita sua.",
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
        // Three hours? (He laughs.) That's soup, not ragù.
        // Tell me who said that and I'll tell you why they're wrong.
        text: "Tre ore? (ride) Quello è brodo, non ragù. Dimmi chi te l'ha detto e ti spiego perché sbaglia.",
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
        // (His expression closes off.)
        // Donna Rosa means well. But she learned from a different tradition.
        // Not everything passed down is correct.
        text: "(La sua espressione si chiude.) Donna Rosa vuole bene a tutti. Ma ha imparato da una tradizione diversa. Non tutto quello che passa di mano in mano è ancora giusto.",
        choices: [
          {
            text: "Una tradizione diversa... da dove?",
            end: true,
            effects: { relationDelta: 1, clueHint: "Giorgio shut down when Donna Rosa was mentioned. There's history between them." }
          }
        ]
      }
    }
  },

  // ── Day 3 NPCs ──────────────────────────────────────────────────────────
  prof_conti: {
    npcName: "Prof. Conti",
    start: "start",
    nodes: {
      start: {
        speaker: "Prof. Conti",
        // Ah, you must be the new culinary investigator everyone is talking about.
        // Ancient recipes often hide regional dialectical variations you won't find in modern books.
        text: "Ah, sei il nuovo investigatore culinario di cui tutti parlano. Le ricette antiche spesso nascondono varianti dialettali locali che i libri moderni non riportano.",
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
        // I can confirm it exists. A written record from the late 1800s,
        // in the historical archive of the Biblioteca Salaborsa.
        // But the archive is closed to the public. Special access required.
        text: "Posso confermarlo. Un documento scritto, fine Ottocento, nell'archivio storico della Biblioteca Salaborsa. Però l'archivio è chiuso al pubblico. Ci vuole un accesso speciale.",
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
        // The Biblioteca Salaborsa has a historical archive that most people don't know exists.
        // That's where I'd start.
        text: "La Biblioteca Salaborsa ha un archivio storico che la maggior parte delle persone non sa nemmeno che esiste. Io partirei da lì.",
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
        // I had access once. Things have changed.
        // Someone at the library might still be able to help you in.
        // Have you spoken with Elena Bianchi?
        text: "Io avevo l'accesso una volta. Le cose sono cambiate. Forse qualcuno alla biblioteca può ancora farti entrare. Hai parlato con Elena Bianchi?",
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
        // Very few people. I saw it once, years ago.
        // And Giorgio Neri — he was there too. Though he's never admitted it publicly.
        text: "Pochissimi. Io l'ho visto una volta, anni fa. E Giorgio Neri — anche lui era presente. Anche se non l'ha mai ammesso pubblicamente.",
        choices: [
          {
            text: "Giorgio Neri... di nuovo lui.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Giorgio Neri has seen the original document. He has been hiding this connection." }
          }
        ]
      }
    }
  },

  elena_bianchi: {
    npcName: "Elena Bianchi",
    start: "start",
    nodes: {
      start: {
        speaker: "Elena",
        // Have you tried looking at the old documents in the library?
        // There are things in that archive that would change your investigation completely.
        text: "Hai già provato a cercare vecchi appunti in biblioteca? Ci sono cose in quell'archivio che cambierebbero la tua indagine completamente.",
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
        // Conti told you? Then you're further along than I thought.
        // Come back when you know exactly what you're looking for.
        // The archive doesn't give up its secrets to the unprepared.
        text: "Conti ti ha parlato? Allora sei più avanti di quanto pensassi. Torna da me quando sai esattamente cosa cerchi. L'archivio non rivela i suoi segreti a chi non è pronto.",
        choices: [
          {
            text: "Cerco la ricetta originale del ragù bolognese.",
            end: true,
            effects: { relationDelta: 1, clueHint: "Elena Bianchi may be the key to the library archive. She's watching your progress." }
          }
        ]
      }
    }
  }
};
