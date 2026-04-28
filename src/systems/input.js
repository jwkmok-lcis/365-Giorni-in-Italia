import * as Phaser from "../vendor/phaser.esm.js";

export function createTownInput(scene) {
  const cursors = scene.input.keyboard?.createCursorKeys();
  const letterKeys = scene.input.keyboard?.addKeys("W,A,S,D,E");
  const isTouch = scene.sys.game.device.input.touch || window.matchMedia("(pointer: coarse)").matches;
  const joystick = createVirtualJoystick(scene, isTouch);

  return {
    isTouch,
    update() {
      joystick.updateVisibility();
    },
    resize() {
      joystick.layout();
    },
    destroy() {
      joystick.destroy();
    },
    consumeInteract() {
      return letterKeys ? Phaser.Input.Keyboard.JustDown(letterKeys.E) : false;
    },
    pointerInJoystick(pointer) {
      return joystick.contains(pointer);
    },
    getMovementVector() {
      const movement = new Phaser.Math.Vector2(0, 0);

      if (cursors?.left.isDown || letterKeys?.A.isDown) {
        movement.x -= 1;
      }
      if (cursors?.right.isDown || letterKeys?.D.isDown) {
        movement.x += 1;
      }
      if (cursors?.up.isDown || letterKeys?.W.isDown) {
        movement.y -= 1;
      }
      if (cursors?.down.isDown || letterKeys?.S.isDown) {
        movement.y += 1;
      }

      if (movement.lengthSq() > 0) {
        return movement.normalize();
      }

      return joystick.vector.clone();
    },
  };
}

function createVirtualJoystick(scene, enabled) {
  const base = scene.add.circle(112, scene.scale.height - 116, 64, 0x0d2431, 0.34)
    .setScrollFactor(0)
    .setDepth(30)
    .setVisible(enabled);
  base.setStrokeStyle(3, 0xe6efe6, 0.3);

  const thumb = scene.add.circle(base.x, base.y, 28, 0xf5f2e8, 0.85)
    .setScrollFactor(0)
    .setDepth(31)
    .setVisible(enabled);
  thumb.setStrokeStyle(3, 0x143246, 0.4);

  const label = scene.add.text(base.x, base.y + 84, "Move", {
    fontFamily: "Trebuchet MS, sans-serif",
    fontSize: "18px",
    color: "#f4efe4",
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(31).setVisible(enabled);

  const state = {
    pointerId: null,
    vector: new Phaser.Math.Vector2(0, 0),
    radius: 64,
  };

  const resetThumb = () => {
    state.pointerId = null;
    state.vector.set(0, 0);
    thumb.setPosition(base.x, base.y);
  };

  const updateFromPointer = (pointer) => {
    const delta = new Phaser.Math.Vector2(pointer.x - base.x, pointer.y - base.y);
    const maxDistance = state.radius - 12;

    if (delta.length() > maxDistance) {
      delta.setLength(maxDistance);
    }

    thumb.setPosition(base.x + delta.x, base.y + delta.y);

    state.vector.set(
      Phaser.Math.Clamp(delta.x / maxDistance, -1, 1),
      Phaser.Math.Clamp(delta.y / maxDistance, -1, 1)
    );

    if (state.vector.lengthSq() > 1) {
      state.vector.normalize();
    }
  };

  const onPointerDown = (pointer) => {
    if (!enabled || state.pointerId !== null || !contains(pointer)) {
      return;
    }

    state.pointerId = pointer.id;
    updateFromPointer(pointer);
  };

  const onPointerMove = (pointer) => {
    if (pointer.id !== state.pointerId) {
      return;
    }

    updateFromPointer(pointer);
  };

  const onPointerUp = (pointer) => {
    if (pointer.id === state.pointerId) {
      resetThumb();
    }
  };

  const contains = (pointer) => Phaser.Math.Distance.Between(pointer.x, pointer.y, base.x, base.y) <= state.radius * 1.3;

  scene.input.on("pointerdown", onPointerDown);
  scene.input.on("pointermove", onPointerMove);
  scene.input.on("pointerup", onPointerUp);
  scene.input.on("pointerupoutside", onPointerUp);

  return {
    vector: state.vector,
    contains,
    layout() {
      base.setPosition(112, scene.scale.height - 116);
      resetThumb();
      label.setPosition(base.x, base.y + 84);
    },
    updateVisibility() {
      const visible = enabled;
      base.setVisible(visible);
      thumb.setVisible(visible);
      label.setVisible(visible);
      if (!visible) {
        resetThumb();
      }
    },
    destroy() {
      scene.input.off("pointerdown", onPointerDown);
      scene.input.off("pointermove", onPointerMove);
      scene.input.off("pointerup", onPointerUp);
      scene.input.off("pointerupoutside", onPointerUp);
      base.destroy();
      thumb.destroy();
      label.destroy();
    },
  };
}
