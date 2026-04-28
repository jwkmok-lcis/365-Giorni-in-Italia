import * as Phaser from "../../vendor/phaser.esm.js";
import { LOCATIONS } from "../../content/map.js";
import { MAP_CALLOUTS, NPC_DISPLAY, OVERWORLD_LAYOUT, SCENIC_BUILDINGS } from "../content/bolognaMeta.js";
import { createTownCamera } from "../../systems/camera.js";
import { createTownInput } from "../../systems/input.js";
import { createPlayerController, updatePlayerMovement } from "../../systems/player.js";
import { getCurrentObjectiveNpcId } from "../runtime/createRuntime.js";

const OVERWORLD_MAP_TEXTURE = "overworld-map-image";
const OVERWORLD_MAP_IMAGE = "assets/maps/piazza-overworld.png";

const PAPER = 0xe7d6b6;
const PAPER_SHADE = 0xd6c19a;
const PATH_BASE = 0xcbb38a;
const PATH_EDGE = 0xb09168;
const PLAZA_STONE = 0xdcc9a5;
const PLAZA_RING = 0xb89e73;
const WOOD = 0x6b4f34;
const INK = 0x34261e;

function pointDistance(a, b) {
  return Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
}

function distanceToSegment(point, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) {
    return Phaser.Math.Distance.Between(point.x, point.y, from.x, from.y);
  }

  const t = Phaser.Math.Clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) / (dx * dx + dy * dy), 0, 1);
  const px = from.x + t * dx;
  const py = from.y + t * dy;
  return Phaser.Math.Distance.Between(point.x, point.y, px, py);
}

function rectContains(rect, x, y, radius = 0) {
  return x >= rect.x - radius && x <= rect.x + rect.width + radius && y >= rect.y - radius && y <= rect.y + rect.height + radius;
}

export class OverworldScene extends Phaser.Scene {
  constructor() {
    super("OverworldScene");
    this.activeLocation = null;
  }

  preload() {
    if (!this.textures.exists(OVERWORLD_MAP_TEXTURE)) {
      this.load.image(OVERWORLD_MAP_TEXTURE, OVERWORLD_MAP_IMAGE);
    }
  }

  create() {
    this.runtime = this.registry.get("runtime");
    this.layout = OVERWORLD_LAYOUT;
    this.runtime.setHeaderHidden(true);
    this.runtime.setInfoDrawerHidden(true);
    this.runtime.currentLocationId = null;

    const { width, height } = this.layout.world;
    this.worldWidth = width;
    this.worldHeight = height;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);

    this.ensureSpawnWithinLayout();
    this.drawMap();

    this.inputController = createTownInput(this);
    this.playerController = createPlayerController(this, {
      x: this.runtime.player.x,
      y: this.runtime.player.y,
      isTouch: this.inputController.isTouch,
      canOccupy: (x, y, radius) => this.isPointWalkable(x, y, radius),
      worldBounds: {
        minX: 52,
        maxX: width - 52,
        minY: 64,
        maxY: height - 52,
      },
    });
    this.lastWalkablePosition = { x: this.playerController.sprite.x, y: this.playerController.sprite.y };
    this.playerController.sprite.setDepth(44);
    this.playerController.shadow.setDepth(43);

