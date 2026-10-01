import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HKCM · Philip Hopf";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE = "https://charts-hkcm.de";

async function loadAsset(path: string, mime: string) {
  const res = await fetch(`${SITE}${path}`);
  if (!res.ok) throw new Error(`Missing share asset ${path}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

export default async function Image() {
  const [logo, philip] = await Promise.all([
    loadAsset("/logo-hkcm-light.png", "image/png"),
    loadAsset("/team/philip-hopf-src.jpg", "image/jpeg"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#070b14",
          overflow: "hidden",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 80% at 18% 40%, rgba(59,110,245,0.28), transparent 55%), radial-gradient(ellipse 55% 70% at 88% 20%, rgba(196,163,90,0.16), transparent 50%), linear-gradient(135deg, #070b14 0%, #0b1b3a 55%, #08101f 100%)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 700,
            height: "100%",
            padding: "52px 40px 48px 56px",
          }}
        >
          <img src={logo} width={220} height={67} alt="HKCM" style={{ objectFit: "contain" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 650,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#c4a35a",
              }}
            >
              Markt-Desk
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 720,
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
                color: "#ffffff",
                maxWidth: 620,
              }}
            >
              Struktur schlägt Stimmung — lies den Chart, nicht die Schlagzeile.
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 24,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.62)",
                maxWidth: 560,
              }}
            >
              Philip Hopf · Gründer & Gesellschafter · HKCM GmbH
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "rgba(255,255,255,0.42)",
              letterSpacing: "0.04em",
            }}
          >
            charts-hkcm.de
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 520,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <img
            src={philip}
            width={480}
            height={600}
            alt="Philip Hopf"
            style={{
              objectFit: "cover",
              objectPosition: "center top",
              height: 600,
              width: 480,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
