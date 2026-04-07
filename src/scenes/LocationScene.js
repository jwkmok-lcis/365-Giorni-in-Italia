// LocationScene – interior view of a location where the player walks to NPCs.
// Replaces the old Tab/Q/E NPC cycling; now you walk to an NPC and press Enter.

import { Scene } from "../engine/Scene.js";
import { DIALOGUES } from "../content/dialogues.js";
import { getIdleGreeting } from "../content/idleDialogues.js";
import { SHOP_ITEMS, SHOP_GREETINGS, SHOP_THANKS, SHOP_NO_MONEY } from "../content/shops.js";
import { Events } from "../engine/EventBus.js";

const CANVAS_W = 800;
const CANVAS_H = 450;
const SPEED_PPS = 160;
const NPC_RADIUS = 18;
const INTERACT_DIST = 48;

// Interior colour palettes keyed by location id
const INTERIOR_THEMES = {
  piazza_maggiore:     { floor: "#2a3d52", wall: "#1e2f42", accent: "#c89f3f" },
  mercato_di_mezzo:    { floor: "#2f4a34", wall: "#1e3426", accent: "#88b35a" },
  osteria_del_sole:    { floor: "#4a3129", wall: "#33221c", accent: "#d4763a" },
  biblioteca_salaborsa:{ floor: "#2d2d4a", wall: "#1f1f38", accent: "#7a8ac9" },
  via_zamboni:         { floor: "#303638", wall: "#222a2c", accent: "#8cc4d4" },
  caffe_bologna:       { floor: "#3e3426", wall: "#2a241a", accent: "#d4a84a" },
  panetteria_rossi:    { floor: "#4a3e26", wall: "#33291a", accent: "#d4b86a" },
};

const ORDER_VARIATIONS = {
  caffe_bologna: [
    { template: ["Vorrei", "un", "espresso"], en: "I would like an espresso." },
    { template: ["Un", "cappuccino", "per", "favore"], en: "A cappuccino, please." },
    { template: ["Posso", "avere", "un", "cornetto"], en: "Can I have a croissant?" },
  ],
  panetteria_rossi: [
    { template: ["Vorrei", "del", "pane"], en: "I would like some bread." },
    { template: ["Una", "focaccia", "per", "favore"], en: "A focaccia, please." },
    { template: ["Posso", "avere", "un", "panino"], en: "Can I have a sandwich?" },
  ],
};

export class LocationScene extends Scene {
  constructor() {
    super();
    this._game = null;
    this._location = null;
    this._npcPositions = []; // [{id, x, y, name}]
    this._playerX = 0;
    this._playerY = 0;
    this._playerFacing = "up";
    this._nearestNpc = null;
    this._moveTarget = null;
    this._time = 0;

    // Toast
    this._toast = null;
    this._toastTimer = 0;

    // Shop state (for shop locations)
    this._shopOpen = false;
    this._shopItemIndex = 0;
    this._shopItemRects = [];
    this._shopPhase = "menu";
    this._shopMessage = null;
    this._shopGreeting = null;
    this._shopGreetingIndex = {};
    this._orderGame = null;
  }

  enter(game, params = {}) {
    this._game = game;
    this._location = params.location;
    this._toast = null;
    this._toastTimer = 0;
    this._shopOpen = false;

    // Place NPCs evenly across the room
    const npcs = this._location.npcSlots || [];
    const spacing = CANVAS_W / (npcs.length + 1);
    this._npcPositions = npcs.map((id, i) => ({
      id,
      x: spacing * (i + 1),
      y: 180 + (i % 2) * 80, // stagger vertically
      name: DIALOGUES[id]?.npcName ?? id,
    }));

    // Player enters from the bottom
    this._playerX = CANVAS_W / 2;
    this._playerY = CANVAS_H - 50;
    this._playerFacing = "up";
    this._moveTarget = null;

    const panel = document.getElementById("statusPanel");
    if (panel) panel.textContent = `Inside: ${this._location.label} — Walk to an NPC and press Enter`;
    const prompt = document.getElementById("promptPanel");
    if (prompt) prompt.textContent = "Arrows/WASD move · Enter talk · Escape leave";
  }

  exit() {}

