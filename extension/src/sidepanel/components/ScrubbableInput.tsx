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
  
  // Track dragging state for pointer scrub
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startNum = useRef<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Pointer scrub handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (mixed || parsed.num === null && parsed.raw !== '-') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startX.current = e.clientX;
    startNum.current = parsed.num ?? 0;
    setIsScrubbing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - startX.current;
    if (Math.abs(deltaX) < 1) return;

    let next = stepValue(startNum.current, deltaX * step, {
      shift: e.shiftKey,
      alt: e.altKey,
    });

    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);

    const formatted = formatUnitValue(next, parsed.unit);
    onChange(formatted);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Keyboard stepping on input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? 1 : -1;
      const currentNum = parsed.num ?? 0;
      let next = stepValue(currentNum, dir * step, {
        shift: e.shiftKey,
        alt: e.altKey,
      });

      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);

      onChange(formatUnitValue(next, parsed.unit));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === '-') {
      onChange('');
      return;
    }
    const newParsed = parseUnitValue(val);
    if (newParsed.num !== null) {
      onChange(formatUnitValue(newParsed.num, newParsed.unit || parsed.unit));
    } else {
      onChange(val);
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

  return (
    <div className={`vi-scrub-field ${className} ${isScrubbing ? 'is-scrubbing' : ''}`} title={tooltip}>
      <div className="vi-field-header">
        <span
          className="vi-scrub-label"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={onReset}
          title={`${tooltip || label} (Drag to scrub, double click to reset)`}
        >
          {label}
          {isModified && <span className="vi-modified-dot" title="Modified by user" />}
        </span>
      </div>

      <div className="vi-field-input-box">
        <input
          type="text"
          className={`vi-input-mono ${mixed ? 'is-mixed' : ''} ${parsed.isUnset ? 'is-unset' : ''}`}
          value={mixed ? 'Mixed' : parsed.isUnset ? '-' : parsed.num ?? parsed.raw}
          onChange={handleInputChange}
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
