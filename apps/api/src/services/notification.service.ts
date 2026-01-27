import { db, guruAutomations } from "@guru/database";

import { eq } from "drizzle-orm";
import { Resend } from "resend";
import webPush from "web-push";

const logger = {
  info: (msg: string) => console.log("[INFO] " + msg),
  warn: (msg: string) => console.warn("[WARN] " + msg),
  error: (msg: string, err?: unknown) => console.error("[ERROR] " + msg, err),
};

interface NotificationPreferences {
  sendStart: boolean;
  sendComplete: boolean;
  sendErrors: boolean;
  channels: string[];
  quietHours?: [number, number] | null;
}

export class NotificationService {
  private resend: Resend | null = null;
  private vapidConfigured = false;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      logger.warn("Resend API key not configured");
    }

    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject =
      process.env.VAPID_SUBJECT || "mailto:admin@floguru.com";
    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.vapidConfigured = true;
    } else {
      logger.warn("VAPID keys not configured");
    }
  }

  async sendGuruNotification(
    guruId: string,
    event: "start" | "complete" | "error",
    payload: { guruName: string; errorMessage?: string },
  ): Promise<void> {
    try {
      const automations = await db
        .select()
        .from(guruAutomations)
        .where(eq(guruAutomations.guruId, guruId))
        .limit(1);

      const automationRow = automations[0];
      if (!automationRow) {
        logger.warn("No automation found for guruId " + guruId);
        return;
      }

      const prefs =
        automationRow.notifications as NotificationPreferences | null;
      if (!prefs) {
        logger.warn("No notification preferences for guruId " + guruId);
        return;
      }

      if (event === "start" && !prefs.sendStart) return;
      if (event === "complete" && !prefs.sendComplete) return;
      if (event === "error" && !prefs.sendErrors) return;

      if (this.isQuietHours(prefs.quietHours ?? null)) {
        logger.info("Quiet hours active - suppressing notification");
        return;
      }

      const channels = prefs.channels || [];
      const promises: Promise<void>[] = [];

      if (channels.includes("email")) {
        promises.push(this.sendEmailNotification(guruId, event, payload));
      }
      if (channels.includes("push") && this.vapidConfigured) {
        promises.push(this.sendPushNotification(guruId, event, payload));
      }

      await Promise.all(promises);
    } catch (err) {
      logger.error("Failed to send notification for guru " + guruId, err);
    }
  }

  private isQuietHours(quietHours: [number, number] | null): boolean {
    if (!quietHours) return false;
    const [startHour, endHour] = quietHours;
    const currentHour = new Date().getHours();

    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    }
    return currentHour >= startHour || currentHour < endHour;
  }

  private async sendEmailNotification(
    guruId: string,
    event: string,
    payload: { guruName: string; errorMessage?: string },
  ): Promise<void> {
    if (!this.resend) {
      logger.warn("Resend not configured, skipping email");
      return;
    }

    const to = process.env.NOTIFICATION_EMAIL;
    if (!to) {
      logger.warn("NOTIFICATION_EMAIL not configured");
      return;
    }

    const subject = this.buildEmailSubject(event, payload.guruName);
    const html = this.buildEmailBody(event, payload);

    try {
      await this.resend.emails.send({
        from: "FloGuru <notifications@floguru.com>",
        to,
        subject,
        html,
      });
      logger.info("Email notification sent for guru " + guruId);
    } catch (err) {
      logger.error("Failed to send email notification", err);
    }
  }

  private buildEmailSubject(event: string, guruName: string): string {
    switch (event) {
      case "start":
        return guruName + " started";
      case "complete":
        return guruName + " completed successfully";
      case "error":
        return guruName + " encountered an error";
      default:
        return guruName + " notification";
    }
  }

  private buildEmailBody(
    event: string,
    payload: { guruName: string; errorMessage?: string },
  ): string {
    const { guruName, errorMessage } = payload;
    let body =
      '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';
    body += '<h1 style="color: #333;">' + guruName + "</h1>";
    body +=
      '<p style="font-size: 18px; color: #666;">Status: <strong>' +
      event.toUpperCase() +
      "</strong></p>";

    if (event === "error" && errorMessage) {
      body +=
        '<div style="background: #fee; border-left: 4px solid #f00; padding: 12px; margin: 16px 0;">';
      body += "<strong>Error:</strong> " + errorMessage;
      body += "</div>";
    }

    if (event === "complete") {
      body +=
        '<div style="background: #efe; border-left: 4px solid #0a0; padding: 12px; margin: 16px 0;">';
      body += "Your Guru completed successfully!";
      body += "</div>";
    }

    body += '<p style="color: #999; font-size: 14px;">';
    body +=
      'Visit your <a href="https://floguru.com/dashboard">dashboard</a> for more details.';
    body += "</p>";
    body +=
      '<hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />';
    body +=
      '<p style="color: #bbb; font-size: 12px;">FloGuru - Your Autonomous AI Assistant</p>';
    body += "</div>";

    return body;
  }

  private async sendPushNotification(
    guruId: string,
    event: string,
    payload: { guruName: string; errorMessage?: string },
  ): Promise<void> {
    if (!this.vapidConfigured) return;

    try {
      // 1. Find the user ID for this guru
      const automations = await db
        .select()
        .from(guruAutomations)
        .where(eq(guruAutomations.guruId, guruId))
        .limit(1);

      const userId = automations[0]?.userId;
      if (!userId) return;

      // 2. Fetch all push subscriptions for this user
      const { pushSubscriptions } = await import("@guru/database");
      const subs = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));

      if (subs.length === 0) {
        logger.info(`No push subscriptions found for user ${userId}`);
        return;
      }

      // 3. Prepare notification payload
      const notificationPayload = JSON.stringify({
        title: this.buildEmailSubject(event, payload.guruName),
        body:
          event === "error"
            ? payload.errorMessage
            : `Your Guru ${payload.guruName} has ${event === "start" ? "started" : "finished"} task.`,
        data: { guruId, event },
      });

      // 4. Send to all endpoints
      const pushPromises = subs.map((sub) =>
        webPush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as any,
            },
            notificationPayload,
          )
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              logger.warn(`Push subscription expired/invalid: ${sub.endpoint}`);
              // Logic to remove dead subscription could go here
            } else {
              logger.error(`Error sending push: ${err.message}`);
            }
          }),
      );

      await Promise.all(pushPromises);
      logger.info(
        `Push notifications sent to ${subs.length} devices for guru ${guruId}`,
      );
    } catch (err) {
      logger.error(`Failed to send push notifications:`, err);
    }
  }
}

export const notificationService = new NotificationService();
