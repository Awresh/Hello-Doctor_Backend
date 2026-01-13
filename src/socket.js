import { Server } from "socket.io";
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
// Import Tenant and CallBillingHistory models
import { CallHistory, Tenant, CallBillingHistory, TenantUser } from './models/index.js';

let io;


const users = new Map();
const activeCallsStartTime = new Map(); // Track call start times: key = callerId, value = { startTime, receiverId, callType }
const activeCallPeers = new Map(); // Track peer relationships: key = userId, value = otherUserId

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

                // Get tenantId from userInfo (should be sent from frontend)
                // Fallback to userId if it looks like admin ID (logic handled in frontend)
                // We rely on frontend sending tenantId
                const tenantId = data.userInfo?.tenantId || data.userInfo?.id;

                if (tenantId) {
                    socket.tenantId = tenantId;
                    socket.join(`tenant_${tenantId}`);
                }

                // Store user
                users.set(data.userId, {
                    userId: data.userId,
                    socketId: socket.id,
                    tenantId: tenantId,
                    userInfo: data.userInfo,
                    isAvailable: false // Default to false until explicitly set to available
                });

                // Broadcast ONLY to this tenant's room
                if (tenantId) {
                    const tenantUsers = Array.from(users.values()).filter(u => u.tenantId == tenantId);
                    io.to(`tenant_${tenantId}`).emit("online_users", tenantUsers);
                }
            }
        });

        // Call Signaling
        socket.on("call_user", async ({ userToCall, signalData, from }) => {
            // userToCall is the userId
            const type = signalData.type || 'audio';

            // --- WALLET CHECK ---
            if (socket.tenantId) {
                try {
                    const tenant = await Tenant.findByPk(socket.tenantId);
                    if (!tenant || tenant.walletBalance < 1) { // Min 1 token required to start
                        io.to(from).emit("call_error", { message: "Insufficient wallet balance to make a call." });
                        return; // BLOCK CALL
                    }
                } catch (err) {
                    console.error("Wallet check failed", err);
                }
            }
            // --------------------

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

            // Check if user is already in a call (Busy status)
            if (activeCallPeers.has(userToCall)) {
                console.log(`User ${userToCall} is busy. Notifying caller ${from} and sending call_waiting.`);
                io.to(from).emit("user_busy", { userId: userToCall });
                io.to(userToCall).emit("call_waiting", { from, type });
                // We still emit call_incoming so the user's UI can show it, 
                // but the caller gets the 'busy' signal immediately.
            }

            io.to(userToCall).emit("call_incoming", { signal: signalData, from });
        });

        socket.on("answer_call", async (data) => {
            // data: { to, signal }
            // 'to' is the CALLER (who initiated)
            // socket.userId is the RECEIVER (who answered) 

            const callerId = data.to;
            const receiverId = socket.userId;

            // Get caller's socket/info to find tenantId
            const callerInfo = users.get(callerId);
            const tenantId = callerInfo?.tenantId;

            // Determine call type from database
            let callType = 'audio';

            try {
                const call = await CallHistory.findOne({
                    where: {
                        callerId: callerId,
                        receiverId: receiverId,
                        status: 'initiated'
                    },
                    order: [['startTime', 'DESC']]
                });

                if (call) {
                    callType = call.type;
                    const startTime = new Date();
                    await call.update({
                        status: 'ongoing',
                        startTime: startTime
                    });

                    // Track call start time for billing calculation on end
                    activeCallsStartTime.set(callerId, {
                        startTime: startTime,
                        receiverId: receiverId,
                        callType: callType,
                        tenantId: tenantId
                    });
                }
            } catch (e) {
                console.error("Failed to update call on answer", e);
            }

            // Track peers for disconnect handling
            activeCallPeers.set(callerId, receiverId);
            activeCallPeers.set(receiverId, callerId);

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

                        // --- BILLING LOGIC ---
                        const payerId = targetCall.callerId;

                        // Check if we have billing info for this call
                        if (activeCallsStartTime.has(payerId)) {
                            const callInfo = activeCallsStartTime.get(payerId);
                            const startTime = callInfo.startTime;
                            const durationSeconds = Math.floor((now - startTime) / 1000);
                            const ratePerMinute = callInfo.callType === 'video' ? 2 : 1;

                            // Calculate tokens with decimal precision
                            const tokensDeducted = parseFloat((durationSeconds / 60 * ratePerMinute).toFixed(2));

                            // Deduct from tenant wallet
                            if (callInfo.tenantId && tokensDeducted > 0) {
                                try {
                                    const tenant = await Tenant.findByPk(callInfo.tenantId);
                                    if (tenant && tenant.walletBalance >= tokensDeducted) {
                                        tenant.walletBalance -= tokensDeducted;
                                        await tenant.save();

                                        // Create CallBillingHistory record
                                        await CallBillingHistory.create({
                                            tenantId: callInfo.tenantId,
                                            callerId: payerId,
                                            receiverId: callInfo.receiverId,
                                            callType: callInfo.callType,
                                            duration: durationSeconds,
                                            tokensDeducted: tokensDeducted,
                                            timestamp: now
                                        });
                                    } else if (tenant && tenant.walletBalance < tokensDeducted) {
                                        // Log the discrepancy - call happened but wallet insufficient
                                        console.warn(`Insufficient balance for call billing. Required: ${tokensDeducted}, Available: ${tenant.walletBalance}`);
                                    }
                                } catch (billingError) {
                                    console.error("Billing error:", billingError);
                                }
                            }

                            // Clean up
                            activeCallsStartTime.delete(payerId);
                        }
                        // ---------------------

                        // Clean up peer mapping
                        activeCallPeers.delete(me);
                        activeCallPeers.delete(other);

                        // Notify both parties to refresh history
                        io.to(me).emit("call_history_updated");
                        io.to(other).emit("call_history_updated");
                    }
                } catch (e) {
                    console.error("Failed to end call log", e);
                }
            }

            io.to(to).emit("call_ended");
        });

        // Mute Signaling
        socket.on("toggle_mute", ({ to, isMuted }) => {
            io.to(to).emit("peer_mute_status", { isMuted });
        });

        // Status update
        socket.on("update_status", ({ userId, status }) => {
            if (users.has(userId)) {
                const user = users.get(userId);
                user.isAvailable = (status === 'available');
                users.set(userId, user);

                // Broadcast only to tenant
                if (user.tenantId) {
                    const tenantUsers = Array.from(users.values()).filter(u => u.tenantId == user.tenantId);
                    io.to(`tenant_${user.tenantId}`).emit("online_users", tenantUsers);
                }
            }
        });

        // Token Generation (Unchanged)
        socket.on("generate_token", ({ channel, userId }) => {
            const APP_ID = "d9335b8490204f1091a05dec6f01947d";
            const APP_CERTIFICATE = "85f93e5fe61b480ba352be4e9c400726";
            const role = RtcRole.PUBLISHER;
            const expirationTimeInSeconds = 3600;
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

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
                // If user was in an active call, end it for the other party
                if (activeCallPeers.has(socket.userId)) {
                    const otherPartyId = activeCallPeers.get(socket.userId);
                    console.log(`User ${socket.userId} disconnected during call with ${otherPartyId}. Ending call...`);

                    // Trigger end_call logic programmatically or manually
                    // For simplicity, we can reuse the end_call logic by emitting or calling a shared function.
                    // Here we'll just emit 'call_ended' to the other party and clean up history.
                    // This is handled similarly to the end_call handler.

                    // We need a way to trigger the full end_call logic from here.
                    // Let's refactor end_call into a helper if needed, but for now we'll do the critical bits.

                    io.to(otherPartyId).emit("call_ended");

                    // Cleanup local maps
                    activeCallPeers.delete(socket.userId);
                    activeCallPeers.delete(otherPartyId);
                }

                // Clear call start time tracking if this user was paying for a call
                if (activeCallsStartTime.has(socket.userId)) {
                    activeCallsStartTime.delete(socket.userId);
                }

                if (users.has(socket.userId)) {
                    const user = users.get(socket.userId);
                    const tenantId = user.tenantId;

                    users.delete(socket.userId);

                    if (tenantId) {
                        const tenantUsers = Array.from(users.values()).filter(u => u.tenantId == tenantId);
                        io.to(`tenant_${tenantId}`).emit("online_users", tenantUsers);
                    }
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
