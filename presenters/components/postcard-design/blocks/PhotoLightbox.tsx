"use client";

import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export function PhotoLightbox({ src, alt, open, onClose }: Props) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src, alt: alt ?? "" }]}
      plugins={[Fullscreen, Zoom]}
      controller={{ closeOnBackdropClick: true }}
      carousel={{ finite: true }}
      render={{ buttonPrev: () => null, buttonNext: () => null }}
    />
  );
}
