import React from "react";
import "./MapControls.css";

interface MapControlsProps {
  bearing: number;
  tilted: boolean;
  onToggleTilt: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onResetBearing: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  bearing,
  tilted,
  onToggleTilt,
  onRotateLeft,
  onRotateRight,
  onResetBearing,
}) => {
  return (
    <div className="map-controls-container" aria-label="Map Controls">
      {/* Circular Compass Control with Left/Right sector buttons and center reset */}
      <div className="compass-control" title="Brújula / Rotar mapa">
        {/* Left Sector (Rotate Counter-Clockwise - Cheese slice highlight on hover) */}
        <button
          type="button"
          className="compass-sector-btn left"
          onClick={(e) => {
            e.stopPropagation();
            onRotateLeft();
          }}
          title="Rotar a la izquierda"
          aria-label="Rotate left"
        >
          <svg className="rotate-arrow-icon" viewBox="0 0 16 32">
            <path d="M 12 6 C 5 10 5 22 12 26 L 9.5 28.5 C 2 23 2 9 9.5 3.5 Z" />
            <polygon points="9.5,1 15.5,5 9.5,9" />
          </svg>
        </button>

        {/* Right Sector (Rotate Clockwise - Cheese slice highlight on hover) */}
        <button
          type="button"
          className="compass-sector-btn right"
          onClick={(e) => {
            e.stopPropagation();
            onRotateRight();
          }}
          title="Rotar a la derecha"
          aria-label="Rotate right"
        >
          <svg className="rotate-arrow-icon" viewBox="0 0 16 32">
            <path d="M 4 6 C 11 10 11 22 4 26 L 6.5 28.5 C 14 23 14 9 6.5 3.5 Z" />
            <polygon points="6.5,1 0.5,5 6.5,9" />
          </svg>
        </button>

        {/* Center Needle Dial (Rotates smoothly to point North) */}
        <div
          className="compass-dial"
          style={{ transform: `rotate(${-bearing}deg)` }}
        >
          <svg className="compass-needle" viewBox="0 0 24 48">
            {/* North Red Arrow */}
            <polygon points="12,3 18,24 12,20" fill="#dc2626" />
            <polygon points="12,3 6,24 12,20" fill="#ef4444" />
            {/* South Silver/White Arrow */}
            <polygon points="12,45 18,24 12,20" fill="#94a3b8" />
            <polygon points="12,45 6,24 12,20" fill="#f1f5f9" />
            {/* Center Pivot Jewel */}
            <circle cx="12" cy="20" r="3" fill="#1e293b" stroke="#ffffff" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Center Click Target to Reset Bearing to North (0°) */}
        <button
          type="button"
          className="compass-center-btn"
          onClick={(e) => {
            e.stopPropagation();
            onResetBearing();
          }}
          title="Restablecer orientación al Norte"
          aria-label="Reset North"
        />
      </div>

      {/* 3D / 2D Pill Toggle Button (Always transparent in resting state, pill style) */}
      <button
        type="button"
        className={`tilt-toggle-btn ${tilted ? "in-3d" : "in-2d"}`}
        onClick={onToggleTilt}
        title={tilted ? "Cambiar a vista 2D" : "Cambiar a vista 3D"}
        aria-label={tilted ? "Switch to 2D view" : "Switch to 3D view"}
      >
        {tilted ? "2D" : "3D"}
      </button>
    </div>
  );
};

export default MapControls;
