import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private static io: SocketServer | null = null;

  static init(server: HTTPServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`📡 WebSocket client connected: ${socket.id}`);
      
      socket.on('subscribe', (runId: string) => {
        socket.join(runId);
        console.log(`🔔 Socket ${socket.id} subscribed to run: ${runId}`);
      });

      socket.on('disconnect', () => {
        console.log(`📡 WebSocket client disconnected: ${socket.id}`);
      });
    });

    console.log('📡 WebSocket Service initialized.');
  }

  static emitStatus(runId: string, status: string, message: string, data?: any) {
    if (this.io) {
      this.io.to(runId).emit('automation_status', {
        runId,
        status,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
      // Also emit to a global room for dashboard overviews
      this.io.to('global_monitoring').emit('automation_status', {
        runId,
        status,
        message,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
