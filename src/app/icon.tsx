import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070b14",
        }}
      >
        <div
          style={{
            width: 36,
            height: 42,
            borderRadius: 8,
            background: "#3B6EF5",
            position: "absolute",
            left: 10,
            top: 12,
          }}
        />
        <div
          style={{
            width: 36,
            height: 42,
            borderRadius: 8,
            background: "#0B1B3A",
            border: "2px solid #c4a35a",
            position: "absolute",
            left: 20,
            top: 8,
          }}
        />
      </div>
    ),
    size
  );
}
