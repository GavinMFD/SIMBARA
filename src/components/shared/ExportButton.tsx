"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  format: "pdf" | "excel";
  label?: string;
  onClick?: () => void;
}

export default function ExportButton({
  format,
  label,
  onClick,
}: ExportButtonProps) {
  const defaultLabel = format === "pdf" ? "Export PDF" : "Export Excel";

  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <FileDown size={16} className="mr-2" />
      {label || defaultLabel}
    </Button>
  );
}
