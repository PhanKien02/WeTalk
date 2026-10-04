import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "WeTalk — Modern Chat App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoData = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 96px",
          background:
            "radial-gradient(circle at 85% 15%, rgba(99,102,241,0.45) 0%, transparent 55%), radial-gradient(circle at 10% 95%, rgba(14,165,233,0.35) 0%, transparent 50%), #0f111a",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 20px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 24,
              color: "#c7d2fe",
              marginBottom: 32,
            }}
          >
            Modern Chat App
          </div>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
            WeTalk
          </div>
          <div
            style={{
              fontSize: 36,
              color: "rgba(255,255,255,0.7)",
              marginTop: 28,
              lineHeight: 1.35,
            }}
          >
            Fast, secure and beautiful messaging for every team.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: 340,
            height: 340,
            borderRadius: 72,
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
            border: "2px solid rgba(255,255,255,0.12)",
            boxShadow: "0 30px 80px rgba(79,70,229,0.45)",
          }}
        >
          <img src={logoSrc} width={340} height={340} alt="" style={{ objectFit: "cover" }} />
        </div>
      </div>
    ),
    size,
  );
}
