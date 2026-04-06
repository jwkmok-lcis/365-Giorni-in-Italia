# 365-Giorni-in-Italia

365 Giorni in Italia is a canvas RPG language-learning prototype set in Bologna.

## Current focus
- A1-A2 Italian progression with daily lesson -> exploration -> dialogue -> quest loop.
- Day 1-10 authored content with review-mode behavior beyond latest lesson day.
- Mouse + keyboard parity for main gameplay interactions.

## Visual baseline (locked)
- Atmosphere: layered evening Bologna palette with warm paper UI panels.
- Typography: Cormorant Garamond for title tone + Source Sans 3 for shell readability.
- Scene hierarchy: title, core content, choice/action area, support hints.
- Interaction cues: selected and hover states use both color and border emphasis.

## UX highlights
- Lesson:
	- Wrapped intro text and improved quiz option readability.
	- Failed quiz restarts full quiz.
	- Passed quiz can optionally retry from first wrong question.
- Map:
	- Objective target location beacon/highlight.
	- Adaptive objective/clue panel placement to reduce location blocking.
	- Click-to-move and click-to-talk support.
- Dialogue:
	- Card-style choices with stronger selection clarity.
	- Glossary chips/panel with hover and focus feedback.
	- Voice controls and voice setup help overlay.

## Documentation
- Project architecture, roadmap, sprint history, and visual checklist:
	- See PROJECT.md.

## Deploy
- This repo is configured to auto-deploy to GitHub Pages on every push to `main`.
- Workflow file: `.github/workflows/deploy-pages.yml`.
- Expected live URL:
	- `https://jwkmok-lcis.github.io/365-Giorni-in-Italia/`

### First-time setup (GitHub UI)
1. Open repo `Settings` -> `Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.
3. Push any commit to `main` (or run the workflow manually from `Actions`).
