// Hud – renders the persistent top bar during exploration.
// Receives read-only state; never mutates anything.

import { MAP_CONFIG } from "../content/map.js";

const HUD_H = MAP_CONFIG.hudHeight;

export class Hud {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ day: number, languageXP: number, coins: number, currentStreak: number, maxStreak: number }} player
   * @param {string} locationLabel
   */
  render(ctx, player, locationLabel) {
    const W = ctx.canvas.width;

    // Background bar
    ctx.fillStyle = "#0c1520";
    ctx.fillRect(0, 0, W, HUD_H);

    // Separator line
    ctx.strokeStyle = "#3d5060";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_H);
    ctx.lineTo(W, HUD_H);
    ctx.stroke();

    // Day counter
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 18px Georgia";
    ctx.textAlign = "left";
    ctx.fillText(`Giorno ${player.day}`, 14, 34);

    // Current location
    ctx.fillStyle = "#90b8c8";
    ctx.font = "400 15px Georgia";
    ctx.fillText(locationLabel || "Bologna", 160, 34);

    // Language XP and streak
    ctx.fillStyle = "#a8d890";
    ctx.font = "400 15px Georgia";
    ctx.textAlign = "right";
    ctx.fillText(`XP: ${player.languageXP}`, W - 14, 34);
    ctx.fillText(`Serie: ${player.currentStreak || 0}`, W - 14, 52);

    ctx.textAlign = "left"; // reset
  }
}
