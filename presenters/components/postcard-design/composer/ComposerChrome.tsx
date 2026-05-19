import { Icon } from "../primitives/Icon";

type Props = {
  step: number;
  total?: number;
  title: string;
  onClose?: () => void;
  onSave?: () => void;
};

export function ComposerChrome({ step, total = 3, title, onClose, onSave }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px 4px",
        height: 48,
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--ink-soft)",
        }}
      >
        <Icon name="close" size={20} />
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          className="t-mono"
          style={{
            fontSize: 9,
            letterSpacing: 2,
            color: "var(--ink-mute)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 2,
                background: i <= step ? "var(--terra)" : "var(--paper-edge)",
              }}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onSave}
        style={{
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 500,
          background: "transparent",
          border: "none",
          cursor: onSave ? "pointer" : "default",
          color: "var(--ink-mute)",
          visibility: onSave ? "visible" : "hidden",
        }}
      >
        Save
      </button>
    </div>
  );
}
