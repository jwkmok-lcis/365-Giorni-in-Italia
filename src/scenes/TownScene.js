import * as Phaser from "../vendor/phaser.esm.js";
import { createBuildings, getBuildingAtEntrance } from "../systems/buildings.js";
import { createTownCamera } from "../systems/camera.js";
import { createTownInput } from "../systems/input.js";
import { createPlayerController, updatePlayerMovement } from "../systems/player.js";

export class TownScene extends Phaser.Scene {
  constructor() {
    super("TownScene");
    this.overlay = null;
    this.playerController = null;
    this.inputController = null;
    this.cameraController = null;
    this.buildings = null;
    this.activeEntrance = null;
    this.isInBuilding = false;
  }

  create() {
    this.overlay = this.game.registry.get("overlay");
    this.worldSize = { width: 2200, height: 1600 };

    this.physics.world.setBounds(0, 0, this.worldSize.width, this.worldSize.height);
    this.cameras.main.setBounds(0, 0, this.worldSize.width, this.worldSize.height);

    this.drawWorld();

    this.inputController = createTownInput(this);
    this.playerController = createPlayerController(this, {
      x: this.worldSize.width / 2,
      y: this.worldSize.height / 2 + 260,
      isTouch: this.inputController.isTouch,
    });

    this.buildings = createBuildings(this);
    this.buildings.solids.forEach((solid) => {
      this.physics.add.collider(this.playerController.sprite, solid);
    });

    this.cameraController = createTownCamera(this, this.playerController.sprite, {
      isTouch: this.inputController.isTouch,
    });
    this.cameraController.applyForViewport(true);

    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.input.on("pointerdown", this.handlePointerDown, this);

    this.overlay?.setStatus("Explore Bologna and step up to a building entrance.");
    this.overlay?.setPrompt(null);
  }

  update(_, delta) {
    this.inputController.update();

    if (!this.isInBuilding) {
      const movement = this.inputController.getMovementVector();
      updatePlayerMovement(this.playerController, movement, delta);
      this.updateEntrancePrompt();

      if (this.activeEntrance && this.inputController.consumeInteract()) {
        this.enterBuilding(this.activeEntrance);
      }
    } else {
      updatePlayerMovement(this.playerController, new Phaser.Math.Vector2(0, 0), delta);
    }
  }

  drawWorld() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x7eb37f, 1);
    graphics.fillRect(0, 0, this.worldSize.width, this.worldSize.height);

    graphics.fillStyle(0x9bc8d7, 1);
    graphics.fillRect(0, 0, this.worldSize.width, 120);

    graphics.fillStyle(0x5f8b5f, 0.45);
    for (let index = 0; index < 24; index += 1) {
      graphics.fillCircle(100 + index * 92, 90 + (index % 3) * 18, 22);
    }

    graphics.fillStyle(0xcbb690, 1);
    graphics.fillRect(0, 700, this.worldSize.width, 210);
    graphics.fillRect(955, 180, 290, this.worldSize.height - 120);

    graphics.fillStyle(0xd9c7a6, 1);
    graphics.fillRoundedRect(660, 520, 880, 520, 36);

    graphics.lineStyle(8, 0xefe2c5, 0.85);
    graphics.strokeRoundedRect(660, 520, 880, 520, 36);

    graphics.lineStyle(4, 0xa88454, 0.55);
    graphics.beginPath();
    graphics.moveTo(720, 640);
    graphics.lineTo(1480, 640);
    graphics.moveTo(720, 920);
    graphics.lineTo(1480, 920);
    graphics.moveTo(840, 580);
    graphics.lineTo(840, 980);
    graphics.moveTo(1360, 580);
    graphics.lineTo(1360, 980);
    graphics.strokePath();

    const fountain = this.add.circle(1100, 780, 84, 0x547a95, 0.9);
    fountain.setStrokeStyle(14, 0xe7ecf0, 0.95);
    const fountainCore = this.add.circle(1100, 780, 34, 0xb9d8e7, 0.95);
    fountainCore.setStrokeStyle(5, 0xffffff, 0.9);

    const plazaLabel = this.add.text(1100, 1085, "Piazza Maggiore", {
      fontFamily: "Georgia, serif",
      fontSize: "36px",
      color: "#2f2a25",
      fontStyle: "bold",
    });
    plazaLabel.setOrigin(0.5);

    this.add.text(1100, 1130, "Exercise stations are spread around the square.", {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "20px",
      color: "#433a31",
    }).setOrigin(0.5);
  }

  updateEntrancePrompt() {
    const entrance = getBuildingAtEntrance(this.playerController.sprite, this.buildings.entrances);

    if (!entrance) {
      this.activeEntrance = null;
      this.overlay?.setPrompt(null);
      return;
    }

    this.activeEntrance = entrance;

    const promptText = this.inputController.isTouch
      ? `Tap to enter ${entrance.name}`
      : `Press E to enter ${entrance.name}`;

    this.overlay?.setPrompt({
      label: promptText,
      buttonLabel: this.inputController.isTouch ? "Tap to enter" : null,
      onAction: this.inputController.isTouch ? () => this.enterBuilding(entrance) : null,
    });
  }

  handlePointerDown(pointer) {
    if (this.isInBuilding || !this.inputController.isTouch) {
      return;
    }

    if (!this.activeEntrance) {
      return;
    }

    if (this.inputController.pointerInJoystick(pointer)) {
      return;
    }

    this.enterBuilding(this.activeEntrance);
  }

  enterBuilding(building) {
    if (this.isInBuilding) {
      return;
    }

    this.isInBuilding = true;
    this.activeEntrance = null;
    this.overlay?.setPrompt(null);
    this.overlay?.setStatus(`Inside ${building.name}`);
    this.cameraController.zoomIntoBuilding();

    this.overlay?.openBuilding(building, () => {
      this.exitBuilding();
    });
  }

  exitBuilding() {
    this.isInBuilding = false;
    this.cameraController.zoomOutToWorld();
    this.overlay?.setStatus("Back in the square. Explore another station.");
  }

  handleResize() {
    this.inputController.resize();
    this.cameraController.applyForViewport();
  }

  handleShutdown() {
    this.input.off("pointerdown", this.handlePointerDown, this);
    this.scale.off("resize", this.handleResize, this);
    this.inputController?.destroy();
    this.overlay?.setPrompt(null);
  }
}
