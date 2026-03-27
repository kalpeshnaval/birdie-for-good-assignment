import "server-only";

import { Resend } from "resend";

import { appConfig } from "@/lib/config";
import { logError } from "@/lib/logger";

const resend = new Resend(appConfig.resendApiKey ?? "re_xxxxxxxxx");
// Replace `re_xxxxxxxxx` with your real Resend API key, or set RESEND_API_KEY in `.env.local`.

let resendClient: Resend | null = null;

function getResendClient() {
  if (!appConfig.resendApiKey) {
    return null;
  }

  resendClient ??= resend;
  return resendClient;
}

export async function sendPlatformEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendClient = getResendClient();

  if (!resendClient || !appConfig.emailFrom) {
    return { status: "skipped" as const };
  }

  try {
    await resendClient.emails.send({
      from: appConfig.emailFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    return { status: "sent" as const };
  } catch (error) {
    logError("email.send_failed", {
      message: error instanceof Error ? error.message : "Unknown email error",
      to: input.to,
      subject: input.subject,
    });

    return { status: "skipped" as const };
  }
}

export async function sendHelloWorldEmail() {
  if (!appConfig.resendApiKey) {
    throw new Error(
      "Replace `re_xxxxxxxxx` with your real Resend API key, or set RESEND_API_KEY in `.env.local`.",
    );
  }

  return resend.emails.send({
    from: "onboarding@resend.dev",
    to: "kalpeshnaval1998@gmail.com",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });
}
