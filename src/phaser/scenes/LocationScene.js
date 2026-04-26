import * as Phaser from "../../vendor/phaser.esm.js";
import { DIALOGUES } from "../../content/dialogues.js";
import { getIdleGreeting } from "../../content/idleDialogues.js";
import { LOCATIONS } from "../../content/map.js";
import { SHOP_GREETINGS, SHOP_ITEMS, SHOP_NO_MONEY, SHOP_THANKS } from "../../content/shops.js";
import { Events } from "../../engine/EventBus.js";
import { NPC_DISPLAY, INTERIOR_THEMES } from "../content/bolognaMeta.js";
import { getCurrentObjectiveNpcId } from "../runtime/createRuntime.js";
import { createTownInput } from "../../systems/input.js";
import { createPlayerController, updatePlayerMovement } from "../../systems/player.js";

export class LocationScene extends Phaser.Scene {
  constructor() {
    super("LocationScene");
    this.npcEntries = [];
    this.overlay = null;
  }

  init(data) {
    this.sceneData = data;
  }

  create() {
    this.runtime = this.registry.get("runtime");
    this.runtime.setHeaderHidden(true);
    this.runtime.setInfoDrawerHidden(false);
    this.location = LOCATIONS.find((entry) => entry.id === this.sceneData.locationId) ?? LOCATIONS[0];
    this.runtime.currentLocationId = this.location.id;
    this.theme = INTERIOR_THEMES[this.location.id] ?? INTERIOR_THEMES.piazza_maggiore;
    this.drawInterior();

    this.inputController = createTownInput(this);
    this.playerController = createPlayerController(this, {
      x: 400,
      y: 392,
      isTouch: this.inputController.isTouch,
    });
    this.playerController.sprite.setDepth(10);
    this.playerController.shadow.setDepth(9);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createNpcs();
    this.messageText = this.add.text(400, 470, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "17px",
      color: "#f4ead4",
      align: "center",
      backgroundColor: "rgba(10,20,30,0.46)",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
      wordWrap: { width: 720 },
    }).setOrigin(0.5).setDepth(30);

