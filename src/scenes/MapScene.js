// MapScene – tile-based Bologna overworld with restored street/building rendering.

import { Scene } from "../engine/Scene.js";
import { ClueNotebook } from "../ui/ClueNotebook.js";
import { LOCATIONS, MAP_CONFIG, TILE_MAP, TILE, TILE_PALETTE } from "../content/map.js";

const TS = MAP_CONFIG.tileSize;
const COLS = MAP_CONFIG.cols;
const ROWS = MAP_CONFIG.rows;
const HUD = MAP_CONFIG.hudHeight;

const BUILDING_STYLES = {
  market: { base: "#c07e48", base2: "#a86c38", roof: "#4a2810", trim: "#e0b060", door: "#5a3a20", awning: "#cc3a1a", awning2: "#f04828", sign: "MERCATO", roofType: "gable", facadeType: "arches" },
  osteria: { base: "#b06858", base2: "#985848", roof: "#3a1810", trim: "#d89070", door: "#5a362a", awning: "#8b3020", awning2: "#bc5040", sign: "OSTERIA", roofType: "hip", facadeType: "shutters" },
  bakery: { base: "#d8a870", base2: "#c09060", roof: "#583818", trim: "#f0cc88", door: "#6a4a2a", awning: "#d89838", awning2: "#f8bc50", sign: "PANETTERIA", roofType: "gable", facadeType: "shopfront" },
  cafe: { base: "#b88060", base2: "#a07050", roof: "#402818", trim: "#d0a870", door: "#5a3a25", awning: "#963028", awning2: "#c84e40", sign: "CAFFÈ", roofType: "flat", facadeType: "shopfront" },
  library: { base: "#505870", base2: "#404860", roof: "#1c2030", trim: "#7070a0", door: "#1a1a38", awning: null, awning2: null, sign: "BIBLIOTECA", roofType: "flat", facadeType: "classical" },
  university: { base: "#7a8888", base2: "#6a7878", roof: "#303e3e", trim: "#94a8a0", door: "#444e50", awning: null, awning2: null, sign: null, roofType: "hip", facadeType: "academic" },
  default: { base: "#706860", base2: "#605850", roof: "#302418", trim: "#8a7e6e", door: "#362818", awning: null, awning2: null, sign: null, roofType: "flat", facadeType: "basic" },
};

const MAP_PROPS = [
  { col: 0, row: 2, type: "stall_red" },
  { col: 1, row: 2, type: "stall_green" },
  { col: 2, row: 2, type: "stall_yellow" },
  { col: 3, row: 2, type: "crate" },
  { col: 4, row: 2, type: "basket" },

  { col: 1, row: 8, type: "bread_rack" },
  { col: 3, row: 8, type: "bread_rack" },
  { col: 2, row: 9, type: "chalk_board" },
  { col: 2, row: 10, type: "basket" },

  { col: 20, row: 2, type: "barrel" },
  { col: 21, row: 2, type: "barrel" },
  { col: 22, row: 2, type: "stall_red" },
  { col: 23, row: 2, type: "crate" },
  { col: 21, row: 8, type: "cafe_table" },
  { col: 23, row: 8, type: "cafe_table" },
  { col: 21, row: 9, type: "chair_set" },
  { col: 23, row: 9, type: "chair_set" },
  { col: 22, row: 7, type: "umbrella" },

  { col: 9, row: 4, type: "tree_small" },
  { col: 15, row: 4, type: "tree_small" },
  { col: 9, row: 8, type: "planter" },
  { col: 15, row: 8, type: "planter" },
  { col: 11, row: 8, type: "bench_modern" },
  { col: 13, row: 8, type: "bench_modern" },

  { col: 8, row: 11, type: "bike" },
  { col: 14, row: 11, type: "lamp_post" },
];

export class MapScene extends Scene {
  constructor() {
    super();
    this._player = null;
    this._clueNotebook = new ClueNotebook();
    this._statusPanel = null;
    this._promptPanel = null;
    this._tileCanvas = null;
    this._time = 0;
    this._hudFlash = { quest: 0, clues: 0 };
    this._busHandlers = [];
  }

  enter(game) {
    this._game = game;
    this._player = game.context.player;
    this._statusPanel = document.getElementById("statusPanel");
    this._promptPanel = document.getElementById("promptPanel");
    if (!this._tileCanvas) this._buildTileCache();
    this._player.ensureWalkable();
    this._bindHudFeedback();
    this._updatePanels();
  }

  exit() {
    for (const { event, handler } of this._busHandlers) {
      this._game?.context?.bus?.off(event, handler);
    }
    this._busHandlers = [];
  }

  update(dt, game) {
    this._time += dt;
    this._hudFlash.quest = Math.max(0, this._hudFlash.quest - dt * 2.2);
    this._hudFlash.clues = Math.max(0, this._hudFlash.clues - dt * 2.2);
    if (!game.context.day.canExplore()) return;

    const held = new Set();
    for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"]) {
      if (game.context.input.isDown(key)) held.add(key);
    }

