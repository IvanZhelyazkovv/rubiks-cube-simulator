import { useEffect } from 'react';

const FACE_KEYS = new Set(['U', 'D', 'F', 'B', 'L', 'R']);

/**
 * Global keyboard control: pressing U, D, F, B, L or R applies that face turn;
 * holding Shift turns counter-clockwise. Keystrokes inside form fields and
 * combinations with Ctrl/Alt/Meta are left alone.
 */
export function useKeyboardMoves(onMove: (notation: string) => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // One turn per physical key press: ignore OS autorepeat from held keys,
      // modifier-chord shortcuts and in-progress IME composition.
      if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable]')) {
        return;
      }

      const letter = event.key.toUpperCase();
      if (!FACE_KEYS.has(letter)) {
        return;
      }

      event.preventDefault();
      onMove(event.shiftKey ? `${letter}'` : letter);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMove]);
}
