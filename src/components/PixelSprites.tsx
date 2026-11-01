import React from 'react';

interface SpriteProps {
  size?: number;
  className?: string;
}

export type SpriteCombatState = 'idle' | 'hit' | 'defeated';

/**
 * Custom Inline SVG Title Crest Emblem for Dungeon Belajar ML & DL
 */
export const TitleCrestLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 64 40"
    className={`pixelated ${className}`}
    shapeRendering="crispEdges"
    aria-hidden="true"
  >
    {/* Stone Arch Backdrop */}
    <rect x="14" y="6" width="36" height="30" fill="#16112b" />
    <rect x="12" y="8" width="4" height="28" fill="#3a306e" />
    <rect x="48" y="8" width="4" height="28" fill="#3a306e" />
    <rect x="16" y="4" width="32" height="4" fill="#5c4e99" />
    <rect x="10" y="34" width="44" height="4" fill="#2b2352" />

    {/* Crossed Pixel Blades */}
    <rect x="8" y="8" width="4" height="4" fill="#3ac5eb" />
    <rect x="12" y="12" width="4" height="4" fill="#3ac5eb" />
    <rect x="16" y="16" width="4" height="4" fill="#f4f1ea" />
    <rect x="44" y="24" width="4" height="4" fill="#f5b935" />
    <rect x="48" y="28" width="4" height="4" fill="#a87312" />

    <rect x="52" y="8" width="4" height="4" fill="#3ac5eb" />
    <rect x="48" y="12" width="4" height="4" fill="#3ac5eb" />
    <rect x="44" y="16" width="4" height="4" fill="#f4f1ea" />
    <rect x="16" y="24" width="4" height="4" fill="#f5b935" />
    <rect x="12" y="28" width="4" height="4" fill="#a87312" />

    {/* Central Neural Crystal */}
    <rect x="28" y="8" width="8" height="4" fill="#f5b935" />
    <rect x="24" y="12" width="16" height="16" fill="#9b5de5" />
    <rect x="26" y="14" width="12" height="12" fill="#38d864" />
    <rect x="29" y="17" width="6" height="6" fill="#f4f1ea" />
    <rect x="28" y="28" width="8" height="4" fill="#f5b935" />

    {/* Neural Nodes */}
    <rect x="20" y="18" width="3" height="3" fill="#f5b935" />
    <rect x="41" y="18" width="3" height="3" fill="#f5b935" />
    <rect x="30" y="32" width="4" height="3" fill="#38d864" />
  </svg>
);

/**
 * Pixel Heart Sprite for 3-Heart Quiz Vitality Meter (Full vs Lost)
 */
export const PixelHeartSprite: React.FC<{
  filled: boolean;
  size?: number;
  className?: string;
}> = ({ filled, size = 22, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 12 12"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
    aria-hidden="true"
  >
    {/* Dark Outline */}
    <rect x="2" y="2" width="3" height="1" fill="#080612" />
    <rect x="7" y="2" width="3" height="1" fill="#080612" />
    <rect x="1" y="3" width="10" height="4" fill="#080612" />
    <rect x="2" y="7" width="8" height="1" fill="#080612" />
    <rect x="3" y="8" width="6" height="1" fill="#080612" />
    <rect x="4" y="9" width="4" height="1" fill="#080612" />
    <rect x="5" y="10" width="2" height="1" fill="#080612" />

    {/* Heart Fill */}
    <rect x="2" y="3" width="3" height="1" fill={filled ? '#e83b47' : '#2b2352'} />
    <rect x="7" y="3" width="3" height="1" fill={filled ? '#e83b47' : '#2b2352'} />
    <rect x="2" y="4" width="8" height="3" fill={filled ? '#e83b47' : '#1f193d'} />
    <rect x="3" y="7" width="6" height="1" fill={filled ? '#941923' : '#16112b'} />
    <rect x="4" y="8" width="4" height="1" fill={filled ? '#941923' : '#16112b'} />
    <rect x="5" y="9" width="2" height="1" fill={filled ? '#941923' : '#16112b'} />

    {/* Specular Highlight when filled */}
    {filled && (
      <>
        <rect x="3" y="4" width="1" height="1" fill="#f4f1ea" />
        <rect x="2" y="5" width="1" height="1" fill="#f5b935" />
      </>
    )}
  </svg>
);

/**
 * 4 Selectable Pixel Character Avatars (16x16 grid)
 */
export const AvatarSprite: React.FC<{ avatarId: string; size?: number; className?: string }> = ({
  avatarId,
  size = 48,
  className = '',
}) => {
  switch (avatarId) {
    case 'knight':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          <rect x="6" y="1" width="4" height="2" fill="#38d864" />
          <rect x="4" y="3" width="8" height="5" fill="#94a3b8" />
          <rect x="5" y="5" width="6" height="2" fill="#0d0a1a" />
          <rect x="6" y="5" width="2" height="1" fill="#38d864" />
          <rect x="9" y="5" width="2" height="1" fill="#38d864" />
          <rect x="3" y="8" width="10" height="5" fill="#475569" />
          <rect x="5" y="8" width="6" height="4" fill="#38d864" />
          <rect x="7" y="9" width="2" height="2" fill="#f5b935" />
          <rect x="1" y="5" width="2" height="6" fill="#3ac5eb" />
          <rect x="1" y="11" width="2" height="2" fill="#f5b935" />
          <rect x="13" y="8" width="2" height="5" fill="#f5b935" />
          <rect x="4" y="13" width="3" height="2" fill="#1e293b" />
          <rect x="9" y="13" width="3" height="2" fill="#1e293b" />
        </svg>
      );

    case 'ranger':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          <rect x="4" y="2" width="8" height="6" fill="#0284c7" />
          <rect x="5" y="4" width="6" height="4" fill="#f4f1ea" />
          <rect x="5" y="5" width="6" height="2" fill="#3ac5eb" />
          <rect x="3" y="8" width="10" height="5" fill="#0369a1" />
          <rect x="5" y="8" width="6" height="5" fill="#1e293b" />
          <rect x="7" y="9" width="2" height="3" fill="#38d864" />
          <rect x="13" y="4" width="1" height="8" fill="#f5b935" />
          <rect x="14" y="6" width="1" height="4" fill="#3ac5eb" />
          <rect x="5" y="13" width="2" height="2" fill="#78350f" />
          <rect x="9" y="13" width="2" height="2" fill="#78350f" />
        </svg>
      );

    case 'tinker':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          <rect x="4" y="2" width="8" height="3" fill="#f5b935" />
          <rect x="4" y="4" width="8" height="2" fill="#78350f" />
          <rect x="5" y="4" width="2" height="2" fill="#3ac5eb" />
          <rect x="9" y="4" width="2" height="2" fill="#3ac5eb" />
          <rect x="5" y="6" width="6" height="2" fill="#fcd34d" />
          <rect x="3" y="8" width="10" height="5" fill="#b45309" />
          <rect x="6" y="9" width="4" height="3" fill="#38d864" />
          <rect x="1" y="6" width="2" height="2" fill="#94a3b8" />
          <rect x="2" y="8" width="1" height="4" fill="#94a3b8" />
          <rect x="5" y="13" width="2" height="2" fill="#451a03" />
          <rect x="9" y="13" width="2" height="2" fill="#451a03" />
        </svg>
      );

    case 'alchemist':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          <rect x="7" y="1" width="3" height="2" fill="#9b5de5" />
          <rect x="5" y="3" width="6" height="2" fill="#9b5de5" />
          <rect x="3" y="5" width="10" height="1" fill="#f5b935" />
          <rect x="5" y="6" width="6" height="3" fill="#1e1b4b" />
          <rect x="6" y="7" width="1" height="1" fill="#38d864" />
          <rect x="9" y="7" width="1" height="1" fill="#38d864" />
          <rect x="4" y="9" width="8" height="5" fill="#7e22ce" />
          <rect x="7" y="9" width="2" height="5" fill="#f5b935" />
          <rect x="13" y="4" width="2" height="2" fill="#38d864" />
          <rect x="13" y="6" width="1" height="8" fill="#a87312" />
          <rect x="5" y="14" width="2" height="1" fill="#3b0764" />
          <rect x="9" y="14" width="2" height="1" fill="#3b0764" />
        </svg>
      );
  }
};

/**
 * Monster & Boss Sprites per Floor Family with 3 explicit states (idle, hit, defeated).
 * Floor 1 ("Slime Angka" & "Raja Matematika") features bespoke multi-layer 20x20 pixel art
 * for each of the 3 combat states.
 */
