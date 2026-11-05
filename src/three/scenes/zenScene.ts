import * as THREE from 'three';
import { MaterialFinish, PartInfo } from '../../types';
import { createRadialShadowTexture } from '../proceduralTextures';
import { soundSynth } from '../../audio/soundSynth';

export class ZenScene {
  public rootGroup: THREE.Group;
  public parts: { object: THREE.Object3D; basePos: THREE.Vector3; explodeOffset: THREE.Vector3; info: PartInfo }[] = [];

  // Animated elements
  private waterMesh!: THREE.Mesh;
  private waterUniforms: { time: { value: number } } = { time: { value: 0 } };
  private firefliesMesh!: THREE.InstancedMesh;
  private fireflyCount = 60;
  private fireflyPositions: THREE.Vector3[] = [];
  private orbs: THREE.Mesh[] = [];
  private foliageMesh!: THREE.InstancedMesh;
  private lanternLights: THREE.PointLight[] = [];

  // Finish materials
  private shrineMaterials: THREE.MeshStandardMaterial[] = [];
  private roofMaterials: THREE.MeshStandardMaterial[] = [];
  private stoneMaterials: THREE.MeshStandardMaterial[] = [];
  private brassMaterial!: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'ZenSanctuary';
    scene.add(this.rootGroup);

