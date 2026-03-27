import { appConfig } from "@/lib/config";
import { publishScheduledDraw } from "@/lib/store";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${appConfig.cronSecret}`;
}

async function handle(request: Request) {
  if (!appConfig.cronSecret) {
    return Response.json(
      { ok: false, message: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return Response.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const safeMode = mode === "hot" || mode === "cold" ? mode : "random";
  const result = await publishScheduledDraw(safeMode);

  return Response.json({
    ok: true,
    result,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
