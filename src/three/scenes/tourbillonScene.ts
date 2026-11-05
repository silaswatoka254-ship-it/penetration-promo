import * as THREE from 'three';
import { MaterialFinish, PartInfo } from '../../types';
import {
  createPerlageTexture,
  createRadialShadowTexture,
  createWatchDialTexture,
} from '../proceduralTextures';
import { soundSynth } from '../../audio/soundSynth';

export class TourbillonScene {
  public rootGroup: THREE.Group;
  public parts: { object: THREE.Object3D; basePos: THREE.Vector3; explodeOffset: THREE.Vector3; info: PartInfo }[] = [];

  // Animated elements
  private tourbillonCage!: THREE.Group;
  private balanceWheel!: THREE.Group;
  private hairspringMesh!: THREE.Mesh;
  private palletFork!: THREE.Group;
  private escapementWheel!: THREE.Group;
  private centerGear!: THREE.Group;
  private thirdGear!: THREE.Group;
  private fourthGear!: THREE.Group;
  private hourHand!: THREE.Group;
  private minuteHand!: THREE.Group;
  private secondHand!: THREE.Group;

  // Material sets for finishes
  private metallicMaterials: THREE.MeshStandardMaterial[] = [];
  private dialMaterial!: THREE.MeshStandardMaterial;
  private rubyMaterial!: THREE.MeshPhysicalMaterial;
  private bluedSteelMaterial!: THREE.MeshStandardMaterial;
  private goldAccentMaterial!: THREE.MeshStandardMaterial;
  private glassMaterial!: THREE.MeshPhysicalMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'HorologyTourbillon';
    scene.add(this.rootGroup);

