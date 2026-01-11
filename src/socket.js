import { Server } from "socket.io";
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { CallHistory } from './models/index.js';

let io;


const users = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    // console.log("New client connected", socket.id);

    socket.on("register", (data) => {
        // data: { userId, userInfo }
        if (data?.userId) {
            socket.userId = data.userId;
            socket.join(data.userId);
            
            // Store user
            users.set(data.userId, { 
                userId: data.userId,
                socketId: socket.id, 
                userInfo: data.userInfo, 
                isAvailable: false // Default to false until explicitly set to available
            });
            
            io.emit("online_users", Array.from(users.values()));
        }
    });
    
    // Call Signaling
    socket.on("call_user", async ({ userToCall, signalData, from }) => {
        // userToCall is the userId
        const type = signalData.type || 'audio';
        
        try {
            await CallHistory.create({
                callerId: from,
                receiverId: userToCall,
                status: 'initiated',
                type: type,
                startTime: new Date()
            });
        } catch (e) {
            console.error("Failed to log call init", e);
        }

        io.to(userToCall).emit("call_incoming", { signal: signalData, from });
    });

    socket.on("answer_call", async (data) => {
        // data: { to, signal }
        try {
             // Find the latest initiated call between these users
             // Note: 'to' is the caller (the one who initiated call), socket.userId is receiver (current user)
             // But wait, socket.userId might not be reliable if not set on this specific socket instance for the event?
             // Actually we set socket.userId on register.
             
             const callerId = data.to;
             const receiverId = socket.userId;
             
             const call = await CallHistory.findOne({
                 where: {
                     callerId: callerId,
                     receiverId: receiverId,
                     status: 'initiated'
                 },
                 order: [['startTime', 'DESC']]
             });
             
             if (call) {
                 await call.update({
                     status: 'ongoing',
                     startTime: new Date() // Reset start time to actual talk time? Or keep initiate time. Let's keep initiate.
                     // Actually better to have connectTime? For simple duration, let's just use now as start of conversation if we want duration of TALK.
                     // But typically duration is connect to end.
                     // Let's rely on update logic:
                     // We update startTime to NOW to track duration accurately from pickup.
                     // But we lose "initiate time".
                     // For MVP, updating startTime to now is fine for duration calc.
                 });
                 // We could store it in a map if we needed id for end_call, but standard "latest ongoing" works too.
             }
        } catch (e) {
            console.error("Failed to update call on answer", e);
        }

        io.to(data.to).emit("call_accepted", data.signal);
    });

    socket.on("end_call", async ({ to }) => {
        // 'to' is the other party.
        // We need to find the call where (caller=me AND receiver=to) OR (caller=to AND receiver=me)
        // AND status is 'ongoing' or 'initiated'
        
        const me = socket.userId;
        const other = to;
        
        if (me && other) {
            try {
                // Find active call
                const call = await CallHistory.findOne({
                    where: {
                        status: ['initiated', 'ongoing'],
                        // Check both directions
                        // We need Op.or
                    },
                    // We can't easily do complex Op imports here without refactoring imports.
                    // Let's just query raw or use logic.
                    // Actually let's fetch all active calls involving me
                });
                
                // Better approach with standard Sequelize without Op import if possible?
                // We need Op to do OR condition efficiently.
                // Let's try to update based on specific direction first.
                
                // Try to find call where I am caller
                let targetCall = await CallHistory.findOne({
                     where: { callerId: me, receiverId: other, status: ['initiated', 'ongoing'] },
                     order: [['createdAt', 'DESC']]
                });
                
                if (!targetCall) {
                    // Try where I am receiver
                    targetCall = await CallHistory.findOne({
                         where: { callerId: other, receiverId: me, status: ['initiated', 'ongoing'] },
                         order: [['createdAt', 'DESC']]
                    });
                }
                
                if (targetCall) {
                    const now = new Date();
                    let status = 'completed';
                    if (targetCall.status === 'initiated') {
                        status = (targetCall.callerId === me) ? 'missed' : 'rejected'; 
                        // If I ended it and I was caller -> Missed (cancelled)
                        // If I ended it and I was receiver -> Rejected
                        // Actually 'missed' usually means timed out. 
                        // If Caller hangs up before answer -> 'missed'? or 'cancelled'?
                        // Let's call it 'missed' for simplicity in UI (red arrow).
                    }
                    
                    let duration = 0;
                    if (status === 'completed' && targetCall.startTime) {
                        duration = Math.floor((now - new Date(targetCall.startTime)) / 1000);
                    }
                    
                    await targetCall.update({
                        status: status,
                        endTime: now,
                        duration: duration
                    });
                }
            } catch (e) {
                console.error("Failed to end call log", e);
            }
        }

        io.to(to).emit("call_ended");
    });
    
    // Status update
    socket.on("update_status", ({ userId, status }) => {
        if (users.has(userId)) {
             const user = users.get(userId);
             user.isAvailable = (status === 'available');
             users.set(userId, user);
             io.emit("online_users", Array.from(users.values()));
        }
    });

    // Token Generation
    socket.on("generate_token", ({ channel, userId }) => {
        const APP_ID = "d9335b8490204f1091a05dec6f01947d";
        const APP_CERTIFICATE = "85f93e5fe61b480ba352be4e9c400726";
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Ensure userId is integer if Agora expects int UID, or use buildTokenWithAccount for string
        // We will use buildTokenWithUid and assume userId can be parsed or is int. 
        // If userId is string (UUID), we MUST use buildTokenWithAccount.
        // Let's assume buildTokenWithAccount to be safe as IDs might be strings.
        
        try {
            const token = RtcTokenBuilder.buildTokenWithAccount(
                APP_ID,
                APP_CERTIFICATE,
                channel,
                userId,
                role,
                privilegeExpiredTs
            );
            io.to(socket.id).emit("token_generated", { token, channel });
        } catch (error) {
            console.error("Token generation failed", error);
        }
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected", socket.id);
      if (socket.userId) {
          if (users.has(socket.userId)) {
              users.delete(socket.userId);
              io.emit("online_users", Array.from(users.values()));
          }
      }
    });
  });

  return io;
};



export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
