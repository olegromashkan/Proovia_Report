import { useEffect, useState } from 'react';
import '../styles/PixelPet.css';

const pixelData = [
  '00100100',
  '01111110',
  '11111111',
  '11011011',
  '11111111',
  '10111101',
  '10100101',
  '01111110',
];

const colors: Record<string, string> = {
  '0': 'transparent',
  '1': '#ffffff',
};

export default function PixelPet() {
  const [hunger, setHunger] = useState(100);

  // Decrease hunger over time
  useEffect(() => {
    const id = setInterval(() => setHunger(h => Math.max(0, h - 1)), 10000);
    return () => clearInterval(id);
  }, []);

  const feed = () => setHunger(h => Math.min(100, h + 20));
  const mood = hunger < 30 ? 'Sad' : 'Happy';

  return (
    <div className="pixel-pet">
      <div
        className="pixel-pet-grid"
        style={{ gridTemplateColumns: `repeat(${pixelData[0].length}, 8px)` }}
      >
        {pixelData.flatMap((row, r) =>
          row.split('').map((col, c) => (
            <div
              key={`${r}-${c}`}
              className="pixel-pet-pixel"
              style={{ backgroundColor: colors[col] }}
            />
          ))
        )}
      </div>
      <div className="pixel-pet-info">
        <div>Mood: {mood}</div>
        <div>Hunger: {hunger}</div>
        <button onClick={feed} className="pixel-pet-button">Feed</button>
      </div>
    </div>
  );
}
