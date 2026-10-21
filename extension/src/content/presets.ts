export interface VisualPreset {
  id: string;
  name: string;
  category: 'Gradients & Text' | 'Glass & Shadows' | 'Cyber & Glow' | 'Borders & Shape' | 'Animations';
  description: string;
  styles: Record<string, string>;
  keyframes?: string;
}

export const VISUAL_PRESETS: VisualPreset[] = [
  // 1. Gradients & Text
  {
    id: 'animated-black-orange-gradient',
    name: 'Black & Orange Flow',
    category: 'Gradients & Text',
    description: 'Infinite animated black and vibrant orange linear gradient text',
    styles: {
      background: 'linear-gradient(90deg, #09090b 0%, #ea580c 25%, #ff7a00 50%, #ea580c 75%, #09090b 100%)',
      backgroundSize: '200% auto',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      animation: 'vi-gradient-flow 4s linear infinite',
    },
    keyframes: `@keyframes vi-gradient-flow { 0% { background-position: 0% center; } 100% { background-position: -200% center; } }`,
  },
  {
    id: 'rainbow-flow-gradient',
    name: 'Rainbow Wave',
    category: 'Gradients & Text',
    description: 'Vibrant modern rainbow linear gradient text animation',
    styles: {
      background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b, #ec4899)',
      backgroundSize: '200% auto',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      animation: 'vi-rainbow-flow 5s linear infinite',
    },
    keyframes: `@keyframes vi-rainbow-flow { 0% { background-position: 0% center; } 100% { background-position: -200% center; } }`,
  },
  {
    id: 'text-metallic-shimmer',
    name: 'Metallic Shimmer',
    category: 'Gradients & Text',
    description: 'Silvery metallic text with animated reflective sheen',
    styles: {
      background: 'linear-gradient(110deg, #71717a 20%, #ffffff 40%, #ffffff 60%, #71717a 80%)',
      backgroundSize: '200% 100%',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      animation: 'vi-metal-shimmer 3s ease-in-out infinite',
      display: 'inline-block',
    },
    keyframes: `@keyframes vi-metal-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`,
  },
  {
    id: 'vivid-sunset-text',
    name: 'Sunset Horizon',
    category: 'Gradients & Text',
    description: 'Warm purple-to-amber radial sunset typography',
    styles: {
      background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      fontWeight: '800',
    },
  },

  // 2. Glass & Shadows
  {
    id: 'glassmorphism-frost',
    name: 'Frosted Glass Card',
    category: 'Glass & Shadows',
    description: 'Translucent frosted glass with blurred background and subtle border',
    styles: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(16px)',
      webkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
      borderRadius: '8px',
    },
  },
  {
    id: 'obsidian-dark-glass',
    name: 'Obsidian Dark Glass',
    category: 'Glass & Shadows',
    description: 'Deep black translucent glass with subtle reflective edge',
    styles: {
      background: 'rgba(18, 18, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      webkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)',
      color: '#ffffff',
      borderRadius: '8px',
    },
  },
  {
    id: 'modern-saas-elevation',
    name: 'SaaS Card Elevation',
    category: 'Glass & Shadows',
    description: 'Multi-layer subtle elevation shadow used by premium SaaS products',
    styles: {
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      border: '1px solid #e4e4e7',
      borderRadius: '8px',
      background: '#ffffff',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    },
  },
  {
    id: 'floating-deep-shadow',
    name: 'Floating Stage Shadow',
    category: 'Glass & Shadows',
    description: 'Dramatic ambient depth shadow creating floating object effect',
    styles: {
      boxShadow: '0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
    },
  },
  {
    id: 'spotlight-radial-glow',
    name: 'Spotlight Ambient Glow',
    category: 'Glass & Shadows',
    description: 'Centric subtle radial highlight creating an architectural spotlight',
    styles: {
      background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0) 70%), #ffffff',
      border: '1px solid #e0e7ff',
      borderRadius: '8px',
      boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.1)',
    },
  },
  {
    id: 'claymorphism-card',
    name: 'Claymorphism Soft Card',
    category: 'Glass & Shadows',
    description: 'Modern tactile 3D clay aesthetic with dual ambient inner shadows',
    styles: {
      background: '#f8fafc',
      borderRadius: '16px',
      boxShadow: '10px 10px 24px #cbd5e1, -10px -10px 24px #ffffff, inset 2px 2px 4px #ffffff, inset -2px -2px 4px rgba(0,0,0,0.05)',
      border: '1px solid #ffffff',
    },
  },

  // 3. Cyber & Glow
  {
    id: 'neon-orange-glow',
    name: 'Neon Orange Aura',
    category: 'Cyber & Glow',
    description: 'Vibrant glowing edge matching the Vibe Inspector amber theme',
    styles: {
      boxShadow: '0 0 15px rgba(249, 115, 22, 0.5), 0 0 35px rgba(249, 115, 22, 0.25)',
      border: '1.5px solid #f97316',
      borderRadius: '6px',
    },
  },
  {
    id: 'cyberpunk-neon-duo',
    name: 'Cyberpunk Violet/Cyan',
    category: 'Cyber & Glow',
    description: 'Futuristic two-tone cyan and purple glowing borders',
    styles: {
      boxShadow: '0 0 15px rgba(6, 182, 212, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
      border: '1.5px solid #06b6d4',
      borderRadius: '6px',
    },
  },
  {
    id: 'matrix-emerald-glow',
    name: 'Matrix Emerald Glow',
    category: 'Cyber & Glow',
    description: 'High-tech terminal emerald neon aura on dark backdrop',
    styles: {
      background: '#051b11',
      color: '#34d399',
      border: '1px solid #10b981',
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
      borderRadius: '6px',
    },
  },
  {
    id: 'border-pulse-glow',
    name: 'Pulsing Halo Glow',
    category: 'Cyber & Glow',
    description: 'Breathing animated halo glow that smoothly expands and contracts',
    styles: {
      border: '2px solid #6366f1',
      borderRadius: '8px',
      animation: 'vi-pulse-halo 2.5s infinite ease-in-out',
    },
    keyframes: `@keyframes vi-pulse-halo {
      0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, 0.2); }
      50% { box-shadow: 0 0 25px rgba(99, 102, 241, 0.8), 0 0 45px rgba(99, 102, 241, 0.4); }
    }`,
  },

  // 4. Borders & Shape
  {
    id: 'retro-brutalism',
    name: 'Retro Brutalism',
    category: 'Borders & Shape',
    description: 'Stark 3px solid black border with 5px hard offset drop shadow',
    styles: {
      border: '3px solid #000000',
      boxShadow: '5px 5px 0px #000000',
      borderRadius: '0px',
      background: '#ffffff',
      fontWeight: '700',
    },
  },
  {
    id: 'modern-pill-badge',
    name: 'Modern Pill Tag',
    category: 'Borders & Shape',
    description: 'Compact high-density pill badge with subtle border',
    styles: {
      borderRadius: '9999px',
      padding: '4px 14px',
      border: '1px solid #e4e4e7',
      background: '#f4f4f5',
      display: 'inline-flex',
      alignItems: 'center',
      fontSize: '0.85rem',
      fontWeight: '600',
    },
  },
  {
    id: 'monochrome-invert-contrast',
    name: 'Stark Monochrome Invert',
    category: 'Borders & Shape',
    description: 'Bold pure black background with crisp white typography and zero border-radius',
    styles: {
      background: '#09090b',
      color: '#fafafa',
      border: '1px solid #27272a',
      borderRadius: '4px',
      padding: '12px 18px',
    },
  },
  {
    id: 'dashed-blueprint-outline',
    name: 'Architectural Blueprint',
    category: 'Borders & Shape',
    description: 'Clean architectural dashed outline with subtle accent tint',
    styles: {
      outline: '2px dashed #3b82f6',
      outlineOffset: '3px',
      borderRadius: '4px',
    },
  },
  {
    id: 'neumorphism-extrude',
    name: 'Neumorphism Extrude',
    category: 'Borders & Shape',
    description: 'Soft sculpted neumorphic extrude surface on cool grey',
    styles: {
      background: '#e2e8f0',
      boxShadow: '8px 8px 16px #cbd5e1, -8px -8px 16px #ffffff',
      borderRadius: '12px',
      border: 'none',
    },
  },
  {
    id: 'neumorphism-inset',
    name: 'Neumorphism Inset',
    category: 'Borders & Shape',
    description: 'Soft pressed neumorphic indentation',
    styles: {
      background: '#e2e8f0',
      boxShadow: 'inset 6px 6px 10px #cbd5e1, inset -6px -6px 10px #ffffff',
      borderRadius: '12px',
      border: 'none',
    },
  },

  // 5. Animations
  {
    id: 'breathing-float-pulse',
    name: 'Gentle Float Levitation',
    category: 'Animations',
    description: 'Subtle smooth vertical levitation animation for cards and badges',
    styles: {
      animation: 'vi-float-levitate 3.5s ease-in-out infinite',
      willChange: 'transform',
    },
    keyframes: `@keyframes vi-float-levitate {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }`,
  },
  {
    id: 'skeleton-shimmer-loader',
    name: 'Skeleton Shimmer',
    category: 'Animations',
    description: 'Dynamic sweeping linear shimmer loading effect',
    styles: {
      background: 'linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 37%, #f4f4f5 63%)',
      backgroundSize: '400% 100%',
      animation: 'vi-skeleton-shimmer 1.5s ease infinite',
      borderRadius: '4px',
    },
    keyframes: `@keyframes vi-skeleton-shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }`,
  },
  {
    id: 'aurora-background-wave',
    name: 'Aurora Borealis Wave',
    category: 'Animations',
    description: 'Dreamy shifting multicolored ambient background gradient',
    styles: {
      background: 'linear-gradient(125deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #065f46 100%)',
      backgroundSize: '200% 200%',
      color: '#ffffff',
      animation: 'vi-aurora-shift 8s ease infinite',
      borderRadius: '8px',
    },
    keyframes: `@keyframes vi-aurora-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }`,
  },
  {
    id: 'subtle-scale-press',
    name: 'Interactive Spring Pop',
    category: 'Animations',
    description: 'Smooth hover spring lift with tactile active press depression',
    styles: {
      transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
      cursor: 'pointer',
    },
  },
];
