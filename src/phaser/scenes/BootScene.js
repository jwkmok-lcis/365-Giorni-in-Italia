import * as Phaser from "../../vendor/phaser.esm.js";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const runtime = this.registry.get("runtime");
    runtime.setHeaderHidden(false);
    runtime.refreshResumeScene();
    this.scene.start("IntroScene");
  }
}