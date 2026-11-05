import * as THREE from 'three';
import { MaterialFinish, PartInfo } from '../../types';
import {
  createCarbonFiberTexture,
  createRadialShadowTexture,
  createSolarCellTexture,
} from '../proceduralTextures';
import { soundSynth } from '../../audio/soundSynth';

export class RoverScene {
  public rootGroup: THREE.Group;
  public parts: { object: THREE.Object3D; basePos: THREE.Vector3; explodeOffset: THREE.Vector3; info: PartInfo }[] = [];

  // Animated elements
  private wheels: THREE.Group[] = [];
  private lidarDome!: THREE.Group;
  private cameraHead!: THREE.Group;
  private roboticArm!: THREE.Group;
  private armJoint2!: THREE.Group;
  private armClaw!: THREE.Group;
  private rockInstances!: THREE.InstancedMesh;
  private headlightCone!: THREE.Mesh;

  // Materials for finish switching
  private hullMaterials: THREE.MeshStandardMaterial[] = [];
  private solarWingMaterial!: THREE.MeshStandardMaterial;
  private tireMaterial!: THREE.MeshStandardMaterial;
  private goldFoilMaterial!: THREE.MeshStandardMaterial;
  private glowMaterial!: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'CyberScoutRover';
    scene.add(this.rootGroup);