    this._player.applyMovement(held, dt);
    this._player.day = game.context.day.currentDay;
    this._updatePanels();
  }

  render(ctx) {
    const width = COLS * TS;
    const height = ROWS * TS;
    ctx.fillStyle = "#111922";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#18222b";
    ctx.fillRect(0, HUD, width, height - HUD);

    if (this._tileCanvas) {
      ctx.drawImage(this._tileCanvas, 0, HUD);
    }

    const nearLoc = this._player.nearEntrance(LOCATIONS);
    const nearPiazzaNpc = this._getNearestPiazzaNpc(nearLoc);
    const occLoc = this._getPlayerOcclusionLocation();

    for (const loc of LOCATIONS) {
      if (loc.style === "piazza") continue;
      this._drawBuilding3D(ctx, loc, nearLoc?.id === loc.id);
    }

    this._renderFountain(ctx);
    this._renderAmbientEffects(ctx);
    this._renderEntranceMarkers(ctx, nearLoc);
    this._renderInteractionCue(ctx, nearLoc, nearPiazzaNpc);
    this._renderNpcs(ctx, nearLoc, nearPiazzaNpc);
    this._renderLocationLabels(ctx, nearLoc);
    this._renderPlayer(ctx);
    this._renderRoofOcclusion(ctx, occLoc);

    this._renderHudOverlay(ctx);

    if (!this._game.context.day?.canExplore()) {
      this._renderLessonGate(ctx);
    }
  }

  handleInput(event) {
    if (!this._game) return;

    const isKey = event.type === "keydown";
    const isTap = event.type === "pointerdown" || event.type === "touchstart";
    const isConfirm = (isKey && event.key === "Enter") || isTap;

    if (!isKey && !isTap) return;

    if (!this._game.context.day.canExplore() && isConfirm) {
      this._game.context.scenes.go("lesson", this._game);
      return;
    }

    if (this._game.context.day.canExplore() && isConfirm) {
      const loc = this._player.nearEntrance(LOCATIONS);
      if (loc) {
        if (loc.style === "piazza" && loc.npcSlots?.length) {
          const nearPiazzaNpc = this._getNearestPiazzaNpc(loc);
          if (!nearPiazzaNpc) return;
          this._game.context.scenes.go("dialogue", this._game, {
            npcId: nearPiazzaNpc.id,
            returnScene: "map",
          });
        } else {
          this._game.context.scenes.go("location", this._game, { location: loc });
        }
      }
      return;
    }

    if (this._game.context.day.canExplore() && isKey && (event.key === "n" || event.key === "N")) {
      this._game.context.day.endDay(this._game.context.bus);
      if (!this._game.context.day.gameComplete) {
        this._game.context.scenes.go("lesson", this._game);
      }
    }
  }

  _buildTileCache() {
    this._tileCanvas = document.createElement("canvas");
    this._tileCanvas.width = COLS * TS;
    this._tileCanvas.height = ROWS * TS;
    const tc = this._tileCanvas.getContext("2d");

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = TILE_MAP[row][col];
        const x = col * TS;
        const y = row * TS;

        tc.fillStyle = TILE_PALETTE[tile] ?? TILE_PALETTE[TILE.BUILDING];
        tc.fillRect(x, y, TS, TS);

        switch (tile) {
          case TILE.STREET:
            this._drawStreetTile(tc, x, y, col, row);
            break;
          case TILE.PIAZZA:
            this._drawPiazzaTile(tc, x, y, col, row);
            break;
          case TILE.PORTICO:
            this._drawPorticoTile(tc, x, y, col);
            break;
          case TILE.GRASS:
            this._drawGrassTile(tc, x, y, col, row);
            break;
          case TILE.BUILDING:
            this._drawBuildingTile(tc, x, y, col, row);
            break;
          case TILE.FOUNTAIN:
            this._drawPiazzaTile(tc, x, y, col, row);
            break;
          default:
            break;
        }
      }
    }

    this._drawStreetBorders(tc);
    this._drawProps(tc);
    this._drawPiazzaMotif(tc);
  }

  _drawPiazzaMotif(tc) {
    // Piazza Maggiore-inspired geometric paving in the center.
    const cx0 = 9 * TS;
    const cy0 = 5 * TS;
    const cw = 7 * TS;
    const ch = 3 * TS;

    tc.save();

    // Soft raised-looking platform area.
    tc.fillStyle = "rgba(186, 152, 108, 0.14)";
    tc.fillRect(cx0, cy0, cw, ch);
    tc.strokeStyle = "rgba(126, 96, 64, 0.28)";
    tc.lineWidth = 1;
    tc.strokeRect(cx0 + 0.5, cy0 + 0.5, cw - 1, ch - 1);

    // Repeating rectangular stone motif.
    tc.strokeStyle = "rgba(164, 126, 86, 0.38)";
    for (let y = cy0 + 10; y < cy0 + ch - 8; y += 22) {
      for (let x = cx0 + 10; x < cx0 + cw - 12; x += 24) {
        tc.strokeRect(x, y, 16, 10);
      }
    }

    // Cross lines to echo historic stone tiling.
    tc.strokeStyle = "rgba(184, 150, 110, 0.26)";
    tc.beginPath();
    tc.moveTo(cx0 + cw / 2, cy0 + 4);
    tc.lineTo(cx0 + cw / 2, cy0 + ch - 4);
    tc.moveTo(cx0 + 6, cy0 + ch / 2);
    tc.lineTo(cx0 + cw - 6, cy0 + ch / 2);
    tc.stroke();

    tc.restore();
  }

  _drawStreetTile(tc, x, y, col, row) {
    tc.strokeStyle = "rgba(60, 48, 32, 0.18)";
    tc.lineWidth = 0.5;

    tc.beginPath();
    tc.moveTo(x, y + TS / 2);
    tc.lineTo(x + TS, y + TS / 2);
    tc.stroke();

    const offset = (row % 2) * (TS / 2);
    tc.beginPath();
    tc.moveTo(x + offset, y);
    tc.lineTo(x + offset, y + TS / 2);
    tc.stroke();
    tc.beginPath();
    tc.moveTo(x + offset + TS / 2, y + TS / 2);
    tc.lineTo(x + offset + TS / 2, y + TS);
    tc.stroke();

    const noiseVal = ((col * 7 + row * 13) % 17) / 240;
    tc.fillStyle = `rgba(0,0,0,${noiseVal})`;
    tc.fillRect(x, y, TS, TS);
  }

  _drawPiazzaTile(tc, x, y, col, row) {
    tc.strokeStyle = "rgba(150, 126, 90, 0.14)";
    tc.lineWidth = 0.5;

    if (col % 3 === 0) {
      tc.beginPath();
      tc.moveTo(x, y);
      tc.lineTo(x, y + TS);
      tc.stroke();
    }
    if (row % 2 === 0) {
      tc.beginPath();
      tc.moveTo(x, y);
      tc.lineTo(x + TS, y);
      tc.stroke();
    }

    if ((col + row) % 3 === 0) {
      tc.fillStyle = "rgba(255, 245, 198, 0.06)";
      tc.fillRect(x, y, TS, TS);
    }
    if (col >= 10 && col <= 14 && row >= 5 && row <= 7) {
      tc.fillStyle = "rgba(255, 236, 180, 0.16)";
      tc.fillRect(x, y, TS, TS);
    }

    // Subtle piazza perimeter to read as a defined civic square.
    const isPiazzaEdge = (col === 8 || col === 16 || row === 4 || row === 7);
    if (isPiazzaEdge) {
      tc.strokeStyle = "rgba(138, 112, 76, 0.22)";
      tc.lineWidth = 1;
      tc.strokeRect(x + 0.5, y + 0.5, TS - 1, TS - 1);
    }
  }

  _drawPorticoTile(tc, x, y, col) {
    tc.fillStyle = "rgba(42, 32, 20, 0.24)";
    tc.fillRect(x, y, TS, TS);

    const grad = tc.createLinearGradient(x, y, x, y + 12);
    grad.addColorStop(0, "rgba(20, 14, 8, 0.24)");
    grad.addColorStop(1, "rgba(15, 10, 5, 0)");
    tc.fillStyle = grad;
    tc.fillRect(x, y, TS, 12);

    // Keep arcades subtle: no heavy columns painted into the street tile.
    tc.strokeStyle = "rgba(96, 78, 56, 0.22)";
    tc.lineWidth = 0.7;
    tc.beginPath();
    tc.arc(x + TS / 2, y + TS * 0.62, TS * 0.26, Math.PI, Math.PI * 2);
    tc.stroke();

    tc.strokeStyle = "rgba(70, 55, 35, 0.15)";
    tc.lineWidth = 0.5;
    tc.beginPath();
    tc.moveTo(x, y + TS * 0.6);
    tc.lineTo(x + TS, y + TS * 0.6);
    tc.stroke();
  }

  _drawGrassTile(tc, x, y, col, row) {
    const r = ((col * 3 + row * 7) % 13) / 13;
    tc.fillStyle = r > 0.5 ? "rgba(60, 88, 42, 0.25)" : "rgba(40, 62, 30, 0.18)";
    tc.fillRect(x, y, TS, TS);
  }

  _drawBuildingTile(tc, x, y, col, row) {
    // Background roof texture for non-enterable filler cells.
    tc.fillStyle = "rgba(62, 48, 38, 0.72)";
    tc.fillRect(x, y, TS, TS);

    tc.strokeStyle = "rgba(140, 110, 84, 0.16)";
    tc.lineWidth = 0.6;
    for (let yy = y + 5; yy < y + TS; yy += 6) {
      tc.beginPath();
      tc.moveTo(x + 1, yy);
      tc.lineTo(x + TS - 1, yy);
      tc.stroke();
    }

    const noise = ((col * 11 + row * 17) % 9) / 70;
    tc.fillStyle = `rgba(0,0,0,${noise})`;
    tc.fillRect(x, y, TS, TS);
  }

  _drawStreetBorders(tc) {
    tc.save();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = TILE_MAP[row][col];
        if (tile !== TILE.STREET && tile !== TILE.PIAZZA && tile !== TILE.PORTICO) continue;

        const x = col * TS;
        const y = row * TS;
        if (row > 0 && TILE_MAP[row - 1][col] === TILE.BUILDING) {
          const grad = tc.createLinearGradient(x, y, x, y + 12);
          const alpha = tile === TILE.PIAZZA ? 0.12 : 0.33;
          grad.addColorStop(0, `rgba(18, 12, 6, ${alpha})`);
          grad.addColorStop(1, "rgba(18, 12, 6, 0)");
          tc.fillStyle = grad;
          tc.fillRect(x, y, TS, 12);
        }
        if (col > 0 && TILE_MAP[row][col - 1] === TILE.BUILDING) {
          const grad = tc.createLinearGradient(x, y, x + 8, y);
          const alpha = tile === TILE.PIAZZA ? 0.09 : 0.24;
          grad.addColorStop(0, `rgba(18, 12, 6, ${alpha})`);
          grad.addColorStop(1, "rgba(18, 12, 6, 0)");
          tc.fillStyle = grad;
          tc.fillRect(x, y, 8, TS);
        }
      }
    }
    tc.restore();
  }

  _drawProps(tc) {
    for (const prop of MAP_PROPS) {
      const x = prop.col * TS;
      const y = prop.row * TS;

      switch (prop.type) {
        case "stall_red":
          this._drawStall(tc, x, y, "#cc2818", "#e84030");
          break;
        case "stall_green":
          this._drawStall(tc, x, y, "#1a8830", "#30b838");
          break;
        case "stall_yellow":
          this._drawStall(tc, x, y, "#c88810", "#e8a820");
          break;
        case "crate":
          tc.fillStyle = "#8a7040";
          tc.fillRect(x + 8, y + 10, 16, 14);
          tc.strokeStyle = "#6a5030";
          tc.strokeRect(x + 8, y + 10, 16, 14);
          break;
        case "basket":
          tc.fillStyle = "#a08848";
          tc.beginPath();
          tc.ellipse(x + 16, y + 20, 8, 5, 0, 0, Math.PI * 2);
          tc.fill();
          break;
        case "barrel":
          tc.fillStyle = "#6a4828";
          tc.fillRect(x + 10, y + 8, 12, 18);
          tc.strokeStyle = "#8a6838";
          tc.beginPath();
          tc.moveTo(x + 10, y + 14);
          tc.lineTo(x + 22, y + 14);
          tc.moveTo(x + 10, y + 20);
          tc.lineTo(x + 22, y + 20);
          tc.stroke();
          break;
        case "bread_rack":
          tc.fillStyle = "#866236";
          tc.fillRect(x + 4, y + 12, 24, 12);
          tc.fillStyle = "#d8b270";
          tc.beginPath();
          tc.ellipse(x + 10, y + 16, 4, 2.2, 0, 0, Math.PI * 2);
          tc.ellipse(x + 16, y + 18, 4.5, 2.4, 0, 0, Math.PI * 2);
          tc.ellipse(x + 22, y + 16, 4, 2.2, 0, 0, Math.PI * 2);
          tc.fill();
          break;
        case "chalk_board":
          tc.fillStyle = "#5a3e28";
          tc.fillRect(x + 10, y + 10, 12, 16);
          tc.fillStyle = "#1f2f24";
          tc.fillRect(x + 11, y + 11, 10, 12);
          tc.strokeStyle = "rgba(230,230,210,0.5)";
          tc.beginPath();
          tc.moveTo(x + 13, y + 15);
          tc.lineTo(x + 19, y + 15);
          tc.moveTo(x + 13, y + 18);
          tc.lineTo(x + 18, y + 18);
          tc.stroke();
          break;
        case "cafe_table":
          tc.fillStyle = "#dac9a8";
          tc.beginPath();
          tc.ellipse(x + 16, y + 16, 10, 7, 0, 0, Math.PI * 2);
          tc.fill();
          tc.fillStyle = "#7a6040";
          tc.fillRect(x + 15, y + 16, 2, 8);
          break;
        case "chair_set":
          tc.fillStyle = "#7a6048";
          tc.fillRect(x + 8, y + 18, 6, 4);
          tc.fillRect(x + 18, y + 18, 6, 4);
          tc.fillRect(x + 8, y + 14, 6, 2);
          tc.fillRect(x + 18, y + 14, 6, 2);
          break;
        case "umbrella":
          tc.fillStyle = "#8b3020";
          tc.beginPath();
          tc.arc(x + 16, y + 13, 10, Math.PI, Math.PI * 2);
          tc.fill();
          tc.fillStyle = "#5f4630";
          tc.fillRect(x + 15, y + 13, 2, 12);
          break;
        case "bench_modern":
          tc.fillStyle = "#6e5943";
          tc.fillRect(x + 5, y + 18, 22, 4);
          tc.fillRect(x + 5, y + 12, 22, 3);
          tc.fillStyle = "#554433";
          tc.fillRect(x + 6, y + 15, 2, 7);
          tc.fillRect(x + 24, y + 15, 2, 7);
          break;
        case "planter":
          tc.fillStyle = "#8a8278";
          tc.fillRect(x + 8, y + 16, 16, 10);
          tc.fillStyle = "#4a8a3a";
          tc.beginPath();
          tc.arc(x + 12, y + 14, 5, 0, Math.PI * 2);
          tc.arc(x + 19, y + 13, 4, 0, Math.PI * 2);
          tc.fill();
          break;
        case "tree_small":
          tc.fillStyle = "#5f4630";
          tc.fillRect(x + 14, y + 16, 4, 10);
          tc.fillStyle = "#3f7f3d";
          tc.beginPath();
          tc.arc(x + 16, y + 14, 8, 0, Math.PI * 2);
          tc.fill();
          break;
        case "bike":
          tc.strokeStyle = "#44505a";
          tc.lineWidth = 1.2;
          tc.beginPath();
          tc.arc(x + 10, y + 22, 4, 0, Math.PI * 2);
          tc.arc(x + 22, y + 22, 4, 0, Math.PI * 2);
          tc.moveTo(x + 10, y + 22);
          tc.lineTo(x + 16, y + 16);
          tc.lineTo(x + 22, y + 22);
          tc.stroke();
          break;
        case "lamp_post":
          tc.fillStyle = "#5f5b58";
          tc.fillRect(x + 15, y + 9, 2, 16);
          tc.fillStyle = "#e8d38c";
          tc.beginPath();
          tc.arc(x + 16, y + 8, 3, 0, Math.PI * 2);
          tc.fill();
          break;
        default:
          break;
      }
    }
  }

  _drawStall(tc, x, y, color1, color2) {
    tc.fillStyle = "#8a7040";
    tc.fillRect(x + 2, y + 14, 28, 14);

    for (let s = 0; s < 4; s++) {
      tc.fillStyle = s % 2 === 0 ? color1 : color2;
      tc.fillRect(x + s * 8, y + 4, 8, 10);
    }

    tc.fillStyle = color2;
    for (let s = 0; s < 8; s++) {
      tc.beginPath();
      tc.arc(x + 2 + s * 4, y + 14, 2, 0, Math.PI);
      tc.fill();
    }
  }

  _drawBuildingShadow(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 4, y + h - 2, w + 2, 7);
  }

  _drawBuilding3D(ctx, loc, isNear) {
    const palette = BUILDING_STYLES[loc.style] ?? BUILDING_STYLES.default;
    const x = loc.bx * TS;
    const y = HUD + loc.by * TS;
    const w = loc.bw * TS;
    const h = loc.bh * TS;
    const roofLift = 6;
    const wallY = y + 2;
    const wallH = h - 2;

    ctx.save();
    this._drawBuildingShadow(ctx, x, wallY, w, wallH);
    this._drawRoofLayer(ctx, palette, x, y - roofLift, w, h, loc.style);
    this._drawWallLayers(ctx, palette, x, wallY, w, wallH, isNear, loc);
    this._drawOpenings(ctx, palette, loc, x, wallY, w, wallH, isNear);

    if (isNear) {
      ctx.strokeStyle = "rgba(230, 200, 100, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, wallY + 0.5, w - 1, wallH - 1);
    }

    ctx.restore();
  }

  _drawRoofLayer(ctx, palette, x, y, w, h, style) {
    const depth = 4;
    const roofLight = this._mixColor(palette.roof, "#f5e4bf", 0.28);
    const roofMid = palette.roof;
    const roofDark = this._mixColor(palette.roof, "#24180f", 0.34);

    // Right strip for fake thickness.
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.moveTo(x + w, y + 2);
    ctx.lineTo(x + w + depth, y - depth + 2);
    ctx.lineTo(x + w + depth, y + h - depth - 2);
    ctx.lineTo(x + w, y + h - 2);
    ctx.closePath();
    ctx.fill();

    if (palette.roofType === "gable") {
      ctx.fillStyle = roofMid;
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 3);
      ctx.lineTo(x + w / 2, y - 8);
      ctx.lineTo(x + w + 2, y + 3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = roofLight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 8);
      ctx.lineTo(x + w / 2, y + 3);
      ctx.stroke();
    } else if (palette.roofType === "hip") {
      ctx.fillStyle = roofMid;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 3);
      ctx.lineTo(x + w / 2, y - 5);
      ctx.lineTo(x + w - 4, y + 3);
      ctx.lineTo(x + w - 2, y + 6);
      ctx.lineTo(x + 2, y + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = roofMid;
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + depth, y - depth + 2);
      ctx.lineTo(x + w + depth, y - depth + 2);
      ctx.lineTo(x + w, y + 2);
      ctx.closePath();
      ctx.fill();
    }

    if (style === "library") {
      ctx.fillStyle = roofDark;
      ctx.fillRect(x + 8, y + 4, w - 16, 2);
    }
  }

  _drawWallLayers(ctx, palette, x, y, w, h, isNear, loc) {
    // Top-left light direction: left/top lighter, right darker.
    const wallLight = this._mixColor(palette.base, "#f4e1ba", 0.16);
    const wallMid = palette.base;
    const wallDark = this._mixColor(palette.base, "#1f1610", 0.22);

    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, wallLight);
    grad.addColorStop(0.68, wallMid);
    grad.addColorStop(1, wallDark);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    if (isNear) {
      ctx.fillStyle = "rgba(255, 240, 190, 0.08)";
      ctx.fillRect(x, y, w, h);
    }

    this._drawFacadeDetails(ctx, loc, palette, x, y, w, h);

    ctx.strokeStyle = "rgba(0,0,0,0.07)";
    ctx.lineWidth = 0.5;
    for (let ly = y + 8; ly < y + h - 2; ly += 6) {
      ctx.beginPath();
      ctx.moveTo(x + 1, ly);
      ctx.lineTo(x + w - 1, ly);
      ctx.stroke();
    }

    if (h > 48) {
      ctx.fillStyle = palette.base2;
      ctx.fillRect(x, y + h - h / 3, w, h / 3);
      ctx.fillStyle = palette.trim;
      ctx.fillRect(x, y + h - h / 3 - 1, w, 2);
    }

    ctx.fillStyle = palette.trim;
    ctx.fillRect(x, y, w, 3);
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(x + w - 3, y + 3, 3, h - 5);
  }

  _drawOpenings(ctx, palette, loc, x, y, w, h, isNear) {
    const winGap = loc.style === "library" ? 14 : 16;
    const winCount = Math.max(1, Math.floor((w - 16) / winGap));
    const winStartX = x + (w - winCount * winGap) / 2 + 4;
    this._drawWindowRow(ctx, winStartX, y + 8, winCount, winGap, 5, 7, palette, Boolean(palette.awning));
    if (h > 56) {
      this._drawWindowRow(ctx, winStartX, y + h - h / 3 + 6, winCount, winGap, 5, 6, palette, false);
    }

    const doorCX = loc.entrance.col * TS + TS / 2;
    const doorW = 11;
    const doorH = 17;
    const doorX = doorCX - doorW / 2;
    const doorY = y + h - doorH;

    // Door frame and lintel shadow.
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(doorX - 2, doorY - 3, doorW + 4, doorH + 3);
    ctx.fillStyle = this._mixColor(palette.door, "#120e09", 0.28);
    ctx.fillRect(doorX - 1, doorY - 1, doorW + 2, doorH + 1);
    ctx.fillStyle = palette.door;
    ctx.fillRect(doorX, doorY, doorW, doorH);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(doorX + 2, doorY + 2, doorW - 4, doorH - 3);

    if (isNear) {
      ctx.strokeStyle = "#ffe6a6";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(doorX - 2, doorY - 2, doorW + 4, doorH + 4);
    }

    if (palette.awning) {
      const awW = 32;
      const awH = 10;
      const awX = doorCX - awW / 2;
      const awY = y + h - 20;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 === 0 ? palette.awning : palette.awning2;
        ctx.fillRect(awX + i * (awW / 5), awY, awW / 5 + 1, awH);
      }
      ctx.fillStyle = palette.awning2;
      for (let s = 0; s < Math.floor(awW / 4); s++) {
        ctx.beginPath();
        ctx.arc(awX + 2 + s * 4, awY + awH, 2, 0, Math.PI);
        ctx.fill();
      }
    }

    if (palette.sign && h > 40) {
      const signY = y + (palette.awning ? 6 : 8);
      const signW = Math.max(64, ctx.measureText(palette.sign).width + 16);
      const signX = x + w / 2 - signW / 2;

      ctx.fillStyle = "rgba(0,0,0,0.34)";
      this._roundedRect(ctx, signX + 1, signY - 7, signW, 15, 4);
      ctx.fill();

      const plate = ctx.createLinearGradient(0, signY - 7, 0, signY + 8);
      plate.addColorStop(0, "#f2dba7");
      plate.addColorStop(1, "#c9a86a");
      ctx.fillStyle = plate;
      this._roundedRect(ctx, signX, signY - 8, signW, 14, 4);
      ctx.fill();

      ctx.strokeStyle = "rgba(78, 54, 25, 0.72)";
      ctx.lineWidth = 1;
      this._roundedRect(ctx, signX, signY - 8, signW, 14, 4);
      ctx.stroke();

      ctx.font = "700 8px Georgia";
      ctx.textAlign = "center";
      ctx.fillStyle = "#4a2f15";
      ctx.fillText(palette.sign, x + w / 2, signY + 2);
      ctx.textAlign = "left";
    }
  }

  _renderBuildingBase(ctx, loc, isNear) {
    this._drawBuilding3D(ctx, loc, isNear);
  }

  _renderRoofOcclusion(ctx, occludingLoc) {
    if (!occludingLoc || occludingLoc.style === "piazza") return;
    this._renderBuildingRoof(ctx, occludingLoc);
  }

  _renderBuildingRoof(ctx, loc) {
    const palette = BUILDING_STYLES[loc.style] ?? BUILDING_STYLES.default;
    const x = loc.bx * TS;
    const y = HUD + loc.by * TS;
    const w = loc.bw * TS;
    const h = loc.bh * TS;

    ctx.save();
    this._drawRoofLayer(ctx, palette, x, y - 6, w, h, loc.style);
    ctx.restore();
  }

  _drawFacadeDetails(ctx, loc, palette, x, y, w, h) {
    switch (palette.facadeType) {
      case "arches": {
        const count = Math.max(2, Math.floor(w / 22));
        const gap = w / (count + 1);
        ctx.strokeStyle = "rgba(70, 42, 24, 0.5)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= count; i++) {
          const cx = x + i * gap;
          ctx.beginPath();
          ctx.arc(cx, y + h - 12, 6, Math.PI, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case "shutters": {
        ctx.fillStyle = "rgba(70, 28, 18, 0.35)";
        for (let wx = x + 10; wx < x + w - 10; wx += 18) {
          ctx.fillRect(wx - 3, y + 9, 2, 8);
          ctx.fillRect(wx + 5, y + 9, 2, 8);
        }
        break;
      }
      case "shopfront": {
        ctx.fillStyle = "rgba(255, 235, 200, 0.1)";
        const glassY = y + h - 20;
        ctx.fillRect(x + 6, glassY, w - 12, 10);
        ctx.strokeStyle = "rgba(80, 56, 26, 0.35)";
        ctx.strokeRect(x + 6, glassY, w - 12, 10);
        break;
      }
      case "classical": {
        ctx.fillStyle = "rgba(135, 142, 176, 0.32)";
        for (let cx = x + 8; cx < x + w - 8; cx += 12) {
          ctx.fillRect(cx, y + 6, 4, h - 14);
        }
        break;
      }
      case "academic": {
        ctx.strokeStyle = "rgba(45, 55, 55, 0.4)";
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 8);
        ctx.lineTo(x + w - 6, y + 8);
        ctx.moveTo(x + 6, y + h - 10);
        ctx.lineTo(x + w - 6, y + h - 10);
        ctx.stroke();
        break;
      }
      default:
        break;
    }

    if (loc.style === "library") {
      ctx.fillStyle = "rgba(215, 223, 250, 0.16)";
      ctx.fillRect(x + w / 2 - 14, y + h - 26, 28, 8);
    }
  }

  _drawWindowRow(ctx, startX, y, count, gap, w, h, palette, flowerBoxes) {
    for (let i = 0; i < count; i++) {
      const wx = startX + i * gap;
      ctx.fillStyle = "rgba(0,0,0,0.36)";
      ctx.fillRect(wx - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = "rgba(25, 28, 38, 0.45)";
      ctx.fillRect(wx, y, w, h);
      ctx.fillStyle = "rgba(245, 232, 190, 0.28)";
      ctx.fillRect(wx, y, w, 1.5);
      ctx.strokeStyle = "rgba(60, 45, 25, 0.45)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(wx + w / 2, y);
      ctx.lineTo(wx + w / 2, y + h);
      ctx.moveTo(wx, y + h / 2);
      ctx.lineTo(wx + w, y + h / 2);
      ctx.stroke();
      ctx.fillStyle = palette.trim;
      ctx.fillRect(wx - 2, y, 2, h);
      ctx.fillRect(wx + w, y, 2, h);
      ctx.fillRect(wx - 2, y + h, w + 4, 2);
      if (flowerBoxes && i % 2 === 0) {
        ctx.fillStyle = "#5a3a1a";
        ctx.fillRect(wx - 1, y + h + 2, w + 2, 3);
      }
    }
  }

  _renderFountain(ctx) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (TILE_MAP[row][col] !== TILE.FOUNTAIN) continue;

        const cx = col * TS + TS / 2;
        const cy = HUD + row * TS + TS / 2;
        const t = this._time;

        ctx.save();
        // Plinth footprint around the fountain base.
        this._roundedRect(ctx, cx - 22, cy + 6, 44, 16, 4);
        ctx.fillStyle = "rgba(120, 104, 86, 0.22)";
        ctx.fill();
        ctx.strokeStyle = "rgba(168, 146, 118, 0.36)";
        ctx.lineWidth = 1;
        this._roundedRect(ctx, cx - 22, cy + 6, 44, 16, 4);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 7, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#7a8688";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 4, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5f7f96";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animated water shimmer in basin.
        ctx.fillStyle = "rgba(170, 210, 240, 0.32)";
        ctx.beginPath();
        ctx.ellipse(cx + Math.sin(t * 2.2) * 2.3, cy + 2, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Central pedestal + statue silhouette.
        ctx.fillStyle = "#879091";
        ctx.fillRect(cx - 3, cy - 11, 6, 15);
        ctx.fillStyle = "#6f7d7f";
        ctx.beginPath();
        ctx.ellipse(cx, cy - 9, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Four little jets (animated) inspired by Fontana del Nettuno style.
        ctx.strokeStyle = "rgba(188, 225, 250, 0.55)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const a = i * (Math.PI / 2) + t * 0.8;
          const sx = cx + Math.cos(a) * 4;
          const sy = cy - 6 + Math.sin(a * 1.3) * 1.2;
          const ex = cx + Math.cos(a) * 10;
          const ey = cy - 2 + Math.sin(t * 3 + i) * 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo((sx + ex) / 2, sy - 3, ex, ey);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  }

  _renderEntranceMarkers(ctx, nearLoc) {
    for (const loc of LOCATIONS) {
      const ex = loc.entrance.col * TS + TS / 2;
      const ey = HUD + loc.entrance.row * TS + TS / 2;
      const isNear = nearLoc?.id === loc.id;
      if (isNear) {
        ctx.fillStyle = "rgba(200, 170, 80, 0.25)";
        ctx.beginPath();
        ctx.arc(ex, ey, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = isNear ? "#ffe39a" : "rgba(240, 220, 170, 0.24)";
      ctx.beginPath();
      ctx.arc(ex, ey, isNear ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderInteractionCue(ctx, nearLoc, nearPiazzaNpc) {
    if (!nearLoc) return;

    const anchor = nearPiazzaNpc && nearLoc.style === "piazza"
      ? { x: nearPiazzaNpc.x, y: nearPiazzaNpc.y - 2, label: "TALK" }
      : { x: nearLoc.entrance.col * TS + TS / 2, y: HUD + nearLoc.entrance.row * TS + TS / 2, label: "ENTER" };
    const bob = Math.sin(this._time * 5) * 2;

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 11px Georgia";
    ctx.fillStyle = "rgba(14, 22, 30, 0.8)";
    this._roundedRect(ctx, anchor.x - 24, anchor.y - 34 + bob, 48, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#ffe7ac";
    ctx.fillText(anchor.label, anchor.x, anchor.y - 22 + bob);
    ctx.restore();

    // Player-adjacent cue for readability on mobile.
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "700 10px Georgia";
    ctx.fillStyle = "rgba(255, 232, 170, 0.9)";
    ctx.fillText(anchor.label === "TALK" ? "Talk" : "Enter", this._player.x, this._player.y - 18 + bob * 0.5);
    ctx.restore();
  }

  _renderLocationLabels(ctx, nearLoc) {
    for (const loc of LOCATIONS) {
      const isNear = nearLoc?.id === loc.id;
      const cx = (loc.bx + loc.bw / 2) * TS;
      const cy = HUD + loc.by * TS + (loc.style === "piazza" ? loc.bh * TS / 2 - 8 : -6);
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = isNear ? "700 11px Georgia" : "600 10px Georgia";
      ctx.fillStyle = isNear ? "#fff5d0" : "rgba(240, 230, 210, 0.72)";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.fillText(loc.label, cx, cy);
      ctx.restore();
    }
  }

  _renderPlayer(ctx) {
    const p = this._player;
    const walkT = this._time * 10;
    const step = p.moving ? Math.sin(walkT) : 0;
    const bob = p.moving ? Math.abs(Math.sin(walkT)) * 1.6 : (Math.sin(this._time * 2) * 0.7);
    const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing] ?? [0, 1];

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 12, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    this._drawCharacter(ctx, {
      x: p.x,
      y: p.y - bob,
      facing: p.facing,
      step,
      scale: 1,
      body: "#4bc4e8",
      head: "#f2c290",
      outline: "#11202b",
      accent: "#f7f7f7",
    });
    ctx.restore();
  }

  _renderNpcs(ctx, nearLoc, nearPiazzaNpc) {
    const NPC_COLORS = {
      lucia_ferrante: "#d86848",
      giorgio_neri: "#5888b8",
      elena_bianchi: "#b868a8",
      marco_verdini: "#48a858",
      donna_rosa: "#c87848",
      prof_conti: "#7878a8",
    };

    for (const loc of LOCATIONS) {
      if (!loc.npcSlots?.length) continue;
      if (loc.style !== "piazza") continue;
      const ex = loc.entrance.col * TS + TS / 2;
      const ey = HUD + loc.entrance.row * TS + TS / 2;
      const spacing = 28;

      for (let i = 0; i < loc.npcSlots.length; i++) {
        const npcId = loc.npcSlots[i];
        const offsetX = (i - (loc.npcSlots.length - 1) / 2) * spacing;
        const offsetY = i % 2 === 0 ? -2 : 3;
        const nx = ex + offsetX;
        const ny = ey - 4 + offsetY;
        const step = Math.sin(this._time * 6 + i * 0.9) * 0.7;
        const facing = i % 2 === 0 ? "left" : "right";

        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(nx, ny + 9, 7, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        this._drawCharacter(ctx, {
          x: nx,
          y: ny,
          facing,
          step,
          scale: 0.82,
          body: NPC_COLORS[npcId] ?? "#a0a0a0",
          head: "#e7bd93",
          outline: "#1f2730",
          accent: "#f2e8cf",
        });

        if (nearPiazzaNpc?.id === npcId) {
          ctx.strokeStyle = "rgba(240, 220, 120, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(nx, ny, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }

  _renderAmbientEffects(ctx) {
    // Large directional shadow sweep (top-left light), inspired by the real piazza mood.
    ctx.save();
    const shade = ctx.createLinearGradient(7 * TS, HUD + 4 * TS, 16 * TS, HUD + 9 * TS);
    shade.addColorStop(0, "rgba(36, 24, 14, 0.18)");
    shade.addColorStop(1, "rgba(36, 24, 14, 0)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(8 * TS, HUD + 4.2 * TS);
    ctx.lineTo(14.8 * TS, HUD + 4.2 * TS);
    ctx.lineTo(16.3 * TS, HUD + 8.2 * TS);
    ctx.lineTo(9.2 * TS, HUD + 8.2 * TS);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Café lantern flicker near entrance.
    const cafe = LOCATIONS.find((l) => l.id === "caffe_bologna");
    if (cafe?.entrance) {
      const ex = cafe.entrance.col * TS + TS / 2;
      const ey = HUD + cafe.entrance.row * TS + TS / 2;
      const pulse = 0.4 + (Math.sin(this._time * 9) + 1) * 0.17;

      ctx.save();
      const glow = ctx.createRadialGradient(ex, ey - 12, 1, ex, ey - 12, 18);
      glow.addColorStop(0, `rgba(255, 210, 120, ${pulse})`);
      glow.addColorStop(1, "rgba(255, 210, 120, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ex, ey - 12, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Lightweight moving passer-by in piazza.
    const px = 9 * TS + ((this._time * 34) % (6 * TS));
    const py = HUD + 6.5 * TS + Math.sin(this._time * 2.1) * 4;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 5, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    this._drawCharacter(ctx, {
      x: px,
      y: py,
      facing: "right",
      step: Math.sin(this._time * 8),
      scale: 0.66,
      body: "#8ec37d",
      head: "#e6c09a",
      outline: "#1f2a2e",
      accent: "#f5f2dc",
    });
    ctx.restore();
  }

  _drawCharacter(ctx, opts) {
    const { x, y, facing, step, scale, body, head, outline, accent } = opts;
    const s = scale;
    const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[facing] ?? [0, 1];
    const armSwing = step * 1.8 * s;
    const legSwing = step * 2.2 * s;

    ctx.save();
    ctx.translate(x, y);

    ctx.lineCap = "round";
    ctx.lineWidth = 2 * s;
    ctx.strokeStyle = outline;

    // Legs
    ctx.beginPath();
    ctx.moveTo(-2 * s, 4 * s);
    ctx.lineTo(-3 * s - legSwing, 11 * s);
    ctx.moveTo(2 * s, 4 * s);
    ctx.lineTo(3 * s + legSwing, 11 * s);
    ctx.stroke();

    // Torso
    ctx.fillStyle = body;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.2 * s;
    ctx.fillRect(-5.5 * s, -2 * s, 11 * s, 10 * s);
    ctx.strokeRect(-5.5 * s, -2 * s, 11 * s, 10 * s);

    // Arms
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(-5 * s, 1 * s);
    ctx.lineTo(-8 * s, 2 * s + armSwing);
    ctx.moveTo(5 * s, 1 * s);
    ctx.lineTo(8 * s, 2 * s - armSwing);
    ctx.stroke();

    // Head
    ctx.fillStyle = head;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.arc(0, -8 * s, 4.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Face direction cue
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(dir[0] * 1.9 * s, -8 * s + dir[1] * 0.8 * s, 1.1 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _renderHudOverlay(ctx) {
    const p = this._player;
    const W = COLS * TS;
    const clueCount = this._game.context.quest?.getUnlockedClues()?.length ?? 0;
    const questText = this._game.context.quest?.getQuestSummary?.() ?? "No quest";

    ctx.save();

    // Center-top panel sits in the middle roof gap so it does not cover active buildings.
    const panelW = 204;
    const panelH = 42;
    const panelX = Math.floor((W - panelW) / 2);
    const panelY = 6;

    const bg = ctx.createLinearGradient(0, panelY, 0, panelY + panelH);
    bg.addColorStop(0, "rgba(86, 61, 38, 0.86)");
    bg.addColorStop(1, "rgba(58, 40, 24, 0.86)");
    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.strokeStyle = "rgba(226, 199, 144, 0.34)";
    ctx.lineWidth = 1;
    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0,0,0,0.46)";
    ctx.shadowBlur = 2;

    const topLineY = panelY + 15;
    const bottomLineY = panelY + 31;
    const x = panelX + 10;

    ctx.font = "700 10px Georgia";
    ctx.fillStyle = "#f0b060";
    ctx.fillText(`\u26A1 ${p.energy}/${p.maxEnergy}`, x, topLineY);
    ctx.fillStyle = "#e8d060";
    ctx.fillText(`\uD83D\uDCB0 ${p.coins}`, x + 62, topLineY);
    ctx.fillStyle = "#90c8e0";
    ctx.fillText(`\uD83D\uDD0D ${clueCount}`, x + 118, topLineY);

    if (this._hudFlash.quest > 0) {
      ctx.fillStyle = `rgba(170, 230, 150, ${0.18 * this._hudFlash.quest})`;
      ctx.fillRect(panelX + 6, bottomLineY - 10, panelW - 12, 12);
    }
    ctx.fillStyle = "#e9d8af";
    ctx.fillText(this._fitHudText(ctx, `Quest: ${questText}`, panelW - 20), x, bottomLineY);

    ctx.restore();
  }

  _renderLessonGate(ctx) {
    const width = COLS * TS;
    const height = ROWS * TS;
    ctx.fillStyle = "rgba(10, 18, 28, 0.82)";
    ctx.fillRect(0, HUD, width, height - HUD);
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 26px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Completa la lezione di oggi", width / 2, height / 2 - 14);
    ctx.font = "400 17px Georgia";
    ctx.fillStyle = "#a0b8c8";
    ctx.fillText("La mappa si sbloccherà dopo la lezione.", width / 2, height / 2 + 18);
    ctx.textAlign = "left";
  }

  _updatePanels() {
    if (!this._statusPanel) return;
    const loc = this._player.nearEntrance(LOCATIONS) ?? this._player.currentLocation(LOCATIONS);
    const nearPiazzaNpc = this._getNearestPiazzaNpc(loc);
    const questLine = this._game.context.quest.getQuestSummary();
    const clueCount = this._game.context.quest.getUnlockedClues().length;
    this._statusPanel.textContent = loc
      ? `${loc.label} — ${loc.description}${loc.style === "piazza" ? (nearPiazzaNpc ? ` (Enter to talk to ${nearPiazzaNpc.id.replace("_", " ")})` : " (Move closer to an NPC)") : " (Enter to go inside)"} | Quest: ${questLine} | Clues: ${clueCount}`
      : `Stai camminando per le strade di Bologna… | Quest: ${questLine} | Clues: ${clueCount}`;

    if (this._promptPanel) {
      const latest = this._game.context.eventFeed.latest();
      this._promptPanel.textContent = latest
        ? `Arrows/WASD move · Enter only near doors/NPCs · N end day | ${latest}`
        : "Arrows/WASD move · Enter only near doors/NPCs · N end day";
    }
  }

  _fitHudText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let out = text;
    while (out.length > 0 && ctx.measureText(`${out}...`).width > maxW) {
      out = out.slice(0, -1);
    }
    return `${out}...`;
  }

  _getPlayerOcclusionLocation() {
    return LOCATIONS.find((loc) => {
      if (loc.style === "piazza") return false;
      const x = loc.bx * TS;
      const y = HUD + loc.by * TS;
      const w = loc.bw * TS;
      const h = loc.bh * TS;
      const inX = this._player.x >= x && this._player.x <= x + w;
      const inYBand = this._player.y >= y - 4 && this._player.y <= y + h + 12;
      return inX && inYBand;
    }) ?? null;
  }

  _bindHudFeedback() {
    if (this._busHandlers.length || !this._game?.context?.bus) return;
    const bus = this._game.context.bus;

    const onQuest = () => { this._hudFlash.quest = 1; };
    const onClue = () => { this._hudFlash.clues = 1; };

    bus.on("QUEST_OBJECTIVE_PROGRESS", onQuest);
    bus.on("QUEST_COMPLETED", onQuest);
    bus.on("CLUE_UNLOCKED", onClue);

    this._busHandlers.push({ event: "QUEST_OBJECTIVE_PROGRESS", handler: onQuest });
    this._busHandlers.push({ event: "QUEST_COMPLETED", handler: onQuest });
    this._busHandlers.push({ event: "CLUE_UNLOCKED", handler: onClue });
  }

  _getNearestPiazzaNpc(loc, radius = 32) {
    if (!loc || loc.style !== "piazza" || !loc.npcSlots?.length) return null;

    const ex = loc.entrance.col * TS + TS / 2;
    const ey = HUD + loc.entrance.row * TS + TS / 2;
    const spacing = 28;

    let best = radius;
    let result = null;
    for (let i = 0; i < loc.npcSlots.length; i++) {
      const offsetX = (i - (loc.npcSlots.length - 1) / 2) * spacing;
      const offsetY = i % 2 === 0 ? -2 : 3;
      const nx = ex + offsetX;
      const ny = ey - 4 + offsetY;
      const d = Math.hypot(this._player.x - nx, this._player.y - ny);
      if (d < best) {
        best = d;
        result = { id: loc.npcSlots[i], x: nx, y: ny };
      }
    }

    return result;
  }

  _mixColor(hex, targetHex, amount) {
    const from = this._hexToRgb(hex);
    const to = this._hexToRgb(targetHex);
    const t = Math.max(0, Math.min(1, amount));
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }

  _hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const full = clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
    const n = Number.parseInt(full, 16);
    return {
      r: (n >> 16) & 255,
      g: (n >> 8) & 255,
      b: n & 255,
    };
  }

  _isPhoneLayout() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 840px)").matches;
  }

  _roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
