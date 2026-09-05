import React, { useRef, useState } from 'react';
import { useDashboardContext } from '../../context/DashboardContext';
import { OUTAGE_START, OUTAGE_END, TOTAL_DURATION } from '../../hooks/useGNSSStatus';

export const TimelineSlider: React.FC = () => {
  const { progress, setProgress, simulateOutage } = useDashboardContext();
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; time: string } | null>(null);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isDraggingRef = useRef(false);

  const updateProgressFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const newProg = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    setProgress(newProg);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    updateProgressFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      updateProgressFromClientX(e.clientX);
    }
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(r.width, e.clientX - r.left));
    const progAtMouse = relX / r.width;
    const secAtMouse = Math.floor(progAtMouse * TOTAL_DURATION);
    setHoverPos({
      x: relX,
      time: formatTime(secAtMouse)
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleMouseLeave = () => {
    if (!isDraggingRef.current) {
      setHoverPos(null);
    }
  };

  const handleOutageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProgress(OUTAGE_START + 0.005); // Jump straight into outage zone
  };

  const currentSec = Math.floor(progress * TOTAL_DURATION);
  const timeStr = `${formatTime(currentSec)} / ${formatTime(TOTAL_DURATION)}`;

  const effectiveOS = simulateOutage ? 0 : OUTAGE_START;
  const effectiveOE = simulateOutage ? progress : OUTAGE_END;

  return (
    <div className="tl-container">
      <div 
        className="tl-track" 
        ref={trackRef} 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Fill progress */}
        <div className="tl-fill" style={{ width: `${progress * 100}%` }}></div>

        {/* 60s Outage indicator block with hazard styling */}
        <div 
          className="tl-out" 
          style={{ 
            left: `${effectiveOS * 100}%`, 
            width: `${(effectiveOE - effectiveOS) * 100}%`,
            cursor: 'pointer'
          }}
          onClick={handleOutageClick}
          title="Click to jump directly to GNSS Outage (200s - 260s)"
        >
          <span className="tl-out-label">JAMMING // 60s OUTAGE</span>
        </div>

        {/* Scrub handle */}
        <div className="tl-hnd" style={{ left: `${progress * 100}%` }}>
          <div className="tl-hnd-core"></div>
        </div>

        {/* Hover preview tooltip */}
        {hoverPos && (
          <div className="tl-tooltip" style={{ left: `${hoverPos.x}px` }}>
            {hoverPos.time}
          </div>
        )}
      </div>

      <span className="tl-lbl">{timeStr}</span>
    </div>
  );
};
