import React from 'react';

export function SkeletonTile({ className = '' }) {
  return (
    <div className={`skeleton w-full h-8 ${className}`}></div>
  );
}
