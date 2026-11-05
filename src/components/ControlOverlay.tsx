import React, { useState, useEffect } from 'react';
import { CameraViewPreset, LightingPreset, MaterialFinish, SceneId, SceneSpec } from '../types';
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  Sliders,
  Sun,
  Camera,
  Layers,
  Palette,
  Compass,
  RotateCw,
  Watch,
  Rocket,
  Flower2,
} from 'lucide-react';
import { soundSynth } from '../audio/soundSynth';

interface ControlOverlayProps {
  currentSceneId: SceneId;
  sceneSpecs: Record<SceneId, SceneSpec>;
  onSelectScene: (id: SceneId) => void;
  explodeFactor: number;
  onExplodeChange: (factor: number) => void;
  materialFinish: MaterialFinish;
  onFinishChange: (finish: MaterialFinish) => void;
  lightingPreset: LightingPreset;
  onLightingChange: (preset: LightingPreset) => void;
  cameraView: CameraViewPreset;
  onCameraChange: (view: CameraViewPreset) => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  currentSceneId,
  sceneSpecs,
  onSelectScene,
  explodeFactor,
  onExplodeChange,
  materialFinish,
  onFinishChange,
  lightingPreset,
  onLightingChange,
  cameraView,
  onCameraChange,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'explode' | 'materials' | 'lighting' | 'camera'>('explode');

  const currentSpec = sceneSpecs[currentSceneId];

  // Keyboard shortcut 'H' for toggling zen/cinema mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed((prev) => !prev);
        soundSynth.playUiClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tab: 'explode' | 'materials' | 'lighting' | 'camera') => {
    setActiveTab(tab);
    soundSynth.playUiClick();
  };

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[920px] transition-transform duration-300 ease-out select-none"
      style={{
        transform: `translate(-50%, ${isCollapsed ? 'calc(100% - 32px)' : '0'})`,
      }}
    >
      {/* Drawer Toggle Header / Tab */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            soundSynth.playUiClick();
          }}
          className="px-4 py-1.5 rounded-t-xl bg-slate-900 border-t border-x border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 shadow-md transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Consolidated Control Dock (Zero backdrop-filter, pure solid rgba surfaces) */}
      <div className="rounded-2xl bg-slate-900 border border-slate-700/80 p-3 shadow-2xl flex flex-col gap-2.5">
        {/* Row 1: Scene Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => onSelectScene('tourbillon')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              currentSceneId === 'tourbillon'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Watch className="w-4 h-4 text-amber-400" />
            <span className="truncate">Chrono-Tourbillon</span>
          </button>

          <button
            onClick={() => onSelectScene('rover')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              currentSceneId === 'rover'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span className="truncate">Cyber-Scout Rover</span>
          </button>

          <button
            onClick={() => onSelectScene('zen')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              currentSceneId === 'zen'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Flower2 className="w-4 h-4 text-emerald-400" />
            <span className="truncate">Zen Sanctuary</span>
          </button>
        </div>

        {/* Row 2: Secondary Control Sub-Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleTabChange('explode')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'explode'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Exploded View</span>
            </button>

            <button
              onClick={() => handleTabChange('materials')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'materials'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Material Finishes</span>
            </button>

            <button
              onClick={() => handleTabChange('lighting')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'lighting'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Studio Lighting</span>
            </button>

            <button
              onClick={() => handleTabChange('camera')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Views</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Drag to Orbit • Scroll to Zoom • Right-click to Pan
          </div>
        </div>

        {/* Row 3: Active Sub-Control Drawer Content */}
        <div className="min-h-[46px] flex items-center justify-between gap-4">
          {activeTab === 'explode' && (
            <div className="flex-1 flex items-center gap-4">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                Assembly Separation:
              </span>
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodeFactor}
                  onChange={(e) => onExplodeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-xs font-mono text-amber-300 w-12 text-right">
                  {Math.round(explodeFactor * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onExplodeChange(0)}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Assembled
                </button>
                <button
                  onClick={() => onExplodeChange(0.5)}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Half
                </button>
                <button
                  onClick={() => onExplodeChange(1.0)}
                  className="px-2 py-1 text-[11px] rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Full
                </button>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                Surface Finishes:
              </span>
              <div className="flex items-center gap-2">
                {currentSpec.availableFinishes.map((finish) => (
                  <button
                    key={finish.id}
                    onClick={() => onFinishChange(finish.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      materialFinish === finish.id
                        ? 'bg-slate-800 text-white border-amber-400/80 shadow'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-600 shadow-inner"
                      style={{ backgroundColor: finish.color }}
                    />
                    <span>{finish.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'lighting' && (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                Environment Rig:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { id: 'studio', label: 'Studio Noir', hint: 'Warm key / cool fill' },
                  { id: 'sunset', label: 'Golden Sunset', hint: 'Amber rays / violet fog' },
                  { id: 'cyberpunk', label: 'Cyber Neon', hint: 'Cyan key / magenta rim' },
                  { id: 'daylight', label: 'Crisp Daylight', hint: 'Clear sky 5500K' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLightingChange(item.id as LightingPreset)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      lightingPreset === item.id
                        ? 'bg-slate-800 text-cyan-300 border-cyan-400/80 shadow'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1">
              <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                Camera Angles:
              </span>
              <div className="flex items-center gap-2">
                {[
                  { id: 'hero', label: 'Hero 45°', icon: Compass },
                  { id: 'top', label: 'Top Blueprint', icon: Maximize2 },
                  { id: 'macro', label: 'Macro Escapement', icon: Camera },
                  { id: 'cinematic', label: 'Cinematic Orbit', icon: RotateCw },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onCameraChange(item.id as CameraViewPreset)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        cameraView === item.id
                          ? 'bg-slate-800 text-amber-300 border-amber-400/80 shadow'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
