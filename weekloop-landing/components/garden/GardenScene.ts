import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Mood, Species } from "@/lib/garden/model";

export interface SceneRoom {
  id: string;
  name: string;
  color: string;
  species: Species;
  archived: boolean;
  mood: Mood;
  /** One entry per employee at a desk (1 to 3), from this week's tasks. */
  staff: Mood[];
  done: number;
  total: number;
}

export interface ScenePick {
  kind: "room" | "side" | "notes" | "resources";
  id?: string;
  name?: string;
  x: number;
  y: number;
}

/** A looping day for a working employee: sit, walk to the lobby, stand a while, walk back. */
type Step =
  | { kind: "stay"; at: THREE.Vector3; yaw: number; dur: number; typing: boolean }
  | { kind: "walk"; from: THREE.Vector3; to: THREE.Vector3; dur: number };

type Animal = THREE.Group & {
  userData: {
    pick: "room";
    id: string;
    mood: Mood;
    phase: number;
    seat: THREE.Vector3;
    deskYaw: number;
    eyes: THREE.Object3D[];
    steps: Step[];
    total: number;
  };
};

const ROOM_W = 5.6;
const ROOM_D = 4.8;
const HALL_D = 6.4;
const WALK_SPEED = 1.5;
const WALL = 0xf6f3ec;
const NOTE_COLORS = [0xffe27a, 0xffb3c7, 0xa9d8ff, 0xb9ecb0];

function std(color: number, extra?: { emissive?: number; roughness?: number }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: extra?.roughness ?? 0.72,
    metalness: 0.04,
    emissive: extra?.emissive ?? 0x000000,
    emissiveIntensity: extra?.emissive ? 0.45 : 0,
  });
}

function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function addEyes(group: THREE.Group, y: number, z: number, spread: number, scale = 1) {
  const eyes: THREE.Mesh[] = [];
  const white = std(0xf4f0e6, { roughness: 0.35 });
  const pupil = std(0x1b1712, { roughness: 0.3 });
  for (const side of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(0.055 * scale, 10, 8), white, side * spread, y, z);
    const dot = mesh(
      new THREE.SphereGeometry(0.026 * scale, 8, 6),
      pupil,
      side * spread,
      y,
      z + 0.045 * scale
    );
    group.add(eye, dot);
    eyes.push(eye);
  }
  return eyes;
}

function fox(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(0xd5722b);
  const cream = std(0xf0d7b4);
  const dark = std(0x6b3318);
  group.add(mesh(new THREE.BoxGeometry(0.72, 0.42, 1.05), fur, 0, 0.38, 0));
  group.add(mesh(new THREE.BoxGeometry(0.48, 0.4, 0.48), fur, 0, 0.72, 0.42));
  group.add(mesh(new THREE.BoxGeometry(0.22, 0.16, 0.28), cream, 0, 0.62, 0.66));
  group.add(mesh(new THREE.BoxGeometry(0.16, 0.16, 0.55), dark, 0, 0.48, -0.7));
  const earL = mesh(new THREE.ConeGeometry(0.1, 0.28, 4), fur, -0.16, 1.02, 0.38);
  const earR = mesh(new THREE.ConeGeometry(0.1, 0.28, 4), fur, 0.16, 1.02, 0.38);
  group.add(earL, earR);
  return { group, eyes: addEyes(group, 0.76, 0.66, 0.12) };
}

function ant(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const body = std(0x2c241c);
  group.add(mesh(new THREE.SphereGeometry(0.22, 12, 10), body, 0, 0.28, -0.28));
  group.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), body, 0, 0.34, 0.02));
  group.add(mesh(new THREE.SphereGeometry(0.18, 12, 10), body, 0, 0.42, 0.28));
  const antenna = std(0x1a140f);
  for (const side of [-1, 1]) {
    const stick = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 6), antenna, side * 0.08, 0.7, 0.34);
    stick.rotation.z = side * 0.5;
    group.add(stick);
    group.add(mesh(new THREE.SphereGeometry(0.045, 8, 6), antenna, side * 0.2, 0.86, 0.34));
  }
  return { group, eyes: addEyes(group, 0.48, 0.4, 0.07, 0.7) };
}

