import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LightingPreset } from '../types';

export class LightingRig {
  public keyLight: THREE.DirectionalLight;
  public fillLight: THREE.HemisphereLight;
  public rimLight: THREE.DirectionalLight;
  public currentPreset: LightingPreset = 'studio';

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, isSoftwareGl: boolean) {
    // 1. Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 2. Warm Key Light with tight shadow frustum
    this.keyLight = new THREE.DirectionalLight(0xfff1dc, 2.8);
    this.keyLight.position.set(6, 10, 7);

    if (!isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.width = 2048;
      this.keyLight.shadow.mapSize.height = 2048;
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 30;
      const d = 5;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }

    // 3. Cool Hemisphere Light Fill (Sky / Ground contrast)
    this.fillLight = new THREE.HemisphereLight(0x7ba2cc, 0x1d2430, 1.2);
    this.fillLight.position.set(0, 15, 0);

    // 4. Subtle Rim / Accent Backlight
    this.rimLight = new THREE.DirectionalLight(0xa5c9ff, 1.4);
    this.rimLight.position.set(-8, 5, -8);

    scene.add(this.keyLight);
    scene.add(this.fillLight);
    scene.add(this.rimLight);

    // Set initial fog
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.038);
    scene.background = new THREE.Color(0x0a0c12);
  }

  public applyPreset(preset: LightingPreset, scene: THREE.Scene) {
    this.currentPreset = preset;

    switch (preset) {
      case 'studio':
        this.keyLight.color.setHex(0xfff3e0);
        this.keyLight.intensity = 2.8;
        this.keyLight.position.set(6, 10, 7);

        this.fillLight.color.setHex(0x90a8cc);
        this.fillLight.groundColor.setHex(0x181e28);
        this.fillLight.intensity = 1.2;

        this.rimLight.color.setHex(0x8cb4e8);
        this.rimLight.intensity = 1.4;

        scene.fog = new THREE.FogExp2(0x090b10, 0.038);
        scene.background = new THREE.Color(0x090b10);
        break;

      case 'sunset':
        this.keyLight.color.setHex(0xffaa44);
        this.keyLight.intensity = 3.4;
        this.keyLight.position.set(9, 6, 8);

        this.fillLight.color.setHex(0xff7088);
        this.fillLight.groundColor.setHex(0x2d1124);
        this.fillLight.intensity = 1.5;

        this.rimLight.color.setHex(0x553388);
        this.rimLight.intensity = 1.8;

        scene.fog = new THREE.FogExp2(0x170b14, 0.04);
        scene.background = new THREE.Color(0x170b14);
        break;

      case 'cyberpunk':
        this.keyLight.color.setHex(0x00f0ff);
        this.keyLight.intensity = 3.2;
        this.keyLight.position.set(6, 8, 6);

        this.fillLight.color.setHex(0xff0077);
        this.fillLight.groundColor.setHex(0x100224);
        this.fillLight.intensity = 1.8;

        this.rimLight.color.setHex(0x7928ca);
        this.rimLight.intensity = 2.4;

        scene.fog = new THREE.FogExp2(0x080410, 0.042);
        scene.background = new THREE.Color(0x080410);
        break;

      case 'daylight':
        this.keyLight.color.setHex(0xffffff);
        this.keyLight.intensity = 2.6;
        this.keyLight.position.set(5, 12, 5);

        this.fillLight.color.setHex(0xb0d4ff);
        this.fillLight.groundColor.setHex(0x3a4856);
        this.fillLight.intensity = 1.4;

        this.rimLight.color.setHex(0xd0e6ff);
        this.rimLight.intensity = 1.2;

        scene.fog = new THREE.FogExp2(0x111620, 0.035);
        scene.background = new THREE.Color(0x111620);
        break;
    }
  }
}
