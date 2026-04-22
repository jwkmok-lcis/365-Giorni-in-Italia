import * as Phaser from "../../vendor/phaser.esm.js";
import { applyDialogueChoice, createDialogueState, getDialogueNode } from "../runtime/dialogueFlow.js";

export class DialogueScene extends Phaser.Scene {
  constructor() {
    super("DialogueScene");
    this.root = null;
    this.dialogueState = null;
    this.speechStartTime = null;
  }

  init(data) {
    this.sceneData = data;
  }

  create() {
    this.runtime = this.registry.get("runtime");
    this.runtime.setHeaderHidden(true);
    this.dialogueState = createDialogueState(
      this.runtime,
      this.sceneData.npcId,
      this.sceneData.returnSceneKey ?? this.sceneData.returnScene ?? "OverworldScene",
      this.sceneData.returnData ?? this.sceneData.returnParams ?? {}
    );
    this.root = this.add.container(0, 0);
    this.refresh();
    this.time.delayedCall(0, () => {
      this.speakCurrent();
    });

    this.keyHandler = (event) => this.handleKey(event);
    this.input.keyboard.on("keydown", this.keyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard.off("keydown", this.keyHandler);
      this.runtime.voice.stop();
    });
  }

  update() {
    const voice = this.runtime?.voice;
    if (!voice || !this.speechStartTime) {
      return;
    }

    const elapsed = Date.now() - this.speechStartTime;
    if (elapsed > 10000 && voice.isSpeaking()) {
      voice.stop();
      this.speechStartTime = null;
    }
  }

  refresh() {
    this.root.removeAll(true);
    const node = getDialogueNode(this.runtime, this.dialogueState);
    const currentDay = this.runtime.day.currentDay;
    const focusSummary = this.runtime.skillTreeSystem.getFocusSummary(currentDay);
    const recentBanner = this.getRecentBanner();
    this.runtime.setStatus(`Talking to ${node.speaker}`);
    this.runtime.setPrompt("W/S or arrow keys choose. Enter confirms. T toggles English. V plays voice.");

    const bg = this.add.rectangle(400, 256, 800, 512, 0x0d1724);
    const panel = this.add.rectangle(400, 288, 720, 390, 0x18293b, 0.96).setStrokeStyle(2, 0xd6b779, 0.5);
    const topStrip = this.add.rectangle(400, 76, 720, 78, 0x102235, 0.94).setStrokeStyle(2, 0x8aa9b7, 0.28);
    const portrait = this.add.circle(130, 142, 48, 0xb64c33, 0.9).setStrokeStyle(3, 0xf2dcc0, 0.7);
    const name = this.add.text(214, 132, node.speaker, {
      fontFamily: "Georgia, serif",
      fontSize: "30px",
      color: "#f5e9d2",
      fontStyle: "bold",
    });
    const dayBadge = this.add.text(114, 54, `Day ${currentDay}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#fff3d0",
      backgroundColor: "#7d3e2d",
      padding: { left: 10, right: 10, top: 5, bottom: 5 },
    }).setOrigin(0, 0.5);
    const focusText = this.add.text(214, 54, `Daily focus: ${focusSummary}`, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#d9e6ea",
      wordWrap: { width: 480 },
    }).setOrigin(0, 0.5);
    const bannerBg = this.add.rectangle(400, 92, 612, 30, recentBanner ? 0x264653 : 0x132535, recentBanner ? 0.88 : 0.52)
      .setStrokeStyle(1, recentBanner?.type === "retry" ? 0xf1a66b : 0x9ec8d8, recentBanner ? 0.65 : 0.22);
    const bannerText = this.add.text(400, 92, recentBanner?.text ?? "Choose full sentences to build grammar XP and streak bonuses.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "14px",
      color: recentBanner?.type === "retry" ? "#ffe0c0" : "#dce9ef",
      align: "center",
      wordWrap: { width: 586 },
    }).setOrigin(0.5);
    const text = this.add.text(114, 214, node.text, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "25px",
      color: "#f0e6d6",
      wordWrap: { width: 572 },
      lineSpacing: 12,
    });
    this.root.add([bg, panel, topStrip, portrait, name, dayBadge, focusText, bannerBg, bannerText, text]);

    if (this.dialogueState.showTranslation && node.en) {
      const translation = this.add.text(114, 316, node.en, {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "18px",
        color: "#bfd0d8",
        wordWrap: { width: 572 },
        lineSpacing: 8,
      });
      this.root.add(translation);
    }

    node.choices.forEach((choice, index) => {
      const y = 386 + index * 60;
      const button = this.createButton(400, y, 610, 52, choice.text, this.formatChoiceMeta(choice), () => {
        this.dialogueState.selectedIndex = index;
        this.choose();
      }, this.dialogueState.selectedIndex === index);
      this.root.add(button);
    });

    const voice = this.createMiniButton(614, 144, 90, 34, "Voice", () => this.speakCurrent());
    const translate = this.createMiniButton(710, 144, 90, 34, this.dialogueState.showTranslation ? "EN On" : "EN Off", () => {
      this.dialogueState.showTranslation = !this.dialogueState.showTranslation;
      this.refresh();
    });
    this.root.add([voice, translate]);
  }

  handleKey(event) {
    const node = getDialogueNode(this.runtime, this.dialogueState);
    if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
      this.dialogueState.selectedIndex = (this.dialogueState.selectedIndex - 1 + node.choices.length) % node.choices.length;
      this.refresh();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
      this.dialogueState.selectedIndex = (this.dialogueState.selectedIndex + 1) % node.choices.length;
      this.refresh();
      return;
    }
    if (event.key === "t" || event.key === "T") {
      this.dialogueState.showTranslation = !this.dialogueState.showTranslation;
      this.refresh();
      return;
    }
    if (event.key === "v" || event.key === "V") {
      this.speakCurrent();
      return;
    }
    if (event.key === "Escape") {
      this.scene.start(this.dialogueState.returnSceneKey, this.dialogueState.returnData);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      this.choose();
    }
  }

  choose() {
    const result = applyDialogueChoice(this.runtime, this.dialogueState, this.dialogueState.selectedIndex);
    if (result.ended) {
      this.runtime.currentNpcId = null;
      this.runtime.persistProgress();
      this.scene.start(this.dialogueState.returnSceneKey, this.dialogueState.returnData);
      return;
    }
    this.dialogueState.selectedIndex = 0;
    this.refresh();
    this.speakCurrent();
  }

  getRecentBanner() {
    const now = Date.now();
    const latestXp = this.runtime.uiState.latestXp;
    const latestFeedback = this.runtime.uiState.latestFeedback;
    const xpActive = latestXp && now - latestXp.recordedAt < 6500;
    const feedbackActive = latestFeedback && now - latestFeedback.recordedAt < 6500;

    if (feedbackActive) {
      return {
        type: latestFeedback.type,
        text: latestFeedback.type === "retry"
          ? `${latestFeedback.message}${latestFeedback.correction ? ` Suggested fix: ${latestFeedback.correction}` : ""}`
          : latestFeedback.message,
      };
    }

    if (xpActive) {
      const milestoneText = latestXp.milestones?.length ? ` Milestones: ${latestXp.milestones.join(", ")}.` : "";
      return {
        type: "success",
        text: `+${latestXp.amount} XP · ${latestXp.skillTags.join(", ")} · streak ${latestXp.streak}.${milestoneText}`,
      };
    }

    return null;
  }

  formatChoiceMeta(choice) {
    const tags = (choice.skillTags ?? []).join(" · ");
    const xp = typeof choice.xp === "number" ? `${choice.xp} XP` : "0 XP";
    const mode = choice.xpMode === "comprehension" ? "listen/read" : "production";
    const retry = (choice.grammarAccuracy ?? 1) < 0.65 ? " · retry if incomplete" : "";
    return `${tags} · ${xp} · ${mode}${retry}`;
  }

  speakCurrent() {
    const node = getDialogueNode(this.runtime, this.dialogueState);
    this.runtime.voice.unlockFromGesture();
    this.speechStartTime = Date.now();
    const result = this.runtime.voice.speakAs(node.speaker, node.text, { requireUnlock: false });

    if (!result?.ok) {
      if (result?.reason === "muted") {
        this.runtime.setPrompt("Voice is muted. Open Settings from the title screen to re-enable it.");
      } else if (result?.reason === "unsupported") {
        this.runtime.setPrompt("Voice-over unavailable: your browser does not expose speech synthesis.");
      }
    }
  }

  createButton(x, y, width, height, label, metaLabel, onClick, active = false) {
    const rect = this.add.rectangle(x, y, width, height, active ? 0xb64c33 : 0x213c50, 0.96).setStrokeStyle(2, active ? 0xf0d9ab : 0xaac0c9, 0.65);
    const text = this.add.text(x, y - 8, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "17px",
      color: "#f6efe2",
      align: "center",
      wordWrap: { width: width - 24 },
    }).setOrigin(0.5);
    const meta = this.add.text(x, y + 14, metaLabel, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "12px",
      color: active ? "#fff6db" : "#bfd0d8",
      align: "center",
      wordWrap: { width: width - 30 },
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    return this.add.container(0, 0, [rect, text, meta, zone]);
  }

  createMiniButton(x, y, width, height, label, onClick) {
    const rect = this.add.rectangle(x, y, width, height, 0x244056, 0.94).setStrokeStyle(2, 0xc7d3d9, 0.55);
    const text = this.add.text(x, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#f6efe2",
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    return this.add.container(0, 0, [rect, text, zone]);
  }
}