function penguin(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  group.add(mesh(new THREE.SphereGeometry(0.42, 14, 12), std(0x1e242b), 0, 0.48, 0));
  group.add(mesh(new THREE.SphereGeometry(0.26, 12, 10), std(0xf7f4ee), 0, 0.4, 0.22));
  group.add(mesh(new THREE.ConeGeometry(0.08, 0.22, 4), std(0xe07a2f), 0, 0.52, 0.48));
  group.add(mesh(new THREE.BoxGeometry(0.16, 0.08, 0.28), std(0xf0a04a), -0.12, 0.08, 0.12));
  group.add(mesh(new THREE.BoxGeometry(0.16, 0.08, 0.28), std(0xf0a04a), 0.12, 0.08, 0.12));
  return { group, eyes: addEyes(group, 0.62, 0.32, 0.12, 0.85) };
}

function tiger(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(0xe08a2c);
  const stripe = std(0x2a211c);
  group.add(mesh(new THREE.BoxGeometry(0.7, 0.46, 1.15), fur, 0, 0.42, 0));
  group.add(mesh(new THREE.BoxGeometry(0.08, 0.2, 0.7), stripe, 0, 0.62, -0.05));
  group.add(mesh(new THREE.BoxGeometry(0.46, 0.4, 0.46), fur, 0, 0.72, 0.48));
  group.add(mesh(new THREE.BoxGeometry(0.12, 0.28, 0.5), stripe, 0, 0.5, -0.78));
  for (const side of [-1, 1]) {
    group.add(mesh(new THREE.ConeGeometry(0.09, 0.2, 4), fur, side * 0.16, 0.98, 0.42));
  }
  return { group, eyes: addEyes(group, 0.76, 0.7, 0.12) };
}

function dog(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(0xc4a574);
  group.add(mesh(new THREE.BoxGeometry(0.62, 0.4, 0.95), fur, 0, 0.36, 0));
  group.add(mesh(new THREE.BoxGeometry(0.42, 0.38, 0.42), fur, 0, 0.66, 0.38));
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.BoxGeometry(0.12, 0.28, 0.08), std(0x8c6844), side * 0.2, 0.78, 0.28);
    ear.rotation.z = side * 0.4;
    group.add(ear);
  }
  group.add(mesh(new THREE.BoxGeometry(0.1, 0.12, 0.28), fur, 0, 0.42, -0.58));
  return { group, eyes: addEyes(group, 0.7, 0.58, 0.11) };
}

function parrot(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  group.add(mesh(new THREE.SphereGeometry(0.32, 12, 10), std(0x3aaa6a), 0, 0.48, 0));
  group.add(mesh(new THREE.ConeGeometry(0.1, 0.28, 4), std(0xf0b429), 0, 0.5, 0.32));
  const wing = mesh(new THREE.BoxGeometry(0.55, 0.08, 0.28), std(0x1f7a45), 0, 0.5, 0);
  wing.rotation.z = 0.3;
  group.add(wing);
  group.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.22, 6), std(0xe7d7b0), 0, 0.18, 0));
  return { group, eyes: addEyes(group, 0.58, 0.2, 0.1, 0.8) };
}

function cook(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const built = cat(0xd9d3cc);
  const hat = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.16, 8), std(0xf7f7f5), 0, 1.05, 0.05);
  built.group.add(hat);
  return built;
}

function chesscat(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const built = cat(0x2e3138);
  built.group.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 8), std(0xf4f1ea), 0.34, 0.2, 0.2));
  built.group.add(mesh(new THREE.SphereGeometry(0.09, 10, 8), std(0xf4f1ea), 0.34, 0.36, 0.2));
  return built;
}

function cat(color: number): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(color);
  group.add(mesh(new THREE.BoxGeometry(0.62, 0.36, 0.95), fur, 0, 0.34, 0));
  group.add(mesh(new THREE.BoxGeometry(0.4, 0.34, 0.4), fur, 0, 0.64, 0.36));
  for (const side of [-1, 1]) {
    group.add(mesh(new THREE.ConeGeometry(0.08, 0.2, 4), fur, side * 0.12, 0.9, 0.32));
  }
  group.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 5), fur, 0.2, 0.48, -0.55));
  return { group, eyes: addEyes(group, 0.68, 0.56, 0.1) };
}

