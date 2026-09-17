"use client";

import { useEffect } from "react";
import Image from "next/image";

type TeamPopupProps = {
  open: boolean;
  onClose: () => void;
};

export function TeamPopup({ open, onClose }: TeamPopupProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="HKCM team"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-[16px] shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          <Image
            src="/team-popup.jpg"
            alt="HKCM team"
            width={1280}
            height={960}
            priority
            className="h-auto w-full object-cover"
          />
          {/* Hit target over the blue X in the artwork */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-[2.5%] top-[2.5%] h-[11%] w-[11%] min-h-10 min-w-10 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
