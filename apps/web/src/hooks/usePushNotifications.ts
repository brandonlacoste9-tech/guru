"use client";

import { useState, useEffect } from "react";
import { urlBase64ToUint8Array } from "@/utils/push";

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
        });
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return;

    try {
      const reg = await navigator.serviceWorker.ready;

      // Get VAPID public key from env or API
      const response = await fetch("/api/notifications/vapid-key");
      const { publicKey } = await response.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription to backend
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      setSubscription(sub);
      setPermission(Notification.permission);
      return sub;
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      throw err;
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();

      // Remove from backend
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setSubscription(null);
    } catch (err) {
      console.error("Failed to unsubscribe from push notifications:", err);
    }
  };

  return {
    subscription,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
  };
}
