"use client";

import { Button } from "@adscrush/ui/components/button";
import { X } from "lucide-react";

interface PickerHeaderProps {
  onClose: () => void;
}

export function PickerHeader({ onClose }: PickerHeaderProps) {
  return (
    <div className="flex items-center justify-between border-border border-b bg-card px-4 py-3">
      <h2 className="font-semibold text-base text-foreground">Select file</h2>
      <Button
        aria-label="Close"
        className="h-8 w-8"
        onClick={onClose}
        size="icon"
        variant="ghost"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
