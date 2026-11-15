import React from 'react';

/**
 * Standardized Skeleton for Detail Views (Rule 9)
 * - 'champion': Full Champion Guide hero + tabs + content skeleton
 * - 'entity': Universal entity hero (Relic, Item, Power) + compatible champions grid
 * - 'map': Adventure map hero banner + bosses + requirements skeleton
 * - 'card': LoR card portrait + metadata skeleton
 */
export default function DetailSkeleton({ type = 'entity' }) {
  if (type === 'champion') {
    return (
      <div className="w-full space-y-4 sm:space-y-6 animate-pulse select-none">
        {/* Hero banner skeleton */}
        <div className="h-44 sm:h-56 rounded-2xl bg-[#0e1320] border border-white/10 p-4 sm:p-6 flex flex-col justify-end gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 rounded-md bg-white/10" />
            <div className="h-5 w-16 rounded-md bg-white/10" />
          </div>
          <div className="h-8 sm:h-10 w-48 sm:w-64 rounded-lg bg-white/20" />
          <div className="h-4 w-36 rounded-md bg-white/10" />
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="h-12 rounded-xl bg-[#0e1320] border border-white/10 p-1 flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 flex-1 rounded-lg bg-white/5" />
          ))}
        </div>

        {/* Content Section Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#0e1320] border border-white/10 p-4 space-y-2">
              <div className="h-4 w-1/3 bg-white/15 rounded" />
              <div className="h-3 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'map') {
    return (
      <div className="w-full space-y-4 sm:space-y-6 animate-pulse select-none">
        {/* Adventure Hero Banner Skeleton */}
        <div className="h-56 sm:h-72 rounded-2xl bg-[#0e1320] border border-white/10 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-24 rounded-lg bg-white/10" />
            <div className="h-6 w-16 rounded-lg bg-white/10" />
          </div>
          <div className="space-y-2">
            <div className="h-8 sm:h-10 w-64 rounded-lg bg-white/20" />
            <div className="h-4 w-40 rounded-md bg-white/10" />
          </div>
        </div>

        {/* Bosses and Nodes Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-52 rounded-2xl bg-[#0e1320] border border-white/10 p-4 space-y-3">
            <div className="h-5 w-32 bg-white/15 rounded" />
            <div className="h-14 rounded-xl bg-white/5" />
            <div className="h-14 rounded-xl bg-white/5" />
          </div>
          <div className="h-52 rounded-2xl bg-[#0e1320] border border-white/10 p-4 space-y-3">
            <div className="h-5 w-32 bg-white/15 rounded" />
            <div className="h-14 rounded-xl bg-white/5" />
            <div className="h-14 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="w-full space-y-4 sm:space-y-6 animate-pulse select-none">
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1320] border border-white/10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-48 sm:w-56 aspect-[680/1024] rounded-2xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded bg-white/10" />
              <div className="h-5 w-20 rounded bg-white/10" />
            </div>
            <div className="h-8 w-48 rounded bg-white/20" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-3/4 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // Default 'entity' skeleton for Relic, Item, Power
  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-pulse select-none">
      {/* Hero Entity Card Skeleton */}
      <div className="p-3 sm:p-5 rounded-2xl bg-[#0e1320] border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <div className="h-4 w-14 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/10" />
            <div className="h-4 w-20 rounded bg-white/10" />
          </div>
          <div className="h-7 w-48 mx-auto sm:mx-0 rounded bg-white/20" />
          <div className="h-4 w-full max-w-md mx-auto sm:mx-0 rounded bg-white/10" />
        </div>
      </div>

      {/* Compatible Champions / Synergies Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 h-72 rounded-2xl bg-[#0e1320] border border-white/10 p-4 space-y-3">
          <div className="h-5 w-40 bg-white/15 rounded" />
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-28 rounded-xl bg-white/5" />
        </div>
        <div className="h-72 rounded-2xl bg-[#0e1320] border border-white/10 p-4 space-y-3">
          <div className="h-5 w-32 bg-white/15 rounded" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
