export type SceneId = 'tourbillon' | 'rover' | 'zen';

export type LightingPreset = 'studio' | 'sunset' | 'cyberpunk' | 'daylight';

export type MaterialFinish = 'default' | 'gold' | 'stealth' | 'silver';

export type CameraViewPreset = 'hero' | 'top' | 'macro' | 'cinematic';

export interface SceneSpec {
  id: SceneId;
  title: string;
  category: string;
  tagline: string;
  partCount: number;
  description: string;
  defaultFinish: MaterialFinish;
  availableFinishes: { id: MaterialFinish; label: string; color: string }[];
  audioTheme: 'horology' | 'rover' | 'zen';
}

export interface PartInfo {
  name: string;
  description: string;
  material: string;
  category: 'primary' | 'secondary' | 'accent';
}
