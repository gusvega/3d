export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    { endpoint: process.env.SPECTRA_BRIDGE_URL || "" },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
