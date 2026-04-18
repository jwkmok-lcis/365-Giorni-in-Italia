// XPNotificationUI – displays XP gains, skill improvements, and feedback messages.
// Shows temporary notifications that fade out over time.

export class XPNotificationUI {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 3;
  }

  // Add a new XP notification
  addXPNotification(amount, skills = [], streak = 0) {
    const notification = {
      id: Date.now(),
      type: 'xp',
      amount,
      skills,
      streak,
      timestamp: Date.now(),
      duration: 3000, // 3 seconds
      alpha: 1.0
    };

    this.notifications.push(notification);

    // Limit number of visible notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }
  }

  // Add a skill improvement notification
  addSkillNotification(skillName, improvement) {
    const notification = {
      id: Date.now(),
      type: 'skill',
      skillName,
      improvement,
      timestamp: Date.now(),
      duration: 2500,
      alpha: 1.0
    };

    this.notifications.push(notification);

    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }
  }

  // Add a feedback message
  addFeedbackNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      type: 'feedback',
      message,
      feedbackType: type,
      timestamp: Date.now(),
      duration: 4000,
      alpha: 1.0
    };

    this.notifications.push(notification);

    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }
  }

  // Update notification alphas based on time
  update(deltaTime) {
    this.notifications = this.notifications.filter(notification => {
      const elapsed = Date.now() - notification.timestamp;
      const progress = elapsed / notification.duration;

      if (progress >= 1) {
        return false; // Remove expired notifications
      }

      // Fade out in last 25% of duration
      if (progress > 0.75) {
        notification.alpha = 1 - ((progress - 0.75) / 0.25);
      }

      return true;
    });
  }

  // Render notifications
  render(ctx) {
    const startY = 100;
    const spacing = 60;

    this.notifications.forEach((notification, index) => {
      const y = startY + (index * spacing);
      this.renderNotification(ctx, notification, 20, y);
    });
  }

  renderNotification(ctx, notification, x, y) {
    const width = 300;
    const height = 50;

    // Background with alpha
    ctx.globalAlpha = notification.alpha;
    ctx.fillStyle = "rgba(26, 35, 50, 0.9)";
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = "rgba(61, 80, 96, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Content based on type
    ctx.textAlign = "left";

    if (notification.type === 'xp') {
      // XP notification
      ctx.fillStyle = "rgba(168, 216, 144, 0.9)";
      ctx.font = "700 18px Georgia";
      ctx.fillText(`+${notification.amount} XP`, x + 15, y + 25);

      if (notification.streak > 1) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.font = "400 14px Georgia";
        ctx.fillText(`Serie: ${notification.streak}`, x + 15, y + 40);
      }

      // Skill icons
      if (notification.skills.length > 0) {
        ctx.fillStyle = "rgba(144, 184, 200, 0.9)";
        ctx.font = "400 12px Georgia";
        const skillsText = notification.skills.slice(0, 2).join(", ");
        ctx.fillText(skillsText, x + 120, y + 35);
      }

    } else if (notification.type === 'skill') {
      // Skill improvement
      ctx.fillStyle = "rgba(168, 216, 144, 0.9)";
      ctx.font = "700 16px Georgia";
      ctx.fillText(`Competenza Migliorata!`, x + 15, y + 20);

      ctx.fillStyle = "rgba(232, 216, 176, 0.9)";
      ctx.font = "400 14px Georgia";
      ctx.fillText(`${notification.skillName}: +${notification.improvement}`, x + 15, y + 38);

    } else if (notification.type === 'feedback') {
      // Feedback message
      let color = "rgba(144, 184, 200, 0.9)"; // info
      let icon = "ℹ️";

      if (notification.feedbackType === 'success') {
        color = "rgba(168, 216, 144, 0.9)";
        icon = "✅";
      } else if (notification.feedbackType === 'warning') {
        color = "rgba(255, 193, 7, 0.9)";
        icon = "⚠️";
      } else if (notification.feedbackType === 'error') {
        color = "rgba(220, 53, 69, 0.9)";
        icon = "❌";
      }

      ctx.fillStyle = color;
      ctx.font = "400 16px Georgia";
      ctx.fillText(`${icon} ${notification.message}`, x + 15, y + 30);
    }

    ctx.globalAlpha = 1.0; // reset
    ctx.textAlign = "left";
  }

  // Clear all notifications
  clear() {
    this.notifications = [];
  }

  // Check if there are active notifications
  hasNotifications() {
    return this.notifications.length > 0;
  }
}