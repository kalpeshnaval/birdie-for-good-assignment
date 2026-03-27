import { sendHelloWorldEmail } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await sendHelloWorldEmail();

  return Response.json({
    ok: true,
    message: "Hello World email sent through Resend.",
    result,
  });
}
