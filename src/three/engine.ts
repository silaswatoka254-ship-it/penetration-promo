import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CameraViewPreset, LightingPreset, MaterialFinish, PartInfo, SceneId } from '../types';
import { LightingRig } from './lightingRig';
import { TourbillonScene } from './scenes/tourbillonScene';
import { RoverScene } from './scenes/roverScene';
import { ZenScene } from './scenes/zenScene';

// Pre-allocated scratch math objects outside the render loop (Zero GC!)
const _scratchVec1 = new THREE.Vector3();
const _scratchVec2 = new THREE.Vector3();
const _scratchRayPos = new THREE.Vector2();

export interface EngineCallbacks {
  onPartHover?: (part: PartInfo | null) => void;
  onPartSelect?: (part: PartInfo | null) => void;
}

export class ThreeEngine {
  private container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public controls!: OrbitControls;
  public lightingRig!: LightingRig;
  public isSoftwareGl: boolean = false;

  // Active scene instance
  public activeSceneId: SceneId = 'tourbillon';
  private tourbillonScene: TourbillonScene | null = null;
  private roverScene: RoverScene | null = null;
  private zenScene: ZenScene | null = null;

  // Scene state
  public explodeFactor: number = 0;
  public wireframe: boolean = false;
  public currentFinish: MaterialFinish = 'default';
  public currentPreset: LightingPreset = 'studio';
  public currentCameraView: CameraViewPreset = 'hero';

  // Animation & loop timing
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Camera transition targets
  private targetCamPos = new THREE.Vector3(5, 5, 6);
  private targetLookAt = new THREE.Vector3(0, 1.5, 0);
  private isTransitioningCamera: boolean = false;

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private callbacks: EngineCallbacks = {};

  constructor(container: HTMLElement, callbacks: EngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    this.detectSoftwareGl();
    this.initRenderer();
    this.initSceneAndCamera();
    this.initControls();
    this.initLighting();
    this.initRaycasting();

    // Load initial scene
    this.loadScene('tourbillon');

    // Pre-warm shaders (skip on software gl per skill instructions)
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Start loop
    this.startLoop();
  }