    this.cameraController = createTownCamera(this, this.playerController.sprite, {
      isTouch: this.inputController.isTouch,
      mode: "overworld",
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
    });
    this.cameraController.applyForViewport(true);

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
    this.endDayKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.N) ?? null;
    this.markerPulse = 0;

    this.buildUi();

    this.pointerHandler = (pointer) => {
      if (this.inputController.pointerInJoystick(pointer)) return;
      if (this.pointerHitsEndDayButton(pointer)) return;
      if (this.activeLocation) {
        this.enterLocation(this.activeLocation);
      }
    };
    this.input.on("pointerdown", this.pointerHandler);
    this.scale.on("resize", this.handleResize, this);
    this.handleResize();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerdown", this.pointerHandler);
      this.scale.off("resize", this.handleResize, this);
      this.inputController.destroy();
    });
  }

  update(_, delta) {
    this.markerPulse += delta * 0.004;
    this.inputController.update();

    const movement = this.inputController.getMovementVector();
    updatePlayerMovement(this.playerController, movement, delta);

    if (!this.isPointWalkable(this.playerController.sprite.x, this.playerController.sprite.y, this.playerController.radius)) {
      const { x, y } = this.lastWalkablePosition;
      this.playerController.body.reset(x, y);
      this.playerController.sprite.setPosition(x, y);
      this.playerController.shadow.setPosition(x, y + 24);
    } else {
      this.lastWalkablePosition.x = this.playerController.sprite.x;
      this.lastWalkablePosition.y = this.playerController.sprite.y;
    }

    this.runtime.player.x = this.playerController.sprite.x;
    this.runtime.player.y = this.playerController.sprite.y;
    this.runtime.player.facing = movement.x < 0
      ? "left"
      : movement.x > 0
        ? "right"
        : movement.y < 0
          ? "up"
          : movement.y > 0
            ? "down"
            : this.runtime.player.facing;

    this.activeLocation = this.findNearbyLocation();
    const plazaCenter = this.layout.plaza.center;
    const inHub = pointDistance(this.playerController.sprite, plazaCenter) < this.layout.plaza.idleRadius;
    this.cameraController.updateDynamicState({
      nearBuilding: Boolean(this.activeLocation),
      inHub,
      movement,
    });

    if (this.activeLocation && (this.inputController.consumeInteract() || (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)))) {
      this.enterLocation(this.activeLocation);
      return;
    }

    if (this.endDayKey && Phaser.Input.Keyboard.JustDown(this.endDayKey)) {
      this.endDay();
    }

    this.updateUi();
  }

  buildUi() {
    this.topBar = this.add.container(400, 24).setScrollFactor(0).setDepth(90);
    const topBarBg = this.add.rectangle(0, 0, 764, 38, 0x263748, 0.92).setStrokeStyle(2, 0xe1c17f, 0.56);
    this.statsText = this.add.text(-368, 0, "", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#f7eddc",
    }).setOrigin(0, 0.5);
    this.questText = this.add.text(0, 0, "", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "14px",
      color: "#f1dfbf",
      align: "center",
      wordWrap: { width: 350 },
    }).setOrigin(0.5);
    this.topBar.add([topBarBg, this.statsText, this.questText]);

    this.focusChip = this.add.container(648, 68).setScrollFactor(0).setDepth(90).setVisible(false);
    const focusBg = this.add.rectangle(0, 0, 248, 34, 0x375145, 0.92).setStrokeStyle(2, 0xdac289, 0.42);
    this.focusText = this.add.text(0, 0, "", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "13px",
      color: "#f2ead8",
      align: "center",
      wordWrap: { width: 220 },
    }).setOrigin(0.5);
    this.focusChip.add([focusBg, this.focusText]);

    this.contextChip = this.add.container(400, 468).setScrollFactor(0).setDepth(90).setVisible(false);
    const contextBg = this.add.rectangle(0, 0, 430, 52, 0x1b2c3b, 0.94).setStrokeStyle(2, 0xe1c17f, 0.54);
    this.contextText = this.add.text(0, 0, "", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "15px",
      color: "#f7eddc",
      align: "center",
      wordWrap: { width: 388 },
    }).setOrigin(0.5);
    this.contextChip.add([contextBg, this.contextText]);

    this.objectiveRing = this.add.circle(0, 0, 18, 0xf1d281, 0.18).setStrokeStyle(3, 0xf1d281, 0.95).setDepth(55);

    this.endDayButton = this.add.container(676, 472).setScrollFactor(0).setDepth(90);
    const endDayBg = this.add.rectangle(0, 0, 212, 34, 0x7a3121, 0.94).setStrokeStyle(2, 0xf1d281, 0.85);
    const endDayLabel = this.add.text(0, 0, "End Day", {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: "16px",
      color: "#fff4dd",
    }).setOrigin(0.5);
    const endDayZone = this.add.zone(0, 0, 212, 34).setInteractive({ useHandCursor: true });
    endDayZone.on("pointerdown", () => this.endDay());
    this.endDayButton.add([endDayBg, endDayLabel, endDayZone]);
    this.endDayButton.setVisible(false);
  }

  ensureSpawnWithinLayout() {
    const spawn = this.layout.plaza.spawn;
    if (!this.isPointWalkable(this.runtime.player.x, this.runtime.player.y, 12)) {
      this.runtime.player.x = spawn.x;
      this.runtime.player.y = spawn.y;
    }
  }

  drawMap() {
    const { width, height, parchmentInset } = this.layout.world;

    if (this.textures.exists(OVERWORLD_MAP_TEXTURE)) {
      this.add.image(0, 0, OVERWORLD_MAP_TEXTURE)
        .setOrigin(0, 0)
        .setDisplaySize(width, height)
        .setDepth(1);
      return;
    }

    const graphics = this.add.graphics().setDepth(1);
    graphics.fillStyle(0x1b2430, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(PAPER, 1);
    graphics.fillRoundedRect(parchmentInset, parchmentInset, width - parchmentInset * 2, height - parchmentInset * 2, 28);
    graphics.lineStyle(3, 0xf6ead2, 0.52);
    graphics.strokeRoundedRect(parchmentInset, parchmentInset, width - parchmentInset * 2, height - parchmentInset * 2, 28);

    const wash = this.add.graphics().setDepth(2);
    wash.fillStyle(PAPER_SHADE, 0.16);
    wash.fillEllipse(560, 430, 820, 520);
    wash.fillEllipse(1030, 820, 290, 180);
    wash.fillEllipse(210, 760, 220, 150);

    const speckles = this.add.graphics().setDepth(2);
    speckles.fillStyle(0xc7b38e, 0.14);
    for (let index = 0; index < 80; index += 1) {
      speckles.fillEllipse(
        70 + (index % 10) * 118,
        74 + Math.floor(index / 10) * 100,
        34 + (index % 3) * 7,
        12 + (index % 4) * 3,
      );
    }

    this.drawPathNetwork();
    this.drawCentralPiazza();
    this.drawLocationCards();
    this.drawScenicBuildingCards();
    this.drawForegroundTrees();
  }

  drawPathNetwork() {
    this.layout.paths.forEach((path) => {
      const base = this.add.graphics().setDepth(4);
      const accent = this.add.graphics().setDepth(5);
      const curve = new Phaser.Curves.Spline(path.points.map((point) => new Phaser.Math.Vector2(point.x, point.y)));
      const points = curve.getPoints(26);

      base.lineStyle(path.width, PATH_BASE, 0.62);
      base.strokePoints(points, false, false);
      accent.lineStyle(5, PATH_EDGE, 0.42);
      accent.strokePoints(points, false, false);

      points.forEach((point, index) => {
        if (index % 4 !== 0) return;
        this.add.circle(point.x, point.y, 5, 0xe8d7b3, 0.22).setDepth(6);
      });
    });
  }

  drawCentralPiazza() {
    const { center, radius, innerRadius, fountainRadius } = this.layout.plaza;
    const square = this.add.graphics().setDepth(10);
    square.fillStyle(PLAZA_STONE, 0.92);
    square.fillCircle(center.x, center.y, radius);
    square.fillStyle(0xcfba93, 0.72);
    square.fillCircle(center.x, center.y, innerRadius);
    square.lineStyle(3, PLAZA_RING, 0.42);
    square.strokeCircle(center.x, center.y, radius);
    square.lineStyle(2, 0xc2aa81, 0.24);
    square.strokeCircle(center.x, center.y, innerRadius);

    const fountain = this.add.container(center.x, center.y).setDepth(12);
    const basinShadow = this.add.ellipse(0, 32, 126, 26, 0x000000, 0.12);
    const basin = this.add.ellipse(0, 22, 106, 40, 0xbca47b, 1).setStrokeStyle(3, 0xefe1bd, 0.65);
    const water = this.add.ellipse(0, 20, 82, 24, 0x6db6cb, 0.96).setStrokeStyle(2, 0xf0fbff, 0.84);
    const stem = this.add.rectangle(0, -8, 20, 36, 0xac8b61).setStrokeStyle(2, 0xe8d8b5, 0.4);
    const top = this.add.circle(0, -34, 14, 0xcaaf84, 1).setStrokeStyle(2, 0xf8ebc7, 0.52);
    const rippleA = this.add.ellipse(0, 20, 68, 18, 0xdff8ff, 0.2);
    const rippleB = this.add.ellipse(0, 20, 48, 12, 0xdff8ff, 0.15);
    fountain.add([basinShadow, basin, water, stem, top, rippleA, rippleB]);

    this.tweens.add({ targets: rippleA, scaleX: 1.16, scaleY: 1.2, alpha: 0.04, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    this.tweens.add({ targets: rippleB, scaleX: 1.22, scaleY: 1.24, alpha: 0.03, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.InOut", delay: 200 });

    [
      [386, 260], [723, 278], [355, 554], [726, 564], [486, 226], [636, 612],
    ].forEach(([x, y], index) => {
      this.drawTree(x, y, index % 2 === 0 ? 0.96 : 0.88, 14);
    });
  }

  drawLocationCards() {
    LOCATIONS.forEach((location) => {
      if (location.id === "piazza_maggiore") return;
      this.drawLocationCard(location);
      const entrance = this.getEntrancePoint(location.id);
      this.add.circle(entrance.x, entrance.y, 9, 0x183041, 0.84).setStrokeStyle(2, 0xf1d281, 0.85).setDepth(40);
    });
  }

  drawLocationCard(location) {
    const layout = this.layout.locations[location.id];
    const callout = MAP_CALLOUTS[location.id];
    if (!layout || !callout) return;

    const { x, y, width, height, entranceSide } = layout;
    const building = this.add.graphics().setDepth(20);
    const roofPeakX = entranceSide === "left" ? x + width * 0.34 : entranceSide === "right" ? x + width * 0.66 : x + width / 2;
    building.fillStyle(0x5d4129, 0.42);
    building.fillTriangle(x + 12, y + 34, roofPeakX, y - 4, x + width - 12, y + 32);
    building.fillStyle(callout.roofColor, 1);
    building.fillTriangle(x + 12, y + 28, roofPeakX, y - 10, x + width - 12, y + 24);
    building.fillStyle(callout.roofColor, 0.88);
    building.fillRoundedRect(x + 12, y + 22, width - 24, 22, 6);
    building.fillStyle(0xf1dec0, 0.95);
    building.fillRoundedRect(x + 14, y + 40, width - 28, height - 54, 12);
    building.lineStyle(2, 0x8b6b47, 0.34);
    building.strokeRoundedRect(x + 14, y + 40, width - 28, height - 54, 12);
    building.fillStyle(0x4a3829, 0.12);
    building.fillEllipse(x + width / 2, y + height - 2, 92, 18);

    this.drawAwning(x + 22, y + 48, width - 44, 18, callout.awningA, callout.awningB);
    this.drawWindows(x + 26, y + 76, width - 52, height - 92, location.id);
    this.drawDoor(x, y, width, height, entranceSide);
    this.drawLessonSignForLocation(location.id, x, y, width, height);
  }

  drawDoor(x, y, width, height, entranceSide) {
    const door = this.add.graphics().setDepth(21);
    if (entranceSide === "left") {
      door.fillStyle(0x6f4f35, 1);
      door.fillRoundedRect(x + 12, y + height - 56, 30, 44, 4);
      return;
    }
    if (entranceSide === "right") {
      door.fillStyle(0x6f4f35, 1);
      door.fillRoundedRect(x + width - 42, y + height - 56, 30, 44, 4);
      return;
    }

    door.fillStyle(0x6f4f35, 1);
    door.fillRoundedRect(x + width / 2 - 18, y + height - 56, 36, 44, 4);
  }

  drawLessonSignForLocation(locationId, x, y, width, height) {
    const callout = MAP_CALLOUTS[locationId];
    if (!callout?.lessonSign) return;
    const side = callout.lessonSign.side ?? "right";
    const signX = side === "left" ? x + 18 : x + width - 18;
    this.drawLessonSign(signX, y + height - 8, callout.lessonSign.label, callout.lessonSign.fillColor, callout.lessonSign.textColor, side);
  }

  drawLessonSign(x, y, label, fillColor, textColor, side = "right") {
    const signWidth = Math.max(38, label.length * 12 + 18);
    const anchorX = side === "left" ? x + signWidth / 2 - 4 : x - signWidth / 2 + 4;
    const strings = this.add.graphics().setDepth(24);
    strings.lineStyle(2, 0x7d6243, 0.42);
    strings.beginPath();
    strings.moveTo(anchorX - 8, y - 22);
    strings.lineTo(anchorX - 8, y - 6);
    strings.moveTo(anchorX + 8, y - 22);
    strings.lineTo(anchorX + 8, y - 6);
    strings.strokePath();

    const sign = this.add.graphics().setDepth(25);
    sign.fillStyle(WOOD, 1);
    sign.fillRoundedRect(anchorX - signWidth / 2, y - 6, signWidth, 24, 5);
    sign.fillStyle(fillColor, 1);
    sign.fillRoundedRect(anchorX - signWidth / 2 + 3, y - 3, signWidth - 6, 18, 4);
    sign.lineStyle(1, 0xf4ead0, 0.22);
    sign.strokeRoundedRect(anchorX - signWidth / 2 + 3, y - 3, signWidth - 6, 18, 4);

    this.add.text(anchorX, y + 5, label, {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: label.length > 3 ? "11px" : "13px",
      color: textColor,
      fontStyle: "bold",
      letterSpacing: 1.5,
    }).setOrigin(0.5).setDepth(26);
  }

  drawScenicBuildingCards() {
    SCENIC_BUILDINGS.forEach((building) => {
      const panel = this.add.graphics().setDepth(12);
      panel.fillStyle(building.color, 0.84);
      panel.fillRoundedRect(building.x, building.y, building.width, building.height, 10);
      panel.lineStyle(2, 0xf2dfba, 0.22);
      panel.strokeRoundedRect(building.x, building.y, building.width, building.height, 10);

      if (building.id === "portico_nord") {
        this.drawPorticoFacade(building);
      } else if (building.id === "forno_vecchio") {
        this.drawFornoFacade(building);
      } else if (building.id === "archivio_civico") {
        this.drawArchiveFacade(building);
      } else if (building.id === "stazione_centrale") {
        this.drawStationFacade(building);
      }

      if (building.plaque) {
        this.drawScenicPlaque(
          building.x + building.width / 2,
          building.y + building.height - 12,
          building.plaque.width,
          building.plaque.label,
          building.plaque.fillColor,
          building.plaque.textColor,
        );
      }
    });

    this.add.text(1104, 928, "To Milan", {
      fontFamily: "Alegreya, Georgia, serif",
      fontSize: "18px",
      color: "#f3eee1",
      backgroundColor: "#4b6070",
      padding: { left: 12, right: 12, top: 5, bottom: 5 },
    }).setOrigin(0.5).setDepth(16);
  }

  drawPorticoFacade(building) {
    const facade = this.add.graphics().setDepth(13);
    facade.fillStyle(0xf0e3c1, 0.22);
    for (let index = 0; index < 6; index += 1) {
      const x = building.x + 18 + index * 38;
      facade.fillRoundedRect(x, building.y + 16, 22, 22, 9);
    }
  }

  drawFornoFacade(building) {
    const facade = this.add.graphics().setDepth(13);
    facade.fillStyle(0x8e5c2f, 0.95);
    facade.fillRoundedRect(building.x + 18, building.y + 14, 28, 24, 8);
    facade.fillStyle(0xf0b25a, 0.9);
    facade.fillEllipse(building.x + 32, building.y + 26, 12, 8);
    facade.fillStyle(0x7a5c4c, 0.9);
    facade.fillRect(building.x + building.width - 26, building.y + 4, 9, 18);
  }

  drawArchiveFacade(building) {
    const facade = this.add.graphics().setDepth(13);
    facade.fillStyle(0xbccedf, 0.24);
    facade.fillRoundedRect(building.x + 16, building.y + 18, 22, 26, 4);
    facade.fillRoundedRect(building.x + building.width - 38, building.y + 18, 22, 26, 4);
    facade.fillStyle(0xe9efe8, 0.85);
    facade.fillRoundedRect(building.x + building.width / 2 - 10, building.y + 44, 20, 20, 3);
    facade.lineStyle(1, 0x6b758c, 0.65);
    facade.strokeRoundedRect(building.x + building.width / 2 - 10, building.y + 44, 20, 20, 3);
  }

  drawStationFacade(building) {
    const facade = this.add.graphics().setDepth(13);
    facade.fillStyle(0xd8d1c4, 0.22);
    facade.fillRect(building.x + 18, building.y + 18, building.width - 36, 10);
    facade.fillStyle(0xf0e7d5, 0.62);
    facade.fillCircle(building.x + 42, building.y + 30, 10);
    facade.lineStyle(1, 0x6b645d, 0.65);
    facade.strokeCircle(building.x + 42, building.y + 30, 10);
    facade.beginPath();
    facade.moveTo(building.x + 42, building.y + 30);
    facade.lineTo(building.x + 42, building.y + 24);
    facade.moveTo(building.x + 42, building.y + 30);
    facade.lineTo(building.x + 46, building.y + 33);
    facade.strokePath();
  }

  drawScenicPlaque(x, y, width, text, fillColor, textColor) {
    const plaque = this.add.graphics().setDepth(14);
    plaque.fillStyle(WOOD, 1);
    plaque.fillRoundedRect(x - width / 2, y - 10, width, 20, 6);
    plaque.fillStyle(fillColor, 1);
    plaque.fillRoundedRect(x - width / 2 + 3, y - 7, width - 6, 14, 4);
    plaque.lineStyle(1, 0xf5ecd5, 0.22);
    plaque.strokeRoundedRect(x - width / 2 + 3, y - 7, width - 6, 14, 4);
    this.add.text(x, y, text, {
      fontFamily: "Manrope, Trebuchet MS, sans-serif",
      fontSize: width > 90 ? "10px" : "11px",
      color: textColor,
      fontStyle: "bold",
      letterSpacing: 1.2,
    }).setOrigin(0.5).setDepth(15);
  }

  drawForegroundTrees() {
    [
      [60, 210, 1.1], [1180, 210, 1.06], [1260, 610, 0.96], [80, 612, 0.92], [1180, 870, 1.02],
    ].forEach(([x, y, scale]) => this.drawTree(x, y, scale, 30));
  }

  drawTree(x, y, scale = 1, depth = 18) {
    const tree = this.add.graphics().setDepth(depth);
    tree.fillStyle(0x7b5635, 1);
    tree.fillRoundedRect(x - 4 * scale, y + 10 * scale, 8 * scale, 20 * scale, 3 * scale);
    tree.fillStyle(0x739a53, 1);
    tree.fillCircle(x, y, 18 * scale);
    tree.fillCircle(x - 12 * scale, y + 6 * scale, 11 * scale);
    tree.fillCircle(x + 12 * scale, y + 7 * scale, 12 * scale);
    tree.fillStyle(0x94b86b, 0.5);
    tree.fillCircle(x - 4 * scale, y - 7 * scale, 8 * scale);
  }

  drawAwning(x, y, width, height, colorA, colorB) {
    const awning = this.add.graphics().setDepth(21);
    const stripeCount = Math.max(5, Math.floor(width / 16));
    const stripeWidth = width / stripeCount;

    for (let index = 0; index < stripeCount; index += 1) {
      awning.fillStyle(index % 2 === 0 ? colorA : colorB, 1);
      awning.fillRect(x + stripeWidth * index, y, stripeWidth + 1, height);
    }

    awning.lineStyle(1, 0x6d553b, 0.26);
    awning.strokeRoundedRect(x, y, width, height, 4);
  }

  drawWindows(x, y, width, height, locationId) {
    const rows = locationId === "biblioteca_salaborsa" ? 2 : 1;
    const cols = Math.max(2, Math.floor(width / 30));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const windowX = x + col * (width / cols) + 3;
        const windowY = y + row * 22;
        const pane = this.add.graphics().setDepth(21);
        pane.fillStyle(locationId === "biblioteca_salaborsa" ? 0x9cc0d0 : 0x7f5d41, 0.9);
        pane.fillRoundedRect(windowX, windowY, 16, Math.max(12, height / (rows + 1)), 3);
        pane.lineStyle(1, 0xf4ebd2, 0.25);
        pane.strokeRoundedRect(windowX, windowY, 16, Math.max(12, height / (rows + 1)), 3);
      }
    }
  }

  getEntrancePoint(locationId) {
    return this.layout.locations[locationId]?.entrance ?? this.layout.plaza.center;
  }

  findNearbyLocation() {
    let nearest = null;
    let best = 86;
    LOCATIONS.forEach((location) => {
      if (location.id === "piazza_maggiore") return;
      const entrance = this.getEntrancePoint(location.id);
      const distance = Phaser.Math.Distance.Between(this.playerController.sprite.x, this.playerController.sprite.y, entrance.x, entrance.y);
      if (distance < best) {
        nearest = location;
        best = distance;
      }
    });
    return nearest;
  }

  isPointWalkable(x, y, radius = 0) {
    const samplePoints = [
      { x, y },
      { x: x - radius + 2, y },
      { x: x + radius - 2, y },
      { x, y: y - radius + 2 },
      { x, y: y + radius - 2 },
    ];
    return samplePoints.every((point) => this.isSampleWalkable(point.x, point.y));
  }

  isSampleWalkable(x, y) {
    const { width, height, parchmentInset } = this.layout.world;
    if (x < parchmentInset || x > width - parchmentInset || y < parchmentInset || y > height - parchmentInset) {
      return false;
    }

    if (pointDistance({ x, y }, this.layout.plaza.center) <= this.layout.plaza.radius) {
      return true;
    }

    const inZone = Object.values(this.layout.locations).some((zone) => zone.zone && rectContains(zone.zone, x, y));
    if (inZone) return true;

    return this.layout.paths.some((path) => {
      for (let index = 0; index < path.points.length - 1; index += 1) {
        if (distanceToSegment({ x, y }, path.points[index], path.points[index + 1]) <= path.width / 2) {
          return true;
        }
      }
      return false;
    });
  }

  updateUi() {
    const quest = this.runtime.quest.activeQuest;
    const clueCount = this.runtime.quest.getUnlockedClues().length;
    const currentDay = this.runtime.day.currentDay;
    const speed = this.playerController.velocity.length();
    const canEndDay = this.canEndDay();

    this.statsText.setText(`Day ${currentDay}  XP ${this.runtime.player.languageXP}  Energy ${this.runtime.player.energy}/${this.runtime.player.maxEnergy}  Coins ${this.runtime.player.coins}  Clues ${clueCount}`);
    this.questText.setText(quest ? quest.title : canEndDay ? "Daily investigation complete" : "Explore Piazza Maggiore");

    const objectiveNpcId = getCurrentObjectiveNpcId(this.runtime);
    const objectiveLocation = objectiveNpcId
      ? LOCATIONS.find((location) => location.npcSlots?.includes(objectiveNpcId))
      : null;

    if (canEndDay) {
      this.objectiveRing.setPosition(-100, -100);
      this.contextChip.setVisible(true);
      this.contextText.setText(this.runtime.day.isLastDay()
        ? "Chapter One is resolved. Press N or click End Day to view the finale."
        : `Day ${currentDay} complete. Press N or click End Day to begin tomorrow's lesson.`);
      this.runtime.setPrompt(this.contextText.text);
    } else if (this.activeLocation) {
      const callout = MAP_CALLOUTS[this.activeLocation.id];
      this.contextChip.setVisible(true);
      this.contextText.setText(`${callout?.lessonSign?.label ?? ""} · ${this.activeLocation.label}\nPress E or Enter to enter`);
      this.runtime.setPrompt(`Press E or Enter to enter ${this.activeLocation.label}.`);
    } else {
      this.contextChip.setVisible(false);
      this.runtime.setPrompt("");
    }

    if (objectiveLocation && !canEndDay) {
      const entrance = this.getEntrancePoint(objectiveLocation.id);
      this.objectiveRing.setPosition(entrance.x, entrance.y);
      this.objectiveRing.setRadius(18 + Math.sin(this.markerPulse) * 5);
    } else {
      this.objectiveRing.setPosition(-100, -100);
    }

    const showFocus = Boolean(this.activeLocation) || speed < 8;
    this.focusChip.setVisible(showFocus);
    if (showFocus) {
      this.focusText.setText(`Daily focus: ${this.runtime.skillTreeSystem.getFocusSummary(currentDay)}`);
    }

    this.endDayButton.setVisible(canEndDay);
    this.runtime.setStatus(quest ? quest.title : canEndDay ? "Daily investigation complete" : "Explore Bologna");
  }

  enterLocation(location) {
    this.runtime.currentLocationId = location.id;
    this.runtime.persistProgress();
    this.scene.start("LocationScene", { locationId: location.id });
  }

  canEndDay() {
    return this.runtime.day.canExplore() && !this.runtime.quest.activeQuest;
  }

  pointerHitsEndDayButton(pointer) {
    if (!this.endDayButton?.visible) return false;
    const halfWidth = 106;
    const halfHeight = 17;
    return pointer.x >= this.endDayButton.x - halfWidth
      && pointer.x <= this.endDayButton.x + halfWidth
      && pointer.y >= this.endDayButton.y - halfHeight
      && pointer.y <= this.endDayButton.y + halfHeight;
  }

  endDay() {
    if (!this.canEndDay()) return;
    this.runtime.currentLocationId = null;
    this.runtime.currentNpcId = null;
    this.runtime.day.endDay(this.runtime.bus);
    this.runtime.persistProgress();
    this.scene.start("LessonScene");
  }

  handleResize() {
    const { width, height } = this.scale;
    this.inputController.resize();
    this.cameraController.applyForViewport(true);

    if (this.topBar) {
      this.topBar.setPosition(width * 0.5, 24);
    }
    if (this.focusChip) {
      this.focusChip.setPosition(width - 152, 68);
    }
    if (this.contextChip) {
      this.contextChip.setPosition(width * 0.5, height - 44);
    }
    if (this.endDayButton) {
      this.endDayButton.setPosition(width - 124, height - 40);
    }
  }
}