    this.initMaterials(renderer, isSoftwareGl);
    this.buildTerrain(scene);
    this.buildShrine(renderer);
    this.buildBonsai();
    this.buildLanterns();
    this.buildFloatingOrbs();
    this.buildFireflies();
    this.applyFinish('default');
  }

  private initMaterials(renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    // 1. Polished brass spire & bells
    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xdeb862,
      metalness: 0.95,
      roughness: 0.22,
    });
  }

  private buildTerrain(scene: THREE.Scene) {
    // 1. Natural rolling terrain island
    const islandGeom = new THREE.CylinderGeometry(14, 16, 2.5, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x223326, // Deep moss green
      roughness: 0.9,
      metalness: 0.05,
    });
    this.stoneMaterials.push(islandMat);

    const islandMesh = new THREE.Mesh(islandGeom, islandMat);
    islandMesh.position.y = -1.25;
    islandMesh.receiveShadow = true;
    this.rootGroup.add(islandMesh);

    // 2. Tranquil Pond with onBeforeCompile procedural wave ripples
    const waterGeom = new THREE.CircleGeometry(3.6, 64);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0f2b38,
      roughness: 0.12,
      metalness: 0.6,
      transparent: true,
      opacity: 0.92,
    });

    waterMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.waterUniforms.time;
      shader.vertexShader = `
        uniform float uTime;
        ${shader.vertexShader}
      `;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        float dist = length(position.xy);
        float wave = sin(dist * 6.0 - uTime * 2.5) * 0.025 * smoothstep(3.6, 0.5, dist);
        transformed.z += wave;
        `
      );
    };

    this.waterMesh = new THREE.Mesh(waterGeom, waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(-1.8, 0.02, 1.2);
    this.waterMesh.receiveShadow = true;
    this.rootGroup.add(this.waterMesh);

    // 3. Stepping stones across the moss
    const stoneGeom = new THREE.CylinderGeometry(0.35, 0.42, 0.08, 16);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
    this.stoneMaterials.push(stoneMat);

    const stonePositions = [
      [-0.4, 0.04, 2.8],
      [-0.1, 0.04, 2.1],
      [0.2, 0.04, 1.4],
      [0.3, 0.04, 0.7],
    ];
    stonePositions.forEach(([sx, sy, sz]) => {
      const stone = new THREE.Mesh(stoneGeom, stoneMat);
      stone.position.set(sx, sy, sz);
      stone.rotation.y = Math.random() * Math.PI;
      this.rootGroup.add(stone);
    });
  }

  private buildShrine(renderer: THREE.WebGLRenderer) {
    // --- PART 1: Foundation Stone Terrace ---
    const foundationGroup = new THREE.Group();
    foundationGroup.position.set(1.2, 0, -0.6);

    const baseStoneGeom = new THREE.BoxGeometry(3.6, 0.4, 3.6);
    const baseStoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
    this.stoneMaterials.push(baseStoneMat);
    const baseStone = new THREE.Mesh(baseStoneGeom, baseStoneMat);
    baseStone.position.y = 0.2;
    baseStone.castShadow = true;
    baseStone.receiveShadow = true;
    foundationGroup.add(baseStone);

    // Stone Steps
    const stepGeom = new THREE.BoxGeometry(1.6, 0.15, 0.4);
    const step = new THREE.Mesh(stepGeom, baseStoneMat);
    step.position.set(0, 0.075, 1.95);
    foundationGroup.add(step);

    this.rootGroup.add(foundationGroup);
    this.registerPart(foundationGroup, new THREE.Vector3(1.2, 0, -0.6), new THREE.Vector3(0, -0.2, 0), {
      name: 'Granite Shrine Plinth & Steps',
      description: 'Hand-chiseled monolithic foundation with ceremonial front approach steps.',
      material: 'Aged Gray Granite',
      category: 'primary',
    });

    // --- PART 2: Vermilion Lacquered Pillars & Torii Gateway ---
    const pillarsGroup = new THREE.Group();
    pillarsGroup.position.set(1.2, 0.4, -0.6);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x9e2a2b, // Traditional Japanese Vermilion
      roughness: 0.35,
      metalness: 0.15,
    });
    this.shrineMaterials.push(pillarMat);

    // 4 Corner Wooden Pillars
    const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 16);
    const offsets = [
      [-1.3, -1.3],
      [1.3, -1.3],
      [-1.3, 1.3],
      [1.3, 1.3],
    ];
    offsets.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(px, 0.9, pz);
      pillar.castShadow = true;
      pillarsGroup.add(pillar);
    });

    // Crossbeams (Nageshi & Shimoki)
    const beamGeomX = new THREE.BoxGeometry(2.8, 0.1, 0.1);
    const beam1 = new THREE.Mesh(beamGeomX, pillarMat);
    beam1.position.set(0, 1.75, -1.3);
    pillarsGroup.add(beam1);
    const beam2 = new THREE.Mesh(beamGeomX, pillarMat);
    beam2.position.set(0, 1.75, 1.3);
    pillarsGroup.add(beam2);

    // Central Altar Table
    const altarGeom = new THREE.BoxGeometry(1.2, 0.5, 0.8);
    const altarMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5 });
    const altar = new THREE.Mesh(altarGeom, altarMat);
    altar.position.set(0, 0.25, 0);
    pillarsGroup.add(altar);

    this.rootGroup.add(pillarsGroup);
    this.registerPart(pillarsGroup, new THREE.Vector3(1.2, 0.4, -0.6), new THREE.Vector3(0, 0.6, 0), {
      name: 'Vermilion Temple Pillars & Altar',
      description: 'Lacquered Japanese cypress columns supporting sacred architectural framework.',
      material: 'Vermilion Lacquered Hinoki Wood',
      category: 'primary',
    });

    // --- PART 3: Sweeping Pagoda Roof Tiers with Curved Eaves ---
    const roofGroup = new THREE.Group();
    roofGroup.position.set(1.2, 2.2, -0.6);

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x1a2e3b, // Traditional temple tile indigo
      roughness: 0.4,
      metalness: 0.35,
    });
    this.roofMaterials.push(roofMat);

    // Tier 1 Sweeping Eave
    const roof1Geom = new THREE.ConeGeometry(2.6, 0.85, 4);
    roof1Geom.rotateY(Math.PI / 4);
    const roof1 = new THREE.Mesh(roof1Geom, roofMat);
    roof1.castShadow = true;
    roofGroup.add(roof1);

    // Tier 2 Upper Pavilion & Eave
    const chamberGeom = new THREE.BoxGeometry(1.4, 0.6, 1.4);
    const chamber = new THREE.Mesh(chamberGeom, pillarMat);
    chamber.position.y = 0.65;
    roofGroup.add(chamber);

    const roof2Geom = new THREE.ConeGeometry(2.0, 0.7, 4);
    roof2Geom.rotateY(Math.PI / 4);
    const roof2 = new THREE.Mesh(roof2Geom, roofMat);
    roof2.position.y = 1.15;
    roof2.castShadow = true;
    roofGroup.add(roof2);

    // Spire (Kurin Finial)
    const spireGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.9, 16);
    const spire = new THREE.Mesh(spireGeom, this.brassMaterial);
    spire.position.y = 1.85;
    roofGroup.add(spire);

    this.rootGroup.add(roofGroup);
    this.registerPart(roofGroup, new THREE.Vector3(1.2, 2.2, -0.6), new THREE.Vector3(0, 1.8, 0), {
      name: 'Curved Pagoda Eaves & Brass Spire',
      description: 'Dual sweeping curved roof tiers crowned with sacred nine-ring kurin finial.',
      material: 'Glazed Ceramic Tile & Gilded Brass',
      category: 'secondary',
    });
  }

  private buildBonsai() {
    const bonsaiGroup = new THREE.Group();
    bonsaiGroup.position.set(-2.2, 0, -1.8);

    // Gnarled twisted trunk using CatmullRomCurve3
    const trunkPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.2, 0.7, 0.1),
      new THREE.Vector3(-0.3, 1.4, 0.2),
      new THREE.Vector3(0.1, 2.0, -0.1),
      new THREE.Vector3(0.6, 2.5, 0.1),
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(trunkPoints);
    const trunkGeom = new THREE.TubeGeometry(trunkCurve, 32, 0.14, 12, false);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    bonsaiGroup.add(trunk);

    // Foliage Clusters using InstancedMesh with subtle tint variation
    const clusterCount = 28;
    const foliageGeom = new THREE.DodecahedronGeometry(0.35, 1);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Sakura pink / bioluminescent blossom
      emissive: 0x4a0429,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.foliageMesh = new THREE.InstancedMesh(foliageGeom, foliageMat, clusterCount);
    this.foliageMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    const branchTips = [
      new THREE.Vector3(0.6, 2.5, 0.1),
      new THREE.Vector3(0.1, 2.0, -0.1),
      new THREE.Vector3(-0.3, 1.4, 0.2),
    ];

    for (let i = 0; i < clusterCount; i++) {
      const tip = branchTips[i % branchTips.length];
      const ox = (Math.random() - 0.5) * 1.1;
      const oy = (Math.random() - 0.5) * 0.7;
      const oz = (Math.random() - 0.5) * 1.1;
      const s = 0.7 + Math.random() * 0.6;

      dummy.position.set(tip.x + ox, tip.y + oy, tip.z + oz);
      dummy.scale.set(s, s * 0.65, s);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.updateMatrix();
      this.foliageMesh.setMatrixAt(i, dummy.matrix);
    }
    this.foliageMesh.instanceMatrix.needsUpdate = true;
    this.foliageMesh.computeBoundingSphere();
    bonsaiGroup.add(this.foliageMesh);

    this.rootGroup.add(bonsaiGroup);
    this.registerPart(bonsaiGroup, new THREE.Vector3(-2.2, 0, -1.8), new THREE.Vector3(-0.8, 0.8, -0.8), {
      name: 'Centuries-Old Gnarled Bonsai',
      description: 'Hand-sculpted ancient pine with bioluminescent sakura blossoms.',
      material: 'Aged Bark & Bioluminescent Foliage',
      category: 'accent',
    });
  }

  private buildLanterns() {
    // 2 Traditional Toro Stone Lanterns with warm interior glow
    const lanternPositions = [
      new THREE.Vector3(-0.6, 0, 2.2),
      new THREE.Vector3(3.2, 0, 0.8),
    ];

    lanternPositions.forEach((pos, idx) => {
      const lanternGroup = new THREE.Group();
      lanternGroup.position.copy(pos);

      // Stone base & stem
      const stemGeom = new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const stem = new THREE.Mesh(stemGeom, stemMat);
      stem.position.y = 0.4;
      lanternGroup.add(stem);

      // Light chamber with glowing paper screen
      const chamberGeom = new THREE.BoxGeometry(0.32, 0.28, 0.32);
      const chamberMat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
      const chamber = new THREE.Mesh(chamberGeom, chamberMat);
      chamber.position.y = 0.94;
      lanternGroup.add(chamber);

      // Umbrella cap
      const capGeom = new THREE.ConeGeometry(0.38, 0.2, 4);
      capGeom.rotateY(Math.PI / 4);
      const cap = new THREE.Mesh(capGeom, stemMat);
      cap.position.y = 1.18;
      lanternGroup.add(cap);

      // Internal warm point light
      const light = new THREE.PointLight(0xffaa44, 1.2, 4);
      light.position.set(0, 0.94, 0);
      this.lanternLights.push(light);
      lanternGroup.add(light);

      this.rootGroup.add(lanternGroup);
    });
  }

  private buildFloatingOrbs() {
    // 3 Floating mystical runic orbs slowly revolving around the temple
    const orbGeom = new THREE.SphereGeometry(0.22, 24, 24);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.1,
      metalness: 0.85,
    });

    for (let i = 0; i < 3; i++) {
      const orb = new THREE.Mesh(orbGeom, orbMat);
      this.orbs.push(orb);
      this.rootGroup.add(orb);
    }
  }

  private buildFireflies() {
    // Instanced fireflies with gentle drift kinematics
    const geom = new THREE.SphereGeometry(0.04, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x86efac });
    this.firefliesMesh = new THREE.InstancedMesh(geom, mat, this.fireflyCount);

    for (let i = 0; i < this.fireflyCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        0.3 + Math.random() * 3.5,
        (Math.random() - 0.5) * 10
      );
      this.fireflyPositions.push(pos);
    }
    this.rootGroup.add(this.firefliesMesh);
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
        this.shrineMaterials.forEach((m) => m.color.setHex(0xb45309)); // Amber Lacquer
        this.roofMaterials.forEach((m) => m.color.setHex(0x1c1917));
        break;

      case 'stealth':
        this.shrineMaterials.forEach((m) => m.color.setHex(0x18181b)); // Kurogane Black
        this.roofMaterials.forEach((m) => m.color.setHex(0x27272a));
        break;

      case 'silver':
        this.shrineMaterials.forEach((m) => m.color.setHex(0xe2e8f0)); // White Marble
        this.roofMaterials.forEach((m) => m.color.setHex(0x0284c7)); // Sapphire Blue
        break;

      case 'default':
      default:
        this.shrineMaterials.forEach((m) => m.color.setHex(0x9e2a2b)); // Classic Vermilion
        this.roofMaterials.forEach((m) => m.color.setHex(0x1a2e3b));
        break;
    }
  }

  public update(time: number, delta: number, explodeFactor: number) {
    // 1. Interpolate exploded view
    this.parts.forEach((p) => {
      const targetPos = p.basePos.clone().addScaledVector(p.explodeOffset, explodeFactor);
      p.object.position.lerp(targetPos, Math.min(delta * 8, 1));
    });

    // 2. Animated water ripples
    this.waterUniforms.time.value = time;

    // 3. Floating runic orbs harmonic elliptical orbits
    this.orbs.forEach((orb, i) => {
      const angle = time * 0.6 + (i * Math.PI * 2) / 3;
      const radius = 2.4 + Math.sin(time + i) * 0.4;
      orb.position.set(
        1.2 + Math.cos(angle) * radius,
        1.6 + Math.sin(time * 1.5 + i) * 0.35,
        -0.6 + Math.sin(angle) * radius
      );
    });

    // 4. Fireflies gentle drift
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.fireflyCount; i++) {
      const p = this.fireflyPositions[i];
      const x = p.x + Math.sin(time * 0.8 + i) * 0.3;
      const y = p.y + Math.cos(time * 0.6 + i) * 0.25;
      const z = p.z + Math.sin(time * 0.7 + i * 2) * 0.3;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.7 + Math.sin(time * 3 + i) * 0.4);
      dummy.updateMatrix();
      this.firefliesMesh.setMatrixAt(i, dummy.matrix);
    }
    this.firefliesMesh.instanceMatrix.needsUpdate = true;

    // 5. Lantern light flickering
    this.lanternLights.forEach((light, i) => {
      light.intensity = 1.0 + Math.sin(time * 8 + i * 4) * 0.25;
    });

    // 6. Resonant Zen bell chime harmonic trigger
    if (Math.sin(time * 0.15) > 0.995) {
      soundSynth.playZenChime();
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
