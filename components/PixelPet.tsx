import { useEffect, useState, useCallback } from 'react';
import useUser from '../lib/useUser';
import '../styles/PixelPet.css';
// Updated pixel art to represent a cute cat
const pixelData = [
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000000000000000000000000",
  "000001100000000110000000",
  "000012110000001121000000",
  "000112110000001121000000",
  "001111111111111111100000",
  "011111111111111111110000",
  "011111111111111111110000",
  "011111111111111111110000",
  "001113111111111311100000",
  "001111111333111111100000",
  "000111111131111111000000",
  "000011111111111100000000",
  "000000111222211100000000",
  "000000001111110000000000",
];




const colors = {
  '0': 'transparent',
  '1': '#ffffff', // White for cat body
  '2': '#ff9999', // Pink for ears/nose
  '3': '#000000', // Black for eyes
};

interface PetState {
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  cleanliness: number;
  age: number;
  alive: boolean;
  lastVisit: number;
}

const defaultState: PetState = {
  name: 'Kitty',
  hunger: 100,
  happiness: 100,
  energy: 100,
  cleanliness: 100,
  age: 0,
  alive: true,
  lastVisit: Date.now(),
};

export default function PixelPet() {
  const username = useUser();
  const storageKey = `pixelPet_${username || 'guest'}`;
  const [pet, setPet] = useState<PetState>(defaultState);
  const [timeAway, setTimeAway] = useState('');
  const [open, setOpen] = useState(false);

  const saveState = useCallback(
    (state: PetState) =>
      localStorage.setItem(storageKey, JSON.stringify({
        ...state,
        lastVisit: Date.now(),
      })),
    [storageKey],
  );

  const formatDiff = useCallback((ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days) return `${days}d ${hours % 24}h`;
    if (hours) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const state = JSON.parse(stored) as PetState;
      const diff = Date.now() - state.lastVisit;
      const hours = diff / 3600000;
      state.hunger = Math.max(0, state.hunger - hours * 2);
      state.energy = Math.max(0, state.energy - hours * 1.5);
      state.happiness = Math.max(0, state.happiness - hours);
      state.cleanliness = Math.max(0, state.cleanliness - hours);
      state.age += hours / 24;
      state.alive =
        state.hunger > 0 &&
        state.energy > 0 &&
        state.cleanliness > 0 &&
        state.happiness > 0;
      setTimeAway(formatDiff(diff));
      setPet(state);
    }
  }, [storageKey, formatDiff]);

  useEffect(() => saveState(pet), [pet, saveState]);

  useEffect(() => {
    const id = setInterval(() => {
      setPet(prev => {
        if (!prev.alive) return prev;
        const next: PetState = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 1),
          happiness: Math.max(0, prev.happiness - 0.5),
          energy: Math.max(0, prev.energy - 0.8),
          cleanliness: Math.max(0, prev.cleanliness - 0.7),
          age: prev.age + 1 / 360,
        };
        if (
          next.hunger <= 0 ||
          next.happiness <= 0 ||
          next.energy <= 0 ||
          next.cleanliness <= 0
        ) {
          next.alive = false;
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const feed = () =>
    setPet(p => ({
      ...p,
      hunger: Math.min(100, p.hunger + 20),
      cleanliness: Math.max(0, p.cleanliness - 5),
    }));
  const petCat = () => setPet(p => ({ ...p, happiness: Math.min(100, p.happiness + 15) }));
  const play = () =>
    setPet(p => ({
      ...p,
      energy: Math.max(0, p.energy - 10),
      happiness: Math.min(100, p.happiness + 10),
    }));
  const wash = () => setPet(p => ({ ...p, cleanliness: Math.min(100, p.cleanliness + 20) }));
  const sleep = () => setPet(p => ({ ...p, energy: Math.min(100, p.energy + 30) }));

  const handleNameChange = (e: any) => setPet(p => ({ ...p, name: e.target.value || 'Kitty' }));

  const getMood = () => {
    if (!pet.alive) return 'dead';
    if (pet.hunger < 20) return 'angry';
    if (pet.cleanliness < 30) return 'dirty';
    if (pet.energy < 20) return 'sleepy';
    if (pet.happiness < 30) return 'sad';
    if (pet.energy > 70 && pet.happiness > 70 && pet.cleanliness > 50) return 'happy';
    return 'excited';
  };

  const mood = getMood();

  return (
    <>
      <div className="pixel-pet-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '✖' : '🐱'}
      </div>
      {open && (
        <div className="pixel-pet" style={{ bottom: '4rem' }}>
      <div
        className={`pixel-pet-grid ${mood}`}
        style={{ gridTemplateColumns: `repeat(${pixelData[0].length}, 8px)` }}
      >
        {pixelData.flatMap((row, r) =>
          row.split('').map((col, c) => (
            <div
              key={`${r}-${c}`}
              className={`pixel-pet-pixel ${col === '2' ? 'ear' : col === '3' ? 'eye' : ''}`}
              style={{ backgroundColor: colors[col] }}
            />
          )),
        )}
      </div>
      <div className="pixel-pet-info">
        <input
          className="pixel-pet-name"
          value={pet.name}
          onChange={handleNameChange}
          placeholder="Name your kitty"
          maxLength={12}
        />
        {pet.alive ? (
          <>
            <div className="pixel-pet-stats">
              <div className="pixel-pet-stat">
                Hunger
                <div className="pixel-pet-stat-bar">
                  <div className="pixel-pet-stat-fill hunger" style={{ width: `${pet.hunger}%` }} />
                </div>
              </div>
              <div className="pixel-pet-stat">
                Happiness
                <div className="pixel-pet-stat-bar">
                  <div className="pixel-pet-stat-fill happiness" style={{ width: `${pet.happiness}%` }} />
                </div>
              </div>
              <div className="pixel-pet-stat">
                Energy
                <div className="pixel-pet-stat-bar">
                  <div className="pixel-pet-stat-fill energy" style={{ width: `${pet.energy}%` }} />
                </div>
              </div>
              <div className="pixel-pet-stat">
                Cleanliness
                <div className="pixel-pet-stat-bar">
                  <div className="pixel-pet-stat-fill clean" style={{ width: `${pet.cleanliness}%` }} />
                </div>
              </div>
            </div>
            <div>Age: {pet.age.toFixed(1)}d</div>
            {timeAway && <div>Last visit: {timeAway} ago</div>}
            <div>Mood: {mood.charAt(0).toUpperCase() + mood.slice(1)}</div>
            <div className="pixel-pet-buttons">
              <button onClick={feed} className="pixel-pet-button">Feed</button>
              <button onClick={petCat} className="pixel-pet-button">Pet</button>
              <button onClick={play} className="pixel-pet-button">Play</button>
              <button onClick={wash} className="pixel-pet-button">Wash</button>
              <button onClick={sleep} className="pixel-pet-button">Sleep</button>
            </div>
          </>
        ) : (
          <div className="pixel-pet-rip">RIP {pet.name}</div>
        )}
      </div>
        </div>
      )}
    </>
  );
}