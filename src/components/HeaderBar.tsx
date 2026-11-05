import React from 'react';
import { SceneSpec } from '../types';
import { Volume2, VolumeX, Eye, Sparkles, Box, Info } from 'lucide-react';
import { soundSynth } from '../audio/soundSynth';

interface HeaderBarProps {
  currentScene: SceneSpec;
  soundEnabled: boolean;
  onToggleSound: () => void;
  wireframe: boolean;
  onToggleWireframe: () => void;
  onOpenAbout: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentScene,
  soundEnabled,
  onToggleSound,
  wireframe,
  onToggleWireframe,
  onOpenAbout,
}) => {
  return (
    <header className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex items-center justify-between">
      {/* Title & Static Spec Badge */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
                {currentScene.category}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {currentScene.partCount} Composite Parts
              </span>
            </div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-none mt-0.5">
              {currentScene.title}
            </h1>
          </div>
        </div>

        {/* Tagline / Subtitle Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentScene.tagline}</span>
        </div>
      </div>

      {/* Quick Utilities: Sound, Wireframe, About */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleWireframe}
          title={wireframe ? 'Disable Wireframe' : 'Enable Wireframe Inspection'}
          className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-md ${
            wireframe
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wireframe</span>
        </button>

        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Procedural Audio' : 'Enable Procedural Audio'}
          className={`p-2 rounded-xl text-xs font-medium flex items-center transition-colors border shadow-md ${
            soundEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:bg-slate-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenAbout}
          title="Scene Architecture & Specs"
          className="p-2 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-700/80 hover:bg-slate-800 transition-colors shadow-md"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
