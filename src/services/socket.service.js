export class SocketService {
    constructor(io) {
        this.io = io;
    }

    emitAppointmentUpdate(action, data) {
        try {
            this.io.emit('appointment:update', { action, ...data });
        } catch (err) {
            console.error("Socket emit failed", err);
        }
    }
}
