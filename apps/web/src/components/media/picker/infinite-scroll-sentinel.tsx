"use client";

import { Button } from "@adscrush/ui/components/button";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onIntersect: () => void;
  onRetry: () => void;
}

export function InfiniteScrollSentinel({
  onIntersect,
  hasNextPage,
  isFetchingNextPage,
  error,
  onRetry,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onIntersect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, onIntersect]);

  return (
    <div>
      {/* Sentinel element observed by IntersectionObserver */}
      <div aria-hidden="true" ref={sentinelRef} />

      {/* Loading state */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2">
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              Loading more...
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isFetchingNextPage && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2">
            <span className="text-destructive text-xs">
              Failed to load more
            </span>
            <Button
              className="ml-1 h-6 text-xs"
              onClick={onRetry}
              size="sm"
              variant="ghost"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* All loaded state */}
      {!(hasNextPage || isFetchingNextPage || error) && (
        <div className="flex items-center justify-center py-6">
          <span className="text-muted-foreground/60 text-xs">
            All files loaded
          </span>
        </div>
      )}
    </div>
  );
}
