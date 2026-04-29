import { useState, useEffect, useRef, useMemo } from 'react';
import TypewriterText from './TypewriterText';

interface MultilineTypewriterTextProps {
  lines: string[];
  speed?: number;
  linePrefix?: string;
  showCursorOnLast?: boolean;
  onComplete?: () => void;
}

function MultilineTypewriterText({
  lines,
  speed = 50,
  linePrefix,
  showCursorOnLast = true,
  onComplete,
}: MultilineTypewriterTextProps) {
  const filteredLines = useMemo(() => lines.filter(Boolean), [lines]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const linesKey = JSON.stringify(filteredLines);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset when lines change (e.g. language switch)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on lines change
      setCurrentLineIndex(filteredLines.length - 1);
      onCompleteRef.current?.();
    } else {
      setCurrentLineIndex(0);
    }
  }, [linesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLineComplete = (index: number) => {
    if (index < filteredLines.length - 1) {
      setCurrentLineIndex(index + 1);
    } else {
      onCompleteRef.current?.();
    }
  };

  return (
    <>
      {filteredLines.slice(0, currentLineIndex + 1).map((line, index) => {
        const isLast = index === filteredLines.length - 1;
        const isCurrent = index === currentLineIndex;
        const showCursor = isCurrent && (isLast ? showCursorOnLast : true);

        return (
          <p key={`${linesKey}-${index}`}>
            {linePrefix && <span>{linePrefix}</span>}{' '}
            <TypewriterText
              text={line}
              speed={speed}
              showCursor={showCursor}
              onComplete={() => handleLineComplete(index)}
            />
          </p>
        );
      })}
    </>
  );
}

export default MultilineTypewriterText;
