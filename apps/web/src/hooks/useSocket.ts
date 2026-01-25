import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function useSocket(channelId?: string) {
  const [status, setStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("🔌 Connected to FloGuru Real-time Channel");
      if (channelId) {
        socketInstance.emit("join", channelId);
      }
    });

    socketInstance.on("status_update", (data: any) => {
      if (!channelId || data.runId === channelId) {
        setStatus({ status: data.status, message: data.message });
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [channelId]);

  return { status, socket };
}
