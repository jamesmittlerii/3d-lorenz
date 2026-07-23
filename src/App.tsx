import { Suspense, useState } from 'react';
import { Scene, type AttractorType } from './components/Scene';
import { Activity } from 'lucide-react';

const ATTRACTORS: { id: AttractorType; label: string; color: string }[] = [
  { id: 'lorenz', label: 'Lorenz', color: '#ff00cc' },
  { id: 'chua', label: "Chua's Circuit", color: '#00ffcc' },
  { id: 'rossler', label: 'Rössler', color: '#ffaa00' },
  { id: 'thomas', label: 'Thomas', color: '#9900ff' },
  { id: 'aizawa', label: 'Aizawa', color: '#ff3366' },
  { id: 'halvorsen', label: 'Halvorsen', color: '#0066ff' },
  { id: 'rabinovich', label: 'Rabinovich-Fabrikant', color: '#aaff00' }
];

function App() {
  const [attractor, setAttractor] = useState<AttractorType>('lorenz');
  
  const activeAttractorConfig = ATTRACTORS.find(a => a.id === attractor) || ATTRACTORS[0];

  return (
    <>
      <div className="overlay">
        <header className="header">
          <h1 className="title">Chaotic Attractors</h1>
          <p className="subtitle">Visualizing chaos in 3D space</p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {ATTRACTORS.map((config) => (
              <button 
                key={config.id}
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
                  transition: 'all 0.2s'
                }}
              >
                {config.label}
              </button>
            ))}
          </div>
        </header>
        
        <footer className="footer">
          <Activity size={18} color={activeAttractorConfig.color} />
          <span>Dynamic Rendering: {activeAttractorConfig.label}</span>
        </footer>
      </div>
      
      {/* 3D Canvas */}
      <Suspense fallback={null}>
        <Scene type={attractor} />
      </Suspense>
    </>
  );
}

export default App;
