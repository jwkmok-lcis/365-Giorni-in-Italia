// SkillTreeUI – displays skill tree, XP progress, and unlocked rewards.
// Can be toggled on/off during gameplay.

export class SkillTreeUI {
  constructor() {
    this.visible = false;
    this.selectedSkill = null;
    this.skillPositions = {}; // Cache for skill node positions
  }

  toggle() {
    this.visible = !this.visible;
  }

  show() {
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }

  render(ctx, skillTreeSystem, player) {
    if (!this.visible) return;

    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, W, H);

    // Main panel
    const panelWidth = 600;
    const panelHeight = 400;
    const panelX = (W - panelWidth) / 2;
    const panelY = (H - panelHeight) / 2;

    // Panel background
    ctx.fillStyle = "#1a2332";
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Panel border
    ctx.strokeStyle = "#3d5060";
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

    // Title
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 24px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Albero delle Competenze", W / 2, panelY + 40);

    // XP and streak info
    const stats = skillTreeSystem.getPlayerStats();
    ctx.fillStyle = "#a8d890";
    ctx.font = "400 16px Georgia";
    ctx.fillText(`XP Totale: ${stats.totalXP}`, panelX + 20, panelY + 70);
    ctx.fillText(`Serie Attuale: ${stats.currentStreak}`, panelX + 20, panelY + 90);
    ctx.fillText(`Miglior Serie: ${stats.maxStreak}`, panelX + 20, panelY + 110);

    // Skill tree visualization
    this.renderSkillTree(ctx, skillTreeSystem, panelX + 50, panelY + 140, panelWidth - 100, panelHeight - 180);

    // Rewards section
    this.renderRewards(ctx, skillTreeSystem, panelX + panelWidth - 200, panelY + 70, 180, panelHeight - 120);

    // Close instruction
    ctx.fillStyle = "#90b8c8";
    ctx.font = "400 14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Premi ESC per chiudere", W / 2, panelY + panelHeight - 20);

    ctx.textAlign = "left"; // reset
  }

  renderSkillTree(ctx, skillTreeSystem, x, y, width, height) {
    const skills = skillTreeSystem.getAllSkills();
    const skillKeys = Object.keys(skills);

    // Define skill positions in a tree layout
    const positions = {
      basicSentences: { x: x + width * 0.2, y: y + 30 },
      presentTense: { x: x + width * 0.2, y: y + 80 },
      pastTense: { x: x + width * 0.35, y: y + 130 },
      connectors: { x: x + width * 0.05, y: y + 130 },
      modals: { x: x + width * 0.2, y: y + 180 },
      pronouns: { x: x + width * 0.35, y: y + 180 },
      infinitives: { x: x + width * 0.2, y: y + 230 },
      complexCombinations: { x: x + width * 0.5, y: y + 230 }
    };

    // Draw connections
    ctx.strokeStyle = "#3d5060";
    ctx.lineWidth = 2;

    // Basic to Present
    this.drawConnection(ctx, positions.basicSentences, positions.presentTense);

    // Present to branches
    this.drawConnection(ctx, positions.presentTense, positions.pastTense);
    this.drawConnection(ctx, positions.presentTense, positions.connectors);

    // Past/Connectors to next level
    this.drawConnection(ctx, positions.pastTense, positions.pronouns);
    this.drawConnection(ctx, positions.connectors, positions.pronouns);
    this.drawConnection(ctx, positions.presentTense, positions.modals);

    // Modals/Pronouns to final level
    this.drawConnection(ctx, positions.modals, positions.infinitives);
    this.drawConnection(ctx, positions.pronouns, positions.complexCombinations);
    this.drawConnection(ctx, positions.infinitives, positions.complexCombinations);

    // Draw skill nodes
    skillKeys.forEach(key => {
      const skill = skills[key];
      const pos = positions[key];
      if (!pos) return;

      this.renderSkillNode(ctx, skill, pos.x, pos.y);
    });
  }

  drawConnection(ctx, from, to) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  renderSkillNode(ctx, skill, x, y) {
    const radius = 25;
    const isUnlocked = skill.unlocked;
    const progress = skill.progress || 0;

    // Node background
    ctx.fillStyle = isUnlocked ? "#4a6fa5" : "#2a3a4a";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Progress ring
    if (isUnlocked) {
      ctx.strokeStyle = "#a8d890";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2));
      ctx.stroke();
    }

    // Node border
    ctx.strokeStyle = "#e8d8b0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Skill name (abbreviated)
    ctx.fillStyle = "#e8d8b0";
    ctx.font = "400 10px Georgia";
    ctx.textAlign = "center";
    const shortName = skill.name.length > 8 ? skill.name.substring(0, 6) + "..." : skill.name;
    ctx.fillText(shortName, x, y + 3);

    // Level indicator
    if (skill.level > 0) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "700 12px Georgia";
      ctx.fillText(skill.level.toString(), x, y - 30);
    }
  }

  renderRewards(ctx, skillTreeSystem, x, y, width, height) {
    const rewards = skillTreeSystem.getRewards();

    ctx.fillStyle = "#e8d8b0";
    ctx.font = "700 16px Georgia";
    ctx.textAlign = "left";
    ctx.fillText("Ricompense Sbloccate", x, y);

    let currentY = y + 30;
    const rewardItems = [
      { key: "dialogueOptions", name: "Opzioni Dialogo Extra", icon: "💬" },
      { key: "fasterTrust", name: "Fiducia NPC Più Veloce", icon: "🤝" },
      { key: "secretClues", name: "Indizi Segreti", icon: "🔍" },
      { key: "advancedNPCs", name: "NPC Avanzati", icon: "🎭" }
    ];

    rewardItems.forEach(reward => {
      ctx.fillStyle = rewards[reward.key] ? "#a8d890" : "#666";
      ctx.font = "400 14px Georgia";
      ctx.fillText(`${reward.icon} ${reward.name}`, x, currentY);
      currentY += 20;
    });

    ctx.textAlign = "left"; // reset
  }

  // Handle mouse clicks for skill selection (for future expansion)
  handleClick(mouseX, mouseY) {
    // Could implement skill node clicking for details
    return false;
  }
}