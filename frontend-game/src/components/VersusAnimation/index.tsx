import { useEffect, useState } from "react";
import "./styles.css";

interface VersusAnimationProps {
  player1: string;
  player2: string;
  onComplete: () => void;
}

const VersusAnimation = ({
  player1,
  player2,
  onComplete,
}: VersusAnimationProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation duration (3 seconds)
    const timer = setTimeout(() => {
      setIsAnimating(false);
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isAnimating) return null;

  return (
    <div className="versus-animation-container">
      <div className="versus-content">
        <div className="player player1">{player1}</div>
        <div className="vs-text">VS</div>
        <div className="player player2">{player2}</div>
      </div>
    </div>
  );
};

export default VersusAnimation;
