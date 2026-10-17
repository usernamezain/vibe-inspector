import { useState, useCallback, useEffect } from 'react';
import { StyleDelta } from '@vibe-inspector/shared';

export function useLiveStyles() {
  // selector -> { property: newValue }
  const [modifiedStyles, setModifiedStyles] = useState<Record<string, Record<string, string>>>({});
  // undo / redo stack
  const [history, setHistory] = useState<StyleDelta[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Apply a single CSS property live to an element
  const applyStyle = useCallback((selector: string, property: string, value: string, originalValue = '') => {
    chrome.runtime.sendMessage({
      type: 'APPLY_LIVE_STYLE',
      selector,
      property,
      value,
    });

    const delta: StyleDelta = {
      selector,
      property,
      oldValue: originalValue,
      newValue: value,
      timestamp: Date.now(),
    };

    // Push delta into history, discarding any redo tail
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, delta];
    });
    setHistoryIndex((prev) => prev + 1);

    // Update modifiedStyles map
    setModifiedStyles((prev) => {
      const currentProps = prev[selector] || {};
      return {
        ...prev,
        [selector]: {
          ...currentProps,
          [property]: value,
        },
      };
    });
  }, [historyIndex]);

  // Undo last style change
  const undo = useCallback(() => {
    if (historyIndex < 0 || history.length === 0) return;
    const delta = history[historyIndex];

    chrome.runtime.sendMessage({
      type: 'APPLY_LIVE_STYLE',
      selector: delta.selector,
      property: delta.property,
      value: delta.oldValue,
    });

    setModifiedStyles((prev) => {
      const currentProps = { ...(prev[delta.selector] || {}) };
      if (delta.oldValue) {
        currentProps[delta.property] = delta.oldValue;
      } else {
        delete currentProps[delta.property];
      }
      return {
        ...prev,
        [delta.selector]: currentProps,
      };
    });

    setHistoryIndex((prev) => prev - 1);
  }, [history, historyIndex]);

  // Redo previously undone style change
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const delta = history[nextIndex];

    chrome.runtime.sendMessage({
      type: 'APPLY_LIVE_STYLE',
      selector: delta.selector,
      property: delta.property,
      value: delta.newValue,
    });

    setModifiedStyles((prev) => {
      const currentProps = { ...(prev[delta.selector] || {}) };
      currentProps[delta.property] = delta.newValue;
      return {
        ...prev,
        [delta.selector]: currentProps,
      };
    });

    setHistoryIndex(nextIndex);
  }, [history, historyIndex]);

  // Reset all style changes for a single element
  const resetElement = useCallback((selector: string) => {
    chrome.runtime.sendMessage({
      type: 'RESET_LIVE_STYLES',
      selector,
    });

    setModifiedStyles((prev) => {
      const next = { ...prev };
      delete next[selector];
      return next;
    });

    // Remove matching entries from history
    setHistory((prev) => prev.filter((d) => d.selector !== selector));
    setHistoryIndex(-1);
  }, []);

  // Reset all style changes across the entire page
  const resetAll = useCallback(() => {
    Object.keys(modifiedStyles).forEach((selector) => {
      chrome.runtime.sendMessage({
        type: 'RESET_LIVE_STYLES',
        selector,
      });
    });

    setModifiedStyles({});
    setHistory([]);
    setHistoryIndex(-1);
  }, [modifiedStyles]);

  // Keyboard shortcuts: Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    modifiedStyles,
    applyStyle,
    undo,
    redo,
    canUndo,
    canRedo,
    resetElement,
    resetAll,
  };
}
