import { readFile } from "node:fs/promises";

import { requireAdmin } from "@/lib/auth";
import { getProofFilePath } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ proofId: string }> },
) {
  await requireAdmin();
  const { proofId } = await params;
  const filePath = await getProofFilePath(proofId);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await readFile(filePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename="${proofId}"`,
    },
  });
}

