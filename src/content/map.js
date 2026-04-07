// map.js – tile-based Bologna world layout used by the overworld renderer.

export const MAP_CONFIG = {
  tileSize: 32,
  cols: 25,
  rows: 16,
  hudHeight: 0,
};

export const TILE = {
  BUILDING: 0,
  STREET: 1,
  PIAZZA: 2,
  PORTICO: 3,
  STALL: 4,
  GRASS: 5,
  FOUNTAIN: 6,
};

/* eslint-disable no-multi-spaces, comma-spacing */
export const TILE_MAP = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
  [  0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [  3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3],
  [  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [  0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 6, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0],
  [  3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3],
  [  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [  0, 0, 0, 0, 0, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [  3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 3, 3, 3, 3, 3],
  [  0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [  0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
];
/* eslint-enable no-multi-spaces, comma-spacing */

export const LOCATIONS = [
  {
    id: "mercato_di_mezzo",
    label: "Mercato di Mezzo",
    bx: 0, by: 0, bw: 7, bh: 2,
    tx: 0, ty: 0, w: 7, h: 2,
    entrance: { col: 3, row: 2 },
    style: "market",
    color: "#b07c48",
    description: "A lively market street. Fresh produce and secrets.",
    npcSlots: ["lucia_ferrante"],
  },
  {
    id: "osteria_del_sole",
    label: "Osteria del Sole",
    bx: 18, by: 0, bw: 7, bh: 2,
    tx: 18, ty: 0, w: 7, h: 2,
    entrance: { col: 21, row: 2 },
    style: "osteria",
    color: "#9f6658",
    description: "The oldest osteria in the city. The regulars know everything.",
    npcSlots: ["giorgio_neri", "elena_bianchi"],
  },
  {
    id: "piazza_maggiore",
    label: "Piazza Maggiore",
    bx: 8, by: 4, bw: 9, bh: 4,
    tx: 8, ty: 4, w: 9, h: 4,
    entrance: { col: 12, row: 6 },
    style: "piazza",
    color: "#ceb98e",
    description: "The heart of Bologna. Merchants and gossip abound.",
    npcSlots: ["marco_verdini", "donna_rosa"],
  },
  {
    id: "panetteria_rossi",
    label: "Panetteria Rossi",
    bx: 0, by: 4, bw: 5, bh: 4,
    tx: 0, ty: 4, w: 5, h: 4,
    entrance: { col: 4, row: 5 },
    style: "bakery",
    color: "#c99d6c",
    description: "A bakery with fresh bread and focaccia every morning.",
    npcSlots: ["panettiere_paolo"],
    shop: true,
  },
  {
    id: "caffe_bologna",
    label: "Caffè Bologna",
    bx: 20, by: 4, bw: 5, bh: 4,
    tx: 20, ty: 4, w: 5, h: 4,
    entrance: { col: 20, row: 5 },
    style: "cafe",
    color: "#b58164",
    description: "A cosy café near the porticoes. The perfect espresso.",
    npcSlots: ["barista_giulia"],
    shop: true,
  },
  {
    id: "via_zamboni",
    label: "Via Zamboni",
    bx: 0, by: 10, bw: 5, bh: 3,
    tx: 0, ty: 10, w: 5, h: 3,
    entrance: { col: 4, row: 10 },
    style: "university",
    color: "#798888",
    description: "The university street. Students studying and eavesdropping.",
    npcSlots: ["prof_conti"],
  },
  {
    id: "biblioteca_salaborsa",
    label: "Biblioteca Salaborsa",
    bx: 8, by: 10, bw: 7, bh: 3,
    tx: 8, ty: 10, w: 7, h: 3,
    entrance: { col: 11, row: 9 },
    style: "library",
    color: "#5a6278",
    description: "A grand library. Old documents and archived recipes.",
    npcSlots: ["elena_bianchi"],
  },
];

export const TILE_PALETTE = {
  [TILE.BUILDING]: "#5a4332",
  [TILE.STREET]: "#a49878",
  [TILE.PIAZZA]: "#d9c7a2",
  [TILE.PORTICO]: "#807058",
  [TILE.STALL]: "#7a6844",
  [TILE.GRASS]: "#4e6e40",
  [TILE.FOUNTAIN]: "#7090a0",
};

export function isWalkable(col, row) {
  if (col < 0 || col >= MAP_CONFIG.cols || row < 0 || row >= MAP_CONFIG.rows) return false;
  const tile = TILE_MAP[row]?.[col];
  return tile === TILE.STREET || tile === TILE.PIAZZA || tile === TILE.PORTICO;
}

export function pixelToTile(px, py) {
  return {
    col: Math.floor(px / MAP_CONFIG.tileSize),
    row: Math.floor((py - MAP_CONFIG.hudHeight) / MAP_CONFIG.tileSize),
  };
}
