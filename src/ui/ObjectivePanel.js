// ObjectivePanel – renders the active quest objective and progress.

export class ObjectivePanel {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} questState - { activeQuest, objectives completed count }
   */
  render(ctx, questState, layout = {}) {
    if (!questState || !questState.activeQuest) {
      return; // no active quest yet
    }

    ctx.save();

    const quest = questState.activeQuest;
    const PANEL_W = layout.w ?? 300;
    const PANEL_X = layout.x ?? 14;
    const PANEL_Y = layout.y ?? 70;
    const lines = this._measureWrappedLineCount(ctx, quest.description, PANEL_W - 20);
    const PANEL_H = Math.max(74, 40 + (lines * 14) + 22);

    // Background panel
    this._roundedRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
    const bg = ctx.createLinearGradient(0, PANEL_Y, 0, PANEL_Y + PANEL_H);
    bg.addColorStop(0, "rgba(13, 26, 38, 0.9)");
    bg.addColorStop(1, "rgba(10, 20, 30, 0.86)");
    ctx.fillStyle = bg;
    ctx.fill();

    // Border
    ctx.strokeStyle = "#547cb0";
    ctx.lineWidth = 1;
    this._roundedRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 8);
    ctx.stroke();

    ctx.fillStyle = "rgba(132, 181, 118, 0.16)";
    ctx.fillRect(PANEL_X + 8, PANEL_Y + PANEL_H - 22, PANEL_W - 16, 10);

    // Title: "🎯 Objective"
    ctx.fillStyle = "#f4d03f";
    ctx.font = "700 13px Georgia";
    ctx.textAlign = "left";
    ctx.fillText("Objective", PANEL_X + 10, PANEL_Y + 17);

    // Quest description (wrapped)
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "400 12px Georgia";
    const desc = quest.description;
    this._drawWrappedText(ctx, desc, PANEL_X + 10, PANEL_Y + 33, PANEL_W - 20, 14, 3);

    // Progress bar
    const completed = quest.objectives.filter((o) => o.completed).length;
    const total = quest.objectives.length;
    const progress = completed / total;

    const BAR_X = PANEL_X + 10;
    const BAR_Y = PANEL_Y + PANEL_H - 14;
    const BAR_W = PANEL_W - 20;
    const BAR_H = 6;

    // Bar background
    ctx.fillStyle = "#1d2a32";
    ctx.fillRect(BAR_X, BAR_Y, BAR_W, BAR_H);

    // Bar fill
    ctx.fillStyle = "#9dcd82";
    ctx.fillRect(BAR_X, BAR_Y, BAR_W * progress, BAR_H);

    // Progress text
    ctx.fillStyle = "#9ec6d3";
    ctx.font = "400 11px Georgia";
    ctx.textAlign = "right";
    ctx.fillText(`${completed}/${total}`, PANEL_X + PANEL_W - 10, PANEL_Y + PANEL_H - 4);

    ctx.restore();

    return { x: PANEL_X, y: PANEL_Y, w: PANEL_W, h: PANEL_H };
  }

  measure(ctx, questState, layout = {}) {
    if (!questState || !questState.activeQuest) return null;
    const quest = questState.activeQuest;
    const w = layout.w ?? 300;
    const lines = this._measureWrappedLineCount(ctx, quest.description, w - 20);
    const h = Math.max(74, 40 + (lines * 14) + 22);
    return { x: layout.x ?? 14, y: layout.y ?? 70, w, h };
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Number.POSITIVE_INFINITY) {
    const words = text.split(" ");
    let line = "";
    let drawn = 0;

    for (const word of words) {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trimEnd(), x, y);
        drawn += 1;
        if (drawn >= maxLines) return;
        y += lineHeight;
        line = `${word} `;
      } else {
        line = test;
      }
    }

    if (line && drawn < maxLines) {
      ctx.fillText(line.trimEnd(), x, y);
    }
  }

  _measureWrappedLineCount(ctx, text, maxWidth) {
    const words = String(text).split(" ");
    let line = "";
    let lines = 0;

    for (const word of words) {
      const test = `${line}${word} `;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines += 1;
        line = `${word} `;
      } else {
        line = test;
      }
    }

    if (line) lines += 1;
    return lines;
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
