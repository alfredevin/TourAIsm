import { useEffect, useState } from 'react';

import { SPRITE } from '../data/characters';

const STEP_MS = 1000 / SPRITE.walkFps;

// Returns the walk step (index into SPRITE.walkFrames) and advances it while active.
export function useWalkFrame(active: boolean): number {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setStep((current) => (current + 1) % SPRITE.walkFrames.length);
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [active]);

  return step;
}
