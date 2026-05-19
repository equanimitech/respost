// CARTO positron tiles, stitched server-side via CSS.
// Server component — zero JS, full SSR/SSG, no canvas, no sharp.

const TILE = 256;
const SUBDOMAINS = ["a", "b", "c", "d"] as const;

function lonToTileX(lon: number, z: number) {
  return ((lon + 180) / 360) * 2 ** z;
}
function latToTileY(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
  );
}

function tileUrl(z: number, x: number, y: number, retina = true) {
  const sd = SUBDOMAINS[(x + y) % SUBDOMAINS.length];
  const n = 2 ** z;
  const wrappedX = ((x % n) + n) % n; // wrap longitude
  const suffix = retina ? "@2x.png" : ".png";
  return `https://${sd}.basemaps.cartocdn.com/light_all/${z}/${wrappedX}/${y}${suffix}`;
}

type Props = {
  lat: number;
  lon: number;
  zoom?: number;
  w?: number;
  h?: number;
  tone?: string; // pin color
};

export function RealMiniMap({
  lat,
  lon,
  zoom = 14,
  w = 340,
  h = 140,
  tone = "var(--terra)",
}: Props) {
  // Floating tile coordinates of the centre point.
  const cx = lonToTileX(lon, zoom);
  const cy = latToTileY(lat, zoom);

  // Tile range needed to cover the viewport, centred on (cx, cy).
  const halfTilesX = w / 2 / TILE;
  const halfTilesY = h / 2 / TILE;
  const x0 = Math.floor(cx - halfTilesX);
  const x1 = Math.floor(cx + halfTilesX);
  const y0 = Math.floor(cy - halfTilesY);
  const y1 = Math.floor(cy + halfTilesY);

  // Position of tile (x0, y0)'s top-left within the viewport.
  const offsetX = w / 2 - (cx - x0) * TILE;
  const offsetY = h / 2 - (cy - y0) * TILE;

  const tiles: Array<{ x: number; y: number; left: number; top: number }> = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      tiles.push({
        x: tx,
        y: ty,
        left: offsetX + (tx - x0) * TILE,
        top: offsetY + (ty - y0) * TILE,
      });
    }
  }

  return (
    <div
      style={{
        width: w,
        height: h,
        position: "relative",
        overflow: "hidden",
        background: "#f4ead4",
      }}
      aria-hidden="true"
    >
      {tiles.map((t) => (
        <img
          key={`${t.x}-${t.y}`}
          src={tileUrl(zoom, t.x, t.y, true)}
          alt=""
          width={TILE}
          height={TILE}
          loading="lazy"
          decoding="async"
          style={{
            position: "absolute",
            left: t.left,
            top: t.top,
            width: TILE,
            height: TILE,
            display: "block",
            // subtle warm wash so it blends with paper aesthetic
            filter: "sepia(0.12) saturate(0.9) brightness(1.02)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: w / 2,
          top: h / 2,
          transform: "translate(-50%, -100%)",
        }}
      >
        <svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true">
          <path
            d="M13 33s11-12 11-20a11 11 0 10-22 0c0 8 11 20 11 20z"
            fill={tone}
            stroke="rgba(60,40,20,.4)"
            strokeWidth="0.8"
          />
          <circle cx="13" cy="13" r="4" fill="var(--paper-light)" />
        </svg>
      </div>
    </div>
  );
}
