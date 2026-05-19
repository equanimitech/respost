import { Stamp } from "../primitives/Stamp";

export function ModalBackdrop() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center top, #2a2218 0%, #1a140e 50%, #100c08 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -6,
          left: "14%",
          right: "14%",
          height: 90,
          perspective: 600,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(200,180,138,.55) 0%, rgba(160,138,100,.42) 60%, rgba(120,100,72,.3) 100%)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            boxShadow: "0 8px 18px rgba(40,30,20,.4)",
            transform: "rotateX(8deg)",
            transformOrigin: "top",
          }}
        />
      </div>
      <div style={{ position: "absolute", top: 6, right: 32, opacity: 0.42 }}>
        <Stamp w={32} h={42} rot={5}>
          r:p
        </Stamp>
      </div>
    </div>
  );
}
