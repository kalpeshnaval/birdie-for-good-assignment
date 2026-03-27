import { requireAdmin } from "@/lib/auth";
import { getProofAsset } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ proofId: string }> },
) {
  await requireAdmin();
  const { proofId } = await params;
  const asset = await getProofAsset(proofId);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(asset.buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename="${asset.fileName}"`,
    },
  });
}
