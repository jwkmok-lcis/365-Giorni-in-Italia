import * as Phaser from "../vendor/phaser.esm.js";

const BUILDING_DEFS = [
  {
    id: "biblioteca",
    name: "Biblioteca",
    type: "vocab",
    x: 820,
    y: 380,
    width: 230,
    height: 170,
    color: 0xc56c43,
  },
  {
    id: "osteria-voce",
    name: "Osteria della Voce",
    type: "pronunciation",
    x: 1100,
    y: 1180,
    width: 250,
    height: 180,
    color: 0x8f5d48,
  },
  {
    id: "torre-dei-numeri",
    name: "Torre dei Numeri",
    type: "numbers",
    x: 1500,
    y: 420,
    width: 220,
    height: 180,
    color: 0x577089,
  },
];

export function createBuildings(scene) {
  const solids = [];
  const entrances = [];

  BUILDING_DEFS.forEach((building) => {
    const shell = scene.add.rectangle(building.x, building.y, building.width, building.height, building.color, 1);
    shell.setStrokeStyle(6, 0x2c261f, 0.75);

    const roof = scene.add.triangle(
      building.x,
      building.y - building.height / 2 - 20,
      0,
      46,
      building.width / 2 + 20,
      46,
      building.width / 4,
      -10,
      0x42342c,
      1
    );
    roof.setScale(2, 1.5);

    const sign = scene.add.text(building.x, building.y - 8, building.name, {
      fontFamily: "Trebuchet MS, sans-serif",
      fontSize: "24px",
      color: "#fff6e4",
      align: "center",
    }).setOrigin(0.5, 0.5);

    const door = scene.add.rectangle(building.x, building.y + building.height / 2 - 26, 48, 56, 0x2d241f, 1);
    door.setStrokeStyle(2, 0xe5c78e, 0.75);

    scene.physics.add.existing(shell, true);
    shell.body.setSize(building.width, building.height);

    const entrance = scene.add.zone(building.x, building.y + building.height / 2 + 24, 84, 42);
    scene.physics.add.existing(entrance, true);

    const fullBuilding = {
      ...building,
      shell,
      roof,
      sign,
      door,
      solid: shell,
      entrance,
    };

    shell.setData("building", fullBuilding);
    entrance.setData("building", fullBuilding);

    solids.push(shell);
    entrances.push(fullBuilding);
  });

  return { solids, entrances };
}

export function getBuildingAtEntrance(playerSprite, entrances) {
  const playerBody = playerSprite.body;

  for (const building of entrances) {
    const entranceBody = building.entrance.body;
    if (bodiesOverlap(playerBody, entranceBody)) {
      return building;
    }
  }

  let nearest = null;
  let nearestDistance = 56;

  for (const building of entrances) {
    const distance = Phaser.Math.Distance.Between(
      playerSprite.x,
      playerSprite.y,
      building.entrance.x,
      building.entrance.y
    );

    if (distance < nearestDistance) {
      nearest = building;
      nearestDistance = distance;
    }
  }

  return nearest;
}

function bodiesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
