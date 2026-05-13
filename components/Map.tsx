"use client";

import dynamic from "next/dynamic";

function MapSkeleton() {
  return (
    <div
      className="flex h-[300px] w-full items-center justify-center rounded-lg bg-muted/60"
      role="status"
      aria-label="Loading map"
    >
      <span className="text-sm text-muted-foreground">Loading map...</span>
    </div>
  );
}

const Map = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: MapSkeleton,
});

export default Map;
