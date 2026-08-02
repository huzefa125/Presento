import { useState, useEffect } from 'react';

/**
 * FloatingReactionsOverlay Component
 * Renders floating, rising animated emojis across the screen when triggered
 * by participants or the presenter during a live session.
 */
export default function FloatingReactionsOverlay({ socket }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = (data) => {
      if (!data || !data.emoji) return;

      const newReaction = {
        id: data.id || `${Date.now()}-${Math.random()}`,
        emoji: data.emoji,
        left: Math.floor(Math.random() * 70) + 15, // 15% to 85% horizontal random position
        size: Math.floor(Math.random() * 16) + 32, // 32px to 48px random size
        duration: Math.random() * 1.5 + 2.5, // 2.5s to 4.0s animation duration
        rotation: Math.floor(Math.random() * 40) - 20 // -20deg to 20deg tilt
      };

      setReactions((prev) => [...prev.slice(-30), newReaction]); // Keep max 30 active floating elements

      // Remove after animation completes
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, newReaction.duration * 1000);
    };

    socket.on('floating-reaction', handleReaction);

    return () => {
      socket.off('floating-reaction', handleReaction);
    };
  }, [socket]);

  if (reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-10 animate-floatUp select-none font-sans drop-shadow-md"
          style={{
            left: `${r.left}%`,
            fontSize: `${r.size}px`,
            animationDuration: `${r.duration}s`,
            transform: `rotate(${r.rotation}deg)`
          }}
        >
          {r.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.6) rotate(0deg);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-40vh) scale(1.2) rotate(10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-85vh) scale(1) rotate(-10deg);
          }
        }
        .animate-floatUp {
          animation: floatUp ease-out forwards;
        }
      `}</style>
    </div>
  );
}
