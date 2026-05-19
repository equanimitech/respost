"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
  transitionName?: string;
};

export function PostcardLightbox({ src, alt = "", open, onClose, transitionName }: Props) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === dlg) onClose();
    };
    dlg.addEventListener("cancel", onCancel);
    dlg.addEventListener("click", onClick);
    return () => {
      dlg.removeEventListener("cancel", onCancel);
      dlg.removeEventListener("click", onClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={alt || "Photo"}
      style={{
        background: "rgba(20,14,8,0.94)",
        border: "none",
        padding: 0,
        width: "100vw",
        height: "100dvh",
        maxWidth: "100vw",
        maxHeight: "100dvh",
        margin: 0,
        inset: 0,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: 999,
          background: "rgba(20,14,8,0.6)",
          border: "1px solid rgba(246,241,231,0.25)",
          color: "rgba(246,241,231,0.92)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6 L18 18 M18 6 L6 18" />
        </svg>
      </button>
      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", padding: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            viewTransitionName: transitionName,
            touchAction: "pinch-zoom",
          }}
        />
      </div>
    </dialog>
  );
}
