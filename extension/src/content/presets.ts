export interface VisualPreset {
  id: string;
  name: string;
  category: 'Text Animations' | 'Gradients & Text' | 'Glass & Shadows' | 'Cyber & Glow' | 'Borders & Shape' | 'Animations';
  description: string;
  styles: Record<string, string>;
  keyframes?: string;
}

export const VISUAL_PRESETS: VisualPreset[] = [
  // ==========================================
  // 1. Text Animations (Kinetic & Typographic)
  // ==========================================
  {
    id: 'cyberpunk-glitch-text',
    name: 'Cyberpunk Glitch',
    category: 'Text Animations',
    description: 'High-tech RGB-split horizontal jitter glitch with chromatic aberration',
    styles: {
      display: 'inline-block',
      position: 'relative',
      animation: 'vi-glitch-text 2s infinite ease-in-out',
      willChange: 'transform, text-shadow',
    },
    keyframes: `@keyframes vi-glitch-text {
      0%, 100% { text-shadow: 2px 0 #ef4444, -2px 0 #06b6d4; transform: skew(0deg); }
      20% { text-shadow: -2.5px 0 #ef4444, 2.5px 0 #06b6d4; transform: skew(-1deg); }
      40% { text-shadow: 3px 0 #ef4444, -1.5px 0 #06b6d4; transform: skew(1.5deg); }
      60% { text-shadow: -1.5px 0 #ef4444, 3px 0 #06b6d4; transform: skew(-0.5deg); }
      80% { text-shadow: 2px 0 #ef4444, -2px 0 #06b6d4; transform: skew(0.5deg); }
    }`,
  },
  {
    id: 'neon-sign-strobe',
    name: 'Neon Sign Strobe',
    category: 'Text Animations',
    description: 'Warm glowing neon sign with realistic electrical flicker & ambient aura',
    styles: {
      color: '#ffedd5',
      display: 'inline-block',
      textShadow: '0 0 7px #f97316, 0 0 15px #ea580c, 0 0 25px #ea580c, 0 0 45px #c2410c',
      animation: 'vi-neon-flicker 3s infinite',
    },
    keyframes: `@keyframes vi-neon-flicker {
      0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
        text-shadow: 0 0 7px #f97316, 0 0 15px #ea580c, 0 0 25px #ea580c, 0 0 45px #c2410c;
        opacity: 1;
      }
      20%, 24%, 55% {
        text-shadow: none;
        opacity: 0.45;
      }
    }`,
  },
  {
    id: 'liquid-gold-flow',
    name: 'Liquid Gold Flow',
    category: 'Text Animations',
    description: 'Lustrous 24k polished gold gradient with continuous reflective light pass',
    styles: {
      background: 'linear-gradient(90deg, #b45309 0%, #fbbf24 25%, #fef08a 50%, #f59e0b 75%, #b45309 100%)',
      backgroundSize: '200% auto',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      fontWeight: '800',
      animation: 'vi-gold-sweep 3.5s linear infinite',
    },
    keyframes: `@keyframes vi-gold-sweep {
      0% { background-position: 0% center; }
      100% { background-position: -200% center; }
    }`,
  },
  {
    id: 'holographic-prism-text',
    name: 'Holographic Prism',
    category: 'Text Animations',
    description: 'Shifting pastel rainbow iridescent prism gradient across letterforms',
    styles: {
      background: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 25%, #f472b6 50%, #fb923c 75%, #a78bfa 100%)',
      backgroundSize: '300% 300%',
      webkitBackgroundClip: 'text',
      webkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      display: 'inline-block',
      fontWeight: '800',
      animation: 'vi-holo-prism 4s ease infinite',
    },
    keyframes: `@keyframes vi-holo-prism {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }`,
  },
  {
    id: 'typewriter-cursor-blink',
    name: 'Typewriter Cursor',
    category: 'Text Animations',
    description: 'Monospace terminal styling with pulsing vertical caret cursor',
    styles: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      borderRight: '3px solid #f97316',
      paddingRight: '6px',
      display: 'inline-block',
      animation: 'vi-cursor-blink 0.85s step-end infinite',
    },
    keyframes: `@keyframes vi-cursor-blink {
      from, to { border-color: transparent; }
      50% { border-color: #f97316; }
    }`,
  },
  {
    id: 'blur-focus-reveal',
    name: 'Cinematic Blur Reveal',
    category: 'Text Animations',
    description: 'Dreamy optical defocus to razor-sharp typography cycle',
    styles: {
      display: 'inline-block',
      animation: 'vi-blur-focus 3.2s ease-in-out infinite',
      willChange: 'filter, opacity',
    },
    keyframes: `@keyframes vi-blur-focus {
      0%, 100% { filter: blur(5px); opacity: 0.55; }
      50% { filter: blur(0px); opacity: 1; }
    }`,
  },
  {
    id: 'letter-spacing-breath',
    name: 'Tracking Breath',
    category: 'Text Animations',
    description: 'Kinetic typography expanding and compressing letter tracking',
    styles: {
      display: 'inline-block',
      animation: 'vi-tracking-breath 4s ease-in-out infinite',
      textTransform: 'uppercase',
      fontWeight: '700',
    },
    keyframes: `@keyframes vi-tracking-breath {
      0%, 100% { letter-spacing: -0.5px; }
      50% { letter-spacing: 6px; }
    }`,
  },
  {
    id: 'isometric-3d-text',
    name: '3D Extrusion Pop',
    category: 'Text Animations',
    description: 'Layered retro isometric depth shadows with tactile hover extrusion',
    styles: {
      color: '#ffffff',
      fontWeight: '800',
      display: 'inline-block',
      textShadow: '1px 1px 0 #d97706, 2px 2px 0 #b45309, 3px 3px 0 #92400e, 4px 4px 0 #78350f, 6px 6px 14px rgba(0,0,0,0.5)',
      transform: 'translateY(-2px)',
      transition: 'transform 0.2s ease, text-shadow 0.2s ease',
    },
  },
  {
    id: 'heartbeat-pulse-text',
    name: 'Heartbeat Pulse',
    category: 'Text Animations',
    description: 'Rhythmic tactile double-pump heartbeat scale bounce',
    styles: {
      display: 'inline-block',
      animation: 'vi-heartbeat 2s ease-in-out infinite',
      transformOrigin: 'center center',
    },
    keyframes: `@keyframes vi-heartbeat {
      0%, 100% { transform: scale(1); }
      14% { transform: scale(1.1); }
      28% { transform: scale(1.03); }
      42% { transform: scale(1.08); }
      70% { transform: scale(1); }
    }`,
  },
  {
    id: 'wavy-undulation-float',
    name: 'Wave Undulation',
    category: 'Text Animations',
    description: 'Gentle floating buoyancy on invisible water currents',
    styles: {
      display: 'inline-block',
      animation: 'vi-text-wave 3.5s ease-in-out infinite',
      willChange: 'transform',
    },
    keyframes: `@keyframes vi-text-wave {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-6px) rotate(1deg); }
      66% { transform: translateY(4px) rotate(-1deg); }
    }`,
  },
  {
    id: 'fiery-ember-pulse',
    name: 'Fiery Ember Glow',
    category: 'Text Animations',
    description: 'Deep crimson and blazing orange ambient ember text flame',
    styles: {
      color: '#fff7ed',
      fontWeight: '800',
      display: 'inline-block',
      textShadow: '0 -2px 4px #ffedd5, 0 -4px 10px #f97316, 0 -8px 18px #ea580c, 0 -12px 28px #dc2626',
      animation: 'vi-fire-pulse 2.2s ease-in-out infinite alternate',
    },
    keyframes: `@keyframes vi-fire-pulse {
      from { text-shadow: 0 -2px 4px #ffedd5, 0 -4px 10px #f97316, 0 -8px 18px #ea580c, 0 -12px 28px #dc2626; }
      to { text-shadow: 0 -3px 6px #ffedd5, 0 -6px 14px #ea580c, 0 -12px 24px #dc2626, 0 -16px 36px #991b1b; }
    }`,
  },
  {
    id: 'arcade-crt-green',
    name: 'Phosphor Green CRT',
    category: 'Text Animations',
    description: 'Retro 80s arcade terminal phosphor green glow and scanline pulse',
    styles: {
      color: '#4ade80',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      display: 'inline-block',
      textShadow: '0 0 6px #22c55e, 0 0 14px rgba(34, 197, 94, 0.6)',
      animation: 'vi-crt-phosphor 2s ease-in-out infinite alternate',
    },
    keyframes: `@keyframes vi-crt-phosphor {
      from { opacity: 0.9; text-shadow: 0 0 6px #22c55e, 0 0 14px rgba(34, 197, 94, 0.6); }
      to { opacity: 1; text-shadow: 0 0 10px #22c55e, 0 0 22px rgba(34, 197, 94, 0.9); }
    }`,
  },

  // ==========================================
  // 2. Gradients & Text
  // ==========================================
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

  // ==========================================
  // 3. Glass & Shadows
  // ==========================================
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

  // ==========================================
  // 4. Cyber & Glow
  // ==========================================
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

  // ==========================================
  // 5. Borders & Shape
  // ==========================================
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

  // ==========================================
  // 6. Animations (Component & Card Level)
  // ==========================================
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