function tanuki(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(0x8d5a32);
  group.add(mesh(new THREE.SphereGeometry(0.4, 14, 12), fur, 0, 0.42, 0));
  group.add(mesh(new THREE.BoxGeometry(0.46, 0.22, 0.16), std(0x2a211c), 0, 0.52, 0.32));
  group.add(mesh(new THREE.BoxGeometry(0.16, 0.18, 0.4), fur, 0, 0.36, -0.48));
  return { group, eyes: addEyes(group, 0.58, 0.28, 0.12) };
}

function crane(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const paper = std(0xf4f7fb);
  group.add(mesh(new THREE.SphereGeometry(0.28, 12, 10), paper, 0, 0.7, 0));
  const neck = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 6), paper, 0, 1.05, 0.12);
  neck.rotation.x = 0.4;
  group.add(neck);
  group.add(mesh(new THREE.BoxGeometry(0.08, 0.06, 0.32), std(0xe2b15a), 0, 1.28, 0.32));
  group.add(mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), std(0xd7c3a2), -0.08, 0.25, 0));
  group.add(mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), std(0xd7c3a2), 0.08, 0.25, 0));
  return { group, eyes: addEyes(group, 1.22, 0.22, 0.07, 0.65) };
}

function moth(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  group.add(mesh(new THREE.CapsuleGeometry(0.1, 0.28, 4, 8), std(0x6d5a3a), 0, 0.45, 0));
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xc9b07a,
    roughness: 0.55,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
  });
  for (const side of [-1, 1]) {
    const wing = mesh(new THREE.CircleGeometry(0.34, 7), wingMat, side * 0.28, 0.5, 0);
    wing.rotation.y = side * 0.6;
    group.add(wing);
  }
  return { group, eyes: addEyes(group, 0.62, 0.08, 0.06, 0.6) };
}

function hare(): { group: THREE.Group; eyes: THREE.Object3D[] } {
  const group = new THREE.Group();
  const fur = std(0xe7e1d6);
  group.add(mesh(new THREE.SphereGeometry(0.32, 12, 10), fur, 0, 0.36, 0));
  group.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), fur, 0, 0.58, 0.16));
  for (const side of [-1, 1]) {
    group.add(mesh(new THREE.CapsuleGeometry(0.04, 0.32, 3, 6), fur, side * 0.08, 0.92, 0.12));
  }
  return { group, eyes: addEyes(group, 0.6, 0.3, 0.08, 0.75) };
}

const BUILDERS: Record<Species, () => { group: THREE.Group; eyes: THREE.Object3D[] }> = {
  fox,
  ant,
  penguin,
  tiger,
  dog,
  parrot,
  cook,
  chesscat,
  tanuki,
  crane,
  moth,
  hare,
};

function labelTexture(text: string, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.beginPath();
  ctx.roundRect(8, 18, 496, 92, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(29, 38, 34, 0.18)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(8, 18, 16, 92, [18, 0, 0, 18]);
  ctx.fill();
  ctx.fillStyle = "#1d2622";
  ctx.font = "600 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const shown = text.length > 22 ? `${text.slice(0, 21)}…` : text;
  ctx.fillText(shown, 266, 66);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((object) => {
    const meshObject = object as THREE.Mesh;
    meshObject.geometry?.dispose();
    const material = meshObject.material;
    const materials = Array.isArray(material) ? material : material ? [material] : [];
    for (const item of materials) {
      const mapped = item as THREE.MeshStandardMaterial;
      mapped.map?.dispose();
      item.dispose();
    }
  });
}

function readPick(object: THREE.Object3D | null): { kind: ScenePick["kind"]; id?: string } | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const data = current.userData as { pick?: ScenePick["kind"]; id?: string };
    if (data?.pick) return { kind: data.pick, id: data.id };
    current = current.parent;
  }
  return null;
}

