import { useEffect } from 'react';

interface ShortcutHandlers {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onToggleVisibility: () => void;
  onToggleClickThrough: () => void;
  onAskNextStep: () => void;
  onPrevResponse: () => void;
  onNextResponse: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export function useShortcuts({
  onMoveUp,
  onMoveDown,
  onMoveLeft,
  onMoveRight,
  onToggleVisibility,
  onToggleClickThrough,
  onAskNextStep,
  onPrevResponse,
  onNextResponse,
  onScrollUp,
  onScrollDown,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key;

      // 1. Scroll Response Up / Down (Ctrl + Shift + Up / Down)
      if (isCtrl && isShift && key === 'ArrowUp') {
        e.preventDefault();
        onScrollUp();
        return;
      }
      if (isCtrl && isShift && key === 'ArrowDown') {
        e.preventDefault();
        onScrollDown();
        return;
      }

      // 2. Move Window Up / Down / Left / Right (Ctrl + ArrowKeys)
      if (isCtrl && !isShift && key === 'ArrowUp') {
        e.preventDefault();
        onMoveUp();
        return;
      }
      if (isCtrl && !isShift && key === 'ArrowDown') {
        e.preventDefault();
        onMoveDown();
        return;
      }
      if (isCtrl && !isShift && key === 'ArrowLeft') {
        e.preventDefault();
        onMoveLeft();
        return;
      }
      if (isCtrl && !isShift && key === 'ArrowRight') {
        e.preventDefault();
        onMoveRight();
        return;
      }

      // 3. Toggle Visibility (Ctrl + \  OR  Alt + H)
      if (
        (isCtrl && (key === '\\' || key === '\x1c' || e.code === 'Backslash')) ||
        (e.altKey && key.toLowerCase() === 'h')
      ) {
        e.preventDefault();
        onToggleVisibility();
        return;
      }

      // 4. Toggle Click-through (Ctrl + M)
      if (isCtrl && key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleClickThrough();
        return;
      }

      // 5. Ask Next Step (Ctrl + Enter when not typing in input)
      if (isCtrl && key === 'Enter') {
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!isTyping) {
          e.preventDefault();
          onAskNextStep();
        }
        return;
      }

      // 6. Previous Response (Ctrl + [) & Next Response (Ctrl + ])
      if (isCtrl && key === '[') {
        e.preventDefault();
        onPrevResponse();
        return;
      }
      if (isCtrl && key === ']') {
        e.preventDefault();
        onNextResponse();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onMoveUp,
    onMoveDown,
    onMoveLeft,
    onMoveRight,
    onToggleVisibility,
    onToggleClickThrough,
    onAskNextStep,
    onPrevResponse,
    onNextResponse,
    onScrollUp,
    onScrollDown,
  ]);
}
