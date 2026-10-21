/**
 * Keyframe animations, gradient presets, and shadow presets
 */

export interface MicroInteractionPreset {
  id: string;
  name: string;
  description: string;
  cssAnimation: string;
  keyframes: string;
}

export interface GradientPreset {
  id: string;
  name: string;
  type: 'linear' | 'radial';
  angle: number;
  stops: { color: string; offset: number }[];
  css: string;
}

export interface ShadowLayer {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
}

export interface MultiShadowPreset {
  id: string;
  name: string;
  layers: ShadowLayer[];
}

export const MICRO_INTERACTIONS: MicroInteractionPreset[] = [
  {
    id: 'float',
    name: 'Float',
    description: 'Smooth vertical hover oscillation',
    cssAnimation: 'vi-float 3s ease-in-out infinite',
    keyframes: `@keyframes vi-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}`,
  },
  {
    id: 'pulse',
    name: 'Breathing Pulse',
    description: 'Gentle heartbeat scale respiration',
    cssAnimation: 'vi-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    keyframes: `@keyframes vi-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.04); opacity: 0.92; }
}`,
  },
  {
    id: 'shimmer',
    name: 'Shimmer Sweep',
    description: 'Luminous metallic gleam pass',
    cssAnimation: 'vi-shimmer 2.2s infinite linear',
    keyframes: `@keyframes vi-shimmer {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.25) contrast(1.05); }
  100% { filter: brightness(1); }
}`,
  },
  {
    id: 'elastic-pop',
    name: 'Elastic Pop',
    description: 'Bouncy spring scaling dynamic',
    cssAnimation: 'vi-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
    keyframes: `@keyframes vi-pop {
  0% { transform: scale(0.92); }
  60% { transform: scale(1.08); }
  100% { transform: scale(1); }
}`,
  },
  {
    id: 'glow-outline',
    name: 'Luminous Glow',
    description: 'Pulsing neon ambient border illumination',
    cssAnimation: 'vi-glow 2.5s ease-in-out infinite alternate',
    keyframes: `@keyframes vi-glow {
  from { box-shadow: 0 0 8px rgba(99, 102, 241, 0.3); }
  to { box-shadow: 0 0 24px rgba(139, 92, 246, 0.8); }
}`,
  },
  {
    id: 'gentle-shake',
    name: 'Gentle Jitter',
    description: 'Subtle attention-grabbing vibration',
    cssAnimation: 'vi-shake 0.8s ease-in-out infinite',
    keyframes: `@keyframes vi-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-1.5deg); }
  75% { transform: rotate(1.5deg); }
}`,
  },
];

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#ff6b6b', offset: 0 },
      { color: '#feca57', offset: 100 },
    ],
    css: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#6366f1', offset: 0 },
      { color: '#a855f7', offset: 50 },
      { color: '#ec4899', offset: 100 },
    ],
    css: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    type: 'linear',
    angle: 120,
    stops: [
      { color: '#10b981', offset: 0 },
      { color: '#06b6d4', offset: 100 },
    ],
    css: 'linear-gradient(120deg, #10b981 0%, #06b6d4 100%)',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#f72585', offset: 0 },
      { color: '#7209b7', offset: 50 },
      { color: '#4cc9f0', offset: 100 },
    ],
    css: 'linear-gradient(90deg, #f72585 0%, #7209b7 50%, #4cc9f0 100%)',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#f43f5e', offset: 0 },
      { color: '#fbbf24', offset: 100 },
    ],
    css: 'linear-gradient(135deg, #f43f5e 0%, #fbbf24 100%)',
  },
  {
    id: 'cosmic-depth',
    name: 'Cosmic Depth',
    type: 'linear',
    angle: 180,
    stops: [
      { color: '#0f172a', offset: 0 },
      { color: '#1e1b4b', offset: 100 },
    ],
    css: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
  },
  {
    id: 'radial-nebula',
    name: 'Radial Nebula',
    type: 'radial',
    angle: 0,
    stops: [
      { color: '#818cf8', offset: 0 },
      { color: '#312e81', offset: 100 },
    ],
    css: 'radial-gradient(circle at center, #818cf8 0%, #312e81 100%)',
  },
];

export const MULTI_SHADOW_PRESETS: MultiShadowPreset[] = [
  {
    id: 'soft-elevation',
    name: 'Soft Elevation',
    layers: [
      { x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0, 0, 0, 0.1)', inset: false },
      { x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0, 0, 0, 0.15)', inset: false },
    ],
  },
  {
    id: 'floating-card',
    name: 'Floating Card',
    layers: [
      { x: 0, y: 10, blur: 25, spread: -5, color: 'rgba(0, 0, 0, 0.2)', inset: false },
      { x: 0, y: 20, blur: 48, spread: -8, color: 'rgba(0, 0, 0, 0.12)', inset: false },
    ],
  },
  {
    id: 'luminous-glow',
    name: 'Indigo Glow',
    layers: [
      { x: 0, y: 0, blur: 15, spread: 0, color: 'rgba(99, 102, 241, 0.45)', inset: false },
      { x: 0, y: 0, blur: 30, spread: 4, color: 'rgba(139, 92, 246, 0.25)', inset: false },
    ],
  },
  {
    id: 'glass-edge',
    name: 'Glass Reflection',
    layers: [
      { x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(255, 255, 255, 0.2)', inset: true },
      { x: 0, y: 8, blur: 32, spread: 0, color: 'rgba(0, 0, 0, 0.28)', inset: false },
    ],
  },
  {
    id: 'neo-brutalist',
    name: 'Neo Brutalist',
    layers: [
      { x: 4, y: 4, blur: 0, spread: 0, color: '#000000', inset: false },
    ],
  },
];

export function serializeShadowLayers(layers: ShadowLayer[]): string {
  if (!layers.length) return 'none';
  return layers
    .map(
      (l) =>
        `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${l.color}`
    )
    .join(', ');
}

export const DEFAULT_PALETTE: string[] = [
  '#000000',
  '#ffffff',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
  '#1e293b',
];

