import * as Phaser from "../../vendor/phaser.esm.js";
import { DIALOGUES } from "../../content/dialogues.js";
import { getIdleGreeting } from "../../content/idleDialogues.js";
import { LOCATIONS } from "../../content/map.js";
import { SHOP_GREETINGS, SHOP_ITEMS, SHOP_NO_MONEY, SHOP_THANKS } from "../../content/shops.js";
import { Events } from "../../engine/EventBus.js";
import { NPC_DISPLAY, INTERIOR_THEMES } from "../content/bolognaMeta.js";
import { getCurrentObjectiveNpcId } from "../runtime/createRuntime.js";
import { createTownInput } from "../../systems/input.js";
import { createPlayerController } from "../../systems/player.js";

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
    this.worldWidth = 800;
    this.worldHeight = 512;
    this.location = LOCATIONS.find((entry) => entry.id === this.sceneData.locationId) ?? LOCATIONS[0];
    this.runtime.currentLocationId = this.location.id;
    this.theme = INTERIOR_THEMES[this.location.id] ?? INTERIOR_THEMES.piazza_maggiore;
    this.drawMap();
    this.setupWalkZones();
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.inputController = createTownInput(this);
    this.playerController = createPlayerController(this, {
      x: 400,
      y: 392,
      isTouch: this.inputController.isTouch,
    });
    this.playerController.sprite.setDepth(this.playerController.sprite.y);
    this.playerController.shadow.setDepth(9);
    this.cameras.main.startFollow(this.playerController.sprite, true, 0.08, 0.08);
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
    }).setOrigin(0.5).setDepth(30).setScrollFactor(0);

    this.focusText = this.add.text(782, 138, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#f3e7ce",
      align: "right",
      backgroundColor: "rgba(28,38,31,0.62)",
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
      wordWrap: { width: 250 },
    }).setOrigin(1, 0).setDepth(30).setScrollFactor(0);

    this.progressText = this.add.text(782, 198, "", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#dce9ef",
      align: "right",
      backgroundColor: "rgba(10,20,30,0.46)",
      padding: { left: 8, right: 8, top: 6, bottom: 6 },
      wordWrap: { width: 250 },
    }).setOrigin(1, 0).setDepth(30).setScrollFactor(0);

    this.scale.on("resize", this.handleResize, this);
    this.handleResize(this.scale.gameSize);

    this.pointerHandler = (pointer) => this.handlePointer(pointer);
    this.input.on("pointerdown", this.pointerHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerdown", this.pointerHandler);
      this.scale.off("resize", this.handleResize, this);
      this.inputController.destroy();
    });
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;

    this.cameras.resize(width, height);

    const scaleX = width / this.worldWidth;
    const scaleY = height / this.worldHeight;
    const zoom = Phaser.Math.Clamp(Math.min(scaleX, scaleY), 0.8, 1.5);

    this.cameras.main.setZoom(zoom);

    if (this.messageText) {
      this.messageText.setPosition(width * 0.5, height - 42);
      this.messageText.setWordWrapWidth(Math.max(320, width - 80));
    }

    if (this.focusText) {
      this.focusText.setPosition(width - 18, 24);
      this.focusText.setWordWrapWidth(Math.min(250, width * 0.34));
    }

    if (this.progressText) {
      this.progressText.setPosition(width - 18, 92);
      this.progressText.setWordWrapWidth(Math.min(250, width * 0.34));
    }
  }

  drawMap() {
    // Ground
    this.add.rectangle(400, 256, 800, 512, 0xd8c3a5);

    // Top buildings (like Piazza Maggiore edges)
    this.add.rectangle(400, 70, 800, 140, 0x8c5a3c);

    // Arcades (Bologna feel)
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(100 + i * 120, 120, 80, 60, 0x6e4630);
    }

    // Central piazza
    this.add.circle(400, 260, 110, 0xc9ae8a);

    // Paths
    this.add.rectangle(400, 420, 300, 90, 0xb89a74); // south
    this.add.rectangle(650, 260, 120, 260, 0xb89a74); // east
    this.add.rectangle(150, 260, 120, 260, 0xb89a74); // west

    // Fountain (center landmark)
    this.add.circle(400, 260, 40, 0x6f8fa6);

    // Market (left)
    this.add.rectangle(220, 330, 100, 60, 0xa34a2f);
    this.add.rectangle(220, 360, 100, 30, 0x2f7a4a);

    // Cafe (right)
    this.add.rectangle(600, 330, 120, 80, 0x7a3e2f);

    // Exit area (bottom)
    this.add.rectangle(400, 490, 180, 40, 0x263949)
      .setStrokeStyle(2, 0xe2c17b, 0.5);

    this.add.text(400, 490, "Exit", {
      fontFamily: "Manrope, sans-serif",
      fontSize: "16px",
      color: "#f6efe2",
    }).setOrigin(0.5);
  }

  setupWalkZones() {
    this.walkZones = [
      new Phaser.Geom.Circle(400, 260, 120), // piazza
      new Phaser.Geom.Rectangle(300, 380, 200, 140), // south
      new Phaser.Geom.Rectangle(600, 140, 120, 260), // east
      new Phaser.Geom.Rectangle(80, 140, 120, 260), // west
    ];
  }

  isWalkable(x, y) {
    return this.walkZones.some((zone) => zone.contains(x, y));
  }

  createNpcs() {
    const slots = this.location.npcSlots ?? [];
    this.npcEntries = slots.map((npcId) => {
      const positions = {
        mercato: { x: 220, y: 330 },
        caffe: { x: 600, y: 330 },
        forno: { x: 400, y: 420 },
        libreria: { x: 650, y: 200 },
      };

      const pos = positions[npcId] ?? { x: 400, y: 260 };

      const x = pos.x;
      const y = pos.y;
      const body = this.add.circle(x, y, 20, 0xb64c33, 0.95).setStrokeStyle(3, 0xf2dcc0, 0.6);
      const label = this.add.text(x, y - 38, NPC_DISPLAY[npcId] ?? DIALOGUES[npcId]?.npcName ?? npcId, {
        fontFamily: "Manrope, Trebuchet MS, sans-serif",
        fontSize: "15px",
        color: "#f5ead4",
        align: "center",
      }).setOrigin(0.5);
      body.setDepth(y);
      label.setDepth(y);
      return { npcId, x, y, body, label };
    });
  }

  update(_, delta) {
    this.inputController.update();
    const movement = this.inputController.getMovementVector();

    const nextX = this.playerController.sprite.x + movement.x * delta * 0.2;
    const nextY = this.playerController.sprite.y + movement.y * delta * 0.2;

    if (this.isWalkable(nextX, nextY)) {
      this.playerController.sprite.x = nextX;
      this.playerController.sprite.y = nextY;
    }

    this.playerController.sprite.setDepth(this.playerController.sprite.y);
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
    if (pointer.y > this.scale.height - 36) {
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