export const MonsterSprite: React.FC<{
  type: string;
  size?: number;
  state?: SpriteCombatState;
  isHit?: boolean;
  className?: string;
}> = ({ type, size = 96, state, isHit = false, className = '' }) => {
  const effectiveState: SpriteCombatState = state || (isHit ? 'hit' : 'idle');

  switch (type) {
    case 'slime': {
      // Floor 1 Monster Family: "Slime Angka" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Critical Hit Sparks */}
            <rect x="2" y="3" width="2" height="2" fill="#f5b935" />
            <rect x="16" y="2" width="2" height="2" fill="#e83b47" />
            <rect x="1" y="11" width="2" height="2" fill="#f4f1ea" />
            <rect x="17" y="10" width="2" height="2" fill="#f5b935" />
            {/* Squashed & Recoiling Slime Body (Flashing White/Gold/Green) */}
            <rect x="5" y="7" width="10" height="2" fill="#f4f1ea" />
            <rect x="3" y="9" width="14" height="4" fill="#38d864" />
            <rect x="2" y="13" width="16" height="4" fill="#f5b935" />
            <rect x="4" y="10" width="12" height="5" fill="#f4f1ea" />
            {/* X-Shock Eyes */}
            <rect x="5" y="11" width="1" height="1" fill="#e83b47" />
            <rect x="7" y="11" width="1" height="1" fill="#e83b47" />
            <rect x="6" y="12" width="1" height="1" fill="#0d0a1a" />
            <rect x="5" y="13" width="1" height="1" fill="#e83b47" />
            <rect x="7" y="13" width="1" height="1" fill="#e83b47" />

            <rect x="12" y="11" width="1" height="1" fill="#e83b47" />
            <rect x="14" y="11" width="1" height="1" fill="#e83b47" />
            <rect x="13" y="12" width="1" height="1" fill="#0d0a1a" />
            <rect x="12" y="13" width="1" height="1" fill="#e83b47" />
            <rect x="14" y="13" width="1" height="1" fill="#e83b47" />
            {/* Open Shocked Mouth */}
            <rect x="9" y="13" width="2" height="2" fill="#0d0a1a" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Floating Dissolving Number Pixels */}
            <rect x="5" y="7" width="1" height="2" fill="#3ac5eb" />
            <rect x="10" y="5" width="2" height="1" fill="#38d864" />
            <rect x="14" y="8" width="1" height="2" fill="#f5b935" />
            {/* Melted Slime Puddle */}
            <rect x="4" y="13" width="12" height="2" fill="#1d8a3d" />
            <rect x="2" y="15" width="16" height="3" fill="#1d8a3d" />
            <rect x="3" y="14" width="14" height="3" fill="#38d864" />
            {/* Dizzy Defeated Eyes */}
            <rect x="6" y="15" width="2" height="1" fill="#0d0a1a" />
            <rect x="12" y="15" width="2" height="1" fill="#0d0a1a" />
            <rect x="9" y="16" width="2" height="1" fill="#f4f1ea" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 1 "Slime Angka"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Floating Math Runes (1, 0, +) */}
          <rect x="2" y="4" width="1" height="3" fill="#3ac5eb" />
          <rect x="16" y="3" width="2" height="3" fill="#f5b935" />
          <rect x="17" y="4" width="1" height="1" fill="#0d0a1a" />
          {/* Slime Crown/Tip & Gel Body */}
          <rect x="8" y="4" width="4" height="2" fill="#38d864" />
          <rect x="6" y="6" width="8" height="2" fill="#38d864" />
          <rect x="4" y="8" width="12" height="4" fill="#38d864" />
          <rect x="3" y="12" width="14" height="5" fill="#1d8a3d" />
          <rect x="4" y="11" width="12" height="5" fill="#38d864" />
          {/* Translucent Gel Highlights */}
          <rect x="5" y="8" width="3" height="1" fill="#f4f1ea" />
          <rect x="5" y="9" width="1" height="2" fill="#f4f1ea" />
          {/* Determined Eyes */}
          <rect x="6" y="11" width="2" height="2" fill="#0d0a1a" />
          <rect x="12" y="11" width="2" height="2" fill="#0d0a1a" />
          <rect x="6" y="11" width="1" height="1" fill="#e83b47" />
          <rect x="12" y="11" width="1" height="1" fill="#e83b47" />
          {/* Inner Sigma / Division Core */}
          <rect x="8" y="14" width="4" height="1" fill="#0d0a1a" />
          <rect x="9" y="13" width="2" height="1" fill="#f5b935" />
        </svg>
      );
    }

    case 'boss-slime': {
      // Floor 1 Boss: "Raja Matematika" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Impact Lightning & Flying Crown */}
            <rect x="7" y="1" width="2" height="3" fill="#f5b935" />
            <rect x="11" y="0" width="2" height="3" fill="#f5b935" />
            <rect x="15" y="1" width="2" height="3" fill="#f5b935" />
            <rect x="7" y="3" width="10" height="2" fill="#f4f1ea" />
            {/* Shockwave Rays */}
            <rect x="1" y="8" width="3" height="2" fill="#e83b47" />
            <rect x="20" y="8" width="3" height="2" fill="#e83b47" />
            {/* Flashing Boss Body */}
            <rect x="4" y="9" width="16" height="11" fill="#f4f1ea" />
            <rect x="5" y="10" width="14" height="9" fill="#38d864" />
            {/* X Eyes */}
            <rect x="7" y="12" width="3" height="3" fill="#e83b47" />
            <rect x="14" y="12" width="3" height="3" fill="#e83b47" />
            <rect x="10" y="16" width="4" height="2" fill="#0d0a1a" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Dissolved Raja Matematika Puddle + Tilted Crown */}
            <rect x="2" y="17" width="20" height="4" fill="#1d8a3d" />
            <rect x="4" y="16" width="16" height="4" fill="#38d864" />
            {/* Dropped Crown Bayes */}
            <rect x="8" y="11" width="1" height="3" fill="#f5b935" />
            <rect x="11" y="10" width="2" height="4" fill="#f5b935" />
            <rect x="15" y="11" width="1" height="3" fill="#f5b935" />
            <rect x="8" y="13" width="8" height="2" fill="#f5b935" />
            <rect x="11" y="13" width="2" height="1" fill="#3ac5eb" />
            {/* Dizzy Eyes */}
            <rect x="7" y="18" width="2" height="1" fill="#0d0a1a" />
            <rect x="15" y="18" width="2" height="1" fill="#0d0a1a" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 1 Boss: "Raja Matematika"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Royal Cape & Matrix Aura */}
          <rect x="2" y="9" width="20" height="12" fill="#9b5de5" />
          <rect x="1" y="13" width="22" height="8" fill="#5c4e99" />
          {/* Golden Crown of Bayes */}
          <rect x="6" y="1" width="2" height="4" fill="#f5b935" />
          <rect x="11" y="0" width="2" height="5" fill="#f5b935" />
          <rect x="16" y="1" width="2" height="4" fill="#f5b935" />
          <rect x="6" y="4" width="12" height="3" fill="#f5b935" />
          <rect x="8" y="5" width="2" height="1" fill="#e83b47" />
          <rect x="11" y="4" width="2" height="2" fill="#3ac5eb" />
          <rect x="14" y="5" width="2" height="1" fill="#e83b47" />
          {/* Sovereign Slime Body */}
          <rect x="5" y="7" width="14" height="3" fill="#38d864" />
          <rect x="4" y="10" width="16" height="6" fill="#38d864" />
          <rect x="3" y="16" width="18" height="5" fill="#1d8a3d" />
          <rect x="4" y="15" width="16" height="5" fill="#38d864" />
          {/* Specular Shine */}
          <rect x="6" y="9" width="3" height="1" fill="#f4f1ea" />
          {/* Glowing Boss Eyes */}
          <rect x="7" y="12" width="3" height="3" fill="#0d0a1a" />
          <rect x="14" y="12" width="3" height="3" fill="#0d0a1a" />
          <rect x="7" y="12" width="2" height="2" fill="#e83b47" />
          <rect x="14" y="12" width="2" height="2" fill="#e83b47" />
          {/* Matrix Grid Emblem on Chest */}
          <rect x="9" y="16" width="6" height="3" fill="#0d0a1a" />
          <rect x="10" y="17" width="1" height="1" fill="#f5b935" />
          <rect x="13" y="17" width="1" height="1" fill="#3ac5eb" />
        </svg>
      );
    }

    case 'golem': {
      // Floor 2 Monster Family: "Golem Pohon" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Flying Leaf & Bark Splinters */}
            <rect x="2" y="2" width="2" height="2" fill="#38d864" />
            <rect x="16" y="3" width="2" height="2" fill="#f5b935" />
            <rect x="1" y="10" width="2" height="2" fill="#a87312" />
            <rect x="17" y="11" width="2" height="2" fill="#1d8a3d" />
            {/* Shaken Canopy Crown */}
            <rect x="5" y="2" width="10" height="3" fill="#38d864" />
            <rect x="4" y="4" width="12" height="2" fill="#1d8a3d" />
            {/* Flashing Cracked Trunk Body */}
            <rect x="5" y="6" width="10" height="9" fill="#f4f1ea" />
            <rect x="6" y="7" width="8" height="7" fill="#a87312" />
            {/* Recoiling Branch Arms */}
            <rect x="2" y="6" width="3" height="4" fill="#a87312" />
            <rect x="15" y="6" width="3" height="4" fill="#a87312" />
            {/* X-Shock Amber Eyes */}
            <rect x="7" y="8" width="2" height="2" fill="#e83b47" />
            <rect x="11" y="8" width="2" height="2" fill="#e83b47" />
            {/* Jagged Split Crack Across Trunk */}
            <rect x="9" y="10" width="2" height="4" fill="#0d0a1a" />
            <rect x="8" y="11" width="4" height="1" fill="#f5b935" />
            {/* Root Feet */}
            <rect x="5" y="15" width="4" height="3" fill="#a87312" />
            <rect x="11" y="15" width="4" height="3" fill="#a87312" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Falling Withered Leaves */}
            <rect x="4" y="8" width="2" height="1" fill="#f5b935" />
            <rect x="14" y="7" width="2" height="1" fill="#1d8a3d" />
            <rect x="9" y="9" width="2" height="1" fill="#a87312" />
            {/* Hollow Tree Stump & Fallen Logs */}
            <rect x="3" y="14" width="14" height="4" fill="#a87312" />
            <rect x="5" y="12" width="10" height="3" fill="#a87312" />
            <rect x="6" y="12" width="8" height="1" fill="#0d0a1a" />
            {/* Mossy Patch & Sprout on Stump */}
            <rect x="4" y="13" width="3" height="2" fill="#1d8a3d" />
            <rect x="13" y="14" width="3" height="2" fill="#1d8a3d" />
            <rect x="10" y="10" width="1" height="2" fill="#38d864" />
            <rect x="11" y="10" width="1" height="1" fill="#38d864" />
            {/* Dimmed Eyes */}
            <rect x="7" y="15" width="2" height="1" fill="#0d0a1a" />
            <rect x="11" y="15" width="2" height="1" fill="#0d0a1a" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 2 "Golem Pohon"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Lush Decision-Tree Leaf Canopy */}
          <rect x="6" y="1" width="8" height="2" fill="#38d864" />
          <rect x="4" y="3" width="12" height="3" fill="#1d8a3d" />
          <rect x="5" y="3" width="4" height="2" fill="#38d864" />
          <rect x="12" y="4" width="2" height="1" fill="#f5b935" />
          {/* Sturdy Bark Torso */}
          <rect x="5" y="6" width="10" height="9" fill="#a87312" />
          <rect x="6" y="6" width="1" height="9" fill="#0d0a1a" />
          <rect x="13" y="6" width="1" height="9" fill="#0d0a1a" />
          {/* Branch Shoulders & Wooden Fists */}
          <rect x="2" y="7" width="3" height="5" fill="#a87312" />
          <rect x="1" y="6" width="2" height="2" fill="#1d8a3d" />
          <rect x="15" y="7" width="3" height="5" fill="#a87312" />
          <rect x="17" y="6" width="2" height="2" fill="#38d864" />
          {/* Glowing Amber Eyes */}
          <rect x="7" y="8" width="2" height="2" fill="#0d0a1a" />
          <rect x="11" y="8" width="2" height="2" fill="#0d0a1a" />
          <rect x="7" y="8" width="1" height="1" fill="#f5b935" />
          <rect x="11" y="8" width="1" height="1" fill="#f5b935" />
          {/* Binary Split Node Rune on Chest */}
          <rect x="9" y="11" width="2" height="1" fill="#38d864" />
          <rect x="8" y="12" width="1" height="2" fill="#38d864" />
          <rect x="11" y="12" width="1" height="2" fill="#38d864" />
          {/* Deep Root Legs */}
          <rect x="5" y="15" width="4" height="3" fill="#a87312" />
          <rect x="11" y="15" width="4" height="3" fill="#a87312" />
          <rect x="4" y="17" width="2" height="1" fill="#1d8a3d" />
          <rect x="14" y="17" width="2" height="1" fill="#1d8a3d" />
        </svg>
      );
    }

    case 'boss-golem': {
      // Floor 2 Boss: "Golem Pohon Purba" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Shattering Branch & Golden Leaf Sparks */}
            <rect x="2" y="2" width="2" height="2" fill="#f5b935" />
            <rect x="20" y="2" width="2" height="2" fill="#38d864" />
            <rect x="1" y="12" width="2" height="2" fill="#e83b47" />
            <rect x="21" y="12" width="2" height="2" fill="#f5b935" />
            {/* Recoiling Ancient Canopy */}
            <rect x="5" y="1" width="14" height="4" fill="#38d864" />
            <rect x="3" y="4" width="18" height="3" fill="#1d8a3d" />
            {/* Flashing Trunk Core */}
            <rect x="5" y="7" width="14" height="12" fill="#f4f1ea" />
            <rect x="6" y="8" width="12" height="10" fill="#a87312" />
            {/* Cracked Bark & Crimson Eyes */}
            <rect x="8" y="10" width="3" height="3" fill="#e83b47" />
            <rect x="13" y="10" width="3" height="3" fill="#e83b47" />
            <rect x="11" y="13" width="2" height="5" fill="#0d0a1a" />
            <rect x="9" y="15" width="6" height="1" fill="#f5b935" />
            {/* Root Base */}
            <rect x="4" y="19" width="6" height="4" fill="#a87312" />
            <rect x="14" y="19" width="6" height="4" fill="#a87312" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Drifting Pixel Leaves & Golden Leaf Relic */}
            <rect x="4" y="6" width="2" height="1" fill="#1d8a3d" />
            <rect x="17" y="5" width="2" height="1" fill="#38d864" />
            <rect x="7" y="9" width="2" height="1" fill="#a87312" />
            <rect x="15" y="9" width="2" height="1" fill="#f5b935" />
            {/* Glowing Daun Emas resting atop the Ancient Stump */}
            <rect x="11" y="9" width="3" height="3" fill="#f5b935" />
            <rect x="10" y="10" width="1" height="2" fill="#f5b935" />
            <rect x="12" y="10" width="1" height="1" fill="#f4f1ea" />
            {/* Sundered Ancient Stump */}
            <rect x="5" y="14" width="14" height="5" fill="#a87312" />
            <rect x="3" y="18" width="18" height="4" fill="#a87312" />
            <rect x="4" y="17" width="4" height="3" fill="#1d8a3d" />
            <rect x="16" y="17" width="4" height="3" fill="#1d8a3d" />
            {/* Peaceful Closed Eyes */}
            <rect x="8" y="16" width="3" height="1" fill="#0d0a1a" />
            <rect x="13" y="16" width="3" height="1" fill="#0d0a1a" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 2 Boss: "Golem Pohon Purba"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Ancient Decision-Tree Canopy & Golden Leaf Crown */}
          <rect x="6" y="0" width="12" height="3" fill="#1d8a3d" />
          <rect x="3" y="2" width="18" height="4" fill="#1d8a3d" />
          <rect x="5" y="2" width="5" height="2" fill="#38d864" />
          <rect x="14" y="2" width="5" height="2" fill="#38d864" />
          {/* Golden Leaf ("Daun Emas") Emblem on Brow */}
          <rect x="11" y="1" width="2" height="3" fill="#f5b935" />
          <rect x="10" y="2" width="4" height="1" fill="#f5b935" />
          {/* Colossal Bark Armor & Branching Arms */}
          <rect x="5" y="6" width="14" height="12" fill="#a87312" />
          <rect x="1" y="7" width="4" height="8" fill="#a87312" />
          <rect x="0" y="5" width="3" height="3" fill="#1d8a3d" />
          <rect x="19" y="7" width="4" height="8" fill="#a87312" />
          <rect x="21" y="5" width="3" height="3" fill="#38d864" />
          {/* Glowing Ancient Eyes */}
          <rect x="7" y="9" width="3" height="3" fill="#0d0a1a" />
          <rect x="14" y="9" width="3" height="3" fill="#0d0a1a" />
          <rect x="8" y="9" width="2" height="2" fill="#f5b935" />
          <rect x="14" y="9" width="2" height="2" fill="#f5b935" />
          {/* Glowing Decision Tree Split Network on Chest */}
          <rect x="11" y="12" width="2" height="2" fill="#38d864" />
          <rect x="9" y="14" width="2" height="1" fill="#38d864" />
          <rect x="13" y="14" width="2" height="1" fill="#38d864" />
          <rect x="8" y="15" width="2" height="2" fill="#f5b935" />
          <rect x="14" y="15" width="2" height="2" fill="#3ac5eb" />
          {/* Tangled Root Pillars */}
          <rect x="4" y="18" width="6" height="5" fill="#a87312" />
          <rect x="14" y="18" width="6" height="5" fill="#a87312" />
          <rect x="2" y="21" width="3" height="2" fill="#1d8a3d" />
          <rect x="19" y="21" width="3" height="2" fill="#1d8a3d" />
        </svg>
      );
    }

    case 'hydra': {
      // Floor 3 Monster Family: "Hydra Neural" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Neural Spark Discharge */}
            <rect x="1" y="2" width="2" height="2" fill="#f5b935" />
            <rect x="17" y="2" width="2" height="2" fill="#3ac5eb" />
            <rect x="1" y="12" width="2" height="2" fill="#e83b47" />
            <rect x="17" y="12" width="2" height="2" fill="#f5b935" />
            {/* Three Recoiling Neural Heads */}
            <rect x="1" y="5" width="4" height="3" fill="#f4f1ea" />
            <rect x="2" y="6" width="1" height="1" fill="#e83b47" />
            <rect x="8" y="2" width="4" height="4" fill="#f4f1ea" />
            <rect x="9" y="3" width="2" height="1" fill="#e83b47" />
            <rect x="15" y="5" width="4" height="3" fill="#f4f1ea" />
            <rect x="17" y="6" width="1" height="1" fill="#e83b47" />
            {/* Flashing Synapse Necks */}
            <rect x="3" y="8" width="2" height="4" fill="#9b5de5" />
            <rect x="9" y="6" width="2" height="6" fill="#9b5de5" />
            <rect x="15" y="8" width="2" height="4" fill="#9b5de5" />
            {/* Overloaded Neural Core Body */}
            <rect x="4" y="12" width="12" height="6" fill="#f4f1ea" />
            <rect x="5" y="13" width="10" height="4" fill="#7e22ce" />
            <rect x="8" y="14" width="4" height="2" fill="#e83b47" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Fading Pixel Sparks & Disconnected Synapses */}
            <rect x="3" y="6" width="1" height="1" fill="#9b5de5" />
            <rect x="10" y="4" width="1" height="1" fill="#3ac5eb" />
            <rect x="16" y="7" width="1" height="1" fill="#f5b935" />
            <rect x="6" y="9" width="1" height="1" fill="#b3aad1" />
            <rect x="13" y="9" width="1" height="1" fill="#b3aad1" />
            {/* Collapsed Coiled Hydra Necks & Dimmed Core */}
            <rect x="2" y="14" width="4" height="3" fill="#5c4e99" />
            <rect x="14" y="14" width="4" height="3" fill="#5c4e99" />
            <rect x="5" y="13" width="10" height="5" fill="#3a306e" />
            <rect x="7" y="12" width="6" height="3" fill="#5c4e99" />
            {/* Closed Eyes & Dormant Core */}
            <rect x="8" y="13" width="1" height="1" fill="#0d0a1a" />
            <rect x="11" y="13" width="1" height="1" fill="#0d0a1a" />
            <rect x="8" y="15" width="4" height="2" fill="#16112b" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 3 "Hydra Neural"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Synaptic Connection Lines */}
          <rect x="5" y="5" width="3" height="1" fill="#3ac5eb" />
          <rect x="12" y="5" width="3" height="1" fill="#3ac5eb" />
          {/* Left Head (Input Layer Node) */}
          <rect x="1" y="4" width="4" height="4" fill="#9b5de5" />
          <rect x="2" y="5" width="1" height="1" fill="#38d864" />
          <rect x="4" y="5" width="1" height="1" fill="#f5b935" />
          <rect x="2" y="8" width="2" height="5" fill="#7e22ce" />
          {/* Center Head (Hidden Layer Apex) */}
          <rect x="7" y="1" width="6" height="4" fill="#9b5de5" />
          <rect x="8" y="2" width="1" height="1" fill="#f5b935" />
          <rect x="11" y="2" width="1" height="1" fill="#f5b935" />
          <rect x="9" y="5" width="2" height="7" fill="#7e22ce" />
          {/* Right Head (Output Layer Node) */}
          <rect x="15" y="4" width="4" height="4" fill="#9b5de5" />
          <rect x="15" y="5" width="1" height="1" fill="#f5b935" />
          <rect x="17" y="5" width="1" height="1" fill="#38d864" />
          <rect x="16" y="8" width="2" height="5" fill="#7e22ce" />
          {/* Deep Neural Body & Glowing Tensor Core */}
          <rect x="4" y="12" width="12" height="6" fill="#5c4e99" />
          <rect x="5" y="11" width="10" height="6" fill="#7e22ce" />
          <rect x="7" y="13" width="6" height="3" fill="#3ac5eb" />
          <rect x="9" y="14" width="2" height="1" fill="#f4f1ea" />
        </svg>
      );
    }

    case 'boss-hydra': {
      // Floor 3 Boss: "Hydra Berkepala Banyak" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Gradient Shockwave & Attention Arcs */}
            <rect x="1" y="1" width="2" height="2" fill="#f5b935" />
            <rect x="21" y="1" width="2" height="2" fill="#f5b935" />
            <rect x="0" y="12" width="2" height="2" fill="#e83b47" />
            <rect x="22" y="12" width="2" height="2" fill="#3ac5eb" />
            {/* 5 Recoiling Hydra Heads Flashing White & Crimson */}
            <rect x="1" y="6" width="3" height="3" fill="#f4f1ea" />
            <rect x="5" y="3" width="3" height="3" fill="#e83b47" />
            <rect x="10" y="1" width="4" height="4" fill="#f4f1ea" />
            <rect x="16" y="3" width="3" height="3" fill="#e83b47" />
            <rect x="20" y="6" width="3" height="3" fill="#f4f1ea" />
            {/* Necks */}
            <rect x="2" y="9" width="2" height="5" fill="#9b5de5" />
            <rect x="6" y="6" width="2" height="7" fill="#9b5de5" />
            <rect x="11" y="5" width="2" height="8" fill="#f4f1ea" />
            <rect x="16" y="6" width="2" height="7" fill="#9b5de5" />
            <rect x="20" y="9" width="2" height="5" fill="#9b5de5" />
            {/* Flashing Core Body */}
            <rect x="4" y="13" width="16" height="9" fill="#f4f1ea" />
            <rect x="5" y="14" width="14" height="7" fill="#7e22ce" />
            <rect x="9" y="16" width="6" height="3" fill="#e83b47" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Dissolving Neural Pixel Sparks */}
            <rect x="2" y="5" width="2" height="2" fill="#9b5de5" />
            <rect x="6" y="3" width="2" height="2" fill="#3ac5eb" />
            <rect x="11" y="2" width="2" height="2" fill="#f5b935" />
            <rect x="16" y="3" width="2" height="2" fill="#38d864" />
            <rect x="20" y="5" width="2" height="2" fill="#e83b47" />
            <rect x="4" y="9" width="1" height="1" fill="#f4f1ea" />
            <rect x="19" y="9" width="1" height="1" fill="#f4f1ea" />
            {/* Glowing "Inti Neuron" Relic hovering above the vanquished pedestal */}
            <rect x="10" y="9" width="4" height="4" fill="#9b5de5" />
            <rect x="11" y="10" width="2" height="2" fill="#3ac5eb" />
            <rect x="11" y="10" width="1" height="1" fill="#f4f1ea" />
            {/* Sundered Hydra Carapace */}
            <rect x="3" y="16" width="18" height="6" fill="#3a306e" />
            <rect x="5" y="15" width="14" height="5" fill="#5c4e99" />
            <rect x="8" y="17" width="8" height="2" fill="#16112b" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 3 Boss: "Hydra Berkepala Banyak"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Multi-Layer Attention Connections Between Heads */}
          <rect x="4" y="6" width="16" height="1" fill="#3ac5eb" opacity="0.65" />
          <rect x="7" y="4" width="10" height="1" fill="#f5b935" opacity="0.75" />
          {/* Head 1 (Far Left - Neuron Layer) */}
          <rect x="1" y="6" width="4" height="3" fill="#9b5de5" />
          <rect x="2" y="7" width="1" height="1" fill="#38d864" />
          <rect x="2" y="9" width="2" height="6" fill="#5c4e99" />
          {/* Head 2 (Mid Left - Conv Kernel) */}
          <rect x="5" y="3" width="4" height="3" fill="#9b5de5" />
          <rect x="6" y="4" width="1" height="1" fill="#3ac5eb" />
          <rect x="6" y="6" width="2" height="8" fill="#7e22ce" />
          {/* Head 3 (Center Sovereign - Self-Attention Crown) */}
          <rect x="10" y="0" width="4" height="1" fill="#f5b935" />
          <rect x="9" y="1" width="6" height="4" fill="#e83b47" />
          <rect x="10" y="2" width="1" height="2" fill="#f5b935" />
          <rect x="13" y="2" width="1" height="2" fill="#f5b935" />
          <rect x="11" y="5" width="2" height="9" fill="#9b5de5" />
          {/* Head 4 (Mid Right - Sequence Memory) */}
          <rect x="15" y="3" width="4" height="3" fill="#9b5de5" />
          <rect x="17" y="4" width="1" height="1" fill="#f5b935" />
          <rect x="16" y="6" width="2" height="8" fill="#7e22ce" />
          {/* Head 5 (Far Right - Optimizer) */}
          <rect x="19" y="6" width="4" height="3" fill="#9b5de5" />
          <rect x="21" y="7" width="1" height="1" fill="#38d864" />
          <rect x="20" y="9" width="2" height="6" fill="#5c4e99" />
          {/* Colossal Deep Neural Torso & Inti Neuron Core */}
          <rect x="3" y="14" width="18" height="8" fill="#3a306e" />
          <rect x="4" y="13" width="16" height="8" fill="#7e22ce" />
          <rect x="7" y="15" width="10" height="5" fill="#16112b" />
          <rect x="8" y="16" width="8" height="3" fill="#3ac5eb" />
          <rect x="10" y="16" width="4" height="3" fill="#9b5de5" />
          <rect x="11" y="17" width="2" height="1" fill="#f4f1ea" />
        </svg>
      );
    }

    case 'mechabot':
    case 'mecha-bot': {
      // Floor 4 Monster Family: "Mecha-Bot IoT" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Electric Short-Circuit Sparks */}
            <rect x="1" y="2" width="2" height="2" fill="#3ac5eb" />
            <rect x="17" y="1" width="2" height="2" fill="#f5b935" />
            <rect x="1" y="12" width="2" height="2" fill="#e83b47" />
            <rect x="17" y="13" width="2" height="2" fill="#3ac5eb" />
            {/* Bent Antenna & Flashing Beacon */}
            <rect x="9" y="1" width="2" height="2" fill="#f4f1ea" />
            <rect x="10" y="3" width="1" height="2" fill="#94a3b8" />
            {/* Recoiling Steel Head & Error Visor */}
            <rect x="4" y="5" width="12" height="5" fill="#f4f1ea" />
            <rect x="5" y="6" width="10" height="3" fill="#0d0a1a" />
            <rect x="6" y="7" width="3" height="1" fill="#e83b47" />
            <rect x="11" y="7" width="3" height="1" fill="#e83b47" />
            {/* Overloaded Chassis & Flashing Cyan PCB */}
            <rect x="3" y="10" width="14" height="6" fill="#94a3b8" />
            <rect x="5" y="11" width="10" height="4" fill="#0891b2" />
            <rect x="7" y="12" width="6" height="2" fill="#f5b935" />
            {/* Jittering Servo Arms & Treads */}
            <rect x="1" y="9" width="2" height="4" fill="#f4f1ea" />
            <rect x="17" y="9" width="2" height="4" fill="#f4f1ea" />
            <rect x="4" y="16" width="4" height="3" fill="#334155" />
            <rect x="12" y="16" width="4" height="3" fill="#334155" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Rising Smoke & Fading Spark Pixels */}
            <rect x="6" y="6" width="2" height="1" fill="#64748b" />
            <rect x="11" y="5" width="2" height="1" fill="#475569" />
            <rect x="14" y="8" width="1" height="1" fill="#3ac5eb" />
            {/* Tilted Powered-Down Head & Broken Antenna */}
            <rect x="12" y="9" width="2" height="1" fill="#64748b" />
            <rect x="4" y="10" width="11" height="4" fill="#334155" />
            <rect x="5" y="11" width="9" height="2" fill="#0f172a" />
            <rect x="6" y="11" width="2" height="1" fill="#475569" />
            <rect x="11" y="11" width="2" height="1" fill="#475569" />
            {/* Collapsed Chassis & Darkened PCB */}
            <rect x="3" y="14" width="14" height="4" fill="#1e293b" />
            <rect x="6" y="15" width="8" height="2" fill="#0f172a" />
            <rect x="8" y="15" width="2" height="1" fill="#0891b2" opacity="0.45" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 4 "Mecha-Bot IoT"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Telemetry Antenna & Cyan Signal Pulse */}
          <rect x="9" y="0" width="2" height="2" fill="#3ac5eb" />
          <rect x="6" y="1" width="1" height="1" fill="#3ac5eb" />
          <rect x="13" y="1" width="1" height="1" fill="#3ac5eb" />
          <rect x="9" y="2" width="2" height="2" fill="#94a3b8" />
          {/* Armored Sensor Head & Cyan LED Visor */}
          <rect x="4" y="4" width="12" height="5" fill="#475569" />
          <rect x="5" y="5" width="10" height="3" fill="#0d0a1a" />
          <rect x="6" y="6" width="3" height="1" fill="#3ac5eb" />
          <rect x="11" y="6" width="3" height="1" fill="#3ac5eb" />
          <rect x="7" y="6" width="1" height="1" fill="#f4f1ea" />
          <rect x="12" y="6" width="1" height="1" fill="#f4f1ea" />
          {/* Embedded Microcontroller Torso & Circuit Traces */}
          <rect x="3" y="9" width="14" height="7" fill="#334155" />
          <rect x="5" y="10" width="10" height="5" fill="#0f172a" />
          <rect x="6" y="11" width="3" height="3" fill="#0891b2" />
          <rect x="7" y="12" width="1" height="1" fill="#38d864" />
          <rect x="10" y="11" width="4" height="1" fill="#3ac5eb" />
          <rect x="11" y="13" width="3" height="1" fill="#f5b935" />
          {/* Servo Claws & Tracked Wheels */}
          <rect x="1" y="10" width="2" height="4" fill="#64748b" />
          <rect x="17" y="10" width="2" height="4" fill="#64748b" />
          <rect x="4" y="16" width="4" height="3" fill="#1e293b" />
          <rect x="12" y="16" width="4" height="3" fill="#1e293b" />
          <rect x="5" y="17" width="2" height="1" fill="#3ac5eb" />
          <rect x="13" y="17" width="2" height="1" fill="#3ac5eb" />
        </svg>
      );
    }

    case 'boss-mechabot':
    case 'boss-mecha': {
      // Floor 4 Boss: "Mecha-Core" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* High-Voltage Arcs & Flying Sparks */}
            <rect x="1" y="1" width="3" height="2" fill="#f5b935" />
            <rect x="20" y="1" width="3" height="2" fill="#3ac5eb" />
            <rect x="0" y="11" width="2" height="3" fill="#e83b47" />
            <rect x="22" y="11" width="2" height="3" fill="#f5b935" />
            {/* Flashing Outer Mecha Frame */}
            <rect x="4" y="2" width="16" height="20" fill="#f4f1ea" />
            <rect x="5" y="3" width="14" height="18" fill="#1e293b" />
            {/* Overloaded Circuit Traces */}
            <rect x="6" y="4" width="12" height="2" fill="#e83b47" />
            <rect x="6" y="18" width="12" height="2" fill="#f5b935" />
            {/* Cracked Central Silicon Core Flashing Crimson/White */}
            <rect x="7" y="7" width="10" height="10" fill="#e83b47" />
            <rect x="9" y="9" width="6" height="6" fill="#f4f1ea" />
            <rect x="11" y="8" width="2" height="8" fill="#0d0a1a" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Dying Residual Sparks */}
            <rect x="4" y="4" width="1" height="1" fill="#f5b935" />
            <rect x="19" y="5" width="1" height="1" fill="#3ac5eb" />
            <rect x="6" y="3" width="2" height="1" fill="#64748b" />
            {/* Powered-Down Dimmed Mecha-Core Shell */}
            <rect x="3" y="8" width="18" height="13" fill="#0f172a" />
            <rect x="5" y="9" width="14" height="11" fill="#1e293b" />
            {/* Darkened Circuit Traces (Power Off) */}
            <rect x="6" y="11" width="3" height="1" fill="#334155" />
            <rect x="15" y="11" width="3" height="1" fill="#334155" />
            <rect x="6" y="17" width="12" height="1" fill="#334155" />
            {/* Glowing "Chip Edge" Relic Emerging from Center */}
            <rect x="9" y="11" width="6" height="6" fill="#0891b2" />
            <rect x="10" y="12" width="4" height="4" fill="#3ac5eb" />
            <rect x="11" y="13" width="2" height="2" fill="#f4f1ea" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 4 Boss: "Mecha-Core"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Top & Side Gold/Silver IC Pins */}
          <rect x="7" y="0" width="2" height="2" fill="#f5b935" />
          <rect x="11" y="0" width="2" height="2" fill="#f5b935" />
          <rect x="15" y="0" width="2" height="2" fill="#f5b935" />
          <rect x="7" y="22" width="2" height="2" fill="#f5b935" />
          <rect x="11" y="22" width="2" height="2" fill="#f5b935" />
          <rect x="15" y="22" width="2" height="2" fill="#f5b935" />
          <rect x="0" y="7" width="2" height="2" fill="#94a3b8" />
          <rect x="0" y="11" width="2" height="2" fill="#3ac5eb" />
          <rect x="0" y="15" width="2" height="2" fill="#94a3b8" />
          <rect x="22" y="7" width="2" height="2" fill="#94a3b8" />
          <rect x="22" y="11" width="2" height="2" fill="#3ac5eb" />
          <rect x="22" y="15" width="2" height="2" fill="#94a3b8" />
          {/* Heavy Industrial Silicon & Steel Housing */}
          <rect x="2" y="2" width="20" height="20" fill="#1e293b" />
          <rect x="3" y="3" width="18" height="18" fill="#0f172a" />
          {/* Illuminated Cyan Circuit-Board Traces */}
          <rect x="4" y="4" width="5" height="1" fill="#3ac5eb" />
          <rect x="4" y="4" width="1" height="5" fill="#3ac5eb" />
          <rect x="15" y="4" width="5" height="1" fill="#3ac5eb" />
          <rect x="19" y="4" width="1" height="5" fill="#3ac5eb" />
          <rect x="4" y="19" width="5" height="1" fill="#3ac5eb" />
          <rect x="4" y="15" width="1" height="5" fill="#3ac5eb" />
          <rect x="15" y="19" width="5" height="1" fill="#3ac5eb" />
          <rect x="19" y="15" width="1" height="5" fill="#3ac5eb" />
          {/* Twin Sensor Eyes */}
          <rect x="7" y="6" width="3" height="2" fill="#e83b47" />
          <rect x="14" y="6" width="3" height="2" fill="#e83b47" />
          <rect x="8" y="6" width="1" height="1" fill="#f4f1ea" />
          <rect x="15" y="6" width="1" height="1" fill="#f4f1ea" />
          {/* Central Quantized Edge Reactor Core */}
          <rect x="7" y="9" width="10" height="9" fill="#0891b2" />
          <rect x="8" y="10" width="8" height="7" fill="#3ac5eb" />
          <rect x="10" y="12" width="4" height="3" fill="#38d864" />
          <rect x="11" y="13" width="2" height="1" fill="#f4f1ea" />
        </svg>
      );
    }

    case 'deadline': {
      // Floor 5 Monster Family: "Keluarga Raja Deadline" (Bug Gremlin / Time-Limit Imp / Flaky-Demo Ghost) — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Flying Clock Gears & Orange-Red Sparks */}
            <rect x="1" y="2" width="2" height="2" fill="#fb923c" />
            <rect x="17" y="2" width="2" height="2" fill="#f5b935" />
            <rect x="1" y="13" width="2" height="2" fill="#e83b47" />
            <rect x="17" y="12" width="2" height="2" fill="#fb923c" />
            {/* Recoiling Imp Horns & Flashing Gremlin Hood */}
            <rect x="4" y="2" width="2" height="3" fill="#f4f1ea" />
            <rect x="14" y="2" width="2" height="3" fill="#f4f1ea" />
            <rect x="4" y="5" width="12" height="6" fill="#f4f1ea" />
            <rect x="5" y="6" width="10" height="4" fill="#e83b47" />
            {/* X-Shock Eyes */}
            <rect x="6" y="7" width="2" height="2" fill="#0d0a1a" />
            <rect x="12" y="7" width="2" height="2" fill="#0d0a1a" />
            <rect x="6" y="7" width="1" height="1" fill="#f5b935" />
            <rect x="13" y="7" width="1" height="1" fill="#f5b935" />
            {/* Cracked Hourglass Chest & Jittering Gremlin Claws */}
            <rect x="3" y="11" width="14" height="6" fill="#fb923c" />
            <rect x="7" y="12" width="6" height="4" fill="#0d0a1a" />
            <rect x="9" y="12" width="2" height="4" fill="#f4f1ea" />
            <rect x="1" y="9" width="2" height="3" fill="#f4f1ea" />
            <rect x="17" y="9" width="2" height="3" fill="#f4f1ea" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 20 20"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Dissolving Ghostly Time Sand Pixels */}
            <rect x="5" y="6" width="1" height="1" fill="#fb923c" />
            <rect x="10" y="5" width="2" height="1" fill="#f5b935" />
            <rect x="14" y="7" width="1" height="1" fill="#e83b47" />
            {/* Collapsed Imp Cloak & Broken Stopwatch Dial */}
            <rect x="3" y="14" width="14" height="4" fill="#941923" />
            <rect x="5" y="12" width="10" height="4" fill="#e83b47" />
            <rect x="7" y="13" width="6" height="3" fill="#0d0a1a" />
            <rect x="8" y="14" width="2" height="1" fill="#94a3b8" />
            <rect x="11" y="14" width="1" height="1" fill="#fb923c" />
            {/* Dropped Scythe Blade */}
            <rect x="15" y="11" width="3" height="1" fill="#94a3b8" />
            <rect x="17" y="12" width="1" height="4" fill="#a87312" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 5 "Keluarga Raja Deadline" (Time-Limit Imp / Bug Gremlin)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 20 20"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Curved Gremlin Horns & Alarm Bell Tip */}
          <rect x="4" y="2" width="2" height="3" fill="#fb923c" />
          <rect x="14" y="2" width="2" height="3" fill="#fb923c" />
          <rect x="9" y="1" width="2" height="2" fill="#f5b935" />
          {/* Crimson-Orange Hooded Imp Head */}
          <rect x="4" y="4" width="12" height="6" fill="#e83b47" />
          <rect x="5" y="5" width="10" height="4" fill="#0d0a1a" />
          {/* Glowing Amber-Orange Eyes & Mischievous Grin */}
          <rect x="6" y="6" width="2" height="2" fill="#fb923c" />
          <rect x="12" y="6" width="2" height="2" fill="#fb923c" />
          <rect x="7" y="6" width="1" height="1" fill="#f4f1ea" />
          <rect x="13" y="6" width="1" height="1" fill="#f4f1ea" />
          <rect x="8" y="8" width="4" height="1" fill="#f5b935" />
          {/* Cloak Body & Ticking Countdown Emblem */}
          <rect x="3" y="10" width="14" height="7" fill="#941923" />
          <rect x="4" y="10" width="12" height="6" fill="#e83b47" />
          <rect x="7" y="11" width="6" height="4" fill="#0d0a1a" />
          <rect x="8" y="12" width="4" height="2" fill="#fb923c" />
          <rect x="9" y="12" width="1" height="2" fill="#f4f1ea" />
          {/* Time-Scythe in Right Hand & Bug Antenna Claw on Left */}
          <rect x="1" y="9" width="2" height="4" fill="#fb923c" />
          <rect x="17" y="4" width="1" height="13" fill="#a87312" />
          <rect x="14" y="3" width="4" height="2" fill="#94a3b8" />
          <rect x="13" y="4" width="2" height="1" fill="#f4f1ea" />
          {/* Imp Boots */}
          <rect x="5" y="17" width="3" height="2" fill="#0d0a1a" />
          <rect x="12" y="17" width="3" height="2" fill="#0d0a1a" />
        </svg>
      );
    }

    case 'boss-deadline': {
      // Floor 5 Boss: "Raja Deadline" — 3 distinct pixel states (idle, hit, defeated)
      if (effectiveState === 'hit') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Shattering Clock Numerals & Crimson-Orange Sparks */}
            <rect x="1" y="1" width="3" height="2" fill="#f5b935" />
            <rect x="20" y="1" width="3" height="2" fill="#fb923c" />
            <rect x="0" y="12" width="2" height="3" fill="#e83b47" />
            <rect x="22" y="12" width="2" height="3" fill="#f5b935" />
            {/* Flashing Crown of Deadlines */}
            <rect x="6" y="1" width="12" height="3" fill="#f4f1ea" />
            {/* Recoiling Sovereign Mantle */}
            <rect x="3" y="4" width="18" height="17" fill="#f4f1ea" />
            <rect x="4" y="5" width="16" height="15" fill="#e83b47" />
            {/* Cracked Digital Countdown Visor (00:00!) */}
            <rect x="6" y="6" width="12" height="4" fill="#0d0a1a" />
            <rect x="7" y="7" width="4" height="2" fill="#f5b935" />
            <rect x="13" y="7" width="4" height="2" fill="#f5b935" />
            {/* Fractured Grand Clockwork Core */}
            <rect x="7" y="11" width="10" height="8" fill="#0d0a1a" />
            <rect x="8" y="12" width="8" height="6" fill="#fb923c" />
            <rect x="11" y="11" width="2" height="8" fill="#f4f1ea" />
          </svg>
        );
      }

      if (effectiveState === 'defeated') {
        return (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            shapeRendering="crispEdges"
            className={`pixelated ${className}`}
            aria-hidden="true"
          >
            {/* Floating Shattered Clock Fragments */}
            <rect x="3" y="4" width="2" height="2" fill="#94a3b8" />
            <rect x="19" y="4" width="2" height="2" fill="#fb923c" />
            <rect x="5" y="7" width="2" height="1" fill="#f5b935" />
            <rect x="17" y="7" width="2" height="1" fill="#e83b47" />
            {/* Gleaming "Stopwatch Perak" Relic Floating Above Vanquished Mantle */}
            <rect x="11" y="6" width="2" height="2" fill="#f5b935" />
            <rect x="8" y="8" width="8" height="7" fill="#94a3b8" />
            <rect x="9" y="9" width="6" height="5" fill="#f4f1ea" />
            <rect x="11" y="10" width="1" height="2" fill="#e83b47" />
            <rect x="12" y="11" width="2" height="1" fill="#0d0a1a" />
            {/* Collapsed Crimson Robes of Raja Deadline */}
            <rect x="3" y="16" width="18" height="6" fill="#941923" />
            <rect x="5" y="15" width="14" height="5" fill="#e83b47" />
            <rect x="8" y="17" width="8" height="2" fill="#0d0a1a" />
          </svg>
        );
      }

      // Default 'idle' state for Floor 5 Boss: "Raja Deadline"
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          {/* Twin Alarm Bells & Sovereign Crown of Time */}
          <rect x="5" y="1" width="3" height="2" fill="#f5b935" />
          <rect x="16" y="1" width="3" height="2" fill="#f5b935" />
          <rect x="10" y="0" width="4" height="3" fill="#fb923c" />
          <rect x="6" y="3" width="12" height="2" fill="#f5b935" />
          {/* Armored Crimson-Orange Mantle */}
          <rect x="2" y="9" width="20" height="13" fill="#941923" />
          <rect x="4" y="5" width="16" height="16" fill="#e83b47" />
          {/* Hooded Visor with Glowing Countdown Eyes */}
          <rect x="6" y="6" width="12" height="5" fill="#0d0a1a" />
          <rect x="7" y="7" width="3" height="2" fill="#fb923c" />
          <rect x="14" y="7" width="3" height="2" fill="#fb923c" />
          <rect x="8" y="7" width="1" height="1" fill="#f4f1ea" />
          <rect x="15" y="7" width="1" height="1" fill="#f4f1ea" />
          <rect x="11" y="8" width="2" height="2" fill="#e83b47" />
          {/* Grand Chest Clock Face & Ticking Hands */}
          <rect x="6" y="12" width="12" height="8" fill="#94a3b8" />
          <rect x="7" y="13" width="10" height="6" fill="#0d0a1a" />
          <rect x="8" y="14" width="8" height="4" fill="#16112b" />
          {/* Clock Hands Pointing to Midnight */}
          <rect x="11" y="13" width="2" height="3" fill="#f5b935" />
          <rect x="12" y="15" width="3" height="1" fill="#fb923c" />
          <rect x="11" y="15" width="2" height="1" fill="#f4f1ea" />
          {/* Great Chrono-Scythe on Right */}
          <rect x="21" y="2" width="2" height="20" fill="#94a3b8" />
          <rect x="16" y="2" width="5" height="2" fill="#fb923c" />
          <rect x="15" y="4" width="3" height="1" fill="#f4f1ea" />
        </svg>
      );
    }

    case 'guardian':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className={`pixelated ${className}`}
          aria-hidden="true"
        >
          <rect x="5" y="0" width="6" height="1" fill="#f5b935" />
          <rect x="4" y="2" width="8" height="5" fill="#9b5de5" />
          <rect x="6" y="4" width="1" height="1" fill="#3ac5eb" />
          <rect x="9" y="4" width="1" height="1" fill="#3ac5eb" />
          <rect x="3" y="7" width="10" height="8" fill="#3b0764" />
          <rect x="6" y="7" width="4" height="8" fill="#f5b935" />
        </svg>
      );
  }
};

