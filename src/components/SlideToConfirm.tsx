import React, { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  onConfirm: () => void;
  variant?: 'green' | 'danger' | 'dark';
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  onConfirm,
  variant = 'green',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const maxTravelRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!trackRef.current) return;
    const trackWidth = trackRef.current.clientWidth;
    maxTravelRef.current = Math.max(0, trackWidth - 56);
    startXRef.current = e.clientX - dragX;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const nextX = Math.max(0, Math.min(maxTravelRef.current, e.clientX - startXRef.current));
    setDragX(nextX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (maxTravelRef.current > 0 && dragX >= maxTravelRef.current * 0.72) {
      setDragX(maxTravelRef.current);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignore vibrate restrictions
        }
      }
      setTimeout(() => {
        onConfirm();
        setDragX(0);
      }, 110);
    } else {
      setDragX(0);
    }
  };

  const bgClass =
    variant === 'danger'
      ? 'bg-rose-600 text-white'
      : variant === 'dark'
      ? 'bg-slate-900 dark:bg-slate-800 text-white'
      : 'bg-[#34D186] text-slate-950';

  const knobClass =
    variant === 'danger'
      ? 'bg-white text-rose-600'
      : variant === 'dark'
      ? 'bg-[#34D186] text-slate-950'
      : 'bg-white text-slate-950';

  const progressRatio =
    maxTravelRef.current > 0 ? Math.min(1, dragX / maxTravelRef.current) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full rounded-2xl overflow-hidden select-none flex items-center justify-center shadow-sm touch-pan-y ${bgClass}`}
    >
      {/* Subtle progress fill */}
      <div
        className="absolute inset-y-0 left-0 bg-black/10 pointer-events-none transition-opacity"
        style={{ width: `${dragX + 52}px`, opacity: isDragging ? 1 : 0 }}
      />

      {/* Centered Instruction Label */}
      <span
        className="text-[15px] font-bold tracking-tight pointer-events-none transition-opacity px-14 text-center truncate"
        style={{ opacity: 1 - progressRatio * 0.85 }}
      >
        {label}
      </span>

      {/* Quick accessible confirm button on far right */}
      <button
        type="button"
        onClick={onConfirm}
        className="absolute right-1.5 min-w-[44px] min-h-[40px] px-2.5 text-xs font-bold opacity-75 hover:opacity-100 active:scale-95 rounded-xl flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        title={`Confirm: ${label}`}
        aria-label={label}
      >
        Tap
      </button>

      {/* Draggable Thumb Handle */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label={`Slide handle: ${label}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`absolute left-1.5 top-1.5 bottom-1.5 w-11 rounded-xl flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing touch-none ${knobClass}`}
      >
        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
