// ClueNotebook – displays unlocked recipe clues collected so far.

export class ClueNotebook {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array} unlockedClues - array of { id, title, text, source }
   */
  render(ctx, unlockedClues, layout = {}) {
    if (!unlockedClues || unlockedClues.length === 0) {
      return; // no clues yet
    }

    ctx.save();

    const W = ctx.canvas.width;
    const PANEL_W = layout.w ?? 280;
    const PANEL_X = layout.x ?? (W - PANEL_W - 14);
    const PANEL_Y = layout.y ?? 70;

    const CLUE_H = 20; // height per clue item
    const HEADER_H = 22;
    const PADDING = 10;
    const MAX_VISIBLE = 4; // show up to 4 clues before truncating
    const visibleCount = Math.min(unlockedClues.length, MAX_VISIBLE);
    const PANEL_H = HEADER_H + visibleCount * CLUE_H + PADDING + (unlockedClues.length > MAX_VISIBLE ? 12 : 0);

    // Background panel
    this._roundedRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
    const bg = ctx.createLinearGradient(0, PANEL_Y, 0, PANEL_Y + PANEL_H);
    bg.addColorStop(0, "rgba(23, 44, 54, 0.92)");
    bg.addColorStop(1, "rgba(14, 28, 36, 0.9)");
    ctx.fillStyle = bg;
    ctx.fill();

    // Border
    ctx.strokeStyle = "#c1924a";
    ctx.lineWidth = 1;
    this._roundedRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
    ctx.stroke();

    // Title: "📓 Clues"
    ctx.fillStyle = "#f0d39e";
    ctx.font = "700 13px Georgia";
    ctx.textAlign = "left";
    ctx.fillText("Clues", PANEL_X + PADDING, PANEL_Y + 17);

    // Clue list
    let yOffset = PANEL_Y + HEADER_H;
    for (let i = 0; i < visibleCount; i++) {
      const clue = unlockedClues[i];

      // Clue bullet + title
      ctx.fillStyle = "#f4ecd9";
      ctx.font = "400 11px Georgia";
      ctx.textAlign = "left";
      const clipped = this._fitLine(ctx, `• ${clue.title}`, PANEL_W - PADDING * 2 - 8);
      ctx.fillText(clipped, PANEL_X + PADDING, yOffset + 13);

      yOffset += CLUE_H;
    }

    // "More..." indicator if truncated
    if (unlockedClues.length > MAX_VISIBLE) {
      ctx.fillStyle = "#9fc9bb";
      ctx.font = "400 10px Georgia";
      ctx.fillText(`+${unlockedClues.length - MAX_VISIBLE} more`, PANEL_X + PADDING, yOffset + 12);
    }

    ctx.restore();

    return { x: PANEL_X, y: PANEL_Y, w: PANEL_W, h: PANEL_H };
  }

  measure(ctx, unlockedClues, layout = {}) {
    if (!unlockedClues || unlockedClues.length === 0) return null;
    const W = ctx.canvas.width;
    const w = layout.w ?? 280;
    const x = layout.x ?? (W - w - 14);
    const y = layout.y ?? 70;
    const visibleCount = Math.min(unlockedClues.length, 4);
    const h = 22 + visibleCount * 20 + 10 + (unlockedClues.length > 4 ? 12 : 0);
    return { x, y, w, h };
  }

  _fitLine(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && ctx.measureText(`${t}...`).width > maxWidth) {
      t = t.slice(0, -1);
    }
    return `${t}...`;
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
