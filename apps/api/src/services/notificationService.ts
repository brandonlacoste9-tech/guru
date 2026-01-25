import { Resend } from "resend";
import webpush from "web-push";

// In a real app, use env vars
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_123456789";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "test_public_key";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "test_private_key";

webpush.setVapidDetails(
  "mailto:admin@floguru.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface PushPayload {
  subscription: webpush.PushSubscription;
  title: string;
  body: string;
  url?: string;
}

export class NotificationService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(RESEND_API_KEY);
  }

  async sendEmail(payload: EmailPayload) {
    if (!process.env.RESEND_API_KEY) {
      console.log(
        `[MOCK EMAIL] To: ${payload.to} | Subject: ${payload.subject}`,
      );
      return { id: "mock-email-id" };
    }

    try {
      const data = await this.resend.emails.send({
        from: "FloGuru <notifications@activeguru.ai>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      return data;
    } catch (error) {
      console.error("Email send failed:", error);
      throw error;
    }
  }

  async sendPush(payload: PushPayload) {
    if (!process.env.VAPID_PRIVATE_KEY) {
      console.log(
        `[MOCK PUSH] Title: ${payload.title} | Body: ${payload.body}`,
      );
      return;
    }

    try {
      await webpush.sendNotification(
        payload.subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url,
          icon: "/icons/icon-192x192.png",
        }),
      );
    } catch (error) {
      console.error("Push notification failed:", error);
      // Don't throw for push, simpler to just log
    }
  }
}

export const notificationService = new NotificationService();
