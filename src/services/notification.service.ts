import { Server } from "socket.io";

export class NotificationService {
  private static io: Server | null = null;

  static init(ioInstance: Server) {
    this.io = ioInstance;
    console.log("WebSocket NotificationService initialized.");
  }

  /**
   * Send a real-time event to a specific user (using their user:userId room)
   */
  static sendToUser(userId: string, eventName: string, data: any) {
    if (!this.io) {
      console.warn("NotificationService: socket.io server not initialized.");
      return;
    }
    this.io.to(`user:${userId}`).emit(eventName, data);
    console.log(`Real-time notification emitted to user:${userId} [Event: ${eventName}]`);
  }

  /**
   * Send a real-time event to an entire school (using their school:schoolId room)
   */
  static sendToSchool(schoolId: string, eventName: string, data: any) {
    if (!this.io) {
      console.warn("NotificationService: socket.io server not initialized.");
      return;
    }
    this.io.to(`school:${schoolId}`).emit(eventName, data);
    console.log(`Real-time notification emitted to school:${schoolId} [Event: ${eventName}]`);
  }
}
