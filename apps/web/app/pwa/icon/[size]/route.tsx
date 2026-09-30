import { ImageResponse } from "next/og";

const allowedSizes = new Set([180, 192, 512]);

export async function GET(
  request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: rawSize } = await context.params;
  const size = Number(rawSize);

  if (!allowedSizes.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  const maskable = new URL(request.url).searchParams.get("maskable") === "1";
  const glyphSize = Math.round(size * (maskable ? 0.46 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b3d2e",
          color: "#c8a45a",
          fontSize: glyphSize,
          fontWeight: 700,
        }}
      >
        G
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}