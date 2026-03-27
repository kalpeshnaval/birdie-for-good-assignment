import { randomUUID } from "node:crypto";

import { requireSubscriber } from "@/lib/auth";
import { createWinnerClaim, saveProofFile } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireSubscriber();
  const formData = await request.formData();
  const file = formData.get("proof");
  const drawId = String(formData.get("drawId") ?? "");

  if (!(file instanceof File) || !drawId || file.size === 0) {
    return Response.json(
      { ok: false, message: "Upload a screenshot before submitting." },
      { status: 400 },
    );
  }

  if (file.size > 5_000_000) {
    return Response.json(
      { ok: false, message: "Proof files must be 5MB or smaller." },
      { status: 400 },
    );
  }

  const proofId = randomUUID();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const proofPath = await saveProofFile(user.id, proofId, file.name, bytes);
  const claim = await createWinnerClaim(user.id, {
    drawId,
    proofId,
    proofPath,
    fileName: file.name,
  });

  return Response.json({
    ok: true,
    claim,
  });
}
