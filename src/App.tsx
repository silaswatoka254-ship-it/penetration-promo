import React, { useEffect, useRef, useState } from 'react';
import { CameraViewPreset, LightingPreset, MaterialFinish, PartInfo, SceneId, SceneSpec } from './types';
import { ThreeEngine } from './three/engine';
import { HeaderBar } from './components/HeaderBar';
import { ControlOverlay } from './components/ControlOverlay';
import { PartInspectorModal } from './components/PartInspectorModal';
import { AboutModal } from './components/AboutModal';
import { soundSynth } from './audio/soundSynth';

const SCENE_SPECS: Record<SceneId, SceneSpec> = {
  tourbillon: {
    id: 'tourbillon',
    title: 'Haute Horlogerie Chrono-Tourbillon',
    category: 'Precision Mechanics',
    tagline: '4Hz / 28,800 VPH Swiss Flying Escapement with Breguet Overcoil Hairspring',
    partCount: 15,
    description: 'A 15-part composite horological mechanical movement featuring a rotating flying tourbillon cage, balance wheel with 8 gold regulating weights, circular perlage baseplate, and domed sapphire crystal.',
    defaultFinish: 'default',
    audioTheme: 'horology',
    availableFinishes: [
      { id: 'default', label: 'Titanium & Blued Steel', color: '#94a3b8' },
      { id: 'gold', label: '18K Rose Gold & Ruby', color: '#e8be78' },
      { id: 'stealth', label: 'Obsidian DLC Carbon', color: '#1e293b' },
      { id: 'silver', label: 'Rhodium & Perlage', color: '#e2e8f0' },
    ],
  },
  rover: {
    id: 'rover',
    title: 'Cyber-Scout Planetary Rover',
    category: 'Aerospace Robotics',
    tagline: '6WD Rocker-Bogie Explorer with 360° LiDAR Dome and Sample Core Drill',
    partCount: 14,
    description: 'Autonomous exploration rover engineered with rocker-bogie articulated suspension, deep chevron tires, 3-axis sampling manipulator, deployable solar wings, and panoramic stereo mast.',
    defaultFinish: 'default',
    audioTheme: 'rover',
    availableFinishes: [
      { id: 'default', label: 'NASA Space White', color: '#f1f5f9' },
      { id: 'gold', label: 'Martian Ochre Sand', color: '#d97706' },
      { id: 'stealth', label: 'Stealth Carbon Fiber', color: '#0f172a' },
      { id: 'silver', label: 'Brushed Aerospace Titanium', color: '#cbd5e1' },
    ],
  },
  zen: {
    id: 'zen',
    title: 'Bioluminescent Zen Sanctuary',
    category: 'Atmospheric Architecture',
    tagline: 'Floating Island Pagoda Shrine, Gnarled Bonsai & Ripple Water Basin',
    partCount: 12,
    description: 'Serene Japanese pagoda shrine resting on weathered granite steps, flanked by a twisted centuries-old bonsai with bioluminescent blossoms, glowing stone lanterns, and rippling water basin.',
    defaultFinish: 'default',
    audioTheme: 'zen',
    availableFinishes: [
      { id: 'default', label: 'Traditional Vermilion', color: '#dc2626' },
      { id: 'gold', label: 'Golden Amber & Brass', color: '#f59e0b' },
      { id: 'stealth', label: 'Kurogane Cast Iron', color: '#18181b' },
      { id: 'silver', label: 'Pure White Marble', color: '#f8fafc' },
    ],
  },
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  // App UI State
  const [currentSceneId, setCurrentSceneId] = useState<SceneId>('tourbillon');
  const [explodeFactor, setExplodeFactor] = useState<number>(0);
  const [materialFinish, setMaterialFinish] = useState<MaterialFinish>('default');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [cameraView, setCameraView] = useState<CameraViewPreset>('hero');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);

  // Interactive Inspection
  const [hoveredPart, setHoveredPart] = useState<PartInfo | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartInfo | null>(null);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);
  const [isSoftwareGl, setIsSoftwareGl] = useState<boolean>(false);

  // Initialize Three.js WebGL Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new ThreeEngine(mountRef.current, {
      onPartHover: (part) => setHoveredPart(part),
      onPartSelect: (part) => setSelectedPart(part),
    });

    engineRef.current = engine;
    setIsSoftwareGl(engine.isSoftwareGl);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync state changes with engine
  const handleSelectScene = (sceneId: SceneId) => {
    setCurrentSceneId(sceneId);
    setExplodeFactor(0);
    setSelectedPart(null);
    setHoveredPart(null);
    soundSynth.playUiClick();

    if (engineRef.current) {
      engineRef.current.loadScene(sceneId);
    }
  };

  const handleExplodeChange = (factor: number) => {
    setExplodeFactor(factor);
    if (engineRef.current) {
      engineRef.current.setExplode(factor);
    }
  };

  const handleFinishChange = (finish: MaterialFinish) => {
    setMaterialFinish(finish);
    soundSynth.playUiClick();
    if (engineRef.current) {
      engineRef.current.applyFinish(finish);
    }
  };

  const handleLightingChange = (preset: LightingPreset) => {
    setLightingPreset(preset);
    soundSynth.playUiClick();
    if (engineRef.current) {
      engineRef.current.applyLightingPreset(preset);
    }
  };

  const handleCameraChange = (view: CameraViewPreset) => {
    setCameraView(view);
    soundSynth.playUiClick();
    if (engineRef.current) {
      engineRef.current.setCameraView(view);
    }
  };

  const handleToggleWireframe = () => {
    const next = !wireframe;
    setWireframe(next);
    soundSynth.playUiClick();
    if (engineRef.current) {
      engineRef.current.setWireframe(next);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundSynth.setEnabled(next);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08090d]">
      {/* Dedicated isolated WebGL canvas mount container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Bar */}
      <HeaderBar
        currentScene={SCENE_SPECS[currentSceneId]}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        wireframe={wireframe}
        onToggleWireframe={handleToggleWireframe}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Interactive Raycasted Part Inspector */}
      <PartInspectorModal
        selectedPart={selectedPart}
        hoveredPart={hoveredPart}
        onClose={() => setSelectedPart(null)}
      />

      {/* Consolidated Collapsible Bottom Dock (<= 15% Viewport) */}
      <ControlOverlay
        currentSceneId={currentSceneId}
        sceneSpecs={SCENE_SPECS}
        onSelectScene={handleSelectScene}
        explodeFactor={explodeFactor}
        onExplodeChange={handleExplodeChange}
        materialFinish={materialFinish}
        onFinishChange={handleFinishChange}
        lightingPreset={lightingPreset}
        onLightingChange={handleLightingChange}
        cameraView={cameraView}
        onCameraChange={handleCameraChange}
      />

      {/* Architecture & PBR Standards Modal */}
      <AboutModal
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
        isSoftwareGl={isSoftwareGl}
      />
    </div>
  );
}
