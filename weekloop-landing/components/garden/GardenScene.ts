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

type Animal = THREE.Group & {
  userData: {
    pick: "room";
    id: string;
    mood: Mood;
    phase: number;
    base: THREE.Vector3;
    homeYaw: number;
    eyes: THREE.Object3D[];
  };
};

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
  ctx.fillStyle = "rgba(16, 22, 19, 0.92)";
  ctx.fillRect(8, 18, 496, 92);
  ctx.fillStyle = accent;
  ctx.fillRect(8, 18, 10, 92);
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "600 42px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const shown = text.length > 22 ? `${text.slice(0, 21)}…` : text;
  ctx.fillText(shown, 268, 64);
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

export class GardenScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
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

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL unavailable");
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(0x101614);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.fog = new THREE.FogExp2(0x101614, 0.022);
    this.scene.add(this.yard);

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    this.camera.position.set(0, 13, 28);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.set(0, 0.2, 2);
    this.controls.enablePan = false;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minPolarAngle = 0.35;
    this.controls.update();

    this.scene.add(new THREE.HemisphereLight(0xd5e2d4, 0x1a1612, 0.9));
    const sun = new THREE.DirectionalLight(0xfff3dd, 1.25);
    sun.position.set(14, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);
    const lantern = new THREE.PointLight(0xff9a4a, 14, 22, 2);
    lantern.position.set(0, 2.4, 0);
    this.scene.add(lantern);

    this.paintGround();
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

  setRooms(rooms: SceneRoom[]) {
    disposeTree(this.yard);
    this.yard.clear();
    this.animals = [];
    this.anchors.clear();
    const active = rooms.filter((room) => !room.archived);
    const archived = rooms.filter((room) => room.archived);
    active.forEach((room, index) => this.placeRoom(room, index, active.length, 12.5, false));
    archived.forEach((room, index) => this.placeRoom(room, index, Math.max(archived.length, 1), 18, true));
  }

  setSides(sides: { id: string; name: string }[]) {
    const existing = this.scene.getObjectByName("fence");
    if (existing) {
      this.scene.remove(existing);
      disposeTree(existing);
    }
    // The fence stands in the plaza by the lamp, built along local z then turned to face the camera.
    const fence = new THREE.Group();
    fence.name = "fence";
    fence.userData = { pick: "side" };
    fence.position.set(0, 0, 3.1);
    fence.rotation.y = Math.PI / 2;
    const wood = std(0x6b4a2e);
    for (let z = -3; z <= 3; z += 1.5) {
      fence.add(mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), wood, 0, 0.45, z));
    }
    fence.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 6.2), wood, 0, 0.72, 0));
    fence.add(mesh(new THREE.BoxGeometry(0.08, 0.08, 6.2), wood, 0, 0.38, 0));
    const sign = new THREE.Group();
    this.addSign(sign, sides.length > 8 ? `Việc phụ · ${sides.length}` : "Việc phụ", 1.75);
    fence.add(sign);
    const shown = sides.slice(0, 8);
    shown.forEach((side, index) => {
      const bird = new THREE.Group();
      bird.userData = { pick: "side", id: side.id, phase: index * 0.7 };
      const span = Math.max(shown.length - 1, 1);
      const z = shown.length === 1 ? 0 : -2.6 + (index / span) * 5.2;
      bird.position.set(0, 0.95, z);
      bird.rotation.y = -Math.PI / 2;
      bird.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), std(0x7f9b86), 0, 0, 0));
      const beak = mesh(new THREE.ConeGeometry(0.045, 0.13, 4), std(0xe2a15a), 0, 0, 0.14);
      beak.rotation.x = Math.PI / 2;
      bird.add(beak);
      fence.add(bird);
    });
    this.scene.add(fence);
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

  focus(id: string | null) {
    if (!id) {
      this.controls.target.set(0, 0.2, 2);
      return;
    }
    const anchor = this.anchors.get(id);
    if (!anchor) return;
    this.controls.target.set(anchor.x * 0.72, 0.7, anchor.z * 0.72);
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
    this.controls.dispose();
    disposeTree(this.scene);
    this.renderer.dispose();
  }

  private paintGround() {
    const ground = mesh(new THREE.CircleGeometry(30, 48), std(0x1a2420, { roughness: 1 }), 0, 0, 0);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.castShadow = false;
    this.scene.add(ground);
    const path = mesh(new THREE.RingGeometry(4.2, 7.4, 48), std(0x24302b), 0, 0.01, 0);
    path.rotation.x = -Math.PI / 2;
    this.scene.add(path);
    const pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), std(0x3a2a1e), 0, 0.8, 0);
    const lamp = mesh(new THREE.SphereGeometry(0.22, 12, 10), std(0xffc27a, { emissive: 0xff8a3d }), 0, 1.7, 0);
    this.scene.add(pole, lamp);
    const stall = new THREE.Group();
    stall.position.set(-2.7, 0, -0.4);
    stall.rotation.y = 0.35;
    stall.userData = { pick: "notes" };
    stall.add(mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8), std(0x5c4030), 0, 0.35, 0));
    stall.add(mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), std(0xf4efe4), 0, 0.76, 0));
    stall.add(mesh(new THREE.BoxGeometry(0.62, 0.08, 0.42), std(0x8f3d3d), 0.05, 0.86, 0));
    this.addSign(stall, "Sổ tay", 1.6);
    this.scene.add(stall);

    // Bookshelf for resources. Notebook, shelf and fence share the plaza by the lamp, so they are always in view.
    const shelf = new THREE.Group();
    shelf.position.set(2.7, 0, -0.6);
    shelf.rotation.y = -0.35;
    shelf.userData = { pick: "resources" };
    shelf.add(mesh(new THREE.BoxGeometry(1.5, 1.5, 0.5), std(0x4a3526), 0, 0.75, 0));
    const spines = [0x8f3d3d, 0x3d6b8f, 0xd9a441, 0x4f8a5b, 0x7a4f9a, 0xc9c2b2];
    for (let row = 0; row < 2; row++) {
      spines.forEach((color, index) => {
        const tall = 0.42 + ((index + row) % 3) * 0.05;
        shelf.add(
          mesh(
            new THREE.BoxGeometry(0.16, tall, 0.3),
            std(spines[(index + row * 2) % spines.length] ?? color),
            -0.5 + index * 0.2,
            0.18 + row * 0.68 + tall / 2,
            0.14
          )
        );
      });
    }
    this.addSign(shelf, "Tài liệu", 2.1);
    this.scene.add(shelf);
  }

  private addSign(target: THREE.Object3D, text: string, height: number) {
    const texture = labelTexture(text, "#e2a15a");
    if (!texture) return;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
    );
    sprite.position.set(0, height, 0);
    sprite.scale.set(2, 0.5, 1);
    target.add(sprite);
  }

  private placeRoom(room: SceneRoom, index: number, count: number, radius: number, archived: boolean) {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    const yaw = Math.atan2(x, z);
    const house = this.makeHouse(room, archived);
    house.position.set(x, 0, z);
    house.rotation.y = yaw;
    house.userData = { pick: "room", id: room.id };
    this.yard.add(house);

    const built = BUILDERS[room.species]();
    const animal = built.group as Animal;
    const outward = 3.3;
    const ax = x + Math.sin(angle) * outward;
    const az = z + Math.cos(angle) * outward;
    animal.position.set(ax, 0, az);
    animal.userData = {
      pick: "room",
      id: room.id,
      mood: room.mood,
      phase: index * 1.3,
      base: new THREE.Vector3(ax, 0, az),
      homeYaw: yaw,
      eyes: built.eyes,
    };
    animal.scale.setScalar(1.2);
    this.yard.add(animal);
    this.animals.push(animal);
    this.anchors.set(room.id, new THREE.Vector3(x, 0, z));
  }

  private makeHouse(room: SceneRoom, archived: boolean) {
    const group = new THREE.Group();
    let color = new THREE.Color("#6d8f78");
    try {
      color = new THREE.Color(room.color);
    } catch {
      color = new THREE.Color("#6d8f78");
    }
    const wall = color.clone().multiplyScalar(archived ? 0.28 : 0.55);
    const roof = color.clone().multiplyScalar(archived ? 0.18 : 0.32);
    group.add(mesh(new THREE.BoxGeometry(2.3, 1.35, 2.1), std(wall.getHex()), 0, 0.72, 0));
    const roofMesh = mesh(new THREE.ConeGeometry(1.85, 0.9, 4), std(roof.getHex()), 0, 1.75, 0);
    roofMesh.rotation.y = Math.PI / 4;
    group.add(roofMesh);
    const glow = room.mood === "work" ? 0xff9a4a : room.mood === "wait" ? 0x8fb7c9 : 0x000000;
    group.add(mesh(new THREE.BoxGeometry(0.46, 0.7, 0.08), std(0x2a2118), 0, 0.48, 1.06));
    const windowMat = std(glow || 0x1c2622, { emissive: glow || undefined });
    group.add(mesh(new THREE.BoxGeometry(0.42, 0.36, 0.06), windowMat, -0.55, 0.9, 1.06));
    group.add(mesh(new THREE.BoxGeometry(0.42, 0.36, 0.06), windowMat, 0.55, 0.9, 1.06));
    const texture = labelTexture(room.archived ? `${room.name} · cất` : room.name, room.color || "#e2a15a");
    if (texture) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
      );
      sprite.position.set(0, 2.55, 0);
      sprite.scale.set(2.8, 0.7, 1);
      group.add(sprite);
    }
    return group;
  }

  private tick = () => {
    if (!this.alive) return;
    this.frame = requestAnimationFrame(this.tick);
    const t = this.clock.getElapsedTime();
    for (const animal of this.animals) {
      const { mood, phase, base, homeYaw, eyes } = animal.userData;
      if (mood === "work") {
        const a = t * 0.85 + phase;
        animal.position.set(base.x + Math.cos(a) * 0.55, Math.abs(Math.sin(a * 2)) * 0.06, base.z + Math.sin(a) * 0.55);
        animal.rotation.set(0, -a + Math.PI / 2, 0);
      } else if (mood === "sleep") {
        animal.position.set(base.x, -0.05, base.z);
        animal.rotation.set(0, homeYaw, 0.55);
      } else {
        animal.position.set(base.x, 0, base.z);
        animal.rotation.set(0, homeYaw + Math.sin(t * 0.7 + phase) * 0.45, 0);
      }
      const eyeScale = mood === "sleep" ? 0.2 : 1;
      for (const eye of eyes) eye.scale.y = eyeScale;
    }
    const fence = this.scene.getObjectByName("fence");
    fence?.children.forEach((child) => {
      if (child.userData?.pick === "side") {
        child.position.y = 0.95 + Math.sin(t * 2 + (child.userData.phase as number)) * 0.05;
      }
    });
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
