// PlayerSystem – mutable player state plus tile-aware overworld movement.

import { MAP_CONFIG, isWalkable, pixelToTile } from "../content/map.js";

const CANVAS_W = 800;
const SPEED_PPS = 160;
const PLAYER_RADIUS = 12;

export class PlayerSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 12 * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.y = MAP_CONFIG.hudHeight + 3 * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    this.facing = "down";
    this.moving = false;

    this.coins = 10;
    this.energy = 5;
    this.maxEnergy = 5;
    this.languageXP = 0;
    this.reputation = 0;
    this.npcRelations = {};
    this.completedLesson = false;
    this.talkedToday = new Set();
    this.day = 1;
    this.lastPlayDate = null;
  }

  /** Ensure the player is on a walkable tile; reset to spawn if not. */
  ensureWalkable() {
    const tile = pixelToTile(this.x, this.y);
    if (!isWalkable(tile.col, tile.row)) {
      this.x = 12 * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
      this.y = MAP_CONFIG.hudHeight + 3 * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
    }
  }

  applyMovement(heldKeys, dt) {
    let dx = 0;
    let dy = 0;

    if (heldKeys.has("ArrowLeft") || heldKeys.has("a")) { dx -= 1; this.facing = "left"; }
    if (heldKeys.has("ArrowRight") || heldKeys.has("d")) { dx += 1; this.facing = "right"; }
    if (heldKeys.has("ArrowUp") || heldKeys.has("w")) { dy -= 1; this.facing = "up"; }
    if (heldKeys.has("ArrowDown") || heldKeys.has("s")) { dy += 1; this.facing = "down"; }

    this.moving = dx !== 0 || dy !== 0;
    if (!this.moving) return;

    const len = Math.hypot(dx, dy);
    const stepX = (dx / len) * SPEED_PPS * dt;
    const stepY = (dy / len) * SPEED_PPS * dt;

    const nextX = this.x + stepX;
    if (this._canOccupy(nextX, this.y)) this.x = nextX;

    const nextY = this.y + stepY;
    if (this._canOccupy(this.x, nextY)) this.y = nextY;

    const minY = MAP_CONFIG.hudHeight + PLAYER_RADIUS;
    const maxY = MAP_CONFIG.hudHeight + MAP_CONFIG.rows * MAP_CONFIG.tileSize - PLAYER_RADIUS;
    this.x = Math.max(PLAYER_RADIUS, Math.min(CANVAS_W - PLAYER_RADIUS, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  currentLocation(locations) {
    return locations.find((loc) => {
      if (loc.style !== "piazza") return false;
      const x = loc.bx * MAP_CONFIG.tileSize;
      const y = MAP_CONFIG.hudHeight + loc.by * MAP_CONFIG.tileSize;
      const w = loc.bw * MAP_CONFIG.tileSize;
      const h = loc.bh * MAP_CONFIG.tileSize;
      return this.x >= x && this.x <= x + w && this.y >= y && this.y <= y + h;
    }) ?? null;
  }

  nearEntrance(locations, radius = 28) {
    let nearest = null;
    let best = radius;

    for (const loc of locations) {
      if (!loc.entrance) continue;
      const ex = loc.entrance.col * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
      const ey = MAP_CONFIG.hudHeight + loc.entrance.row * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize / 2;
      const dist = Math.hypot(this.x - ex, this.y - ey);
      if (dist < best) {
        best = dist;
        nearest = loc;
      }
    }

    return nearest;
  }

  getRelation(npcId) {
    return this.npcRelations[npcId] ?? 0;
  }

  changeRelation(npcId, delta) {
    this.npcRelations[npcId] = Math.max(0, Math.min(5, this.getRelation(npcId) + delta));
  }

  canTalk(cost = 1) {
    return this.energy >= cost;
  }

  spendEnergy(amount = 1) {
    if (amount <= 0) return true;
    if (this.energy < amount) return false;
    this.energy -= amount;
    return true;
  }

  restoreEnergy(amount = 1) {
    if (amount <= 0) return this.energy;
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    return this.energy;
  }

  spendCoins(amount = 0) {
    if (amount <= 0) return true;
    if (this.coins < amount) return false;
    this.coins -= amount;
    return true;
  }

  earnCoins(amount = 0) {
    if (amount <= 0) return this.coins;
    this.coins += amount;
    return this.coins;
  }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      facing: this.facing,
      moving: this.moving,
      coins: this.coins,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      languageXP: this.languageXP,
      reputation: this.reputation,
      npcRelations: this.npcRelations,
      completedLesson: this.completedLesson,
      talkedToday: Array.from(this.talkedToday),
      day: this.day,
      lastPlayDate: this.lastPlayDate,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.x = data.x ?? this.x;
    this.y = data.y ?? this.y;
    this.facing = data.facing ?? this.facing;
    this.moving = data.moving ?? this.moving;
    this.coins = data.coins ?? this.coins;
    this.energy = data.energy ?? this.energy;
    this.maxEnergy = data.maxEnergy ?? this.maxEnergy;
    this.languageXP = data.languageXP ?? this.languageXP;
    this.reputation = data.reputation ?? this.reputation;
    this.npcRelations = data.npcRelations ?? this.npcRelations;
    this.completedLesson = data.completedLesson ?? this.completedLesson;
    this.talkedToday = new Set(data.talkedToday ?? []);
    this.day = data.day ?? this.day;
    this.lastPlayDate = data.lastPlayDate ?? this.lastPlayDate;
  }

  _canOccupy(x, y) {
    const samplePoints = [
      [x, y],
      [x - PLAYER_RADIUS + 2, y],
      [x + PLAYER_RADIUS - 2, y],
      [x, y - PLAYER_RADIUS + 2],
      [x, y + PLAYER_RADIUS - 2],
    ];

    return samplePoints.every(([sx, sy]) => {
      const tile = pixelToTile(sx, sy);
      return isWalkable(tile.col, tile.row);
    });
  }
}
