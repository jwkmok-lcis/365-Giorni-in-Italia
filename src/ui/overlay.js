export function createOverlayController() {
  const root = ensureRoot();
  const prompt = ensurePrompt();
  const promptText = prompt.querySelector("[data-role='prompt-text']");
  const promptButton = prompt.querySelector("[data-role='prompt-action']");
  const status = ensureStatus();
  const title = root.querySelector("[data-role='overlay-title']");
  const body = root.querySelector("[data-role='overlay-body']");
  const closeButton = root.querySelector("[data-role='overlay-close']");

  let onClose = null;
  let promptAction = null;

  const close = () => {
    root.hidden = true;
    document.body.classList.remove("overlay-open");
    const currentClose = onClose;
    onClose = null;
    currentClose?.();
  };

  closeButton.addEventListener("click", close);
  root.addEventListener("click", (event) => {
    if (event.target === root) {
      close();
    }
  });

  promptButton.addEventListener("click", () => {
    promptAction?.();
  });

  function openExercise(titleText, html, closeHandler) {
    title.textContent = titleText;
    body.innerHTML = html;
    onClose = closeHandler ?? null;
    root.hidden = false;
    document.body.classList.add("overlay-open");
  }

  function openVocabUI(building, closeHandler) {
    openExercise(
      `${building.name} · Vocabulary`,
      `<p>Collect plaza words before moving on.</p>
       <div class="exercise-card-grid">
         <article class="exercise-card"><h3>Market Words</h3><p>pane, piazza, biblioteca, mercato</p></article>
         <article class="exercise-card"><h3>Prompt</h3><p>Match the Italian building names to their meanings.</p></article>
       </div>`,
      closeHandler
    );
  }

  function openPronunciationUI(building, closeHandler) {
    openExercise(
      `${building.name} · Pronunciation`,
      `<p>Use this station to repeat sounds out loud.</p>
       <div class="exercise-card-grid">
         <article class="exercise-card"><h3>Listen</h3><p>Practice rolling the <strong>r</strong> in <em>ragu</em> and <em>Ferrante</em>.</p></article>
         <article class="exercise-card"><h3>Challenge</h3><p>Say the phrase: <em>Il ragu riposa piano.</em></p></article>
       </div>`,
      closeHandler
    );
  }

  function openNumbersUI(building, closeHandler) {
    openExercise(
      `${building.name} · Numbers`,
      `<p>Translate quantities and times you see around the square.</p>
       <div class="exercise-card-grid">
         <article class="exercise-card"><h3>Count</h3><p>uno, due, tre, quattro, cinque</p></article>
         <article class="exercise-card"><h3>Challenge</h3><p>How would you say <strong>three hours</strong> and <strong>six minutes</strong>?</p></article>
       </div>`,
      closeHandler
    );
  }

  return {
    isOpen() {
      return !root.hidden;
    },
    setStatus(message) {
      status.textContent = message ?? "";
    },
    setPrompt(config) {
      if (!config) {
        prompt.hidden = true;
        promptText.textContent = "";
        promptButton.hidden = true;
        promptAction = null;
        return;
      }

      prompt.hidden = false;
      promptText.textContent = config.label;
      promptAction = config.onAction ?? null;
      promptButton.hidden = !config.buttonLabel;
      promptButton.textContent = config.buttonLabel ?? "";
    },
    openVocabUI,
    openPronunciationUI,
    openNumbersUI,
    openBuilding(building, closeHandler) {
      switch (building.type) {
        case "vocab":
          openVocabUI(building, closeHandler);
          break;
        case "pronunciation":
          openPronunciationUI(building, closeHandler);
          break;
        case "numbers":
          openNumbersUI(building, closeHandler);
          break;
        default:
          openExercise(building.name, "<p>Exercise coming soon.</p>", closeHandler);
      }
    },
    close,
  };
}

function ensureStatus() {
  let node = document.getElementById("sceneStatus");
  if (node) {
    return node;
  }

  node = document.createElement("div");
  node.id = "sceneStatus";
  node.className = "scene-status";
  document.body.appendChild(node);
  return node;
}

function ensurePrompt() {
  let node = document.getElementById("scenePrompt");
  if (node) {
    return node;
  }

  node = document.createElement("div");
  node.id = "scenePrompt";
  node.className = "scene-prompt";
  node.hidden = true;
  node.innerHTML = `
    <span data-role="prompt-text"></span>
    <button type="button" data-role="prompt-action"></button>
  `;
  document.body.appendChild(node);
  return node;
}

function ensureRoot() {
  let node = document.getElementById("exerciseOverlay");
  if (node) {
    return node;
  }

  node = document.createElement("div");
  node.id = "exerciseOverlay";
  node.className = "exercise-overlay";
  node.hidden = true;
  node.innerHTML = `
    <div class="exercise-shell" role="dialog" aria-modal="true" aria-labelledby="overlayTitle">
      <div class="exercise-header">
        <div>
          <p class="eyebrow">Learning Station</p>
          <h2 id="overlayTitle" data-role="overlay-title">Exercise</h2>
        </div>
        <button type="button" class="close-overlay" data-role="overlay-close" aria-label="Close exercise overlay">Close</button>
      </div>
      <div class="exercise-body" data-role="overlay-body"></div>
    </div>
  `;
  document.body.appendChild(node);
  return node;
}