function plant(x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.34, 10), std(0xc9825b), 0, 0.17, 0));
  group.add(mesh(new THREE.SphereGeometry(0.34, 10, 8), std(0x4f9d5d), 0, 0.62, 0));
  group.add(mesh(new THREE.SphereGeometry(0.24, 10, 8), std(0x66b36f), 0.12, 0.9, 0.05));
  return group;
}

function walk(from: THREE.Vector3, to: THREE.Vector3): Step {
  return { kind: "walk", from, to, dur: Math.max(from.distanceTo(to) / WALK_SPEED, 0.01) };
}

export class GardenScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  /** Everything that depends on the list of departments. Rebuilt by setRooms. */
  private yard = new THREE.Group();
  private animals: Animal[] = [];
  private anchors = new Map<string, THREE.Vector3>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private frame = 0;
  private clock = new THREE.Clock();
  private down: { x: number; y: number } | null = null;
  private hovered: string | null = null;
  private onPick: ((pick: ScenePick) => void) | null = null;
  private onHover: ((pick: ScenePick | null) => void) | null = null;
  private alive = true;
  private halfW = 10;
  private halfD = 9;
  private layoutKey = "";

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL unavailable");
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(0xe4edf2);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(this.yard);

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 300);
    this.camera.position.set(0, 26, 20);
    this.controls = new OrbitControls(this.camera, canvas);
    // An office is read like a floor plan: drag moves across it, right-drag (or two fingers) turns it.
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 7;
    this.controls.maxPolarAngle = 1.15;
    this.controls.minPolarAngle = 0.2;
    this.controls.addEventListener("change", this.keepInside);

    // Daylight: bright sky fill plus one soft sun for shadows.
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c3, 1.9));
    const sun = new THREE.DirectionalLight(0xfff6e6, 1.7);
    sun.position.set(-14, 30, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 90;
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 26;
    sun.shadow.camera.bottom = -26;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);

    this.buildLobby();
    canvas.addEventListener("pointerdown", this.handleDown);
    canvas.addEventListener("pointerup", this.handleUp);
    canvas.addEventListener("pointermove", this.handleMove);
    this.resize();
    this.tick();
  }

  setHandlers(onPick: (pick: ScenePick) => void, onHover: (pick: ScenePick | null) => void) {
    this.onPick = onPick;
    this.onHover = onHover;
  }

  /** Two rows of departments on either side of a shared hall. Active ones first, shelved ones at the end. */
  setRooms(rooms: SceneRoom[]) {
    disposeTree(this.yard);
    this.yard.clear();
    this.animals = [];
    this.anchors.clear();

    const ordered = [...rooms.filter((room) => !room.archived), ...rooms.filter((room) => room.archived)];
    const top = Math.ceil(ordered.length / 2);
    const bottom = ordered.length - top;
    const cols = Math.max(top, 1);
    const hallW = Math.max(cols * ROOM_W, 13) + 1.2;
    this.halfW = hallW / 2;
    this.halfD = HALL_D / 2 + ROOM_D + 0.6;
    this.buildFloor(hallW);

    ordered.forEach((room, index) => {
      const upper = index < top;
      const slot = upper ? index : index - top;
      const count = upper ? top : bottom;
      const x = (slot - (count - 1) / 2) * ROOM_W;
      const z = (upper ? -1 : 1) * (HALL_D / 2 + ROOM_D / 2);
      this.placeRoom(room, index, x, z, upper);
    });

    const key = `${top}:${bottom}`;
    if (key !== this.layoutKey) {
      this.layoutKey = key;
      this.frameAll();
    }
  }

  /** Side tasks are sticky notes on the pin board in the lobby. The board shows eight; the panel lists all. */
  setSides(sides: { id: string; name: string }[]) {
    const existing = this.scene.getObjectByName("sideboard");
    if (existing) {
      this.scene.remove(existing);
      disposeTree(existing);
    }
    const board = new THREE.Group();
    board.name = "sideboard";
    board.userData = { pick: "side" };
    board.position.set(0, 0, -0.5);
    const frame = std(0x8a6a4a);
    board.add(mesh(new THREE.BoxGeometry(0.1, 1.9, 0.1), frame, -1.55, 0.95, 0));
    board.add(mesh(new THREE.BoxGeometry(0.1, 1.9, 0.1), frame, 1.55, 0.95, 0));
    board.add(mesh(new THREE.BoxGeometry(3.3, 1.3, 0.08), std(0xd9b98a, { roughness: 0.95 }), 0, 1.3, 0));
    const shown = sides.slice(0, 8);
    shown.forEach((side, index) => {
      const note = mesh(
        new THREE.BoxGeometry(0.52, 0.42, 0.03),
        std(NOTE_COLORS[index % NOTE_COLORS.length], { roughness: 0.9 }),
        -1.1 + (index % 4) * 0.73,
        index < 4 ? 1.58 : 1.04,
        0.06
      );
      note.rotation.z = ((index * 37) % 9 - 4) * 0.02;
      note.castShadow = false;
      note.userData = { pick: "side", id: side.id };
      board.add(note);
    });
    this.addSign(board, sides.length > 8 ? `Việc phụ · ${sides.length}` : "Việc phụ", 2.45);
    this.scene.add(board);
  }

  screenPosition(id: string): { x: number; y: number } | null {
    const anchor = this.anchors.get(id);
    if (!anchor) return null;
    const point = anchor.clone();
    point.y = 1.2;
    point.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (point.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-point.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  /** Slide the view over to a department without changing zoom or angle. */
  focus(id: string | null) {
    const anchor = id ? this.anchors.get(id) : null;
    const goal = anchor ? new THREE.Vector3(anchor.x, 0, anchor.z * 0.75) : new THREE.Vector3(0, 0, 0);
    const shift = goal.sub(this.controls.target);
    this.controls.target.add(shift);
    this.camera.position.add(shift);
  }

  resize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.alive = false;
    cancelAnimationFrame(this.frame);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.handleDown);
    canvas.removeEventListener("pointerup", this.handleUp);
    canvas.removeEventListener("pointermove", this.handleMove);
    this.controls.removeEventListener("change", this.keepInside);
    this.controls.dispose();
    disposeTree(this.scene);
    this.renderer.dispose();
  }

  /** Whole floor in view on a wide screen. On a tall phone, fit the depth and let the user drag sideways. */
  private frameAll() {
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const byDepth = (this.halfD * 1.25) / tan;
    const byWidth = (this.halfW * 1.08) / (tan * this.camera.aspect);
    const distance = this.camera.aspect < 1 ? byDepth : Math.max(byDepth, byWidth);
    const direction = new THREE.Vector3(0, 0.8, 0.6).normalize();
    this.controls.target.set(0, 0, 0);
    this.camera.position.copy(direction.multiplyScalar(distance));
    this.controls.maxDistance = Math.max(distance * 1.5, 30);
    this.controls.update();
  }

  private keepInside = () => {
    const target = this.controls.target;
    const x = THREE.MathUtils.clamp(target.x, -this.halfW, this.halfW);
    const z = THREE.MathUtils.clamp(target.z, -this.halfD, this.halfD);
    if (x === target.x && z === target.z && target.y === 0) return;
    this.camera.position.x += x - target.x;
    this.camera.position.z += z - target.z;
    target.set(x, 0, z);
  };

  private addSign(target: THREE.Object3D, text: string, height: number, accent = "#e2a15a", scale = 1) {
    const texture = labelTexture(text, accent);
    if (!texture) return;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
    );
    sprite.position.set(0, height, 0);
    sprite.scale.set(2.4 * scale, 0.6 * scale, 1);
    target.add(sprite);
  }

  /** Shared things in the middle of the hall: notebook desk, pin board (built in setSides), filing shelf. */
  private buildLobby() {
    const rug = mesh(new THREE.BoxGeometry(11, 0.02, 3.6), std(0xcfe0e6, { roughness: 1 }), 0, 0.06, 0);
    rug.castShadow = false;
    this.scene.add(rug);

    const reception = new THREE.Group();
    reception.position.set(-3.9, 0, 0);
    reception.userData = { pick: "notes" };
    reception.add(mesh(new THREE.BoxGeometry(1.9, 0.85, 0.9), std(0xe8dcc6), 0, 0.43, 0));
    reception.add(mesh(new THREE.BoxGeometry(2.05, 0.08, 1.05), std(0xb98a5a), 0, 0.9, 0));
    reception.add(mesh(new THREE.BoxGeometry(0.75, 0.1, 0.55), std(0xfbf8f0), -0.25, 1.0, 0.05));
    reception.add(mesh(new THREE.BoxGeometry(0.66, 0.08, 0.48), std(0xc94f4f), -0.2, 1.09, 0.05));
    reception.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), std(0x2f5fa8), 0.55, 1.0, 0.1));
    this.addSign(reception, "Sổ tay", 1.95);
    this.scene.add(reception);

    const shelf = new THREE.Group();
    shelf.position.set(3.9, 0, -0.2);
    shelf.userData = { pick: "resources" };
    shelf.add(mesh(new THREE.BoxGeometry(1.9, 1.7, 0.55), std(0xf2ede2), 0, 0.85, 0));
    const spines = [0xc94f4f, 0x3d7fc0, 0xe0a83a, 0x4f9d5d, 0x8a5fb5, 0x8f9aa3];
    for (let row = 0; row < 3; row++) {
      for (let index = 0; index < 8; index++) {
        const tall = 0.32 + ((index + row) % 3) * 0.04;
        shelf.add(
          mesh(
            new THREE.BoxGeometry(0.17, tall, 0.3),
            std(spines[(index + row * 2) % spines.length]),
            -0.74 + index * 0.21,
            0.14 + row * 0.53 + tall / 2,
            0.16
          )
        );
      }
    }
    this.addSign(shelf, "Tài liệu", 2.3);
    this.scene.add(shelf);
  }

  private buildFloor(hallW: number) {
    const depth = HALL_D + ROOM_D * 2 + 1.2;
    const slab = mesh(new THREE.BoxGeometry(hallW + 1.6, 0.4, depth + 1.6), std(0xc9d3d8, { roughness: 1 }), 0, -0.22, 0);
    slab.castShadow = false;
    const floor = mesh(new THREE.BoxGeometry(hallW, 0.1, depth), std(0xf1e8d8, { roughness: 0.9 }), 0, 0, 0);
    floor.castShadow = false;
    this.yard.add(slab, floor);

    // Break corners at both ends of the hall, where employees wander to.
    const edge = hallW / 2 - 0.9;
    const cooler = new THREE.Group();
    cooler.position.set(-edge, 0, 0);
    cooler.add(mesh(new THREE.BoxGeometry(0.5, 0.95, 0.5), std(0xf7f7f5), 0, 0.5, 0));
    cooler.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), std(0x9fd3f2, { roughness: 0.2 }), 0, 1.22, 0));
    const coffee = new THREE.Group();
    coffee.position.set(edge, 0, 0);
    coffee.add(mesh(new THREE.BoxGeometry(0.9, 0.8, 0.6), std(0xb98a5a), 0, 0.42, 0));
    coffee.add(mesh(new THREE.BoxGeometry(0.4, 0.45, 0.35), std(0x3b4046), -0.15, 1.05, 0));
    coffee.add(mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 10), std(0xfbf8f0), 0.25, 0.9, 0.05));
    this.yard.add(cooler, coffee, plant(-edge, 1.4), plant(edge, -1.4), plant(-edge, -1.4), plant(edge, 1.4));
  }

  /**
   * A department. Built facing +z (door toward the hall) and turned around for the lower row, so the
   * tall back wall is always the far one and the wall nearest the camera stays low.
   */
  private placeRoom(room: SceneRoom, index: number, x: number, z: number, upper: boolean) {
    const sign = upper ? 1 : -1;
    const toWorld = (lx: number, lz: number) => new THREE.Vector3(x + sign * lx, 0, z + sign * lz);
    let tint = new THREE.Color("#6d8f78");
    try {
      tint = new THREE.Color(room.color);
    } catch {
      /* keep the default tint */
    }
    if (room.archived) tint = new THREE.Color(0x9aa3a0);
    const carpet = tint.clone().lerp(new THREE.Color(0xffffff), 0.72);

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = upper ? 0 : Math.PI;
    group.userData = { pick: "room", id: room.id };

    const floor = mesh(new THREE.BoxGeometry(ROOM_W - 0.1, 0.04, ROOM_D - 0.1), std(carpet.getHex(), { roughness: 1 }), 0, 0.07, 0);
    floor.castShadow = false;
    group.add(floor);

    const wall = std(WALL, { roughness: 0.9 });
    const half = ROOM_W / 2;
    const deep = ROOM_D / 2;
    const backH = upper ? 1.7 : 0.5;
    const sideH = upper ? 1.15 : 0.7;
    group.add(mesh(new THREE.BoxGeometry(ROOM_W, backH, 0.12), wall, 0, backH / 2 + 0.05, -deep));
    group.add(mesh(new THREE.BoxGeometry(0.12, sideH, ROOM_D), wall, -half, sideH / 2 + 0.05, 0));
    group.add(mesh(new THREE.BoxGeometry(0.12, sideH, ROOM_D), wall, half, sideH / 2 + 0.05, 0));
    // Door side: two low partitions with the department colour on top, gap in the middle.
    const door = 1.7;
    const part = (ROOM_W - door) / 2;
    for (const side of [-1, 1]) {
      const px = side * (door / 2 + part / 2);
      group.add(mesh(new THREE.BoxGeometry(part, 0.6, 0.12), wall, px, 0.35, deep));
      group.add(mesh(new THREE.BoxGeometry(part, 0.07, 0.16), std(tint.getHex()), px, 0.69, deep));
    }
    if (upper) group.add(mesh(new THREE.BoxGeometry(ROOM_W, 0.07, 0.16), std(tint.getHex()), 0, backH + 0.08, -deep));

    const texture = labelTexture(room.archived ? `${room.name} · cất` : room.name, room.archived ? "#9aa3a0" : room.color || "#e2a15a");
    if (texture) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      sprite.position.set(0, upper ? 2.45 : 1.75, upper ? -deep : deep);
      sprite.scale.set(3, 0.75, 1);
      group.add(sprite);
    }
    group.add(plant(half - 0.5, deep - 0.5));

    // One desk per employee, in a row along the back wall.
    const staff = room.staff.length ? room.staff.slice(0, 3) : (["sleep"] as Mood[]);
    const deskYaw = upper ? Math.PI : 0;
    staff.forEach((mood, slot) => {
      const dx = (slot - (staff.length - 1) / 2) * 1.65;
      group.add(this.makeDesk(dx, -deep + 0.75, mood));

      const built = BUILDERS[room.species]();
      const animal = built.group as Animal;
      const seat = toWorld(dx, -deep + 1.75);
      const steps: Step[] = [];
      if (mood === "work") {
        const doorIn = toWorld(0, deep - 0.7);
        const doorOut = toWorld(0, deep + 1.3);
        const stops = [-3.9, 0, 3.9, -(this.halfW - 1.9), this.halfW - 1.9];
        const stop = new THREE.Vector3(stops[(index + slot * 2) % stops.length], 0, -sign * 1.45);
        steps.push(
          { kind: "stay", at: seat, yaw: deskYaw, dur: 6 + ((index + slot) % 3) * 2, typing: true },
          walk(seat, doorIn),
          walk(doorIn, doorOut),
          walk(doorOut, stop),
          { kind: "stay", at: stop, yaw: upper ? 0 : Math.PI, dur: 3, typing: false },
          walk(stop, doorOut),
          walk(doorOut, doorIn),
          walk(doorIn, seat)
        );
      }
      animal.userData = {
        pick: "room",
        id: room.id,
        mood,
        phase: index * 3.7 + slot * 5.3,
        seat,
        deskYaw,
        eyes: built.eyes,
        steps,
        total: steps.reduce((sum, step) => sum + step.dur, 0),
      };
      animal.scale.setScalar(0.85);
      animal.position.copy(seat);
      this.yard.add(animal);
      this.animals.push(animal);
    });

    this.yard.add(group);
    this.anchors.set(room.id, new THREE.Vector3(x, 0, z));
  }

  private makeDesk(x: number, z: number, mood: Mood) {
    const desk = new THREE.Group();
    desk.position.set(x, 0, z);
    const wood = std(0xd8b98c);
    desk.add(mesh(new THREE.BoxGeometry(1.3, 0.07, 0.7), wood, 0, 0.72, 0));
    for (const sx of [-0.58, 0.58]) {
      desk.add(mesh(new THREE.BoxGeometry(0.07, 0.7, 0.6), std(0xbfc6c9), sx, 0.36, 0));
    }
    desk.add(mesh(new THREE.BoxGeometry(0.08, 0.2, 0.06), std(0x4a5056), 0, 0.85, -0.12));
    desk.add(mesh(new THREE.BoxGeometry(0.66, 0.42, 0.05), std(0x30353a), 0, 1.12, -0.12));
    // The screen tells the task's state: lit while in progress, pale while waiting, dark when done.
    const screen = mood === "work" ? std(0xbfe6ff, { emissive: 0x7cc6ff }) : mood === "wait" ? std(0xdfe6ea) : std(0x4a5056);
    const glass = mesh(new THREE.BoxGeometry(0.58, 0.34, 0.02), screen, 0, 1.12, -0.085);
    glass.castShadow = false;
    desk.add(glass);
    desk.add(mesh(new THREE.BoxGeometry(0.42, 0.03, 0.16), std(0xf2f2f0), 0, 0.775, 0.14));
    return desk;
  }

  private tick = () => {
    if (!this.alive) return;
    this.frame = requestAnimationFrame(this.tick);
    const t = this.clock.getElapsedTime();
    for (const animal of this.animals) {
      const { mood, phase, seat, deskYaw, eyes, steps, total } = animal.userData;
      let eyeScale = 1;
      if (mood === "work" && total > 0) {
        let left = (t + phase) % total;
        let step = steps[0];
        for (const candidate of steps) {
          step = candidate;
          if (left < candidate.dur) break;
          left -= candidate.dur;
        }
        if (step.kind === "walk") {
          const k = Math.min(left / step.dur, 1);
          animal.position.lerpVectors(step.from, step.to, k);
          animal.position.y = Math.abs(Math.sin(t * 9 + phase)) * 0.07;
          animal.rotation.set(0, Math.atan2(step.to.x - step.from.x, step.to.z - step.from.z), 0);
        } else {
          animal.position.copy(step.at);
          animal.position.y = step.typing ? Math.abs(Math.sin(t * 6 + phase)) * 0.025 : 0;
          animal.rotation.set(0, step.yaw + (step.typing ? 0 : Math.sin(t * 1.3 + phase) * 0.5), 0);
        }
      } else if (mood === "sleep") {
        animal.position.set(seat.x, -0.04, seat.z);
        animal.rotation.set(0, deskYaw, 0.5);
        eyeScale = 0.2;
      } else {
        // Waiting: at the desk, looking around for something to start.
        animal.position.copy(seat);
        animal.rotation.set(0, deskYaw + Math.sin(t * 0.7 + phase) * 0.9, 0);
      }
      for (const eye of eyes) eye.scale.y = eyeScale;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private handleDown = (event: PointerEvent) => {
    this.down = { x: event.clientX, y: event.clientY };
  };

  private handleUp = (event: PointerEvent) => {
    if (!this.down) return;
    const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    this.down = null;
    if (moved > 6) return;
    const hit = this.cast(event);
    if (!hit) return;
    this.onPick?.({ ...hit, x: event.clientX, y: event.clientY });
  };

  private handleMove = (event: PointerEvent) => {
    const hit = this.cast(event);
    const key = hit ? `${hit.kind}:${hit.id ?? ""}` : "";
    const canvas = this.renderer.domElement;
    canvas.style.cursor = hit ? "pointer" : "grab";
    if (key === this.hovered) return;
    this.hovered = key;
    this.onHover?.(hit ? { ...hit, x: event.clientX, y: event.clientY } : null);
  };

  private cast(event: PointerEvent): { kind: ScenePick["kind"]; id?: string } | null {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      const pick = readPick(hit.object);
      if (pick) return pick;
    }
    return null;
  }
}
