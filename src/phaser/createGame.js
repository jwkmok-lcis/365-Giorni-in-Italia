import * as Phaser from "../vendor/phaser.esm.js";
import { BootScene } from "./scenes/BootScene.js";
import { IntroScene } from "./scenes/IntroScene.js";
import { LessonScene } from "./scenes/LessonScene.js";
import { OverworldScene } from "./scenes/OverworldScene.js";
import { DialogueScene } from "./scenes/DialogueScene.js";
import { LocationScene } from "./scenes/LocationScene.js";

export function createPhaserGame({ canvas, runtime }) {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    canvas,
    width: 800,
    height: 512,
    backgroundColor: "#111920",
    parent: canvas.parentElement ?? undefined,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 512,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [
      BootScene,
      IntroScene,
      LessonScene,
      OverworldScene,
      DialogueScene,
      LocationScene,
    ],
  });

  game.registry.set("runtime", runtime);
  return game;
}