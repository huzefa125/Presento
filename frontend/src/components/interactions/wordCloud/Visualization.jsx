import { useMemo, useState, useEffect } from 'react';
import { useWordCloud, defaultFill } from '@isoterik/react-word-cloud';

const DEFAULT_WIDTH = 700;
const DEFAULT_HEIGHT = 400;

const WordCloudVisualization = ({
  wordFrequencies = {},
  className = '',
  maxWords = 80,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
}) => {
  const [animatedWords, setAnimatedWords] = useState([]);

  const words = useMemo(() => {
    const entries = Object.entries(wordFrequencies)
      .map(([text, value]) => ({ 
        text: String(text), 
        value: Number(value) || 1 
      }))
      .filter(({ value, text }) => typeof value === 'number' && value > 0 && text.trim())
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords);
    return entries;
  }, [wordFrequencies, maxWords]);

  const fontSizeFunction = useMemo(() => (word) => Math.sqrt(word.value) * 40, []);
  const rotateFunction = useMemo(() => (word) => {
    const angles = [0, 0, 90, -90];
    const hash = word.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return angles[hash % angles.length];
  }, []);

  const { computedWords } = useWordCloud({
    words,
    width,
    height,
    fontFamily: 'Impact',
    fontSize: fontSizeFunction,
    fontWeight: 'normal',
    fontStyle: 'normal',
    rotate: rotateFunction,
    spiral: 'archimedean',
    padding: 5,
    timeInterval: 1,
  });

  // Animate words in one by one
  useEffect(() => {
    if (computedWords.length > 0) {
      setAnimatedWords([]);
      computedWords.forEach((word, index) => {
        setTimeout(() => {
          setAnimatedWords(prev => [...prev, word]);
        }, index * 50); // 50ms delay between each word
      });
    }
  }, [computedWords]);

  if (!words.length) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`} style={{ minHeight: height }}>
        <div className="text-[#6C6C6C] text-sm">No responses yet</div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: height }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {animatedWords.map((word, index) => (
            <text
              key={`${word.text}-${index}`}
              textAnchor="middle"
              x={word.x}
              y={word.y}
              transform={`rotate(${word.rotate}, ${word.x}, ${word.y})`}
              style={{
                fontSize: word.size,
                fontFamily: word.font,
                fontWeight: word.weight,
                fontStyle: word.style,
                fill: typeof defaultFill === 'function' ? defaultFill(word, index) : defaultFill,
                cursor: 'default',
                opacity: 0,
                animation: `fadeIn 0.6s ease-out ${index * 0.05}s forwards`,
              }}
            >
              {word.text}
            </text>
          ))}
        </g>
      </svg>
      <style>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default WordCloudVisualization;
