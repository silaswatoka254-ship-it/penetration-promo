import React from 'react';
import { X, Layers, Cpu, Compass, Sun, ShieldCheck, Box } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoftwareGl: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, isSoftwareGl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Chronos 3D Procedural Studio
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Built strictly according to Three.js craft guidelines featuring procedural geometry
          modeling, studio PBR environment lighting, and zero external 404 dependencies.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <Layers className="w-4 h-4" />
              Composite Modeling
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Every subject is engineered with 9–15 distinct sub-assemblies across primary silhouette,
              secondary read, and micro-accents.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
              <Sun className="w-4 h-4" />
              PBR Studio Pipeline
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              ACESFilmicToneMapping, RoomEnvironment with PMREMGenerator, warm key & cool fill
              lighting rig with PCFSoftShadowMap.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Compass className="w-4 h-4" />
              Kinematic Physics
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Authentic 28,800 VPH horology balance wheel oscillation, breathing hairspring, 360°
              LiDAR scan, and wave displacement shaders.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              Zero 404 Assets
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              All watch dials, perlage graining, solar cells, and Web Audio oscillator ticks are
              100% procedurally synthesized in code.
            </p>
          </div>
        </div>

        {/* GPU / Software Status */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
          <span>WebGL Acceleration:</span>
          <span className="font-mono text-slate-200">
            {isSoftwareGl ? 'Software WebGL (Paced Loop)' : 'Hardware GPU Accelerated'}
          </span>
        </div>
      </div>
    </div>
  );
};
