import { Suspense, useState } from 'react';
import { Scene, type AttractorType, type DisplayMode } from './components/Scene';
import { Activity, Box, Boxes, Spline } from 'lucide-react';

const ATTRACTORS: { id: AttractorType; label: string; color: string }[] = [
  { id: 'lorenz', label: 'Lorenz', color: '#ff00cc' },
  { id: 'chua', label: "Chua's Circuit", color: '#00ffcc' },
  { id: 'rossler', label: 'Rössler', color: '#ffaa00' },
  { id: 'thomas', label: 'Thomas', color: '#9900ff' },
  { id: 'aizawa', label: 'Aizawa', color: '#ff3366' },
  { id: 'halvorsen', label: 'Halvorsen', color: '#0066ff' },
  { id: 'rabinovich', label: 'Rabinovich-Fabrikant', color: '#aaff00' },
];

const DISPLAY_MODES: { id: DisplayMode; label: string; icon: typeof Spline }[] = [
  { id: 'line', label: 'Line Trail', icon: Spline },
  { id: 'led-cube', label: 'LED Faces 32×32', icon: Box },
  { id: 'led-volume', label: 'LED Volume 32³', icon: Boxes },
];

function App() {
  const [attractor, setAttractor] = useState<AttractorType>('lorenz');
  const [mode, setMode] = useState<DisplayMode>('line');

  const activeAttractorConfig = ATTRACTORS.find((a) => a.id === attractor) || ATTRACTORS[0];
  const activeMode = DISPLAY_MODES.find((m) => m.id === mode) || DISPLAY_MODES[0];

  return (
    <>
      <div className="overlay">
        <header className="header">
          <h1 className="title">Chaotic Attractors</h1>
          <p className="subtitle">Visualizing chaos in 3D space</p>

          <div className="mode-row">
            {DISPLAY_MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`mode-btn${active ? ' active' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  <Icon size={16} />
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="attractor-row">
            {ATTRACTORS.map((config) => (
              <button
                key={config.id}
                type="button"
                onClick={() => setAttractor(config.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: attractor === config.id ? `${config.color}33` : 'transparent',
                  border: `1px solid ${attractor === config.id ? config.color : '#444'}`,
                  color: attractor === config.id ? config.color : '#888',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </header>

        <footer className="footer">
          <Activity size={18} color={activeAttractorConfig.color} />
          <span>
            {activeMode.label} · {activeAttractorConfig.label}
          </span>
        </footer>
      </div>

      <Suspense fallback={null}>
        <Scene type={attractor} mode={mode} />
      </Suspense>
    </>
  );
}

export default App;
