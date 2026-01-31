import { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';

const ColorPaletteGenerator = ({ onSelect }) => {
    const [colors, setColors] = useState([]);

    const generateColors = () => {
        const newColors = Array(5).fill('').map(() =>
            '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
        );
        setColors(newColors);
        onSelect(newColors.join(', '));
    };

    // Generate initial colors on mount
    useEffect(() => {
        generateColors();
    }, []);

    return (
        <div className="color-generator-container mt-2">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400 uppercase tracking-widest">Random Palette</label>
                <button
                    type="button"
                    onClick={generateColors}
                    className="flex items-center gap-1 text-xs text-neon-purple hover:text-white transition-colors"
                >
                    <RefreshCw size={12} /> Regenerate
                </button>
            </div>

            <div className="flex h-12 rounded-lg overflow-hidden border border-white/10 cursor-pointer" onClick={generateColors} title="Click to regenerate">
                {colors.map((color, idx) => (
                    <div
                        key={idx}
                        style={{ backgroundColor: color }}
                        className="flex-1 flex items-center justify-center group relative"
                    >
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-black/50 text-white px-1 rounded backdrop-blur-sm transition-opacity">
                            {color}
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-1 text-xs text-gray-500 truncate">
                {colors.join(', ')}
            </div>
        </div>
    );
};

export default ColorPaletteGenerator;
