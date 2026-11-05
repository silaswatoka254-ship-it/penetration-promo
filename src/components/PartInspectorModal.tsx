import React from 'react';
import { PartInfo } from '../types';
import { X, Layers, Cpu, Disc3 } from 'lucide-react';

interface PartInspectorModalProps {
  selectedPart: PartInfo | null;
  hoveredPart: PartInfo | null;
  onClose: () => void;
}

export const PartInspectorModal: React.FC<PartInspectorModalProps> = ({
  selectedPart,
  hoveredPart,
  onClose,
}) => {
  // If user selected a part (by clicking), show full modal.
  // If user is hovering without selection, show a sleek micro-badge in top-right.

  if (selectedPart) {
    return (
      <div className="fixed top-20 right-6 z-30 w-80 rounded-2xl bg-slate-900 border border-slate-700/90 p-4 shadow-2xl text-slate-100 select-none animate-in fade-in slide-in-from-right-4 duration-200">
        <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                selectedPart.category === 'primary'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : selectedPart.category === 'secondary'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {selectedPart.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">Part Inspection</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{selectedPart.name}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedPart.description}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-amber-400" />
                Material Finish:
              </span>
              <span className="font-mono text-slate-200 text-[11px] font-medium">
                {selectedPart.material}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hoveredPart) {
    return (
      <div className="fixed top-20 right-6 z-20 pointer-events-none rounded-xl bg-slate-900 border border-slate-700/80 px-3 py-2 shadow-xl text-slate-100 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="text-xs font-medium text-slate-200">{hoveredPart.name}</span>
        <span className="text-[10px] text-slate-500 font-mono">(Click to inspect)</span>
      </div>
    );
  }

  return null;
};
