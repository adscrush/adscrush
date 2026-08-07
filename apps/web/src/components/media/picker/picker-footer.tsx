"use client";

import { Button } from "@adscrush/ui/components/button";

interface PickerFooterProps {
  onCancel: () => void;
  onDone: () => void;
  selectedCount: number;
}

export function PickerFooter({
  selectedCount,
  onCancel,
  onDone,
}: PickerFooterProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex items-center justify-end gap-2 border-border border-t bg-card px-4 py-3">
      {hasSelection && (
        <span className="mr-auto text-muted-foreground text-sm">
          {selectedCount} {selectedCount === 1 ? "file" : "files"} selected
        </span>
      )}
      <Button onClick={onCancel} variant="outline">
        Cancel
      </Button>
      <Button
        className="bg-primary px-6 text-primary-foreground hover:bg-primary/90"
        disabled={!hasSelection}
        onClick={onDone}
      >
        Done
      </Button>
    </div>
  );
}
