# 365 Giorni in Italia — Learning Progression Guide

## What Just Happened

You now have three integrated layers:

### 1. **Story Layer** (What Players See)
- Days 1–7: Bologna ragù mystery unfolds
- NPCs reveal contradictory information
- Mystery hook: two conflicting recipes to reconcile

### 2. **Grammar Layer** (What They Learn)
- Each dialogue choice is tagged with a skill [S1–S10]
- Skills progress: A1 basic → A2 intermediate
- Skills are **hidden inside story**, not in "lesson mode"

### 3. **Reward Layer** (What They Get)
- XP earned for demonstrating grammar control
- Leveling up skills unlocks new dialogue options
- Repetition bonus encourages pattern internalization

---

## Daily Learning Arc (Days 1–7)

| Day | Focus Skill | Mechanic | Example |
|-----|-------------|----------|---------|
| **1** | S5: Vocabulary Recognition | Present tense, basic survival | "Cerco il ragù" |
| **2** | S5: Repetition & Pattern Building | Soffritto = cipolla, carota, sedano | "Sempre tutti e tre" |
| **3** | S4–S5: Questions | How to ask where/when/why | "Dove? Quanto? Perché?" |
| **4** | S6: Passato Prossimo Intro | First past tense: ho + past participle | "Ho parlato con Giorgio" |
| **5** | S7: Connectors | Linking ideas (ma, perché, quindi) | "Sei ore, **perché** il sapore cambia" |
| **6** | S9: Modal Verbs | Expressing ability/necessity/desire | "**Voglio** vederlo", "**Devo** parlare" |
| **7** | S7+S9: Combining | Complex thoughts | "**Ho parlato** **e** **voglio** entrare" |
| **8** | S8: Object Pronouns | Direct/indirect objects (lo, la, mi, ti) | "**La** conosci?", "**Lo** aggiungo" |
| **9** | S6+S8: Past + Pronouns | Combining past actions with objects | "**L'ho** provato", "**Li** ho visti" |
| **10** | S7+S8: Connectors + Pronouns | Linking ideas about objects | "**Lo** aggiungo **ma** quando?" |
| **11** | S8+S9: Pronouns + Modals | Expressing necessity about objects | "**Lo** **devo** aggiungere", "**La** **puoi** leggere?" |
| **12** | S6+S7+S8: Complex Combinations | Full past + connectors + pronouns | "**L'ho** provato **e** **lo** insegno" |
| **13** | S9+S10: Modals + Infinitives | Modal + infinitive constructions | "**Devo** **aggiungere** latte", "**Puoi** **leggere** meglio" |
| **14** | S7+S9+S10: Full Synthesis | Complete complex sentences | "**Lo** **devo** **cuocere** **ma** come?" |

---

## Grammar Progression in Dialogue

### Day 1–3 (Pure A1)
```
NPC: Cerchi qualcosa?
Player: [S5] Sì, cerco il ragù.
```
- Vocabulary recognition
- Present tense application  
- **No subordinate clauses**

### Day 4 (Introducing Past)
```
NPC: Hai parlato con Giorgio?
Player: [S6] Sì, ho parlato con lui.
```
- Passato prossimo (recent past)
- **New structure**: ho + past participle
- Builds on "cerco" → "ho cercato" pattern

### Day 5 (Linking Ideas)
```
NPC: Tre ore sono giuste…
     ma dipende dal fuoco.

Player: [S7] Perché?
```
- Connectors (ma, perché, quindi)  
- **Moves from isolated statements to relationships**

### Day 6 (Expressing Intent)
```
NPC: Vuoi vedere il documento?
Player: [S9] Sì, voglio vederlo.
```
- Modal verbs (posso, voglio, devo)
- **Introduces infinitive**: voglio + infinitive
- Increases expressability

### Day 7 (Synthesis)
```
Player: [S7+S9] Ho parlato con lui **e** voglio entrare.
```
- **Two past participles + connector + modal**
- Moving toward B1 complexity

