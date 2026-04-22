import * as Phaser from "../vendor/phaser.esm.js";
import { MAP_CONFIG, isWalkable, pixelToTile } from "../content/map.js";

const PLAYER_RADIUS = 12;
const CANVAS_WIDTH = 800;
const PLAYER_TEXTURE_KEY = "giorni-player-person";

export function createPlayerController(scene, options) {
  ensurePlayerTexture(scene);
  const sprite = scene.add.sprite(options.x, options.y, PLAYER_TEXTURE_KEY);
  sprite.setDisplaySize(38, 54);
  sprite.setOrigin(0.5, 0.82);

  scene.physics.add.existing(sprite);

  const body = sprite.body;
  body.setCollideWorldBounds(true);
  body.setSize(18, 30);
  body.setOffset(11, 18);

  const shadow = scene.add.ellipse(options.x, options.y + 26, 28, 10, 0x000000, 0.18);

  return {
    sprite,
    body,
    shadow,
    radius: PLAYER_RADIUS,
    velocity: new Phaser.Math.Vector2(0, 0),
    maxSpeed: options.isTouch ? 210 : 238,
    acceleration: 10,
    deceleration: 14,
    walkPhase: 0,
    canOccupy: options.canOccupy ?? null,
    worldBounds: options.worldBounds ?? null,
  };
}

export function updatePlayerMovement(controller, movement, delta) {
  const frameFactor = Math.min(1, delta / 16.6667);
  const accelT = 1 - Math.exp(-controller.acceleration * frameFactor * 0.12);
  const decelT = 1 - Math.exp(-controller.deceleration * frameFactor * 0.12);
  const blend = movement.lengthSq() > 0 ? accelT : decelT;
  const targetX = movement.x * controller.maxSpeed;
  const targetY = movement.y * controller.maxSpeed;

  let nextVelocityX = Phaser.Math.Linear(controller.velocity.x, targetX, blend);
  let nextVelocityY = Phaser.Math.Linear(controller.velocity.y, targetY, blend);

  if (Math.abs(nextVelocityX) < 2 && Math.abs(targetX) < 0.01) {
    nextVelocityX = 0;
  }
  if (Math.abs(nextVelocityY) < 2 && Math.abs(targetY) < 0.01) {
    nextVelocityY = 0;
  }

  const stepSeconds = delta / 1000;
  let nextX = controller.sprite.x;
  let nextY = controller.sprite.y;

  const proposedX = nextX + nextVelocityX * stepSeconds;
  if (canOccupy(controller, proposedX, nextY)) {
    nextX = proposedX;
  } else {
    nextVelocityX = 0;
  }

  const proposedY = nextY + nextVelocityY * stepSeconds;
  if (canOccupy(controller, nextX, proposedY)) {
    nextY = proposedY;
  } else {
    nextVelocityY = 0;
  }

  const bounds = controller.worldBounds ?? {
    minX: controller.radius,
    maxX: CANVAS_WIDTH - controller.radius,
    minY: MAP_CONFIG.hudHeight + controller.radius,
    maxY: MAP_CONFIG.hudHeight + MAP_CONFIG.rows * MAP_CONFIG.tileSize - controller.radius,
  };

  nextX = Phaser.Math.Clamp(nextX, bounds.minX, bounds.maxX);
  nextY = Phaser.Math.Clamp(nextY, bounds.minY, bounds.maxY);

  controller.velocity.set(nextVelocityX, nextVelocityY);
  const speed = controller.velocity.length();
  controller.walkPhase += delta * (speed > 10 ? 0.015 : 0.006);
  controller.sprite.setPosition(nextX, nextY);
  controller.body.reset(nextX, nextY);
  controller.body.setVelocity(nextVelocityX, nextVelocityY);
  controller.sprite.setFlipX(nextVelocityX < -4);
  controller.sprite.setRotation(nextVelocityX * 0.0005);
  controller.sprite.setScale(1, 1 + Math.sin(controller.walkPhase) * (speed > 10 ? 0.03 : 0.01));
  controller.shadow.setPosition(controller.sprite.x, controller.sprite.y + 24);
  controller.shadow.width = 28 - Math.min(4, speed * 0.015);
}

function ensurePlayerTexture(scene) {
  if (scene.textures.exists(PLAYER_TEXTURE_KEY)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

  graphics.fillStyle(0x1f4052, 1);
  graphics.fillEllipse(20, 32, 20, 18);
  graphics.fillRoundedRect(13, 23, 14, 18, 6);

  graphics.fillStyle(0xe8c4a4, 1);
  graphics.fillCircle(20, 13, 7);
  graphics.fillStyle(0x403128, 1);
  graphics.fillRoundedRect(13, 6, 14, 6, 3);
  graphics.fillRoundedRect(11, 10, 18, 4, 2);

  graphics.fillStyle(0xb04e3d, 1);
  graphics.fillRoundedRect(12, 19, 16, 16, 5);
  graphics.fillStyle(0xf0dfc4, 0.9);
  graphics.fillRect(17, 20, 6, 9);

  graphics.fillStyle(0x1f4052, 1);
  graphics.fillRoundedRect(10, 22, 4, 14, 2);
  graphics.fillRoundedRect(26, 22, 4, 14, 2);
  graphics.fillStyle(0xe8c4a4, 1);
  graphics.fillCircle(12, 36, 2);
  graphics.fillCircle(28, 36, 2);

  graphics.fillStyle(0x304a62, 1);
  graphics.fillRoundedRect(14, 34, 5, 14, 2);
  graphics.fillRoundedRect(21, 34, 5, 14, 2);
  graphics.fillStyle(0x5f3927, 1);
  graphics.fillRoundedRect(13, 46, 7, 4, 2);
  graphics.fillRoundedRect(20, 46, 7, 4, 2);

  graphics.lineStyle(1, 0xf6ebda, 0.35);
  graphics.strokeRoundedRect(12, 19, 16, 16, 5);

  graphics.generateTexture(PLAYER_TEXTURE_KEY, 40, 54);
  graphics.destroy();
}

function canOccupy(controller, x, y) {
  if (typeof controller.canOccupy === "function") {
    return controller.canOccupy(x, y, controller.radius);
  }

  const samplePoints = [
    [x, y],
    [x - controller.radius + 2, y],
    [x + controller.radius - 2, y],
    [x, y - controller.radius + 2],
    [x, y + controller.radius - 2],
  ];

  return samplePoints.every(([sampleX, sampleY]) => {
    const tile = pixelToTile(sampleX, sampleY);
    return isWalkable(tile.col, tile.row);
  });
}
