export type IconName =
  | "plus"
  | "edit"
  | "back"
  | "fwd"
  | "send"
  | "close"
  | "camera"
  | "image"
  | "mic"
  | "pin"
  | "music"
  | "note"
  | "search"
  | "chev"
  | "chevDown"
  | "check"
  | "user"
  | "inbox"
  | "paper"
  | "play"
  | "flip"
  | "bold"
  | "italic";

const PATHS: Record<IconName, string> = {
  plus: "M12 5v14M5 12h14",
  edit: "M3 21l3.5-1 12-12-2.5-2.5-12 12L3 21z M14 6l2.5 2.5",
  back: "M15 5l-7 7 7 7",
  fwd: "M9 5l7 7-7 7",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  close: "M6 6l12 12M6 18L18 6",
  camera: "M3 7h3l2-2h8l2 2h3v12H3V7z M12 17a4 4 0 100-8 4 4 0 000 8z",
  image: "M3 5h18v14H3z M8 12l3 3 3-4 4 5",
  mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z M5 11a7 7 0 0014 0 M12 18v3",
  pin: "M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z M12 11a2 2 0 100-4 2 2 0 000 4z",
  music: "M9 18V5l12-2v13 M9 18a3 3 0 11-6 0 3 3 0 016 0z M21 16a3 3 0 11-6 0 3 3 0 016 0z",
  note: "M5 4h14v16H5z M9 8h6M9 12h6M9 16h4",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3",
  chev: "M9 5l7 7-7 7",
  chevDown: "M6 9l6 6 6-6",
  check: "M5 12l5 5L20 7",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 4-7 8-7s8 3 8 7",
  inbox: "M3 13l3-9h12l3 9 M3 13v7h18v-7 M3 13h5l2 3h4l2-3h5",
  paper: "M19 21H5V3h10l4 4v14z M14 3v5h5",
  play: "M6 4l14 8L6 20z",
  flip: "M3 12h18M3 12l4-4M3 12l4 4",
  bold: "M7 5h6a3 3 0 010 6H7z M7 11h7a3 3 0 010 6H7z",
  italic: "M14 5h6 M4 19h6 M15 5l-6 14",
};

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({
  name,
  size = 20,
  color = "currentColor",
  strokeWidth = 1.6,
}: IconProps) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