    this.initMaterials(renderer, isSoftwareGl);
    this.buildModel(renderer);
    this.applyFinish('default');
  }

  private initMaterials(renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // 1. Ruby jewel material (Deep crimson synthetic corundum)
    this.rubyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcc0033,
      emissive: 0x330008,
      metalness: 0.1,
      roughness: 0.15,
      transmission: isSoftwareGl ? 0 : 0.85,
      opacity: isSoftwareGl ? 0.85 : 1.0,
      transparent: true,
      ior: 1.76, // Corundum / sapphire refractive index
    });

    // 2. Blued steel hands & screws (haute horlogerie thermal bluing)
    this.bluedSteelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a4594,
      metalness: 0.9,
      roughness: 0.18,
    });

    // 3. Gold accents (regulating screws, gear teeth)
    this.goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3cf7a,
      metalness: 0.95,
      roughness: 0.22,
    });

    // 4. Domed Sapphire Crystal Glass
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: isSoftwareGl ? 0 : 0.96,
      opacity: isSoftwareGl ? 0.3 : 1.0,
      transparent: true,
      roughness: 0.05,
      metalness: 0.05,
      ior: 1.77,
      thickness: 1.2,
      depthWrite: false,
    });

    // 5. Dial texture material
    const dialTex = createWatchDialTexture(maxAnisotropy);
    this.dialMaterial = new THREE.MeshStandardMaterial({
      map: dialTex,
      metalness: 0.85,
      roughness: 0.35,
      transparent: true,
    });
  }

  private createGearMesh(
    radius: number,
    teeth: number,
    thickness: number,
    material: THREE.Material,
    spokes: number = 4
  ): THREE.Group {
    const group = new THREE.Group();

    // Rim & Center Hub
    const hubGeom = new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, thickness, 24);
    const hub = new THREE.Mesh(hubGeom, material);
    group.add(hub);

    const rimGeom = new THREE.CylinderGeometry(radius, radius, thickness, 32);
    const rim = new THREE.Mesh(rimGeom, material);
    group.add(rim);

    // Spokes
    for (let s = 0; s < spokes; s++) {
      const spokeAngle = (s * Math.PI * 2) / spokes;
      const spokeGeom = new THREE.BoxGeometry(radius * 0.8, thickness * 0.85, radius * 0.08);
      const spoke = new THREE.Mesh(spokeGeom, material);
      spoke.rotation.y = spokeAngle;
      group.add(spoke);
    }

    // Precision Gear Teeth
    const toothW = (Math.PI * 2 * radius) / (teeth * 2.8);
    const toothH = radius * 0.14;
    const toothGeom = new THREE.BoxGeometry(toothW, thickness * 0.95, toothH);

    for (let t = 0; t < teeth; t++) {
      const angle = (t * Math.PI * 2) / teeth;
      const tooth = new THREE.Mesh(toothGeom, material);
      tooth.position.x = Math.sin(angle) * (radius + toothH * 0.35);
      tooth.position.z = Math.cos(angle) * (radius + toothH * 0.35);
      tooth.rotation.y = angle;
      group.add(tooth);
    }

    return group;
  }

  private buildModel(renderer: THREE.WebGLRenderer) {
    const isSoftwareGl = renderer.capabilities.isWebGL2 === false;

    // --- PART 1: Soft Contact Shadow Grounding ---
    const shadowTex = createRadialShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 6.5), shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    this.rootGroup.add(shadowMesh);

    // --- PART 2: Display Pedestal Stand (Flush on ground, centered) ---
    const standGroup = new THREE.Group();
    const standBaseGeom = new THREE.CylinderGeometry(2.4, 2.7, 0.4, 48);
    const standBaseMat = new THREE.MeshStandardMaterial({ color: 0x16181f, roughness: 0.7, metalness: 0.3 });
    const standBase = new THREE.Mesh(standBaseGeom, standBaseMat);
    standBase.position.y = 0.2;
    standGroup.add(standBase);

    const standPedestalGeom = new THREE.CylinderGeometry(1.6, 2.0, 0.3, 48);
    const standPedestal = new THREE.Mesh(standPedestalGeom, standBaseMat);
    standPedestal.position.y = 0.55;
    standGroup.add(standPedestal);

    const standTrimGeom = new THREE.TorusGeometry(2.1, 0.04, 16, 48);
    const standTrim = new THREE.Mesh(standTrimGeom, this.goldAccentMaterial);
    standTrim.rotation.x = Math.PI / 2;
    standTrim.position.y = 0.4;
    standGroup.add(standTrim);

    this.rootGroup.add(standGroup);
    this.registerPart(standGroup, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), {
      name: 'Horology Display Pedestal',
      description: 'Solid anodized aluminum presentation base with brushed gold bezel ring trim.',
      material: 'Anodized Slate & Brass',
      category: 'primary',
    });

    const mechanismOriginY = 1.0;

    // --- PART 3: Skeletonized Movement Baseplate (Circular Perlage) ---
    const baseplateGroup = new THREE.Group();
    baseplateGroup.position.y = mechanismOriginY;

    const perlageTex = createPerlageTexture();
    const plateMat = new THREE.MeshStandardMaterial({
      map: perlageTex,
      metalness: 0.9,
      roughness: 0.32,
    });
    this.metallicMaterials.push(plateMat);

    const plateGeom = new THREE.CylinderGeometry(2.1, 2.1, 0.12, 64);
    const mainplate = new THREE.Mesh(plateGeom, plateMat);
    baseplateGroup.add(mainplate);

    // Skeletonized cutouts
    const apertureRimGeom = new THREE.TorusGeometry(0.72, 0.05, 16, 32);
    const apertureRim = new THREE.Mesh(apertureRimGeom, this.goldAccentMaterial);
    apertureRim.rotation.x = Math.PI / 2;
    apertureRim.position.set(0, 0.07, 0.75);
    baseplateGroup.add(apertureRim);

    // Blued steel assembly screws
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const screwGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
      const screw = new THREE.Mesh(screwGeom, this.bluedSteelMaterial);
      screw.position.set(Math.sin(angle) * 1.85, 0.07, Math.cos(angle) * 1.85);
      baseplateGroup.add(screw);
    }

    this.rootGroup.add(baseplateGroup);
    this.registerPart(baseplateGroup, new THREE.Vector3(0, mechanismOriginY, 0), new THREE.Vector3(0, 0.2, 0), {
      name: 'Perlage Skeleton Mainplate',
      description: 'Hand-grained circular perlage baseplate with 6 chamfered mounting screws.',
      material: 'German Silver & Blued Steel',
      category: 'primary',
    });

    // --- PART 4: Precision Gear Train Assembly ---
    const gearTrainGroup = new THREE.Group();
    gearTrainGroup.position.y = mechanismOriginY + 0.18;

    // Center Gear (Drive)
    this.centerGear = this.createGearMesh(0.7, 24, 0.06, this.goldAccentMaterial, 5);
    this.centerGear.position.set(0, 0, 0);
    gearTrainGroup.add(this.centerGear);

    // Third Gear
    this.thirdGear = this.createGearMesh(0.48, 18, 0.05, this.goldAccentMaterial, 4);
    this.thirdGear.position.set(0.65, 0.05, 0.35);
    gearTrainGroup.add(this.thirdGear);

    // Fourth Gear (Direct drive to tourbillon pinion)
    this.fourthGear = this.createGearMesh(0.35, 14, 0.05, this.goldAccentMaterial, 3);
    this.fourthGear.position.set(0.3, 0.1, 0.65);
    gearTrainGroup.add(this.fourthGear);

    // Ruby endstones at pivot points
    const rubyPivots = [
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(0.65, 0.09, 0.35),
      new THREE.Vector3(0.3, 0.14, 0.65),
    ];
    rubyPivots.forEach((pos) => {
      const jewelGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
      const jewel = new THREE.Mesh(jewelGeom, this.rubyMaterial);
      jewel.position.copy(pos);
      gearTrainGroup.add(jewel);
    });

    this.rootGroup.add(gearTrainGroup);
    this.registerPart(gearTrainGroup, new THREE.Vector3(0, mechanismOriginY + 0.18, 0), new THREE.Vector3(0, 0.7, 0), {
      name: 'Mechanical Gear Train & Pinions',
      description: 'Helical wheel train calculating 28,800 beats per hour with synthetic ruby pivot jewels.',
      material: '2N Gold & Synthetic Ruby',
      category: 'secondary',
    });

    // --- PART 5: Flying Tourbillon Carriage, Escapement & Hairspring ---
    const tourbillonAssembly = new THREE.Group();
    tourbillonAssembly.position.set(0, mechanismOriginY + 0.3, 0.75);

    // Titanium Flying Cage (Tri-arm carriage)
    this.tourbillonCage = new THREE.Group();

    const cageBaseGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 32);
    const cageMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.15 });
    this.metallicMaterials.push(cageMat);
    const cageBase = new THREE.Mesh(cageBaseGeom, cageMat);
    this.tourbillonCage.add(cageBase);

    // 3 Curved Lightweight Cage Pillars
    for (let p = 0; p < 3; p++) {
      const pAngle = (p * Math.PI * 2) / 3;
      const pillarGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12);
      const pillar = new THREE.Mesh(pillarGeom, cageMat);
      pillar.position.set(Math.sin(pAngle) * 0.46, 0.21, Math.cos(pAngle) * 0.46);
      this.tourbillonCage.add(pillar);
    }

    // Top Bridge of Cage
    const topBridgeGeom = new THREE.BoxGeometry(0.95, 0.04, 0.18);
    const topBridge = new THREE.Mesh(topBridgeGeom, cageMat);
    topBridge.position.y = 0.42;
    this.tourbillonCage.add(topBridge);

    // Escapement Wheel (Sharp impulse teeth)
    this.escapementWheel = this.createGearMesh(0.25, 15, 0.03, this.bluedSteelMaterial, 3);
    this.escapementWheel.position.set(0.18, 0.12, 0);
    this.tourbillonCage.add(this.escapementWheel);

    // Pallet Fork with Ruby Stones
    this.palletFork = new THREE.Group();
    this.palletFork.position.set(0.08, 0.16, 0);
    const forkBodyGeom = new THREE.BoxGeometry(0.2, 0.03, 0.04);
    const forkBody = new THREE.Mesh(forkBodyGeom, this.bluedSteelMaterial);
    this.palletFork.add(forkBody);

    const palletRubyGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const rubyEntry = new THREE.Mesh(palletRubyGeom, this.rubyMaterial);
    rubyEntry.position.set(-0.09, 0, 0.03);
    const rubyExit = new THREE.Mesh(palletRubyGeom, this.rubyMaterial);
    rubyExit.position.set(0.09, 0, -0.03);
    this.palletFork.add(rubyEntry);
    this.palletFork.add(rubyExit);
    this.tourbillonCage.add(this.palletFork);

    // Balance Wheel Assembly
    this.balanceWheel = new THREE.Group();
    this.balanceWheel.position.y = 0.28;

    // Glucydur balance rim
    const balanceRimGeom = new THREE.TorusGeometry(0.42, 0.03, 16, 32);
    const balanceRim = new THREE.Mesh(balanceRimGeom, this.goldAccentMaterial);
    balanceRim.rotation.x = Math.PI / 2;
    this.balanceWheel.add(balanceRim);

    // Balance crossarms
    const crossarmGeom = new THREE.BoxGeometry(0.82, 0.02, 0.05);
    const crossarm = new THREE.Mesh(crossarmGeom, this.goldAccentMaterial);
    this.balanceWheel.add(crossarm);

    // 8 Gold regulating counter-screws
    for (let g = 0; g < 8; g++) {
      const gAngle = (g * Math.PI * 2) / 8;
      const screwGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8);
      const screw = new THREE.Mesh(screwGeom, this.goldAccentMaterial);
      screw.position.set(Math.sin(gAngle) * 0.44, 0, Math.cos(gAngle) * 0.44);
      this.balanceWheel.add(screw);
    }

    // Coiled Hairspring (Archimedean spiral TubeGeometry)
    const spiralPoints: THREE.Vector3[] = [];
    const coils = 5;
    const segments = 120;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2 * coils;
      const r = 0.04 + (i / segments) * 0.24;
      spiralPoints.push(new THREE.Vector3(Math.sin(theta) * r, (i / segments) * 0.04, Math.cos(theta) * r));
    }
    const hairspringCurve = new THREE.CatmullRomCurve3(spiralPoints);
    const hairspringGeom = new THREE.TubeGeometry(hairspringCurve, 90, 0.008, 6, false);
    this.hairspringMesh = new THREE.Mesh(hairspringGeom, this.bluedSteelMaterial);
    this.hairspringMesh.position.y = 0.02;
    this.balanceWheel.add(this.hairspringMesh);

    this.tourbillonCage.add(this.balanceWheel);
    tourbillonAssembly.add(this.tourbillonCage);

    this.rootGroup.add(tourbillonAssembly);
    this.registerPart(
      tourbillonAssembly,
      new THREE.Vector3(0, mechanismOriginY + 0.3, 0.75),
      new THREE.Vector3(0, 1.4, 0),
      {
        name: 'Flying Tourbillon & Hairspring',
        description: 'Gravitational compensation carriage weighing just 0.28g with blued Breguet overcoil hairspring.',
        material: 'Grade 5 Titanium & Glucydur',
        category: 'accent',
      }
    );

    // --- PART 6: Dial Chapter Ring ---
    const dialRingGroup = new THREE.Group();
    dialRingGroup.position.y = mechanismOriginY + 0.52;

    const dialRingGeom = new THREE.RingGeometry(0.65, 2.05, 64);
    const dialRing = new THREE.Mesh(dialRingGeom, this.dialMaterial);
    dialRing.rotation.x = -Math.PI / 2;
    dialRingGroup.add(dialRing);

    this.rootGroup.add(dialRingGroup);
    this.registerPart(dialRingGroup, new THREE.Vector3(0, mechanismOriginY + 0.52, 0), new THREE.Vector3(0, 2.0, 0), {
      name: 'Haute Horlogerie Chapter Dial',
      description: 'Frosted dial with micro-engraved Roman numerals, railway minute track, and tourbillon aperture.',
      material: 'Silver-Plated Brass',
      category: 'primary',
    });

    // --- PART 7: Hand-Finished Breguet Hands ---
    const handsGroup = new THREE.Group();
    handsGroup.position.set(0, mechanismOriginY + 0.58, 0);

    // Hour Hand (Breguet eccentric moon tip)
    this.hourHand = new THREE.Group();
    const hourStemGeom = new THREE.BoxGeometry(0.04, 0.02, 0.75);
    const hourStem = new THREE.Mesh(hourStemGeom, this.bluedSteelMaterial);
    hourStem.position.z = -0.375;
    this.hourHand.add(hourStem);
    const hourRingGeom = new THREE.TorusGeometry(0.08, 0.025, 12, 24);
    const hourRing = new THREE.Mesh(hourRingGeom, this.bluedSteelMaterial);
    hourRing.rotation.x = Math.PI / 2;
    hourRing.position.z = -0.65;
    this.hourHand.add(hourRing);
    handsGroup.add(this.hourHand);

    // Minute Hand (Longer, sweeping toward railway track)
    this.minuteHand = new THREE.Group();
    const minStemGeom = new THREE.BoxGeometry(0.035, 0.02, 1.25);
    const minStem = new THREE.Mesh(minStemGeom, this.bluedSteelMaterial);
    minStem.position.z = -0.625;
    this.minuteHand.add(minStem);
    const minRingGeom = new THREE.TorusGeometry(0.07, 0.02, 12, 24);
    const minRing = new THREE.Mesh(minRingGeom, this.bluedSteelMaterial);
    minRing.rotation.x = Math.PI / 2;
    minRing.position.z = -1.05;
    this.minuteHand.add(minRing);
    handsGroup.add(this.minuteHand);

    // Tourbillon Seconds Hand (Mounted on cage at 6 o'clock)
    this.secondHand = new THREE.Group();
    this.secondHand.position.set(0, 0.16, 0.75);
    const secNeedleGeom = new THREE.BoxGeometry(0.015, 0.015, 0.45);
    const secNeedle = new THREE.Mesh(secNeedleGeom, this.bluedSteelMaterial);
    secNeedle.position.z = -0.2;
    this.secondHand.add(secNeedle);
    handsGroup.add(this.secondHand);

    this.rootGroup.add(handsGroup);
    this.registerPart(handsGroup, new THREE.Vector3(0, mechanismOriginY + 0.58, 0), new THREE.Vector3(0, 2.5, 0), {
      name: 'Thermally Blued Breguet Hands',
      description: 'Traditional flame-blued watch hands with hollow eccentric moon rings.',
      material: 'Flame-Blued High Carbon Steel',
      category: 'accent',
    });

    // --- PART 8: Casing (Beveled Fluted Outer Bezel & Exhibition Case) ---
    const caseGroup = new THREE.Group();
    caseGroup.position.y = mechanismOriginY + 0.35;

    const caseMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      metalness: 0.95,
      roughness: 0.2,
    });
    this.metallicMaterials.push(caseMat);

    // Bezel ring with beveled step
    const bezelGeom = new THREE.CylinderGeometry(2.35, 2.38, 0.45, 64);
    const bezel = new THREE.Mesh(bezelGeom, caseMat);
    caseGroup.add(bezel);

    // Fluted coin-edge bezel accent
    const flutedGeom = new THREE.TorusGeometry(2.32, 0.05, 16, 64);
    const fluted = new THREE.Mesh(flutedGeom, this.goldAccentMaterial);
    fluted.rotation.x = Math.PI / 2;
    fluted.position.y = 0.22;
    caseGroup.add(fluted);

    // Knurled Winding Crown at 3 o'clock
    const crownGroup = new THREE.Group();
    crownGroup.position.set(2.45, 0, 0);
    const crownBodyGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 24);
    const crownBody = new THREE.Mesh(crownBodyGeom, caseMat);
    crownBody.rotation.z = Math.PI / 2;
    crownGroup.add(crownBody);

    const cabochonGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const cabochon = new THREE.Mesh(cabochonGeom, this.rubyMaterial);
    cabochon.position.x = 0.12;
    crownGroup.add(cabochon);
    caseGroup.add(crownGroup);

    this.rootGroup.add(caseGroup);
    this.registerPart(caseGroup, new THREE.Vector3(0, mechanismOriginY + 0.35, 0), new THREE.Vector3(0, 3.1, 0), {
      name: 'Fluted Horology Casing & Crown',
      description: 'Micro-blasted case with coin-edge fluting and cabochon sapphire winding crown.',
      material: 'Grade 5 Brushed Titanium',
      category: 'primary',
    });

    // --- PART 9: Domed Sapphire Crystal Lens ---
    const crystalGroup = new THREE.Group();
    crystalGroup.position.y = mechanismOriginY + 0.65;

    const crystalGeom = new THREE.CylinderGeometry(2.28, 2.28, 0.08, 64);
    const crystalMesh = new THREE.Mesh(crystalGeom, this.glassMaterial);
    crystalGroup.add(crystalMesh);

    this.rootGroup.add(crystalGroup);
    this.registerPart(crystalGroup, new THREE.Vector3(0, mechanismOriginY + 0.65, 0), new THREE.Vector3(0, 3.8, 0), {
      name: 'Domed Sapphire Crystal',
      description: 'Anti-reflective coated double-domed scratchproof sapphire crystal glass.',
      material: 'Synthetic Sapphire Crystal',
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
        this.metallicMaterials.forEach((mat) => {
          mat.color.setHex(0xe8be78);
          mat.metalness = 0.95;
          mat.roughness = 0.24;
        });
        this.dialMaterial.color.setHex(0x24180d);
        break;

      case 'stealth':
        this.metallicMaterials.forEach((mat) => {
          mat.color.setHex(0x1a1c22);
          mat.metalness = 0.85;
          mat.roughness = 0.45;
        });
        this.dialMaterial.color.setHex(0x0c0e12);
        break;

      case 'silver':
        this.metallicMaterials.forEach((mat) => {
          mat.color.setHex(0xdce2ea);
          mat.metalness = 0.95;
          mat.roughness = 0.18;
        });
        this.dialMaterial.color.setHex(0xe8edf4);
        break;

      case 'default':
      default:
        this.metallicMaterials.forEach((mat) => {
          mat.color.setHex(0xcfd5de);
          mat.metalness = 0.92;
          mat.roughness = 0.28;
        });
        this.dialMaterial.color.setHex(0x141822);
        break;
    }
  }

  public update(time: number, delta: number, explodeFactor: number) {
    // 1. Smoothly interpolate exploded view positions using damp
    this.parts.forEach((p) => {
      const targetY = p.basePos.y + p.explodeOffset.y * explodeFactor;
      p.object.position.y = THREE.MathUtils.damp(p.object.position.y, targetY, 8, delta);
    });

    // 2. High-precision Horology Kinematics
    // 4 Hz escapement oscillation (28,800 vph): 8 reversals per second
    const balancePhase = Math.sin(time * Math.PI * 8);
    this.balanceWheel.rotation.y = balancePhase * 0.72;

    // Pallet fork alternates with the escapement tick
    this.palletFork.rotation.y = Math.sin(time * Math.PI * 8) > 0 ? 0.12 : -0.12;

    // Sound effect trigger on balance oscillation reversal
    soundSynth.playHorologyTick(4);

    // Hairspring subtle breathing expansion/contraction
    const springPulse = 1 + Math.sin(time * Math.PI * 8) * 0.05;
    this.hairspringMesh.scale.set(springPulse, 1, springPulse);

    // Escapement stepping rotation
    this.escapementWheel.rotation.y -= delta * 2.4;

    // Flying Tourbillon cage full 360° rotation (1 RPM standard)
    const cageSpeed = (Math.PI * 2) / 30; // 30 sec per full rev for impressive visual pacing
    this.tourbillonCage.rotation.y += delta * cageSpeed;

    // Coordinated Gear train ratios
    this.fourthGear.rotation.y += delta * cageSpeed * 1.5;
    this.thirdGear.rotation.y -= delta * cageSpeed * 0.75;
    this.centerGear.rotation.y += delta * cageSpeed * 0.25;

    // Hands sweeping
    this.secondHand.rotation.y += delta * cageSpeed;
    this.minuteHand.rotation.y = -(time * 0.12);
    this.hourHand.rotation.y = -(time * 0.01);
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