  private detectSoftwareGl() {
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onWindowResize);
  }

  private initSceneAndCamera() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(5.5, 4.2, 5.5);
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxDistance = 25;
    this.controls.minDistance = 1.2;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent diving below floor
    this.controls.target.set(0, 1.4, 0);

    // Cancel scripted camera animations whenever user interacts manually
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
      if (this.currentCameraView === 'cinematic') {
        this.currentCameraView = 'hero';
      }
    });
  }

  private initLighting() {
    this.lightingRig = new LightingRig(this.scene, this.renderer, this.isSoftwareGl);
  }

  private initRaycasting() {
    let lastRaycastTime = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastRaycastTime < 32) return; // 30fps throttle on pointer movement
      lastRaycastTime = now;

      const rect = this.renderer.domElement.getBoundingClientRect();
      _scratchRayPos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _scratchRayPos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(_scratchRayPos, this.camera);
      const activeParts = this.getActiveParts();
      if (!activeParts.length) {
        this.callbacks.onPartHover?.(null);
        return;
      }

      const interactiveRoots = activeParts.map((p) => p.object);
      const intersects = this.raycaster.intersectObjects(interactiveRoots, true);

      if (intersects.length > 0) {
        // Find which part contains this hit object
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== this.scene) {
          const match = activeParts.find((p) => p.object === hitObject);
          if (match) {
            this.callbacks.onPartHover?.(match.info);
            return;
          }
          hitObject = hitObject.parent;
        }
      }
      this.callbacks.onPartHover?.(null);
    };

    const handlePointerClick = (e: MouseEvent) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      _scratchRayPos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _scratchRayPos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(_scratchRayPos, this.camera);
      const activeParts = this.getActiveParts();
      if (!activeParts.length) return;

      const interactiveRoots = activeParts.map((p) => p.object);
      const intersects = this.raycaster.intersectObjects(interactiveRoots, true);

      if (intersects.length > 0) {
        let hitObject: THREE.Object3D | null = intersects[0].object;
        while (hitObject && hitObject.parent !== this.scene) {
          const match = activeParts.find((p) => p.object === hitObject);
          if (match) {
            this.callbacks.onPartSelect?.(match.info);
            return;
          }
          hitObject = hitObject.parent;
        }
      }
    };

    this.renderer.domElement.addEventListener('mousemove', handlePointerMove);
    this.renderer.domElement.addEventListener('click', handlePointerClick);
  }

  private getActiveParts(): { object: THREE.Object3D; info: PartInfo }[] {
    switch (this.activeSceneId) {
      case 'tourbillon':
        return this.tourbillonScene?.parts || [];
      case 'rover':
        return this.roverScene?.parts || [];
      case 'zen':
        return this.zenScene?.parts || [];
      default:
        return [];
    }
  }

  public loadScene(sceneId: SceneId) {
    this.activeSceneId = sceneId;
    this.explodeFactor = 0;

    // Dispose previous scenes
    if (this.tourbillonScene) {
      this.scene.remove(this.tourbillonScene.rootGroup);
      this.tourbillonScene.dispose();
      this.tourbillonScene = null;
    }
    if (this.roverScene) {
      this.scene.remove(this.roverScene.rootGroup);
      this.roverScene.dispose();
      this.roverScene = null;
    }
    if (this.zenScene) {
      this.scene.remove(this.zenScene.rootGroup);
      this.zenScene.dispose();
      this.zenScene = null;
    }

    // Initialize new scene
    switch (sceneId) {
      case 'tourbillon':
        this.tourbillonScene = new TourbillonScene(this.scene, this.renderer, this.isSoftwareGl);
        this.setCameraView('hero');
        break;
      case 'rover':
        this.roverScene = new RoverScene(this.scene, this.renderer, this.isSoftwareGl);
        this.setCameraView('hero');
        break;
      case 'zen':
        this.zenScene = new ZenScene(this.scene, this.renderer, this.isSoftwareGl);
        this.setCameraView('hero');
        break;
    }

    this.applyFinish(this.currentFinish);
    this.applyLightingPreset(this.currentPreset);
    this.setWireframe(this.wireframe);
  }

  public setExplode(factor: number) {
    this.explodeFactor = Math.max(0, Math.min(1, factor));
  }

  public applyFinish(finish: MaterialFinish) {
    this.currentFinish = finish;
    this.tourbillonScene?.applyFinish(finish);
    this.roverScene?.applyFinish(finish);
    this.zenScene?.applyFinish(finish);
  }

  public applyLightingPreset(preset: LightingPreset) {
    this.currentPreset = preset;
    this.lightingRig.applyPreset(preset, this.scene);
  }

  public setWireframe(wireframe: boolean) {
    this.wireframe = wireframe;
    this.tourbillonScene?.setWireframe(wireframe);
    this.roverScene?.setWireframe(wireframe);
    this.zenScene?.setWireframe(wireframe);
  }

  public setCameraView(preset: CameraViewPreset) {
    this.currentCameraView = preset;
    this.isTransitioningCamera = true;

    switch (this.activeSceneId) {
      case 'tourbillon':
        if (preset === 'hero') {
          this.targetCamPos.set(4.5, 3.8, 4.5);
          this.targetLookAt.set(0, 1.4, 0);
        } else if (preset === 'top') {
          this.targetCamPos.set(0.01, 7.5, 0.01);
          this.targetLookAt.set(0, 1.4, 0);
        } else if (preset === 'macro') {
          this.targetCamPos.set(1.4, 2.1, 2.0);
          this.targetLookAt.set(0, 1.4, 0.75); // Focused right on tourbillon escapement!
        }
        break;

      case 'rover':
        if (preset === 'hero') {
          this.targetCamPos.set(5.5, 3.6, 5.0);
          this.targetLookAt.set(0, 1.1, 0);
        } else if (preset === 'top') {
          this.targetCamPos.set(0.01, 9.0, 0.01);
          this.targetLookAt.set(0, 1.1, 0);
        } else if (preset === 'macro') {
          this.targetCamPos.set(1.5, 2.2, 2.4);
          this.targetLookAt.set(0.45, 1.9, 0.65); // Focused on LiDAR sensor head
        }
        break;

      case 'zen':
        if (preset === 'hero') {
          this.targetCamPos.set(6.5, 4.2, 6.5);
          this.targetLookAt.set(0.4, 1.6, 0);
        } else if (preset === 'top') {
          this.targetCamPos.set(0.01, 10.0, 0.01);
          this.targetLookAt.set(0, 1.0, 0);
        } else if (preset === 'macro') {
          this.targetCamPos.set(-0.8, 1.4, -0.2);
          this.targetLookAt.set(-2.0, 1.8, -1.6); // Focused on Bonsai & Sakura blossoms
        }
        break;
    }
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDestroyed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.isDestroyed) return;

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const time = this.clock.getElapsedTime();

      // Camera preset transitions using exponential damping
      if (this.isTransitioningCamera) {
        this.camera.position.lerp(this.targetCamPos, Math.min(delta * 4, 0.2));
        this.controls.target.lerp(this.targetLookAt, Math.min(delta * 4, 0.2));
        if (this.camera.position.distanceTo(this.targetCamPos) < 0.08) {
          this.isTransitioningCamera = false;
        }
      } else if (this.currentCameraView === 'cinematic') {
        // Slow cinematic orbit
        const orbitRadius = 7.0;
        const orbitSpeed = 0.2;
        this.camera.position.x = Math.sin(time * orbitSpeed) * orbitRadius;
        this.camera.position.z = Math.cos(time * orbitSpeed) * orbitRadius;
        this.camera.lookAt(this.controls.target);
      }

      this.controls.update();

      // Update active scene animations
      if (this.activeSceneId === 'tourbillon' && this.tourbillonScene) {
        this.tourbillonScene.update(time, delta, this.explodeFactor);
      } else if (this.activeSceneId === 'rover' && this.roverScene) {
        this.roverScene.update(time, delta, this.explodeFactor);
      } else if (this.activeSceneId === 'zen' && this.zenScene) {
        this.zenScene.update(time, delta, this.explodeFactor);
      }

      // Render frame
      this.renderer.render(this.scene, this.camera);

      // Pacing on software WebGL vs normal rAF on GPU
      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onWindowResize);

    this.controls.dispose();
    this.tourbillonScene?.dispose();
    this.roverScene?.dispose();
    this.zenScene?.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
