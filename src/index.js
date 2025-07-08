import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectToDB } from '../lib/db.js';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const httpServer = createServer(app);

// ✅ Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'https://chalchitra-frontend2.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl / mobile / SSR etc.
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

// ✅ Connect DB
await connectToDB();

// // REST API routes (add later)
// app.use('/api/messages', messageRoutes);
// app.use('/api/conversations', conversationRoutes);

// ✅ Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  console.log('✅ User connected:', userId);

  // Join user's room
  socket.join(userId);

  // Receive & broadcast message
  socket.on('sendMessage', (message) => {
    const receiverId = message.receiver;
    console.log('💥 Emitting newMessage to receiverId:', receiverId);
    if (receiverId) {
      io.to(receiverId).emit('newMessage', message);
    }
  });

  // Receive & broadcast notification
  socket.on('sendNotification', (notification) => {
    const targetUserId = notification.userId;
    if (targetUserId) {
      io.to(targetUserId).emit('newNotification', notification);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', userId);
  });
});

// ✅ Start server
const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
