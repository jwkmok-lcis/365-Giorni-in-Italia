export function createTownCamera(scene, target, options = {}) {
  const camera = scene.cameras.main;
  const state = {
    profile: null,
    zoomTarget: null,
    offsetTarget: 0,
  };

  camera.startFollow(target, true, options.mode === "overworld" ? 0.06 : 0.09, options.mode === "overworld" ? 0.06 : 0.09);

  function getViewportFitZoom() {
    if (!options.worldWidth || !options.worldHeight) {
      return 1;
    }

    const fit = Math.min(scene.scale.width / options.worldWidth, scene.scale.height / options.worldHeight);
    const minFitZoom = options.minFitZoom ?? 0.7;
    const maxFitZoom = options.maxFitZoom ?? 1.45;
    return Math.max(minFitZoom, Math.min(maxFitZoom, fit));
  }

  function getViewportCoverZoom() {
    if (!options.worldWidth || !options.worldHeight) {
      return 1;
    }

    const cover = Math.max(scene.scale.width / options.worldWidth, scene.scale.height / options.worldHeight);
    const minCoverZoom = options.minCoverZoom ?? 0.7;
    const maxCoverZoom = options.maxCoverZoom ?? 2.4;
    return Math.max(minCoverZoom, Math.min(maxCoverZoom, cover));
  }

  function getProfile() {
    const isPortrait = scene.scale.height >= scene.scale.width;
    const isTouchPortrait = options.isTouch && isPortrait;
    const viewportFitZoom = getViewportFitZoom();
    const viewportCoverZoom = getViewportCoverZoom();

    if (options.mode === "overworld") {
      if (isTouchPortrait) {
        return {
          zoom: viewportCoverZoom * 1.04,
          plazaZoom: viewportCoverZoom,
          buildingZoom: viewportCoverZoom * 1.14,
          followOffsetY: -126,
          lookAheadY: 28,
        };
      }

      return {
        zoom: viewportCoverZoom * 1.02,
        plazaZoom: viewportCoverZoom,
        buildingZoom: viewportCoverZoom * 1.12,
        followOffsetY: -18,
        lookAheadY: 10,
      };
    }

    if (isTouchPortrait) {
      return {
        zoom: 1.34,
        buildingZoom: 1.7,
        followOffsetY: -110,
      };
    }

    return {
      zoom: 0.92,
      buildingZoom: 1.18,
      followOffsetY: -20,
    };
  }

  function applyProfile(immediate = false) {
    state.profile = getProfile();
    camera.setFollowOffset(0, state.profile.followOffsetY);
    state.offsetTarget = state.profile.followOffsetY;
    state.zoomTarget = state.profile.zoom;

    if (immediate) {
      camera.setZoom(state.zoomTarget);
      return;
    }

    scene.tweens.killTweensOf(camera);
    scene.tweens.add({
      targets: camera,
      zoom: state.zoomTarget,
      duration: 350,
      ease: "Sine.Out",
    });
  }

  function tweenCamera(zoomTarget, offsetTarget, duration = 380) {
    if (Math.abs((state.zoomTarget ?? 0) - zoomTarget) < 0.01 && Math.abs((state.offsetTarget ?? 0) - offsetTarget) < 2) {
      return;
    }

    state.zoomTarget = zoomTarget;
    state.offsetTarget = offsetTarget;
    scene.tweens.killTweensOf(camera);
    scene.tweens.add({
      targets: camera,
      zoom: zoomTarget,
      duration,
      ease: "Sine.Out",
      onUpdate: () => {
        camera.setFollowOffset(0, offsetTarget);
      },
    });
  }

  return {
    applyForViewport: applyProfile,
    updateDynamicState(context = {}) {
      state.profile = getProfile();
      const lookAhead = (context.movement?.y ?? 0) * (state.profile.lookAheadY ?? 0);
      const offsetTarget = state.profile.followOffsetY + lookAhead;
      const zoomTarget = context.nearBuilding
        ? state.profile.buildingZoom
        : context.inHub
          ? state.profile.plazaZoom
          : state.profile.zoom;
      tweenCamera(zoomTarget, offsetTarget, context.nearBuilding ? 300 : 420);
    },
    zoomIntoBuilding() {
      state.profile = getProfile();
      camera.setFollowOffset(0, state.profile.followOffsetY);
      tweenCamera(state.profile.buildingZoom, state.profile.followOffsetY, 500);
    },
    zoomOutToWorld() {
      applyProfile(false);
    },
  };
}