---

## XP In Practice

### Example: Day 4, Lucia Node

**Lucia (NPC):**
> "Hai parlato con Giorgio?"

**Three possible responses:**

| Choice | Skill | XP | Explanation |
|--------|-------|----|----|
| "Sì, ho parlato con lui." | [S6] | +10 | Perfect past tense |
| "Sì, io ho parlato." | [S6] | +7 | Awkward pronoun |
| "Sì, con Giorgio." | [S5] | +3 | Right meaning, wrong form |

---

## Repetition Bonus Trigger

After **3 correct uses of the same pattern**:

**Pattern 1:** "Ho parlato" / "Ho trovato" / "Ho capito"  
→ **Repetition Bonus: +10 XP**  
→ S6 progresses toward Level 2

This happens **naturally** as player moves through dialogue.

---

## Skill Mastery Path

### S6: Passato Prossimo (Example)

```
Use 1: "Ho parlato con Giorgio"      → +10 XP [S6 Level 1/3]
Use 2: "Ha detto sei ore"             → +10 XP [S6 Level 1/3]
Use 3: "Ho trovato informazioni"      → +10 XP [Bonus: +10] [S6 Level 2/3]
Use 4: "Ho capito la ricetta"         → +10 XP [S6 Level 2/3]
Use 5: "Hanno detto..."               → +10 XP [→ Level 3: +20 milestone] [S6 Level 3/3]
```

Once S6 reaches **Level 3**, player can:
- Use perfect tense in any context
- Move to S7 (connectors) without struggle
- Access Day 7+ dialogue with confidence

---

## Error Feedback Implementation

**How Incorrect Choices Work:**

```
NPC: "Hai parlato con Giorgio?"
Player chooses: "Sì, Giorgio." [❌ Incomplete - missing verb]
NPC: "Non capisco. Intendi dire: 'Sì, ho parlato con Giorgio'?"
Player retries: "Sì, ho parlato con Giorgio." [✅ +10 XP for correct attempt]
```

**Design Principles:**
- **No punishment**: Errors are learning opportunities
- **Immediate correction**: NPC provides the right form
- **XP reward**: Getting it right after correction still earns XP
- **Contextual**: Corrections fit naturally into conversation

**Example Error Branches to Implement:**
- Missing past tense: "Ho visto Giorgio" → "Non capisco. Intendi dire: 'Ho visto Giorgio'?"
- Wrong pronoun: "Vedo la ricetta" → "Non capisco. Intendi dire: 'La vedo'?"
- Missing connector: "Aggiungo latte" → "Non capisco. Intendi dire: 'Aggiungo latte ma è strano'?"

| Traditional App | 365 Giorni |
|---|---|
| Grammar exercise | Grammar in story context |
| Point system = gamification | Points = actual learning achievement |
| Repetition feels forced | Repetition feels natural (NPC revisits topic) |
| No connection between lessons | Mysteries motivate grammar mastery |
| Passive listening | Active production required |

---

## Implementation Checklist

- [x] A1 dialogue structure (Days 1–3)
- [x] A1→A2 transition (Days 4–7)
- [x] Skill tags on all choices
- [x] XP values assigned
- [x] Daily focus skills documented
- [x] Repetition bonus logic
- [x] Error feedback system designed
- [x] Days 8–14 with S8 (object pronouns) progression
- [x] Complex skill combinations (S6+S7+S8, S7+S9+S10)
- [ ] Days 15–30 extended (B1 progression)
- [ ] Dialogue branching for incorrect answers (error nodes)
- [ ] Skill mastery milestone celebrations
- [ ] Frontend UI for skill tracking and XP display
- [ ] Player testing with A1 learners
- [ ] Balance adjustments based on difficulty feedback

---

## Next Steps

1. **Extend Days 8–30** using Day 4–7 as template
2. **Add error branches** (what NPC says if player answers wrong)
3. **Create skill progression UI** showing player which skills are leveling
4. **Test with A1 learner** to verify pace

