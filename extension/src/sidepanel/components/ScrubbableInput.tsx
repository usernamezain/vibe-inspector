import React, { useState, useRef, FC } from 'react';
import { parseUnitValue, formatUnitValue, stepValue, isPropertyModified } from '@vibe-inspector/shared';

export interface ScrubbableInputProps {
  label: string;
  value: string;
  computedValue?: string;
  onChange: (value: string) => void;
  onReset?: () => void;
  units?: string[];
  allowUnitless?: boolean;
  min?: number;
  max?: number;
  step?: number;
  mixed?: boolean;
  tooltip?: string;
  className?: string;
}

export const ScrubbableInput: FC<ScrubbableInputProps> = ({
  label,
  value,
  computedValue,
  onChange,
  onReset,
  units = ['px', '%', 'rem', 'em', 'auto'],
  allowUnitless = false,
  min,
  max,
  step = 1,
  mixed = false,
  tooltip,
  className = '',
}) => {
  const parsed = parseUnitValue(value);
  const isModified = isPropertyModified(value, computedValue);

  // Local text state to ensure backspace works cleanly without stubborn '-' injection
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState('');

  // Track dragging state for pointer scrub
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startNum = useRef<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Pointer scrub handlers (After Effects style: drag horizontal or vertical)
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (mixed) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    // Default to 0 if unset or null
    startNum.current = parsed.num ?? 0;
    setIsScrubbing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = -(e.clientY - startY.current);
    // Prioritize horizontal scrub (After Effects standard: right is positive, left is negative)
    const effectiveDelta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
    if (Math.abs(effectiveDelta) < 1) return;

    let next = stepValue(startNum.current, effectiveDelta * step, {
      shift: e.shiftKey,
      alt: e.altKey,
    });

    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);

    const formatted = formatUnitValue(next, parsed.unit || 'px');
    onChange(formatted);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (mixed) return;
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const currentNum = parsed.num ?? 0;
    let next = stepValue(currentNum, dir * step, {
      shift: e.shiftKey,
      alt: e.altKey,
    });
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(formatUnitValue(next, parsed.unit || 'px'));
  };

  // Keyboard stepping on input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const currentNum = parsed.num ?? (localText !== '' && !isNaN(Number(localText)) ? Number(localText) : 0);
      let next = stepValue(currentNum, dir * step, {
        shift: e.shiftKey,
        alt: e.altKey,
      });

      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);

      const formatted = formatUnitValue(next, parsed.unit || 'px');
      setLocalText(String(next));
      onChange(formatted);
    } else if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // If unset or '-', initialize input with empty string so user can freely type
    if (parsed.isUnset || value === '-' || value === '') {
      setLocalText('');
    } else if (parsed.num !== null) {
      setLocalText(String(parsed.num));
    } else {
      setLocalText(parsed.raw || '');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalText(val);

    // If completely cleared or just a minus sign being typed, inform parent of empty without overriding
    if (val === '' || val === '-') {
      onChange('');
      return;
    }

    const newParsed = parseUnitValue(val);
    if (newParsed.num !== null) {
      onChange(formatUnitValue(newParsed.num, newParsed.unit || parsed.unit || 'px'));
    } else {
      onChange(val);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const trimmed = localText.trim();
    if (trimmed === '' || trimmed === '-') {
      setLocalText('');
      onChange('');
      return;
    }
    const newParsed = parseUnitValue(trimmed);
    if (newParsed.num !== null) {
      const formatted = formatUnitValue(newParsed.num, newParsed.unit || parsed.unit || 'px');
      setLocalText(String(newParsed.num));
      onChange(formatted);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    if (newUnit === 'auto') {
      onChange('auto');
    } else if (parsed.num !== null) {
      onChange(formatUnitValue(parsed.num, newUnit));
    } else {
      onChange(newUnit);
    }
  };

  // Determine display value: while focused, user has 100% control over localText
  const displayValue = isFocused
    ? localText
    : mixed
    ? 'Mixed'
    : parsed.isUnset
    ? ''
    : parsed.num !== null
    ? String(parsed.num)
    : parsed.raw !== '-'
    ? parsed.raw
    : '';

  return (
    <div
      className={`vi-scrub-field ${className} ${isScrubbing ? 'is-scrubbing' : ''}`}
      title={tooltip}
      onWheel={handleWheel}
    >
      <div className="vi-field-header">
        <span
          className="vi-scrub-label"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={onReset}
          title={`${tooltip || label} (Drag ◂ ▸ Left/Right to adjust, Double-click to reset)`}
        >
          {/* After Effects style drag handle */}
          <span className="vi-scrub-handle" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '-4px' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
          <span className="vi-label-text">{label}</span>
          {isModified && <span className="vi-modified-dot" title="Modified by user" />}
        </span>
      </div>

      <div className="vi-field-input-box">
        <input
          type="text"
          className={`vi-input-mono ${mixed ? 'is-mixed' : ''} ${parsed.isUnset && !isFocused ? 'is-unset' : ''}`}
          value={displayValue}
          onFocus={handleInputFocus}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder="-"
        />

        {units.length > 0 && (
          <select
            className="vi-unit-select"
            value={parsed.unit}
            onChange={handleUnitChange}
            disabled={mixed || parsed.isUnset}
          >
            {allowUnitless && <option value="">-</option>}
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