  update(dt, game) {
    this._time += dt;
    const { input } = game.context;

    if (this._shopOpen) return;

    // Toast countdown
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) this._toast = null;
    }

    // Movement
    const held = new Set();
    for (const key of ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","d","w","s"]) {
      if (input.isDown(key)) held.add(key);
    }

    if (held.size > 0) {
      this._moveTarget = null;
      this._applyMovement(held, dt);
    } else {
      this._applyClickMovement(dt);
    }

    // Find nearest NPC
    this._nearestNpc = null;
    let bestDist = INTERACT_DIST;
    for (const npc of this._npcPositions) {
      const dist = Math.hypot(npc.x - this._playerX, npc.y - this._playerY);
      if (dist < bestDist) {
        bestDist = dist;
        this._nearestNpc = npc;
      }
    }
  }

  handleInput(event) {
    if (event.type !== "keydown") return;

    if (this._shopOpen) {
      this._handleShopInput(event);
      return;
    }

    if (event.key === "Escape") {
      this._game.context.scenes.go("map", this._game);
      return;
    }

    if (event.key === "Enter") {
      this._triggerInteract();
    }
  }

  _triggerInteract() {
      if (!this._nearestNpc) return;

      // Shop location
      if (this._location.shop) {
        this._openShop();
        return;
      }

      // Story NPC — check quest relevance and energy
      const player = this._game.context.player;
      const npcId = this._nearestNpc.id;
      const objectiveNpcId = this._getCurrentObjectiveNpcId();
      const isQuestTarget = objectiveNpcId === npcId;

      if (!isQuestTarget) {
        // Idle greeting (free)
        const greeting = getIdleGreeting(npcId);
        if (greeting) {
          this._toast = `${this._nearestNpc.name}: "${greeting.it}" — ${greeting.en}`;
          this._toastTimer = 3.5;
        }
        return;
      }

      if (!player.canTalk()) {
        this._toast = "No energy! Buy food at Caffè Bologna or Panetteria Rossi.";
        this._toastTimer = 4;
        return;
      }

      player.spendEnergy(1);
      this._game.context.bus.emit(Events.ENERGY_CHANGED, { energy: player.energy });

      this._game.context.scenes.go("dialogue", this._game, {
        npcId,
        returnScene: "location",
        returnParams: { location: this._location },
      });
  }

  handlePointer(evt) {
    if (this._shopOpen) {
      if (evt.type === "mousedown") this._handleShopPointer(evt);
      return;
    }

    if (evt.type !== "mousedown" || evt.button !== 0) return;

    // Click an NPC directly
    for (const npc of this._npcPositions) {
      const dist = Math.hypot(npc.x - evt.canvasX, npc.y - evt.canvasY);
      if (dist < NPC_RADIUS + 8) {
        // If already close enough, interact immediately
        const playerDist = Math.hypot(npc.x - this._playerX, npc.y - this._playerY);
        if (playerDist < INTERACT_DIST && this._nearestNpc?.id === npc.id) {
          this._triggerInteract();
          return;
        }
        // Otherwise walk toward this NPC
        this._moveTarget = { x: npc.x, y: npc.y + NPC_RADIUS + 20 };
        return;
      }
    }

    // Tap on exit zone (bottom strip)
    if (evt.canvasY > CANVAS_H - 44) {
      this._game.context.scenes.go("map", this._game);
      return;
    }

    // Click to move
    const r = 12;
    this._moveTarget = {
      x: Math.max(r, Math.min(CANVAS_W - r, evt.canvasX)),
      y: Math.max(r + 40, Math.min(CANVAS_H - r - 44, evt.canvasY)),
    };
  }

  render(ctx) {
    const { width, height } = ctx.canvas;
    const theme = INTERIOR_THEMES[this._location.id] ?? INTERIOR_THEMES.piazza_maggiore;

    // ── Interior background ───────────────────────────────────────────
    // Wall (top third)
    ctx.fillStyle = theme.wall;
    ctx.fillRect(0, 0, width, 120);

    // Floor
    ctx.fillStyle = theme.floor;
    ctx.fillRect(0, 120, width, height - 120);

    // Floor tiles pattern
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 120; y < height; y += 48) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Wall-floor edge
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(width, 120); ctx.stroke();

    // ── Location title ────────────────────────────────────────────────
    ctx.fillStyle = theme.accent;
    ctx.font = "700 22px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(this._location.label, width / 2, 36);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "400 13px Georgia";
    ctx.fillText(this._location.description, width / 2, 56);

    this._renderInteriorDecor(ctx, this._location.style ?? this._location.id, theme);

    // ── Exit button (tappable on mobile) ──────────────────────────────
    ctx.fillStyle = "rgba(90, 70, 50, 0.85)";
    this._roundedRect(ctx, width / 2 - 54, height - 38, 108, 34, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(200, 180, 140, 0.5)";
    ctx.lineWidth = 1;
    this._roundedRect(ctx, width / 2 - 54, height - 38, 108, 34, 8);
    ctx.stroke();
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "600 14px Georgia";
    ctx.fillText("← Esci", width / 2, height - 16);

    ctx.textAlign = "left";

    // ── NPCs ──────────────────────────────────────────────────────────
    for (const npc of this._npcPositions) {
      const isNearest = this._nearestNpc?.id === npc.id;

      // NPC shadow
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(npc.x, npc.y + NPC_RADIUS + 2, NPC_RADIUS * 0.8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const walk = Math.sin((this._time ?? 0) * 7 + npc.x * 0.01) * 0.8;
      this._drawCharacter(ctx, {
        x: npc.x,
        y: npc.y,
        facing: npc.x < this._playerX ? "right" : "left",
        step: walk,
        scale: 0.92,
        body: isNearest ? "#9ed8a8" : "#7aabb4",
        head: "#efc69a",
        outline: "#1e2a33",
        accent: "#f3ede2",
      });

      if (isNearest) {
        ctx.strokeStyle = "#c6d88a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(npc.x, npc.y, NPC_RADIUS + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // NPC face
      ctx.fillStyle = "#1a2a32";
      ctx.beginPath();
      ctx.arc(npc.x - 5, npc.y - 4, 2.5, 0, Math.PI * 2);
      ctx.arc(npc.x + 5, npc.y - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(npc.x, npc.y + 4, 4, 0, Math.PI);
      ctx.stroke();

      // Name label
      ctx.fillStyle = isNearest ? "#eef5db" : "#d0e0e8";
      ctx.font = isNearest ? "700 14px Georgia" : "400 13px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(npc.name, npc.x, npc.y - NPC_RADIUS - 10);

      if (isNearest) {
        ctx.fillStyle = "#c6d88a";
        ctx.font = "400 12px Georgia";
        ctx.fillText("Press Enter to talk", npc.x, npc.y + NPC_RADIUS + 22);
      }
    }

    ctx.textAlign = "left";

    // ── Player ────────────────────────────────────────────────────────
    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(this._playerX, this._playerY + 11, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    this._drawCharacter(ctx, {
      x: this._playerX,
      y: this._playerY,
      facing: this._playerFacing,
      step: Math.sin((this._time ?? 0) * 8),
      scale: 1,
      body: "#4bc4e8",
      head: "#f2c290",
      outline: "#11202b",
      accent: "#f7f7f7",
    });

    // ── Move target indicator ─────────────────────────────────────────
    if (this._moveTarget) {
      ctx.save();
      ctx.strokeStyle = "rgba(173, 218, 193, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this._moveTarget.x, this._moveTarget.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Toast ─────────────────────────────────────────────────────────
    if (this._toast) {
      this._renderToast(ctx, this._toast);
    }

    // ── Shop overlay ──────────────────────────────────────────────────
    if (this._shopOpen) {
      this._renderShopOverlay(ctx);
    }
  }

  // ── Movement helpers ────────────────────────────────────────────────

  _applyMovement(held, dt) {
    let dx = 0, dy = 0;

    if (held.has("ArrowLeft")  || held.has("a")) { dx -= 1; this._playerFacing = "left";  }
    if (held.has("ArrowRight") || held.has("d")) { dx += 1; this._playerFacing = "right"; }
    if (held.has("ArrowUp")    || held.has("w")) { dy -= 1; this._playerFacing = "up";    }
    if (held.has("ArrowDown")  || held.has("s")) { dy += 1; this._playerFacing = "down";  }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this._playerX += (dx / len) * SPEED_PPS * dt;
      this._playerY += (dy / len) * SPEED_PPS * dt;

      const r = 12;
      this._playerX = Math.max(r, Math.min(CANVAS_W - r, this._playerX));
      this._playerY = Math.max(r + 80, Math.min(CANVAS_H - r - 30, this._playerY));
    }
  }

  _applyClickMovement(dt) {
    if (!this._moveTarget) return;

    const dx = this._moveTarget.x - this._playerX;
    const dy = this._moveTarget.y - this._playerY;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) { this._moveTarget = null; return; }

    const step = SPEED_PPS * dt;
    const ux = dx / dist;
    const uy = dy / dist;
    this._playerX += ux * Math.min(step, dist);
    this._playerY += uy * Math.min(step, dist);

    if (Math.abs(ux) > Math.abs(uy)) {
      this._playerFacing = ux > 0 ? "right" : "left";
    } else {
      this._playerFacing = uy > 0 ? "down" : "up";
    }
  }

  // ── Quest helper ────────────────────────────────────────────────────

  _getCurrentObjectiveNpcId() {
    const quest = this._game.context.quest.activeQuest;
    if (!quest) return null;
    const nextObj = quest.objectives.find((o) => !o.completed);
    if (!nextObj || nextObj.type !== "talkToNpc") return null;
    return nextObj.npcId;
  }

  // ── Toast ───────────────────────────────────────────────────────────

  _renderToast(ctx, message) {
    const { width } = ctx.canvas;
    ctx.save();
    const maxW = 680;
    ctx.font = "500 13px Georgia";
    const textW = Math.min(maxW, ctx.measureText(message).width + 24);
    const boxW = textW + 24;
    const boxH = 36;
    const boxX = (width - boxW) / 2;
    const boxY = 80;

    this._roundedRect(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.fillStyle = "rgba(30, 59, 67, 0.94)";
    ctx.fill();
    ctx.strokeStyle = "#9ec0cf";
    ctx.lineWidth = 1;
    this._roundedRect(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.stroke();

    ctx.fillStyle = "#f5eddc";
    ctx.font = "500 13px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(message, width / 2, boxY + 22, maxW);
    ctx.textAlign = "left";
    ctx.restore();
  }

  // ── Shop system (for shop locations) ────────────────────────────────

  _openShop() {
    this._shopOpen = true;
    this._shopItemIndex = 0;
    this._shopPhase = "menu";
    this._shopMessage = null;

    const npcId = this._nearestNpc.id;
    if (!this._shopGreetingIndex[npcId]) this._shopGreetingIndex[npcId] = 0;
    const greetings = SHOP_GREETINGS[npcId] ?? [];
    const idx = this._shopGreetingIndex[npcId] % Math.max(1, greetings.length);
    this._shopGreeting = greetings[idx] ?? { it: "Buongiorno!", en: "Good morning!" };
    this._shopGreetingIndex[npcId] = idx + 1;

    // Cafe/bakery start with a repeatable sentence-order mini game.
    if (ORDER_VARIATIONS[this._location.id]?.length) {
      this._startOrderGame();
      this._shopPhase = "order_build";
    }
  }

  _handleShopInput(event) {
    if (this._shopPhase === "order_build") {
      this._handleOrderBuildInput(event);
      return;
    }

    if (this._shopPhase === "order_result_ok") {
      if (event.key === "Enter") {
        this._shopPhase = "menu";
      } else if (event.key === "Escape") {
        this._shopOpen = false;
      }
      return;
    }

    if (this._shopPhase === "order_result_retry") {
      if (event.key === "Enter") {
        this._startOrderGame();
        this._shopPhase = "order_build";
      } else if (event.key === "Escape") {
        this._shopOpen = false;
      }
      return;
    }

    if (this._shopPhase !== "menu") {
      if (event.key === "Enter" || event.key === "Escape") {
        if (this._shopPhase === "bought") {
          this._shopOpen = false;
          this._game.context.scenes.go("lesson", this._game, { review: true });
        } else {
          this._shopOpen = false;
        }
      }
      return;
    }

    const items = SHOP_ITEMS[this._location.id] ?? [];
    if (!items.length) {
      if (event.key === "Escape") this._shopOpen = false;
      return;
    }

    if (event.key === "ArrowUp") {
      this._shopItemIndex = (this._shopItemIndex - 1 + items.length) % items.length;
    } else if (event.key === "ArrowDown") {
      this._shopItemIndex = (this._shopItemIndex + 1) % items.length;
    } else if (event.key === "Enter") {
      this._buyShopItem(items[this._shopItemIndex]);
    } else if (event.key === "Escape") {
      this._shopOpen = false;
    }
  }

  _handleShopPointer(evt) {
    if (this._shopPhase === "order_build" || this._shopPhase === "order_result_ok" || this._shopPhase === "order_result_retry") {
      return;
    }

    if (this._shopPhase !== "menu") {
      if (this._shopPhase === "bought") {
        this._shopOpen = false;
        this._game.context.scenes.go("lesson", this._game, { review: true });
      } else {
        this._shopOpen = false;
      }
      return;
    }

    for (let i = 0; i < this._shopItemRects.length; i++) {
      const r = this._shopItemRects[i];
      if (evt.canvasX >= r.x && evt.canvasX <= r.x + r.w && evt.canvasY >= r.y && evt.canvasY <= r.y + r.h) {
        this._shopItemIndex = i;
        const items = SHOP_ITEMS[this._location.id] ?? [];
        this._buyShopItem(items[i]);
        return;
      }
    }
  }

  _buyShopItem(item) {
    if (!item) return;
    const player = this._game.context.player;
    const npcId = this._nearestNpc.id;

    if (!player.spendCoins(item.price)) {
      const noMoneyMsgs = SHOP_NO_MONEY[npcId] ?? [{ it: "Non hai abbastanza soldi.", en: "Not enough money." }];
      const msg = noMoneyMsgs[Math.floor(Math.random() * noMoneyMsgs.length)];

      if (player.energy <= 0) {
        this._shopPhase = "no_energy_hint";
        this._shopMessage = `${msg.it}\n${msg.en}\n\nSave (N) and come back tomorrow for full energy!`;
      } else {
        this._shopPhase = "no_money";
        this._shopMessage = `${msg.it}\n${msg.en}\n\nEarn coins at the library or by completing quests.`;
      }
      return;
    }

    player.restoreEnergy(item.energy);
    this._game.context.bus.emit(Events.ITEM_PURCHASED, { item: item.id, price: item.price });
    this._game.context.bus.emit(Events.ENERGY_CHANGED, { energy: player.energy });
    this._game.context.bus.emit(Events.COINS_CHANGED, { coins: player.coins });

    const thanksMsgs = SHOP_THANKS[npcId] ?? [{ it: "Grazie!", en: "Thanks!" }];
    const thanks = thanksMsgs[Math.floor(Math.random() * thanksMsgs.length)];

    this._shopPhase = "bought";
    this._shopMessage = `${item.it}\n${item.en}\n\n${thanks.it} — ${thanks.en}\n\n+${item.energy} energy restored!`;
    this._game.context.eventFeed.push(`Bought ${item.label} for ${item.price} coins. +${item.energy} energy.`);
  }

  _renderShopOverlay(ctx) {
    const { width, height } = ctx.canvas;
    const npcId = this._nearestNpc?.id;
    const npcName = this._nearestNpc?.name ?? "Shop";

    if (this._shopPhase === "order_build" || this._shopPhase === "order_result_ok" || this._shopPhase === "order_result_retry") {
      this._renderOrderGameOverlay(ctx, npcName);
      return;
    }

    ctx.fillStyle = "rgba(10, 18, 28, 0.75)";
    ctx.fillRect(0, 0, width, height);

    const panelW = 420;
    const panelH = 300;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.fillStyle = "rgba(18, 32, 42, 0.96)";
    ctx.fill();
    ctx.strokeStyle = "#c89f3f";
    ctx.lineWidth = 2;
    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.stroke();

    if (this._shopPhase !== "menu") {
      ctx.fillStyle = "#f4d03f";
      ctx.font = "700 16px Georgia";
      ctx.textAlign = "center";
      ctx.fillText(npcName, width / 2, panelY + 30);

      ctx.fillStyle = "#e8d8b0";
      ctx.font = "400 14px Georgia";
      (this._shopMessage ?? "").split("\n").forEach((line, i) => {
        ctx.fillText(line, width / 2, panelY + 60 + i * 22);
      });

      ctx.fillStyle = "#9ec0cf";
      ctx.font = "400 12px Georgia";
      ctx.fillText("Press Enter to continue", width / 2, panelY + panelH - 20);
      ctx.textAlign = "left";
      return;
    }

    ctx.fillStyle = "#f4d03f";
    ctx.font = "700 16px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(npcName, width / 2, panelY + 28);

    if (this._shopGreeting) {
      ctx.fillStyle = "#e8d8b0";
      ctx.font = "italic 13px Georgia";
      ctx.fillText(`"${this._shopGreeting.it}"`, width / 2, panelY + 50);
      ctx.fillStyle = "#9ec0cf";
      ctx.font = "400 12px Georgia";
      ctx.fillText(this._shopGreeting.en, width / 2, panelY + 66);
    }

    ctx.textAlign = "left";

    const items = SHOP_ITEMS[this._location.id] ?? [];
    this._shopItemRects = [];
    let y = panelY + 88;

    items.forEach((item, i) => {
      const selected = i === this._shopItemIndex;
      const cardX = panelX + 16;
      const cardY = y;
      const cardW = panelW - 32;
      const cardH = 44;

      this._roundedRect(ctx, cardX, cardY, cardW, cardH, 6);
      ctx.fillStyle = selected ? "rgba(182, 218, 130, 0.22)" : "rgba(20, 38, 50, 0.9)";
      ctx.fill();
      ctx.strokeStyle = selected ? "#c6d88a" : "#6f8995";
      ctx.lineWidth = 1;
      this._roundedRect(ctx, cardX, cardY, cardW, cardH, 6);
      ctx.stroke();

      ctx.fillStyle = selected ? "#eef5db" : "#dbe8ee";
      ctx.font = "600 14px Georgia";
      ctx.fillText(`${selected ? "▸" : " "} ${item.label}`, cardX + 12, cardY + 18);

      ctx.fillStyle = "#e7c277";
      ctx.font = "400 12px Georgia";
      ctx.fillText(`${item.it}`, cardX + 12, cardY + 34);

      ctx.fillStyle = "#9ec0cf";
      ctx.font = "700 13px Georgia";
      ctx.textAlign = "right";
      ctx.fillText(`🪙${item.price}  +${item.energy}⚡`, cardX + cardW - 12, cardY + 26);
      ctx.textAlign = "left";

      this._shopItemRects.push({ x: cardX, y: cardY, w: cardW, h: cardH });
      y += cardH + 6;
    });

    const player = this._game.context.player;
    ctx.fillStyle = "#9ec0cf";
    ctx.font = "400 12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(`Your coins: 🪙${player.coins}  ·  Energy: ⚡${player.energy}/${player.maxEnergy}  ·  Esc to leave`, width / 2, panelY + panelH - 16);
    ctx.textAlign = "left";
  }

  _startOrderGame() {
    const variants = ORDER_VARIATIONS[this._location.id] ?? [];
    if (!variants.length) {
      this._orderGame = null;
      return;
    }

    const pick = variants[Math.floor(Math.random() * variants.length)];
    const distractors = ["oggi", "grazie", "molto", "subito"];
    const pool = [...pick.template, distractors[Math.floor(Math.random() * distractors.length)]];

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this._orderGame = {
      template: [...pick.template],
      en: pick.en,
      built: [],
      pool,
      selected: 0,
      feedback: null,
    };
  }

  _handleOrderBuildInput(event) {
    if (!this._orderGame) {
      this._shopPhase = "menu";
      return;
    }

    const game = this._orderGame;
    if (event.key === "Escape") {
      this._shopOpen = false;
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      if (game.pool.length) game.selected = (game.selected - 1 + game.pool.length) % game.pool.length;
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      if (game.pool.length) game.selected = (game.selected + 1) % game.pool.length;
      return;
    }

    if (event.key === "Backspace") {
      if (game.built.length) {
        const popped = game.built.pop();
        game.pool.push(popped);
        game.selected = Math.max(0, game.pool.length - 1);
      }
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    if (!game.pool.length) {
      this._evaluateOrderGame();
      return;
    }

    const word = game.pool.splice(game.selected, 1)[0];
    game.built.push(word);
    if (game.selected >= game.pool.length) game.selected = Math.max(0, game.pool.length - 1);

    if (!game.pool.length) this._evaluateOrderGame();
  }

  _evaluateOrderGame() {
    if (!this._orderGame) return;
    const expected = this._orderGame.template.join(" ");
    const built = this._orderGame.built.join(" ");
    const isCorrect = built.toLowerCase() === expected.toLowerCase();

    if (isCorrect) {
      this._shopPhase = "order_result_ok";
      this._shopMessage = `Perfetto!\n${built}\n${this._orderGame.en}\n\nNow choose food/drinks to recover energy.`;
    } else {
      this._shopPhase = "order_result_retry";
      this._shopMessage = `Quasi!\nYour sentence: ${built || "(empty)"}\nExpected: ${expected}\n\nPress Enter to try another order.`;
    }
  }

  _renderOrderGameOverlay(ctx, npcName) {
    const { width, height } = ctx.canvas;
    const g = this._orderGame;

    ctx.fillStyle = "rgba(10, 18, 28, 0.75)";
    ctx.fillRect(0, 0, width, height);

    const panelW = 560;
    const panelH = 320;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.fillStyle = "rgba(18, 32, 42, 0.96)";
    ctx.fill();
    ctx.strokeStyle = "#c89f3f";
    ctx.lineWidth = 2;
    this._roundedRect(ctx, panelX, panelY, panelW, panelH, 10);
    ctx.stroke();

    ctx.fillStyle = "#f4d03f";
    ctx.font = "700 17px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(`${npcName} · Ordina in italiano`, width / 2, panelY + 30);

    if (this._shopPhase !== "order_build") {
      ctx.fillStyle = "#e8d8b0";
      ctx.font = "400 14px Georgia";
      (this._shopMessage ?? "").split("\n").forEach((line, i) => {
        ctx.fillText(line, width / 2, panelY + 72 + i * 22);
      });
      ctx.fillStyle = "#9ec0cf";
      ctx.font = "400 12px Georgia";
      ctx.fillText("Enter continue · Esc close", width / 2, panelY + panelH - 16);
      ctx.textAlign = "left";
      return;
    }

    const builtLine = g?.built?.length ? g.built.join(" ") : "...";
    ctx.fillStyle = "#dbe8ee";
    ctx.font = "400 13px Georgia";
    ctx.fillText("Build the sentence by selecting words in order:", width / 2, panelY + 58);

    this._roundedRect(ctx, panelX + 24, panelY + 72, panelW - 48, 44, 8);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "#eef5db";
    ctx.font = "700 16px Georgia";
    ctx.fillText(builtLine, width / 2, panelY + 101);

    let chipX = panelX + 26;
    let chipY = panelY + 136;
    ctx.textAlign = "left";
    ctx.font = "600 14px Georgia";

    (g?.pool ?? []).forEach((word, i) => {
      const chipW = Math.max(54, ctx.measureText(word).width + 26);
      if (chipX + chipW > panelX + panelW - 24) {
        chipX = panelX + 26;
        chipY += 40;
      }
      const selected = i === g.selected;
      this._roundedRect(ctx, chipX, chipY, chipW, 30, 15);
      ctx.fillStyle = selected ? "rgba(198,216,138,0.25)" : "rgba(30,58,74,0.9)";
      ctx.fill();
      ctx.strokeStyle = selected ? "#c6d88a" : "#6f8995";
      ctx.lineWidth = 1;
      this._roundedRect(ctx, chipX, chipY, chipW, 30, 15);
      ctx.stroke();
      ctx.fillStyle = selected ? "#f2f8e4" : "#d7e5ea";
      ctx.fillText(word, chipX + 13, chipY + 20);
      chipX += chipW + 10;
    });

    ctx.fillStyle = "#9ec0cf";
    ctx.font = "400 12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Arrows select · Enter pick · Backspace undo · Esc close", width / 2, panelY + panelH - 16);
    ctx.textAlign = "left";
  }

  _renderInteriorDecor(ctx, type) {
    const wallTop = 120;
    const wallBottom = 250;
    const floorTop = wallBottom;

    // Generic wall texture strips
    for (let i = 0; i < 7; i++) {
      const x = i * 120;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
      ctx.fillRect(x, wallTop, 120, wallBottom - wallTop);
    }

    // Crown and skirting to create depth in every interior
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, wallTop + 8, CANVAS_W, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, wallBottom - 2, CANVAS_W, 4);

    if (type === 'cafe') {
      // Espresso bar counter
      ctx.fillStyle = '#4f3623';
      ctx.fillRect(72, 302, 536, 44);
      ctx.fillStyle = '#7d593d';
      ctx.fillRect(72, 292, 536, 12);

      // Back wall menu board
      ctx.fillStyle = '#1f2e24';
      ctx.fillRect(90, 146, 170, 74);
      ctx.strokeStyle = '#d8c38c';
      ctx.lineWidth = 2;
      ctx.strokeRect(90, 146, 170, 74);
      ctx.fillStyle = '#f0e8cf';
      ctx.font = '600 12px Georgia';
      ctx.fillText('ESPRESSO 2€', 102, 170);
      ctx.fillText('CAPPUCCINO 3€', 102, 188);
      ctx.fillText('CORNETTO 2€', 102, 206);

      // Pastry display case
      ctx.fillStyle = 'rgba(238, 224, 196, 0.35)';
      ctx.fillRect(438, 236, 146, 50);
      ctx.strokeStyle = 'rgba(215, 196, 161, 0.9)';
      ctx.strokeRect(438, 236, 146, 50);
      ctx.fillStyle = '#c58b46';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(450 + i * 25, 273 + Math.sin(this._time * 0.003 + i) * 0.8, 9, 4.8, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cafe tables + chairs
      for (let i = 0; i < 2; i++) {
        const tx = 188 + i * 160;
        ctx.fillStyle = '#d9cab0';
        ctx.beginPath();
        ctx.ellipse(tx, 356, 30, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#70523a';
        ctx.fillRect(tx - 3, 356, 6, 20);
        ctx.fillRect(tx - 30, 374, 10, 4);
        ctx.fillRect(tx + 20, 374, 10, 4);
      }
      return;
    }

    if (type === 'osteria') {
      // Dark wood tavern feel
      ctx.fillStyle = '#4a2f22';
      ctx.fillRect(52, 302, 598, 46);
      ctx.fillStyle = '#6a4633';
      ctx.fillRect(52, 292, 598, 12);

      // Wine shelf
      ctx.fillStyle = '#3b2519';
      ctx.fillRect(94, 154, 218, 124);
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(102, 166 + r * 34, 202, 2);
      }
      for (let i = 0; i < 10; i++) {
        const bx = 108 + (i % 5) * 38;
        const by = 170 + Math.floor(i / 5) * 38;
        ctx.fillStyle = '#6b3b26';
        ctx.fillRect(bx, by, 10, 22);
        ctx.fillStyle = '#7fbc7a';
        ctx.fillRect(bx + 2, by + 6, 6, 8);
      }

      // Chalk specials board
      ctx.fillStyle = '#243126';
      ctx.fillRect(504, 162, 120, 96);
      ctx.strokeStyle = '#c8b68f';
      ctx.strokeRect(504, 162, 120, 96);
      ctx.fillStyle = '#ece2c8';
      ctx.font = '600 12px Georgia';
      ctx.fillText('Menu del giorno', 514, 184);
      ctx.fillText('- Tagliatelle', 514, 204);
      ctx.fillText('- Ragù', 514, 222);
      ctx.fillText('- Vino rosso', 514, 240);

      // Barrel corners
      for (const x of [86, 628]) {
        ctx.fillStyle = '#5d3a23';
        ctx.fillRect(x, 330, 24, 34);
        ctx.fillStyle = '#8a5e38';
        ctx.fillRect(x, 341, 24, 2);
        ctx.fillRect(x, 352, 24, 2);
      }
      return;
    }

    if (type === 'market') {
      // Supermarket-style aisles
      ctx.fillStyle = '#36503d';
      ctx.fillRect(40, 304, 720, 42);

      const aisleXs = [88, 236, 384, 532];
      for (const ax of aisleXs) {
        ctx.fillStyle = '#506a59';
        ctx.fillRect(ax, 186, 96, 132);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(ax + 4, 190, 88, 2);
        for (let s = 0; s < 4; s++) {
          ctx.fillStyle = s % 2 ? '#d9674b' : '#f1be57';
          ctx.fillRect(ax + 8 + (s % 2) * 36, 202 + Math.floor(s / 2) * 30, 30, 18);
        }
      }

      // Produce crates
      const fruit = ['#df4c2f', '#f0a920', '#63b449', '#c9364e'];
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = '#7a5435';
        ctx.fillRect(70 + i * 48, 332, 36, 18);
        ctx.fillStyle = fruit[i % fruit.length];
        ctx.beginPath();
        ctx.arc(78 + i * 48, 340, 5, 0, Math.PI * 2);
        ctx.arc(92 + i * 48, 342, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#efe0ba';
      ctx.font = '700 13px Georgia';
      ctx.fillText('OFFERS TODAY', 332, 170);
      return;
    }

    if (type === 'bakery') {
      // Bakery counter
      ctx.fillStyle = '#6a4428';
      ctx.fillRect(72, 302, 536, 44);
      ctx.fillStyle = '#8f623d';
      ctx.fillRect(72, 292, 536, 12);

      // Bread shelf wall
      ctx.fillStyle = '#5f3d24';
      ctx.fillRect(88, 150, 222, 124);
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(96, 168 + r * 24, 206, 2);
      }
      for (let i = 0; i < 12; i++) {
        const bx = 104 + (i % 4) * 48;
        const by = 176 + Math.floor(i / 4) * 24;
        const wobble = Math.sin(this._time * 0.002 + i) * 1;
        ctx.fillStyle = '#d49a52';
        ctx.beginPath();
        ctx.ellipse(bx, by + wobble, 14, 7, 0.16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glass pastry counter
      ctx.fillStyle = 'rgba(244, 229, 184, 0.35)';
      ctx.fillRect(430, 232, 164, 56);
      ctx.strokeStyle = '#c8a86f';
      ctx.lineWidth = 2;
      ctx.strokeRect(430, 232, 164, 56);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 ? '#e8c86a' : '#d59a4b';
        ctx.beginPath();
        ctx.ellipse(444 + i * 24, 274, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (type === 'library') {
      // Tall bookshelves and reading desk
      for (let i = 0; i < 3; i++) {
        const sx = 70 + i * 210;
        ctx.fillStyle = '#5a3f2a';
        ctx.fillRect(sx, 144, 148, 150);
        for (let r = 0; r < 5; r++) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(sx + 8, 162 + r * 24, 132, 2);
          for (let b = 0; b < 7; b++) {
            ctx.fillStyle = ['#8e5933', '#b57a40', '#7d6fa7', '#4e8a8f'][b % 4];
            ctx.fillRect(sx + 12 + b * 18, 166 + r * 24, 12, 16);
          }
        }
      }
      ctx.fillStyle = '#6a4a2f';
      ctx.fillRect(252, 326, 296, 20);
      ctx.fillStyle = '#d6c7a6';
      ctx.fillRect(310, 314, 180, 10);
      ctx.fillStyle = '#4b321f';
      ctx.font = 'bold 12px Georgia';
      ctx.fillText('Silenzio', 372, 220);
      return;
    }

    if (type === 'university') {
      // Lecture hall / academic office
      ctx.fillStyle = '#495b63';
      ctx.fillRect(84, 304, 632, 40);
      ctx.fillStyle = '#6a7f88';
      ctx.fillRect(84, 294, 632, 10);

      // Blackboard
      ctx.fillStyle = '#1f392f';
      ctx.fillRect(102, 148, 254, 110);
      ctx.strokeStyle = '#9fc8b6';
      ctx.strokeRect(102, 148, 254, 110);
      ctx.fillStyle = '#d7ece2';
      ctx.font = '600 13px Georgia';
      ctx.fillText('Storia della Cucina', 116, 178);
      ctx.fillText('Bologna 1800-1900', 116, 198);

      // Notice board
      ctx.fillStyle = '#d4c4a2';
      ctx.fillRect(472, 152, 150, 106);
      ctx.strokeStyle = '#8a734e';
      ctx.strokeRect(472, 152, 150, 106);
      ctx.fillStyle = '#5f4730';
      ctx.fillText('Seminario', 488, 184);
      ctx.fillText('Archivio Storico', 488, 204);
      return;
    }

    // Fallback generic interior
    ctx.fillStyle = '#5a3f2a';
    ctx.fillRect(70, floorTop + 52, 500, 42);
    ctx.fillStyle = '#7a583a';
    ctx.fillRect(70, floorTop + 44, 500, 10);
  }

  _drawCharacter(ctx, entity, role = 'npc') {
    const x = entity?.x ?? 0;
    const y = entity?.y ?? 0;
    const bob = Math.sin(this._time * 0.004 + (x + y) * 0.1) * 1.5;
    const px = x;
    const py = y + bob;

    const palette = role === 'player'
      ? { shirt: '#2f6fb4', skin: '#f0c8a0', hair: '#4a2a14' }
      : { shirt: '#7f5ab6', skin: '#e8bf95', hair: '#3a2417' };

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(px, py + 18, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = palette.shirt;
    ctx.fillRect(px - 7, py + 2, 14, 15);
    // Head
    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.arc(px, py - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = palette.hair;
    ctx.beginPath();
    ctx.arc(px, py - 7, 6, Math.PI, 0);
    ctx.fill();
    // Legs
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px - 4, py + 17);
    ctx.lineTo(px - 4, py + 24);
    ctx.moveTo(px + 4, py + 17);
    ctx.lineTo(px + 4, py + 24);
    ctx.stroke();
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