    this.initMaterials(renderer, isSoftwareGl);
    this.buildTerrain(scene);
    this.buildRover(renderer);
    this.applyFinish('default');
  }

  private initMaterials(renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 1. Solar cell material
    const solarTex = createSolarCellTexture(maxAnisotropy);
    this.solarWingMaterial = new THREE.MeshStandardMaterial({
      map: solarTex,
      metalness: 0.9,
      roughness: 0.25,
    });

    // 2. Heavy-duty rubber tire
    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.88,
      metalness: 0.1,
    });

    // 3. Gold thermal insulation foil
    this.goldFoilMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc33,
      metalness: 0.98,
      roughness: 0.32,
    });

    // 4. Cyan LiDAR sensor glow
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });
  }

  private buildTerrain(scene: THREE.Scene) {
    // Large martian terrain extending to horizon
    const terrainGeom = new THREE.PlaneGeometry(64, 64, 48, 48);
    const pos = terrainGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle dunes and craters
      const distFromCenter = Math.sqrt(x * x + y * y);
      if (distFromCenter > 4) {
        const height = Math.sin(x * 0.2) * Math.cos(y * 0.2) * 0.6 + Math.sin(x * 0.08) * 1.2;
        pos.setZ(i, height);
      } else {
        // Flat landing zone for rover
        pos.setZ(i, 0);
      }
    }
    terrainGeom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x8a4b32, // Martian red soil
      roughness: 0.95,
      metalness: 0.05,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -0.05;
    terrainMesh.receiveShadow = true;
    this.rootGroup.add(terrainMesh);

    // Scattered Instanced Rocks for realism and zero draw-call bloat
    const rockCount = 40;
    const rockGeom = new THREE.DodecahedronGeometry(0.3, 1);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x5a3424,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.rockInstances = new THREE.InstancedMesh(rockGeom, rockMat, rockCount);
    this.rockInstances.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 5 + Math.random() * 18;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const s = 0.4 + Math.random() * 0.9;

      dummy.position.set(x, 0.1 * s, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();
      this.rockInstances.setMatrixAt(i, dummy.matrix);
    }
    this.rockInstances.instanceMatrix.needsUpdate = true;
    this.rockInstances.computeBoundingSphere();
    this.rootGroup.add(this.rockInstances);
  }

  private createWheelAssembly(x: number, y: number, z: number): THREE.Group {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    // 1. Tire with deep tread
    const tireGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
    tireGeom.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeom, this.tireMaterial);
    wheelGroup.add(tire);

    // 2. Titanium wheel rim
    const rimGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.34, 16);
    rimGeom.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x88909c, metalness: 0.9, roughness: 0.3 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    wheelGroup.add(rim);

    // 3. Hexagonal hub nut
    const hubNutGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.38, 6);
    hubNutGeom.rotateZ(Math.PI / 2);
    const hubNut = new THREE.Mesh(hubNutGeom, this.goldFoilMaterial);
    wheelGroup.add(hubNut);

    // 4. Contact shadow beneath each wheel
    const shadowTex = createRadialShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -y + 0.02, 0);
    wheelGroup.add(shadow);

    return wheelGroup;
  }

  private buildRover(renderer: THREE.WebGLRenderer) {
    const isSoftwareGl = renderer.capabilities.isWebGL2 === false;

    // --- PART 1: Rocker-Bogie Suspension & Wheels (Ground-contact) ---
    const suspensionGroup = new THREE.Group();
    const wheelPositions = [
      { x: -1.2, y: 0.42, z: 1.1 },
      { x: 1.2, y: 0.42, z: 1.1 },
      { x: -1.25, y: 0.42, z: 0.0 },
      { x: 1.25, y: 0.42, z: 0.0 },
      { x: -1.2, y: 0.42, z: -1.1 },
      { x: 1.2, y: 0.42, z: -1.1 },
    ];

    wheelPositions.forEach((pos) => {
      const wheel = this.createWheelAssembly(pos.x, pos.y, pos.z);
      this.wheels.push(wheel);
      suspensionGroup.add(wheel);
    });

    // Articulated Rocker Arms
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.35 });
    [-1.05, 1.05].forEach((sideX) => {
      const rockerArmGeom = new THREE.CylinderGeometry(0.05, 0.05, 2.2, 12);
      rockerArmGeom.rotateX(Math.PI / 2);
      const rockerArm = new THREE.Mesh(rockerArmGeom, strutMat);
      rockerArm.position.set(sideX, 0.65, 0);
      suspensionGroup.add(rockerArm);
    });

    this.rootGroup.add(suspensionGroup);
    this.registerPart(suspensionGroup, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.2, 0), {
      name: 'Rocker-Bogie 6WD Mobility System',
      description: 'Articulated suspension with 6 independent in-hub drive motors and chevron grip tires.',
      material: 'Titanium-Alloy Struts & Synthetic Rubber',
      category: 'primary',
    });

    // --- PART 2: Armored Chassis Hull ---
    const chassisGroup = new THREE.Group();
    chassisGroup.position.set(0, 0.95, 0);

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee, // Clean space white
      metalness: 0.4,
      roughness: 0.4,
    });
    this.hullMaterials.push(hullMat);

    // Main hull body (chamfered block)
    const hullGeom = new THREE.BoxGeometry(1.6, 0.65, 2.2);
    const hullMesh = new THREE.Mesh(hullGeom, hullMat);
    hullMesh.castShadow = true;
    chassisGroup.add(hullMesh);

    // Front protective bumper bar
    const bumperGeom = new THREE.BoxGeometry(1.7, 0.15, 0.18);
    const bumperMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.9, roughness: 0.25 });
    const bumper = new THREE.Mesh(bumperGeom, bumperMat);
    bumper.position.set(0, -0.15, 1.15);
    chassisGroup.add(bumper);

    // Rear radioisotope thermoelectric generator (RTG)
    const rtgGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.7, 16);
    const rtgMat = new THREE.MeshStandardMaterial({ color: 0x333b47, metalness: 0.85, roughness: 0.3 });
    const rtg = new THREE.Mesh(rtgGeom, rtgMat);
    rtg.position.set(0, 0.35, -1.1);
    chassisGroup.add(rtg);

    // Twin Headlights with volumetric warm beam
    const lightGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16);
    lightGeom.rotateX(Math.PI / 2);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff7d6 });
    [-0.55, 0.55].forEach((lx) => {
      const headlight = new THREE.Mesh(lightGeom, lightMat);
      headlight.position.set(lx, 0.1, 1.12);
      chassisGroup.add(headlight);
    });

    // Headlight cone projection
    const coneGeom = new THREE.ConeGeometry(1.8, 4.5, 16, 1, true);
    coneGeom.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff3c4,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
    });
    this.headlightCone = new THREE.Mesh(coneGeom, coneMat);
    this.headlightCone.position.set(0, 0.1, 3.4);
    chassisGroup.add(this.headlightCone);

    this.rootGroup.add(chassisGroup);
    this.registerPart(chassisGroup, new THREE.Vector3(0, 0.95, 0), new THREE.Vector3(0, 0.6, 0), {
      name: 'Armored Avionics Core & RTG',
      description: 'Pressurized core housing computing nodes, inertial guidance, and nuclear RTG generator.',
      material: 'Kevlar-Reinforced Ceramic Composite',
      category: 'primary',
    });

    // --- PART 3: Deployable Photovoltaic Solar Wings ---
    const wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 1.35, -0.1);

    [-1.25, 1.25].forEach((wx) => {
      const wingGeom = new THREE.BoxGeometry(0.85, 0.04, 1.8);
      const wing = new THREE.Mesh(wingGeom, this.solarWingMaterial);
      wing.position.set(wx, 0, 0);
      wingsGroup.add(wing);

      // Gold hinge bracket
      const bracketGeom = new THREE.BoxGeometry(0.12, 0.08, 0.4);
      const bracket = new THREE.Mesh(bracketGeom, this.goldFoilMaterial);
      bracket.position.set(wx > 0 ? 0.78 : -0.78, 0, 0);
      wingsGroup.add(bracket);
    });

    this.rootGroup.add(wingsGroup);
    this.registerPart(wingsGroup, new THREE.Vector3(0, 1.35, -0.1), new THREE.Vector3(0, 1.4, 0), {
      name: 'Photovoltaic Solar Wing Arrays',
      description: 'Triple-junction gallium arsenide solar cells yielding 1,200W sustained output.',
      material: 'Gallium Arsenide Photovoltaic Panels',
      category: 'secondary',
    });

    // --- PART 4: Sensor Mast & Pan-Tilt LiDAR Dome ---
    const mastGroup = new THREE.Group();
    mastGroup.position.set(0.45, 1.3, 0.65);

    // Mast Pole
    const mastPoleGeom = new THREE.CylinderGeometry(0.04, 0.05, 1.1, 16);
    const mastPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const mastPole = new THREE.Mesh(mastPoleGeom, mastPoleMat);
    mastPole.position.y = 0.55;
    mastGroup.add(mastPole);

    // Camera Head
    this.cameraHead = new THREE.Group();
    this.cameraHead.position.set(0, 1.1, 0);

    const headGeom = new THREE.BoxGeometry(0.35, 0.22, 0.26);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    this.cameraHead.add(headMesh);

    // Dual Panoramic Stereo Cameras
    const lensGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16);
    lensGeom.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x003366,
      roughness: 0.05,
      metalness: 0.1,
      ior: 1.6,
      transmission: isSoftwareGl ? 0 : 0.8,
      transparent: true,
    });
    [-0.1, 0.1].forEach((lx) => {
      const lens = new THREE.Mesh(lensGeom, lensMat);
      lens.position.set(lx, 0.02, 0.14);
      this.cameraHead.add(lens);
    });

    // Revolving LiDAR Dome
    this.lidarDome = new THREE.Group();
    this.lidarDome.position.set(0, 0.16, 0);

    const domeGeom = new THREE.CylinderGeometry(0.11, 0.13, 0.14, 24);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });
    const domeMesh = new THREE.Mesh(domeGeom, domeMat);
    this.lidarDome.add(domeMesh);

    // Cyan laser scanning slit
    const slitGeom = new THREE.BoxGeometry(0.08, 0.04, 0.14);
    const slit = new THREE.Mesh(slitGeom, this.glowMaterial);
    slit.position.set(0, 0, 0.06);
    this.lidarDome.add(slit);

    this.cameraHead.add(this.lidarDome);
    mastGroup.add(this.cameraHead);

    this.rootGroup.add(mastGroup);
    this.registerPart(mastGroup, new THREE.Vector3(0.45, 1.3, 0.65), new THREE.Vector3(0.6, 2.0, 0.4), {
      name: 'Panoramic Stereo Mast & 360° LiDAR',
      description: 'Centimeter-precision laser rangefinder and dual multispectral stereo cameras.',
      material: 'Carbon Composite & Optical Glass',
      category: 'accent',
    });

    // --- PART 5: Articulated 3-Axis Robotic Manipulator Arm ---
    this.roboticArm = new THREE.Group();
    this.roboticArm.position.set(-0.45, 1.0, 0.85);

    // Base Turret
    const turretGeom = new THREE.CylinderGeometry(0.12, 0.15, 0.16, 16);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });
    const turret = new THREE.Mesh(turretGeom, armMat);
    this.roboticArm.add(turret);

    // Lower Arm Link
    const link1Geom = new THREE.BoxGeometry(0.08, 0.65, 0.08);
    const link1 = new THREE.Mesh(link1Geom, armMat);
    link1.position.set(0, 0.35, 0);
    link1.rotation.x = 0.45;
    this.roboticArm.add(link1);

    // Elbow Joint 2
    this.armJoint2 = new THREE.Group();
    this.armJoint2.position.set(0, 0.62, 0.24);

    const jointGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16);
    jointGeom.rotateZ(Math.PI / 2);
    const jointMesh = new THREE.Mesh(jointGeom, this.goldFoilMaterial);
    this.armJoint2.add(jointMesh);

    // Forearm Link
    const link2Geom = new THREE.BoxGeometry(0.06, 0.55, 0.06);
    const link2 = new THREE.Mesh(link2Geom, armMat);
    link2.position.set(0, 0.25, 0);
    link2.rotation.x = -0.7;
    this.armJoint2.add(link2);

    // Gripper Claw
    this.armClaw = new THREE.Group();
    this.armClaw.position.set(0, 0.52, -0.16);

    const clawBaseGeom = new THREE.BoxGeometry(0.1, 0.06, 0.08);
    const clawBase = new THREE.Mesh(clawBaseGeom, armMat);
    this.armClaw.add(clawBase);

    [-0.04, 0.04].forEach((cx) => {
      const fingerGeom = new THREE.BoxGeometry(0.02, 0.12, 0.04);
      const finger = new THREE.Mesh(fingerGeom, this.goldFoilMaterial);
      finger.position.set(cx, 0.08, 0);
      this.armClaw.add(finger);
    });

    this.armJoint2.add(this.armClaw);
    this.roboticArm.add(this.armJoint2);

    this.rootGroup.add(this.roboticArm);
    this.registerPart(this.roboticArm, new THREE.Vector3(-0.45, 1.0, 0.85), new THREE.Vector3(-0.8, 1.8, 0.8), {
      name: 'Articulated Robotic Sampling Arm',
      description: '3-degree-of-freedom manipulator with core drill and titanium sample scoop.',
      material: 'Aircraft-Grade Titanium & Gold Foil',
      category: 'accent',
    });
  }

  private registerPart(
    object: THREE.Object3D,
    basePos: THREE.Vector3,
    explodeOffset: THREE.Vector3,
    info: PartInfo
  ) {
    this.parts.push({
      object,
      basePos: basePos.clone(),
      explodeOffset: explodeOffset.clone(),
      info,
    });
  }

  public applyFinish(finish: MaterialFinish) {
    switch (finish) {
      case 'gold':
        this.hullMaterials.forEach((m) => {
          m.color.setHex(0xd49b42); // Mars Ochre
          m.metalness = 0.5;
          m.roughness = 0.5;
        });
        break;

      case 'stealth':
        this.hullMaterials.forEach((m) => {
          m.color.setHex(0x181a20); // Stealth Carbon
          m.metalness = 0.9;
          m.roughness = 0.35;
        });
        break;

      case 'silver':
        this.hullMaterials.forEach((m) => {
          m.color.setHex(0xb0bcc9); // Titanium Explorer
          m.metalness = 0.85;
          m.roughness = 0.25;
        });
        break;

      case 'default':
      default:
        this.hullMaterials.forEach((m) => {
          m.color.setHex(0xf3f4f6); // NASA Space White
          m.metalness = 0.35;
          m.roughness = 0.45;
        });
        break;
    }
  }

  public update(time: number, delta: number, explodeFactor: number) {
    // 1. Smoothly interpolate exploded view positions
    this.parts.forEach((p) => {
      const targetPos = p.basePos.clone().addScaledVector(p.explodeOffset, explodeFactor);
      p.object.position.lerp(targetPos, Math.min(delta * 8, 1));
    });

    // 2. Continuous 360° LiDAR scanning dome
    this.lidarDome.rotation.y += delta * 4.5;

    // 3. Stereo Camera gentle survey oscillation
    this.cameraHead.rotation.y = Math.sin(time * 0.4) * 0.45;
    this.cameraHead.rotation.x = Math.sin(time * 0.3) * 0.1;

    // 4. Wheels rotation simulation
    this.wheels.forEach((wheel, idx) => {
      const steerFactor = idx < 2 ? Math.sin(time * 0.5) * 0.25 : 0;
      wheel.rotation.y = steerFactor;
      wheel.children[0].rotation.x += delta * 1.5; // tire spin
    });

    // 5. Robotic arm sampling articulation cycle
    const armCycle = Math.sin(time * 0.8);
    this.roboticArm.rotation.y = THREE.MathUtils.damp(this.roboticArm.rotation.y, armCycle * 0.4, 4, delta);
    this.armJoint2.rotation.x = 0.4 + armCycle * 0.3;

    // 6. Occasional rover servo sound
    if (Math.abs(armCycle) > 0.98) {
      soundSynth.playRoverServo();
    }
  }

  public setWireframe(wireframe: boolean) {
    this.rootGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if ('wireframe' in m) m.wireframe = wireframe;
          });
        } else if ('wireframe' in child.material) {
          child.material.wireframe = wireframe;
        }
      }
    });
  }

  public dispose() {
    this.rootGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  }
}
