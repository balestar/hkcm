import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b14",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            width: 88,
            height: 104,
            borderRadius: 20,
            background: "#3B6EF5",
            position: "absolute",
            left: 32,
            top: 42,
          }}
        />
        <div
          style={{
            width: 88,
            height: 104,
            borderRadius: 20,
            background: "#0B1B3A",
            border: "5px solid #c4a35a",
            position: "absolute",
            left: 58,
            top: 30,
          }}
        />
      </div>
    ),
    size
  );
}
