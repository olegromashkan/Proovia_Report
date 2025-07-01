import { useEffect, useState } from 'react';
import '../styles/PixelPet.css';
// Updated pixel art to represent a cute cat
const pixelData = [
  '00011000',
  '00111100',
  '01111110',
  '11111111',
  '11011011',
  '11111111',
  '10100101',
  '11000011',
];

const colors = {
  '0': 'transparent',
  '1': '#ffffff', // White for cat body
  '2': '#ff9999', // Pink for ears/nose
  '3': '#000000', // Black for eyes
};

export default function PixelPet() {
  const [hunger, setHunger] = useState(100);
  const [happiness, setHappiness] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [name, setName] = useState('Kitty');

  // Decrease stats over time
  useEffect(() => {
    const id = setInterval(() => {
      setHunger(h => Math.max(0, h - 1));
      setHappiness(h => Math.max(0, h - 0.5));
      setEnergy(e => Math.max(0, e - 0.8));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const feed = () => setHunger(h => Math.min(100, h + 20));
  const pet = () => setHappiness(h => Math.min(100, h + 15));
  const play = () => {
    setEnergy(e => Math.max(0, e - 10));
    setHappiness(h => Math.min(100, h + 10));
  };

  // Determine mood based on stats
  const getMood = () => {
    if (hunger < 30 || happiness < 30 || energy < 30) return 'sad';
    if (energy > 70 && happiness > 70) return 'excited';
    if (energy < 40) return 'sleepy';
    return 'happy';
  };

  const mood = getMood();

  // Allow renaming the pet
  const handleNameChange = (e) => {
    setName(e.target.value || 'Kitty');
  };

  return (
    <div className="pixel-pet">
      <div className={`pixel-pet-grid ${mood}`} style={{ gridTemplateColumns: `repeat(${pixelData[0].length}, 8px)` }}>
        {pixelData.flatMap((row, r) =>
          row.split('').map((col, c) => (
            <div
              key={`${r}-${c}`}
              className={`pixel-pet-pixel ${col === '2' ? 'ear' : col === '3' ? 'eye' : ''}`}
              style={{ backgroundColor: colors[col] }}
            />
          ))
        )}
      </div>
      <div className="pixel-pet-info">
        <input
          className="pixel-pet-name"
          value={name}
          onChange={handleNameChange}
          placeholder="Name your kitty"
          maxLength={12}
        />
        <div className="pixel-pet-stats">
          <div className="pixel-pet-stat">
            Hunger
            <div className="pixel-pet-stat-bar">
              <div className="pixel-pet-stat-fill hunger" style={{ width: `${hunger}%` }} />
            </div>
          </div>
          <div className="pixel-pet-stat">
            Happiness
            <div className="pixel-pet-stat-bar">
              <div className="pixel-pet-stat-fill happiness" style={{ width: `${happiness}%` }} />
            </div>
          </div>
          <div className="pixel-pet-stat">
            Energy
            <div className="pixel-pet-stat-bar">
              <div className="pixel-pet-stat-fill energy" style={{ width: `${energy}%` }} />
            </div>
          </div>
        </div>
        <div>Mood: {mood.charAt(0).toUpperCase() + mood.slice(1)}</div>
        <div className="pixel-pet-buttons">
          <button onClick={feed} className="pixel-pet-button">Feed</button>
          <button onClick={pet} className="pixel-pet-button">Pet</button>
          <button onClick={play} className="pixel-pet-button">Play</button>
        </div>
      </div>
    </div>
  );
}