/**
 * Pixel Relic Icons (13 total: 5 Boss Relics + 8 Guild Quest Relics)
 */
export const RelicSprite: React.FC<{ iconType: string; size?: number; className?: string }> = ({
  iconType,
  size = 40,
  className = '',
}) => {
  if (iconType === 'crown-bayes') {
    // Detailed pixel-art Mahkota Kristal Bayes (Floor 1 Boss Relic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        {/* Crown Spires */}
        <rect x="3" y="4" width="2" height="4" fill="#f5b935" />
        <rect x="7" y="2" width="2" height="6" fill="#f5b935" />
        <rect x="11" y="4" width="2" height="4" fill="#f5b935" />
        {/* Crown Band */}
        <rect x="3" y="8" width="10" height="4" fill="#f5b935" />
        <rect x="3" y="11" width="10" height="1" fill="#a87312" />
        {/* Bayes Emerald & Cyan Crystals */}
        <rect x="7" y="6" width="2" height="4" fill="#38d864" />
        <rect x="4" y="9" width="1" height="2" fill="#3ac5eb" />
        <rect x="11" y="9" width="1" height="2" fill="#3ac5eb" />
        <rect x="7" y="7" width="1" height="1" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'compass-tree') {
    // Detailed pixel-art "Daun Emas" (Floor 2 Boss Relic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        {/* Forest Green Frame */}
        <rect x="2" y="2" width="12" height="12" fill="#1d8a3d" />
        <rect x="3" y="3" width="10" height="10" fill="#0d0a1a" />
        {/* Golden Leaf Blade ("Daun Emas") */}
        <rect x="8" y="3" width="3" height="2" fill="#f5b935" />
        <rect x="6" y="5" width="5" height="3" fill="#f5b935" />
        <rect x="5" y="8" width="5" height="3" fill="#f5b935" />
        <rect x="7" y="6" width="2" height="2" fill="#f4f1ea" />
        {/* Central Vein & Stem */}
        <rect x="7" y="7" width="2" height="2" fill="#a87312" />
        <rect x="6" y="9" width="2" height="2" fill="#a87312" />
        <rect x="4" y="11" width="2" height="2" fill="#a87312" />
      </svg>
    );
  }

  if (iconType === 'eye-attention') {
    // Detailed pixel-art "Inti Neuron" (Floor 3 Boss Relic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        {/* Neon Purple Neural Frame */}
        <rect x="2" y="2" width="12" height="12" fill="#7e22ce" />
        <rect x="3" y="3" width="10" height="10" fill="#0d0a1a" />
        {/* Synaptic Dendrites */}
        <rect x="3" y="4" width="2" height="1" fill="#3ac5eb" />
        <rect x="11" y="4" width="2" height="1" fill="#3ac5eb" />
        <rect x="3" y="11" width="2" height="1" fill="#f5b935" />
        <rect x="11" y="11" width="2" height="1" fill="#f5b935" />
        {/* Glowing Neuron Core */}
        <rect x="5" y="5" width="6" height="6" fill="#9b5de5" />
        <rect x="6" y="6" width="4" height="4" fill="#3ac5eb" />
        <rect x="7" y="7" width="2" height="2" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'core-tinyml' || iconType === 'chip-edge') {
    // Detailed pixel-art "Chip Edge" (Floor 4 Boss Relic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#0d1524" />
        {/* Gold IC Pins */}
        <rect x="5" y="1" width="1" height="2" fill="#f5b935" />
        <rect x="10" y="1" width="1" height="2" fill="#f5b935" />
        <rect x="5" y="13" width="1" height="2" fill="#f5b935" />
        <rect x="10" y="13" width="1" height="2" fill="#f5b935" />
        <rect x="1" y="5" width="2" height="1" fill="#f5b935" />
        <rect x="1" y="10" width="2" height="1" fill="#f5b935" />
        <rect x="13" y="5" width="2" height="1" fill="#f5b935" />
        <rect x="13" y="10" width="2" height="1" fill="#f5b935" />
        {/* Cyan Silicon Die Package */}
        <rect x="3" y="3" width="10" height="10" fill="#0891b2" />
        <rect x="4" y="4" width="8" height="8" fill="#0f172a" />
        <rect x="5" y="5" width="6" height="6" fill="#3ac5eb" />
        <rect x="6" y="6" width="4" height="4" fill="#38d864" />
        <rect x="7" y="7" width="2" height="2" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'hourglass-deadline' || iconType === 'stopwatch-perak') {
    // Detailed pixel-art "Stopwatch Perak" (Floor 5 Boss Relic)
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#1a0d14" />
        {/* Crown Button & Side Clickers */}
        <rect x="6" y="1" width="4" height="2" fill="#f5b935" />
        <rect x="7" y="3" width="2" height="1" fill="#94a3b8" />
        <rect x="12" y="3" width="2" height="2" fill="#fb923c" />
        {/* Silver Stopwatch Bezel */}
        <rect x="3" y="4" width="10" height="10" fill="#94a3b8" />
        <rect x="4" y="5" width="8" height="8" fill="#f4f1ea" />
        <rect x="5" y="6" width="6" height="6" fill="#0d0a1a" />
        {/* Precision Hands */}
        <rect x="7" y="6" width="2" height="3" fill="#e83b47" />
        <rect x="8" y="8" width="2" height="1" fill="#f5b935" />
        <rect x="7" y="8" width="1" height="1" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'tower-m1' || iconType === 'Kitab Teori') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="3" y="2" width="10" height="12" fill="#9b5de5" />
        <rect x="4" y="3" width="8" height="10" fill="#16112b" />
        <rect x="3" y="2" width="2" height="12" fill="#f5b935" />
        <rect x="6" y="5" width="4" height="4" fill="#3ac5eb" />
        <rect x="7" y="6" width="2" height="2" fill="#f4f1ea" />
        <rect x="6" y="10" width="5" height="1" fill="#f5b935" />
      </svg>
    );
  }

  if (iconType === 'tower-m2' || iconType === 'Gulungan Kursus') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="2" y="3" width="12" height="2" fill="#a87312" />
        <rect x="4" y="4" width="8" height="8" fill="#f4f1ea" />
        <rect x="2" y="11" width="12" height="2" fill="#a87312" />
        <rect x="5" y="6" width="6" height="1" fill="#3ac5eb" />
        <rect x="5" y="8" width="5" height="1" fill="#38d864" />
        <rect x="7" y="9" width="2" height="2" fill="#f5b935" />
      </svg>
    );
  }

  if (iconType === 'tower-m3' || iconType === 'Prasasti Paper') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="4" y="2" width="8" height="12" fill="#94a3b8" />
        <rect x="5" y="3" width="6" height="10" fill="#1e293b" />
        <rect x="6" y="4" width="4" height="2" fill="#f5b935" />
        <rect x="6" y="7" width="4" height="1" fill="#3ac5eb" />
        <rect x="6" y="9" width="3" height="1" fill="#38d864" />
        <rect x="6" y="11" width="4" height="1" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'tower-m4' || iconType === 'Lencana Portofolio') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="3" y="2" width="10" height="9" fill="#f5b935" />
        <rect x="4" y="3" width="8" height="7" fill="#132924" />
        <rect x="5" y="11" width="6" height="2" fill="#f5b935" />
        <rect x="6" y="13" width="4" height="1" fill="#a87312" />
        <rect x="5" y="5" width="2" height="2" fill="#38d864" />
        <rect x="9" y="5" width="2" height="2" fill="#3ac5eb" />
        <rect x="7" y="7" width="2" height="2" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'tower-m5' || iconType === 'Medali Tekanan') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="5" y="2" width="2" height="4" fill="#e83b47" />
        <rect x="9" y="2" width="2" height="4" fill="#3ac5eb" />
        <rect x="4" y="6" width="8" height="7" fill="#f5b935" />
        <rect x="5" y="7" width="6" height="5" fill="#a87312" />
        <rect x="7" y="8" width="2" height="3" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'tower-m6' || iconType === 'Kompas Spesialis') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="3" y="3" width="10" height="10" fill="#f5b935" />
        <rect x="4" y="4" width="8" height="8" fill="#0d0a1a" />
        <rect x="7" y="4" width="2" height="3" fill="#e83b47" />
        <rect x="7" y="9" width="2" height="3" fill="#3ac5eb" />
        <rect x="4" y="7" width="3" height="2" fill="#38d864" />
        <rect x="9" y="7" width="3" height="2" fill="#9b5de5" />
        <rect x="7" y="7" width="2" height="2" fill="#f4f1ea" />
      </svg>
    );
  }

  if (iconType === 'tower-m7' || iconType === 'Obor Pengajar') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="14" height="14" fill="#120d26" />
        <rect x="6" y="2" width="4" height="5" fill="#e83b47" />
        <rect x="7" y="1" width="2" height="5" fill="#f5b935" />
        <rect x="7" y="3" width="2" height="2" fill="#f4f1ea" />
        <rect x="5" y="7" width="6" height="2" fill="#94a3b8" />
        <rect x="7" y="9" width="2" height="5" fill="#a87312" />
      </svg>
    );
  }

  const paletteMap: Record<string, { primary: string; secondary: string; core: string }> = {
    'compass-tree': { primary: '#a87312', secondary: '#38d864', core: '#f5b935' },
    'eye-attention': { primary: '#9b5de5', secondary: '#3ac5eb', core: '#f5b935' },
    'core-tinyml': { primary: '#3ac5eb', secondary: '#38d864', core: '#f5b935' },
    'hourglass-deadline': { primary: '#e83b47', secondary: '#f5b935', core: '#3ac5eb' },
    'git-blade': { primary: '#3ac5eb', secondary: '#f5b935', core: '#f4f1ea' },
    'sieve-data': { primary: '#f5b935', secondary: '#38d864', core: '#3ac5eb' },
    'chip-esp32': { primary: '#38d864', secondary: '#94a3b8', core: '#f5b935' },
    'stone-baseline': { primary: '#9b5de5', secondary: '#f4f1ea', core: '#38d864' },
    'shield-backup': { primary: '#3ac5eb', secondary: '#f5b935', core: '#e83b47' },
    'horn-clarity': { primary: '#f5b935', secondary: '#e83b47', core: '#f4f1ea' },
    'scroll-mvp': { primary: '#f4f1ea', secondary: '#a87312', core: '#e83b47' },
    'lock-ethics': { primary: '#38d864', secondary: '#f5b935', core: '#0d0a1a' },
  };

  const colors = paletteMap[iconType] || paletteMap['compass-tree'];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`pixelated ${className}`}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="12" height="12" fill="#16112b" />
      <rect x="3" y="3" width="10" height="10" fill={colors.primary} />
      <rect x="5" y="5" width="6" height="6" fill={colors.secondary} />
      <rect x="7" y="7" width="2" height="2" fill={colors.core} />
      <rect x="4" y="4" width="2" height="1" fill="#f4f1ea" />
    </svg>
  );
};

