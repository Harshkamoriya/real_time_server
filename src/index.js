import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDB } from '../lib/db.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://chalchitra-frontend2.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error('❌ Not allowed by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Connect DB
await connectToDB();

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log('✅ User connected:', userId);

  if (userId) {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
  }

  // Send message flow
  socket.on('sendMessage', (message) => {
    const receiverId = message.receiver;
    const senderId = message.sender;

    console.log('📩 sendMessage:', message);

    // 1️⃣ Emit to receiver
    if (receiverId) {
      io.to(receiverId).emit('newMessage', message);
    }

    // 2️⃣ Emit back to sender: sent-confirmation
    io.to(senderId).emit('sent-confirmation', { messageId: message._id });

    // 3️⃣ If receiver online → tell sender it's delivered
    if (onlineUsers.has(receiverId)) {
      io.to(senderId).emit('delivered-confirmation', { messageId: message._id });
    }
  });

  // Receiver tells: delivered
  socket.on('delivered', ({ messageId, senderId }) => {
    console.log('✅ delivered event:', messageId);
    io.to(senderId).emit('delivered-confirmation', { messageId });
  });

  // Receiver tells: read
socket.on('mark-seen', async ({ conversationId, receiverId , senderId}) => {
  try {
    // find senderId
   
    console.log("inside mark seen backend server")
    // emit to receiver (confirm)
    socket.to(receiverId.toString()).emit('seen-confirmation', { conversationId });

    // emit to sender
    if (senderId) {
      socket.to(senderId.toString()).emit('seen-confirmation', { conversationId});
    }
  } catch (error) {
    console.error('Error in mark-seen:', error);
  }
});



  // Typing indicator
socket.on('typing', ({ otherUserId }) => {
  const stringUserId = otherUserId?.toString?.() || String(otherUserId);

  console.log("inside backend socket of typing", stringUserId);

  if (stringUserId) {
    console.log("yes user id is there");
    io.to(stringUserId).emit('typing', { otherUserId: stringUserId });
  }
});

socket.on('message-delete', ({ message }) => {
  console.log("inside message delete server");
  const receiverId = message?.receiver?.toString();
  const senderId = message?.sender?.toString();
    io.to(senderId).emit('message-deleted', { messageId: message?._id });

  io.to(receiverId).emit('message-deleted', { messageId: message?._id });
});


  // Notifications
  socket.on('newNotification', (notification) => {
  io.to(notification.userId.toString()).emit('newNotification', notification);
});

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', userId);
    if (userId) onlineUsers.delete(userId);
  });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
