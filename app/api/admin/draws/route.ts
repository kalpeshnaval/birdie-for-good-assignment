import { requireAdmin } from "@/lib/auth";
import { getAdminSnapshot, runDraw } from "@/lib/store";

export const dynamic = "force-dynamic";

type DrawMode = "random" | "hot" | "cold";

export async function GET() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return Response.json({
    ok: true,
    draws: snapshot.draws,
    analytics: snapshot.analytics,
  });
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = (await request.json().catch(() => ({}))) as {
    mode?: DrawMode;
    publish?: boolean;
  };
  const mode = body.mode ?? "random";
  const publish = Boolean(body.publish);

  if (mode !== "random" && mode !== "hot" && mode !== "cold") {
    return Response.json({ ok: false, message: "Invalid draw mode." }, { status: 400 });
  }

  const draw = await runDraw(mode, publish);
  return Response.json({ ok: true, draw });
}