/**
 * Pixel Badge Icons for the 5 Floor Bosses
 */
export const BadgeSprite: React.FC<{ badgeId: string; size?: number; className?: string }> = ({
  badgeId,
  size = 36,
  className = '',
}) => {
  const colorByBadge: Record<string, string> = {
    'badge-f1': '#38d864',
    'badge-f2': '#f5b935',
    'badge-f3': '#9b5de5',
    'badge-f4': '#3ac5eb',
    'badge-f5': '#e83b47',
  };
  const color = colorByBadge[badgeId] || '#f5b935';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={`pixelated ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="2" width="10" height="8" fill="#f5b935" />
      <rect x="4" y="3" width="8" height="6" fill={color} />
      <rect x="5" y="10" width="6" height="2" fill="#f5b935" />
      <rect x="6" y="12" width="4" height="2" fill="#a87312" />
      <rect x="7" y="5" width="2" height="3" fill="#f4f1ea" />
    </svg>
  );
};

export const PixelLockSprite: React.FC<SpriteProps> = ({ size = 24, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
    aria-hidden="true"
  >
    <rect x="5" y="2" width="6" height="5" fill="#94a3b8" />
    <rect x="6" y="3" width="4" height="4" fill="#0d0a1a" />
    <rect x="3" y="7" width="10" height="7" fill="#f5b935" />
    <rect x="7" y="9" width="2" height="3" fill="#0d0a1a" />
  </svg>
);

export const PixelSwordSprite: React.FC<SpriteProps> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
    aria-hidden="true"
  >
    <rect x="11" y="2" width="3" height="3" fill="#3ac5eb" />
    <rect x="9" y="4" width="3" height="3" fill="#f4f1ea" />
    <rect x="7" y="6" width="3" height="3" fill="#f4f1ea" />
    <rect x="5" y="8" width="3" height="3" fill="#94a3b8" />
    <rect x="3" y="9" width="5" height="2" fill="#f5b935" />
    <rect x="2" y="12" width="3" height="2" fill="#a87312" />
  </svg>
);

export const DungeonDoorSprite: React.FC<{
  unlocked: boolean;
  completed: boolean;
  accentColor: string;
  size?: number;
}> = ({ unlocked, completed, accentColor, size = 44 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className="pixelated shrink-0"
    aria-hidden="true"
  >
    <rect x="3" y="1" width="10" height="2" fill={completed ? '#f5b935' : '#5c4e99'} />
    <rect x="2" y="3" width="12" height="12" fill={completed ? '#f5b935' : '#3a306e'} />
    <rect
      x="4"
      y="3"
      width="8"
      height="12"
      fill={unlocked ? '#120d26' : '#2b2352'}
    />
    {unlocked ? (
      <>
        <rect x="5" y="5" width="6" height="8" fill={accentColor} opacity="0.35" />
        <rect x="9" y="8" width="2" height="2" fill="#f5b935" />
      </>
    ) : (
      <>
        <rect x="5" y="3" width="1" height="12" fill="#64748b" />
        <rect x="10" y="3" width="1" height="12" fill="#64748b" />
        <rect x="6" y="7" width="4" height="4" fill="#e83b47" />
      </>
    )}
  </svg>
);

export const CampfireSprite: React.FC<{
  stage: 0 | 1 | 2 | 3 | 4;
  size?: number;
  className?: string;
}> = ({ stage, size = 72, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
    aria-hidden="true"
  >
    {/* Stone ring & crossed wood logs at the base */}
    <rect x="2" y="13" width="12" height="2" fill="#3a306e" />
    <rect x="3" y="12" width="10" height="2" fill="#a87312" />
    <rect x="4" y="11" width="8" height="2" fill="#64748b" />
    <rect x="5" y="12" width="6" height="1" fill="#e83b47" opacity={stage === 0 ? 0.45 : 0.9} />

    {/* Stage 0: Unlit embers + smoke */}
    {stage === 0 && (
      <>
        <rect x="7" y="10" width="2" height="1" fill="#e83b47" />
        <rect x="6" y="8" width="1" height="1" fill="#94a3b8" />
        <rect x="8" y="6" width="1" height="1" fill="#64748b" />
      </>
    )}

    {/* Stage 1: Small spark flame */}
    {stage === 1 && (
      <>
        <rect x="6" y="9" width="4" height="3" fill="#e83b47" />
        <rect x="7" y="8" width="2" height="3" fill="#f5b935" />
        <rect x="7" y="10" width="2" height="1" fill="#f4f1ea" />
      </>
    )}

    {/* Stage 2: Medium warm campfire */}
    {stage === 2 && (
      <>
        <rect x="5" y="7" width="6" height="5" fill="#e83b47" />
        <rect x="6" y="5" width="4" height="6" fill="#f5b935" />
        <rect x="7" y="8" width="2" height="3" fill="#f4f1ea" />
        <rect x="4" y="6" width="1" height="1" fill="#f5b935" />
        <rect x="11" y="5" width="1" height="1" fill="#e83b47" />
      </>
    )}

    {/* Stage 3: Roaring bright fire */}
    {stage === 3 && (
      <>
        <rect x="4" y="5" width="8" height="7" fill="#e83b47" />
        <rect x="5" y="3" width="6" height="8" fill="#f5b935" />
        <rect x="6" y="6" width="4" height="5" fill="#f4f1ea" />
        <rect x="3" y="4" width="1" height="2" fill="#f5b935" />
        <rect x="12" y="4" width="1" height="2" fill="#e83b47" />
        <rect x="7" y="1" width="2" height="2" fill="#f5b935" />
      </>
    )}

    {/* Stage 4: Legendary Blazing Bonfire (Target Met!) */}
    {stage === 4 && (
      <>
        <rect x="3" y="4" width="10" height="8" fill="#e83b47" />
        <rect x="4" y="2" width="8" height="9" fill="#f5b935" />
        <rect x="5" y="4" width="6" height="7" fill="#38d864" />
        <rect x="6" y="6" width="4" height="5" fill="#f4f1ea" />
        <rect x="7" y="0" width="2" height="2" fill="#3ac5eb" />
        <rect x="2" y="3" width="1" height="2" fill="#38d864" />
        <rect x="13" y="3" width="1" height="2" fill="#38d864" />
        <rect x="4" y="1" width="1" height="1" fill="#f4f1ea" />
        <rect x="11" y="1" width="1" height="1" fill="#f4f1ea" />
      </>
    )}
  </svg>
);

export const PixelTimerSprite: React.FC<SpriteProps> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className={`pixelated ${className}`}
    aria-hidden="true"
  >
    <rect x="3" y="2" width="10" height="2" fill="#f5b935" />
    <rect x="4" y="4" width="8" height="2" fill="#3ac5eb" />
    <rect x="6" y="6" width="4" height="2" fill="#f5b935" />
    <rect x="6" y="8" width="4" height="2" fill="#3ac5eb" />
    <rect x="4" y="10" width="8" height="2" fill="#3ac5eb" />
    <rect x="5" y="11" width="6" height="1" fill="#f5b935" />
    <rect x="3" y="12" width="10" height="2" fill="#f5b935" />
  </svg>
);

export type CerminPuncakState = 'idle' | 'speaking' | 'shattered-into-light' | 'shattered';

/**
 * Floor 6 Final Guardian: "Cermin Puncak" (Summit Mirror-Golem Guardian)
 * Original 24x24 pixel sprite with 3 states:
 * - 'idle': calm golden-framed obsidian mirror golem reflecting starlight
 * - 'speaking': resonating golden aura & rippling cyan/cream reflection waves
 * - 'shattered-into-light' / 'shattered': mirror shards dissolving into a radiant golden starlight burst for the summit ceremony
 */
export const CerminPuncakSprite: React.FC<{
  state?: CerminPuncakState;
  size?: number;
  className?: string;
}> = ({ state = 'idle', size = 96, className = '' }) => {
  if (state === 'shattered-into-light' || state === 'shattered') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        {/* Radiant Starlight Beams */}
        <rect x="11" y="0" width="2" height="24" fill="#f5b935" />
        <rect x="0" y="11" width="24" height="2" fill="#f5b935" />
        <rect x="4" y="4" width="2" height="2" fill="#f4f1ea" />
        <rect x="18" y="4" width="2" height="2" fill="#f4f1ea" />
        <rect x="4" y="18" width="2" height="2" fill="#f4f1ea" />
        <rect x="18" y="18" width="2" height="2" fill="#f4f1ea" />
        {/* Floating Crystalline Mirror Shards */}
        <rect x="2" y="7" width="3" height="2" fill="#3ac5eb" />
        <rect x="19" y="7" width="3" height="2" fill="#3ac5eb" />
        <rect x="3" y="15" width="2" height="3" fill="#38d864" />
        <rect x="19" y="15" width="2" height="3" fill="#9b5de5" />
        <rect x="7" y="2" width="2" height="3" fill="#3ac5eb" />
        <rect x="15" y="2" width="2" height="3" fill="#f5b935" />
        {/* Blazing Core of Pure Light */}
        <rect x="7" y="7" width="10" height="10" fill="#f5b935" />
        <rect x="8" y="8" width="8" height="8" fill="#3ac5eb" />
        <rect x="9" y="9" width="6" height="6" fill="#f4f1ea" />
        {/* Pedestal Base Bathed in Gold */}
        <rect x="6" y="20" width="12" height="3" fill="#a87312" />
        <rect x="8" y="19" width="8" height="2" fill="#f5b935" />
      </svg>
    );
  }

  if (state === 'speaking') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className={`pixelated ${className}`}
        aria-hidden="true"
      >
        {/* Resonating Golden Halo & Speaking Waves */}
        <rect x="9" y="0" width="6" height="2" fill="#f4f1ea" />
        <rect x="6" y="1" width="12" height="2" fill="#f5b935" />
        <rect x="1" y="8" width="2" height="2" fill="#f5b935" />
        <rect x="0" y="11" width="2" height="2" fill="#3ac5eb" />
        <rect x="1" y="14" width="2" height="2" fill="#f5b935" />
        <rect x="21" y="8" width="2" height="2" fill="#f5b935" />
        <rect x="22" y="11" width="2" height="2" fill="#3ac5eb" />
        <rect x="21" y="14" width="2" height="2" fill="#f5b935" />
        {/* Floating Stone-Gold Golem Pauldrons */}
        <rect x="2" y="5" width="3" height="6" fill="#f5b935" />
        <rect x="19" y="5" width="3" height="6" fill="#f5b935" />
        {/* Ornate Golden Mirror Frame */}
        <rect x="5" y="3" width="14" height="16" fill="#f5b935" />
        <rect x="6" y="4" width="12" height="14" fill="#16112b" />
        {/* Illuminated Reflective Glass Surface */}
        <rect x="7" y="5" width="10" height="12" fill="#0d0a1a" />
        <rect x="8" y="6" width="8" height="10" fill="#3ac5eb" />
        {/* Speaking Eyes & Resonant Waveform in the Mirror */}
        <rect x="9" y="8" width="2" height="2" fill="#f4f1ea" />
        <rect x="13" y="8" width="2" height="2" fill="#f4f1ea" />
        <rect x="9" y="12" width="6" height="2" fill="#f5b935" />
        <rect x="10" y="11" width="4" height="4" fill="#f4f1ea" />
        {/* Ancient Summit Pedestal */}
        <rect x="4" y="19" width="16" height="3" fill="#a87312" />
        <rect x="6" y="20" width="12" height="2" fill="#f5b935" />
      </svg>
    );
  }

  // Default 'idle' state
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className={`pixelated ${className}`}
      aria-hidden="true"
    >
      {/* Summit Crown Spire */}
      <rect x="10" y="0" width="4" height="2" fill="#f5b935" />
      <rect x="7" y="2" width="10" height="1" fill="#a87312" />
      {/* Floating Golem Hands / Pillar Guards */}
      <rect x="2" y="7" width="2" height="6" fill="#a87312" />
      <rect x="2" y="7" width="2" height="2" fill="#f5b935" />
      <rect x="20" y="7" width="2" height="6" fill="#a87312" />
      <rect x="20" y="7" width="2" height="2" fill="#f5b935" />
      {/* Golden Mirror Golem Frame */}
      <rect x="5" y="3" width="14" height="16" fill="#f5b935" />
      <rect x="6" y="4" width="12" height="14" fill="#a87312" />
      {/* Deep Night-Sky Mirror Glass */}
      <rect x="7" y="5" width="10" height="12" fill="#0d0a1a" />
      <rect x="8" y="6" width="8" height="10" fill="#16112b" />
      {/* Diagonal Starlight Glint & Watching Mirror Eyes */}
      <rect x="8" y="6" width="2" height="1" fill="#3ac5eb" />
      <rect x="8" y="7" width="1" height="2" fill="#3ac5eb" />
      <rect x="9" y="9" width="2" height="2" fill="#f5b935" />
      <rect x="13" y="9" width="2" height="2" fill="#f5b935" />
      <rect x="10" y="9" width="1" height="1" fill="#f4f1ea" />
      <rect x="14" y="9" width="1" height="1" fill="#f4f1ea" />
      <rect x="10" y="13" width="4" height="1" fill="#3ac5eb" />
      {/* Summit Pedestal */}
      <rect x="4" y="19" width="16" height="3" fill="#5c4e99" />
      <rect x="6" y="20" width="12" height="2" fill="#f5b935" />
    </svg>
  );
};


