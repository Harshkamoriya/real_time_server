import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectToDB } from '../lib/db.js';

// import messageRoutes from '../routes/messageRoutes.js';
// import conversationRoutes from '../routes/conversationRoutes.js';
// import conversationRoutes from '../routes/conversationRoutes.js'
// Init
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Connect DB
await connectToDB()
// // REST API routes
// app.use('/api/messages', messageRoutes);
// app.use('/api/conversations', conversationRoutes)
// app.use('/api/conversation/findReciever' , conversationRoutes)
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/conversations', conversationRoutes);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
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
    console.log(
      "we are in the if"
    )
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

// Start server
const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