    this.focusText = this.add.text(782, 138, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#f3e7ce",
      align: "right",
      backgroundColor: "rgba(28,38,31,0.62)",
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
      wordWrap: { width: 250 },
    }).setOrigin(1, 0).setDepth(30);

    this.progressText = this.add.text(782, 198, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#dce9ef",
      align: "right",
      backgroundColor: "rgba(10,20,30,0.46)",
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
      wordWrap: { width: 250 },
    }).setOrigin(1, 0).setDepth(30);

    this.pointerHandler = (pointer) => this.handlePointer(pointer);
    this.input.on("pointerdown", this.pointerHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerdown", this.pointerHandler);
      this.inputController.destroy();
    });
  }

  drawInterior() {
    const floor = Number.parseInt(this.theme.floor.toString().replace("#", ""), 16);
    const wall = Number.parseInt(this.theme.wall.toString().replace("#", ""), 16);
    const accent = Number.parseInt(this.theme.accent.toString().replace("#", ""), 16);
    const shadow = Math.max(0, accent - 0x222222);

    this.add.rectangle(400, 256, 800, 512, floor, 1);
    this.add.rectangle(400, 78, 800, 156, wall, 1);
    this.add.rectangle(400, 120, 800, 2, accent, 1);
    this.add.rectangle(400, 162, 800, 12, shadow, 0.25);
    this.add.rectangle(400, 448, 800, 128, shadow, 0.18);
    this.add.rectangle(400, 420, 530, 72, accent, 0.16).setStrokeStyle(2, 0xf3d79f, 0.22);
    this.add.rectangle(400, 276, 588, 20, 0x0d1721, 0.12);
    this.add.rectangle(140, 222, 116, 148, accent, 0.34).setStrokeStyle(2, 0xf2debb, 0.26);
    this.add.rectangle(660, 222, 116, 148, accent, 0.34).setStrokeStyle(2, 0xf2debb, 0.26);
    this.add.circle(178, 140, 18, 0xf7d89c, 0.24);
    this.add.circle(622, 140, 18, 0xf7d89c, 0.24);
    this.add.text(400, 42, this.location.label, {
      fontFamily: "Alegreya, Georgia, serif",
      fontSize: "29px",
      color: "#f5ead4",
      fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(400, 78, this.location.description, {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#d5c6b1",
      wordWrap: { width: 600 },
      align: "center",
    }).setOrigin(0.5);
    this.add.text(400, 112, "Listen closely. Every room hides both a clue and a grammar pattern.", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#f0dfb8",
      align: "center",
    }).setOrigin(0.5);
    this.add.rectangle(400, 494, 168, 32, 0x263949, 0.95).setStrokeStyle(2, 0xe2c17b, 0.5);
    this.add.text(400, 494, "Exit", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#f6efe2",
    }).setOrigin(0.5);
  }

  createNpcs() {
    const slots = this.location.npcSlots ?? [];
    this.npcEntries = slots.map((npcId, index) => {
      const x = 220 + index * 180;
      const y = 236 + (index % 2) * 68;
      const body = this.add.circle(x, y, 20, 0xb64c33, 0.95).setStrokeStyle(3, 0xf2dcc0, 0.6).setDepth(12);
      const label = this.add.text(x, y - 38, NPC_DISPLAY[npcId] ?? DIALOGUES[npcId]?.npcName ?? npcId, {
        fontFamily: "Manrope, Trebuchet MS, sans-serif",
        fontSize: "15px",
        color: "#f5ead4",
        align: "center",
      }).setOrigin(0.5).setDepth(12);
      return { npcId, x, y, body, label };
    });
  }

  update(_, delta) {
    this.inputController.update();
    const movement = this.inputController.getMovementVector();
    updatePlayerMovement(this.playerController, movement, delta);
    this.playerController.sprite.x = Phaser.Math.Clamp(this.playerController.sprite.x, 38, 762);
    this.playerController.sprite.y = Phaser.Math.Clamp(this.playerController.sprite.y, 148, 450);
    this.playerController.shadow.setPosition(this.playerController.sprite.x, this.playerController.sprite.y + 24);

    this.nearestNpc = this.getNearestNpc();
    if (Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.leaveLocation();
      return;
    }
    if (this.nearestNpc && (this.inputController.consumeInteract() || Phaser.Input.Keyboard.JustDown(this.enterKey))) {
      this.interactWithNpc(this.nearestNpc);
      return;
    }

    this.runtime.setStatus(`${this.location.label} · ${this.runtime.quest.activeQuest?.title ?? "Explore"}`);
    this.runtime.setPrompt(this.nearestNpc
      ? `Press E or Enter to talk to ${NPC_DISPLAY[this.nearestNpc.npcId] ?? this.nearestNpc.npcId}.`
      : "Move closer to an NPC or press Escape to return to the map.");
    this.updateHud();
  }

  getNearestNpc() {
    let nearest = null;
    let best = 58;
    this.npcEntries.forEach((entry) => {
      const distance = Phaser.Math.Distance.Between(this.playerController.sprite.x, this.playerController.sprite.y, entry.x, entry.y);
      entry.body.setFillStyle(distance < best ? 0xd67d5f : 0xb64c33, 0.95);
      if (distance < best) {
        best = distance;
        nearest = entry;
      }
    });
    return nearest;
  }

  interactWithNpc(entry) {
    if (this.location.shop) {
      this.openShop(entry.npcId);
      return;
    }

    const objectiveNpcId = getCurrentObjectiveNpcId(this.runtime);
    if (entry.npcId !== objectiveNpcId) {
      const greeting = getIdleGreeting(entry.npcId);
      this.messageText.setText(greeting ? `${greeting.it}\n${greeting.en}` : `${NPC_DISPLAY[entry.npcId] ?? entry.npcId} greets you.`);
      return;
    }

    if (!this.runtime.player.canTalk()) {
      this.messageText.setText("No energy left. Buy food or drink to keep talking.");
      return;
    }

    this.runtime.player.spendEnergy(1);
    this.runtime.bus.emit(Events.ENERGY_CHANGED, { energy: this.runtime.player.energy });
    this.runtime.currentNpcId = entry.npcId;
    this.runtime.persistProgress();
    this.scene.start("DialogueScene", {
      npcId: entry.npcId,
      returnSceneKey: "LocationScene",
      returnData: { locationId: this.location.id },
    });
  }

  openShop(npcId) {
    if (this.overlay) {
      this.overlay.destroy(true);
    }
    const items = SHOP_ITEMS[this.location.id] ?? [];
    const greetings = SHOP_GREETINGS[npcId] ?? [];
    const greeting = greetings[(this.runtime.day.currentDay - 1) % Math.max(1, greetings.length)] ?? null;
    this.overlay = this.add.container(0, 0);
    const panel = this.add.rectangle(400, 256, 560, 310, 0x122435, 0.96).setStrokeStyle(2, 0xe1bc72, 0.56);
    const title = this.add.text(400, 142, NPC_DISPLAY[npcId] ?? npcId, {
      fontFamily: "Georgia, serif",
      fontSize: "28px",
      color: "#f5ead4",
      fontStyle: "bold",
    }).setOrigin(0.5);
    const copy = this.add.text(400, 186, greeting ? `${greeting.it}\n${greeting.en}` : "Choose something to restore energy.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "17px",
      color: "#d5c8b4",
      align: "center",
      wordWrap: { width: 460 },
    }).setOrigin(0.5);
    this.overlay.add([panel, title, copy]);

    items.forEach((item, index) => {
      const button = this.createOverlayButton(400, 248 + index * 54, 440, 40, `${item.label} · ${item.price} coins · +${item.energy} energy`, () => {
        if (!this.runtime.player.spendCoins(item.price)) {
          const deny = (SHOP_NO_MONEY[npcId] ?? [])[0];
          this.messageText.setText(deny ? `${deny.it}\n${deny.en}` : "Not enough coins.");
          this.overlay.destroy(true);
          this.overlay = null;
          return;
        }

        this.runtime.player.restoreEnergy(item.energy);
        this.runtime.bus.emit(Events.COINS_CHANGED, { coins: this.runtime.player.coins });
        this.runtime.bus.emit(Events.ENERGY_CHANGED, { energy: this.runtime.player.energy });
        this.runtime.bus.emit(Events.ITEM_PURCHASED, { itemId: item.id, locationId: this.location.id });
        const thanks = (SHOP_THANKS[npcId] ?? [])[0];
        this.messageText.setText(thanks ? `${thanks.it}\n${thanks.en}` : `${item.label} purchased.`);
        this.overlay.destroy(true);
        this.overlay = null;
      });
      this.overlay.add(button);
    });

    const close = this.createOverlayButton(400, 416, 180, 38, "Close", () => {
      this.overlay.destroy(true);
      this.overlay = null;
    });
    this.overlay.add(close);
  }

  handlePointer(pointer) {
    if (this.inputController.pointerInJoystick(pointer)) return;
    if (pointer.y > 476) {
      this.leaveLocation();
      return;
    }
    if (this.nearestNpc) {
      this.interactWithNpc(this.nearestNpc);
    }
  }

  leaveLocation() {
    this.runtime.currentLocationId = null;
    this.runtime.currentNpcId = null;
    this.runtime.persistProgress();
    this.scene.start("OverworldScene");
  }

  updateHud() {
    const currentDay = this.runtime.day.currentDay;
    this.focusText.setText(`Daily focus\n${this.runtime.skillTreeSystem.getFocusSummary(currentDay)}`);

    const now = Date.now();
    const latestFeedback = this.runtime.uiState.latestFeedback;
    if (latestFeedback && now - latestFeedback.recordedAt < 6500) {
      this.progressText.setText(latestFeedback.type === "retry"
        ? `Retry\n${latestFeedback.message}`
        : `Grammar\n${latestFeedback.message}`);
      return;
    }

    const latestXp = this.runtime.uiState.latestXp;
    if (latestXp && now - latestXp.recordedAt < 6500) {
      const milestone = latestXp.milestones?.length ? `\nMilestones: ${latestXp.milestones.join(", ")}` : "";
      this.progressText.setText(`Recent gain\n+${latestXp.amount} XP · ${latestXp.skillTags.join(", ")}${milestone}`);
      return;
    }

    this.progressText.setText("Recent gain\nBuild full sentences to earn streak and milestone bonuses.");
  }

  createOverlayButton(x, y, width, height, label, onClick) {
    const rect = this.add.rectangle(x, y, width, height, 0x244056, 0.96).setStrokeStyle(2, 0xd6c29f, 0.55);
    const text = this.add.text(x, y, label, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#f6efe2",
      align: "center",
      wordWrap: { width: width - 18 },
    }).setOrigin(0.5);
    const zone = this.add.zone(x, y, width, height).setInteractive({ useHandCursor: true });
    zone.on("pointerdown", onClick);
    return this.add.container(0, 0, [rect, text, zone]);
  }
}